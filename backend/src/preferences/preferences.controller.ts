import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard';
import { PreferencesService } from './preferences.service';
@UseGuards(SessionGuard) @Controller('users/me/preferences') export class PreferencesController {constructor(private service:PreferencesService){} @Get() get(@Req() req:any){return this.service.get(req.user.id)} @Patch() update(@Req() req:any,@Body() body:any){return this.service.update(req.user.id,body)}}
