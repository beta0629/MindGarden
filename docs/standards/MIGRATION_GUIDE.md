# 브랜치 시스템에서 테넌트 시스템으로 마이그레이션 가이드

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 가이드

---

## 📌 개요

MindGarden 프로젝트를 **브랜치(지점) 기반 시스템**에서 **테넌트 기반 시스템**으로 마이그레이션하는 가이드입니다.

### 참조 문서
- [테넌트 역할 시스템 표준](./TENANT_ROLE_SYSTEM_STANDARD.md)
- [데이터베이스 스키마 표준](./DATABASE_SCHEMA_STANDARD.md)
- [API 설계 표준](./API_DESIGN_STANDARD.md)
- [브랜치 코드 제거 요약](../project-management/archive/2025-12-02/BRANCH_CODE_REMOVAL_SUMMARY.md)

---

## 🎯 마이그레이션 목표

### Before (브랜치 시스템)
```
본사 (HQ)
  ├─ 지점 A (MAIN001)
  │   ├─ 관리자
  │   ├─ 상담사
  │   └─ 내담자
  └─ 지점 B (MAIN002)
      ├─ 관리자
      ├─ 상담사
      └─ 내담자
```

### After (테넌트 시스템)
```
테넌트 A (tenant-001)
  ├─ 원장 (ADMIN)
  ├─ 상담사 (CONSULTANT)
  ├─ 내담자 (CLIENT)
  └─ 사무원 (STAFF)

테넌트 B (tenant-002)
  ├─ 원장 (ADMIN)
  ├─ 상담사 (CONSULTANT)
  ├─ 내담자 (CLIENT)
  └─ 사무원 (STAFF)
```

### 주요 변경사항
- ❌ 브랜치 코드 (`branch_code`) 제거
- ❌ 본사 개념 제거
- ✅ 테넌트 ID (`tenant_id`) 추가
- ✅ 테넌트별 역할 관리
- ✅ 테넌트별 대시보드

---

## 📋 마이그레이션 단계

### Phase 1: 사전 준비 (1주)
1. 현황 분석
2. 데이터 백업
3. 마이그레이션 계획 수립
4. 테스트 환경 구축

### Phase 2: 데이터베이스 마이그레이션 (2주)
1. 테넌트 테이블 생성
2. 브랜치 → 테넌트 데이터 변환
3. `tenant_id` 컬럼 추가
4. 브랜치 컬럼 제거

### Phase 3: 백엔드 코드 마이그레이션 (3주)
1. 브랜치 검증 로직 제거
2. 테넌트 컨텍스트 추가
3. API 수정
4. 권한 시스템 개선

### Phase 4: 프론트엔드 마이그레이션 (2주)
1. 브랜치 선택 UI 제거
2. 테넌트 컨텍스트 추가
3. API 호출 수정

### Phase 5: 테스트 및 배포 (1주)
1. 통합 테스트
2. 사용자 테스트
3. 운영 배포
4. 모니터링

**총 소요 기간**: 약 9주

---

## 🗄️ 데이터베이스 마이그레이션

### Step 1: 데이터 백업
```sql
-- 전체 데이터베이스 백업
mysqldump -u root -p core_solution > backup_before_migration_$(date +%Y%m%d).sql

-- 주요 테이블 백업
CREATE TABLE users_backup AS SELECT * FROM users;
CREATE TABLE branches_backup AS SELECT * FROM branches;
CREATE TABLE consultants_backup AS SELECT * FROM consultants;
CREATE TABLE clients_backup AS SELECT * FROM clients;
```

### Step 2: 테넌트 테이블 생성
```sql
-- 테넌트 테이블
CREATE TABLE tenants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50) NOT NULL,  -- CONSULTATION, ACADEMY, HOSPITAL
    status VARCHAR(20) DEFAULT 'ACTIVE',
    contact_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    INDEX idx_tenants_tenant_id (tenant_id),
    INDEX idx_tenants_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Step 3: 브랜치 → 테넌트 변환
```sql
-- 각 브랜치를 테넌트로 변환
INSERT INTO tenants (tenant_id, name, business_type, contact_email)
SELECT 
    CONCAT('tenant-', LPAD(id, 3, '0')) as tenant_id,
    branch_name as name,
    'CONSULTATION' as business_type,
    contact_email
FROM branches
WHERE is_deleted = FALSE;

-- 예시 결과:
-- branch_code: MAIN001 → tenant_id: tenant-001
-- branch_code: MAIN002 → tenant_id: tenant-002
```

### Step 4: 사용자 테이블에 tenant_id 추가
```sql
-- tenant_id 컬럼 추가
ALTER TABLE users 
ADD COLUMN tenant_id VARCHAR(36) AFTER id,
ADD INDEX idx_users_tenant_id (tenant_id);

-- 브랜치 코드 → 테넌트 ID 매핑
UPDATE users u
JOIN branches b ON u.branch_code = b.branch_code
JOIN tenants t ON b.branch_name = t.name
SET u.tenant_id = t.tenant_id
WHERE u.branch_code IS NOT NULL;

-- tenant_id가 NULL인 사용자 확인 (오류 체크)
SELECT COUNT(*) FROM users WHERE tenant_id IS NULL AND is_deleted = FALSE;

-- tenant_id를 NOT NULL로 변경
ALTER TABLE users MODIFY tenant_id VARCHAR(36) NOT NULL;
```

### Step 5: 역할 변환
```sql
-- 레거시 역할 → 새 역할 매핑
UPDATE users SET role = 'ADMIN' 
WHERE role IN ('BRANCH_ADMIN', 'BRANCH_SUPER_ADMIN', 'HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER');

UPDATE users SET role = 'STAFF' 
WHERE role = 'BRANCH_MANAGER';

-- 역할 확인
SELECT role, COUNT(*) as count 
FROM users 
WHERE is_deleted = FALSE 
GROUP BY role;

-- 예상 결과:
-- ADMIN: 10
-- CONSULTANT: 50
-- CLIENT: 200
-- STAFF: 5
```

### Step 6: 브랜치 컬럼 제거
```sql
-- 백업 확인 후 실행
ALTER TABLE users DROP COLUMN branch_code;
ALTER TABLE users DROP COLUMN branch_id;

ALTER TABLE consultants DROP COLUMN branch_code;
ALTER TABLE consultants DROP COLUMN branch_id;

ALTER TABLE clients DROP COLUMN branch_code;
ALTER TABLE clients DROP COLUMN branch_id;

-- 다른 테이블들도 동일하게 처리
ALTER TABLE consultations DROP COLUMN branch_code;
ALTER TABLE schedules DROP COLUMN branch_code;
ALTER TABLE payments DROP COLUMN branch_code;
```

### Step 7: 유니크 키 재생성
```sql
-- 기존 유니크 키 제거
ALTER TABLE users DROP INDEX uk_users_email;
ALTER TABLE users DROP INDEX uk_users_username;

-- 테넌트 포함 유니크 키 생성
ALTER TABLE users ADD UNIQUE KEY uk_users_tenant_email (tenant_id, email);
ALTER TABLE users ADD UNIQUE KEY uk_users_tenant_username (tenant_id, username);
```

---

## 💻 백엔드 코드 마이그레이션

### Step 1: 주석 처리된 코드 완전 삭제

#### AdminController.java
```java
// ❌ 삭제할 코드
/*
if (dto.getBranchCode() == null || dto.getBranchCode().trim().isEmpty()) {
    log.error("❌ 지점코드가 없습니다. 상담사 등록을 거부합니다.");
    throw new IllegalArgumentException("지점코드는 필수입니다. 관리자에게 문의하세요.");
}
*/

// ✅ 완전 삭제 후 깔끔한 코드
@PostMapping("/consultants")
public ResponseEntity<ApiResponse<ConsultantResponse>> registerConsultant(
    @RequestBody ConsultantRegistrationRequest dto,
    HttpSession session
) {
    User currentUser = SessionUtils.getCurrentUser(session);
    String tenantId = currentUser.getTenantId();  // 테넌트 ID 사용
    
    ConsultantResponse consultant = adminService.registerConsultant(dto, tenantId);
    return created("상담사가 등록되었습니다.", consultant);
}
```

#### AdminServiceImpl.java
```java
// ❌ 삭제할 코드
/*
Branch branch = null;
if (dto.getBranchCode() != null && !dto.getBranchCode().trim().isEmpty()) {
    try {
        branch = branchService.getBranchByCode(dto.getBranchCode());
        log.info("🔐 관리자 상담사 등록 시 지점 할당: branchCode={}, branchName={}",
            dto.getBranchCode(), branch.getBranchName());
    } catch (Exception e) {
        log.error("❌ 지점 코드 처리 중 오류: branchCode={}, error={}", dto.getBranchCode(), e.getMessage());
        throw new IllegalArgumentException("존재하지 않는 지점 코드입니다: " + dto.getBranchCode());
    }
}
consultant.setBranch(branch);
consultant.setBranchCode(dto.getBranchCode());
*/

// ✅ 테넌트 기반 코드
public ConsultantResponse registerConsultant(ConsultantRegistrationRequest dto, String tenantId) {
    // 테넌트 검증
    Tenant tenant = tenantRepository.findByTenantId(tenantId)
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 테넌트입니다"));
    
    // 사용자 생성
    User user = User.builder()
        .tenantId(tenantId)  // 테넌트 ID 설정
        .username(dto.getUsername())
        .email(dto.getEmail())
        .role(UserRole.CONSULTANT)
        .build();
    
    userRepository.save(user);
    
    // 상담사 생성
    Consultant consultant = Consultant.builder()
        .user(user)
        .tenantId(tenantId)  // 테넌트 ID 설정
        .build();
    
    return consultantRepository.save(consultant);
}
```

### Step 2: 테넌트 컨텍스트 추가
```java
// TenantContext.java
public class TenantContext {
    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();
    
    public static void setTenantId(String tenantId) {
        CURRENT_TENANT.set(tenantId);
    }
    
    public static String getTenantId() {
        return CURRENT_TENANT.get();
    }
    
    public static void clear() {
        CURRENT_TENANT.remove();
    }
}

// TenantFilter.java
@Component
public class TenantFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String tenantId = request.getHeader("X-Tenant-ID");
            if (tenantId != null) {
                TenantContext.setTenantId(tenantId);
            }
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
```

### Step 3: Repository 수정
```java
// ❌ 브랜치 기반 조회
List<User> findByBranchCodeAndIsDeletedFalse(String branchCode);

// ✅ 테넌트 기반 조회
List<User> findByTenantIdAndIsDeletedFalse(String tenantId);

// ❌ 브랜치 + 역할 조회
List<User> findByBranchCodeAndRoleAndIsDeletedFalse(String branchCode, UserRole role);

// ✅ 테넌트 + 역할 조회
List<User> findByTenantIdAndRoleAndIsDeletedFalse(String tenantId, UserRole role);
```

---

## 🎨 프론트엔드 마이그레이션

### Step 1: 브랜치 선택 UI 제거
```javascript
// ❌ 삭제할 코드
<select name="branchCode" required>
    <option value="">지점 선택</option>
    <option value="MAIN001">본점</option>
    <option value="MAIN002">강남점</option>
</select>

// ✅ 테넌트는 자동으로 결정됨 (UI 불필요)
// 로그인 시 세션에 테넌트 ID 저장
```

### Step 2: API 호출 수정
```javascript
// ❌ 브랜치 코드 전달
const response = await fetch('/api/admin/consultants', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        username: 'consultant01',
        branchCode: 'MAIN001'  // 제거
    })
});

// ✅ 테넌트 ID는 헤더로 자동 전달
const response = await fetch('/api/v1/admin/consultants', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': sessionStorage.getItem('tenantId')  // 자동
    },
    body: JSON.stringify({
        username: 'consultant01'
        // branchCode 제거됨
    })
});
```

### Step 3: 테넌트 컨텍스트 추가
```javascript
// TenantContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
    const [tenantId, setTenantId] = useState(null);
    
    useEffect(() => {
        // 로그인 시 테넌트 ID 저장
        const storedTenantId = sessionStorage.getItem('tenantId');
        if (storedTenantId) {
            setTenantId(storedTenantId);
        }
    }, []);
    
    return (
        <TenantContext.Provider value={{ tenantId, setTenantId }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => useContext(TenantContext);

// App.js
import { TenantProvider } from './contexts/TenantContext';

function App() {
    return (
        <TenantProvider>
            {/* 앱 컴포넌트들 */}
        </TenantProvider>
    );
}
```

---

## ✅ 검증 및 테스트

### 데이터 무결성 검증
```sql
-- 1. tenant_id가 NULL인 데이터 확인
SELECT 'users' as table_name, COUNT(*) as null_count 
FROM users WHERE tenant_id IS NULL AND is_deleted = FALSE
UNION ALL
SELECT 'consultants', COUNT(*) 
FROM consultants WHERE tenant_id IS NULL AND is_deleted = FALSE
UNION ALL
SELECT 'clients', COUNT(*) 
FROM clients WHERE tenant_id IS NULL AND is_deleted = FALSE;

-- 2. 브랜치 컬럼이 남아있는지 확인
SELECT TABLE_NAME, COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'core_solution' 
  AND COLUMN_NAME LIKE '%branch%';

-- 3. 역할 변환 확인
SELECT role, COUNT(*) 
FROM users 
WHERE is_deleted = FALSE 
GROUP BY role;
```

### 기능 테스트
```bash
# 1. 사용자 등록 테스트
curl -X POST http://localhost:8080/api/v1/admin/consultants \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-001" \
  -H "Cookie: JSESSIONID=xxx" \
  -d '{
    "username": "consultant01",
    "email": "consultant01@example.com",
    "password": "Test1234!@#"
  }'

# 2. 사용자 조회 테스트
curl -X GET http://localhost:8080/api/v1/users \
  -H "X-Tenant-ID: tenant-001" \
  -H "Cookie: JSESSIONID=xxx"

# 3. 테넌트 격리 테스트
curl -X GET http://localhost:8080/api/v1/users \
  -H "X-Tenant-ID: tenant-002" \
  -H "Cookie: JSESSIONID=xxx"
# → tenant-001의 사용자는 조회되지 않아야 함
```

---

## 🔄 롤백 계획

### 롤백 시나리오
1. 데이터베이스 마이그레이션 실패
2. 백엔드 코드 오류
3. 프론트엔드 오류
4. 성능 문제

### 롤백 절차
```sql
-- 1. 데이터베이스 복원
mysql -u root -p core_solution < backup_before_migration_20251202.sql

-- 2. 코드 롤백
git revert {commit_hash}
git push origin develop

-- 3. 서버 재배포
./scripts/deploy.sh rollback
```

---

## 📊 마이그레이션 체크리스트

### 사전 준비
- [ ] 현황 분석 완료
- [ ] 데이터 백업 완료
- [ ] 테스트 환경 구축
- [ ] 롤백 계획 수립

### 데이터베이스
- [ ] 테넌트 테이블 생성
- [ ] 브랜치 → 테넌트 변환
- [ ] tenant_id 컬럼 추가
- [ ] 역할 변환
- [ ] 브랜치 컬럼 제거
- [ ] 유니크 키 재생성
- [ ] 데이터 무결성 검증

### 백엔드
- [ ] 주석 처리된 코드 삭제
- [ ] 테넌트 컨텍스트 추가
- [ ] Repository 수정
- [ ] Service 수정
- [ ] Controller 수정
- [ ] 권한 시스템 개선
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성

### 프론트엔드
- [ ] 브랜치 선택 UI 제거
- [ ] 테넌트 컨텍스트 추가
- [ ] API 호출 수정
- [ ] 테스트 완료

### 배포
- [ ] 개발 환경 배포
- [ ] 테스트 환경 배포
- [ ] 사용자 테스트
- [ ] 운영 환경 배포
- [ ] 모니터링

---

## 📞 문의

마이그레이션 관련 문의:
- 프로젝트 관리자
- 아키텍처 팀
- DBA 팀

**최종 업데이트**: 2025-12-02

