/*
  Warnings:

  - You are about to drop the column `points` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `_hashtagtovideo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hashtag` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `points`;

-- DropTable
DROP TABLE `_hashtagtovideo`;

-- DropTable
DROP TABLE `hashtag`;
