-- AlterTable
ALTER TABLE `performances`
ADD COLUMN `flyer_images` JSON NULL,
ADD COLUMN `painters` JSON NULL,
ADD COLUMN `choreographers` JSON NULL,
ADD COLUMN `navigators` JSON NULL,
ADD COLUMN `guest_dancers` JSON NULL,
ADD COLUMN `staff` JSON NULL;