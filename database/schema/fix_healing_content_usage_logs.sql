-- 힐링 컨텐츠 사용 로그의 estimatedCost null 값 수정
-- 실행 날짜: 2025-01-22
-- 목적: estimatedCost가 null인 레코드들의 비용을 재계산

-- 1. estimatedCost가 null인 레코드 확인
SELECT 
    id,
    request_type,
    model,
    prompt_tokens,
    completion_tokens,
    total_tokens,
    estimated_cost,
    created_at
FROM openai_usage_logs 
WHERE estimated_cost IS NULL 
ORDER BY created_at DESC
LIMIT 10;

-- 2. estimatedCost가 null인 레코드들의 비용 재계산
UPDATE openai_usage_logs 
SET estimated_cost = (
    CASE 
        WHEN prompt_tokens IS NOT NULL AND completion_tokens IS NOT NULL THEN
            ((prompt_tokens / 1000.0) * 0.0015) + ((completion_tokens / 1000.0) * 0.002)
        ELSE 0.0
    END
)
WHERE estimated_cost IS NULL 
AND prompt_tokens IS NOT NULL 
AND completion_tokens IS NOT NULL;

-- 3. 여전히 null인 레코드들은 0으로 설정
UPDATE openai_usage_logs 
SET estimated_cost = 0.0
WHERE estimated_cost IS NULL;

-- 4. 수정 결과 확인
SELECT 
    COUNT(*) as total_records,
    COUNT(estimated_cost) as records_with_cost,
    SUM(estimated_cost) as total_cost,
    AVG(estimated_cost) as avg_cost
FROM openai_usage_logs;

-- 5. 최근 힐링 컨텐츠 사용 로그 확인
SELECT 
    id,
    request_type,
    model,
    total_tokens,
    estimated_cost,
    created_at
FROM openai_usage_logs 
WHERE request_type = 'HEALING_CONTENT'
ORDER BY created_at DESC
LIMIT 10;
