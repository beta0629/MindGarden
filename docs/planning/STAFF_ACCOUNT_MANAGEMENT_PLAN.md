# 스태프 계정 관리 기능 기획 (옵션 A)

**작성일**: 2026-03-05  
**담당**: core-planner  
**참조**: docs/troubleshooting/STAFF_ACCOUNT_GAP_ANALYSIS.md

---

## 1. 제목·목표

- **제목**: 사용자 관리 페이지에 스태프 탭 추가 및 스태프 목록·역할 변경(·신규 등록) 지원
- **목표**: 어드민이 한 화면에서 스태프 목록 조회, 기존 사용자를 스태프로 역할 변경, (선택) 스태프 신규 등록까지 수행할 수 있도록 UI·API 연동을 완성한다.

---

## 2. 범위

### 2.1 포함

- 사용자 관리 페이지(`/admin/user-management`)에 **「스태프」Pill 탭** 추가
- 스태프 탭: **스태프 목록 조회**, **역할 변경(STAFF 선택 시 API 호출)**
- (Phase 2 선택 시) 스태프 **신규 등록 폼·API** 연동

### 2.2 제외

- 온보딩 흐름에서 스태프 생성 경로 추가 (별도 기획)
- `UserManagement.js` 재사용/라우트 노출 (옵션 B) — 본 기획에서는 옵션 A만 적용

### 2.3 영향 영역

| 영역 | 대상 |
|------|------|
| 프론트엔드 | `UserManagementPage.js`, 스태프 전용 목록/역할변경 UI (신규 또는 기존 목록·모달 재사용) |
| 백엔드 | `GET /api/v1/admin/user-management` 의 role 쿼리 파라미터 지원 여부 확인·필요 시 추가 |
| API | `PUT .../user-management/{userId}/role?newRole=STAFF`, `GET .../user-management/roles` (이미 지원) |

---

## 3. 범위 확정 — Phase 구분 및 우선 적용 범위

### 3.1 Phase 구분

| Phase | 내용 | 비고 |
|-------|------|------|
| **Phase 1** | 스태프 탭 + 스태프 목록 + 역할 변경(STAFF 선택 시 API 호출) | 목록은 기존 API로 조회 후 클라이언트 필터 또는 백엔드 role 파라미터 |
| **Phase 2** | 스태프 신규 등록 폼·API | 상담사/내담자 등록과 유사한 폼·백엔드 STAFF 생성 API 필요 시 |

### 3.2 우선 적용 범위 (결정)

- **우선 적용**: **Phase 1만** 적용을 권장한다.
  - 이유: 갭 분석에서 “스태프 생성·역할 변경 UI가 없다”가 핵심이므로, **목록 + 역할 변경**만으로도 관리자가 기존 사용자를 스태프로 전환할 수 있어 갭을 먼저 해소할 수 있음. 스태프 “신규 등록”은 상담사/내담자용 등록 API와 역할만 다른 신규 API가 필요하므로 Phase 2로 분리해 이후 진행하는 것이 범위 관리에 유리함.
- **Phase 2**는 Phase 1 검증 후, 스태프 신규 등록 수요가 있을 때 별도 태스크로 진행한다.

---

## 4. 의존성·순서

- **선행**: 없음. 백엔드 역할 변경 API·역할 목록 API는 이미 지원.
- **순서**: UI/비주얼 변경이 있으므로 **core-designer(설계) → core-coder(구현)** 순서로 진행.
- **백엔드**: `GET /api/v1/admin/user-management` 에는 현재 **role 쿼리 파라미터가 없음**. Phase 1에서는 **전체 목록 조회 후 프론트에서 role=STAFF 필터**로 구현 가능. 사용자 수가 많은 테넌트를 고려하면, Phase 1 또는 이후에 백엔드에 `?role=STAFF` 지원 추가를 권장(코더 체크리스트에 “선택: role 쿼리 파라미터 추가”로 명시).

---

## 5. 작업 분해 요약

### 5.1 프론트엔드

- **UserManagementPage.js**: Pill 탭에 「스태프」추가, `type=staff` 쿼리 반영, 스태프 전용 패널 렌더링.
- **스태프 목록**: `GET /api/v1/admin/user-management` 호출 후 `role === 'STAFF'` 로 필터하거나, 백엔드에 `role=STAFF` 지원 시 해당 파라미터로 조회. 기존 상담사/내담자 목록과 동일한 B0KlA·ContentArea 구조로 표시(테이블 또는 카드형).
- **역할 변경**: 목록 행/카드에 “역할 변경” 버튼 → 모달에서 역할 선택(STAFF 포함) → `PUT /api/v1/admin/user-management/{userId}/role?newRole=STAFF` 호출. 역할 목록은 `GET /api/v1/admin/user-management/roles` 사용.
- **공통**: AdminCommonLayout 유지, `unified-design-tokens.css`, B0KlA·`mg-v2-ad-b0kla__*` 클래스 준수. 모달은 UnifiedModal 사용.

### 5.2 백엔드

- **확인**: `GET /api/v1/admin/user-management` 에 `role` 쿼리 파라미터(예: `role=STAFF`) 지원 여부 확인.
- **선택**: 미지원 시 Phase 1은 프론트 필터로 진행; 필요 시 `role` 파라미터 추가(AdminUserController·UserService/Repository 쿼리).

---

## 6. 리스크·제약

- **멀티테넌트**: 모든 API·화면은 tenantId 격리 유지.
- **권한**: 사용자 관리·역할 변경은 관리자(ADMIN) 전용으로 유지.
- **UserProfileServiceImpl.isValidRoleTransition**: STAFF 전환이 정의되어 있지 않으나, 현재 역할 변경 API(AdminUserController.changeUserRole)는 UserProfileService를 타지 않고 직접 role 저장하므로 API로 STAFF 변경 가능. 정책상 “관리자 전용 역할 변경”으로 통일하면 유지 가능.

---

## 7. 단계별 완료 기준·체크리스트

### Phase 1

- [ ] 사용자 관리 페이지에 「스태프」Pill 탭이 노출되고, 선택 시 스태프 전용 영역이 표시된다.
- [ ] 스태프 탭에서 STAFF 역할 사용자 목록이 조회·표시된다(API + 클라이언트 필터 또는 role 쿼리).
- [ ] 목록에서 “역할 변경” 등 동작으로 모달을 열고, 역할 목록에 STAFF가 포함되며, STAFF 선택 후 확인 시 `PUT .../user-management/{userId}/role?newRole=STAFF` 가 호출된다.
- [ ] 역할 변경 성공 후 목록 갱신 또는 해당 행 갱신된다.
- [ ] AdminCommonLayout·B0KlA·UnifiedModal·StandardizedApi 등 프로젝트 표준을 따른다.

### Phase 2 (추후)

- [ ] 스태프 신규 등록 폼이 스태프 탭에 노출된다.
- [ ] 등록 시 STAFF 역할로 사용자 생성 API가 호출되고, 목록에 반영된다.

---

## 8. core-designer에게 전달할 UI 요구사항

아래 내용을 **core-designer** 호출 시 태스크 설명(프롬프트)에 포함한다.

### 8.1 사용성(편하게 사용)

- **누가**: 어드민(ADMIN).
- **목적**: 스태프(사무원) 목록 확인, 기존 사용자를 스태프로 역할 변경.
- **흐름**: 사용자 관리 진입 → 스태프 탭 선택 → 스태프 목록 확인 → 필요 시 “역할 변경” 클릭 → 모달에서 STAFF(사무원) 선택 → 확인 → 목록 갱신.
- **우선 동작**: 탭 전환·목록 보기·역할 변경이 최소 클릭으로 이루어지도록, 상담사/내담자 탭과 동일한 패턴 유지.

### 8.2 정보 노출 범위

- **목록**: 스태프(role=STAFF)만 노출. 필드: 이름, 이메일, 전화번호, 역할(표시용), 활성 여부, (선택) 생성일 등. 역할 변경 버튼 노출.
- **역할 변경 모달**: `GET /api/v1/admin/user-management/roles` 로 받은 역할 목록(ADMIN, STAFF, CONSULTANT, CLIENT) 표시, STAFF 선택 가능. 현재 역할과 동일 시 확인 비활성화 등.
- **권한**: 관리자만 접근. 비밀번호·민감 정보는 목록에 노출하지 않음.

### 8.3 레이아웃(배치)

- **공통**: AdminCommonLayout 내부, GNB·LNB 유지. 본문은 ContentArea + 사용자 관리 기존 구조.
- **상단**: 기존 Pill 탭 오른쪽에 「스태프」탭 추가. 순서: 상담사 | 내담자 | **스태프** (또는 요청에 따라 상담사 | 스태프 | 내담자).
- **본문**: 스태프 탭 선택 시 — 상단 탭 아래에 스태프 목록(테이블 또는 카드형, 반응형). 행/카드별 “역할 변경” 버튼. 상담사/내담자 탭과 동일한 B0KlA·mg-v2-ad-b0kla__* 클래스·블록 순서 사용.
- **모달**: 역할 변경 시 UnifiedModal 사용. 제목, 역할 셀렉트, 확인/취소 버튼 배치.
- **참조**: 어드민 대시보드 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample), `mindgarden-design-system.pen` B0KlA, `unified-design-tokens.css`, `/core-solution-unified-modal`, `/core-solution-atomic-design`, `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md`.

### 8.4 산출 요청

- 스태프 탭·목록·역할 변경 버튼·모달의 레이아웃·블록 구성, B0KlA·디자인 토큰 적용 방안. 코드 작성 없음. 코더가 구현할 수 있는 수준의 스펙·시안 또는 문서.

---

## 9. core-coder에게 전달할 구현 체크리스트

아래 내용을 **core-coder** 호출 시 태스크 설명(프롬프트)에 포함한다.

### 9.1 파일·경로

- **페이지**: `frontend/src/components/admin/UserManagementPage.js` — Pill 탭에 스태프 추가, `type=staff` 처리, 스태프 전용 컴포넌트 렌더링.
- **스태프 목록/역할 변경**: 신규 컴포넌트(예: `StaffComprehensiveManagement.js` 또는 `StaffManagement.js`) 생성 후 `UserManagementPage`에서 `type === 'staff'` 일 때 렌더링. 또는 기존 목록 컴포넌트 재사용 가능 시 재사용(역할 필터·API만 스태프용으로).
- **API**: `GET /api/v1/admin/user-management`(필터: 클라이언트 role=STAFF 또는 백엔드 role 쿼리), `GET /api/v1/admin/user-management/roles`, `PUT /api/v1/admin/user-management/{userId}/role?newRole=STAFF`. StandardizedApi 사용.

### 9.2 백엔드 확인·선택 사항

- **확인**: `AdminUserController`의 `getAllUsers`에 `@RequestParam(required = false) String role` 존재 여부. 없으면 Phase 1은 응답 전체를 받아 프론트에서 `data.filter(u => u.role === 'STAFF')` 로 처리.
- **선택**: 사용자 수가 많은 테넌트 대비 `GET /api/v1/admin/user-management?role=STAFF` 지원 추가(Controller·Service/Repository에서 role 조건 추가).

### 9.3 구현 체크리스트

- [ ] `UserManagementPage.js`에 스태프 Pill 탭 추가, URL `?type=staff` 반영.
- [ ] 스태프 전용 목록 영역 구현: `GET /api/v1/admin/user-management` 호출, role=STAFF 필터(또는 role 쿼리), B0KlA·ContentArea 구조로 표시.
- [ ] 목록에 “역할 변경” 버튼 추가, 클릭 시 UnifiedModal로 역할 선택 UI 표시.
- [ ] 역할 목록은 `GET /api/v1/admin/user-management/roles` 사용, STAFF 포함. 선택 후 `PUT .../user-management/{userId}/role?newRole=STAFF` 호출.
- [ ] 성공 시 목록 재조회 또는 해당 행 갱신, 에러 시 사용자 메시지 표시.
- [ ] AdminCommonLayout 유지, unified-design-tokens.css·B0KlA·UnifiedModal·StandardizedApi 준수.
- [ ] (선택) 백엔드에 `role` 쿼리 파라미터 지원 추가.

---

## 10. 분배실행

| Phase | 담당 서브에이전트 | 전달할 태스크 설명 요약 | 적용 스킬/참조 |
|-------|-------------------|--------------------------|----------------|
| **Phase 1a (설계)** | core-designer | §8 사용성·정보 노출·레이아웃 요구와 본 문서 §8 전문 전달. 스태프 탭·목록·역할 변경 모달 레이아웃·B0KlA·토큰 설계 요청. 코드 작성 없음. | /core-solution-atomic-design, B0KlA, unified-design-tokens, /core-solution-unified-modal |
| **Phase 1b (구현)** | core-coder | §9 파일 경로·API·체크리스트와 본 문서 §9 전문 전달. UserManagementPage 스태프 탭, 스태프 목록·역할 변경 모달 구현, 백엔드 role 파라미터 확인·선택 적용. | /core-solution-frontend, /core-solution-api, AdminCommonLayout 필수 |

- **순서**: Phase 1a(설계) 완료 후 Phase 1b(구현) 진행. 설계 산출물을 코더 전달 시 참조 문서로 포함한다.

---

## 11. 참조

- 갭 분석: `docs/troubleshooting/STAFF_ACCOUNT_GAP_ANALYSIS.md`
- 사용자 관리 API: `src/main/java/com/coresolution/consultation/controller/AdminUserController.java`
- 사용자 관리 페이지: `frontend/src/components/admin/UserManagementPage.js`, ConsultantComprehensiveManagement.js, ClientComprehensiveManagement.js
- 역할 상수: `frontend/src/constants/roles.js` (USER_ROLES.STAFF 등)
- 기획 스킬: `/core-solution-planning`
