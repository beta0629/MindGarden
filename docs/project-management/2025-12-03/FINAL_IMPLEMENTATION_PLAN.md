# 최종 구현 계획 - 그룹 기반 통합 권한 시스템

**작성일**: 2025-12-03  
**최종 확정**: 2025-12-03  
**목적**: 역할 마이그레이션 + 그룹 기반 권한 시스템 통합 구현

---

## 🎯 최종 시스템 구조

### 핵심 원칙
```
1. 모든 역할을 그룹 코드로 관리
2. 모든 업종을 그룹 코드로 관리
3. 하나의 통합 대시보드로 모든 역할/업종 지원
4. 코드 수정 없이 SQL만으로 확장 가능
```

### 3단계 권한 체계
```
Level 1: 역할 (tenant_roles)
  - 원장, 상담사, 내담자, 사무원, 강사, 학생 등

Level 2: 그룹 (permission_groups)
  - 공통 그룹: DASHBOARD_STATISTICS, DASHBOARD_ERP 등
  - 업종별 그룹: CONSULTATION_*, ACADEMY_* 등

Level 3: 권한 매핑 (role_permission_groups)
  - 역할 + 그룹 + 접근 레벨 (READ/WRITE/FULL)
```

---

## 📊 데이터베이스 설계 (최종)

### 1. permission_groups 테이블

```sql
CREATE TABLE permission_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NULL COMMENT '테넌트 ID (NULL = 시스템 그룹)',
    
    -- 그룹 정보
    group_code VARCHAR(50) NOT NULL COMMENT '그룹 코드',
    group_name VARCHAR(100) NOT NULL COMMENT '그룹명',
    group_name_en VARCHAR(100) COMMENT '영문 그룹명',
    description TEXT COMMENT '그룹 설명',
    
    -- 그룹 분류
    group_type VARCHAR(20) NOT NULL COMMENT 'DASHBOARD_SECTION, DASHBOARD_WIDGET, MENU, FEATURE',
    business_type VARCHAR(50) NULL COMMENT '업종 타입 (NULL=공통, CONSULTATION=상담소, ACADEMY=학원)',
    parent_group_code VARCHAR(50) COMMENT '상위 그룹 코드',
    
    -- 메타데이터
    sort_order INT DEFAULT 0,
    icon VARCHAR(50) COMMENT '아이콘',
    color_code VARCHAR(7) COMMENT '색상 코드',
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_tenant_group_code (tenant_id, group_code),
    INDEX idx_group_type (group_type),
    INDEX idx_business_type (business_type),
    INDEX idx_parent_group (parent_group_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. role_permission_groups 테이블

```sql
CREATE TABLE role_permission_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    tenant_role_id VARCHAR(36) NOT NULL COMMENT '테넌트 역할 ID',
    
    -- 그룹 권한
    permission_group_code VARCHAR(50) NOT NULL COMMENT '권한 그룹 코드',
    
    -- 권한 레벨
    access_level VARCHAR(20) DEFAULT 'READ' COMMENT 'READ, WRITE, FULL',
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_role_group (tenant_id, tenant_role_id, permission_group_code),
    INDEX idx_tenant_role (tenant_id, tenant_role_id),
    INDEX idx_group_code (permission_group_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🚀 구현 단계 (통합)

### Phase 1: 데이터베이스 준비 (1일)

#### 1.1 백업
```sql
-- 권한 백업
CREATE TABLE role_permissions_backup_20251203 AS
SELECT * FROM role_permissions WHERE is_active = true;

-- 사용자 역할 백업
CREATE TABLE users_role_backup_20251203 AS
SELECT id, tenant_id, username, role FROM users;
```

#### 1.2 테이블 생성
```sql
-- permission_groups 테이블 생성
CREATE TABLE permission_groups (...);

-- role_permission_groups 테이블 생성
CREATE TABLE role_permission_groups (...);
```

#### 1.3 기본 그룹 데이터 삽입
```sql
-- 공통 그룹 (모든 업종)
INSERT INTO permission_groups VALUES
(NULL, 'DASHBOARD_STATISTICS', '통계 섹션', 'DASHBOARD_SECTION', NULL, NULL, 1),
(NULL, 'DASHBOARD_MANAGEMENT', '관리 섹션', 'DASHBOARD_SECTION', NULL, NULL, 2),
(NULL, 'DASHBOARD_ERP', 'ERP 섹션', 'DASHBOARD_SECTION', NULL, NULL, 3),
(NULL, 'DASHBOARD_SYSTEM', '시스템 섹션', 'DASHBOARD_SECTION', NULL, NULL, 4);

-- 상담소 전용 그룹
INSERT INTO permission_groups VALUES
(NULL, 'CONSULTATION_MANAGEMENT', '상담 관리', 'DASHBOARD_SECTION', 'CONSULTATION', NULL, 100),
(NULL, 'CLIENT_MANAGEMENT', '내담자 관리', 'DASHBOARD_SECTION', 'CONSULTATION', NULL, 110);

-- 학원 전용 그룹
INSERT INTO permission_groups VALUES
(NULL, 'ACADEMY_CLASS_MANAGEMENT', '수업 관리', 'DASHBOARD_SECTION', 'ACADEMY', NULL, 200),
(NULL, 'ACADEMY_STUDENT_MANAGEMENT', '학생 관리', 'DASHBOARD_SECTION', 'ACADEMY', NULL, 210);
```

---

### Phase 2: 역할 마이그레이션 (2일)

#### 2.1 tenant_roles 확장
```sql
-- 모든 테넌트에 기본 역할 생성 (없는 경우만)
INSERT INTO tenant_roles (tenant_id, tenant_role_id, name_ko, name_en, is_active)
SELECT 
    t.tenant_id,
    UUID(),
    '원장',
    'Director',
    true
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM tenant_roles tr 
    WHERE tr.tenant_id = t.tenant_id AND tr.name_en = 'Director'
);

-- 상담사, 내담자, 사무원도 동일하게
```

#### 2.2 역할별 그룹 권한 매핑
```sql
-- 상담소 원장: 공통 그룹 + 상담소 그룹
INSERT INTO role_permission_groups (tenant_id, tenant_role_id, permission_group_code, access_level)
SELECT 
    tr.tenant_id,
    tr.tenant_role_id,
    pg.group_code,
    'FULL'
FROM tenant_roles tr
CROSS JOIN permission_groups pg
INNER JOIN tenants t ON tr.tenant_id = t.tenant_id
WHERE tr.name_en = 'Director' 
  AND t.business_type = 'CONSULTATION'
  AND (pg.business_type IS NULL OR pg.business_type = 'CONSULTATION');

-- 학원 원장: 공통 그룹 + 학원 그룹
INSERT INTO role_permission_groups (tenant_id, tenant_role_id, permission_group_code, access_level)
SELECT 
    tr.tenant_id,
    tr.tenant_role_id,
    pg.group_code,
    'FULL'
FROM tenant_roles tr
CROSS JOIN permission_groups pg
INNER JOIN tenants t ON tr.tenant_id = t.tenant_id
WHERE tr.name_en = 'Director' 
  AND t.business_type = 'ACADEMY'
  AND (pg.business_type IS NULL OR pg.business_type = 'ACADEMY');
```

#### 2.3 레거시 역할 마이그레이션
```sql
-- users 테이블 역할 변환
UPDATE users 
SET role = 'ADMIN',
    updated_at = NOW()
WHERE role IN (
    'BRANCH_SUPER_ADMIN', 'HQ_ADMIN', 'SUPER_HQ_ADMIN', 
    'HQ_MASTER', 'BRANCH_MANAGER', 'BRANCH_ADMIN'
);

-- role_permissions 레거시 권한 제거
DELETE FROM role_permissions
WHERE role_name IN (
    'BRANCH_SUPER_ADMIN', 'HQ_ADMIN', 'SUPER_HQ_ADMIN', 
    'HQ_MASTER', 'BRANCH_MANAGER', 'BRANCH_ADMIN'
);
```

---

### Phase 3: 백엔드 구현 (2일)

#### 3.1 Entity 생성
```java
@Entity
@Table(name = "permission_groups")
public class PermissionGroup extends BaseEntity {
    @Column(name = "group_code")
    private String groupCode;
    
    @Column(name = "group_type")
    private String groupType;
    
    @Column(name = "business_type")
    private String businessType;
    
    // ... 기타 필드
}

@Entity
@Table(name = "role_permission_groups")
public class RolePermissionGroup extends BaseEntity {
    @Column(name = "tenant_role_id")
    private String tenantRoleId;
    
    @Column(name = "permission_group_code")
    private String permissionGroupCode;
    
    @Column(name = "access_level")
    private String accessLevel;
    
    // ... 기타 필드
}
```

#### 3.2 Service 구현
```java
@Service
public class PermissionGroupService {
    
    public List<String> getUserPermissionGroups(String tenantId, String tenantRoleId) {
        // 1. 테넌트 업종 확인
        String businessType = getBusinessType(tenantId);
        
        // 2. 역할 권한 그룹 조회
        List<RolePermissionGroup> roleGroups = 
            rolePermissionGroupRepository.findByTenantIdAndTenantRoleIdAndIsActiveTrue(
                tenantId, tenantRoleId
            );
        
        // 3. 업종에 맞는 그룹만 필터링
        return roleGroups.stream()
            .map(RolePermissionGroup::getPermissionGroupCode)
            .filter(code -> isValidForBusinessType(code, businessType))
            .collect(Collectors.toList());
    }
    
    public boolean hasPermissionGroup(String tenantId, String tenantRoleId, String groupCode) {
        return rolePermissionGroupRepository
            .existsByTenantIdAndTenantRoleIdAndPermissionGroupCodeAndIsActiveTrue(
                tenantId, tenantRoleId, groupCode
            );
    }
}
```

#### 3.3 Controller 구현
```java
@RestController
@RequestMapping("/api/v1/permissions/groups")
public class PermissionGroupController {
    
    @GetMapping("/my")
    public ResponseEntity<List<String>> getMyPermissionGroups() {
        String tenantId = SecurityUtils.getCurrentTenantId();
        String tenantRoleId = SecurityUtils.getCurrentTenantRoleId();
        
        List<String> groups = permissionGroupService
            .getUserPermissionGroups(tenantId, tenantRoleId);
        
        return ResponseEntity.ok(groups);
    }
}
```

---

### Phase 4: 프론트엔드 구현 (2일)

#### 4.1 Hook 생성
```javascript
// hooks/usePermissionGroups.js
export const usePermissionGroups = () => {
    const [permissionGroups, setPermissionGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPermissionGroups = async () => {
            try {
                const response = await axios.get('/api/v1/permissions/groups/my');
                setPermissionGroups(response.data);
            } catch (error) {
                console.error('Failed to fetch permission groups:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPermissionGroups();
    }, []);

    const hasPermissionGroup = (groupCode) => {
        return permissionGroups.includes(groupCode);
    };

    return { permissionGroups, hasPermissionGroup, loading };
};
```

#### 4.2 통합 대시보드 구현
```javascript
// components/dashboard/UnifiedDashboard.js
const UnifiedDashboard = () => {
    const { hasPermissionGroup, loading: permLoading } = usePermissionGroups();
    const { tenant, loading: tenantLoading } = useTenant();
    
    if (permLoading || tenantLoading) return <LoadingSpinner />;
    
    const businessType = tenant?.businessType;

    return (
        <div className="unified-dashboard">
            {/* 공통 섹션 */}
            {hasPermissionGroup('DASHBOARD_STATISTICS') && <StatisticsSection />}
            {hasPermissionGroup('DASHBOARD_MANAGEMENT') && <ManagementSection />}
            {hasPermissionGroup('DASHBOARD_ERP') && <ERPSection />}
            
            {/* 상담소 전용 */}
            {businessType === 'CONSULTATION' && (
                <>
                    {hasPermissionGroup('CONSULTATION_MANAGEMENT') && <ConsultationSection />}
                    {hasPermissionGroup('CLIENT_MANAGEMENT') && <ClientSection />}
                </>
            )}
            
            {/* 학원 전용 */}
            {businessType === 'ACADEMY' && (
                <>
                    {hasPermissionGroup('ACADEMY_CLASS_MANAGEMENT') && <ClassSection />}
                    {hasPermissionGroup('ACADEMY_STUDENT_MANAGEMENT') && <StudentSection />}
                </>
            )}
            
            {/* 시스템 */}
            {hasPermissionGroup('DASHBOARD_SYSTEM') && <SystemSection />}
        </div>
    );
};
```

#### 4.3 라우팅 통합
```javascript
// App.js
<Routes>
    {/* 모든 역할이 동일한 대시보드 사용 */}
    <Route path="/admin/dashboard" element={<UnifiedDashboard />} />
    <Route path="/consultant/dashboard" element={<UnifiedDashboard />} />
    <Route path="/client/dashboard" element={<UnifiedDashboard />} />
    <Route path="/staff/dashboard" element={<UnifiedDashboard />} />
</Routes>
```

---

### Phase 5: Java 코드 정리 (1일)

#### 5.1 UserRole Enum 정리
```java
public enum UserRole {
    ADMIN("관리자"),
    CONSULTANT("상담사"),
    CLIENT("내담자"),
    STAFF("사무원");
    
    // BRANCH_SUPER_ADMIN 등 레거시 역할 제거
}
```

#### 5.2 AdminRoleUtils 업데이트
```java
public class AdminRoleUtils {
    
    public static boolean isAdmin(String role) {
        return "ADMIN".equals(role);
    }
    
    // 레거시 메서드 제거
    // public static boolean isBranchSuperAdmin(String role) { ... }
    // public static boolean isHQAdmin(String role) { ... }
}
```

---

### Phase 6: 레거시 정리 및 문서화 (1일)

#### 6.1 레거시 데이터 정리
```sql
-- common_codes에서 레거시 역할 제거
DELETE FROM common_codes
WHERE code_group = 'USER_ROLE'
  AND code_value IN (
    'BRANCH_SUPER_ADMIN', 'HQ_ADMIN', 'SUPER_HQ_ADMIN', 
    'HQ_MASTER', 'BRANCH_MANAGER', 'BRANCH_ADMIN'
  );

-- role_permissions 레거시 권한 제거
DELETE FROM role_permissions
WHERE role_name IN (
    'BRANCH_SUPER_ADMIN', 'HQ_ADMIN', 'SUPER_HQ_ADMIN', 
    'HQ_MASTER', 'BRANCH_MANAGER', 'BRANCH_ADMIN'
  );
```

#### 6.2 문서화
- API 문서 업데이트
- 프론트엔드 컴포넌트 가이드
- 그룹 추가 가이드
- 업종 추가 가이드

---

## ✅ 최종 검증

### 1. 데이터 검증
```sql
-- 레거시 역할 잔존 확인 (0이어야 함)
SELECT COUNT(*) FROM users WHERE role IN ('BRANCH_SUPER_ADMIN', 'HQ_ADMIN', ...);

-- 그룹 권한 매핑 확인
SELECT tr.name_en, COUNT(DISTINCT rpg.permission_group_code) as group_count
FROM tenant_roles tr
LEFT JOIN role_permission_groups rpg ON tr.tenant_role_id = rpg.tenant_role_id
GROUP BY tr.name_en;
```

### 2. 기능 테스트
- [ ] 관리자: ERP 섹션 표시 확인
- [ ] 사무원: ERP 섹션 숨김 확인
- [ ] 상담사: 상담 섹션 표시 확인
- [ ] 내담자: 웰니스 섹션 표시 확인
- [ ] 상담소: 학원 섹션 숨김 확인
- [ ] 학원: 상담소 섹션 숨김 확인

---

## 📊 예상 효과

### 1. 코드 감소
```
Before:
- AdminDashboard.js (500줄)
- ConsultantDashboard.js (400줄)
- ClientDashboard.js (300줄)
- StaffDashboard.js (500줄)
= 총 1,700줄

After:
- UnifiedDashboard.js (300줄)
= 총 300줄

감소: 82% 감소!
```

### 2. 확장성
```
새 역할 추가: SQL만 추가 (코드 수정 불필요)
새 업종 추가: SQL만 추가 (코드 수정 불필요)
새 섹션 추가: SQL만 추가 (코드 수정 불필요)
```

### 3. 유지보수성
```
권한 변경: DB만 수정
역할 추가: DB만 수정
업종 추가: DB만 수정
→ 배포 불필요!
```

---

## 📅 일정

| Phase | 작업 | 소요 시간 | 담당 |
|-------|------|----------|------|
| Phase 1 | DB 준비 | 1일 | Backend |
| Phase 2 | 역할 마이그레이션 | 2일 | Backend |
| Phase 3 | 백엔드 구현 | 2일 | Backend |
| Phase 4 | 프론트엔드 구현 | 2일 | Frontend |
| Phase 5 | 코드 정리 | 1일 | Backend |
| Phase 6 | 레거시 정리 | 1일 | Backend |
| **총계** | | **9일** | |

---

## 🎯 다음 단계

### 즉시 실행 가능
1. **Phase 1 백업 실행** (5분)
2. **테이블 생성 SQL 실행** (10분)
3. **기본 그룹 데이터 삽입** (10분)

### 사용자 승인 필요
- [ ] 최종 구현 계획 승인
- [ ] Phase 1 실행 승인
- [ ] 일정 확정

---

**작성 완료**: 2025-12-03  
**다음 작업**: 사용자 승인 대기 → Phase 1 실행

