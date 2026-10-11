-- 2026-10-12 CANCELLED 일정의 client_id 에 해당하는 이름 암호문만 HEX 로 꺼낸다.
-- 평문 이름·연락처·본문은 조회하지 않는다. 페이아웃·급여·재무 전표는 조회하지 않는다.

SELECT 'users' AS src, u.id, IFNULL(u.tenant_id, '') AS tenant_id, IFNULL(HEX(u.name), '') AS name_hex
FROM users u
INNER JOIN (
  SELECT DISTINCT s.client_id AS cid
  FROM schedules s
  WHERE s.`date` = '2026-10-12'
    AND s.status = 'CANCELLED'
    AND s.client_id IS NOT NULL
) c ON c.cid = u.id
UNION ALL
SELECT 'clients' AS src, cl.id, IFNULL(cl.tenant_id, '') AS tenant_id, IFNULL(HEX(cl.name), '') AS name_hex
FROM clients cl
INNER JOIN (
  SELECT DISTINCT s.client_id AS cid
  FROM schedules s
  WHERE s.`date` = '2026-10-12'
    AND s.status = 'CANCELLED'
    AND s.client_id IS NOT NULL
) c ON c.cid = cl.id;
