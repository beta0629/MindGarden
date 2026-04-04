-- 상담 가능 시간 종료를 18:00 → 20:00으로 확장 (예약 슬롯 17시대 이후 노출)
-- NULL/빈 값·기존 09:00-18:00 만 갱신 (다른 커스텀 시간대는 유지)

UPDATE consultants
SET consultation_hours = '09:00-20:00'
WHERE consultation_hours IS NULL
   OR TRIM(consultation_hours) = ''
   OR consultation_hours = '09:00-18:00';
