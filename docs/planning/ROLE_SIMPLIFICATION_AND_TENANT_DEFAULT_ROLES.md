# 역할 단순화(ADMIN, STAFF, CONSULTANT, CLIENT) 및 테넌트 기본 역할 정리

> 2025-02 적용: 역할을 **ADMIN, STAFF, CONSULTANT, CLIENT** 4개로 단순화. ADMIN만 ERP 메뉴 노출, STAFF는 ERP 제외·원장이 권한 그룹으로 추가 부여 가능.

---

## 1. 현재 역할 정의 위치

### 1-1. 백엔드 (User 엔티티·세션에서 사용)

| 위치 | 내용 |
|------|------|
| **consultation/constant/UserRole.java** | enum: **ADMIN, STAFF, CONSULTANT, CLIENT** 4개만 사용. 레거시(PRINCIPAL, TENANT_ADMIN, PARENT, HQ_*, BRANCH_* 등)는 `fromString()`에서 ADMIN 또는 STAFF로 매핑. |
| **User.role** | DB 컬럼에 저장되는 값 = UserRole.name() (예: ADMIN, CONSULTANT, CLIENT) |

### 1-2. 프론트엔드

| 위치 | 내용 |
|------|------|
| **constants/roles.js** | USER_ROLES: CLIENT, CONSULTANT, ADMIN, BRANCH_SUPER_ADMIN, BRANCH_MANAGER, HQ_ADMIN, SUPER_HQ_ADMIN, HQ_MASTER 등 |
| **constants/menu.js** | ROLES (동일). 메뉴는 역할별로 ADMIN_MENU_ITEMS, HQ_ADMIN_MENU_ITEMS 등 분리 (현재 API 메뉴 사용 시 일부만 사용) |
| **utils/menuPermissionValidator.js** | MENU_PERMISSIONS: 역할별 menuGroups·features 정의 |

---

## 2. 테넌트 생성 시 “기본으로 생성되는 역할”

테넌트가 생성되는 경로는 **온보딩 승인** 한 경로입니다. 다음 두 가지가 이때 이루어집니다.

### 2-1. tenant_roles 테이블 (역할 템플릿 적용)

- **진행 순서**: 온보딩 승인 시 호출되는 **스토어드 프로시저** 안에서  
  `CreateOrActivateTenant` → **ApplyDefaultRoleTemplates** → CreateTenantAdminAccount 순으로 실행.
- **ApplyDefaultRoleTemplates**  
  - `role_templates` 테이블에서 **business_type**에 맞는 행을 조회.  
  - 그 행들을 그대로 **tenant_roles**에 INSERT (해당 tenant_id로).
- **즉, “테넌트 생성 시 기본 역할”은 `role_templates` 테이블에 무엇이 등록되어 있느냐에 따라 결정됩니다.**  
  - 업종(business_type)별로 다른 템플릿을 둘 수 있음.  
  - DB/시드 데이터에서 `role_templates`를 확인해야 “실제로 어떤 역할이 생성되는지” 알 수 있음.

### 2-2. 공통코드 ROLE 그룹 (테넌트별 역할 코드)

- **진행 시점**: 온보딩 **승인 후** 초기화 단계에서  
  `OnboardingServiceImpl.initializeTenantAfterOnboardingInNewTransaction()`  
  → `insertTenantRoleCodes(tenantId, businessType, createdBy)` 호출.
- **위치**: `OnboardingServiceImpl.insertTenantRoleCodes()` (private).
- **기본으로 넣는 역할 코드 (common_code, code_group = 'ROLE')**:

| businessType | 생성되는 ROLE 코드 (표시명) |
|--------------|----------------------------|
| **CONSULTATION** | ADMIN(원장), CONSULTANT(상담사), CLIENT(내담자), STAFF(사무원) |
| **COUNSELING** | ADMIN(원장), CONSULTANT(상담사), CLIENT(내담자), STAFF(사무원) |
| **ACADEMY** | ADMIN(원장), CONSULTANT(강사), CLIENT(학생), PARENT(학부모), STAFF(행정직원) |
| **FOOD_SERVICE** | ADMIN(사장), CONSULTANT(요리사), CLIENT(고객), STAFF(직원) |
| **TAEKWONDO** | ADMIN(관장), CONSULTANT, CLIENT, STAFF 등 (동일 패턴) |

- **정리**:  
  - **공통**: ADMIN, CONSULTANT, CLIENT (+ 업종에 따라 STAFF 또는 PARENT).  
  - “테넌트 생성 시 기본 역할”은  
    1) **tenant_roles** = `role_templates` 기준,  
    2) **공통코드 ROLE** = 위 표 기준으로 생성됩니다.

---

## 3. 역할 단순화 제안: CLIENT, CONSULTANT, ADMIN, SUBADMIN

### 3-1. 목표

- **역할 4개만 사용**: CLIENT, CONSULTANT, ADMIN, SUBADMIN.
- **ADMIN vs SUBADMIN**  
  - **ADMIN**: ERP 메뉴 **노출** (기존 “전체 관리자”에 가까움).  
  - **SUBADMIN**: ERP 메뉴 **비노출** (나머지 관리 기능만).

### 3-2. 적용 시 수정 포인트

| 구분 | 수정 내용 |
|------|-----------|
| **백엔드 UserRole** | SUBADMIN enum 추가. 레거시 관리자 역할(BRANCH_*, HQ_* 등)을 ADMIN 또는 SUBADMIN으로 매핑. isAdmin()에 SUBADMIN 포함. ERP 접근 여부는 role == ADMIN 인지로만 체크. |
| **메뉴/권한** | 관리자 메뉴: ADMIN → 현재와 동일(ERP 포함). SUBADMIN → ERP 메뉴/라우트 제외한 동일 메뉴. (메뉴 API 또는 프론트 필터에서 role === 'SUBADMIN' 이면 ERP 노출 제거) |
| **권한(permission)** | ERP_ACCESS, ERP_* 관련 권한은 ADMIN만 부여. SUBADMIN에는 부여하지 않음. (백엔드 권한 초기화·역할별 권한 매핑에서 구분) |
| **테넌트 기본 역할** | **tenant_roles**: role_templates에 SUBADMIN 템플릿 추가 여부 결정 (필요 시 업종별로 “기본 관리자”를 SUBADMIN으로 둘 수 있음). **공통코드 ROLE**: insertTenantRoleCodes에서 업종별로 ADMIN 대신 SUBADMIN을 기본으로 넣을지, 또는 ADMIN+SUBADMIN 둘 다 넣을지 정책 결정. |

### 3-3. ERP만 구분하는 규칙 (한 줄)

- **메뉴**: `role === 'ADMIN'` 일 때만 ERP 메뉴/라우트 노출.  
- **API**: ERP 관련 API는 `role == ADMIN` (또는 “ERP_ACCESS 권한” 보유)일 때만 허용.

---

## 4. 요약

| 항목 | 내용 |
|------|------|
| **현재 백엔드 역할** | UserRole: ADMIN, CONSULTANT, CLIENT, STAFF, PARENT, TENANT_ADMIN, PRINCIPAL, OWNER. 레거시는 ADMIN으로 매핑. |
| **테넌트 생성 시 tenant_roles** | ApplyDefaultRoleTemplates 프로시저가 **role_templates** 테이블(business_type 기준)을 복사해 생성. 실제 “기본 역할 목록”은 **role_templates** 데이터에 따름. |
| **테넌트 생성 시 공통코드 ROLE** | insertTenantRoleCodes()가 **ADMIN, CONSULTANT, CLIENT, (+ STAFF 또는 PARENT)** 를 common_code ROLE로 넣음 (업종별 상이). |
| **제안** | 역할을 **CLIENT, CONSULTANT, ADMIN, SUBADMIN** 4개로 단순화. ADMIN만 ERP 메뉴/권한 부여, SUBADMIN은 그 외 관리 기능만. |

역할 단순화와 ERP 구분을 적용하려면 위 3-2 항목대로 백엔드(UserRole, 권한 매핑), 메뉴(API/프론트), 테넌트 기본 역할(role_templates·insertTenantRoleCodes)을 함께 조정하면 됩니다.
