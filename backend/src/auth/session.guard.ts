import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class SessionGuard implements CanActivate {
 constructor(private prisma:PrismaService){}
 async canActivate(context:ExecutionContext){
  const req=context.switchToHttp().getRequest();const raw=req.cookies?.[process.env.COOKIE_NAME||(process.env.NODE_ENV==='production'?'__Host-flowdesk_session':'flowdesk_session')];
  if(!raw)throw new UnauthorizedException('Please sign in.');
  const tokenHash=createHash('sha256').update(raw).digest('hex');
  const session=await this.prisma.session.findUnique({where:{tokenHash},include:{user:{select:{id:true,name:true,email:true,emailVerifiedAt:true,status:true,platformRole:true,twoFactorEnabled:true}}}});
  if(!session||session.expiresAt<=new Date()||session.user.status!=='ACTIVE'){if(session)await this.prisma.session.delete({where:{id:session.id}}).catch(()=>{});throw new UnauthorizedException('Your session has expired. Please sign in again.');}
  const [maintenance,message]=await Promise.all([this.prisma.platformSetting.findUnique({where:{key:'maintenanceMode'}}),this.prisma.platformSetting.findUnique({where:{key:'maintenanceMessage'}})]);if(maintenance?.value===true&&!['ADMIN','SUPER_ADMIN'].includes(session.user.platformRole)&&!req.path?.includes('/health'))throw new ServiceUnavailableException(typeof message?.value==='string'&&message.value.trim()?message.value:'FlowDesk is temporarily in maintenance mode. Please try again later.');req.user=session.user;req.session=session;
  await this.prisma.session.update({where:{id:session.id},data:{lastUsedAt:new Date()}});
  return true;
 }
}
