-- =============================================================================
-- V20260614_002 — PII 컬럼 폭 표준화 (500 → 512)
--
-- 작성 일자 : 2026-06-14
-- 브랜치    : chore/be-security-pr4-pii-converter
-- 표준      :
--   • docs/standards/PII_PROTECTION_STANDARD.md §6 — PII 컬럼 length >= 512 강제
--   • docs/standards/DATABASE_MIGRATION_STANDARD.md — 안전 ALTER 절차
--
-- 배경 (one-liner)
--   • PR-4 (BE 보안) 에서 EmailAttributeConverter / PersonalNameAttributeConverter /
--     PhoneAttributeConverter SSOT 3 종을 신설하고 User / Client 엔티티에 @Convert 를
--     적용하면서, 표준 §6 (PII 컬럼 length >= 512) 충족을 위해 기존 VARCHAR(500) 컬럼을
--     VARCHAR(512) 로 일괄 정규화한다.
--   • VARCHAR(500) 에서도 AES-256/CBC + Base64 + "vN::" 접두어 암호문은 대체로 수용
--     가능하나, 다중 키 prefix 확장·인코딩 변화 여지에 안전 마진을 두기 위함이다.
--   • 절대 금지 : 평문 컬럼 즉시 DROP / 컬럼명 변경 / NULL 처리 (롤백 자산 보존).
--
-- 변경 (5 컬럼)
--   • users.email           VARCHAR(500) → VARCHAR(512)
--   • users.name            VARCHAR(500) → VARCHAR(512)
--   • users.nickname        VARCHAR(500) → VARCHAR(512)
--   • users.phone           VARCHAR(500) → VARCHAR(512)
--   • clients.email         VARCHAR(500) → VARCHAR(512)
--   • clients.name          VARCHAR(500) → VARCHAR(512)
--   • clients.phone         VARCHAR(500) → VARCHAR(512)
--   • clients.emergency_contact   VARCHAR(500) → VARCHAR(512)
--   • clients.emergency_phone     VARCHAR(500) → VARCHAR(512)
--
-- 사전 검증 (운영 DB 안전성)
--   • 본 마이그레이션은 컬럼 폭을 12 바이트 확장하므로 truncate 위험이 없다.
--   • InnoDB row 포맷에서 in-place ALTER 가능 (ALGORITHM=INPLACE, LOCK=NONE 호환).
--   • 운영 DB 의 기존 NULL/NOT NULL / unique constraint / collation 은 그대로 유지한다.
--
-- 회귀 위험
--   • Hibernate validate 모드 환경은 운영 ddl-auto=none 이므로 영향 없음.
--   • Entity Java 정의는 동일 PR(@Column length = 512) 로 동기화한다.
--
-- 참조
--   • docs/standards/PII_PROTECTION_STANDARD.md §6 "평문 저장 회귀 차단"
--   • docs/standards/SECRET_ROTATION_POLICY.md §2~§4 키 회전 절차
--   • PR-4 핸드오프 노트 (격리 워크트리: mindGarden-be-security-pr4-pii-converter)
-- =============================================================================

-- 1) users 테이블 PII 컬럼 4종 확장
ALTER TABLE users
    MODIFY COLUMN email VARCHAR(512) NOT NULL
    COMMENT 'PII (AES-256/CBC encrypted). EmailAttributeConverter SSOT. length>=512 per PII_PROTECTION_STANDARD §6.';

ALTER TABLE users
    MODIFY COLUMN name VARCHAR(512) NOT NULL
    COMMENT 'PII (AES-256/CBC encrypted). PersonalNameAttributeConverter SSOT. length>=512 per PII_PROTECTION_STANDARD §6.';

ALTER TABLE users
    MODIFY COLUMN nickname VARCHAR(512) NULL
    COMMENT 'PII (AES-256/CBC encrypted). PersonalNameAttributeConverter SSOT. length>=512 per PII_PROTECTION_STANDARD §6.';

ALTER TABLE users
    MODIFY COLUMN phone VARCHAR(512) NULL
    COMMENT 'PII (AES-256/CBC encrypted). PhoneAttributeConverter SSOT. length>=512 per PII_PROTECTION_STANDARD §6.';

-- 2) clients 테이블 PII 컬럼 5종 확장
ALTER TABLE clients
    MODIFY COLUMN email VARCHAR(512) NOT NULL
    COMMENT 'PII (AES-256/CBC encrypted). EmailAttributeConverter SSOT. length>=512 per PII_PROTECTION_STANDARD §6.';

ALTER TABLE clients
    MODIFY COLUMN name VARCHAR(512) NOT NULL
    COMMENT 'PII (AES-256/CBC encrypted). PersonalNameAttributeConverter SSOT. length>=512 per PII_PROTECTION_STANDARD §6.';

ALTER TABLE clients
    MODIFY COLUMN phone VARCHAR(512) NULL
    COMMENT 'PII (AES-256/CBC encrypted). PhoneAttributeConverter SSOT. length>=512 per PII_PROTECTION_STANDARD §6.';

ALTER TABLE clients
    MODIFY COLUMN emergency_contact VARCHAR(512) NULL
    COMMENT 'PII (AES-256/CBC encrypted). PersonalNameAttributeConverter SSOT. length>=512 per PII_PROTECTION_STANDARD §6.';

ALTER TABLE clients
    MODIFY COLUMN emergency_phone VARCHAR(512) NULL
    COMMENT 'PII (AES-256/CBC encrypted). PhoneAttributeConverter SSOT. length>=512 per PII_PROTECTION_STANDARD §6.';
