-- =============================================================================
-- 특별지원금 (special_support_monthly_payouts) — mapping 당 평생 1회 정책 P0 핫픽스
--   (2026-06-01, P0 hotfix — 다른 월에 이미 지급된 mapping 이 재카운트되어 중복 지급 위험)
--
-- 배경:
--   • 운영 https://mindgarden.core-solution.co.kr/admin/erp/salary 의 특별지원금
--     미리보기·확정에서, 4월에 이미 지급된 mapping 이 5월 후보에 다시 잡히는
--     결함이 발견됨.
--   • 운영 실측 (2026-05-31, 5월 미리보기):
--       - 조재은 (consultant_id=22): mapping 36(김남현, 4월 지급) + mapping 89 = ₩20,000
--         기대값 ₩10,000 (mapping 36 은 4월 지급되어 제외되어야 함)
--       - 김선희 (consultant_id=3) : mapping 32(김민선, 4월 지급) + mapping 75 + mapping 88 = ₩30,000
--         기대값 ₩20,000
--   • 근본 원인:
--     - `CalculateSalaryPreview` / `ProcessIntegratedSalaryCalculation` 프로시저의
--       `special_support_monthly_payouts sp` LEFT JOIN 조건이
--         `AND sp.salary_year_month = DATE_FORMAT(p_period_start, '%Y-%m')`
--       을 포함 → 현재 미리보기 월(YYYY-MM)만 검사하여 다른 월의 sp row 가 있어도
--       `sp.id IS NULL` 로 판단되어 mapping 재인정.
--     - UNIQUE 키 `uk_ss_payout_tenant_consultant_mapping_ym`
--       (tenant_id, consultant_id, mapping_id, salary_year_month) 는 같은 mapping
--       의 4월 row + 5월 row 를 별개 INSERT 로 허용 → DB 가드도 부재.
--   • 사용자 정책 확정 (옵션 A):
--     **mapping 당 평생 1회만 지급**. 동일 mapping 이 어느 월에라도 지급되었으면
--     이후 월 재지급 X. 새 mapping (재구매·다른 내담자) 은 별도 지급 OK.
--
-- 정책:
--   • UNIQUE 키를 `(tenant_id, consultant_id, mapping_id)` 로 변경 (salary_year_month 제거).
--   • 프로시저 본문 3행 (LEFT JOIN sp ... AND sp.salary_year_month = ...) 제거는
--     아래 §4 참고 — 별도 워크플로로 적용.
--   • INSERT 본문의 `salary_year_month` 컬럼 값은 그대로 보존 — 어느 월에 지급되었는지
--     감사 기록 유지 (집계·리포트용).
--   • 멀티테넌트 가드: UNIQUE 키에 `tenant_id` 포함 유지.
--
-- 멱등성:
--   • 기존 UNIQUE 키 존재 시에만 DROP (이미 새 키가 적용된 환경에서 NO-OP).
--   • 새 UNIQUE 키 미존재 시에만 ADD.
--   • 데이터 정합성: ALTER ADD UNIQUE 실패 방지를 위해, 같은 (tenant_id, consultant_id, mapping_id)
--     으로 중복 row 가 존재하면 MIN(id) 외 행을 삭제 (감사 보존: 가장 오래된 = 첫 지급 row 보존).
--     운영 5월 확정 전 적용을 전제 (대부분 NO-OP).
--
-- 운영 적용 이력:
--   • 2026-06-01 1차 시도 (runId 26740673792) — 본 마이그에 DROP/CREATE PROCEDURE 본문 포함하여
--     실행했으나 운영 DB 의 mindgarden 계정 SYSTEM_USER privilege 부재로 ERROR 1227 발생,
--     비활성 슬롯 기동 실패, Nginx 전환 생략됨. 운영은 직전 commit (6d68d78) 그대로 유지.
--   • 2026-06-01 2차 (본 단축본) — 프로시저 본문 제거, ALTER TABLE 가드 + dedup 만 유지.
--     운영 DB 의 V20260607_002 failed row (rank 252) 는 직접 DELETE 처리 후 재적용.
--
-- §4. 프로시저 본문 적용 (운영 권한 분리):
--   • SYSTEM_USER privilege 부재로 Flyway 마이그를 통한 DROP/CREATE PROCEDURE 가 불가능하므로
--     프로시저 본문은 별도 워크플로
--       `.github/workflows/deploy-procedures-production-mysql.yml`
--       (또는 `database/schema/procedures_standardized/deploy_standardized_procedures.sh`)
--     를 통해 SYSTEM_USER 권한 계정으로 적용한다.
--   • SSOT 본문 (LEFT JOIN sp 의 salary_year_month 조건 제거 반영됨, PR #82):
--       - database/schema/procedures_standardized/CalculateSalaryPreview_standardized.sql
--       - database/schema/procedures_standardized/ProcessIntegratedSalaryCalculation_standardized.sql
--   • UNIQUE 키 변경(§§2-3) 이후에 프로시저 본문을 적용해야 한다 (DB 가드 → 코드 가드 순서).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. (방어) 동일 (tenant_id, consultant_id, mapping_id) 중복 row 정리 — MIN(id) 보존
--    핫픽스 적용 시점이 4월 → 5월 사이라 운영에는 보통 dup 미존재. 안전상 멱등 정리.
-- -----------------------------------------------------------------------------
DELETE sp FROM special_support_monthly_payouts sp
INNER JOIN (
    SELECT tenant_id, consultant_id, mapping_id, MIN(id) AS keep_id
    FROM special_support_monthly_payouts
    GROUP BY tenant_id, consultant_id, mapping_id
    HAVING COUNT(*) > 1
) dup
   ON dup.tenant_id     = sp.tenant_id
  AND dup.consultant_id = sp.consultant_id
  AND dup.mapping_id    = sp.mapping_id
WHERE sp.id <> dup.keep_id;

-- -----------------------------------------------------------------------------
-- 2. 기존 UNIQUE 키 DROP (멱등) — uk_ss_payout_tenant_consultant_mapping_ym
-- -----------------------------------------------------------------------------
SET @dbname = (SELECT DATABASE());

SET @drop_old_uk = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME   = 'special_support_monthly_payouts'
         AND INDEX_NAME   = 'uk_ss_payout_tenant_consultant_mapping_ym') > 0,
    'ALTER TABLE special_support_monthly_payouts DROP INDEX uk_ss_payout_tenant_consultant_mapping_ym',
    'SELECT ''uk_ss_payout_tenant_consultant_mapping_ym already absent — no drop'' AS info'
));
PREPARE st1 FROM @drop_old_uk;
EXECUTE st1;
DEALLOCATE PREPARE st1;

-- -----------------------------------------------------------------------------
-- 3. 신규 UNIQUE 키 ADD (멱등) — uk_ss_payout_tenant_consultant_mapping
--    mapping 당 평생 1회 정책 강제 (tenant_id 멀티테넌트 격리 포함)
-- -----------------------------------------------------------------------------
SET @add_new_uk = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME   = 'special_support_monthly_payouts'
         AND INDEX_NAME   = 'uk_ss_payout_tenant_consultant_mapping') = 0,
    'ALTER TABLE special_support_monthly_payouts ADD UNIQUE KEY uk_ss_payout_tenant_consultant_mapping (tenant_id, consultant_id, mapping_id)',
    'SELECT ''uk_ss_payout_tenant_consultant_mapping already present — no add'' AS info'
));
PREPARE st2 FROM @add_new_uk;
EXECUTE st2;
DEALLOCATE PREPARE st2;

-- 끝. (프로시저 본문은 §4 의 별도 워크플로로 적용.)
