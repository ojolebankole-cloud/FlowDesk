import{Body,Controller,Delete,Get,Param,Patch,Post,Query,Req,UseGuards}from'@nestjs/common';import{SessionGuard}from'../auth/session.guard';import{WorkspaceRoleGuard,WorkspaceRoles}from'../common/roles';import{InvoicesService}from'./invoices.service';
@UseGuards(SessionGuard,WorkspaceRoleGuard)@Controller('workspaces/:workspaceId')export class InvoicesController{constructor(private s:InvoicesService){}
@WorkspaceRoles('invoices:read')@Get('invoices')list(@Req()r:any,@Param('workspaceId')w:string,@Query('q')q?:string,@Query('status')st?:string){return this.s.list(r.user.id,w,q,st)}
@WorkspaceRoles('invoices:create')@Post('invoices')create(@Req()r:any,@Param('workspaceId')w:string,@Body()b:any){return this.s.create(r.user.id,w,b)}
@WorkspaceRoles('invoices:update')@Patch('invoices/:id')update(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string,@Body()b:any){return this.s.update(r.user.id,w,id,b)}
@WorkspaceRoles('invoices:read')@Get('invoices/:id')detail(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string){return this.s.detail(r.user.id,w,id)}
@WorkspaceRoles('invoices:update')@Post('invoices/:id/send')send(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string){return this.s.send(r.user.id,w,id)}
@WorkspaceRoles('invoices:update')@Post('invoices/:id/payments')payment(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string,@Body()b:any){return this.s.payment(r.user.id,w,id,b)}
@WorkspaceRoles('invoices:update')@Post('invoices/:id/void')void(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string){return this.s.void(r.user.id,w,id)}
@WorkspaceRoles('expenses:read')@Get('expenses')expenses(@Req()r:any,@Param('workspaceId')w:string){return this.s.expenses(r.user.id,w)}
@WorkspaceRoles('expenses:create')@Post('expenses')expense(@Req()r:any,@Param('workspaceId')w:string,@Body()b:any){return this.s.addExpense(r.user.id,w,b)}
@WorkspaceRoles('expenses:create')@Delete('expenses/:id')removeExpense(@Req()r:any,@Param('workspaceId')w:string,@Param('id')id:string){return this.s.removeExpense(r.user.id,w,id)}
@WorkspaceRoles('invoices:read')@Get('financial-report')report(@Req()r:any,@Param('workspaceId')w:string,@Query('from')f?:string,@Query('to')t?:string){return this.s.report(r.user.id,w,f,t)}
}
