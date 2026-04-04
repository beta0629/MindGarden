-- ====================================================================
-- PRIORITY 공통코드 표시 라벨 한글·아이콘 정합 (상담일지 UI)
-- ====================================================================
-- 배경: code_label 이 영문(Low Priority 등)이면 API·관리 화면에도 영문 노출.
-- 목적: 코어 PRIORITY 5건의 code_label / korean_name / icon 을 UI와 동일하게 정리.
-- ====================================================================

UPDATE common_codes
SET
    code_label = '낮음',
    korean_name = '낮음',
    code_description = '낮은 우선순위',
    icon = '🟢',
    updated_at = NOW()
WHERE tenant_id IS NULL
  AND code_group = 'PRIORITY'
  AND code_value = 'LOW';

UPDATE common_codes
SET
    code_label = '보통',
    korean_name = '보통',
    code_description = '보통 우선순위',
    icon = '🟡',
    updated_at = NOW()
WHERE tenant_id IS NULL
  AND code_group = 'PRIORITY'
  AND code_value = 'MEDIUM';

UPDATE common_codes
SET
    code_label = '높음',
    korean_name = '높음',
    code_description = '높은 우선순위',
    icon = '🟠',
    updated_at = NOW()
WHERE tenant_id IS NULL
  AND code_group = 'PRIORITY'
  AND code_value = 'HIGH';

UPDATE common_codes
SET
    code_label = '긴급',
    korean_name = '긴급',
    code_description = '긴급 우선순위',
    icon = '🔴',
    updated_at = NOW()
WHERE tenant_id IS NULL
  AND code_group = 'PRIORITY'
  AND code_value = 'URGENT';

UPDATE common_codes
SET
    code_label = '위험',
    korean_name = '위험',
    code_description = '치명적 위험',
    icon = '🟣',
    updated_at = NOW()
WHERE tenant_id IS NULL
  AND code_group = 'PRIORITY'
  AND code_value = 'CRITICAL';
