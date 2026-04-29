-- 내담자 특이사항: 해소(완료) 시각 — 미해소 건은 누적 표시·탭 카운트용
-- @author CoreSolution
-- @since 2026-04-30

ALTER TABLE client_schedule_notes
    ADD COLUMN resolved_at DATETIME(6) NULL COMMENT '해소 처리 시각; NULL이면 미해소' AFTER promise_date;
