import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class PreferencesService {
 constructor(private prisma:PrismaService){}
 async get(userId:string){let preferences=await this.prisma.userPreference.findUnique({where:{userId}});if(!preferences)preferences=await this.prisma.userPreference.create({data:{userId}});return {preferences};}
 async update(userId:string,input:any){const allowed=['theme','locale','dateFormat','weekStartsOn','compactMode','emailDigest','productUpdates'];const data:any={};for(const k of allowed)if(input[k]!==undefined)data[k]=input[k];if(data.theme&&!['light','dark','system'].includes(data.theme))throw new BadRequestException('Theme must be light, dark or system.');if(data.weekStartsOn!==undefined&&![0,1].includes(data.weekStartsOn))throw new BadRequestException('Week start must be Sunday (0) or Monday (1).');if(data.emailDigest&&!['off','daily','weekly'].includes(data.emailDigest))throw new BadRequestException('Email digest must be off, daily or weekly.');if(data.locale&& !/^[a-z]{2}(-[A-Z]{2})?$/.test(data.locale))throw new BadRequestException('Locale format is invalid.');return {preferences:await this.prisma.userPreference.upsert({where:{userId},create:{userId,...data},update:data})};}
}
