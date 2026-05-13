-- 상담 가능 시간 종료 20:00 → 21:00 (20:00 시작 슬롯·20~21시 예약 노출)
-- 기본 패턴 09:00-20:00 만 갱신 (다른 커스텀 시간대는 유지)

UPDATE consultants
SET consultation_hours = '09:00-21:00'
WHERE consultation_hours = '09:00-20:00';
