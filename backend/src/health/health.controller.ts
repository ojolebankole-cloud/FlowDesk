import { Controller, Get, ServiceUnavailableException, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService, private config: ConfigService) {}
  @Get('live') live() { return { status: 'ok', timestamp: new Date().toISOString() }; }
  @Get() async health() { await this.prisma.$queryRaw`SELECT 1`; return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() }; }
  @Get('ready') async ready() {
    const checks: Record<string,string> = {};
    try { await this.prisma.$queryRaw`SELECT 1`; checks.database = 'ok'; } catch { checks.database = 'error'; }
    const redisUrl=this.config.get<string>('REDIS_URL');
    if(redisUrl){const redis=new Redis(redisUrl,{lazyConnect:true,maxRetriesPerRequest:1,connectTimeout:2500});try{await redis.connect();await redis.ping();checks.redis='ok';}catch{checks.redis='error';}finally{redis.disconnect();}}else checks.redis=this.config.get('NODE_ENV')==='production'?'missing':'development-only';
    const bucket=this.config.get<string>('S3_BUCKET');
    if(bucket){const s3=new S3Client({region:this.config.get('S3_REGION')||'us-east-1',endpoint:this.config.get('S3_ENDPOINT')||undefined,forcePathStyle:!!this.config.get('S3_ENDPOINT'),credentials:this.config.get('S3_ACCESS_KEY_ID')?{accessKeyId:this.config.get('S3_ACCESS_KEY_ID')!,secretAccessKey:this.config.get('S3_SECRET_ACCESS_KEY')||''}:undefined});try{await s3.send(new HeadBucketCommand({Bucket:bucket}));checks.objectStorage='ok';}catch{checks.objectStorage='error';}finally{s3.destroy();}}else checks.objectStorage=this.config.get('NODE_ENV')==='production'?'missing':'local-development';
    const failed=Object.values(checks).some(v=>v==='error'||v==='missing');
    if(failed)throw new ServiceUnavailableException({status:'not_ready',checks});
    return {status:'ready',checks,timestamp:new Date().toISOString()};
  }
  @Get('metrics') metrics(@Req() req:any,@Res() res:any) {
    const expected=this.config.get<string>('METRICS_TOKEN')||'';const auth=String(req.headers.authorization||'');const supplied=auth.startsWith('Bearer ')?auth.slice(7):'';
    if(!expected||supplied.length!==expected.length||!timingSafeEqual(Buffer.from(supplied),Buffer.from(expected))){res.status(404).send('not found');return;}
    const m=process.memoryUsage();const body=[`flowdesk_process_uptime_seconds ${process.uptime()}`,`flowdesk_process_resident_memory_bytes ${m.rss}`,`flowdesk_process_heap_used_bytes ${m.heapUsed}`,`flowdesk_process_heap_total_bytes ${m.heapTotal}`].join('\n')+'\n';res.type('text/plain; version=0.0.4').send(body);
  }
}
