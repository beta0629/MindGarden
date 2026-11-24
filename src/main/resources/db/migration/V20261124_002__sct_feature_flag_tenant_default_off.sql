-- 운영 안전 — 테넌트 feature.sct.enabled 전부 false; 003 마인드가든 name 매칭 방식 사용 금지; UUID 하드코딩 금지; 삭제 금지(설정 GET이 값 유지); 멱등.
-- @author MindGarden
-- @since 2026-11-24

-- 모든 테넌트 오버라이드 행 OFF (tenant_id <> '')
UPDATE system_config
SET config_value = 'false',
    updated_at = NOW()
WHERE config_key = 'feature.sct.enabled'
  AND tenant_id <> '';

-- 전역(tenant_id='')도 false 유지 (멱등, 행 삭제 금지)
UPDATE system_config
SET config_value = 'false',
    updated_at = NOW()
WHERE config_key = 'feature.sct.enabled'
  AND tenant_id = '';
