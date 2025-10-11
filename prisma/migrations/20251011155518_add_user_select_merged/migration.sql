-- AlterTable
ALTER TABLE "public"."activities" ADD COLUMN     "merged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "selected" BOOLEAN NOT NULL DEFAULT false;
