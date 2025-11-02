/*
  Warnings:

  - Changed the type of `tag` on the `tags` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."TagType" AS ENUM ('CODE', 'DESIGN', 'RESEARCH', 'DISCUSSION', 'LEARNING', 'PLANNING', 'TESTING', 'DOCUMENTATION', 'MEETING', 'EMAIL');

-- AlterTable
ALTER TABLE "public"."tags" DROP COLUMN "tag",
ADD COLUMN     "tag" "public"."TagType" NOT NULL;
