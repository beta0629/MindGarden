# 테넌트 대시보드 관리 시스템

## 📋 개요

테넌트별 역할 기반 대시보드 관리 시스템으로, 테넌트 관리자가 역할에 따라 대시보드를 자유롭게 추가, 수정, 삭제할 수 있습니다.

### 핵심 기능

1. **온보딩 시 기본 대시보드 자동 생성**
   - 테넌트 입점 시 업종별 기본 역할(학생, 선생님, 관리자)에 대한 대시보드 자동 생성
   - 대시보드 이름은 테넌트 관리자가 수정 가능

2. **관리자 대시보드 관리 자유도**
   - 역할별 대시보드 추가/수정/삭제 가능
   - 대시보드 이름 커스터마이징
   - 대시보드 활성화/비활성화
   - 대시보드 설정(JSON) 관리

3. **역할 기반 대시보드 매핑**
   - 각 역할(TenantRole)에 하나의 대시보드 매핑
   - 사용자는 자신의 역할에 해당하는 대시보드에 접근

## 🏗️ 시스템 구조

### 엔티티 구조

```
TenantDashboard
├── dashboard_id (UUID, PK)
├── tenant_id (FK → tenants.tenant_id)
├── tenant_role_id (FK → tenant_roles.tenant_role_id)
├── dashboard_name (대시보드 이름 - 관리자가 수정 가능)
├── dashboard_name_ko (한글 이름)
├── dashboard_name_en (영문 이름)
├── description (설명)
├── dashboard_type (STUDENT, TEACHER, ADMIN 등)
├── is_default (기본 대시보드 여부)
├── is_active (활성화 여부)
├── display_order (표시 순서)
└── dashboard_config (JSON - 위젯 구성, 레이아웃 등)
```

### 제약 조건

- `(tenant_id, tenant_role_id)` 유니크 제약: 한 역할당 하나의 대시보드만 가능
- 기본 대시보드(`is_default=true`)는 삭제 불가, 비활성화만 가능

## 🚀 온보딩 시 기본 대시보드 생성

### 자동 생성 프로세스

온보딩 승인 시 `ProcessOnboardingApproval` 프로시저 내부에서 다음 순서로 진행:

1. **기본 역할 템플릿 적용** (`ApplyDefaultRoleTemplates`)
   - 업종별 기본 역할 템플릿으로 테넌트 역할 생성
   - 학원(ACADEMY): 학생(STUDENT), 선생님(TEACHER), 관리자(ADMIN)
   - 상담소(CONSULTATION): 내담자(CLIENT), 상담사(CONSULTANT), 관리자(ADMIN)

2. **기본 대시보드 생성** (`TenantDashboardService.createDefaultDashboards`)
   - 각 기본 역할에 대해 대시보드 자동 생성
   - 대시보드 이름: "학생 대시보드", "선생님 대시보드", "관리자 대시보드" (기본값)
   - `is_default=true`로 설정
   - `display_order` 자동 설정 (1, 2, 3)

### 기본 대시보드 설정

| 업종 | 역할 코드 | 역할명 | 기본 대시보드 이름 | dashboard_type |
|------|----------|--------|-------------------|----------------|
| ACADEMY | STUDENT | 학생 | 학생 대시보드 | STUDENT |
| ACADEMY | TEACHER | 선생님 | 선생님 대시보드 | TEACHER |
| ACADEMY | ADMIN | 관리자 | 관리자 대시보드 | ADMIN |
| CONSULTATION | CLIENT | 내담자 | 내담자 대시보드 | CLIENT |
| CONSULTATION | CONSULTANT | 상담사 | 상담사 대시보드 | CONSULTANT |
| CONSULTATION | ADMIN | 관리자 | 관리자 대시보드 | ADMIN |

## 📝 관리자 대시보드 관리 기능

### 1. 대시보드 추가

**시나리오**: 테넌트 관리자가 새로운 역할을 생성하고 해당 역할에 대시보드를 추가하고 싶은 경우

**API**: `POST /api/v1/tenant/dashboards`

**요청 예시**:
```json
{
  "tenantRoleId": "role-uuid-123",
  "dashboardNameKo": "원장 대시보드",
  "dashboardNameEn": "Principal Dashboard",
  "description": "원장용 대시보드입니다.",
  "dashboardType": "PRINCIPAL",
  "isActive": true,
  "displayOrder": 4,
  "dashboardConfig": "{\"widgets\": [], \"layout\": \"grid\"}"
}
```

**제약 조건**:
- 한 역할당 하나의 대시보드만 생성 가능
- 이미 해당 역할에 대시보드가 있으면 에러 반환

### 2. 대시보드 이름 수정

**시나리오**: 테넌트 관리자가 기본 대시보드 이름을 커스터마이징하고 싶은 경우

**API**: `PUT /api/v1/tenant/dashboards/{dashboardId}`

**요청 예시**:
```json
{
  "dashboardNameKo": "우리 학원 학생 전용 대시보드",
  "dashboardNameEn": "Our Academy Student Dashboard",
  "description": "학생들이 사용하는 맞춤형 대시보드"
}
```

**특징**:
- 기본 대시보드(`is_default=true`)도 이름 수정 가능
- 역할 변경도 가능 (단, 중복 체크)

### 3. 대시보드 삭제

**API**: `DELETE /api/v1/tenant/dashboards/{dashboardId}`

**제약 조건**:
- 기본 대시보드(`is_default=true`)는 삭제 불가
- 기본 대시보드는 비활성화(`isActive=false`)만 가능

**에러 응답**:
```json
{
  "success": false,
  "message": "기본 대시보드는 삭제할 수 없습니다. 비활성화만 가능합니다."
}
```

### 4. 대시보드 비활성화

**시나리오**: 대시보드를 일시적으로 숨기고 싶은 경우

**API**: `PUT /api/v1/tenant/dashboards/{dashboardId}`

**요청 예시**:
```json
{
  "isActive": false
}
```

**특징**:
- 기본 대시보드도 비활성화 가능
- 비활성화된 대시보드는 사용자에게 표시되지 않음

## 🔌 API 명세

### 대시보드 목록 조회

```
GET /api/v1/tenant/dashboards
```

**응답 예시**:
```json
{
  "success": true,
  "data": [
    {
      "dashboardId": "dashboard-uuid-1",
      "tenantId": "tenant-uuid",
      "tenantRoleId": "role-uuid-1",
      "roleName": "학생",
      "roleNameKo": "학생",
      "dashboardName": "학생 대시보드",
      "dashboardNameKo": "학생 대시보드",
      "dashboardNameEn": "Student Dashboard",
      "description": "학생용 기본 대시보드입니다.",
      "dashboardType": "STUDENT",
      "isDefault": true,
      "isActive": true,
      "displayOrder": 1,
      "dashboardConfig": null
    },
    {
      "dashboardId": "dashboard-uuid-2",
      "tenantRoleId": "role-uuid-2",
      "roleName": "선생님",
      "dashboardNameKo": "선생님 대시보드",
      "isDefault": true,
      "isActive": true,
      "displayOrder": 2
    }
  ]
}
```

### 대시보드 상세 조회

```
GET /api/v1/tenant/dashboards/{dashboardId}
```

### 대시보드 생성

```
POST /api/v1/tenant/dashboards
Content-Type: application/json

{
  "tenantRoleId": "role-uuid",
  "dashboardNameKo": "대시보드 이름",
  "dashboardNameEn": "Dashboard Name",
  "description": "설명",
  "dashboardType": "CUSTOM",
  "isActive": true,
  "displayOrder": 5,
  "dashboardConfig": "{\"widgets\": []}"
}
```

### 대시보드 수정

```
PUT /api/v1/tenant/dashboards/{dashboardId}
Content-Type: application/json

{
  "dashboardNameKo": "수정된 대시보드 이름",
  "description": "수정된 설명",
  "isActive": false
}
```

### 대시보드 삭제

```
DELETE /api/v1/tenant/dashboards/{dashboardId}
```

## 🔄 온보딩 프로세스 통합

### OnboardingServiceImpl 수정

온보딩 승인 후 기본 대시보드 생성 로직이 자동으로 실행됩니다:

```java
// OnboardingServiceImpl.java
@RequiredArgsConstructor
public class OnboardingServiceImpl implements OnboardingService {
    private final TenantDashboardService tenantDashboardService;
    
    // approve() 메서드 내부
    Map<String, Object> approvalResult = approvalService.processOnboardingApproval(...);
    Boolean success = (Boolean) approvalResult.get("success");
    
    // 온보딩 승인 성공 시 기본 대시보드 생성
    if (success != null && success) {
        try {
            String businessType = request.getBusinessType() != null 
                ? request.getBusinessType() : "CONSULTATION";
            List<TenantDashboardResponse> dashboards = 
                tenantDashboardService.createDefaultDashboards(tenantId, businessType, actorId);
            
            log.info("기본 대시보드 생성 완료: tenantId={}, count={}", tenantId, dashboards.size());
        } catch (Exception e) {
            log.error("기본 대시보드 생성 실패: tenantId={}", tenantId, e);
            // 대시보드 생성 실패는 온보딩 프로세스를 중단하지 않음 (경고만)
        }
    }
}
```

### 실행 순서

1. `ProcessOnboardingApproval` PL/SQL 프로시저 실행
   - 테넌트 생성/활성화
   - 카테고리 매핑 설정
   - 기본 컴포넌트 활성화
   - 기본 요금제 구독 생성
   - **기본 역할 템플릿 적용** (`ApplyDefaultRoleTemplates`)
   - ERD 자동 생성

2. **기본 대시보드 생성** (Java 서비스)
   - 각 기본 역할에 대해 대시보드 자동 생성
   - 역할 템플릿이 이미 적용된 후 실행되므로 역할 ID를 찾을 수 있음
   - 생성 실패해도 온보딩 프로세스는 계속 진행 (경고만)

## 📊 사용 시나리오

### 시나리오 1: 온보딩 후 기본 대시보드 확인

1. 테넌트 온보딩 승인
2. 자동으로 3개 기본 대시보드 생성 (학생, 선생님, 관리자)
3. 테넌트 관리자가 대시보드 목록 조회
4. 각 대시보드 이름 확인 및 필요시 수정

### 시나리오 2: 커스텀 역할에 대시보드 추가

1. 테넌트 관리자가 "원장" 역할 생성
2. "원장 대시보드" 생성 요청
3. 대시보드 생성 완료
4. 원장 역할 사용자들이 해당 대시보드에 접근

### 시나리오 3: 대시보드 이름 커스터마이징

1. 테넌트 관리자가 기본 "학생 대시보드" 이름을 "우리 학원 학생 전용 대시보드"로 변경
2. 대시보드 수정 API 호출
3. 학생 역할 사용자들이 로그인 시 새로운 이름으로 대시보드 확인

### 시나리오 4: 대시보드 일시 숨김

1. 테넌트 관리자가 "선생님 대시보드"를 일시적으로 비활성화
2. `isActive=false`로 설정
3. 선생님 역할 사용자들이 해당 대시보드에 접근 불가
4. 필요시 다시 활성화

## 🗄️ 데이터베이스 마이그레이션

### V33__create_tenant_dashboards_table.sql

```sql
CREATE TABLE IF NOT EXISTS tenant_dashboards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '고유 ID',
    dashboard_id VARCHAR(36) UNIQUE NOT NULL COMMENT '대시보드 UUID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID (FK)',
    tenant_role_id VARCHAR(36) NOT NULL COMMENT '테넌트 역할 ID (FK)',
    dashboard_name VARCHAR(255) NOT NULL COMMENT '대시보드 이름',
    dashboard_name_ko VARCHAR(255) COMMENT '대시보드 이름 (한글)',
    dashboard_name_en VARCHAR(255) COMMENT '대시보드 이름 (영문)',
    description TEXT COMMENT '설명',
    dashboard_type VARCHAR(50) COMMENT '대시보드 타입 (STUDENT, TEACHER, ADMIN 등)',
    is_default BOOLEAN NOT NULL DEFAULT FALSE COMMENT '기본 대시보드 여부',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT '활성화 여부',
    display_order INT NOT NULL DEFAULT 0 COMMENT '표시 순서',
    dashboard_config JSON COMMENT '대시보드 설정 (위젯 구성, 레이아웃 등)',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    deleted_at TIMESTAMP NULL COMMENT '삭제일시',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '삭제 여부',
    version BIGINT NOT NULL DEFAULT 0 COMMENT '버전 (낙관적 잠금)',

    -- 외래 키 제약 조건
    CONSTRAINT fk_dashboard_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (tenant_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT fk_dashboard_tenant_role FOREIGN KEY (tenant_role_id) REFERENCES tenant_roles (tenant_role_id) ON DELETE NO ACTION ON UPDATE NO ACTION,

    -- 인덱스
    INDEX idx_tenant_dashboard_tenant_id (tenant_id),
    INDEX idx_tenant_dashboard_tenant_role_id (tenant_role_id),
    INDEX idx_tenant_dashboard_is_active (is_active),
    INDEX idx_tenant_dashboard_display_order (display_order),

    -- 유니크 제약: 한 역할당 하나의 대시보드만
    UNIQUE KEY uk_tenant_dashboard_role (tenant_id, tenant_role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테넌트 대시보드 테이블';
```

## 🔐 권한 관리

### 접근 제어

- 모든 대시보드 관리 API는 `TenantAccessControlService`를 통해 테넌트 접근 권한 검증
- 테넌트 관리자만 자신의 테넌트 대시보드를 관리 가능
- 다른 테넌트의 대시보드에 접근 불가

### 역할 기반 접근

- 사용자는 자신의 역할(`UserRoleAssignment`)에 해당하는 대시보드만 접근 가능
- 프론트엔드에서 사용자 역할에 맞는 대시보드로 자동 라우팅

## 🎯 향후 확장 계획

1. **대시보드 위젯 관리**
   - `dashboard_config` JSON 필드를 활용한 위젯 구성 관리
   - 위젯 추가/제거/순서 변경 API

2. **대시보드 템플릿**
   - 대시보드 템플릿 시스템
   - 템플릿 기반 대시보드 생성

3. **대시보드 공유**
   - 여러 역할이 같은 대시보드를 공유할 수 있는 기능
   - 현재는 1:1 매핑이지만, 향후 N:M 관계로 확장 가능

4. **대시보드 버전 관리**
   - 대시보드 설정 변경 이력 추적
   - 롤백 기능

## 📚 관련 문서

- [업종별 역할 시스템 설계](./BUSINESS_CATEGORY_ROLE_SYSTEM.md)
- [온보딩 프로세스](./ONBOARDING_ADMIN_ACCOUNT_PROCESS.md)
- [동적 권한 관리 시스템](./SSO_AND_PERMISSION_VERIFICATION_REPORT.md)

