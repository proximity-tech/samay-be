-- CreateTable
CREATE TABLE "public"."daily_insights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyInsights" JSONB NOT NULL,
    "improvementPlan" JSONB NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_insights_userId_date_idx" ON "public"."daily_insights"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_insights_userId_date_key" ON "public"."daily_insights"("userId", "date");

-- AddForeignKey
ALTER TABLE "public"."daily_insights" ADD CONSTRAINT "daily_insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
