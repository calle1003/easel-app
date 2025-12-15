-- AlterTable
ALTER TABLE `exchange_codes`
ADD COLUMN `performance_session_id` INTEGER NULL AFTER `performer_name`;

-- CreateIndex
CREATE INDEX `exchange_codes_performance_session_id_idx` ON `exchange_codes` (`performance_session_id`);

-- AddForeignKey
ALTER TABLE `exchange_codes`
ADD CONSTRAINT `exchange_codes_performance_session_id_fkey` FOREIGN KEY (`performance_session_id`) REFERENCES `performance_sessions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;