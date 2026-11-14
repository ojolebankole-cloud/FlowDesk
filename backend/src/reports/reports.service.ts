import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';import { BILLING_PLANS } from '../billing/billing.service';import { ForbiddenException } from '@nestjs/common';
@Injectable()
export class ReportsService {
 constructor(private db:PrismaService,private ws:WorkspacesService){}
 async summary(userId:string,w:string,from?:string,to?:string){
  await this.ws.requireMember(userId,w);const subscription=await this.db.workspaceSubscription.findUnique({where:{workspaceId:w}});const code=subscription&&(subscription.status==='ACTIVE'||subscription.status==='TRIALING')?subscription.planCode:'FREE';const plan=BILLING_PLANS.find(p=>p.code===code)||BILLING_PLANS[0];if(!(plan.features as readonly string[]).includes('reports'))throw new ForbiddenException('Analytics reports require the Starter, Business or Scale subscription.'); const start=from?new Date(from):new Date(new Date().getFullYear(),0,1); const end=to?new Date(to):new Date();
  if(isNaN(start.getTime())||isNaN(end.getTime())||start>end)throw new BadRequestException('Invalid report date range.'); end.setHours(23,59,59,999);
  const [invoices,payments,expenses,tasks,projects,customers]=await Promise.all([
   this.db.invoice.findMany({where:{workspaceId:w,issueDate:{gte:start,lte:end},status:{not:'VOID'}},select:{id:true,total:true,currency:true,status:true,issueDate:true,dueDate:true}}),
   this.db.payment.findMany({where:{invoice:{workspaceId:w},paidAt:{gte:start,lte:end}},select:{amount:true,currency:true,paidAt:true}}),
   this.db.expense.findMany({where:{workspaceId:w,incurredAt:{gte:start,lte:end}},select:{amount:true,currency:true,incurredAt:true,category:true}}),
   this.db.task.groupBy({by:['status'],where:{workspaceId:w,createdAt:{gte:start,lte:end}},_count:{_all:true}}),
   this.db.project.groupBy({by:['status'],where:{workspaceId:w,createdAt:{gte:start,lte:end}},_count:{_all:true}}),
   this.db.customer.count({where:{workspaceId:w,createdAt:{gte:start,lte:end}}})
  ]);
  const currencies=[...new Set([...payments.map(x=>x.currency),...expenses.map(x=>x.currency),...invoices.map(x=>x.currency)])];
  const financial=currencies.map(currency=>{const revenue=payments.filter(x=>x.currency===currency).reduce((n,x)=>n+Number(x.amount),0);const cost=expenses.filter(x=>x.currency===currency).reduce((n,x)=>n+Number(x.amount),0);const billed=invoices.filter(x=>x.currency===currency).reduce((n,x)=>n+Number(x.total),0);return {currency,revenue,expenses:cost,profit:revenue-cost,billed,outstanding:Math.max(0,billed-revenue)};});
  const revenueByMonth=new Map<string,number>();for(const p of payments){const k=`${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth()+1).padStart(2,'0')} ${p.currency}`;revenueByMonth.set(k,(revenueByMonth.get(k)||0)+Number(p.amount));}
  return {range:{from:start.toISOString(),to:end.toISOString()},financial,revenueTrend:[...revenueByMonth].map(([period,revenue])=>({period,revenue})).sort((a,b)=>a.period.localeCompare(b.period)),productivity:{tasks:tasks.map(x=>({status:x.status,count:x._count._all})),projects:projects.map(x=>({status:x.status,count:x._count._all}))},customerGrowth:{newCustomers:customers},counts:{invoices:invoices.length,payments:payments.length,expenses:expenses.length}};
 }
}
