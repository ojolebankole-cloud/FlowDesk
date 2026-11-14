import { randomBytes } from 'crypto';
import { Body, Controller, Delete, Get, Post, Req, Res, UseGuards, Param } from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { EmailDto, LoginDto, RegisterDto, ResetPasswordDto, TokenDto, TotpDto } from './auth.dto';
import { SessionGuard } from './session.guard';
@Controller('auth')
export class AuthController {
 constructor(private auth:AuthService){}
 private cookie(res:Response,raw:string,expires:Date){const secure=process.env.NODE_ENV==='production';res.cookie(process.env.COOKIE_NAME||(process.env.NODE_ENV==='production'?'__Host-flowdesk_session':'flowdesk_session'),raw,{httpOnly:true,secure,sameSite:'lax',path:'/',expires});res.cookie('flowdesk_csrf',randomBytes(32).toString('base64url'),{httpOnly:false,secure,sameSite:'lax',path:'/',expires});}
 @Throttle({default:{limit:5,ttl:60000}}) @Post('register') register(@Body() dto:RegisterDto){return this.auth.register(dto)}
 @Throttle({default:{limit:5,ttl:60000}}) @Post('verify-email') verify(@Body() dto:TokenDto){return this.auth.verifyEmail(dto.token)}
 @Throttle({default:{limit:5,ttl:60000}}) @Post('login') async login(@Body() dto:LoginDto,@Req() req:Request,@Res({passthrough:true}) res:Response){const result=await this.auth.login(dto,{userAgent:req.get('user-agent'),ipAddress:req.ip});if('raw' in result && result.raw && result.expiresAt){this.cookie(res,result.raw,result.expiresAt);return {user:result.user};}return result;}
 @Throttle({default:{limit:5,ttl:60000}}) @Post('forgot-password') forgot(@Body() dto:EmailDto){return this.auth.forgotPassword(dto.email)}
 @Throttle({default:{limit:5,ttl:60000}}) @Post('reset-password') reset(@Body() dto:ResetPasswordDto){return this.auth.resetPassword(dto.token,dto.password)}
 @UseGuards(SessionGuard) @Get('me') me(@Req() req:any){return this.auth.me(req.user)}
 @UseGuards(SessionGuard) @Post('logout') async logout(@Req() req:any,@Res({passthrough:true}) res:Response){res.clearCookie(process.env.COOKIE_NAME||(process.env.NODE_ENV==='production'?'__Host-flowdesk_session':'flowdesk_session'),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'});res.clearCookie('flowdesk_csrf',{httpOnly:false,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'});return this.auth.logout(req.session.id)}
 @UseGuards(SessionGuard) @Post('2fa/setup') setup(@Req() req:any){return this.auth.setup2fa(req.user)}
 @UseGuards(SessionGuard) @Post('2fa/enable') enable(@Req() req:any,@Body() dto:TotpDto){return this.auth.enable2fa(req.user,dto.code)}
 @UseGuards(SessionGuard) @Post('2fa/disable') disable(@Req() req:any,@Body() dto:TotpDto){return this.auth.disable2fa(req.user,dto.code)}
 @UseGuards(SessionGuard) @Get('sessions') sessions(@Req() req:any){return this.auth.sessions(req.user.id)}
 @UseGuards(SessionGuard) @Delete('sessions/:id') revoke(@Req() req:any,@Param('id') id:string){return this.auth.revokeSession(req.user.id,id)}
}
