-- 상담일지↔일정 링크 보정 SQL 회귀 테스트 픽스처 (로컬 MySQL 8 전용)
-- 운영 스키마 특성만 재현: users.name PII 암호문 + utf8mb4_unicode_ci,
-- schedules.start_time TIME(6), is_deleted BIT(1).
-- 운영 PK·실데이터는 넣지 않는다 (합성 id 사용).

DROP DATABASE IF EXISTS mg_session_link_test;
CREATE DATABASE mg_session_link_test DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE mg_session_link_test;

CREATE TABLE users (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(50) NULL,
  role VARCHAR(50) NULL,
  name VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  is_deleted BIT(1) NOT NULL DEFAULT b'0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE schedules (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(50) NULL,
  client_id BIGINT NULL,
  consultant_id BIGINT NOT NULL,
  date DATE NOT NULL,
  start_time TIME(6) NOT NULL,
  end_time TIME(6) NOT NULL,
  status VARCHAR(32) NOT NULL,
  session_sequence INT NULL,
  mapping_id BIGINT NULL,
  is_deleted BIT(1) NOT NULL DEFAULT b'0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE consultation_records (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(50) NULL,
  consultation_id BIGINT NOT NULL,
  client_id BIGINT NOT NULL,
  consultant_id BIGINT NOT NULL,
  session_date DATE NOT NULL,
  session_number INT NULL,
  client_condition TEXT NULL,
  main_issues TEXT NULL,
  intervention_methods TEXT NULL,
  consultant_observations TEXT NULL,
  is_deleted BIT(1) NOT NULL DEFAULT b'0',
  created_at DATETIME(6) NULL,
  updated_at DATETIME(6) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 이름이 전부 PII 암호문(keyId::base64)인 상태 → 평문 LIKE 는 항상 0건
INSERT INTO users (id, tenant_id, role, name)
SELECT 100 + seq, 'tenant-test-001', 'CLIENT',
       CONCAT('v1::', REPEAT('QUJDREVGR0hJSktMTU5PUFFSUw', 2), LPAD(seq, 3, '0'))
FROM (
  SELECT 1 seq UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
) s;
