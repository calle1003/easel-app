-- AlterTable
ALTER TABLE `performances`
ADD COLUMN `year` INTEGER NULL,
ADD COLUMN `is_on_sale` BOOLEAN NOT NULL DEFAULT false;