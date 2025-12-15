-- AlterEnum
ALTER TABLE `tickets`
MODIFY COLUMN `ticket_type` ENUM(
    'GENERAL',
    'RESERVED',
    'VIP1',
    'VIP2'
) NOT NULL;

-- AlterTable
ALTER TABLE `performances`
ADD COLUMN `vip1_price` INTEGER NULL AFTER `reserved_price`,
ADD COLUMN `vip2_price` INTEGER NULL AFTER `vip1_price`,
ADD COLUMN `vip1_note` TEXT NULL AFTER `vip2_price`,
ADD COLUMN `vip2_note` TEXT NULL AFTER `vip1_note`;

-- AlterTable
ALTER TABLE `performance_sessions`
ADD COLUMN `vip1_capacity` INTEGER NOT NULL DEFAULT 0 AFTER `reserved_capacity`,
ADD COLUMN `vip2_capacity` INTEGER NOT NULL DEFAULT 0 AFTER `vip1_capacity`,
ADD COLUMN `vip1_sold` INTEGER NOT NULL DEFAULT 0 AFTER `reserved_sold`,
ADD COLUMN `vip2_sold` INTEGER NOT NULL DEFAULT 0 AFTER `vip1_sold`;

-- AlterTable
ALTER TABLE `orders`
ADD COLUMN `vip1_quantity` INTEGER NOT NULL DEFAULT 0 AFTER `reserved_quantity`,
ADD COLUMN `vip2_quantity` INTEGER NOT NULL DEFAULT 0 AFTER `vip1_quantity`,
ADD COLUMN `vip1_price` INTEGER NOT NULL DEFAULT 0 AFTER `reserved_price`,
ADD COLUMN `vip2_price` INTEGER NOT NULL DEFAULT 0 AFTER `vip1_price`;