import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class MailService {
 private readonly logger=new Logger(MailService.name);
 constructor(private config:ConfigService,private prisma:PrismaService){}
 async send(to:string,subject:string,text:string){
  const emailSetting=await this.prisma.platformSetting.findUnique({where:{key:'emailEnabled'}});if(emailSetting?.value===false){this.logger.warn('Email delivery is disabled by platform configuration.');return;}
  const host=this.config.get<string>('SMTP_HOST');
  if(!host){if(this.config.get('NODE_ENV')==='production')throw new Error('Email delivery is not configured.');this.logger.warn(`Development email for ${to}: ${subject}\n${text}`);return;}
  const transporter=nodemailer.createTransport({host,port:Number(this.config.get('SMTP_PORT')||587),secure:this.config.get('SMTP_SECURE')==='true',auth:this.config.get('SMTP_USER')?{user:this.config.get('SMTP_USER'),pass:this.config.get('SMTP_PASSWORD')}:undefined});
  await transporter.sendMail({from:this.config.get('SMTP_FROM'),to,subject,text});
 }
}
