# Phase 5: 테넌트 생성 테스트 체크리스트

**작성일:** 2025-12-03  
**목적:** Phase 1-4 구현 기능 포함 전체 테스트  
**예상 시간:** 8시간

---

## 📋 테스트 준비

### 사전 준비사항
- [ ] 백엔드 서버 실행 확인 (포트: 8080)
- [ ] 프론트엔드 서버 실행 확인 (포트: 3000)
- [ ] 데이터베이스 접속 확인
- [ ] 테스트 스크립트 실행 권한 확인
- [ ] 관리자 계정 준비 (superadmin@mindgarden.com)

### 테스트 환경
- **백엔드**: http://localhost:8080
- **프론트엔드**: http://localhost:3000
- **데이터베이스**: MySQL (beta0629.cafe24.com:3306/core_solution)

---

## 🧪 Phase 1: 공통코드 시스템 테스트

### 1.1 시스템 공통코드 확인
- [ ] 시스템 공통코드 조회 (`tenant_id = NULL`)
  - [ ] USER_STATUS 코드 그룹 확인
  - [ ] GENDER 코드 그룹 확인
  - [ ] BANK 코드 그룹 확인
  - [ ] 총 12개 시스템 코드 그룹 확인

### 1.2 테넌트 공통코드 자동 삽입 확인
- [ ] 테넌트 생성 시 테넌트 공통코드 자동 삽입 확인
  - [ ] CONSULTATION_PACKAGE 코드 그룹 확인
  - [ ] PAYMENT_METHOD 코드 그룹 확인
  - [ ] SPECIALTY 코드 그룹 확인
  - [ ] 총 17개 테넌트 코드 그룹 확인

### 1.3 공통코드 관리 UI 테스트
- [ ] 관리자 로그인 후 `/admin/common-codes` 접근
- [ ] 테넌트 공통코드 목록 조회
- [ ] 공통코드 생성 테스트
- [ ] 공통코드 수정 테스트
- [ ] 공통코드 삭제 테스트 (Soft Delete)
- [ ] 상담 패키지 생성 테스트 (금액 포함)

---

## 🧪 Phase 2: 관리자 메뉴 시스템 테스트

### 2.1 메뉴 데이터 확인
- [ ] `menus` 테이블 데이터 확인
  - [ ] DASHBOARD 메뉴 확인
  - [ ] SYSTEM_ADMIN 메뉴 확인
  - [ ] COMMON_CODE_MGMT 메뉴 확인
  - [ ] 총 10개 메뉴 확인

### 2.2 관리자 메뉴 조회 테스트
- [ ] `/api/v1/menus/admin` API 호출
- [ ] 계층형 메뉴 구조 확인
- [ ] 메뉴 아이콘 및 경로 확인

### 2.3 관리자 레이아웃 테스트
- [ ] `/admin` 경로 접근
- [ ] 좌측 사이드바 메뉴 표시 확인
- [ ] 메뉴 클릭 시 라우팅 확인
- [ ] 현재 경로 하이라이트 확인

---

## 🧪 Phase 3: 동적 권한 부여 시스템 테스트

### 3.1 메뉴 권한 데이터 확인
- [ ] `role_menu_permissions` 테이블 확인
- [ ] 기본 권한 데이터 확인

### 3.2 메뉴 권한 조회 테스트
- [ ] `/api/v1/admin/menu-permissions/roles/{roleId}` API 호출
- [ ] 역할별 메뉴 권한 목록 확인

### 3.3 메뉴 권한 부여 테스트
- [ ] `/admin/menu-permissions` 접근
- [ ] 역할 선택
- [ ] 메뉴 권한 체크박스 변경
- [ ] 일괄 저장 테스트
- [ ] 권한 변경 후 메뉴 접근 확인

---

## 🧪 Phase 4: 그룹 권한 시스템 테스트

### 4.1 권한 그룹 데이터 확인
- [ ] `permission_groups` 테이블 확인
  - [ ] DASHBOARD_STATISTICS 그룹 확인
  - [ ] DASHBOARD_ERP 그룹 확인
  - [ ] 총 14개 권한 그룹 확인

### 4.2 역할별 권한 그룹 확인
- [ ] `role_permission_groups` 테이블 확인
- [ ] ADMIN 역할 권한 그룹 확인
- [ ] STAFF 역할 권한 그룹 확인

### 4.3 권한 그룹 조회 테스트
- [ ] `/api/v1/permissions/groups/my` API 호출
- [ ] 내 권한 그룹 코드 목록 확인

### 4.4 권한 그룹 체크 테스트
- [ ] `/api/v1/permissions/groups/check/DASHBOARD_ERP` API 호출
- [ ] ADMIN: true 확인
- [ ] STAFF: false 확인

### 4.5 ERP 섹션 권한 제어 테스트
- [ ] ADMIN 계정으로 로그인 → ERP 섹션 표시 확인
- [ ] STAFF 계정으로 로그인 → ERP 섹션 숨김 확인
- [ ] `PermissionGroupGuard` 컴포넌트 동작 확인

### 4.6 권한 그룹 관리 UI 테스트
- [ ] `/admin/permission-groups` 접근
- [ ] 역할 선택
- [ ] 권한 그룹 부여 테스트
- [ ] 권한 그룹 회수 테스트
- [ ] 일괄 부여 테스트

---

## 🧪 Phase 5: 테넌트 생성 통합 테스트

### 5.1 상담사 테넌트 생성
- [ ] 온보딩 신청
  - [ ] API 호출 성공
  - [ ] `onboarding_requests` 테이블 레코드 생성
  - [ ] 상태: PENDING

- [ ] 온보딩 승인
  - [ ] API 호출 성공
  - [ ] `tenants` 테이블 레코드 생성
  - [ ] `users` 테이블 관리자 계정 생성
  - [ ] `tenant_roles` 테이블 역할 생성 (4-5개)
  - [ ] `dashboards` 테이블 대시보드 생성 (4-5개)
  - [ ] **`common_codes` 테이블 테넌트 공통코드 자동 삽입** ⭐
  - [ ] **`permission_groups` 테이블 권한 그룹 확인** ⭐
  - [ ] **`role_permission_groups` 테이블 권한 할당 확인** ⭐

- [ ] 로그인 테스트
  - [ ] 관리자 계정 로그인 성공
  - [ ] JWT 토큰 반환
  - [ ] 세션 정보 확인

- [ ] 대시보드 접근 테스트
  - [ ] `/api/v1/tenant/dashboards` API 호출
  - [ ] 대시보드 목록 조회 (4-5개)
  - [ ] 각 대시보드 접근 가능 확인

### 5.2 내담자 테넌트 생성
- [ ] 온보딩 신청
  - [ ] API 호출 성공
  - [ ] `onboarding_requests` 테이블 레코드 생성

- [ ] 온보딩 승인
  - [ ] API 호출 성공
  - [ ] `tenants` 테이블 레코드 생성 (INDIVIDUAL_CLIENT)
  - [ ] `users` 테이블 관리자 계정 생성
  - [ ] `tenant_roles` 테이블 역할 생성 (CLIENT 포함)
  - [ ] `dashboards` 테이블 대시보드 생성 (Client Dashboard)
  - [ ] **`common_codes` 테이블 테넌트 공통코드 자동 삽입** ⭐
  - [ ] **`permission_groups` 테이블 권한 그룹 확인** ⭐
  - [ ] **`role_permission_groups` 테이블 권한 할당 확인** ⭐

- [ ] 로그인 및 대시보드 접근 테스트
  - [ ] 관리자 계정 로그인 성공
  - [ ] Client Dashboard 접근 확인

### 5.3 데이터 격리 확인
- [ ] 테넌트 A 데이터 조회
  - [ ] `common_codes` 테이블 (tenant_id = A)
  - [ ] `dashboards` 테이블 (tenant_id = A)
  - [ ] `users` 테이블 (tenant_id = A)

- [ ] 테넌트 B 데이터 조회
  - [ ] `common_codes` 테이블 (tenant_id = B)
  - [ ] `dashboards` 테이블 (tenant_id = B)
  - [ ] `users` 테이블 (tenant_id = B)

- [ ] 크로스 테넌트 접근 차단 확인
  - [ ] 테넌트 A로 로그인 후 테넌트 B 데이터 접근 시도
  - [ ] 403 Forbidden 또는 빈 결과 확인

---

## 🔍 검증 포인트

### 데이터베이스 검증
- [ ] `tenants` 테이블 레코드 생성
- [ ] `users` 테이블 관리자 계정 생성
- [ ] `tenant_roles` 테이블 역할 생성
- [ ] `dashboards` 테이블 대시보드 생성
- [ ] **`common_codes` 테이블 공통코드 자동 삽입** ⭐
- [ ] **`code_group_metadata` 테이블 메타데이터 확인** ⭐
- [ ] **`menus` 테이블 메뉴 데이터 확인** ⭐
- [ ] **`role_menu_permissions` 테이블 권한 데이터 확인** ⭐
- [ ] **`permission_groups` 테이블 그룹 데이터 확인** ⭐
- [ ] **`role_permission_groups` 테이블 권한 할당 확인** ⭐
- [ ] 모든 레코드에 `tenant_id` 정상 할당

### 비즈니스 로직 검증
- [ ] 온보딩 상태 변화 (PENDING → APPROVED)
- [ ] 이메일 중복 체크
- [ ] 비즈니스 타입별 역할 할당
- [ ] 비즈니스 타입별 대시보드 생성
- [ ] **비즈니스 타입별 공통코드 자동 삽입** ⭐
- [ ] **비즈니스 타입별 권한 그룹 자동 할당** ⭐

### 보안 검증
- [ ] 테넌트 데이터 격리
- [ ] 권한 기반 접근 제어
- [ ] JWT 토큰 검증
- [ ] CSRF 토큰 검증
- [ ] SQL Injection 방지
- [ ] **그룹 권한 기반 UI 제어** ⭐

### 성능 검증
- [ ] 온보딩 승인 처리 시간 (< 5초)
- [ ] 대시보드 조회 시간 (< 1초)
- [ ] 공통코드 조회 시간 (< 1초)
- [ ] 권한 그룹 조회 시간 (< 1초)
- [ ] 동시 온보딩 처리 (10건)

---

## 📝 테스트 결과 기록

### 테스트 결과 템플릿
```
테스트 케이스: [테스트 이름]
실행 시간: [YYYY-MM-DD HH:MM:SS]
결과: [PASS/FAIL]
HTTP 상태 코드: [200/201/400/500 등]
응답 시간: [ms]
오류 메시지: [있는 경우]
비고: [특이사항]
```

### 성공 기준
- [ ] 모든 API가 예상 HTTP 상태 코드 반환
- [ ] 응답 데이터 구조가 예상과 일치
- [ ] 데이터베이스에 정확한 데이터 저장
- [ ] **공통코드 자동 삽입 정상 동작** ⭐
- [ ] **권한 그룹 자동 할당 정상 동작** ⭐
- [ ] 테넌트별 데이터 격리 확인
- [ ] 권한 체크 정상 동작
- [ ] UI 권한 제어 정상 동작

---

## 🐛 이슈 트래킹

### 발견된 이슈
_이슈 발견 시 여기에 기록_

### 해결된 이슈
_해결된 이슈 기록_

---

## 📊 진행 상황

### 완료율
- Phase 1 (공통코드): ⬜⬜⬜⬜⬜ 0%
- Phase 2 (관리자 메뉴): ⬜⬜⬜⬜⬜ 0%
- Phase 3 (동적 권한): ⬜⬜⬜⬜⬜ 0%
- Phase 4 (그룹 권한): ⬜⬜⬜⬜⬜ 0%
- Phase 5 (통합 테스트): ⬜⬜⬜⬜⬜ 0%

**전체 진행률:** 0%

---

**작성자:** AI Assistant  
**최종 수정:** 2025-12-03

