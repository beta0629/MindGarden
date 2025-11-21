# 동적 대시보드 시스템 - 다음 단계 작업 계획

## 📋 현재 완료 상태

### ✅ 완료된 작업 (2025-01-XX)

1. **백엔드 API 구현**
   - ✅ `TenantDashboardService.getDashboardByRole()` 메서드 추가
   - ✅ `GET /api/v1/tenant/dashboards/current` - 현재 사용자 대시보드 조회 API
   - ✅ `GET /api/v1/tenant/dashboards/by-role/{tenantRoleId}` - 역할별 대시보드 조회 API
   - ✅ `UserRoleQueryService` 연동으로 동적 역할 조회
   - ✅ `TenantDashboardRequest`에 `isDefault` 필드 추가

2. **프론트엔드 동적 라우팅**
   - ✅ `frontend/src/utils/dashboardUtils.js` - 동적 대시보드 조회 유틸리티
   - ✅ `frontend/src/components/dashboard/DynamicDashboard.js` - 동적 대시보드 컴포넌트
   - ✅ `UnifiedLogin.js` - 로그인 후 동적 라우팅 적용
   - ✅ `TenantSelection.js` - 테넌트 선택 후 동적 라우팅 적용
   - ✅ `OAuth2Callback.js` - 소셜 로그인 후 동적 라우팅 적용
   - ✅ `App.js` - `/dashboard` 라우트에 `DynamicDashboard` 적용

3. **하위 호환성 유지**
   - ✅ 레거시 역할 기반 라우팅 폴백 로직 포함
   - ✅ 기존 대시보드 컴포넌트 재사용 가능

4. **대시보드 관리 UI 구현**
   - ✅ `DashboardManagement.js` - 대시보드 목록 페이지 구현
   - ✅ `DashboardManagement.css` - CSS 변수 상수화 완료
   - ✅ `DashboardFormModal.js` - 대시보드 생성/수정 모달 구현
   - ✅ `DashboardFormModal.css` - CSS 변수 상수화 완료
   - ✅ `/admin/dashboards` 라우트 추가
   - ✅ `AdminDashboard`에 "대시보드 관리" 메뉴 카드 추가
   - ✅ CSS와 비즈니스 로직 완전 분리
   - ✅ 모든 하드코딩 값 CSS 변수로 상수화
   - ✅ 인라인 스타일 제거 완료

## 🚧 다음 단계 작업 목록

### Phase 1: 대시보드 관리 UI 구현 (우선순위: 높음) ✅ 완료

#### 1.1 대시보드 목록 페이지 ✅ 완료
**경로**: `/admin/dashboards`

**기능**:
- ✅ 테넌트의 모든 대시보드 목록 표시
- ✅ 대시보드 이름, 역할, 타입, 활성화 상태 표시
- ✅ 검색 및 필터링 기능 (전체/활성/비활성)
- ✅ 대시보드 활성화/비활성화 토글
- ✅ 대시보드 삭제 (기본 대시보드 제외)
- ✅ 통계 정보 표시 (전체/활성/비활성/기본 개수)

**파일**:
- ✅ `frontend/src/components/admin/DashboardManagement.js` (생성 완료)
- ✅ `frontend/src/components/admin/DashboardManagement.css` (CSS 변수 상수화 완료)

**API 사용**:
- ✅ `GET /api/v1/tenant/dashboards` - 대시보드 목록 조회
- ✅ `PUT /api/v1/tenant/dashboards/{dashboardId}` - 대시보드 상태 변경
- ✅ `DELETE /api/v1/tenant/dashboards/{dashboardId}` - 대시보드 삭제

#### 1.2 대시보드 생성/수정 모달 ✅ 완료
**기능**:
- ✅ 대시보드 이름 수정 (한글/영문)
- ✅ 역할 선택 (TenantRole 드롭다운)
- ✅ 대시보드 타입 선택
- ✅ 활성화/비활성화 토글
- ✅ 기본 대시보드 설정
- ✅ 표시 순서 설정
- ✅ 대시보드 설정 (JSON) 입력
- ✅ 유효성 검사 및 에러 처리

**파일**:
- ✅ `frontend/src/components/admin/DashboardFormModal.js` (생성 완료)
- ✅ `frontend/src/components/admin/DashboardFormModal.css` (CSS 변수 상수화 완료)

**API 사용**:
- ✅ `GET /api/tenants/{tenantId}/roles` - 테넌트 역할 목록 조회
- ✅ `POST /api/v1/tenant/dashboards` - 대시보드 생성
- ✅ `PUT /api/v1/tenant/dashboards/{dashboardId}` - 대시보드 수정

**코드 품질**:
- ✅ CSS와 비즈니스 로직 완전 분리
- ✅ 모든 하드코딩 값 CSS 변수로 상수화
- ✅ 인라인 스타일 제거 완료
- ✅ 반응형 디자인 적용

#### 1.3 대시보드 설정 UI (향후 확장)
**기능**:
- 위젯 구성 관리
- 레이아웃 설정
- 대시보드 미리보기

**참고**: 현재는 `dashboardConfig` JSON 필드만 있음. 향후 위젯 시스템 구축 시 확장

### Phase 2: 레거시 코드 정리 (우선순위: 중간) ✅ 완료

#### 2.1 하드코딩된 역할 매핑 제거 ✅ 완료
**파일**: `frontend/src/utils/session.js`

**작업**:
- ✅ `ROLE_DASHBOARD_MAP` 상수 deprecated 표시 완료
- ✅ `getDashboardPath()` 함수를 `dashboardUtils.js`의 `getLegacyDashboardPath()`로 대체 완료
- ✅ 모든 호출부를 `redirectToDynamicDashboard()`로 변경 완료

**완료된 파일**:
- ✅ UnifiedHeader.js
- ✅ TabletLogin.js
- ✅ DuplicateLoginModal.js
- ✅ CommonDashboard.js
- ✅ TabletBottomNavigation.js
- ✅ SimpleHeader.js
- ✅ ClientSessionManagement.js
- ✅ BranchManagement.js
- ✅ Homepage.js

#### 2.2 역할별 고정 라우트 정리 ✅ 완료
**파일**: `frontend/src/App.js`

**작업**:
- ✅ 역할별 고정 라우트를 모두 `DynamicDashboard`로 변경 완료
- ✅ 하위 호환성 유지 (기존 경로는 그대로 동작)

**변경된 라우트**:
- ✅ `/client/dashboard` → `DynamicDashboard`
- ✅ `/consultant/dashboard` → `DynamicDashboard`
- ✅ `/admin/dashboard` → `DynamicDashboard`
- ✅ `/super_admin/dashboard` → `DynamicDashboard`
- ✅ `/hq_admin/dashboard` → `DynamicDashboard`
- ✅ `/super_hq_admin/dashboard` → `DynamicDashboard`
- ✅ `/hq_master/dashboard` → `DynamicDashboard`
- ✅ `/branch_super_admin/dashboard` → `DynamicDashboard`
- ✅ `/branch_manager/dashboard` → `DynamicDashboard`
- ✅ `/hq/dashboard` → `DynamicDashboard`

### Phase 3: 테스트 및 검증 (우선순위: 높음)

#### 3.1 통합 테스트 시나리오

**시나리오 1: 단일 테넌트 사용자 로그인**
1. 일반 로그인 (ID/PW)
2. `AuthResponse`에 `currentTenantRole` 포함 확인
3. 동적 대시보드 조회 API 호출 확인
4. 적절한 대시보드 컴포넌트 로드 확인

**시나리오 2: 멀티 테넌트 사용자**
1. 여러 테넌트에 접근 가능한 사용자 로그인
2. 테넌트 선택 화면 표시
3. 테넌트 선택 후 해당 테넌트의 역할에 맞는 대시보드 표시

**시나리오 3: 소셜 로그인**
1. 카카오/네이버/구글 로그인
2. 동적 대시보드 라우팅 확인

**시나리오 4: 온보딩 후 기본 대시보드 확인**
1. 새로운 테넌트 온보딩
2. 기본 대시보드 자동 생성 확인
3. 관리자 로그인 후 기본 대시보드 표시 확인

#### 3.2 에러 케이스 테스트

**케이스 1: 대시보드가 없는 경우**
- 역할에 대시보드가 매핑되지 않은 경우
- 레거시 폴백 동작 확인

**케이스 2: 비활성화된 대시보드**
- `isActive=false`인 대시보드 조회 시
- 기본 대시보드로 폴백 확인

**케이스 3: 역할 정보가 없는 경우**
- `currentTenantRole`이 없는 경우
- 레거시 역할 기반 라우팅 동작 확인

### Phase 4: 성능 최적화 (우선순위: 낮음)

#### 4.1 대시보드 정보 캐싱
- 사용자 세션에 대시보드 정보 캐싱
- 역할 변경 시에만 재조회

#### 4.2 대시보드 컴포넌트 지연 로딩
- React.lazy()를 사용한 컴포넌트 코드 스플리팅
- 대시보드 타입별로 필요한 컴포넌트만 로드

### Phase 5: 문서화 및 가이드 (우선순위: 중간)

#### 5.1 개발자 가이드 ✅ 완료
- ✅ 동적 대시보드 시스템 사용법 (`DYNAMIC_DASHBOARD_DEVELOPER_GUIDE.md`)
- ✅ 새로운 대시보드 타입 추가 방법
- ✅ 대시보드 설정 JSON 구조 문서화
- ✅ API 사용법 및 디버깅 가이드

#### 5.2 관리자 가이드 ✅ 완료
- ✅ 대시보드 관리 UI 사용법 (`DYNAMIC_DASHBOARD_ADMIN_GUIDE.md`)
- ✅ 역할별 대시보드 설정 방법
- ✅ 대시보드 커스터마이징 가이드
- ✅ 문제 해결 가이드

## 📝 작업 우선순위 요약

### ✅ 완료된 작업
1. ✅ **Phase 1.1: 대시보드 목록 페이지 구현** (완료)
   - 관리자가 대시보드를 확인할 수 있는 기본 UI
   - 검색, 필터링, 활성화/비활성화, 삭제 기능 포함

2. ✅ **Phase 1.2: 대시보드 생성/수정 모달** (완료)
   - 대시보드 생성/수정 기능
   - 역할 선택, 타입 선택, 설정 입력
   - CSS 변수 상수화 및 인라인 스타일 제거 완료

### 즉시 진행 (시스템 재부팅 후)
3. **Phase 3.1: 통합 테스트 시나리오 실행**
   - 실제 로그인 테스트
   - 동적 대시보드 라우팅 동작 확인
   - 대시보드 관리 UI 테스트
   - 에러 케이스 확인
   - ✅ 테스트 체크리스트 문서 작성 완료 (`DYNAMIC_DASHBOARD_TEST_CHECKLIST.md`)

### 단기 (1-2주)
4. **Phase 2.1: 레거시 코드 정리** ✅ 완료
   - UnifiedHeader.js 업데이트 완료
   - TabletLogin.js 업데이트 완료
   - DuplicateLoginModal.js 업데이트 완료
   - CommonDashboard.js 업데이트 완료
   - TabletBottomNavigation.js 업데이트 완료
   - SimpleHeader.js 업데이트 완료
   - ClientSessionManagement.js 업데이트 완료
   - BranchManagement.js 업데이트 완료
   - Homepage.js 업데이트 완료

5. **Phase 2.2: 역할별 고정 라우트 정리** ✅ 완료
   - App.js의 모든 역할별 대시보드 라우트를 DynamicDashboard로 변경
   - 하위 호환성 유지 (기존 경로는 그대로 동작)

### 단기 (1-2주)
6. **Phase 3.1: 통합 테스트 시나리오 실행** (시스템 재부팅 후)

### 중기 (1개월)
5. **Phase 1.3: 대시보드 설정 UI**
6. **Phase 4: 성능 최적화**

### 장기
7. **Phase 5: 문서화**

## 🔍 확인 필요 사항

### 백엔드
- [x] `TenantDashboardController.getCurrentUserDashboard()`에서 세션의 `currentTenantRoleId` 조회 로직 확인 ✅
- [x] `UserRoleQueryService.getPrimaryRole()` 메서드가 올바르게 동작하는지 확인 ✅
- [ ] 온보딩 시 기본 대시보드 생성이 정상적으로 동작하는지 확인 (테스트 필요)
- [x] `TenantDashboardRequest`에 `isDefault` 필드 추가 완료 ✅

### 프론트엔드
- [x] `AuthResponse`에 `currentTenantRole` 정보가 포함되는지 확인 ✅
- [x] `sessionManager`에 `currentTenantRoleId` 저장 로직 확인 ✅
- [x] 테넌트 전환 시 역할 정보 업데이트 로직 확인 ✅
- [x] 대시보드 관리 UI 구현 완료 ✅
- [x] CSS 변수 상수화 완료 ✅
- [x] 인라인 스타일 제거 완료 ✅

### 데이터베이스
- [ ] `tenant_dashboards` 테이블에 기본 대시보드 데이터가 생성되었는지 확인 (테스트 필요)
- [ ] `user_role_assignments` 테이블에 사용자 역할 할당이 정상인지 확인 (테스트 필요)

## 🐛 알려진 이슈

1. **OAuth2Callback에서 역할 정보 부족**
   - 현재 `currentTenantRole: null`로 설정됨
   - 세션에서 역할 정보를 가져오는 로직 필요
   - **상태**: TODO - Phase 3 테스트 시 확인 필요

2. **레거시 라우팅과의 충돌 가능성**
   - 기존 하드코딩된 라우트가 우선순위가 높을 수 있음
   - 점진적 마이그레이션 필요
   - **상태**: ✅ Phase 2 완료 - 모든 레거시 라우트를 DynamicDashboard로 변경 완료

## ✅ 최근 완료 내역 (2025-01-XX)

### Phase 1: 대시보드 관리 UI 구현 완료
1. **대시보드 목록 페이지** (`DashboardManagement.js`)
   - 대시보드 목록 조회 및 표시
   - 검색 및 필터링 (전체/활성/비활성)
   - 활성화/비활성화 토글
   - 대시보드 삭제 (기본 대시보드 제외)
   - 통계 정보 표시
   - `/admin/dashboards` 라우트 추가
   - `AdminDashboard`에 메뉴 카드 추가

2. **대시보드 생성/수정 모달** (`DashboardFormModal.js`)
   - 역할 선택 (TenantRole 드롭다운)
   - 대시보드 이름 (한글/영문)
   - 대시보드 타입 선택
   - 설명, 표시 순서, 활성화/비활성화, 기본 대시보드 설정
   - 대시보드 설정 (JSON) 입력
   - 유효성 검사 및 에러 처리

3. **코드 품질 개선**
   - CSS와 비즈니스 로직 완전 분리
   - 모든 하드코딩 값 CSS 변수로 상수화
   - 인라인 스타일 제거 완료
   - 반응형 디자인 적용

## 📚 관련 문서

- [동적 대시보드 라우팅 시스템](./DYNAMIC_DASHBOARD_ROUTING_SYSTEM.md)
- [테넌트 대시보드 관리 시스템](./TENANT_DASHBOARD_MANAGEMENT_SYSTEM.md)
- [업종별 역할 시스템 설계](./BUSINESS_CATEGORY_ROLE_SYSTEM.md)

## 💡 참고사항

- 모든 작업은 **하위 호환성 유지**를 원칙으로 함
- 레거시 코드 제거는 점진적으로 진행
- 테스트 완료 후에만 프로덕션 배포
- 운영 중 시스템이므로 신중하게 진행

