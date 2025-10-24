-- AlterTable
ALTER TABLE "public"."activities" ADD COLUMN     "autoTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isAutoTagged" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."tags" (
    "id" SERIAL NOT NULL,
    "app" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);
