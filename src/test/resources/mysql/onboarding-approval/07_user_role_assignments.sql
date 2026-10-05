-- source: dev DB (production D-1 copy), 2026-10-05
-- AUTO_INCREMENT start values and DEFINER removed. Columns, lengths, and constraints are unchanged.
-- queried_at: 2026-10-05 14:44:43 KST
CREATE TABLE `user_role_assignments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `tenant_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` bigint NOT NULL,
  `assigned_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assignment_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `assignment_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `branch_id` bigint DEFAULT NULL,
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `tenant_role_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_1a17gymilx4a8kiar7pgtrkou` (`assignment_id`),
  UNIQUE KEY `uk_user_role_tenant_branch` (`user_id`,`tenant_id`,`tenant_role_id`,`branch_id`),
  KEY `idx_user_role_user_id` (`user_id`),
  KEY `idx_user_role_tenant_id` (`tenant_id`),
  KEY `idx_user_role_tenant_role_id` (`tenant_role_id`),
  KEY `idx_user_role_branch_id` (`branch_id`),
  KEY `idx_user_role_active` (`is_active`),
  KEY `idx_user_role_effective` (`effective_from`,`effective_to`),
  CONSTRAINT `FKgyk9r4f2fcjgern1ol11g9p7a` FOREIGN KEY (`branch_id`) REFERENCES `branches_dropped_20260612` (`id`),
  CONSTRAINT `FKjqkred5gtue7qm98ow9ac9s49` FOREIGN KEY (`tenant_role_id`) REFERENCES `tenant_roles` (`tenant_role_id`),
  CONSTRAINT `FKrb42ra1ptis8nx3g4wotuf003` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
;
