import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { createRedisRateLimitMiddleware } from './redis-rate-limit.middleware';
import { loadSecretFiles } from './secret-files';
async function bootstrap(){
 loadSecretFiles();
 const app=await NestFactory.create(AppModule,{logger:['error','warn','log'],rawBody:true});const config=app.get(ConfigService);
 app.setGlobalPrefix('api/v1');
 app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],baseUri:["'self'"],frameAncestors:["'none'"],objectSrc:["'none'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],imgSrc:["'self'",'data:','https:'],connectSrc:["'self'",...((config.get<string>('WEB_ORIGIN')||'').split(',').map(v=>v.trim()).filter(Boolean))],upgradeInsecureRequests:config.get('NODE_ENV')==='production'?[]:null}},crossOriginEmbedderPolicy:false}));
 app.use(cookieParser());
 app.disable('x-powered-by');
 app.set('trust proxy', config.get('TRUST_PROXY') === 'true' ? 1 : false);
 app.use(createRedisRateLimitMiddleware(config.get<string>('REDIS_URL'),config.get('NODE_ENV')==='production'));
 const allowedOrigins=(config.get<string>('WEB_ORIGIN')||'http://localhost:5173').split(',').map(v=>v.trim());
 app.use((req,res,next)=>{
  const unsafe=['POST','PUT','PATCH','DELETE'].includes(req.method);
  const origin=req.headers.origin;
  if(unsafe){
   if(origin&&!allowedOrigins.includes(origin)){res.status(403).json({statusCode:403,message:'Untrusted request origin.'});return;}
   const sessionCookie=req.cookies?.[config.get<string>('COOKIE_NAME')||(config.get('NODE_ENV')==='production'?'__Host-flowdesk_session':'flowdesk_session')];
   if(sessionCookie){
    const csrfCookie=req.cookies?.flowdesk_csrf;const csrfHeader=req.headers['x-csrf-token'];
    if(!csrfCookie||typeof csrfHeader!=='string'||csrfCookie.length!==csrfHeader.length||!timingSafeEqual(Buffer.from(csrfCookie),Buffer.from(csrfHeader))){res.status(403).json({statusCode:403,message:'CSRF validation failed.'});return;}
   }
   if(config.get('NODE_ENV')==='production'&&!origin){let refererOrigin='';try{refererOrigin=new URL(String(req.headers.referer||'')).origin}catch{}if(!refererOrigin||!allowedOrigins.includes(refererOrigin)){res.status(403).json({statusCode:403,message:'A trusted request origin is required.'});return;}}
  }
  if(req.path?.includes('/auth/login')&&req.method==='POST'){res.setHeader('Cache-Control','no-store');}
  next();
 });
 app.enableCors({origin:allowedOrigins,credentials:true,methods:['GET','POST','PATCH','PUT','DELETE','OPTIONS'],allowedHeaders:['Content-Type','Authorization','X-CSRF-Token'],maxAge:600});
 app.useGlobalPipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true}));
 app.use((req,res,next)=>{res.setHeader('Cache-Control', 'no-store');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');next();});
 const port=Number(config.get('PORT')||4000);await app.listen(port,'0.0.0.0');
}
void bootstrap();
