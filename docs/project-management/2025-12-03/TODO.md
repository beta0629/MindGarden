# TODO - 2025년 12월 3일 (최종)

**작성일:** 2025-12-03  
**최종 업데이트:** 2025-12-03 오후

---

## 🎯 오늘의 핵심 결정 사항

### ✅ 완료된 설계 및 문서
1. **공통코드 시스템 최종 아키텍처** ✅
   - 시스템 공통코드 vs 테넌트 공통코드 명확히 구분
   - 상담 패키지는 금액 포함 (테넌트별로 다름)
   - 테넌트 공통코드 관리 UI 설계 완료

2. **그룹 기반 권한 시스템** ✅
   - 대시보드 섹션을 그룹 코드로 관리
   - 역할별 그룹 권한 매핑
   - 컴포넌트 레지스트리 시스템

3. **관리자 전용 메뉴 구조** ✅
   - 일반 대시보드 vs 관리자 전용 메뉴 분리
   - 동적 권한 부여 시스템 (관리자가 UI에서 설정)

4. **마켓플레이스 확장 구조** ✅
   - 향후 컴포넌트 구매 기능 대비
   - 현재는 형태만 구현 (구매 기능은 나중에)

---

## 🔥 최우선 작업 (즉시 시작)

### Phase 1: 공통코드 시스템 구현 ⭐⭐⭐⭐⭐
**예상 시간:** 2일 (16시간)  
**우선순위:** 1순위 (모든 기능의 기반)

#### 1-1. 데이터베이스 마이그레이션 (4시간)
- [ ] `common_codes` 테이블 확인/수정
  - tenant_id 컬럼 (NULL = 시스템, UUID = 테넌트)
  - extra_data JSON 컬럼 (금액, 시간 등)
  - 인덱스 최적화
  
- [ ] `code_group_metadata` 테이블 확인/수정
  - code_type (SYSTEM, TENANT)
  - category 추가

- [ ] 시스템 공통코드 데이터 삽입
  - USER_STATUS, GENDER, BANK 등
  - 12개 코드 그룹

- [ ] 테넌트 공통코드 샘플 데이터 삽입
  - CONSULTATION_PACKAGE (금액 포함!)
  - PAYMENT_METHOD, SPECIALTY 등
  - 17개 코드 그룹

**참고 문서:**
- `COMMON_CODE_FINAL_ARCHITECTURE.md` ⭐⭐⭐⭐⭐
- `TENANT_COMMON_CODE_CLASSIFICATION.md` ⭐⭐⭐⭐⭐
- `CONSULTATION_PACKAGE_DESIGN.md` ⭐⭐⭐⭐⭐

#### 1-2. 백엔드 구현 (6시간)
- [ ] `TenantCommonCodeService.java` 구현
  - getTenantCodeGroups() - 그룹 목록
  - getCommonCodesByGroup() - 그룹별 코드
  - createCommonCode() - 코드 생성
  - updateCommonCode() - 코드 수정
  - deleteCommonCode() - 코드 삭제 (Soft Delete)
  - reorderCommonCodes() - 순서 변경
  - toggleActive() - 활성화/비활성화

- [ ] `TenantCommonCodeController.java` 구현
  - GET /api/v1/tenant/common-codes/groups
  - GET /api/v1/tenant/common-codes?codeGroup=xxx
  - POST /api/v1/tenant/common-codes
  - PUT /api/v1/tenant/common-codes/{id}
  - DELETE /api/v1/tenant/common-codes/{id}
  - PUT /api/v1/tenant/common-codes/reorder
  - PUT /api/v1/tenant/common-codes/{id}/toggle-active

- [ ] 권한 설정 (Spring Security)
  - ADMIN만 접근 가능
  - tenant_id 자동 설정 (세션에서)

**참고 문서:**
- `TENANT_COMMON_CODE_MANAGEMENT_UI.md` ⭐⭐⭐⭐⭐

#### 1-3. 프론트엔드 구현 (6시간)
- [ ] `TenantCommonCodeManagement.js` 구현
  - 좌측: 코드 그룹 목록 (카테고리별)
  - 우측: 선택된 그룹의 코드 목록
  - 코드 추가/수정/삭제 기능
  - 순서 변경 (드래그 앤 드롭)
  - 활성화/비활성화 토글

- [ ] `CommonCodeModal.js` 구현
  - 코드값, 한글명, 설명 입력
  - 추가 데이터 입력 (금액, 시간 등)
  - 유효성 검증

- [ ] CSS 스타일링
  - `TenantCommonCodeManagement.css`
  - 반응형 디자인
  - 사이드바 + 메인 레이아웃

**참고 문서:**
- `TENANT_COMMON_CODE_MANAGEMENT_UI.md` ⭐⭐⭐⭐⭐

---

## 🔥 Phase 2: 관리자 메뉴 구조 구현 ⭐⭐⭐⭐
**예상 시간:** 1.5일 (12시간)  
**우선순위:** 2순위

#### 2-1. 데이터베이스 마이그레이션 (2시간)
- [ ] `menus` 테이블 생성
  - menu_code, menu_name, menu_path
  - parent_menu_id (계층 구조)
  - min_required_role (최소 요구 역할)
  - menu_location (DASHBOARD, ADMIN_ONLY, BOTH)
  - icon, sort_order, is_active

- [ ] 메뉴 데이터 삽입
  - 일반 대시보드 메뉴
  - 관리자 전용 메뉴 (시스템 관리)
    - 공통코드 관리
    - 사용자 관리
    - 역할 관리
    - 메뉴 권한 설정
    - 조직 관리

**참고 문서:**
- `ADMIN_MENU_STRUCTURE.md` ⭐⭐⭐⭐⭐

#### 2-2. 백엔드 구현 (4시간)
- [ ] `MenuService.java` 구현
  - getUserMenus() - 사용자 역할별 메뉴
  - getAdminMenus() - 관리자 전용 메뉴
  - buildMenuTree() - 계층 구조 생성

- [ ] `MenuController.java` 구현
  - GET /api/v1/menus/user
  - GET /api/v1/menus/admin (ADMIN만)

- [ ] Spring Security 설정
  - /api/v1/admin/** → ADMIN만
  - /api/v1/tenant/common-codes/** → ADMIN만

**참고 문서:**
- `ADMIN_MENU_STRUCTURE.md` ⭐⭐⭐⭐⭐

#### 2-3. 프론트엔드 구현 (6시간)
- [ ] `AdminLayout.js` 구현
  - 좌측 사이드바 (관리자 메뉴)
  - 우측 컨텐츠 영역
  - 메뉴 계층 구조 렌더링
  - 현재 경로 하이라이트

- [ ] `ProtectedRoute.js` 구현
  - 역할 기반 접근 제어
  - 권한 없으면 리다이렉트

- [ ] 라우팅 설정 (`App.js`)
  - /admin → AdminLayout
  - /admin/common-codes → TenantCommonCodeManagement
  - /admin/users → UserManagement
  - 등등

- [ ] CSS 스타일링
  - `AdminLayout.css`
  - 다크 테마 사이드바
  - 반응형 디자인

**참고 문서:**
- `ADMIN_MENU_STRUCTURE.md` ⭐⭐⭐⭐⭐

---

## 🔥 Phase 3: 동적 권한 부여 시스템 ⭐⭐⭐
**예상 시간:** 1.5일 (12시간)  
**우선순위:** 3순위

#### 3-1. 데이터베이스 마이그레이션 (2시간)
- [ ] `role_menu_permissions` 테이블 생성
  - tenant_id, tenant_role_id, menu_id
  - can_view, can_create, can_update, can_delete
  - is_active

- [ ] 기본 권한 데이터 삽입
  - ADMIN: 모든 메뉴
  - STAFF: 일부 메뉴 (기본값)
  - CONSULTANT: 상담 메뉴
  - CLIENT: 기본 메뉴

**참고 문서:**
- `DYNAMIC_MENU_PERMISSION_SYSTEM.md` ⭐⭐⭐⭐⭐

#### 3-2. 백엔드 구현 (4시간)
- [ ] `MenuPermissionService.java` 구현
  - getUserAccessibleMenus() - 권한 기반 메뉴 조회
  - getRoleMenuPermissions() - 역할별 권한 목록
  - grantMenuPermission() - 권한 부여
  - revokeMenuPermission() - 권한 회수
  - batchUpdateMenuPermissions() - 일괄 설정

- [ ] `MenuPermissionController.java` 구현
  - GET /api/v1/admin/menu-permissions/roles/{roleId}
  - POST /api/v1/admin/menu-permissions/grant
  - DELETE /api/v1/admin/menu-permissions/revoke
  - POST /api/v1/admin/menu-permissions/batch

**참고 문서:**
- `DYNAMIC_MENU_PERMISSION_SYSTEM.md` ⭐⭐⭐⭐⭐

#### 3-3. 프론트엔드 구현 (6시간)
- [ ] `MenuPermissionManagement.js` 구현
  - 좌측: 역할 목록
  - 우측: 선택된 역할의 메뉴 권한 테이블
  - 권한 체크박스 (조회/생성/수정/삭제)
  - 일괄 저장 기능

- [ ] 권한 검증 로직
  - 최소 요구 역할 확인
  - 조회 권한 없으면 다른 권한 비활성화

- [ ] CSS 스타일링
  - `MenuPermissionManagement.css`
  - 테이블 레이아웃
  - 체크박스 스타일

**참고 문서:**
- `DYNAMIC_MENU_PERMISSION_SYSTEM.md` ⭐⭐⭐⭐⭐

---

## 📊 Phase 4: 그룹 기반 권한 시스템 ⭐⭐⭐
**예상 시간:** 2일 (16시간)  
**우선순위:** 4순위 (Phase 1-3 완료 후)

#### 4-1. 데이터베이스 마이그레이션 (3시간)
- [ ] `permission_groups` 테이블 생성
  - permission_group_code, group_name
  - category (STATISTICS, MANAGEMENT, ERP, SPECIALIZED)
  - business_type (NULL=공통, CONSULTATION, ACADEMY)
  - icon, sort_order, is_active, is_default

- [ ] `group_components` 테이블 생성
  - permission_group_code, component_code
  - component_name, component_path
  - props (JSON), sort_order, is_required

- [ ] `role_permission_groups` 테이블 생성
  - tenant_id, tenant_role_id, permission_group_code
  - access_level (READ, WRITE, FULL)
  - is_active

- [ ] 기본 그룹 데이터 삽입
  - 공통 그룹 (통계, 관리)
  - ERP 그룹
  - 상담소 전문 그룹
  - 학원 전문 그룹

- [ ] 역할별 그룹 권한 매핑
  - ADMIN: 모든 그룹
  - STAFF: ERP 제외
  - CONSULTANT: 상담 전문
  - CLIENT: 기본만

**참고 문서:**
- `SIMPLIFIED_IMPLEMENTATION_PLAN.md` ⭐⭐⭐⭐⭐
- `GROUP_BASED_PERMISSION_SYSTEM.md` ⭐⭐⭐⭐⭐
- `COMPONENT_REGISTRY_SYSTEM.md` ⭐⭐⭐⭐⭐

#### 4-2. 백엔드 구현 (6시간)
- [ ] `PermissionGroupService.java` 구현
  - getUserPermissionGroups() - 사용자 권한 그룹
  - getGroupComponents() - 그룹 컴포넌트
  - getDashboardStructure() - 대시보드 구조

- [ ] `DashboardController.java` 구현
  - GET /api/v1/dashboard/structure
  - GET /api/v1/dashboard/permission-groups
  - GET /api/v1/dashboard/permission-groups/{groupCode}/components

**참고 문서:**
- `SIMPLIFIED_IMPLEMENTATION_PLAN.md` ⭐⭐⭐⭐⭐

#### 4-3. 프론트엔드 구현 (7시간)
- [ ] `useDashboardStructure` Hook 구현
  - 대시보드 구조 조회
  - 권한 그룹 및 컴포넌트 로딩

- [ ] `UnifiedDashboard.js` 구현
  - 권한 그룹별 섹션 렌더링
  - 동적 컴포넌트 로딩

- [ ] `DashboardSection.js` 구현
  - 섹션 헤더 (아이콘, 제목, 권한 레벨)
  - 컴포넌트 동적 렌더링 (React.lazy)

- [ ] CSS 스타일링
  - `UnifiedDashboard.css`
  - 섹션별 스타일
  - 반응형 디자인

**참고 문서:**
- `SIMPLIFIED_IMPLEMENTATION_PLAN.md` ⭐⭐⭐⭐⭐

---

## 🔧 Phase 5: 테넌트 생성 테스트 ⭐⭐⭐
**예상 시간:** 1일 (8시간)  
**우선순위:** 5순위 (Phase 1-4 완료 후 필수)

### 5-1. 테스트 스크립트 작성 (1시간)
- [ ] 기존 테스트 스크립트 분석 (`scripts/test-tenant-creation.sh`)
- [ ] Phase 1-4 기능 테스트 케이스 추가
  - [ ] 공통코드 시스템 테스트 (시스템/테넌트 분리)
  - [ ] 관리자 메뉴 시스템 테스트
  - [ ] 동적 권한 부여 테스트
  - [ ] 그룹 권한 시스템 테스트
- [ ] 통합 테스트 스크립트 작성
- [ ] 검증 SQL 쿼리 작성

### 5-2. 전체 테스트 실행 (2시간)
- [ ] 상담사 테넌트 생성 테스트
  - 온보딩 신청
  - 승인 처리
  - 테넌트 생성 확인
  - 기본 역할 생성 확인
  - **공통코드 자동 삽입 확인** ⭐
  - **권한 그룹 자동 할당 확인** ⭐
  - 대시보드 접근 확인

- [ ] 내담자 테넌트 생성 테스트
  - 온보딩 신청
  - 승인 처리
  - 테넌트 생성 확인
  - 기본 역할 생성 확인
  - **공통코드 자동 삽입 확인** ⭐
  - **권한 그룹 자동 할당 확인** ⭐
  - 대시보드 접근 확인

- [ ] 데이터 격리 확인
  - 테넌트별 데이터 분리
  - 권한 확인
  - 공통코드 격리 확인

- [ ] 새 기능 통합 테스트
  - [ ] 공통코드 관리 UI 접근 테스트
  - [ ] 관리자 메뉴 접근 테스트
  - [ ] 메뉴 권한 설정 테스트
  - [ ] 그룹 권한 설정 테스트
  - [ ] ERP 섹션 권한 제어 테스트

### 5-3. 테스트 결과 보고서 작성 (1시간)
- [ ] 테스트 결과 정리
- [ ] 발견된 이슈 문서화
- [ ] 개선 사항 제안
- [ ] 다음 단계 계획

**참고 문서:**
- `TENANT_CREATION_TEST_PLAN.md` ⭐⭐⭐
- `docs/project-management/archive/2025-12-02/TENANT_API_TEST_FINAL_REPORT.md` ⭐⭐⭐

---

## 📦 Phase 6: 대시보드 디자인 개선 (나중에)
**예상 시간:** 5일 (40시간)  
**우선순위:** 6순위 (모든 기능 완료 후)

### 디자인 토큰 v3.0 정의 (1일)
- [ ] 색상 시스템
- [ ] 타이포그래피
- [ ] 간격 시스템
- [ ] 그림자/테두리

### 공통 컴포넌트 스타일 (1일)
- [ ] dashboard-common-v3.css
- [ ] 카드, 버튼, 테이블 등

### 역할별 테마 (1일)
- [ ] admin-theme.css
- [ ] consultant-theme.css
- [ ] client-theme.css
- [ ] staff-theme.css

### 대시보드 CSS 리팩토링 (2일)
- [ ] Admin Dashboard
- [ ] Consultant Dashboard
- [ ] Client Dashboard
- [ ] Staff Dashboard

**참고 문서:**
- `ALL_DASHBOARDS_DESIGN_PLAN.md` ⭐⭐⭐

---

## 🚫 보류/제외 항목

### 위젯 시스템 (보류)
- 현재 구현된 위젯 시스템은 보류
- 그룹 기반 권한 시스템으로 대체
- 향후 필요 시 재검토

### 마켓플레이스 (보류)
- 구매 기능은 나중에 구현
- 현재는 그룹 기반 권한 시스템만

### 레거시 역할 마이그레이션 (제외)
- 브랜치/본사 개념 제거 완료
- 레거시 역할 정리 완료
- 추가 마이그레이션 불필요

---

## ✅ 작업 순서 요약

```
1. Phase 1: 공통코드 시스템 (2일) ⭐⭐⭐⭐⭐
   → 모든 기능의 기반

2. Phase 2: 관리자 메뉴 구조 (1.5일) ⭐⭐⭐⭐
   → 관리자 UI 기반

3. Phase 3: 동적 권한 부여 (1.5일) ⭐⭐⭐
   → 유연한 권한 관리

4. Phase 4: 그룹 기반 권한 (2일) ⭐⭐⭐
   → 대시보드 동적 생성

5. Phase 5: 테넌트 생성 테스트 (0.5일) ⭐⭐
   → 전체 시스템 검증

6. Phase 6: 디자인 개선 (5일)
   → UI/UX 향상

총 예상 시간: 12.5일 (100시간)
```

---

## 📚 핵심 참고 문서

### 필수 읽기 (⭐⭐⭐⭐⭐)
1. `COMMON_CODE_FINAL_ARCHITECTURE.md` - 공통코드 최종 아키텍처
2. `TENANT_COMMON_CODE_CLASSIFICATION.md` - 시스템 vs 테넌트 코드 분류
3. `TENANT_COMMON_CODE_MANAGEMENT_UI.md` - 관리 UI 설계
4. `CONSULTATION_PACKAGE_DESIGN.md` - 상담 패키지 (금액 포함)
5. `ADMIN_MENU_STRUCTURE.md` - 관리자 메뉴 구조
6. `DYNAMIC_MENU_PERMISSION_SYSTEM.md` - 동적 권한 부여
7. `SIMPLIFIED_IMPLEMENTATION_PLAN.md` - 그룹 기반 권한 시스템
8. `COMPONENT_REGISTRY_SYSTEM.md` - 컴포넌트 레지스트리

### 참고 문서 (⭐⭐⭐)
9. `COMMON_CODE_ADVANCED_DESIGN.md` - 고급 기능 (향후 확장)
10. `COMPONENT_MARKETPLACE_SYSTEM.md` - 마켓플레이스 (향후 확장)
11. `GROUP_BASED_PERMISSION_SYSTEM.md` - 그룹 권한 개념
12. `ALL_DASHBOARDS_DESIGN_PLAN.md` - 디자인 개선 계획

---

## 🎯 오늘의 목표

**최소 목표:**
1. Phase 1 시작 (공통코드 DB 마이그레이션)
2. 시스템 공통코드 데이터 삽입 완료

**이상적 목표:**
1. Phase 1 완료 (공통코드 시스템 전체)
2. Phase 2 시작 (관리자 메뉴 DB 마이그레이션)

**추가 목표:**
1. Phase 2 완료 (관리자 메뉴 구조 전체)

---

**작성자:** AI Assistant  
**최종 수정:** 2025-12-03 오후
