-- source: dev DB (production D-1 copy), 2026-10-05
-- AUTO_INCREMENT start values and DEFINER removed. Columns, lengths, and constraints are unchanged.
-- queried_at: 2026-10-05 14:44:43 KST
CREATE TABLE `onboarding_request` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `tenant_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '테넌트 ID (온보딩 중이면 NULL, 승인 후 업데이트)',
  `subdomain` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '서브도메인',
  `updated_at` datetime(6) NOT NULL,
  `version` bigint NOT NULL,
  `business_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `checklist_json` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `decided_by` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `decision_at` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `decision_note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `requested_by` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `risk_level` enum('LOW','MEDIUM','HIGH') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `tenant_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `region` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `initialization_status_json` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '초기화 작업 단계별 상태 (JSON 형식)',
  `business_registration_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '사업자등록번호',
  `representative_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '대표자명',
  `business_landline` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '유선전화',
  `business_address` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '사업장 주소',
  `mail_order_report_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '통신판매업 신고번호',
  `refund_policy_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '환불·취소·청약철회 안내',
  `product_price_guide_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '상품·가격 안내',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_new_2` (`id`),
  KEY `idx_onboarding_tenant_id` (`tenant_id`),
  KEY `idx_onboarding_status` (`status`),
  KEY `idx_onboarding_tenant_status` (`tenant_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
;
