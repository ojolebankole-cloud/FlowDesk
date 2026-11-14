import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class UsersService {
 constructor(private prisma:PrismaService){}
 async profile(userId:string){const user=await this.prisma.user.findUnique({where:{id:userId},select:{id:true,name:true,email:true,avatarUrl:true,bio:true,timezone:true,createdAt:true,emailVerifiedAt:true,twoFactorEnabled:true}});if(!user)throw new NotFoundException('User not found.');return {user};}
 async updateProfile(userId:string,input:{name?:string;avatarUrl?:string|null;bio?:string|null;timezone?:string|null}){if(input.name!==undefined&&input.name.trim().length<2)throw new BadRequestException('Name must contain at least two characters.');if(input.avatarUrl&&(!/^https:\/\//i.test(input.avatarUrl)||input.avatarUrl.length>2048))throw new BadRequestException('Avatar URL must be a valid HTTPS URL.');const user=await this.prisma.user.update({where:{id:userId},data:{...input,name:input.name?.trim()},select:{id:true,name:true,email:true,avatarUrl:true,bio:true,timezone:true,createdAt:true}});return {user};}
}
