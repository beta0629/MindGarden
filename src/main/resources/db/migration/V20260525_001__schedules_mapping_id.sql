-- 일정별 예약 시점 매칭 고정 (단회기·다회기 전환 시 캘린더 회기 표기 SSOT)
-- V20260524_001 백필 UPDATE는 순번만 부여하며 mapping 회기 차감(used/remaining)과 무관함(해당 파일은 운영 적용 후 수정 금지).
ALTER TABLE schedules
    ADD COLUMN mapping_id BIGINT NULL COMMENT '예약·차감 시점 consultant_client_mappings.id' AFTER session_sequence;

CREATE INDEX idx_schedules_tenant_mapping ON schedules (tenant_id, mapping_id);

-- mapping_id 백필: 일정 created_at 기준 유효 매칭(TERMINATED 포함), 복수 후보 시 최근 생성 매칭
UPDATE schedules s
    INNER JOIN (
        SELECT s2.id AS schedule_id,
               (
                   SELECT m.id
                   FROM consultant_client_mappings m
                   WHERE m.tenant_id = s2.tenant_id
                     AND m.consultant_id = s2.consultant_id
                     AND m.client_id = s2.client_id
                     AND s2.created_at >= m.created_at
                     AND (m.terminated_at IS NULL OR s2.created_at < m.terminated_at)
                   ORDER BY m.created_at DESC
                   LIMIT 1
               ) AS resolved_mapping_id
        FROM schedules s2
        WHERE (s2.is_deleted = 0 OR s2.is_deleted IS NULL)
          AND s2.client_id IS NOT NULL
          AND s2.consultant_id IS NOT NULL
          AND s2.schedule_type = 'CONSULTATION'
    ) pick ON s.id = pick.schedule_id
SET s.mapping_id = pick.resolved_mapping_id
WHERE pick.resolved_mapping_id IS NOT NULL;

-- session_sequence 재백필: 매핑 단위 누적 (취소·가예약 제외)
UPDATE schedules s
    INNER JOIN (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY mapping_id
                   ORDER BY date ASC, start_time ASC, id ASC
               ) AS seq_num
        FROM schedules
        WHERE (is_deleted = 0 OR is_deleted IS NULL)
          AND mapping_id IS NOT NULL
          AND client_id IS NOT NULL
          AND schedule_type = 'CONSULTATION'
          AND status IN ('BOOKED', 'CONFIRMED', 'COMPLETED')
    ) ranked ON s.id = ranked.id
SET s.session_sequence = ranked.seq_num;
