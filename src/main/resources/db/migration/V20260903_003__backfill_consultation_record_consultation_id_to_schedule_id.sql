-- =============================================================================
-- V20260903_003 — consultation_records.consultation_id 를 schedules.id 로 백필
--
-- 읽기 SSOT: ConsultationRecord.consultationId = Schedule.id
-- 레거시: consultation_records.consultation_id 가 consultations.id 이거나
--         어떤 schedules.id 와도 맞지 않으면 JOIN(A: r.consultationId = s.id) 불일치로
--         완료 일지가 «누락»에 남음. (예: .dev DevConsultant-000003 2026-09-01 /
--         운영 김선희 동계열)
--
-- Step1: consultations.id → 단일 schedules.id (schedules.consultation_id 링크)
-- Step2: consultation_id 가 어떤 schedules.id 와도 안 맞을 때,
--        동일 tenant+consultant+client+session_date 비삭제 스케줄이 정확히 1건이면
--        cr.consultation_id = s.id 로 갱신 (B 경로와 동일 의미의 쓰기 정규화)
--
-- 규칙 (공통):
--   • 0건/다건(모호)이면 skip
--   • amounts/ledger 테이블 금지
--   • 테스트 환경에서 본 SQL 실행이 어려우면 Java missing 쿼리(B) 회귀 테스트가 SSOT
--   • MySQL UPDATE … JOIN 은 SET 절 필수 (UPDATE alias JOIN … SET … WHERE; SET 누락 시 1064)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step1: 기존 consultations.id → 단일 schedules.id
--   • 동일 tenant 에서 schedules.consultation_id = 레거시 값인 스케줄이 정확히 1건일 때만
--   • 이미 schedules.id 를 가리키는 행은 제외
-- -----------------------------------------------------------------------------
UPDATE consultation_records cr
INNER JOIN (
    SELECT
        s.tenant_id AS tenant_id,
        s.consultation_id AS legacy_consultation_id,
        MIN(s.id) AS schedule_id
    FROM schedules s
    WHERE s.consultation_id IS NOT NULL
      AND (s.is_deleted = FALSE OR s.is_deleted IS NULL)
    GROUP BY s.tenant_id, s.consultation_id
    HAVING COUNT(*) = 1
) uniq
    ON uniq.tenant_id = cr.tenant_id
   AND uniq.legacy_consultation_id = cr.consultation_id
SET cr.consultation_id = uniq.schedule_id
WHERE (cr.is_deleted = FALSE OR cr.is_deleted IS NULL)
  AND EXISTS (
      SELECT 1
      FROM consultations c
      WHERE c.id = cr.consultation_id
        AND c.tenant_id = cr.tenant_id
  )
  AND NOT EXISTS (
      SELECT 1
      FROM schedules s_self
      WHERE s_self.id = cr.consultation_id
        AND s_self.tenant_id = cr.tenant_id
  );

-- -----------------------------------------------------------------------------
-- Step2: consultation_id 가 어떤 schedules.id 와도 안 맞을 때
--        tenant+consultant+client+session_date 가 정확히 1건인 비삭제 스케줄로 갱신
-- -----------------------------------------------------------------------------
UPDATE consultation_records cr
INNER JOIN (
    SELECT
        s.tenant_id AS tenant_id,
        s.consultant_id AS consultant_id,
        s.client_id AS client_id,
        s.date AS session_date,
        MIN(s.id) AS schedule_id
    FROM schedules s
    WHERE s.consultant_id IS NOT NULL
      AND s.client_id IS NOT NULL
      AND s.date IS NOT NULL
      AND (s.is_deleted = FALSE OR s.is_deleted IS NULL)
    GROUP BY s.tenant_id, s.consultant_id, s.client_id, s.date
    HAVING COUNT(*) = 1
) uniq
    ON uniq.tenant_id = cr.tenant_id
   AND uniq.consultant_id = cr.consultant_id
   AND uniq.client_id = cr.client_id
   AND uniq.session_date = cr.session_date
SET cr.consultation_id = uniq.schedule_id
WHERE (cr.is_deleted = FALSE OR cr.is_deleted IS NULL)
  AND cr.consultant_id IS NOT NULL
  AND cr.client_id IS NOT NULL
  AND cr.session_date IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM schedules s_self
      WHERE s_self.id = cr.consultation_id
        AND s_self.tenant_id = cr.tenant_id
  );
