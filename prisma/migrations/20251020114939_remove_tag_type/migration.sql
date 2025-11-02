/*
  Warnings:

  - Changed the type of `tag` on the `tags` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."tags" DROP COLUMN "tag",
ADD COLUMN     "tag" TEXT NOT NULL;

-- DropEnum
DROP TYPE "public"."TagType";
