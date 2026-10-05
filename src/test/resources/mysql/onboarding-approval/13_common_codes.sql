-- 승인 트랜잭션이 위험도 공통코드를 읽는다. 테이블이 없으면 예외가 트랜잭션을 rollback-only 로 만든다.
-- 개발 DB SHOW CREATE 가 아니다. JPA CommonCode 가 SELECT 하는 컬럼만 맞춘 빈 테이블이다.
CREATE TABLE `common_codes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL DEFAULT b'0',
  `version` bigint NOT NULL DEFAULT 0,
  `tenant_id` varchar(36) DEFAULT NULL,
  `code_group` varchar(50) NOT NULL,
  `code_value` varchar(50) NOT NULL,
  `code_label` varchar(2000) NOT NULL,
  `code_description` varchar(500) DEFAULT NULL,
  `sort_order` int DEFAULT NULL,
  `is_active` bit(1) NOT NULL DEFAULT b'1',
  `parent_code_group` varchar(50) DEFAULT NULL,
  `parent_code_value` varchar(50) DEFAULT NULL,
  `extra_data` varchar(1000) DEFAULT NULL,
  `icon` varchar(10) DEFAULT NULL,
  `color_code` varchar(7) DEFAULT NULL,
  `korean_name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
