-- =============================================================================
-- V20260904_002 — consultation_records 스케줄 링크·session_date 수리
--
-- 배경: V20260903_003 은 session_date 불일치 시 Step2 skip.
--       wrong consultation_id + session_date drift 이면 A·B 모두 실패해
--       COMPLETED 일정이 «누락» 오탐으로 남음 (예: 2026-09-01 류).
--
-- Step1: consultation_id = schedules.id 인데 session_date ≠ s.date (또는 NULL)
--        → SET session_date = s.date
-- Step2: orphan consultation_id + tenant+consultant+client 유일 적격 스케줄
--        (status IN COMPLETED/CONFIRMED/BOOKED — ScheduleStatus enum name)
--        session_date 일치 불필요 → SET consultation_id, session_date
-- Step3: legacy consultations.id → 유일 schedules.consultation_id 링크 시
--        consultation_id + session_date 동시 세팅 (V003 Step1 보강)
--
-- 규칙: 0건/다건(모호) skip · amounts/ledger 금지 · MySQL UPDATE…JOIN…SET 필수
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step1: A 키 일치 행의 session_date 동기화
-- -----------------------------------------------------------------------------
UPDATE consultation_records cr
INNER JOIN schedules s
    ON s.id = cr.consultation_id
   AND s.tenant_id = cr.tenant_id
   AND (s.is_deleted = FALSE OR s.is_deleted IS NULL)
SET cr.session_date = s.date
WHERE (cr.is_deleted = FALSE OR cr.is_deleted IS NULL)
  AND s.date IS NOT NULL
  AND (cr.session_date IS NULL OR cr.session_date <> s.date);

-- -----------------------------------------------------------------------------
-- Step2: orphan consultation_id — consultant+client 유일 적격 스케줄로 정규화
--   상태 literal = ScheduleStatus enum name (COMPLETED, CONFIRMED, BOOKED)
--   session_date 일치 불필요 (V003 Step2 와의 차이)
-- -----------------------------------------------------------------------------
UPDATE consultation_records cr
INNER JOIN (
    SELECT
        s.tenant_id AS tenant_id,
        s.consultant_id AS consultant_id,
        s.client_id AS client_id,
        MIN(s.id) AS schedule_id,
        MIN(s.date) AS schedule_date
    FROM schedules s
    WHERE s.consultant_id IS NOT NULL
      AND s.client_id IS NOT NULL
      AND s.date IS NOT NULL
      AND (s.is_deleted = FALSE OR s.is_deleted IS NULL)
      AND s.status IN ('COMPLETED', 'CONFIRMED', 'BOOKED')
    GROUP BY s.tenant_id, s.consultant_id, s.client_id
    HAVING COUNT(*) = 1
) uniq
    ON uniq.tenant_id = cr.tenant_id
   AND uniq.consultant_id = cr.consultant_id
   AND uniq.client_id = cr.client_id
SET cr.consultation_id = uniq.schedule_id,
    cr.session_date = uniq.schedule_date
WHERE (cr.is_deleted = FALSE OR cr.is_deleted IS NULL)
  AND cr.consultant_id IS NOT NULL
  AND cr.client_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM schedules s_self
      WHERE s_self.id = cr.consultation_id
        AND s_self.tenant_id = cr.tenant_id
  );

-- -----------------------------------------------------------------------------
-- Step3: legacy consultations.id → 유일 schedule + session_date 동시 세팅
-- -----------------------------------------------------------------------------
UPDATE consultation_records cr
INNER JOIN (
    SELECT
        s.tenant_id AS tenant_id,
        s.consultation_id AS legacy_consultation_id,
        MIN(s.id) AS schedule_id,
        MIN(s.date) AS schedule_date
    FROM schedules s
    WHERE s.consultation_id IS NOT NULL
      AND (s.is_deleted = FALSE OR s.is_deleted IS NULL)
    GROUP BY s.tenant_id, s.consultation_id
    HAVING COUNT(*) = 1
) uniq
    ON uniq.tenant_id = cr.tenant_id
   AND uniq.legacy_consultation_id = cr.consultation_id
SET cr.consultation_id = uniq.schedule_id,
    cr.session_date = uniq.schedule_date
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
