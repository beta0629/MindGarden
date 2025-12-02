# 권한 시스템 표준

**버전**: 2.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 표준 (테넌트 기반으로 전환)

---

## 📌 개요

MindGarden 프로젝트의 권한 시스템 설계 및 구현 표준입니다.

### 주요 변경 사항 (v2.0.0)
- ✅ **지점 기반 → 테넌트 기반** 전환 (2025-12-02)
- ✅ **ADMIN 역할 자동 권한 부여** (데이터베이스 설정 불필요)
- ✅ **일반 사용자 동적 권한 시스템** 유지

### 참조 문서
- [테넌트 역할 시스템 표준](./TENANT_ROLE_SYSTEM_STANDARD.md)
- [API 설계 표준](./API_DESIGN_STANDARD.md)

---

## 🎯 권한 체계

### 2단계 권한 시스템

#### 1. ADMIN 역할 - 자동 권한 부여 ⭐
```
ADMIN 역할 → 모든 권한 자동 부여 (데이터베이스 불필요)
```

**대상 역할**:
- `ADMIN` - 기본 관리자
- `TENANT_ADMIN` - 테넌트 관리자
- `PRINCIPAL` - 원장
- `OWNER` - 소유자
- `HQ_ADMIN` - 본사 관리자
- `SUPER_HQ_ADMIN` - 수퍼 본사 관리자
- `HQ_MASTER` - 본사 마스터

**장점**:
- ✅ 테넌트 생성 즉시 사용 가능
- ✅ 데이터베이스 권한 설정 불필요
- ✅ 모든 기능 즉시 접근 가능

#### 2. 일반 사용자 - 동적 권한 시스템
```
일반 역할 → 데이터베이스에서 권한 조회 (role_permissions 테이블)
```

**대상 역할**:
- `CONSULTANT` - 상담사
- `CLIENT` - 내담자
- `STAFF` - 사무원
- `TEACHER` - 강사
- `STUDENT` - 학생
- `PARENT` - 학부모

**장점**:
- ✅ 세밀한 권한 제어
- ✅ 역할별 맞춤 권한 설정
- ✅ 동적 권한 변경 가능

---

## 🔐 권한 체크 흐름

### 전체 흐름도
```
API 요청
  ↓
1. 세션에서 사용자 조회
  ↓
2. Spring Security 컨텍스트 설정
  ↓
3. ADMIN 역할 체크
  ├─ ADMIN? → ✅ 즉시 권한 부여
  └─ 일반 사용자? → 4단계로 이동
  ↓
4. DynamicPermissionService로 권한 체크
  ├─ role_permissions 테이블 조회
  ├─ 권한 있음? → ✅ 접근 허용
  └─ 권한 없음? → ❌ 403 에러
```

### 구현 코드
```java
// PermissionCheckUtils.java
public static ResponseEntity<?> checkPermission(
    HttpSession session,
    String permissionCode,
    DynamicPermissionService dynamicPermissionService
) {
    // 1. 세션에서 사용자 조회
    User currentUser = (User) session.getAttribute("currentUser");
    if (currentUser == null) {
        return ResponseEntity.status(401).body(Map.of(
            "success", false,
            "message", "로그인이 필요합니다."
        ));
    }
    
    // 2. Spring Security 컨텍스트 설정
    Authentication auth = createAuthentication(currentUser);
    SecurityContextHolder.getContext().setAuthentication(auth);
    
    // 3. ADMIN 역할은 모든 권한 자동 부여
    boolean isAdmin = AdminRoleUtils.isAdmin(currentUser);
    if (isAdmin) {
        log.info("✅ ADMIN 역할 자동 권한 부여: 사용자={}, 역할={}, 권한={}", 
                currentUser.getEmail(), currentUser.getRole(), permissionCode);
        return null; // 권한 체크 성공
    }
    
    // 4. 일반 사용자는 동적 권한 체크
    boolean hasPermission = dynamicPermissionService.hasPermission(currentUser, permissionCode);
    if (!hasPermission) {
        log.warn("❌ 권한 없음: 사용자={}, 역할={}, 필요한권한={}", 
                currentUser.getEmail(), currentUser.getRole(), permissionCode);
        return ResponseEntity.status(403).body(Map.of(
            "success", false,
            "message", getPermissionErrorMessage(permissionCode)
        ));
    }
    
    return null; // 권한 체크 성공
}
```

---

## 📋 권한 코드 목록

### 상담사/내담자 관리
| 권한 코드 | 설명 | 대상 API |
|----------|------|---------|
| `CONSULTANT_MANAGE` | 상담사 관리 | POST/DELETE /api/admin/consultants |
| `CLIENT_MANAGE` | 내담자 관리 | POST/DELETE /api/admin/clients |
| `CONSULTANT_VIEW` | 상담사 조회 | GET /api/admin/consultants |
| `CLIENT_VIEW` | 내담자 조회 | GET /api/admin/clients |

### 매칭 관리
| 권한 코드 | 설명 | 대상 API |
|----------|------|---------|
| `MAPPING_MANAGE` | 매칭 관리 | POST/PUT/DELETE /api/admin/mappings |
| `MAPPING_VIEW` | 매칭 조회 | GET /api/admin/mappings |

### 스케줄 관리
| 권한 코드 | 설명 | 대상 API |
|----------|------|---------|
| `SCHEDULE_CREATE` | 스케줄 생성 | POST /api/schedules |
| `SCHEDULE_MODIFY` | 스케줄 수정 | PUT /api/schedules/{id} |
| `SCHEDULE_DELETE` | 스케줄 삭제 | DELETE /api/schedules/{id} |
| `SCHEDULE_VIEW` | 스케줄 조회 | GET /api/schedules |

### 급여 관리
| 권한 코드 | 설명 | 대상 API |
|----------|------|---------|
| `SALARY_MANAGE` | 급여 관리 | POST/PUT /api/salary/** |
| `SALARY_VIEW` | 급여 조회 | GET /api/salary/** |

### 통계 조회
| 권한 코드 | 설명 | 대상 API |
|----------|------|---------|
| `STATISTICS_VIEW` | 통계 조회 | GET /api/statistics/** |

### ERP 관리
| 권한 코드 | 설명 | 대상 API |
|----------|------|---------|
| `ERP_MANAGE` | ERP 관리 | POST/PUT/DELETE /api/erp/** |
| `ERP_VIEW` | ERP 조회 | GET /api/erp/** |

---

## 💻 구현 가이드

### 1. Controller에서 권한 체크

#### 기본 패턴
```java
@PostMapping("/api/admin/consultants")
public ResponseEntity<?> registerConsultant(
    @RequestBody ConsultantRegistrationDto dto,
    HttpSession session
) {
    // 권한 체크
    ResponseEntity<?> permissionCheck = PermissionCheckUtils.checkPermission(
        session, 
        "CONSULTANT_MANAGE", 
        dynamicPermissionService
    );
    if (permissionCheck != null) {
        return permissionCheck; // 권한 없음
    }
    
    // 비즈니스 로직 실행
    return adminService.registerConsultant(dto);
}
```

#### ADMIN 전용 API (권한 체크 생략 가능)
```java
@PostMapping("/api/admin/dashboard")
public ResponseEntity<?> createDashboard(
    @RequestBody DashboardDto dto,
    HttpSession session
) {
    // ADMIN만 접근 가능한 API는 권한 체크 생략 가능
    // (세션 체크만으로 충분)
    User currentUser = (User) session.getAttribute("currentUser");
    if (currentUser == null || !AdminRoleUtils.isAdmin(currentUser)) {
        return ResponseEntity.status(403).body(Map.of(
            "success", false,
            "message", "관리자 권한이 필요합니다."
        ));
    }
    
    // 비즈니스 로직 실행
    return dashboardService.createDashboard(dto);
}
```

---

### 2. 동적 권한 설정 (일반 사용자)

#### role_permissions 테이블 구조
```sql
CREATE TABLE role_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(100) NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    permission_code VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    UNIQUE KEY uk_tenant_role_permission (tenant_id, role_name, permission_code),
    INDEX idx_tenant_role (tenant_id, role_name),
    INDEX idx_permission_code (permission_code)
);
```

#### 권한 부여 예시
```sql
-- 상담사에게 스케줄 조회 권한 부여
INSERT INTO role_permissions (tenant_id, role_name, permission_code, is_active, created_by)
VALUES ('tenant-seoul-consultation-001', 'CONSULTANT', 'SCHEDULE_VIEW', TRUE, 'admin@example.com');

-- 상담사에게 자신의 스케줄 생성 권한 부여
INSERT INTO role_permissions (tenant_id, role_name, permission_code, is_active, created_by)
VALUES ('tenant-seoul-consultation-001', 'CONSULTANT', 'SCHEDULE_CREATE', TRUE, 'admin@example.com');
```

---

### 3. 프론트엔드 권한 체크

#### API 호출 시 에러 처리
```javascript
async function createMapping(data) {
    try {
        const response = await fetch('/api/admin/mappings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            credentials: 'include' // 세션 쿠키 포함
        });
        
        if (response.status === 403) {
            // 권한 없음
            const error = await response.json();
            alert(error.message || '접근 권한이 없습니다.');
            return null;
        }
        
        if (response.status === 401) {
            // 로그인 필요
            alert('로그인이 필요합니다.');
            window.location.href = '/login';
            return null;
        }
        
        return await response.json();
    } catch (error) {
        console.error('API 호출 실패:', error);
        return null;
    }
}
```

#### UI 요소 숨김 처리
```javascript
// 사용자 권한 정보 가져오기
const currentUser = await fetch('/api/auth/me', { credentials: 'include' })
    .then(res => res.json());

// ADMIN 역할 체크
const isAdmin = ['ADMIN', 'TENANT_ADMIN', 'PRINCIPAL', 'OWNER'].includes(currentUser.role);

// 권한에 따라 UI 요소 표시/숨김
if (isAdmin) {
    document.getElementById('admin-menu').style.display = 'block';
    document.getElementById('create-consultant-btn').style.display = 'block';
} else {
    document.getElementById('admin-menu').style.display = 'none';
    document.getElementById('create-consultant-btn').style.display = 'none';
}
```

---

## ✅ 테스트 가이드

### 1. ADMIN 권한 테스트
```bash
# 1. ADMIN 로그인
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }' \
  -c cookies.txt

# 2. 매칭 생성 (권한 필요)
curl -X POST http://localhost:8080/api/admin/mappings \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "consultantId": 1,
    "clientId": 2,
    "totalSessions": 10
  }'

# 예상 결과: ✅ 201 Created (권한 자동 부여)
```

### 2. 일반 사용자 권한 테스트
```bash
# 1. 상담사 로그인
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "consultant@example.com",
    "password": "password123"
  }' \
  -c cookies.txt

# 2. 매칭 생성 시도 (권한 없음)
curl -X POST http://localhost:8080/api/admin/mappings \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "consultantId": 1,
    "clientId": 2,
    "totalSessions": 10
  }'

# 예상 결과: ❌ 403 Forbidden (권한 없음)
```

---

## 🔄 마이그레이션 가이드

### 지점 기반 → 테넌트 기반 전환

#### 변경 전 (지점 기반)
```java
// 지점별 권한 체크
if (user.getBranchCode() != null) {
    // 같은 지점 사용자만 조회
    List<User> users = userRepository.findByBranchCode(user.getBranchCode());
}
```

#### 변경 후 (테넌트 기반)
```java
// 테넌트별 권한 체크
if (user.getTenantId() != null) {
    // 같은 테넌트 사용자만 조회
    List<User> users = userRepository.findByTenantId(user.getTenantId());
}
```

---

## 🚫 금지 사항

### 1. 하드코딩된 권한 체크
```java
// ❌ 금지
if (user.getRole() == UserRole.ADMIN) {
    // 특정 역할만 처리
}

// ✅ 권장
ResponseEntity<?> permissionCheck = PermissionCheckUtils.checkPermission(
    session, "CONSULTANT_MANAGE", dynamicPermissionService
);
```

### 2. 지점 코드 기반 권한 체크
```java
// ❌ 금지 (레거시)
if (user.getBranchCode().equals("MAIN001")) {
    // 특정 지점만 처리
}

// ✅ 권장 (테넌트 기반)
if (user.getTenantId().equals("tenant-seoul-consultation-001")) {
    // 특정 테넌트만 처리
}
```

### 3. 권한 체크 생략
```java
// ❌ 금지
@PostMapping("/api/admin/consultants")
public ResponseEntity<?> registerConsultant(@RequestBody ConsultantDto dto) {
    // 권한 체크 없이 바로 실행
    return adminService.registerConsultant(dto);
}

// ✅ 권장
@PostMapping("/api/admin/consultants")
public ResponseEntity<?> registerConsultant(
    @RequestBody ConsultantDto dto,
    HttpSession session
) {
    // 권한 체크 필수
    ResponseEntity<?> permissionCheck = PermissionCheckUtils.checkPermission(
        session, "CONSULTANT_MANAGE", dynamicPermissionService
    );
    if (permissionCheck != null) {
        return permissionCheck;
    }
    return adminService.registerConsultant(dto);
}
```

---

## 📊 권한 감사 로그

### 로그 형식
```
[권한 체크] 사용자={email}, 역할={role}, 권한={permissionCode}, 결과={success/fail}
```

### 로그 예시
```
✅ ADMIN 역할 자동 권한 부여: 사용자=admin@example.com, 역할=ADMIN, 권한=MAPPING_MANAGE
❌ 권한 없음: 사용자=consultant@example.com, 역할=CONSULTANT, 필요한권한=MAPPING_MANAGE
```

---

## 📞 문의

권한 시스템 관련 문의:
- 아키텍처 팀
- 백엔드 팀

**최종 업데이트**: 2025-12-02

