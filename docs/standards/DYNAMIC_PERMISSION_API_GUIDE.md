# 동적 권한 관리 API 가이드

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 가이드

---

## 📌 개요

MindGarden 프로젝트의 동적 권한 관리 API 사용 가이드입니다.

### 참조 문서
- [권한 시스템 표준](./PERMISSION_SYSTEM_STANDARD.md)
- [API 설계 표준](./API_DESIGN_STANDARD.md)
- [테넌트 역할 시스템 표준](./TENANT_ROLE_SYSTEM_STANDARD.md)

### 구현 위치
- **레거시 API**: `PermissionManagementController.java` (`/api/v1/permissions`)
- **테넌트 API**: `TenantPermissionManagementController.java` (`/api/v1/tenant/roles/{tenantRoleId}/permissions`)

---

## 🎯 API 구조

### 2가지 권한 관리 API

#### 1. 레거시 권한 API (권장) ⭐
```
Base URL: /api/v1/permissions
```

**특징**:
- ✅ 역할 기반 권한 관리 (ADMIN, CONSULTANT, CLIENT 등)
- ✅ 간단한 구조
- ✅ 프론트엔드에서 사용 중
- ✅ 캐시 지원

**사용 대상**:
- 일반 사용자 권한 조회
- 역할별 권한 설정
- 권한 체크

#### 2. 테넌트 권한 API (신규)
```
Base URL: /api/v1/tenant/roles/{tenantRoleId}/permissions
```

**특징**:
- ✅ 테넌트 역할 ID 기반
- ✅ 세밀한 권한 제어 (scope, policy_json)
- ✅ ABAC (Attribute-Based Access Control) 지원

**사용 대상**:
- 테넌트별 커스텀 역할 권한 관리
- 고급 권한 정책 설정

---

## 📋 레거시 권한 API

### 1. 내 권한 조회
```http
GET /api/v1/permissions/my-permissions
```

**요청**:
```bash
curl -X GET http://localhost:8080/api/v1/permissions/my-permissions \
  -H "Cookie: JSESSIONID=..."
```

**응답**:
```json
{
  "success": true,
  "message": "성공",
  "data": {
    "userRole": "CONSULTANT",
    "permissions": [
      "SCHEDULE_VIEW",
      "SCHEDULE_CREATE",
      "CLIENT_VIEW"
    ],
    "permissionCount": 3
  }
}
```

---

### 2. 권한 체크
```http
POST /api/v1/permissions/check-permission
```

**요청**:
```bash
curl -X POST http://localhost:8080/api/v1/permissions/check-permission \
  -H "Content-Type: application/json" \
  -H "Cookie: JSESSIONID=..." \
  -d '{
    "permission": "CONSULTANT_MANAGE"
  }'
```

**응답**:
```json
{
  "success": true,
  "message": "성공",
  "data": {
    "userRole": "ADMIN",
    "permission": "CONSULTANT_MANAGE",
    "hasPermission": true
  }
}
```

---

### 3. 역할별 권한 조회
```http
GET /api/v1/permissions/role/{roleName}
```

**요청**:
```bash
curl -X GET http://localhost:8080/api/v1/permissions/role/CONSULTANT \
  -H "Cookie: JSESSIONID=..."
```

**응답**:
```json
{
  "success": true,
  "message": "성공",
  "data": {
    "role": "CONSULTANT",
    "permissions": [
      {
        "permission_code": "SCHEDULE_VIEW",
        "permissionCode": "SCHEDULE_VIEW"
      },
      {
        "permission_code": "SCHEDULE_CREATE",
        "permissionCode": "SCHEDULE_CREATE"
      }
    ],
    "permissionCount": 2
  }
}
```

---

### 4. 역할별 권한 설정
```http
POST /api/v1/permissions/role-permissions
```

**요청**:
```bash
curl -X POST http://localhost:8080/api/v1/permissions/role-permissions \
  -H "Content-Type: application/json" \
  -H "Cookie: JSESSIONID=..." \
  -d '{
    "roleName": "CONSULTANT",
    "permissionCodes": [
      "SCHEDULE_VIEW",
      "SCHEDULE_CREATE",
      "CLIENT_VIEW"
    ]
  }'
```

**응답**:
```json
{
  "success": true,
  "message": "역할별 권한이 성공적으로 설정되었습니다.",
  "data": {
    "roleName": "CONSULTANT",
    "permissionCount": 3
  }
}
```

**권한 계층**:
- `HQ_MASTER`: 모든 역할 관리 가능
- `SUPER_HQ_ADMIN`: HQ_MASTER 제외 모든 역할 관리
- `HQ_ADMIN`: 본사 관리자 이하 역할 관리
- `ADMIN`: 지점 관련 역할만 관리
- `BRANCH_SUPER_ADMIN`: 지점 내 하위 역할 관리
- `BRANCH_ADMIN`: 상담사, 내담자만 관리

---

### 5. 관리 가능한 권한 조회
```http
GET /api/v1/permissions/manageable
```

**요청**:
```bash
curl -X GET http://localhost:8080/api/v1/permissions/manageable \
  -H "Cookie: JSESSIONID=..."
```

**응답**:
```json
{
  "success": true,
  "message": "성공",
  "data": {
    "permissions": [
      {
        "permissionCode": "CONSULTANT_MANAGE",
        "permissionName": "상담사 관리",
        "category": "사용자 관리"
      },
      {
        "permissionCode": "CLIENT_MANAGE",
        "permissionName": "내담자 관리",
        "category": "사용자 관리"
      }
    ],
    "count": 2,
    "userRole": "ADMIN"
  }
}
```

---

### 6. 권한 코드 목록 조회
```http
GET /api/v1/permissions/codes
```

**요청**:
```bash
curl -X GET http://localhost:8080/api/v1/permissions/codes
```

**응답**:
```json
{
  "success": true,
  "message": "성공",
  "data": {
    "ERD_ACCESS": "ERD 메뉴 접근",
    "PAYMENT_ACCESS": "결제 기능 접근",
    "SUPPLY_REQUEST": "비품구매 요청",
    "SCHEDULER_REGISTER": "스케줄러 등록",
    "BRANCH_MANAGE": "지점 관리",
    "SYSTEM_MANAGE": "시스템 관리"
  }
}
```

---

## 📋 테넌트 권한 API

### 1. 역할별 권한 목록 조회
```http
GET /api/v1/tenant/roles/{tenantRoleId}/permissions
```

**요청**:
```bash
curl -X GET http://localhost:8080/api/v1/tenant/roles/role-001/permissions \
  -H "X-Tenant-ID: tenant-seoul-consultation-001" \
  -H "Cookie: JSESSIONID=..."
```

**응답**:
```json
{
  "success": true,
  "message": "성공",
  "data": [
    {
      "id": 1,
      "tenantRoleId": "role-001",
      "permissionCode": "CONSULTANT_MANAGE",
      "scope": "TENANT",
      "policyJson": null,
      "grantedBy": "admin@example.com",
      "grantedAt": "2025-12-02T10:00:00",
      "notes": null
    }
  ]
}
```

---

### 2. 권한 추가
```http
POST /api/v1/tenant/roles/{tenantRoleId}/permissions
```

**요청**:
```bash
curl -X POST http://localhost:8080/api/v1/tenant/roles/role-001/permissions \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-seoul-consultation-001" \
  -H "Cookie: JSESSIONID=..." \
  -d '{
    "permissionCode": "CLIENT_MANAGE",
    "scope": "TENANT",
    "policyJson": null,
    "notes": "내담자 관리 권한 부여"
  }'
```

**응답**:
```json
{
  "success": true,
  "message": "권한이 추가되었습니다.",
  "data": {
    "id": 2,
    "tenantRoleId": "role-001",
    "permissionCode": "CLIENT_MANAGE",
    "scope": "TENANT",
    "grantedBy": "123",
    "grantedAt": "2025-12-02T10:05:00"
  }
}
```

---

### 3. 권한 수정
```http
PUT /api/v1/tenant/roles/{tenantRoleId}/permissions/{permissionId}
```

**요청**:
```bash
curl -X PUT http://localhost:8080/api/v1/tenant/roles/role-001/permissions/2 \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-seoul-consultation-001" \
  -H "Cookie: JSESSIONID=..." \
  -d '{
    "scope": "SELF",
    "notes": "본인 내담자만 관리 가능"
  }'
```

**응답**:
```json
{
  "success": true,
  "message": "권한이 수정되었습니다.",
  "data": {
    "id": 2,
    "tenantRoleId": "role-001",
    "permissionCode": "CLIENT_MANAGE",
    "scope": "SELF",
    "notes": "본인 내담자만 관리 가능"
  }
}
```

---

### 4. 권한 삭제
```http
DELETE /api/v1/tenant/roles/{tenantRoleId}/permissions/{permissionId}
```

**요청**:
```bash
curl -X DELETE http://localhost:8080/api/v1/tenant/roles/role-001/permissions/2 \
  -H "X-Tenant-ID: tenant-seoul-consultation-001" \
  -H "Cookie: JSESSIONID=..."
```

**응답**:
```json
{
  "success": true,
  "message": "권한이 삭제되었습니다.",
  "data": null
}
```

---

## 💻 프론트엔드 사용 예시

### 1. 내 권한 조회 및 UI 제어
```javascript
// 권한 조회
async function loadMyPermissions() {
    const response = await fetch('/api/v1/permissions/my-permissions', {
        credentials: 'include'
    });
    const result = await response.json();
    
    if (result.success) {
        const permissions = result.data.permissions;
        
        // UI 요소 표시/숨김
        if (permissions.includes('CONSULTANT_MANAGE')) {
            document.getElementById('create-consultant-btn').style.display = 'block';
        }
        
        if (permissions.includes('CLIENT_MANAGE')) {
            document.getElementById('create-client-btn').style.display = 'block';
        }
        
        // 전역 변수에 저장
        window.userPermissions = permissions;
    }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', loadMyPermissions);
```

---

### 2. 특정 권한 체크
```javascript
async function checkPermission(permissionCode) {
    const response = await fetch('/api/v1/permissions/check-permission', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            permission: permissionCode
        })
    });
    
    const result = await response.json();
    return result.success && result.data.hasPermission;
}

// 사용 예시
async function createConsultant() {
    const hasPermission = await checkPermission('CONSULTANT_MANAGE');
    
    if (!hasPermission) {
        alert('상담사 생성 권한이 없습니다.');
        return;
    }
    
    // 상담사 생성 로직
    // ...
}
```

---

### 3. 역할별 권한 관리 UI
```javascript
// 역할별 권한 조회
async function loadRolePermissions(roleName) {
    const response = await fetch(`/api/v1/permissions/role/${roleName}`, {
        credentials: 'include'
    });
    const result = await response.json();
    
    if (result.success) {
        const permissions = result.data.permissions;
        
        // 체크박스 UI 업데이트
        permissions.forEach(perm => {
            const checkbox = document.getElementById(`perm-${perm.permissionCode}`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }
}

// 권한 저장
async function saveRolePermissions(roleName) {
    // 체크된 권한 수집
    const checkboxes = document.querySelectorAll('.permission-checkbox:checked');
    const permissionCodes = Array.from(checkboxes).map(cb => cb.value);
    
    const response = await fetch('/api/v1/permissions/role-permissions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            roleName: roleName,
            permissionCodes: permissionCodes
        })
    });
    
    const result = await response.json();
    
    if (result.success) {
        alert('권한이 저장되었습니다.');
    } else {
        alert('권한 저장 실패: ' + result.message);
    }
}
```

---

## ✅ 권한 코드 목록

### 사용자 관리
| 권한 코드 | 설명 | ADMIN | CONSULTANT | CLIENT |
|----------|------|-------|------------|--------|
| CONSULTANT_MANAGE | 상담사 관리 | ✅ | ❌ | ❌ |
| CLIENT_MANAGE | 내담자 관리 | ✅ | ❌ | ❌ |
| CONSULTANT_VIEW | 상담사 조회 | ✅ | ✅ | ❌ |
| CLIENT_VIEW | 내담자 조회 | ✅ | ✅ | ❌ |

### 매칭 관리
| 권한 코드 | 설명 | ADMIN | CONSULTANT | CLIENT |
|----------|------|-------|------------|--------|
| MAPPING_MANAGE | 매칭 관리 | ✅ | ❌ | ❌ |
| MAPPING_VIEW | 매칭 조회 | ✅ | ✅ | ✅ |

### 스케줄 관리
| 권한 코드 | 설명 | ADMIN | CONSULTANT | CLIENT |
|----------|------|-------|------------|--------|
| SCHEDULE_CREATE | 스케줄 생성 | ✅ | ✅ | ❌ |
| SCHEDULE_MODIFY | 스케줄 수정 | ✅ | ✅ | ❌ |
| SCHEDULE_DELETE | 스케줄 삭제 | ✅ | ✅ | ❌ |
| SCHEDULE_VIEW | 스케줄 조회 | ✅ | ✅ | ✅ |

### 급여 관리
| 권한 코드 | 설명 | ADMIN | CONSULTANT | CLIENT |
|----------|------|-------|------------|--------|
| SALARY_MANAGE | 급여 관리 | ✅ | ❌ | ❌ |
| SALARY_VIEW | 급여 조회 | ✅ | ✅ | ❌ |

### 통계 조회
| 권한 코드 | 설명 | ADMIN | CONSULTANT | CLIENT |
|----------|------|-------|------------|--------|
| STATISTICS_VIEW | 통계 조회 | ✅ | ❌ | ❌ |

### ERP 관리
| 권한 코드 | 설명 | ADMIN | CONSULTANT | CLIENT |
|----------|------|-------|------------|--------|
| ERP_MANAGE | ERP 관리 | ✅ | ❌ | ❌ |
| ERP_VIEW | ERP 조회 | ✅ | ❌ | ❌ |

---

## 🔒 보안 고려사항

### 1. 세션 기반 인증
```javascript
// 모든 API 호출 시 credentials: 'include' 필수
fetch('/api/v1/permissions/my-permissions', {
    credentials: 'include'  // 세션 쿠키 포함
});
```

### 2. ADMIN 자동 권한 부여
- ADMIN 역할은 권한 체크 없이 모든 API 접근 가능
- 데이터베이스 권한 설정 불필요

### 3. 일반 사용자 동적 권한 체크
- CONSULTANT, CLIENT 등은 `role_permissions` 테이블에서 권한 조회
- 권한 없으면 403 Forbidden 응답

---

## 📞 문의

동적 권한 API 관련 문의:
- 백엔드 팀
- 프론트엔드 팀

**최종 업데이트**: 2025-12-02

