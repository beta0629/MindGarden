-- 샘플 상담이력 데이터 삽입
-- 먼저 기존 데이터 확인
SELECT COUNT(*) as total_records FROM consultation_records;

-- 샘플 상담이력 데이터 삽입
-- (consultantId와 clientId는 실제 존재하는 ID로 변경 필요)

-- 먼저 consultantId, clientId 확인
SELECT id, name FROM consultants WHERE is_active = 1 LIMIT 1;
SELECT id, name FROM users WHERE role = 'CLIENT' AND is_active = 1 LIMIT 1;

-- 샘플 데이터 삽입 (실제 값으로 교체 필요)
INSERT INTO consultation_records (
    consultation_id,
    consultant_id,
    client_id,
    session_date,
    session_number,
    session_duration_minutes,
    progress_score,
    risk_assessment,
    client_condition,
    main_issues,
    intervention_methods,
    client_response,
    consultant_observations,
    consultant_assessment,
    is_session_completed,
    is_deleted,
    created_at,
    updated_at
) VALUES (
    1,  -- consultation_id
    1,  -- consultant_id (실제 존재하는 ID로 변경)
    1,  -- client_id (실제 존재하는 ID로 변경)
    CURDATE(),  -- session_date
    1,  -- session_number
    60,  -- session_duration_minutes
    5,  -- progress_score
    'LOW',  -- risk_assessment
    'Good',  -- client_condition
    'Stress management',  -- main_issues
    'CBT',  -- intervention_methods
    'Positive',  -- client_response
    'Client showed improvement',  -- consultant_observations
    'Continue current approach',  -- consultant_assessment
    true,  -- is_session_completed
    false,  -- is_deleted
    NOW(),  -- created_at
    NOW()   -- updated_at
);

-- 데이터 확인
SELECT * FROM consultation_records ORDER BY id DESC LIMIT 5;

