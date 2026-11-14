import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, MaxLength, Min, Max, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { SessionGuard } from '../auth/session.guard';
import { WorkspaceRoleGuard, WorkspaceRoles } from '../common/roles';
import { ProjectsService } from './projects.service';
class ProjectDto {@IsString() @MinLength(2) @MaxLength(120) name!:string;@IsOptional() @IsString() @MaxLength(5000) description?:string;@IsOptional() @IsIn(['PLANNING','ACTIVE','ON_HOLD','COMPLETED']) status?:any;@IsOptional() @IsIn(['LOW','MEDIUM','HIGH','URGENT']) priority?:any;@IsOptional() @IsDateString() startDate?:string;@IsOptional() @IsDateString() dueDate?:string;@IsOptional() @Type(()=>Number) @IsNumber() @Min(0) budget?:number;@IsOptional() @IsString() @MaxLength(3) currency?:string;@IsOptional() @Type(()=>Number) @IsNumber() @Min(0) @Max(100) progress?:number;@IsOptional() @IsString() assigneeId?:string|null;@IsOptional() @IsString() customerId?:string|null;}
class UpdateProjectDto {@IsOptional() @IsString() @MinLength(2) @MaxLength(120) name?:string;@IsOptional() @IsString() @MaxLength(5000) description?:string|null;@IsOptional() @IsIn(['PLANNING','ACTIVE','ON_HOLD','COMPLETED','ARCHIVED']) status?:any;@IsOptional() @IsIn(['LOW','MEDIUM','HIGH','URGENT']) priority?:any;@IsOptional() @IsDateString() startDate?:string|null;@IsOptional() @IsDateString() dueDate?:string|null;@IsOptional() @Type(()=>Number) @IsNumber() @Min(0) budget?:number|null;@IsOptional() @IsString() currency?:string;@IsOptional() @Type(()=>Number) @IsNumber() @Min(0) @Max(100) progress?:number;@IsOptional() @IsString() assigneeId?:string|null;@IsOptional() @IsString() customerId?:string|null;}
class MilestoneDto {@IsString() @MinLength(2) @MaxLength(160) title!:string;@IsOptional() @IsString() @MaxLength(2000) description?:string;@IsOptional() @IsDateString() dueDate?:string;}
@UseGuards(SessionGuard,WorkspaceRoleGuard) @Controller('workspaces/:workspaceId/projects') export class ProjectsController {
 constructor(private projects:ProjectsService){}
 @WorkspaceRoles('projects:read') @Get() list(@Req() req:any,@Param('workspaceId') ws:string,@Query('q') q?:string){return this.projects.list(req.user.id,ws,q)}
 @WorkspaceRoles('projects:create') @Post() create(@Req() req:any,@Param('workspaceId') ws:string,@Body() dto:ProjectDto){return this.projects.create(req.user.id,ws,dto)}
 @WorkspaceRoles('projects:read') @Get(':projectId') detail(@Req() req:any,@Param('workspaceId') ws:string,@Param('projectId') id:string){return this.projects.detail(req.user.id,ws,id)}
 @WorkspaceRoles('projects:update') @Patch(':projectId') update(@Req() req:any,@Param('workspaceId') ws:string,@Param('projectId') id:string,@Body() dto:UpdateProjectDto){return this.projects.update(req.user.id,ws,id,dto)}
 @WorkspaceRoles('projects:update') @Post(':projectId/archive') archive(@Req() req:any,@Param('workspaceId') ws:string,@Param('projectId') id:string){return this.projects.archive(req.user.id,ws,id)}
 @WorkspaceRoles('projects:delete') @Delete(':projectId') delete(@Req() req:any,@Param('workspaceId') ws:string,@Param('projectId') id:string){return this.projects.delete(req.user.id,ws,id)}
 @WorkspaceRoles('projects:update') @Post(':projectId/milestones') milestone(@Req() req:any,@Param('workspaceId') ws:string,@Param('projectId') id:string,@Body() dto:MilestoneDto){return this.projects.addMilestone(req.user.id,ws,id,dto)}
 @WorkspaceRoles('projects:update') @Post(':projectId/milestones/:milestoneId/complete') complete(@Req() req:any,@Param('workspaceId') ws:string,@Param('projectId') id:string,@Param('milestoneId') mid:string){return this.projects.completeMilestone(req.user.id,ws,id,mid)}
}
