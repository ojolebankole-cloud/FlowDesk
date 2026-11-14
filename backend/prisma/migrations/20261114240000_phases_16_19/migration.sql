CREATE TYPE "WorkspaceStatus" AS ENUM ('ACTIVE','SUSPENDED');
ALTER TABLE "Workspace" ADD COLUMN "status" "WorkspaceStatus" NOT NULL DEFAULT 'ACTIVE', ADD COLUMN "suspendedAt" TIMESTAMP(3);
CREATE TABLE "UserPreference" ("id" TEXT NOT NULL, "userId" TEXT NOT NULL, "theme" TEXT NOT NULL DEFAULT 'system', "locale" TEXT NOT NULL DEFAULT 'en', "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY', "weekStartsOn" INTEGER NOT NULL DEFAULT 1, "compactMode" BOOLEAN NOT NULL DEFAULT false, "emailDigest" TEXT NOT NULL DEFAULT 'daily', "productUpdates" BOOLEAN NOT NULL DEFAULT false, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "PlatformSetting" ("key" TEXT NOT NULL, "value" JSONB NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL, "updatedById" TEXT, CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("key"));
