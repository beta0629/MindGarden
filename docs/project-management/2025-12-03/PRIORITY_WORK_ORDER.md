# 작업 우선순위 및 순서

**작성일:** 2025-12-03  
**목표:** 공통코드 분리 → 역할 시스템 마이그레이션 → 대시보드 개선  
**중요:** 순서대로 진행해야 함 (의존성 있음)

---

## 🔥 작업 순서 (의존성 순서)

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: 공통코드 분리 및 마이그레이션 (최우선) ⭐⭐⭐⭐⭐ │
├─────────────────────────────────────────────────────────┤
│ 예상 시간: 1일 (8시간)                                   │
│ 상태: 🔴 즉시 시작 필요                                  │
│                                                          │
│ 작업 내용:                                               │
│ 1. 시스템 공통코드 정리                                  │
│    - USER_ROLE_TEMPLATE 생성 (4개)                      │
│    - ADMIN_GRADE, CONSULTANT_GRADE, CLIENT_GRADE 생성   │
│    - 레거시 역할 코드 삭제                               │
│                                                          │
│ 2. 테넌트 공통코드 생성                                  │
│    - 각 테넌트에 USER_ROLE 코드 그룹 생성                │
│    - 템플릿에서 기본 4개 역할 복사                       │
│                                                          │
│ 3. users 테이블 role 컬럼 마이그레이션                   │
│    - 레거시 역할 → 새로운 역할 코드 매핑                 │
│                                                          │
│ 완료 조건:                                               │
│ - 레거시 역할 코드 0개                                   │
│ - 모든 테넌트에 USER_ROLE 코드 그룹 존재                 │
│ - 모든 사용자의 role이 유효한 코드 값                    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ Step 2: 역할 시스템 코드 마이그레이션 ⭐⭐⭐⭐             │
├─────────────────────────────────────────────────────────┤
│ 예상 시간: 2일 (16시간)                                  │
│ 상태: 🟡 Step 1 완료 후 시작                             │
│                                                          │
│ 작업 내용:                                               │
│ 1. UserRole enum 재작성                                  │
│    - 레거시 역할 제거                                    │
│    - 동적 역할 조회 로직 추가                            │
│                                                          │
│ 2. CommonCodeService 개선                                │
│    - getSystemRoles()                                    │
│    - getTenantRoles()                                    │
│    - getGradesByRole()                                   │
│                                                          │
│ 3. UserRoleService 구현                                  │
│    - assignRole() (역할 부여 + 대시보드 자동 생성)       │
│    - validateRole()                                      │
│                                                          │
│ 4. Controller/Service 수정 (49개 파일)                   │
│    - 레거시 역할 체크 제거                               │
│    - 동적 역할 조회로 변경                               │
│                                                          │
│ 완료 조건:                                               │
│ - UserRole enum에 레거시 역할 없음                       │
│ - 모든 역할 체크가 동적 조회 방식                        │
│ - 테스트 통과 (로그인, 권한 체크)                        │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ Step 3: 대시보드 시스템 개선 ⭐⭐⭐                       │
├─────────────────────────────────────────────────────────┤
│ 예상 시간: 1.5일 (12시간)                                │
│ 상태: 🟡 Step 2 완료 후 시작                             │
│                                                          │
│ 작업 내용:                                               │
│ 1. 역할별 대시보드 자동 생성 로직                        │
│    - DashboardService.createDefaultDashboard()           │
│    - 역할별 기본 위젯 구성                               │
│                                                          │
│ 2. 4개 대시보드 디자인 개선                              │
│    - Admin Dashboard (등급 배지 추가)                    │
│    - Consultant Dashboard (등급 배지 추가)               │
│    - Client Dashboard (등급 배지 추가)                   │
│    - Staff Dashboard                                     │
│                                                          │
│ 3. CSS 표준화 적용                                       │
│    - 하드코딩 제거                                       │
│    - CSS 변수 사용                                       │
│    - 등급별 색상 변수 추가                               │
│                                                          │
│ 완료 조건:                                               │
│ - 역할 부여 시 대시보드 자동 생성                        │
│ - 4개 대시보드 디자인 통일                               │
│ - CSS 하드코딩 0개                                       │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ Step 4: 테넌트 생성 테스트 ⭐⭐                           │
├─────────────────────────────────────────────────────────┤
│ 예상 시간: 0.5일 (4시간)                                 │
│ 상태: 🟡 Step 3 완료 후 시작                             │
│                                                          │
│ 작업 내용:                                               │
│ 1. 상담사 테넌트 생성 테스트                             │
│ 2. 내담자 테넌트 생성 테스트                             │
│ 3. 역할 부여 및 대시보드 생성 테스트                     │
│ 4. 권한 및 데이터 격리 테스트                            │
│                                                          │
│ 완료 조건:                                               │
│ - 테넌트 생성 성공                                       │
│ - 역할 부여 성공                                         │
│ - 대시보드 자동 생성 확인                                │
│ - 데이터 격리 확인                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Step 1: 공통코드 분리 및 마이그레이션 (상세)

### Phase 1.1: 시스템 공통코드 정리 (2시간)

#### 작업 1: 마이그레이션 파일 생성
```bash
# 파일 생성
touch src/main/resources/db/migration/V20251203_001__separate_role_common_codes.sql
```

#### 작업 2: SQL 작성
```sql
-- V20251203_001__separate_role_common_codes.sql

-- =====================================================
-- Step 1: 시스템 공통코드 정리
-- =====================================================

-- 1.1 레거시 역할 코드 삭제
DELETE FROM common_codes 
WHERE code_group = 'USER_ROLE' 
AND tenant_id IS NULL
AND code_value IN (
    'BRANCH_ADMIN', 
    'BRANCH_SUPER_ADMIN', 
    'HQ_ADMIN', 
    'SUPER_HQ_ADMIN', 
    'HQ_MASTER', 
    'HQ_SUPER_ADMIN', 
    'BRANCH_MANAGER',
    'PRINCIPAL',
    'OWNER',
    'TENANT_ADMIN'
);

-- 1.2 역할 템플릿 코드 그룹 생성
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, sort_order, is_active, extra_data, created_at, updated_at)
VALUES 
    (NULL, 'USER_ROLE_TEMPLATE', 'ADMIN', 'Admin', '관리자', 1, true, 
     '{"default_permissions": ["ALL"], "dashboard_type": "ADMIN"}', NOW(), NOW()),
    (NULL, 'USER_ROLE_TEMPLATE', 'CONSULTANT', 'Consultant', '상담사', 2, true, 
     '{"default_permissions": ["SCHEDULE_MANAGE", "CLIENT_VIEW"], "dashboard_type": "CONSULTANT"}', NOW(), NOW()),
    (NULL, 'USER_ROLE_TEMPLATE', 'CLIENT', 'Client', '내담자', 3, true, 
     '{"default_permissions": ["SCHEDULE_VIEW"], "dashboard_type": "CLIENT"}', NOW(), NOW()),
    (NULL, 'USER_ROLE_TEMPLATE', 'STAFF', 'Staff', '사무원', 4, true, 
     '{"default_permissions": ["SCHEDULE_MANAGE", "CLIENT_MANAGE"], "dashboard_type": "STAFF"}', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    korean_name = VALUES(korean_name),
    extra_data = VALUES(extra_data),
    updated_at = NOW();

-- 1.3 등급 코드 그룹 생성
-- ADMIN_GRADE
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, sort_order, is_active, extra_data, created_at, updated_at)
VALUES 
    (NULL, 'ADMIN_GRADE', 'ADMIN_MANAGER', 'Manager', '매니저', 1, true, 
     '{"level": 1, "color": "#6b7280"}', NOW(), NOW()),
    (NULL, 'ADMIN_GRADE', 'ADMIN_DIRECTOR', 'Director', '디렉터', 2, true, 
     '{"level": 2, "color": "#3b82f6"}', NOW(), NOW()),
    (NULL, 'ADMIN_GRADE', 'ADMIN_EXECUTIVE', 'Executive', '임원', 3, true, 
     '{"level": 3, "color": "#8b5cf6"}', NOW(), NOW()),
    (NULL, 'ADMIN_GRADE', 'ADMIN_SUPER', 'Super Admin', '최고 관리자', 4, true, 
     '{"level": 4, "color": "#7c3aed"}', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    korean_name = VALUES(korean_name),
    extra_data = VALUES(extra_data),
    updated_at = NOW();

-- CONSULTANT_GRADE
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, sort_order, is_active, extra_data, created_at, updated_at)
VALUES 
    (NULL, 'CONSULTANT_GRADE', 'CONSULTANT_JUNIOR', 'Junior', '주니어', 1, true, 
     '{"level": 1, "color": "#3b82f6", "fee_rate": 0.50}', NOW(), NOW()),
    (NULL, 'CONSULTANT_GRADE', 'CONSULTANT_SENIOR', 'Senior', '시니어', 2, true, 
     '{"level": 2, "color": "#10b981", "fee_rate": 0.60}', NOW(), NOW()),
    (NULL, 'CONSULTANT_GRADE', 'CONSULTANT_EXPERT', 'Expert', '엑스퍼트', 3, true, 
     '{"level": 3, "color": "#f59e0b", "fee_rate": 0.70}', NOW(), NOW()),
    (NULL, 'CONSULTANT_GRADE', 'CONSULTANT_MASTER', 'Master', '마스터', 4, true, 
     '{"level": 4, "color": "#6366f1", "fee_rate": 0.80}', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    korean_name = VALUES(korean_name),
    extra_data = VALUES(extra_data),
    updated_at = NOW();

-- CLIENT_GRADE
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, sort_order, is_active, extra_data, created_at, updated_at)
VALUES 
    (NULL, 'CLIENT_GRADE', 'CLIENT_BRONZE', 'Bronze', '브론즈', 1, true, 
     '{"level": 1, "color": "#cd7f32", "discount": 0.00, "min_sessions": 0}', NOW(), NOW()),
    (NULL, 'CLIENT_GRADE', 'CLIENT_SILVER', 'Silver', '실버', 2, true, 
     '{"level": 2, "color": "#c0c0c0", "discount": 0.05, "min_sessions": 10}', NOW(), NOW()),
    (NULL, 'CLIENT_GRADE', 'CLIENT_GOLD', 'Gold', '골드', 3, true, 
     '{"level": 3, "color": "#ffd700", "discount": 0.10, "min_sessions": 30}', NOW(), NOW()),
    (NULL, 'CLIENT_GRADE', 'CLIENT_PLATINUM', 'Platinum', '플래티넘', 4, true, 
     '{"level": 4, "color": "#e5e4e2", "discount": 0.15, "min_sessions": 50}', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    korean_name = VALUES(korean_name),
    extra_data = VALUES(extra_data),
    updated_at = NOW();

-- 1.4 코드 그룹 메타데이터 추가
INSERT INTO code_group_metadata (code_group, group_name, code_type, description, is_active, created_at, updated_at)
VALUES 
    ('USER_ROLE_TEMPLATE', '사용자 역할 템플릿', 'CORE', '시스템 기본 역할 템플릿 (4개)', true, NOW(), NOW()),
    ('ADMIN_GRADE', '관리자 등급', 'CORE', '관리자 등급 (4단계)', true, NOW(), NOW()),
    ('CONSULTANT_GRADE', '상담사 등급', 'CORE', '상담사 등급 (4단계)', true, NOW(), NOW()),
    ('CLIENT_GRADE', '내담자 등급', 'CORE', '내담자 등급 (4단계)', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    group_name = VALUES(group_name),
    description = VALUES(description),
    updated_at = NOW();

-- =====================================================
-- Step 2: 테넌트 공통코드 생성
-- =====================================================

-- 2.1 각 테넌트에 USER_ROLE 코드 그룹 생성
-- (템플릿에서 기본 4개 역할 복사)
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, sort_order, is_active, extra_data, created_at, updated_at)
SELECT 
    t.tenant_id,
    'USER_ROLE',
    tpl.code_value,
    tpl.code_label,
    tpl.korean_name,
    tpl.sort_order,
    true,
    tpl.extra_data,
    NOW(),
    NOW()
FROM tenants t
CROSS JOIN common_codes tpl
WHERE tpl.tenant_id IS NULL
AND tpl.code_group = 'USER_ROLE_TEMPLATE'
AND tpl.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM common_codes cc
    WHERE cc.tenant_id = t.tenant_id
    AND cc.code_group = 'USER_ROLE'
    AND cc.code_value = tpl.code_value
);

-- 2.2 테넌트 공통코드 메타데이터 추가
INSERT INTO code_group_metadata (code_group, group_name, code_type, description, is_active, created_at, updated_at)
VALUES 
    ('USER_ROLE', '사용자 역할', 'TENANT', '테넌트별 사용자 역할 (무제한 추가 가능)', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    group_name = VALUES(group_name),
    description = VALUES(description),
    updated_at = NOW();

-- =====================================================
-- Step 3: 권한 백업 및 역할 매핑
-- =====================================================

-- 3.1 권한 백업 테이블 생성
CREATE TABLE IF NOT EXISTS role_permissions_backup (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50),
    role_name VARCHAR(50) NOT NULL,
    permission_code VARCHAR(100) NOT NULL,
    permission_scope VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    backed_up_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tenant_role (tenant_id, role_name),
    INDEX idx_permission (permission_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.2 현재 권한 데이터 백업
INSERT INTO role_permissions_backup (tenant_id, role_name, permission_code, permission_scope, is_active)
SELECT 
    tenant_id,
    role_name,
    permission_code,
    permission_scope,
    is_active
FROM role_permissions
WHERE is_active = true;

-- 3.3 마이그레이션 로그 테이블 생성
CREATE TABLE IF NOT EXISTS role_migration_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    tenant_id VARCHAR(50),
    old_role VARCHAR(50) NOT NULL,
    new_role VARCHAR(50) NOT NULL,
    migrated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_tenant_id (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Step 4: users 테이블 role 컬럼 마이그레이션
-- =====================================================

-- 4.1 레거시 역할 → 새로운 역할 매핑
-- 마이그레이션 로그 기록
INSERT INTO role_migration_log (user_id, tenant_id, old_role, new_role)
SELECT 
    id, 
    tenant_id, 
    role AS old_role,
    CASE 
        WHEN role IN ('BRANCH_ADMIN', 'BRANCH_SUPER_ADMIN', 'HQ_ADMIN', 
                      'SUPER_HQ_ADMIN', 'HQ_MASTER', 'HQ_SUPER_ADMIN', 
                      'BRANCH_MANAGER', 'PRINCIPAL', 'OWNER', 'TENANT_ADMIN') 
        THEN 'ADMIN'
        ELSE role
    END AS new_role
FROM users 
WHERE role IN (
    'BRANCH_ADMIN', 'BRANCH_SUPER_ADMIN', 'HQ_ADMIN', 
    'SUPER_HQ_ADMIN', 'HQ_MASTER', 'HQ_SUPER_ADMIN', 
    'BRANCH_MANAGER', 'PRINCIPAL', 'OWNER', 'TENANT_ADMIN'
);

-- 4.2 실제 역할 업데이트
UPDATE users 
SET role = 'ADMIN',
    updated_at = NOW()
WHERE role IN (
    'BRANCH_ADMIN', 'BRANCH_SUPER_ADMIN', 'HQ_ADMIN', 
    'SUPER_HQ_ADMIN', 'HQ_MASTER', 'HQ_SUPER_ADMIN', 
    'BRANCH_MANAGER', 'PRINCIPAL', 'OWNER', 'TENANT_ADMIN'
);

-- =====================================================
-- Step 5: 권한 데이터 재생성
-- =====================================================

-- 5.1 기존 권한 데이터 삭제 (레거시 역할)
DELETE FROM role_permissions
WHERE role_name IN (
    'BRANCH_ADMIN', 'BRANCH_SUPER_ADMIN', 'HQ_ADMIN', 
    'SUPER_HQ_ADMIN', 'HQ_MASTER', 'HQ_SUPER_ADMIN', 
    'BRANCH_MANAGER', 'PRINCIPAL', 'OWNER', 'TENANT_ADMIN'
);

-- 5.2 백업된 권한을 새로운 역할로 매핑하여 복원
INSERT INTO role_permissions (tenant_id, role_name, permission_code, permission_scope, is_active, created_at, updated_at)
SELECT 
    tenant_id,
    CASE 
        WHEN role_name IN ('BRANCH_ADMIN', 'BRANCH_SUPER_ADMIN', 'HQ_ADMIN', 
                           'SUPER_HQ_ADMIN', 'HQ_MASTER', 'HQ_SUPER_ADMIN', 
                           'BRANCH_MANAGER', 'PRINCIPAL', 'OWNER', 'TENANT_ADMIN') 
        THEN 'ADMIN'
        ELSE role_name
    END AS role_name,
    permission_code,
    permission_scope,
    is_active,
    NOW(),
    NOW()
FROM role_permissions_backup
WHERE is_active = true
ON DUPLICATE KEY UPDATE 
    permission_scope = VALUES(permission_scope),
    is_active = VALUES(is_active),
    updated_at = NOW();

-- 5.3 ADMIN 역할에 모든 권한 부여 (기본)
-- (동적 권한 시스템에서 ADMIN은 자동으로 모든 권한 가지므로 생략 가능)
-- 필요 시 아래 주석 해제
/*
INSERT INTO role_permissions (tenant_id, role_name, permission_code, permission_scope, is_active, created_at, updated_at)
SELECT DISTINCT
    tenant_id,
    'ADMIN',
    'ALL',
    'TENANT',
    true,
    NOW(),
    NOW()
FROM tenants
WHERE is_active = true
ON DUPLICATE KEY UPDATE 
    updated_at = NOW();
*/

-- =====================================================
-- Step 6: 검증
-- =====================================================

-- 6.1 권한 백업 확인
SELECT '권한 백업 확인' AS step;
SELECT role_name, COUNT(*) as permission_count
FROM role_permissions_backup
GROUP BY role_name
ORDER BY permission_count DESC;

-- 6.2 권한 복원 확인
SELECT '권한 복원 확인' AS step;
SELECT role_name, COUNT(*) as permission_count
FROM role_permissions
WHERE is_active = true
GROUP BY role_name
ORDER BY permission_count DESC;

-- 6.3 시스템 공통코드 확인
SELECT '시스템 공통코드 확인' AS step;
SELECT code_group, code_value, korean_name, sort_order
FROM common_codes
WHERE tenant_id IS NULL
AND code_group IN ('USER_ROLE_TEMPLATE', 'ADMIN_GRADE', 'CONSULTANT_GRADE', 'CLIENT_GRADE')
ORDER BY code_group, sort_order;

-- 6.4 테넌트 공통코드 확인 (샘플)
SELECT '테넌트 공통코드 확인 (샘플)' AS step;
SELECT tenant_id, code_group, code_value, korean_name
FROM common_codes
WHERE code_group = 'USER_ROLE'
LIMIT 20;

-- 6.5 레거시 역할 잔존 확인 (users 테이블, 0이어야 함)
SELECT '레거시 역할 잔존 확인 (users)' AS step;
SELECT COUNT(*) as legacy_role_count
FROM users
WHERE role IN (
    'BRANCH_ADMIN', 'BRANCH_SUPER_ADMIN', 'HQ_ADMIN', 
    'SUPER_HQ_ADMIN', 'HQ_MASTER', 'HQ_SUPER_ADMIN', 
    'BRANCH_MANAGER', 'PRINCIPAL', 'OWNER', 'TENANT_ADMIN'
);

-- 6.6 레거시 역할 잔존 확인 (role_permissions 테이블, 0이어야 함)
SELECT '레거시 역할 잔존 확인 (role_permissions)' AS step;
SELECT COUNT(*) as legacy_permission_count
FROM role_permissions
WHERE role_name IN (
    'BRANCH_ADMIN', 'BRANCH_SUPER_ADMIN', 'HQ_ADMIN', 
    'SUPER_HQ_ADMIN', 'HQ_MASTER', 'HQ_SUPER_ADMIN', 
    'BRANCH_MANAGER', 'PRINCIPAL', 'OWNER', 'TENANT_ADMIN'
);

-- 6.7 역할 분포 확인 (users 테이블)
SELECT '역할 분포 확인 (users)' AS step;
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY count DESC;

-- 6.8 역할 분포 확인 (role_permissions 테이블)
SELECT '역할 분포 확인 (role_permissions)' AS step;
SELECT role_name, COUNT(DISTINCT permission_code) as permission_count
FROM role_permissions
WHERE is_active = true
GROUP BY role_name
ORDER BY permission_count DESC;

-- 6.9 마이그레이션 로그 확인
SELECT '마이그레이션 로그 확인' AS step;
SELECT old_role, new_role, COUNT(*) as count
FROM role_migration_log
GROUP BY old_role, new_role
ORDER BY count DESC;

-- 6.10 권한 매핑 비교 (백업 vs 현재)
SELECT '권한 매핑 비교' AS step;
SELECT 
    '백업' AS source,
    role_name,
    COUNT(*) as permission_count
FROM role_permissions_backup
GROUP BY role_name
UNION ALL
SELECT 
    '현재' AS source,
    role_name,
    COUNT(*) as permission_count
FROM role_permissions
WHERE is_active = true
GROUP BY role_name
ORDER BY role_name, source;
```

#### 작업 3: 마이그레이션 실행
```bash
# 개발 서버에서 실행
cd /Users/mind/mindGarden
./mvnw flyway:migrate

# 또는 애플리케이션 재시작 (자동 마이그레이션)
./scripts/start-all.sh local dev
```

#### 작업 4: 검증
```bash
# 검증 스크립트 실행
mysql -u mindgarden_dev -p core_solution < verify_role_migration.sql
```

---

### Phase 1.2: 백업 및 롤백 준비 (1시간)

```bash
# 백업
mysqldump -u mindgarden_dev -p core_solution \
  common_codes \
  code_group_metadata \
  users \
  > backup_before_role_migration_20251203.sql

# 롤백 스크립트 작성 (필요 시)
```

---

## ✅ 체크리스트

### Step 1: 공통코드 분리 및 마이그레이션
- [ ] 마이그레이션 파일 작성
- [ ] 백업 완료
- [ ] 마이그레이션 실행
- [ ] 시스템 공통코드 검증 (USER_ROLE_TEMPLATE, 등급)
- [ ] 테넌트 공통코드 검증 (USER_ROLE)
- [ ] 레거시 역할 잔존 확인 (0개)
- [ ] 사용자 역할 분포 확인
- [ ] 마이그레이션 로그 확인

### Step 2: 역할 시스템 코드 마이그레이션
- [ ] UserRole enum 재작성
- [ ] CommonCodeService 개선
- [ ] UserRoleService 구현
- [ ] Controller/Service 수정 (49개 파일)
- [ ] 단위 테스트
- [ ] 통합 테스트

### Step 3: 대시보드 시스템 개선
- [ ] 역할별 대시보드 자동 생성 로직
- [ ] Admin Dashboard 디자인 개선
- [ ] Consultant Dashboard 디자인 개선
- [ ] Client Dashboard 디자인 개선
- [ ] CSS 표준화 적용

### Step 4: 테넌트 생성 테스트
- [ ] 상담사 테넌트 생성 테스트
- [ ] 내담자 테넌트 생성 테스트
- [ ] 역할 부여 테스트
- [ ] 대시보드 자동 생성 테스트

---

## 📊 전체 일정

| Step | 작업 | 예상 시간 | 의존성 |
|------|------|----------|--------|
| Step 1 | 공통코드 분리 및 마이그레이션 | 8시간 (1일) | 없음 (최우선) |
| Step 2 | 역할 시스템 코드 마이그레이션 | 16시간 (2일) | Step 1 완료 필수 |
| Step 3 | 대시보드 시스템 개선 | 12시간 (1.5일) | Step 2 완료 필수 |
| Step 4 | 테넌트 생성 테스트 | 4시간 (0.5일) | Step 3 완료 필수 |

**총 예상 시간:** 40시간 (5일)

---

## 🚨 중요 사항

### 1. **순서 엄수**
- Step 1 완료 전에 Step 2 시작 금지
- 각 Step 완료 후 검증 필수

### 2. **백업 필수**
- 각 Step 시작 전 데이터베이스 백업
- 롤백 스크립트 준비

### 3. **점진적 배포**
- 개발 환경 먼저 적용
- 검증 완료 후 운영 환경 적용

---

**작성자:** AI Assistant  
**최종 수정:** 2025-12-03  
**다음 단계:** Step 1 공통코드 분리 마이그레이션 파일 작성 시작

