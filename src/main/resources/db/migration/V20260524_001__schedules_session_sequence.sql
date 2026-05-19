-- 예약 시점 회차(1-based). 회기 차감 직전 remaining 기준으로 애플리케이션에서 설정.
-- 아래 UPDATE 백필은 기존 일정에 순번만 부여하며, consultant_client_mappings 회기 차감(used/remaining)과 무관함.
ALTER TABLE schedules
    ADD COLUMN session_sequence INT NULL COMMENT '예약 시점 회차(1-based)' AFTER client_id;

-- 기존 상담 일정 백필: tenant·상담사·내담자별 date·start_time 순 1..N (취소·가예약 제외)
UPDATE schedules s
    INNER JOIN (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY tenant_id, consultant_id, client_id
                   ORDER BY date ASC, start_time ASC, id ASC
               ) AS seq_num
        FROM schedules
        WHERE (is_deleted = 0 OR is_deleted IS NULL)
          AND client_id IS NOT NULL
          AND schedule_type = 'CONSULTATION'
          AND status IN ('BOOKED', 'CONFIRMED', 'COMPLETED')
    ) ranked ON s.id = ranked.id
SET s.session_sequence = ranked.seq_num;
