# 통계 권한 추가 배포 가이드

## 개요
HQ_ADMIN, SUPER_HQ_ADMIN, HQ_MASTER 역할에 REPORT_VIEW, DASHBOARD_VIEW 권한을 추가합니다.

## 배포 방법

### 1. SSH로 서버 접속
```bash
ssh root@beta74.cafe24.com
```

### 2. 데이터베이스 접속
```bash
cd /home/mindgarden
mysql -u mindgarden -p mind_garden
# 비밀번호 입력
```

### 3. SQL 실행
```sql
-- HQ_ADMIN, SUPER_HQ_ADMIN, HQ_MASTER에 REPORT_VIEW, DASHBOARD_VIEW 권한 추가

-- 먼저 권한이 존재하는지 확인하고 없으면 추가
INSERT INTO permission (permission_code, permission_name, category, created_at, updated_at)
SELECT 'REPORT_VIEW', '보고서 조회', 'STATISTICS', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permission WHERE permission_code = 'REPORT_VIEW');

INSERT INTO permission (permission_code, permission_name, category, created_at, updated_at)
SELECT 'DASHBOARD_VIEW', '대시보드 조회', 'STATISTICS', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permission WHERE permission_code = 'DASHBOARD_VIEW');

-- HQ_ADMIN에 권한 추가
INSERT INTO role_permission (role_name, permission_code, is_active, created_at, updated_at)
SELECT 'HQ_ADMIN', 'REPORT_VIEW', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM role_permission WHERE role_name = 'HQ_ADMIN' AND permission_code = 'REPORT_VIEW');

INSERT INTO role_permission (role_name, permission_code, is_active, created_at, updated_at)
SELECT 'HQ_ADMIN', 'DASHBOARD_VIEW', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM role_permission WHERE role_name = 'HQ_ADMIN' AND permission_code = 'DASHBOARD_VIEW');

-- SUPER_HQ_ADMIN에 권한 추가
INSERT INTO role_permission (role_name, permission_code, is_active, created_at, updated_at)
SELECT 'SUPER_HQ_ADMIN', 'REPORT_VIEW', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM role_permission WHERE role_name = 'SUPER_HQ_ADMIN' AND permission_code = 'REPORT_VIEW');

INSERT INTO role_permission (role_name, permission_code, is_active, created_at, updated_at)
SELECT 'SUPER_HQ_ADMIN', 'DASHBOARD_VIEW', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM role_permission WHERE role_name = 'SUPER_HQ_ADMIN' AND permission_code = 'DASHBOARD_VIEW');

-- HQ_MASTER에 권한 추가
INSERT INTO role_permission (role_name, permission_code, is_active, created_at, updated_at)
SELECT 'HQ_MASTER', 'REPORT_VIEW', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM role_permission WHERE role_name = 'HQ_MASTER' AND permission_code = 'REPORT_VIEW');

INSERT INTO role_permission (role_name, permission_code, is_active, created_at, updated_at)
SELECT 'HQ_MASTER', 'DASHBOARD_VIEW', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM role_permission WHERE role_name = 'HQ_MASTER' AND permission_code = 'DASHBOARD_VIEW');

-- 결과 확인
SELECT role_name, permission_code, is_active 
FROM role_permission 
WHERE permission_code IN ('REPORT_VIEW', 'DASHBOARD_VIEW') 
  AND role_name IN ('HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER');
```

### 4. 결과 확인
위 쿼리를 실행하면 추가된 권한 목록이 표시됩니다.

### 5. 권한 캐시 초기화
```bash
curl -X POST http://localhost:8080/api/tools/permission-cache/clear
```

또는 애플리케이션 재시작:
```bash
sudo systemctl restart mindgarden.service
sudo systemctl status mindgarden.service
```

## 결과
- HQ_ADMIN, SUPER_HQ_ADMIN, HQ_MASTER에게 통계 관련 권한이 추가됩니다.
- 성과 지표 대시보드를 볼 수 있는 권한이 부여됩니다.

## 파일 위치
- SQL 스크립트: `sql/add-statistics-permissions.sql`
- 이 문서: `docs/deploy-statistics-permissions.md`

