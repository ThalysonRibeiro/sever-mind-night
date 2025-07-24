-- CreateTable
CREATE TABLE "InterpretationQuota" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyCredits" INTEGER DEFAULT 0,
    "weeklyCredits" INTEGER DEFAULT 0,
    "nextResetDate" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterpretationQuota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InterpretationQuota_userId_key" ON "InterpretationQuota"("userId");

-- AddForeignKey
ALTER TABLE "InterpretationQuota" ADD CONSTRAINT "InterpretationQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
