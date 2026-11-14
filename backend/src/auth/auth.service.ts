import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

const assertPassword=(password:string)=>{if(Buffer.byteLength(password,'utf8')>72)throw new BadRequestException('Password must be no more than 72 UTF-8 bytes.');};
const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
const token=()=>randomBytes(32).toString('base64url');
const secretKey=()=>{const key=process.env.TOTP_ENCRYPTION_KEY||'';if(!/^[a-f0-9]{64}$/i.test(key))throw new Error('TOTP_ENCRYPTION_KEY must be a 32-byte hex key.');return Buffer.from(key,'hex')};
const encryptSecret=(value:string)=>{const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',secretKey(),iv);const encrypted=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return `${iv.toString('hex')}.${cipher.getAuthTag().toString('hex')}.${encrypted.toString('hex')}`};
const decryptSecret=(value:string)=>{const [iv,tag,data]=value.split('.');const decipher=createDecipheriv('aes-256-gcm',secretKey(),Buffer.from(iv,'hex'));decipher.setAuthTag(Buffer.from(tag,'hex'));return Buffer.concat([decipher.update(Buffer.from(data,'hex')),decipher.final()]).toString('utf8')};
@Injectable()
export class AuthService {
 constructor(private prisma:PrismaService,private mail:MailService,private config:ConfigService){}
 async register(input:{name:string;email:string;password:string}){
  const [signupSetting,maintenanceSetting]=await Promise.all([this.prisma.platformSetting.findUnique({where:{key:'signupEnabled'}}),this.prisma.platformSetting.findUnique({where:{key:'maintenanceMode'}})]);if(maintenanceSetting?.value===true)throw new ForbiddenException('FlowDesk is temporarily in maintenance mode. Please try again later.');if(signupSetting?.value===false)throw new ForbiddenException('New account registration is temporarily disabled.');
  assertPassword(input.password);
  const email=input.email.trim().toLowerCase();if(await this.prisma.user.findUnique({where:{email}}))throw new ConflictException('An account with this email already exists.');
  const user=await this.prisma.user.create({data:{name:input.name.trim(),email,passwordHash:await bcrypt.hash(input.password,12),status:'PENDING_VERIFICATION'}});
  const workspaceSlug=`${input.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,32)||'my-workspace'}-${randomBytes(3).toString('hex')}`;
  const workspace=await this.prisma.workspace.create({data:{name:`${input.name.trim().split(' ')[0]}'s workspace`,slug:workspaceSlug,ownerId:user.id,members:{create:{userId:user.id,role:'OWNER'}}}});
  await this.prisma.auditEvent.create({data:{actorId:user.id,action:'WORKSPACE_CREATED',targetType:'Workspace',targetId:workspace.id,metadata:{source:'registration'}}});
  const verification=token();await this.prisma.emailVerificationToken.create({data:{userId:user.id,tokenHash:hash(verification),expiresAt:new Date(Date.now()+24*60*60*1000)}});
  const url=`${this.config.get('APP_URL')||this.config.get('WEB_ORIGIN')}/verify-email?token=${verification}`;
  await this.mail.send(email,'Verify your FlowDesk email',`Welcome to FlowDesk. Verify your email within 24 hours: ${url}`);
  return {message:'Account created. Check your email for a verification link.'};
 }
 async verifyEmail(raw:string){const record=await this.prisma.emailVerificationToken.findUnique({where:{tokenHash:hash(raw)}});if(!record||record.expiresAt<new Date())throw new BadRequestException('This verification link is invalid or expired.');await this.prisma.$transaction([this.prisma.user.update({where:{id:record.userId},data:{emailVerifiedAt:new Date(),status:'ACTIVE'}}),this.prisma.emailVerificationToken.delete({where:{id:record.id}})]);return {message:'Email verified. You can now sign in.'};}
 async login(input:{email:string;password:string;totpCode?:string;challengeToken?:string},meta:{userAgent?:string;ipAddress?:string}){
  if(Buffer.byteLength(input.password,'utf8')>72)throw new UnauthorizedException('Email or password is incorrect.');
  const user=await this.prisma.user.findUnique({where:{email:input.email.trim().toLowerCase()}});if(!user||!(await bcrypt.compare(input.password,user.passwordHash)))throw new UnauthorizedException('Email or password is incorrect.');
  if(user.status==='SUSPENDED')throw new UnauthorizedException('This account is suspended. Contact support.');if(!user.emailVerifiedAt)throw new UnauthorizedException('Verify your email before signing in.');
  if(user.twoFactorEnabled){if(!input.totpCode||!user.twoFactorSecret||!await this.verifyTwoFactorCode(user.id,input.totpCode,decryptSecret(user.twoFactorSecret)))return {requiresTwoFactor:true,challengeToken:'totp-required',message:'A valid authenticator or recovery code is required.'};}
  const raw=token(),ttl=Number(this.config.get('SESSION_TTL_DAYS')||14),expiresAt=new Date(Date.now()+ttl*86400000);
  const session=await this.prisma.session.create({data:{tokenHash:hash(raw),userId:user.id,expiresAt,userAgent:meta.userAgent?.slice(0,500),ipAddress:meta.ipAddress}});
  return {raw,expiresAt,sessionId:session.id,user:{id:user.id,name:user.name,email:user.email,emailVerified:true,twoFactorEnabled:user.twoFactorEnabled,platformRole:user.platformRole}};
 }
 async verifyTwoFactorCode(userId:string,code:string,secret:string){if(authenticator.check(code,secret))return true;const recovery=await this.prisma.twoFactorRecoveryCode.findUnique({where:{userId_codeHash:{userId,codeHash:hash(code)}}});if(!recovery)return false;await this.prisma.twoFactorRecoveryCode.delete({where:{id:recovery.id}});return true;}
 async me(user:any){return {user:{id:user.id,name:user.name,email:user.email,emailVerified:!!user.emailVerifiedAt,twoFactorEnabled:user.twoFactorEnabled,platformRole:user.platformRole}};}
 async logout(sessionId:string){await this.prisma.session.deleteMany({where:{id:sessionId}});return {message:'Signed out.'};}
 async forgotPassword(emailRaw:string){const user=await this.prisma.user.findUnique({where:{email:emailRaw.trim().toLowerCase()}});if(user){const raw=token();await this.prisma.passwordResetToken.create({data:{userId:user.id,tokenHash:hash(raw),expiresAt:new Date(Date.now()+60*60*1000)}});const url=`${this.config.get('APP_URL')||this.config.get('WEB_ORIGIN')}/reset-password?token=${raw}`;await this.mail.send(user.email,'Reset your FlowDesk password',`Use this link within one hour to reset your password: ${url}`);}return {message:'If an account exists for that address, password-reset instructions have been sent.'};}
 async resetPassword(raw:string,password:string){assertPassword(password);const record=await this.prisma.passwordResetToken.findUnique({where:{tokenHash:hash(raw)}});if(!record||record.usedAt||record.expiresAt<new Date())throw new BadRequestException('This password reset link is invalid or expired.');await this.prisma.$transaction([this.prisma.user.update({where:{id:record.userId},data:{passwordHash:await bcrypt.hash(password,12)}}),this.prisma.passwordResetToken.deleteMany({where:{userId:record.userId}}),this.prisma.session.deleteMany({where:{userId:record.userId}})]);return {message:'Password updated. Sign in with your new password.'};}
 async setup2fa(user:any){const existing=await this.prisma.user.findUnique({where:{id:user.id}});if(existing?.twoFactorEnabled)throw new BadRequestException('Two-factor authentication is already enabled. Verify and disable it before replacing the authenticator.');const secret=authenticator.generateSecret();await this.prisma.user.update({where:{id:user.id},data:{twoFactorSecret:encryptSecret(secret),twoFactorEnabled:false}});return {secret,otpauthUrl:authenticator.keyuri(user.email,'FlowDesk',secret),manualEntryKey:secret};}
 async enable2fa(user:any,code:string){const current=await this.prisma.user.findUnique({where:{id:user.id}});if(!current?.twoFactorSecret||!authenticator.check(code,decryptSecret(current.twoFactorSecret)))throw new BadRequestException('Authenticator code is invalid.');const recoveryCodes=Array.from({length:8},()=>randomBytes(5).toString('hex').toUpperCase());await this.prisma.$transaction([this.prisma.user.update({where:{id:user.id},data:{twoFactorEnabled:true}}),this.prisma.twoFactorRecoveryCode.deleteMany({where:{userId:user.id}}),...recoveryCodes.map(code=>this.prisma.twoFactorRecoveryCode.create({data:{userId:user.id,codeHash:hash(code)}}))]);return {message:'Two-factor authentication enabled. Save these recovery codes securely; they are shown only once.',recoveryCodes};}
 async disable2fa(user:any,code:string){const current=await this.prisma.user.findUnique({where:{id:user.id}});if(!current?.twoFactorSecret||!authenticator.check(code,decryptSecret(current.twoFactorSecret)))throw new BadRequestException('Authenticator code is invalid.');await this.prisma.$transaction([this.prisma.user.update({where:{id:user.id},data:{twoFactorEnabled:false,twoFactorSecret:null}}),this.prisma.twoFactorRecoveryCode.deleteMany({where:{userId:user.id}})]);return {message:'Two-factor authentication disabled.'};}
 async sessions(userId:string){return {sessions:await this.prisma.session.findMany({where:{userId,expiresAt:{gt:new Date()}},select:{id:true,createdAt:true,expiresAt:true,userAgent:true,ipAddress:true},orderBy:{createdAt:'desc'}})};}
 async revokeSession(userId:string,id:string){await this.prisma.session.deleteMany({where:{id,userId}});return {message:'Session revoked.'};}
}
