#!/bin/bash

# 운영 환경 HQ_MASTER 권한 적용 스크립트
# 실행 전 반드시 백업을 수행하세요!

echo "🚀 운영 환경 HQ_MASTER 권한 적용 시작..."

# 운영 서버 접속
ssh root@beta74.cafe24.com << 'EOF'

echo "📋 운영 서버 접속 완료"
echo "🔍 현재 서비스 상태 확인..."

# 서비스 상태 확인
systemctl status mindgarden.service

echo "📊 데이터베이스 백업 시작..."
# 데이터베이스 백업 (필요시)
# mysqldump -u [DB사용자] -p[DB비밀번호] [DB명] > /backup/mindgarden_backup_$(date +%Y%m%d_%H%M%S).sql

echo "🔧 권한 설정 시작..."

# MySQL 접속하여 권한 설정
mysql -u [운영DB사용자] -p[운영DB비밀번호] [운영DB명] << 'SQL'

-- 1. 권한 추가 (이미 존재할 수 있으므로 IGNORE 사용)
INSERT IGNORE INTO permissions (permission_code, permission_name, permission_description, is_active, created_at, updated_at) VALUES 
('HQ_BRANCH_VIEW', '본사 지점 조회', '본사에서 지점 정보를 조회할 수 있는 권한', 1, NOW(), NOW()),
('HQ_STATISTICS_VIEW', '본사 통계 조회', '본사에서 통계 정보를 조회할 수 있는 권한', 1, NOW(), NOW()),
('HQ_FINANCIAL_MANAGE', '본사 재무 관리', '본사에서 재무 정보를 관리할 수 있는 권한', 1, NOW(), NOW());

-- 2. HQ_MASTER 역할에 권한 부여 (중복 방지)
INSERT IGNORE INTO role_permissions (role_name, permission_code, is_active, created_at, updated_at) VALUES 
('HQ_MASTER', 'HQ_BRANCH_VIEW', 1, NOW(), NOW()),
('HQ_MASTER', 'HQ_STATISTICS_VIEW', 1, NOW(), NOW()),
('HQ_MASTER', 'HQ_FINANCIAL_MANAGE', 1, NOW(), NOW());

-- 3. 기존 권한이 비활성화되어 있다면 활성화
UPDATE role_permissions 
SET is_active = 1, updated_at = NOW()
WHERE role_name = 'HQ_MASTER' 
AND permission_code IN ('HQ_BRANCH_VIEW', 'HQ_STATISTICS_VIEW', 'HQ_FINANCIAL_MANAGE')
AND is_active = 0;

-- 4. 결과 확인
SELECT 
    rp.role_name,
    p.permission_code,
    p.permission_name,
    rp.is_active,
    rp.created_at
FROM role_permissions rp
JOIN permissions p ON rp.permission_code = p.permission_code
WHERE rp.role_name = 'HQ_MASTER'
AND p.permission_code IN ('HQ_BRANCH_VIEW', 'HQ_STATISTICS_VIEW', 'HQ_FINANCIAL_MANAGE')
ORDER BY p.permission_code;

SQL

echo "✅ 권한 설정 완료"

echo "🔄 권한 캐시 클리어..."
# 권한 캐시 클리어
curl -X POST https://beta74.cafe24.com/api/admin/permission-cache/clear

echo "🔄 서비스 재시작..."
# 서비스 재시작
systemctl restart mindgarden.service

echo "⏳ 서비스 재시작 대기..."
sleep 10

echo "🔍 서비스 상태 확인..."
systemctl status mindgarden.service

echo "✅ 운영 환경 권한 적용 완료!"

EOF

echo "🎉 운영 환경 권한 적용 스크립트 실행 완료!"
