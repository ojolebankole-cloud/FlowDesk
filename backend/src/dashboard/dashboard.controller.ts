import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard';
import { WorkspaceRoleGuard, WorkspaceRoles } from '../common/roles';
import { DashboardService } from './dashboard.service';
@UseGuards(SessionGuard,WorkspaceRoleGuard) @Controller('workspaces/:workspaceId/dashboard') export class DashboardController {constructor(private dashboard:DashboardService){} @WorkspaceRoles('dashboard:read') @Get('overview') overview(@Req() req:any,@Param('workspaceId') ws:string,@Query('from') from?:string,@Query('to') to?:string){return this.dashboard.overview(req.user.id,ws,from,to)}}
