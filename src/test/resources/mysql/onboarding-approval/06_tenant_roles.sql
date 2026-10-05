-- source: dev DB (production D-1 copy), 2026-10-05
-- AUTO_INCREMENT start values and DEFINER removed. Columns, lengths, and constraints are unchanged.
-- queried_at: 2026-10-05 14:44:43 KST
CREATE TABLE `tenant_roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_role_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '테넌트 역할 UUID',
  `tenant_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '테넌트 ID',
  `role_template_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '역할 템플릿 ID (템플릿 기반 복제 시)',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '역할명',
  `name_ko` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '역할명 (한글)',
  `name_en` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '역할명 (영문)',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '설명',
  `description_ko` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '설명 (한글)',
  `description_en` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '설명 (영문)',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '활성화 여부',
  `display_order` int DEFAULT '0' COMMENT '표시 순서',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `version` bigint DEFAULT '0',
  `lang_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'ko',
  `created_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_role_id` (`tenant_role_id`),
  KEY `idx_tenant_role_id` (`tenant_role_id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_role_template_id` (`role_template_id`),
  KEY `idx_tenant_role` (`tenant_id`,`tenant_role_id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_is_deleted` (`is_deleted`),
  CONSTRAINT `fk_tenant_roles_tenants` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='테넌트 커스텀 역할 테이블'
;
