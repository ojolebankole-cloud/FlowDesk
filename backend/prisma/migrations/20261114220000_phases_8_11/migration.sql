-- FlowDesk Phases 8–11: task collaboration, CRM, finance and scheduling.
ALTER TABLE "Task"
  ADD COLUMN "parentId" TEXT,
  ADD COLUMN "startDate" TIMESTAMP(3),
  ADD COLUMN "estimatedMinutes" INTEGER,
  ADD COLUMN "createdById" TEXT;
CREATE INDEX "Task_workspaceId_assigneeId_idx" ON "Task"("workspaceId","assigneeId");
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");
CREATE INDEX "Task_parentId_idx" ON "Task"("parentId");
UPDATE "Task" SET "assigneeId" = NULL WHERE "assigneeId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" WHERE "User"."id" = "Task"."assigneeId");
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TaskDependency" ("id" TEXT NOT NULL,"predecessorId" TEXT NOT NULL,"successorId" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "TaskDependency_predecessorId_successorId_key" ON "TaskDependency"("predecessorId","successorId");
CREATE INDEX "TaskDependency_successorId_idx" ON "TaskDependency"("successorId");
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_predecessorId_fkey" FOREIGN KEY ("predecessorId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_successorId_fkey" FOREIGN KEY ("successorId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TaskComment" ("id" TEXT NOT NULL,"taskId" TEXT NOT NULL,"authorId" TEXT NOT NULL,"body" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id"));
CREATE INDEX "TaskComment_taskId_createdAt_idx" ON "TaskComment"("taskId","createdAt");
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TaskAttachment" ("id" TEXT NOT NULL,"taskId" TEXT NOT NULL,"name" TEXT NOT NULL,"url" TEXT NOT NULL,"mimeType" TEXT,"sizeBytes" INTEGER,"uploadedById" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "TaskAttachment_pkey" PRIMARY KEY ("id"));
CREATE INDEX "TaskAttachment_taskId_idx" ON "TaskAttachment"("taskId");
ALTER TABLE "TaskAttachment" ADD CONSTRAINT "TaskAttachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Notification" ("id" TEXT NOT NULL,"userId" TEXT NOT NULL,"workspaceId" TEXT NOT NULL,"type" TEXT NOT NULL,"title" TEXT NOT NULL,"body" TEXT,"entityType" TEXT,"entityId" TEXT,"readAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"));
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId","readAt","createdAt");
CREATE INDEX "Notification_workspaceId_createdAt_idx" ON "Notification"("workspaceId","createdAt");
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Customer" ADD COLUMN "category" TEXT, ADD COLUMN "address" TEXT, ADD COLUMN "website" TEXT;
CREATE INDEX "Customer_workspaceId_email_idx" ON "Customer"("workspaceId","email");
CREATE INDEX "Customer_workspaceId_category_idx" ON "Customer"("workspaceId","category");
CREATE TABLE "CustomerNote" ("id" TEXT NOT NULL,"customerId" TEXT NOT NULL,"body" TEXT NOT NULL,"createdById" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "CustomerNote_pkey" PRIMARY KEY ("id"));
CREATE INDEX "CustomerNote_customerId_createdAt_idx" ON "CustomerNote"("customerId","createdAt");
ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "CustomerActivity" ("id" TEXT NOT NULL,"customerId" TEXT NOT NULL,"actorId" TEXT,"type" TEXT NOT NULL,"summary" TEXT NOT NULL,"details" JSONB,"occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "CustomerActivity_pkey" PRIMARY KEY ("id"));
CREATE INDEX "CustomerActivity_customerId_occurredAt_idx" ON "CustomerActivity"("customerId","occurredAt");
ALTER TABLE "CustomerActivity" ADD CONSTRAINT "CustomerActivity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerActivity" ADD CONSTRAINT "CustomerActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT','SENT','PARTIALLY_PAID','PAID','OVERDUE','VOID');
ALTER TABLE "Invoice" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Invoice" ALTER COLUMN "status" TYPE "InvoiceStatus" USING (CASE WHEN "status" IN ('DRAFT','SENT','PARTIALLY_PAID','PAID','OVERDUE','VOID') THEN "status" ELSE 'DRAFT' END)::"InvoiceStatus";
ALTER TABLE "Invoice" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
ALTER TABLE "Invoice" ADD COLUMN "customerId" TEXT, ADD COLUMN "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0, ADD COLUMN "discount" DECIMAL(14,2) NOT NULL DEFAULT 0, ADD COLUMN "taxRate" DECIMAL(7,4) NOT NULL DEFAULT 0, ADD COLUMN "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0, ADD COLUMN "total" DECIMAL(14,2) NOT NULL DEFAULT 0, ADD COLUMN "notes" TEXT, ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "Invoice" SET "subtotal"="amount","total"="amount";
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE TABLE "InvoiceLineItem" ("id" TEXT NOT NULL,"invoiceId" TEXT NOT NULL,"description" TEXT NOT NULL,"quantity" DECIMAL(12,3) NOT NULL DEFAULT 1,"unitPrice" DECIMAL(14,2) NOT NULL,"amount" DECIMAL(14,2) NOT NULL,CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id"));
CREATE INDEX "InvoiceLineItem_invoiceId_idx" ON "InvoiceLineItem"("invoiceId");
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "Payment" ("id" TEXT NOT NULL,"invoiceId" TEXT NOT NULL,"amount" DECIMAL(14,2) NOT NULL,"currency" TEXT NOT NULL,"method" TEXT,"reference" TEXT,"paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"recordedById" TEXT,CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"));
CREATE INDEX "Payment_invoiceId_paidAt_idx" ON "Payment"("invoiceId","paidAt");
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE TABLE "Expense" ("id" TEXT NOT NULL,"workspaceId" TEXT NOT NULL,"description" TEXT NOT NULL,"category" TEXT,"amount" DECIMAL(14,2) NOT NULL,"currency" TEXT NOT NULL DEFAULT 'USD',"incurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"vendor" TEXT,"reference" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Expense_pkey" PRIMARY KEY ("id"));
CREATE INDEX "Expense_workspaceId_incurredAt_idx" ON "Expense"("workspaceId","incurredAt");

ALTER TABLE "CalendarEvent" ADD COLUMN "allDay" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "recurrenceRule" TEXT, ADD COLUMN "reminderMinutes" INTEGER, ADD COLUMN "sourceType" TEXT, ADD COLUMN "sourceId" TEXT, ADD COLUMN "createdById" TEXT, ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE TABLE "CalendarReminder" ("id" TEXT NOT NULL,"eventId" TEXT NOT NULL,"remindAt" TIMESTAMP(3) NOT NULL,"deliveredAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "CalendarReminder_pkey" PRIMARY KEY ("id"));
CREATE INDEX "CalendarReminder_remindAt_deliveredAt_idx" ON "CalendarReminder"("remindAt","deliveredAt");
ALTER TABLE "CalendarReminder" ADD CONSTRAINT "CalendarReminder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tenant-bound auxiliary records and explicit customer/project relationship.
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD COLUMN "customerId" TEXT;
CREATE INDEX "Project_customerId_idx" ON "Project"("customerId");
ALTER TABLE "Project" ADD CONSTRAINT "Project_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
