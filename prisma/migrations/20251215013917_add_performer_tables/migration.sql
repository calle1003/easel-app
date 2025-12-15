-- CreateTable
CREATE TABLE `performances` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `volume` VARCHAR(50) NULL,
    `performance_date` DATE NOT NULL,
    `performance_time` TIME NOT NULL,
    `doors_open_time` TIME NULL,
    `venue_name` VARCHAR(191) NOT NULL,
    `venue_address` VARCHAR(191) NULL,
    `venue_access` VARCHAR(191) NULL,
    `general_price` INTEGER NOT NULL,
    `reserved_price` INTEGER NOT NULL,
    `general_capacity` INTEGER NOT NULL DEFAULT 0,
    `reserved_capacity` INTEGER NOT NULL DEFAULT 0,
    `general_sold` INTEGER NOT NULL DEFAULT 0,
    `reserved_sold` INTEGER NOT NULL DEFAULT 0,
    `sale_status` ENUM('NOT_ON_SALE', 'ON_SALE', 'SOLD_OUT', 'ENDED') NOT NULL DEFAULT 'NOT_ON_SALE',
    `sale_start_at` DATETIME(3) NULL,
    `sale_end_at` DATETIME(3) NULL,
    `flyer_image_url` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `news` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NULL,
    `published_at` DATETIME(3) NOT NULL,
    `category` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'ADMIN',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_login_at` DATETIME(3) NULL,

    UNIQUE INDEX `admin_users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exchange_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `performer_id` INTEGER NULL,
    `performer_name` VARCHAR(100) NULL,
    `is_used` BOOLEAN NOT NULL DEFAULT false,
    `used_at` DATETIME(3) NULL,
    `order_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `exchange_codes_code_key`(`code`),
    INDEX `exchange_codes_performer_id_idx`(`performer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stripe_session_id` VARCHAR(191) NULL,
    `stripe_payment_intent_id` VARCHAR(191) NULL,
    `performance_date` VARCHAR(50) NOT NULL,
    `performance_label` VARCHAR(100) NULL,
    `general_quantity` INTEGER NOT NULL DEFAULT 0,
    `reserved_quantity` INTEGER NOT NULL DEFAULT 0,
    `general_price` INTEGER NOT NULL,
    `reserved_price` INTEGER NOT NULL,
    `discounted_general_count` INTEGER NOT NULL DEFAULT 0,
    `discount_amount` INTEGER NOT NULL DEFAULT 0,
    `exchange_codes` VARCHAR(500) NULL,
    `total_amount` INTEGER NOT NULL,
    `customer_name` VARCHAR(100) NOT NULL,
    `customer_email` VARCHAR(191) NOT NULL,
    `customer_phone` VARCHAR(20) NULL,
    `status` ENUM('PENDING', 'PAID', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `paid_at` DATETIME(3) NULL,
    `cancelled_at` DATETIME(3) NULL,

    UNIQUE INDEX `orders_stripe_session_id_key`(`stripe_session_id`),
    INDEX `idx_order_stripe_session`(`stripe_session_id`),
    INDEX `idx_order_status`(`status`),
    INDEX `idx_order_customer_email`(`customer_email`),
    INDEX `idx_order_performance_date`(`performance_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tickets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `ticket_code` VARCHAR(36) NOT NULL,
    `ticket_type` ENUM('GENERAL', 'RESERVED') NOT NULL,
    `is_exchanged` BOOLEAN NOT NULL DEFAULT false,
    `is_used` BOOLEAN NOT NULL DEFAULT false,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tickets_ticket_code_key`(`ticket_code`),
    INDEX `idx_ticket_code`(`ticket_code`),
    INDEX `idx_ticket_order`(`order_id`),
    INDEX `idx_ticket_type`(`ticket_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `performers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `name_kana` VARCHAR(100) NULL,
    `profile_image` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `performance_performers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `performance_id` INTEGER NOT NULL,
    `performer_id` INTEGER NOT NULL,
    `role` VARCHAR(50) NULL,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `performance_performers_performance_id_idx`(`performance_id`),
    INDEX `performance_performers_performer_id_idx`(`performer_id`),
    UNIQUE INDEX `performance_performers_performance_id_performer_id_key`(`performance_id`, `performer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `exchange_codes` ADD CONSTRAINT `exchange_codes_performer_id_fkey` FOREIGN KEY (`performer_id`) REFERENCES `performers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_performers` ADD CONSTRAINT `performance_performers_performance_id_fkey` FOREIGN KEY (`performance_id`) REFERENCES `performances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_performers` ADD CONSTRAINT `performance_performers_performer_id_fkey` FOREIGN KEY (`performer_id`) REFERENCES `performers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
