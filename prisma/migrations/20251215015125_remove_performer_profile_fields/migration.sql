/*
  Warnings:

  - You are about to drop the column `bio` on the `performers` table. All the data in the column will be lost.
  - You are about to drop the column `profile_image` on the `performers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `performers` DROP COLUMN `bio`,
    DROP COLUMN `profile_image`;
