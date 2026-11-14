import {Body,Controller,Delete,Get,Param,Patch,Post,Query,Req,UseGuards} from '@nestjs/common';
import {IsDateString,IsIn,IsInt,IsOptional,IsString,MaxLength,Min,MinLength} from 'class-validator';import {Type} from 'class-transformer';
import {SessionGuard} from '../auth/session.guard';import {WorkspaceRoleGuard,WorkspaceRoles} from '../common/roles';import {TasksService} from './tasks.service';
class TaskDto {@IsString() @MinLength(1) @MaxLength(180) title!:string;@IsOptional() @IsString() @MaxLength(5000) description?:string;@IsOptional() @IsIn(['TODO','IN_PROGRESS','IN_REVIEW','DONE']) status?:any;@IsOptional() @IsIn(['LOW','MEDIUM','HIGH','URGENT']) priority?:any;@IsOptional() @IsDateString() dueDate?:string;@IsOptional() @IsDateString() startDate?:string;@IsOptional() @IsString() projectId?:string;@IsOptional() @IsString() parentId?:string;@IsOptional() @IsString() assigneeId?:string;@IsOptional() @Type(()=>Number) @IsInt() @Min(1) estimatedMinutes?:number;}
@UseGuards(SessionGuard,WorkspaceRoleGuard) @Controller('workspaces/:workspaceId/tasks') export class TasksController{constructor(private s:TasksService){}
@WorkspaceRoles('tasks:read') @Get() list(@Req()r:any,@Param('workspaceId')w:string,@Query('q')q?:string,@Query('status')st?:string,@Query('view')v?:string){return this.s.list(r.user.id,w,q,st,v)}
@WorkspaceRoles('tasks:create') @Post() create(@Req()r:any,@Param('workspaceId')w:string,@Body()b:TaskDto){return this.s.create(r.user.id,w,b)}
@WorkspaceRoles('tasks:read') @Get(':id') detail(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string){return this.s.list(r.user.id,w).then(x=>({task:x.tasks.find((t:any)=>t.id===id)}))}
@WorkspaceRoles('tasks:update') @Patch(':id') update(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string,@Body()b:any){return this.s.update(r.user.id,w,id,b)}
@WorkspaceRoles('tasks:delete') @Delete(':id') remove(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string){return this.s.remove(r.user.id,w,id)}
@WorkspaceRoles('tasks:create') @Post(':id/subtasks') subtask(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string,@Body()b:TaskDto){return this.s.subtask(r.user.id,w,id,b)}
@WorkspaceRoles('tasks:update') @Post(':id/dependencies') dependency(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string,@Body()b:any){return this.s.dependency(r.user.id,w,id,b.predecessorId)}
@WorkspaceRoles('tasks:update') @Delete(':id/dependencies/:dependencyId') dependencyDelete(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string,@Param('dependencyId')d:string){return this.s.removeDependency(r.user.id,w,id,d)}
@WorkspaceRoles('tasks:update') @Post(':id/comments') comment(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string,@Body()b:any){return this.s.comment(r.user.id,w,id,b.body)}
}
