import { Body, Controller, Get, Param, Patch, Post, Delete, Req, UseGuards } from '@nestjs/common';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SessionGuard } from '../auth/session.guard';
import { WorkspaceRoleGuard, WorkspaceRoles } from '../common/roles';
import { WorkspacesService } from './workspaces.service';
class CreateWorkspaceDto {@IsString() @MinLength(2) @MaxLength(80) name!:string;@IsOptional() @IsString() @MaxLength(500) description?:string;}
class UpdateWorkspaceDto {@IsOptional() @IsString() @MinLength(2) @MaxLength(80) name?:string;@IsOptional() @IsString() @MaxLength(500) description?:string|null;@IsOptional() @IsString() @MaxLength(2048) logoUrl?:string|null;}
class InviteDto {@IsEmail() email!:string;@IsIn(['ADMIN','MANAGER','MEMBER','VIEWER']) role!:'ADMIN'|'MANAGER'|'MEMBER'|'VIEWER';}
class AcceptDto {@IsString() token!:string;}
class RoleDto {@IsIn(['ADMIN','MANAGER','MEMBER','VIEWER']) role!:'ADMIN'|'MANAGER'|'MEMBER'|'VIEWER';}
@UseGuards(SessionGuard,WorkspaceRoleGuard) @Controller('workspaces') export class WorkspacesController {
 constructor(private workspaces:WorkspacesService){}
 @Get() list(@Req() req:any){return this.workspaces.list(req.user.id)}
 @Post() create(@Req() req:any,@Body() dto:CreateWorkspaceDto){return this.workspaces.create(req.user.id,dto)}
 @Post('invitations/accept') accept(@Req() req:any,@Body() dto:AcceptDto){return this.workspaces.accept(req.user.id,dto.token)}
 @WorkspaceRoles('workspace:read') @Get(':workspaceId') get(@Req() req:any,@Param('workspaceId') id:string){return this.workspaces.get(req.user.id,id)}
 @WorkspaceRoles('workspace:update') @Patch(':workspaceId') update(@Req() req:any,@Param('workspaceId') id:string,@Body() dto:UpdateWorkspaceDto){return this.workspaces.update(req.user.id,id,dto)}
 @WorkspaceRoles('members:read') @Get(':workspaceId/members') members(@Req() req:any,@Param('workspaceId') id:string){return this.workspaces.members(req.user.id,id)}
 @WorkspaceRoles('members:manage') @Get(':workspaceId/invitations') invitations(@Req() req:any,@Param('workspaceId') id:string){return this.workspaces.invitations(req.user.id,id)}
 @WorkspaceRoles('members:manage') @Delete(':workspaceId/invitations/:invitationId') revokeInvitation(@Req() req:any,@Param('workspaceId') id:string,@Param('invitationId') invitationId:string){return this.workspaces.revokeInvitation(req.user.id,id,invitationId)}
 @WorkspaceRoles('members:invite') @Post(':workspaceId/invitations') invite(@Req() req:any,@Param('workspaceId') id:string,@Body() dto:InviteDto){return this.workspaces.invite(req.user.id,id,dto.email,dto.role)}
 @WorkspaceRoles('members:manage') @Patch(':workspaceId/members/:memberId/role') role(@Req() req:any,@Param('workspaceId') id:string,@Param('memberId') memberId:string,@Body() dto:RoleDto){return this.workspaces.setRole(req.user.id,id,memberId,dto.role)}
 @WorkspaceRoles('members:manage') @Delete(':workspaceId/members/:memberId') remove(@Req() req:any,@Param('workspaceId') id:string,@Param('memberId') memberId:string){return this.workspaces.removeMember(req.user.id,id,memberId)}
}
