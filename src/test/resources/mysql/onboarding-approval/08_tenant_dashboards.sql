-- source: dev DB (production D-1 copy), 2026-10-05
-- AUTO_INCREMENT start values and DEFINER removed. Columns, lengths, and constraints are unchanged.
-- queried_at: 2026-10-05 14:44:43 KST
CREATE TABLE `tenant_dashboards` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '고유 ID',
  `dashboard_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '대시보드 UUID',
  `tenant_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '테넌트 ID (FK)',
  `tenant_role_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '테넌트 역할 ID (FK)',
  `dashboard_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '대시보드 이름',
  `dashboard_name_ko` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '대시보드 이름 (한글)',
  `dashboard_name_en` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '대시보드 이름 (영문)',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '설명',
  `dashboard_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '대시보드 타입 (STUDENT, TEACHER, ADMIN 등)',
  `is_default` tinyint(1) NOT NULL DEFAULT '0' COMMENT '기본 대시보드 여부',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '활성화 여부',
  `display_order` int NOT NULL DEFAULT '0' COMMENT '표시 순서',
  `dashboard_config` json DEFAULT NULL COMMENT '대시보드 설정 (위젯 구성, 레이아웃 등)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '삭제 여부',
  `version` bigint NOT NULL DEFAULT '0' COMMENT '버전 (낙관적 잠금)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `dashboard_id` (`dashboard_id`),
  UNIQUE KEY `uk_tenant_dashboard_role` (`tenant_id`,`tenant_role_id`),
  KEY `idx_tenant_dashboard_tenant_id` (`tenant_id`),
  KEY `idx_tenant_dashboard_tenant_role_id` (`tenant_role_id`),
  KEY `idx_tenant_dashboard_is_active` (`is_active`),
  KEY `idx_tenant_dashboard_display_order` (`display_order`),
  CONSTRAINT `fk_dashboard_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`),
  CONSTRAINT `fk_dashboard_tenant_role` FOREIGN KEY (`tenant_role_id`) REFERENCES `tenant_roles` (`tenant_role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='테넌트 대시보드 테이블'
;
