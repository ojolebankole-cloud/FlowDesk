import{Body,Controller,Delete,Get,Param,Patch,Post,Query,Req,UseGuards}from'@nestjs/common';import{SessionGuard}from'../auth/session.guard';import{WorkspaceRoleGuard,WorkspaceRoles}from'../common/roles';import{CalendarService}from'./calendar.service';
@UseGuards(SessionGuard,WorkspaceRoleGuard)@Controller('workspaces/:workspaceId')export class CalendarController{constructor(private s:CalendarService){}
@WorkspaceRoles('calendar:read')@Get('calendar/events')list(@Req()r:any,@Param('workspaceId')w:string,@Query('from')f?:string,@Query('to')t?:string){return this.s.list(r.user.id,w,f,t)}
@WorkspaceRoles('calendar:create')@Post('calendar/events')create(@Req()r:any,@Param('workspaceId')w:string,@Body()b:any){return this.s.create(r.user.id,w,b)}
@WorkspaceRoles('calendar:update')@Patch('calendar/events/:id')update(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string,@Body()b:any){return this.s.update(r.user.id,w,id,b)}
@WorkspaceRoles('calendar:delete')@Delete('calendar/events/:id')remove(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string){return this.s.remove(r.user.id,w,id)}
@WorkspaceRoles('notifications:read')@Get('notifications')notifications(@Req()r:any,@Param('workspaceId')w:string){return this.s.notifications(r.user.id,w)}
@WorkspaceRoles('notifications:read')@Post('notifications/:id/read')read(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string){return this.s.readNotification(r.user.id,w,id)}
}
