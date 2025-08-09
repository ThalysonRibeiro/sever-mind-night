/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Dream` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DreamCategory" AS ENUM ('FAMILY', 'RELATIONSHIPS', 'FRIENDS', 'STRANGERS', 'HOME', 'WORK', 'SCHOOL', 'NATURE', 'FANTASY_PLACES', 'FLYING', 'RUNNING', 'CHASE', 'ADVENTURE', 'TRAVEL', 'PETS', 'WILD_ANIMALS', 'INSECTS', 'BIRTH', 'DEATH', 'WEDDING', 'GRADUATION', 'WATER', 'FIRE', 'STORM', 'MONEY', 'FOOD', 'VEHICLES', 'CLOTHES', 'NIGHTMARE', 'LUCID_DREAM', 'ANXIETY', 'JOY', 'FEAR', 'SUPERPOWERS', 'INVISIBILITY', 'TELEPATHY', 'CHILDHOOD', 'MEMORIES', 'FUTURE', 'RELIGIOUS', 'SPIRITUAL', 'SUPERNATURAL', 'OTHER');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('Astral', 'Natural', 'Minimal', 'Noturno');

-- DropForeignKey
ALTER TABLE "Dream" DROP CONSTRAINT "Dream_categoryId_fkey";

-- DropIndex
DROP INDEX "Dream_categoryId_idx";

-- AlterTable
ALTER TABLE "Dream" DROP COLUMN "categoryId",
ADD COLUMN     "category" "DreamCategory" NOT NULL DEFAULT 'OTHER';

-- DropTable
DROP TABLE "Category";

-- CreateIndex
CREATE INDEX "Dream_category_idx" ON "Dream"("category");
