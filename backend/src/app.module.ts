import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaService } from './prisma/prisma.service';
import { MailService } from './mail/mail.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { SessionGuard } from './auth/session.guard';
import { HealthController } from './health/health.controller';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { WorkspacesController } from './workspaces/workspaces.controller';
import { WorkspacesService } from './workspaces/workspaces.service';
import { ProjectsController } from './projects/projects.controller';
import { ProjectsService } from './projects/projects.service';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { TasksController } from './tasks/tasks.controller'; import { TasksService } from './tasks/tasks.service';
import { CustomersController } from './customers/customers.controller'; import { CustomersService } from './customers/customers.service';
import { InvoicesController } from './invoices/invoices.controller'; import { InvoicesService } from './invoices/invoices.service';
import { ReportsController } from './reports/reports.controller';import { ReportsService } from './reports/reports.service';import { AiController } from './ai/ai.controller';import { AiService } from './ai/ai.service';import { NotificationsController } from './notifications/notifications.controller';import { NotificationsService } from './notifications/notifications.service';import { FilesController } from './files/files.controller';import { FilesService } from './files/files.service';
import { MalwareScanner } from './files/malware-scanner';import { NotificationReminderWorker } from './notifications/reminder.worker';
import { CalendarController } from './calendar/calendar.controller'; import { CalendarService } from './calendar/calendar.service'; import { ReminderWorker } from './calendar/reminder.worker';
import { WorkspaceRoleGuard } from './common/roles';
import { validateEnvironment } from './env.validation';
import { AdminController } from './admin/admin.controller'; import { AdminService } from './admin/admin.service'; import { PreferencesController } from './preferences/preferences.controller'; import { PreferencesService } from './preferences/preferences.service'; import { BillingController } from './billing/billing.controller'; import { BillingService } from './billing/billing.service';
@Module({imports:[ConfigModule.forRoot({isGlobal:true,envFilePath:['.env','../.env'],validate:validateEnvironment}),ThrottlerModule.forRoot([{ttl:60000,limit:120}])],controllers:[AuthController,HealthController,UsersController,WorkspacesController,ProjectsController,DashboardController,TasksController,CustomersController,InvoicesController,CalendarController,ReportsController,AiController,NotificationsController,FilesController,AdminController,PreferencesController,BillingController],providers:[PrismaService,MailService,AuthService,SessionGuard,UsersService,WorkspacesService,ProjectsService,DashboardService,TasksService,CustomersService,InvoicesService,CalendarService,ReminderWorker,ReportsService,AiService,NotificationsService,FilesService,MalwareScanner,NotificationReminderWorker,AdminService,PreferencesService,BillingService,WorkspaceRoleGuard,{provide:APP_GUARD,useClass:ThrottlerGuard}]})
export class AppModule{}
