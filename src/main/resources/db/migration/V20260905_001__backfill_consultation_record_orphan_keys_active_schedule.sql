-- =============================================================================
-- V20260905_001 — orphan consultation_records.consultation_id → 활성 schedules.id 재매핑
--
-- 목적:
--   V20260903_003 Step2 는 NOT EXISTS (schedules.id = cr.consultation_id) 만 검사해
--   soft-deleted schedules.id 를 가리키는 orphan 을 재매핑하지 않았다.
--   본 마이그레이션은 «비삭제 schedules.id 와 매칭되지 않는» 비삭제 CR 을
--   tenant+consultant+client+session_date 유일 활성 스케줄로 정규화한다.
--
-- SSOT (읽기):
--   monthly/cumulative missing · incomplete · hasConsultationRecordForSchedule
--   공통 A|B — A: r.consultation_id = s.id / B: consultant+client+session_date
--
-- Skip 규칙:
--   • 동일 tenant+consultant+client+session_date 활성 스케줄 0건 또는 2건+ → skip
--   • start_time 등으로 임의 1건 선택 금지
--   • amounts/ledger 테이블 금지
--   • tenant/id 하드코딩 금지
--
-- MySQL 정본: UPDATE … INNER JOIN (…) … SET … WHERE …
-- =============================================================================

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
      FROM schedules s_active
      WHERE s_active.id = cr.consultation_id
        AND s_active.tenant_id = cr.tenant_id
        AND (s_active.is_deleted = FALSE OR s_active.is_deleted IS NULL)
  );
