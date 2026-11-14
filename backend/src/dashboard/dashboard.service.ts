import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
@Injectable() export class DashboardService {
 constructor(private prisma:PrismaService,private workspaces:WorkspacesService){}
 async overview(userId:string,workspaceId:string,fromRaw?:string,toRaw?:string){await this.workspaces.requireMember(userId,workspaceId);const now=new Date();const from=fromRaw?new Date(fromRaw):new Date(now.getFullYear(),now.getMonth(),1);const to=toRaw?new Date(toRaw):new Date(now.getFullYear(),now.getMonth()+1,1);if(isNaN(from.getTime())||isNaN(to.getTime())||from>=to)throw new BadRequestException('Invalid dashboard date range.');const [projects,tasks,paidInvoices,allInvoices,customers,events,recentProjects,recentActivity]=await Promise.all([
 this.prisma.project.count({where:{workspaceId,archivedAt:null,status:'ACTIVE'}}),
 this.prisma.task.groupBy({by:['status'],where:{workspaceId,createdAt:{gte:from,lt:to}},_count:{_all:true}}),
 this.prisma.invoice.groupBy({by:['currency'],where:{workspaceId,status:'PAID',paidAt:{gte:from,lt:to}},_sum:{amount:true},_count:{_all:true}}),
 this.prisma.invoice.groupBy({by:['currency'],where:{workspaceId,status:{in:['SENT','OVERDUE','PARTIALLY_PAID']}},_sum:{amount:true},_count:{_all:true}}),
 this.prisma.customer.count({where:{workspaceId,createdAt:{gte:from,lt:to}}}),
 this.prisma.calendarEvent.findMany({where:{workspaceId,startsAt:{gte:now}},orderBy:{startsAt:'asc'},take:5}),
 this.prisma.project.findMany({where:{workspaceId,archivedAt:null},orderBy:{updatedAt:'desc'},take:5,select:{id:true,name:true,status:true,progress:true,dueDate:true,updatedAt:true}}),
 this.prisma.projectActivity.findMany({where:{project:{workspaceId}},include:{project:{select:{id:true,name:true}}},orderBy:{createdAt:'desc'},take:6})
 ]);
 const taskCounts={TODO:0,IN_PROGRESS:0,IN_REVIEW:0,DONE:0};for(const row of tasks)taskCounts[row.status]=row._count._all;
 const paidCount=paidInvoices.reduce((sum,row)=>sum+row._count._all,0);const outstandingCount=allInvoices.reduce((sum,row)=>sum+row._count._all,0);const revenueByCurrency=paidInvoices.map(row=>({currency:row.currency,amount:Number(row._sum.amount||0),invoiceCount:row._count._all}));const outstandingByCurrency=allInvoices.map(row=>({currency:row.currency,amount:Number(row._sum.amount||0),invoiceCount:row._count._all}));const revenue=revenueByCurrency.length===0?0:revenueByCurrency.length===1?revenueByCurrency[0].amount:null;const outstanding=outstandingByCurrency.length===0?0:outstandingByCurrency.length===1?outstandingByCurrency[0].amount:null;
 const revenueSeries=await this.prisma.invoice.findMany({where:{workspaceId,status:'PAID',paidAt:{gte:from,lt:to}},select:{amount:true,paidAt:true}});const buckets=new Map<string,number>();for(const inv of revenueSeries){const d=inv.paidAt!;const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;buckets.set(key,(buckets.get(key)||0)+Number(inv.amount));}
 return {range:{from:from.toISOString(),to:to.toISOString()},kpis:{activeProjects:projects,revenue,paidInvoices:paidCount,outstandingInvoices:outstandingCount,outstandingAmount:outstanding,newCustomers:customers,openTasks:taskCounts.TODO+taskCounts.IN_PROGRESS+taskCounts.IN_REVIEW,completedTasks:taskCounts.DONE},revenueByCurrency,outstandingByCurrency,taskProgress:taskCounts,revenueSeries:revenueByCurrency.length<=1?[...buckets.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([date,amount])=>({date,amount,currency:revenueByCurrency[0]?.currency||'USD'})):[],upcomingEvents:events,recentProjects,recentActivity};
 }
}
