-- ============================================
-- 레거시 정합: clients.tenant_id 를 동일 PK users.tenant_id 에 맞춤 (내담자만)
-- ============================================
-- 목적: users ↔ clients 가 동일 id 로 1:1 인 행에서 tenant_id 가 어긋난 경우
--       users 기준으로 정리하여 통계·표시 정합성을 맞춘다.
-- 운영: 적용 전 백업·행 수 확인 권장. 의도적으로 clients/users 테넌트를 다르게 둔
--       설계는 없다는 전제이며, 스테이징에서 먼저 실행·검증하는 것을 권장한다.
-- @author MindGarden
-- @since 2026-03-29
-- ============================================

UPDATE clients c
INNER JOIN users u ON c.id = u.id
SET c.tenant_id = u.tenant_id
WHERE u.role = 'CLIENT'
  AND c.tenant_id IS NOT NULL
  AND u.tenant_id IS NOT NULL
  AND c.tenant_id <> u.tenant_id;
