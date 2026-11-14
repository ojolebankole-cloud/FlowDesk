import{Body,Controller,Delete,Get,Param,Patch,Post,Query,Req,UseGuards}from'@nestjs/common';import{SessionGuard}from'../auth/session.guard';import{WorkspaceRoleGuard,WorkspaceRoles}from'../common/roles';import{CustomersService}from'./customers.service';
@UseGuards(SessionGuard,WorkspaceRoleGuard)@Controller('workspaces/:workspaceId/customers')export class CustomersController{constructor(private s:CustomersService){}
@WorkspaceRoles('customers:read')@Get()list(@Req()r:any,@Param('workspaceId')w:string,@Query('q')q?:string,@Query('category')c?:string){return this.s.list(r.user.id,w,q,c)}
@WorkspaceRoles('customers:create')@Post()create(@Req()r:any,@Param('workspaceId')w:string,@Body()b:any){return this.s.create(r.user.id,w,b)}
@WorkspaceRoles('customers:read')@Get(':id/history')history(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string){return this.s.history(r.user.id,w,id)}
@WorkspaceRoles('customers:update')@Post(':id/notes')note(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string,@Body()b:any){return this.s.addNote(r.user.id,w,id,b.body)}
@WorkspaceRoles('customers:update')@Post(':id/activities')activity(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string,@Body()b:any){return this.s.addActivity(r.user.id,w,id,b)}
@WorkspaceRoles('customers:update')@Patch(':id')update(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string,@Body()b:any){return this.s.update(r.user.id,w,id,b)}
@WorkspaceRoles('customers:delete')@Delete(':id')remove(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string){return this.s.remove(r.user.id,w,id)}
}
