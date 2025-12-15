-- CreateTable
CREATE TABLE `performance_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `performance_id` INTEGER NOT NULL,
    `show_number` INTEGER NOT NULL,
    `performance_date` DATE NOT NULL,
    `performance_time` TIME NOT NULL,
    `doors_open_time` TIME NULL,
    `venue_name` VARCHAR(191) NOT NULL,
    `venue_address` VARCHAR(191) NULL,
    `venue_access` VARCHAR(191) NULL,
    `general_capacity` INTEGER NOT NULL DEFAULT 0,
    `reserved_capacity` INTEGER NOT NULL DEFAULT 0,
    `general_sold` INTEGER NOT NULL DEFAULT 0,
    `reserved_sold` INTEGER NOT NULL DEFAULT 0,
    `sale_status` ENUM(
        'NOT_ON_SALE',
        'ON_SALE',
        'SOLD_OUT',
        'ENDED'
    ) NOT NULL DEFAULT 'NOT_ON_SALE',
    `sale_start_at` DATETIME(3) NULL,
    `sale_end_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    INDEX `performance_sessions_performance_id_idx` (`performance_id`),
    INDEX `performance_sessions_sale_status_idx` (`sale_status`),
    INDEX `performance_sessions_performance_date_idx` (`performance_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Migrate existing data from performances to performance_sessions
INSERT INTO
    `performance_sessions` (
        `performance_id`,
        `show_number`,
        `performance_date`,
        `performance_time`,
        `doors_open_time`,
        `venue_name`,
        `venue_address`,
        `venue_access`,
        `general_capacity`,
        `reserved_capacity`,
        `general_sold`,
        `reserved_sold`,
        `sale_status`,
        `sale_start_at`,
        `sale_end_at`,
        `created_at`,
        `updated_at`
    )
SELECT
    `id` as `performance_id`,
    COALESCE(`show_number`, 1) as `show_number`,
    `performance_date`,
    `performance_time`,
    `doors_open_time`,
    `venue_name`,
    `venue_address`,
    `venue_access`,
    `general_capacity`,
    `reserved_capacity`,
    `general_sold`,
    `reserved_sold`,
    `sale_status`,
    `sale_start_at`,
    `sale_end_at`,
    `created_at`,
    `updated_at`
FROM `performances`;

-- AlterTable
ALTER TABLE `performances`
DROP COLUMN `show_number`,
DROP COLUMN `performance_date`,
DROP COLUMN `performance_time`,
DROP COLUMN `doors_open_time`,
DROP COLUMN `venue_name`,
DROP COLUMN `venue_address`,
DROP COLUMN `venue_access`,
DROP COLUMN `general_capacity`,
DROP COLUMN `reserved_capacity`,
DROP COLUMN `general_sold`,
DROP COLUMN `reserved_sold`,
DROP COLUMN `sale_status`,
DROP COLUMN `sale_start_at`,
DROP COLUMN `sale_end_at`;

-- AddForeignKey
ALTER TABLE `performance_sessions`
ADD CONSTRAINT `performance_sessions_performance_id_fkey` FOREIGN KEY (`performance_id`) REFERENCES `performances` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;