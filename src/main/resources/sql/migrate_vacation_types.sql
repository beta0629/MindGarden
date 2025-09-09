-- 기존 MORNING_HALF, AFTERNOON_HALF 데이터를 새로운 반반차 유형으로 마이그레이션

-- MORNING_HALF를 MORNING_HALF_1로 변경 (09:00-11:00)
UPDATE vacations 
SET vacation_type = 'MORNING_HALF_1' 
WHERE vacation_type = 'MORNING_HALF';

-- AFTERNOON_HALF를 AFTERNOON_HALF_1로 변경 (14:00-16:00)  
UPDATE vacations 
SET vacation_type = 'AFTERNOON_HALF_1' 
WHERE vacation_type = 'AFTERNOON_HALF';

-- 업데이트된 데이터 확인
SELECT id, consultant_id, vacation_type, start_date, end_date, start_time, end_time 
FROM vacations 
WHERE vacation_type LIKE '%HALF%' 
ORDER BY id;
