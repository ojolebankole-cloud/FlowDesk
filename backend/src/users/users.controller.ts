import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength, MinLength, IsUrl } from 'class-validator';
import { SessionGuard } from '../auth/session.guard';
import { UsersService } from './users.service';
class UpdateProfileDto {@IsOptional() @IsString() @MinLength(2) @MaxLength(80) name?:string;@IsOptional() @IsString() @MaxLength(2048) avatarUrl?:string|null;@IsOptional() @IsString() @MaxLength(500) bio?:string|null;@IsOptional() @IsString() @MaxLength(80) timezone?:string|null;}
@UseGuards(SessionGuard) @Controller('users') export class UsersController {constructor(private users:UsersService){} @Get('me') me(@Req() req:any){return this.users.profile(req.user.id)} @Patch('me') update(@Req() req:any,@Body() dto:UpdateProfileDto){return this.users.updateProfile(req.user.id,dto)}}
