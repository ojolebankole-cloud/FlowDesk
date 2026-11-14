import { Body, Controller, Get, Patch, Query, Param, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard';
import { AdminService } from './admin.service';
@UseGuards(SessionGuard) @Controller('admin') export class AdminController {constructor(private service:AdminService){} private guard(req:any,superOnly=false){const role=req.user?.platformRole;if(!['ADMIN','SUPER_ADMIN','SUPPORT'].includes(role))throw new ForbiddenException('Platform administrator access required.');if(superOnly&&role!=='SUPER_ADMIN')throw new ForbiddenException('Super administrator access required.');}
 @Get('billing') billing(@Req() r:any){this.guard(r);return this.service.billingOverview()}
 @Get('overview') overview(@Req() r:any){this.guard(r);return this.service.overview()}
 @Get('users') users(@Req() r:any,@Query('q') q='',@Query('page') page='1',@Query('limit') limit='25'){this.guard(r);return this.service.listUsers(q,Number(page),Number(limit))}
 @Patch('users/:id') updateUser(@Req() r:any,@Param('id') id:string,@Body() body:any){this.guard(r);return this.service.updateUser(r.user,r.user.id,id,body)}
 @Get('workspaces') workspaces(@Req() r:any,@Query('q') q='',@Query('page') page='1',@Query('limit') limit='25'){this.guard(r);return this.service.listWorkspaces(q,Number(page),Number(limit))}
 @Patch('workspaces/:id') updateWorkspace(@Req() r:any,@Param('id') id:string,@Body() body:any){this.guard(r);return this.service.updateWorkspace(r.user,r.user.id,id,body)}
 @Get('settings') settings(@Req() r:any){this.guard(r);return this.service.getSettings()}
 @Patch('settings') updateSettings(@Req() r:any,@Body() body:any){this.guard(r,true);return this.service.updateSettings(r.user,r.user.id,body)}
 @Get('audit') audit(@Req() r:any,@Query('page') page='1',@Query('limit') limit='50'){this.guard(r);return this.service.auditLog(Number(page),Number(limit))}
}
