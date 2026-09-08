-- ============================================================================
-- 회기 추가(SessionExtension) COMPLETED 요청 중 FinancialTransaction(INCOME) 누락 후보 조회
-- ============================================================================
-- 목적:
--   김선희(상담사) → 김민선(내담자) 등, 회기는 이미 합산(+10)됐지만
--   SESSION_EXTENSION_REQUEST 연동 수입 원장만 빠진 건을 찾는다.
--
-- 사용법:
--   1) 아래 @tenant_id 를 대상 테넌트로 설정
--   2) (선택) 이름/패키지 필터를 조정
--   3) mysql 클라이언트에서 읽기 전용으로 실행
--
-- 중요 (운영 안전):
--   ★ 이 스크립트는 DISCOVERY ONLY (SELECT) 이다.
--   ★ session counts / total_sessions / remaining_sessions 를 절대 UPDATE 하지 말 것.
--   ★ financial_transactions INSERT 를 SQL 로 직접 하지 말 것 (VAT SSOT·분개 경로 우회 위험).
--   ★ 누락 원장 복구는 배포 후 관리자 API 를 사용:
--       POST /api/v1/erp/accounting/backfill-session-extension-income
--     (테넌트 컨텍스트 + ADMIN 세션 필수, idempotent, 회기 동기화 없음)
--
-- 작성일: 2026-09-08
-- ============================================================================

-- 대상 테넌트 (필수)
SET @tenant_id = 'REPLACE_WITH_TENANT_ID';

-- (선택) 이름 필터 — 김선희→김민선 케이스용. 전체 테넌트 스캔 시 '%' 로 둔다.
SET @consultant_name_like = '%김선희%';
SET @client_name_like = '%김민선%';

-- (선택) 패키지/회기 패턴 — 기본10회기 + 추가 후 total_sessions=20 등
SET @package_name_like = '%기본%10%';
SET @mapping_total_sessions_min = 20;

-- --------------------------------------------------------------------------
-- A) 이름 기반: COMPLETED 회기추가 + FT(INCOME, SESSION_EXTENSION_REQUEST) 없음
-- --------------------------------------------------------------------------
SELECT
    ser.tenant_id,
    ser.id AS session_extension_request_id,
    ser.status,
    ser.additional_sessions,
    ser.package_name AS request_package_name,
    ser.package_price AS request_package_price,
    ser.payment_method,
    ser.payment_date,
    ser.created_at AS request_created_at,
    m.id AS mapping_id,
    m.package_name AS mapping_package_name,
    m.total_sessions AS mapping_total_sessions,
    m.remaining_sessions AS mapping_remaining_sessions,
    m.used_sessions AS mapping_used_sessions,
    consultant.id AS consultant_id,
    consultant.name AS consultant_name,
    client.id AS client_id,
    client.name AS client_name,
    ft.id AS existing_income_ft_id
FROM session_extension_requests ser
INNER JOIN consultant_client_mappings m
    ON m.id = ser.mapping_id
   AND m.tenant_id = ser.tenant_id
INNER JOIN users consultant
    ON consultant.id = m.consultant_id
   AND consultant.tenant_id = ser.tenant_id
INNER JOIN users client
    ON client.id = m.client_id
   AND client.tenant_id = ser.tenant_id
LEFT JOIN financial_transactions ft
    ON ft.tenant_id = ser.tenant_id
   AND ft.related_entity_type = 'SESSION_EXTENSION_REQUEST'
   AND ft.related_entity_id = ser.id
   AND ft.transaction_type = 'INCOME'
   AND (ft.is_deleted = 0 OR ft.is_deleted IS FALSE)
WHERE ser.tenant_id = @tenant_id
  AND ser.status = 'COMPLETED'
  AND ser.package_price IS NOT NULL
  AND ser.package_price > 0
  AND consultant.name LIKE @consultant_name_like
  AND client.name LIKE @client_name_like
  AND ft.id IS NULL
ORDER BY ser.id ASC;

-- --------------------------------------------------------------------------
-- B) 패키지/회기 패턴 보조 조회 (이름 불명확할 때)
--    예: 요청 패키지명에 기본·10, 매핑 total_sessions >= 20
-- --------------------------------------------------------------------------
SELECT
    ser.tenant_id,
    ser.id AS session_extension_request_id,
    ser.package_name AS request_package_name,
    ser.package_price AS request_package_price,
    ser.additional_sessions,
    m.id AS mapping_id,
    m.package_name AS mapping_package_name,
    m.total_sessions AS mapping_total_sessions,
    consultant.name AS consultant_name,
    client.name AS client_name
FROM session_extension_requests ser
INNER JOIN consultant_client_mappings m
    ON m.id = ser.mapping_id
   AND m.tenant_id = ser.tenant_id
INNER JOIN users consultant
    ON consultant.id = m.consultant_id
   AND consultant.tenant_id = ser.tenant_id
INNER JOIN users client
    ON client.id = m.client_id
   AND client.tenant_id = ser.tenant_id
LEFT JOIN financial_transactions ft
    ON ft.tenant_id = ser.tenant_id
   AND ft.related_entity_type = 'SESSION_EXTENSION_REQUEST'
   AND ft.related_entity_id = ser.id
   AND ft.transaction_type = 'INCOME'
   AND (ft.is_deleted = 0 OR ft.is_deleted IS FALSE)
WHERE ser.tenant_id = @tenant_id
  AND ser.status = 'COMPLETED'
  AND ser.package_price IS NOT NULL
  AND ser.package_price > 0
  AND (
        ser.package_name LIKE @package_name_like
     OR m.package_name LIKE @package_name_like
     OR m.total_sessions >= @mapping_total_sessions_min
  )
  AND ft.id IS NULL
ORDER BY ser.id ASC;

-- --------------------------------------------------------------------------
-- C) 테넌트 전체: COMPLETED + package_price>0 + FT 없음 (건수·샘플)
-- --------------------------------------------------------------------------
SELECT
    COUNT(*) AS missing_income_ft_count,
    COALESCE(SUM(ser.package_price), 0) AS missing_income_ft_amount_sum
FROM session_extension_requests ser
LEFT JOIN financial_transactions ft
    ON ft.tenant_id = ser.tenant_id
   AND ft.related_entity_type = 'SESSION_EXTENSION_REQUEST'
   AND ft.related_entity_id = ser.id
   AND ft.transaction_type = 'INCOME'
   AND (ft.is_deleted = 0 OR ft.is_deleted IS FALSE)
WHERE ser.tenant_id = @tenant_id
  AND ser.status = 'COMPLETED'
  AND ser.package_price IS NOT NULL
  AND ser.package_price > 0
  AND ft.id IS NULL;

-- --------------------------------------------------------------------------
-- 복구 절차 (SQL INSERT 금지 — 아래 API 사용)
-- --------------------------------------------------------------------------
-- 1. 배포 후 해당 테넌트 ADMIN 으로 로그인
-- 2. POST /api/v1/erp/accounting/backfill-session-extension-income
-- 3. 응답 확인:
--      scanned / created / skippedExisting / skippedNoAmount
--      createdItems: [{ requestId, amount }, ...]  (최대 100)
-- 4. 김민선 건이면 createdItems 에 requestId 와 package_price(예: 800000) 가 있는지 확인
-- 5. (선택) 본 스크립트 A) 재실행 → 해당 request 가 더 이상 나오지 않아야 함
-- 6. 회기 수(total_sessions 등)는 배포 전·후 동일해야 함 — 백필은 회기를 건드리지 않음
