# 역할 시스템 재정의 및 마이그레이션 계획

**작성일:** 2025-12-03  
**목표:** 브랜치/본사 개념 제거 및 테넌트 기반 역할 시스템으로 전환  
**우선순위:** 🔥 최우선  
**참조 표준:** [테넌트 역할 시스템 표준](../../standards/TENANT_ROLE_SYSTEM_STANDARD.md)

---

## 📋 현재 문제점

### 1. **레거시 역할이 혼재**
```java
// ❌ 제거 대상 (브랜치/본사 개념)
HQ_ADMIN("헤드쿼터어드민")
SUPER_HQ_ADMIN("본사고급관리자")
BRANCH_SUPER_ADMIN("본점수퍼어드민")
BRANCH_ADMIN("지점관리자")
HQ_MASTER("본사총관리자")
HQ_SUPER_ADMIN("본사최고관리자")
BRANCH_MANAGER("지점장")

// ⚠️ 중복/불명확 (정리 필요)
ADMIN("관리자")
PRINCIPAL("원장")
OWNER("사장")
TENANT_ADMIN("테넌트관리자")
```

### 2. **49개 파일에서 레거시 역할 참조**
- Controller: 15개
- Service: 18개
- Util: 8개
- Entity/Constant: 8개

### 3. **데이터베이스에 레거시 역할 데이터 존재**
- `users` 테이블의 `role` 컬럼
- `role_permissions` 테이블
- `tenant_roles` 테이블

---

## 🎯 목표 역할 시스템 (테넌트 기반)

### 핵심 역할 (5개)
```java
public enum UserRole {
    // ✅ 테넌트 관리자
    ADMIN("관리자"),
    
    // ✅ 전문가 (상담사/강사/의사)
    CONSULTANT("상담사"),
    
    // ✅ 고객 (내담자/학생/환자)
    CLIENT("내담자"),
    
    // ✅ 사무원/행정직원
    STAFF("사무원"),
    
    // ✅ 학부모 (학원 전용)
    PARENT("학부모");
    
    private final String displayName;
    
    UserRole(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public String getValue() {
        return this.name();
    }
    
    // ===== 권한 체크 메서드 =====
    
    public boolean isAdmin() {
        return this == ADMIN;
    }
    
    public boolean isConsultant() {
        return this == CONSULTANT;
    }
    
    public boolean isClient() {
        return this == CLIENT;
    }
    
    public boolean isStaff() {
        return this == STAFF;
    }
    
    public boolean isParent() {
        return this == PARENT;
    }
    
    // ===== 역할 목록 반환 =====
    
    public static UserRole[] getAllRoles() {
        return values();
    }
    
    public static UserRole[] getAdminRoles() {
        return new UserRole[]{ADMIN};
    }
    
    public static UserRole[] getConsultantRoles() {
        return new UserRole[]{CONSULTANT};
    }
    
    public static UserRole[] getClientRoles() {
        return new UserRole[]{CLIENT};
    }
    
    public static UserRole[] getStaffRoles() {
        return new UserRole[]{STAFF};
    }
    
    public static UserRole[] getParentRoles() {
        return new UserRole[]{PARENT};
    }
    
    // ===== 문자열 변환 (하위 호환성) =====
    
    public static UserRole fromString(String role) {
        if (role == null || role.trim().isEmpty()) {
            return CLIENT; // 기본값
        }
        
        String normalizedRole = role.trim().toUpperCase();
        
        // ROLE_ 접두사 제거
        if (normalizedRole.startsWith("ROLE_")) {
            normalizedRole = normalizedRole.substring(5);
        }
        
        try {
            return UserRole.valueOf(normalizedRole);
        } catch (IllegalArgumentException e) {
            // 레거시 역할 매핑 (마이그레이션 기간 동안)
            return mapLegacyRole(normalizedRole);
        }
    }
    
    private static UserRole mapLegacyRole(String legacyRole) {
        switch (legacyRole) {
            // 관리자 역할 매핑
            case "ADMIN":
            case "BRANCH_ADMIN":
            case "BRANCH_SUPER_ADMIN":
            case "HQ_ADMIN":
            case "SUPER_HQ_ADMIN":
            case "HQ_MASTER":
            case "HQ_SUPER_ADMIN":
            case "BRANCH_MANAGER":
            case "PRINCIPAL":
            case "OWNER":
            case "TENANT_ADMIN":
                return ADMIN;
            
            // 상담사 역할 매핑
            case "CONSULTANT":
            case "COUNSELOR":
                return CONSULTANT;
            
            // 내담자 역할 매핑
            case "CLIENT":
            case "USER":
            case "CUSTOMER":
                return CLIENT;
            
            // 사무원 역할 매핑
            case "STAFF":
                return STAFF;
            
            // 학부모 역할 매핑
            case "PARENT":
                return PARENT;
            
            default:
                System.err.println("알 수 없는 역할: " + legacyRole + " -> CLIENT로 변환");
                return CLIENT;
        }
    }
}
```

---

## 📊 마이그레이션 전략

### Phase 1: 데이터베이스 마이그레이션 (1일, 8시간)

#### 1.1 역할 매핑 테이블 생성
```sql
-- 마이그레이션 작업 테이블
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
```

#### 1.2 사용자 역할 마이그레이션
```sql
-- 1. 모든 레거시 관리자 역할 → ADMIN
UPDATE users 
SET role = 'ADMIN' 
WHERE role IN (
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

-- 2. 마이그레이션 로그 기록
INSERT INTO role_migration_log (user_id, tenant_id, old_role, new_role)
SELECT 
    id, 
    tenant_id, 
    role AS old_role, 
    'ADMIN' AS new_role
FROM users 
WHERE role IN (
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

-- 3. CONSULTANT, CLIENT는 유지 (변경 없음)

-- 4. STAFF 역할 확인 (이미 존재하는 경우)
-- (필요 시 추가 작업)
```

#### 1.3 공통코드 테이블 정리
```sql
-- 1. 레거시 역할 공통코드 삭제
DELETE FROM common_codes 
WHERE code_group = 'USER_ROLE' 
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

-- 2. 핵심 5개 역할 공통코드 확인 및 추가
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, sort_order, is_active)
VALUES 
    (NULL, 'USER_ROLE', 'ADMIN', '관리자', '관리자', 1, true),
    (NULL, 'USER_ROLE', 'CONSULTANT', '상담사', '상담사', 2, true),
    (NULL, 'USER_ROLE', 'CLIENT', '내담자', '내담자', 3, true),
    (NULL, 'USER_ROLE', 'STAFF', '사무원', '사무원', 4, true),
    (NULL, 'USER_ROLE', 'PARENT', '학부모', '학부모', 5, true)
ON DUPLICATE KEY UPDATE 
    korean_name = VALUES(korean_name),
    sort_order = VALUES(sort_order),
    is_active = VALUES(is_active);

-- 3. 역할 등급 공통코드 추가
-- 관리자 등급
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, sort_order, is_active)
VALUES 
    (NULL, 'ADMIN_GRADE', 'ADMIN_MANAGER', '매니저', '매니저', 1, true),
    (NULL, 'ADMIN_GRADE', 'ADMIN_DIRECTOR', '디렉터', '디렉터', 2, true),
    (NULL, 'ADMIN_GRADE', 'ADMIN_EXECUTIVE', '임원', '임원', 3, true),
    (NULL, 'ADMIN_GRADE', 'ADMIN_SUPER', '최고 관리자', '최고 관리자', 4, true)
ON DUPLICATE KEY UPDATE 
    korean_name = VALUES(korean_name),
    sort_order = VALUES(sort_order);

-- 상담사 등급
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, sort_order, is_active)
VALUES 
    (NULL, 'CONSULTANT_GRADE', 'CONSULTANT_JUNIOR', '주니어', '주니어', 1, true),
    (NULL, 'CONSULTANT_GRADE', 'CONSULTANT_SENIOR', '시니어', '시니어', 2, true),
    (NULL, 'CONSULTANT_GRADE', 'CONSULTANT_EXPERT', '엑스퍼트', '엑스퍼트', 3, true),
    (NULL, 'CONSULTANT_GRADE', 'CONSULTANT_MASTER', '마스터', '마스터', 4, true)
ON DUPLICATE KEY UPDATE 
    korean_name = VALUES(korean_name),
    sort_order = VALUES(sort_order);

-- 내담자 등급
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, sort_order, is_active)
VALUES 
    (NULL, 'CLIENT_GRADE', 'CLIENT_BRONZE', '브론즈', '브론즈', 1, true),
    (NULL, 'CLIENT_GRADE', 'CLIENT_SILVER', '실버', '실버', 2, true),
    (NULL, 'CLIENT_GRADE', 'CLIENT_GOLD', '골드', '골드', 3, true),
    (NULL, 'CLIENT_GRADE', 'CLIENT_PLATINUM', '플래티넘', '플래티넘', 4, true)
ON DUPLICATE KEY UPDATE 
    korean_name = VALUES(korean_name),
    sort_order = VALUES(sort_order);
```

#### 1.4 권한 테이블 정리
```sql
-- 1. 레거시 역할 권한 삭제
DELETE FROM role_permissions 
WHERE role_name IN (
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

-- 2. ADMIN 역할 기본 권한 추가 (필요 시)
-- (동적 권한 시스템 사용 중이므로 필요 없을 수 있음)
```

#### 1.5 테넌트 역할 테이블 정리
```sql
-- 1. 레거시 역할 제거
DELETE FROM tenant_roles 
WHERE role_code IN (
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

-- 2. 핵심 5개 역할 확인 및 추가 (모든 테넌트)
INSERT INTO tenant_roles (tenant_id, role_code, name_ko, name_en, is_active)
SELECT 
    t.tenant_id,
    'ADMIN',
    '관리자',
    'Admin',
    true
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM tenant_roles tr 
    WHERE tr.tenant_id = t.tenant_id AND tr.role_code = 'ADMIN'
);

-- CONSULTANT, CLIENT, STAFF, PARENT도 동일하게 추가
```

---

### Phase 2: 코드 마이그레이션 (2일, 16시간)

#### 2.1 UserRole.java 재작성
**파일:** `src/main/java/com/coresolution/consultation/constant/UserRole.java`

**작업:**
- [ ] 레거시 역할 제거
- [ ] 핵심 5개 역할만 유지
- [ ] 권한 체크 메서드 단순화
- [ ] `fromString()` 메서드에 레거시 매핑 추가 (하위 호환성)

**예상 시간:** 2시간

#### 2.2 AdminRoleUtils.java 수정
**파일:** `src/main/java/com/coresolution/consultation/util/AdminRoleUtils.java`

**작업:**
- [ ] `ADMIN_ROLES` Set 재정의
  ```java
  public static final Set<UserRole> ADMIN_ROLES = Set.of(UserRole.ADMIN);
  ```
- [ ] 레거시 역할 체크 메서드 제거

**예상 시간:** 1시간

#### 2.3 PermissionCheckUtils.java 수정
**파일:** `src/main/java/com/coresolution/consultation/util/PermissionCheckUtils.java`

**작업:**
- [ ] 관리자 권한 체크 단순화
  ```java
  public static boolean isAdmin(User user) {
      return user.getRole() == UserRole.ADMIN;
  }
  ```

**예상 시간:** 1시간

#### 2.4 Controller 수정 (15개 파일)
**대상 파일:**
- `AdminController.java`
- `ScheduleController.java`
- `ErpController.java`
- `HQBranchController.java` (삭제 또는 Deprecated)
- `BranchManagementController.java` (삭제 또는 Deprecated)
- 등 15개

**작업:**
- [ ] 레거시 역할 체크 제거
- [ ] `@PreAuthorize` 어노테이션 수정
  ```java
  // Before
  @PreAuthorize("hasAnyRole('BRANCH_SUPER_ADMIN', 'HQ_ADMIN')")
  
  // After
  @PreAuthorize("hasRole('ADMIN')")
  ```
- [ ] 권한 체크 로직 단순화

**예상 시간:** 6시간

#### 2.5 Service 수정 (18개 파일)
**대상 파일:**
- `UserProfileServiceImpl.java`
- `ScheduleServiceImpl.java`
- `ErpServiceImpl.java`
- `BranchDataFilterServiceImpl.java` (삭제 또는 Deprecated)
- 등 18개

**작업:**
- [ ] 레거시 역할 체크 제거
- [ ] 권한 체크 로직 단순화
- [ ] 테넌트 기반 데이터 필터링으로 변경

**예상 시간:** 6시간

---

### Phase 3: 테스트 및 검증 (1일, 8시간)

#### 3.1 단위 테스트
**작업:**
- [ ] `UserRole.fromString()` 테스트
- [ ] 레거시 역할 매핑 테스트
- [ ] 권한 체크 메서드 테스트

**예상 시간:** 2시간

#### 3.2 통합 테스트
**작업:**
- [ ] 관리자 로그인 테스트
- [ ] 상담사 로그인 테스트
- [ ] 내담자 로그인 테스트
- [ ] 권한별 API 접근 테스트

**예상 시간:** 3시간

#### 3.3 데이터 검증
**작업:**
- [ ] 마이그레이션된 사용자 역할 확인
- [ ] 권한 테이블 정합성 확인
- [ ] 테넌트 역할 테이블 확인

**SQL:**
```sql
-- 1. 역할 분포 확인
SELECT role, COUNT(*) as count
FROM users
GROUP BY role;

-- 2. 레거시 역할 잔존 확인 (0이어야 함)
SELECT COUNT(*) as legacy_count
FROM users
WHERE role IN (
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

-- 3. 마이그레이션 로그 확인
SELECT old_role, new_role, COUNT(*) as count
FROM role_migration_log
GROUP BY old_role, new_role;

-- 4. 공통코드 확인
SELECT code_group, code_value, korean_name
FROM common_codes
WHERE code_group IN ('USER_ROLE', 'ADMIN_GRADE', 'CONSULTANT_GRADE', 'CLIENT_GRADE')
AND tenant_id IS NULL
ORDER BY code_group, sort_order;

-- 5. 레거시 역할 공통코드 잔존 확인 (0이어야 함)
SELECT COUNT(*) as legacy_code_count
FROM common_codes
WHERE code_group = 'USER_ROLE'
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
```

**예상 시간:** 3시간

---

### Phase 4: 레거시 코드 정리 (0.5일, 4시간)

#### 4.1 파일 삭제 또는 Deprecated 표시
**대상:**
- [ ] `HQBranchController.java` → 삭제 또는 Deprecated
- [ ] `BranchManagementController.java` → 삭제 또는 Deprecated
- [ ] `BranchDataFilterServiceImpl.java` → 삭제 또는 Deprecated
- [ ] `BranchCodeInitService.java` → 삭제 또는 Deprecated
- [ ] `BranchAccountCreator.java` → 삭제 또는 Deprecated

**예상 시간:** 2시간

#### 4.2 문서 업데이트
**작업:**
- [ ] API 문서 업데이트 (역할 변경 반영)
- [ ] ERD 업데이트 (역할 테이블 변경)
- [ ] 사용자 가이드 업데이트

**예상 시간:** 2시간

---

## 📋 체크리스트

### Phase 1: 데이터베이스 마이그레이션
- [ ] 역할 매핑 테이블 생성
- [ ] 사용자 역할 마이그레이션 실행
- [ ] **공통코드 테이블 정리** (USER_ROLE, ADMIN_GRADE, CONSULTANT_GRADE, CLIENT_GRADE)
- [ ] 권한 테이블 정리
- [ ] 테넌트 역할 테이블 정리
- [ ] 마이그레이션 로그 확인

### Phase 2: 코드 마이그레이션
- [ ] `UserRole.java` 재작성
- [ ] `AdminRoleUtils.java` 수정
- [ ] `PermissionCheckUtils.java` 수정
- [ ] Controller 15개 수정
- [ ] Service 18개 수정

### Phase 3: 테스트 및 검증
- [ ] 단위 테스트 작성 및 실행
- [ ] 통합 테스트 실행
- [ ] 데이터 검증 완료
- [ ] 레거시 역할 잔존 확인 (0개)

### Phase 4: 레거시 코드 정리
- [ ] 레거시 파일 삭제 또는 Deprecated
- [ ] 문서 업데이트
- [ ] 코드 리뷰 완료

---

## 🚨 주의사항

### 1. **하위 호환성 유지**
- `UserRole.fromString()` 메서드에서 레거시 역할 매핑 유지
- 마이그레이션 기간 동안 레거시 역할도 인식 가능하도록

### 2. **데이터 백업**
```bash
# 마이그레이션 전 필수 백업
mysqldump -u root -p core_solution users > users_backup_20251203.sql
mysqldump -u root -p core_solution role_permissions > role_permissions_backup_20251203.sql
mysqldump -u root -p core_solution tenant_roles > tenant_roles_backup_20251203.sql
```

### 3. **롤백 계획**
```sql
-- 롤백 시 마이그레이션 로그 기반 복원
UPDATE users u
JOIN role_migration_log rml ON u.id = rml.user_id
SET u.role = rml.old_role
WHERE rml.migrated_at > '2025-12-03 00:00:00';
```

### 4. **단계별 배포**
1. **개발 환경** 먼저 적용 및 테스트
2. **스테이징 환경** 적용 및 검증
3. **운영 환경** 적용 (사용자 적은 시간대)

---

## 📊 전체 일정

| Phase | 작업 | 예상 시간 | 우선순위 |
|-------|------|----------|---------|
| Phase 1 | DB 마이그레이션 | 8시간 (1일) | 🔥 최우선 |
| Phase 2 | 코드 마이그레이션 | 16시간 (2일) | ⭐ 높음 |
| Phase 3 | 테스트 및 검증 | 8시간 (1일) | ✅ 필수 |
| Phase 4 | 레거시 코드 정리 | 4시간 (0.5일) | 📊 중간 |

**총 예상 시간:** 36시간 (4.5일)

---

## 📚 참고 문서

- [테넌트 역할 시스템 표준](../../standards/TENANT_ROLE_SYSTEM_STANDARD.md)
- [5개 대시보드 디자인 계획](./ALL_DASHBOARDS_DESIGN_PLAN.md)
- [TODO 리스트](./TODO.md)

---

**작성자:** AI Assistant  
**최종 수정:** 2025-12-03  
**다음 단계:** Phase 1 데이터베이스 마이그레이션 시작 (사용자 승인 후)

