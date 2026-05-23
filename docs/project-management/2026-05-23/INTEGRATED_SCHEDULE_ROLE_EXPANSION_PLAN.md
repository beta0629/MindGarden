> [폐기됨 — 2026-05-23 사용자 정정] 본 기획서는 매칭 사이드바·권한 확장·API 신설을 포함한 과도한 스코프로 작성됨. 사용자 실제 의도는 **달력 시각 디자인만 어드민과 통일**. 신규 기획서: `CALENDAR_DESIGN_UNIFICATION_PLAN.md` 참조.

---

# 통합 스케줄 — 상담사·내담자 확장 기획

> 작성: 2026-05-23, 작성자: core-planner (오케스트레이터)
> 상태: **P0-inv + P1 기획 산출 / 사용자 컨펌 대기 (C1~C8)**
> 트래커: develop 브랜치 단일 커밋(이 문서) → 컨펌 후 P2~P7 분배실행

## 0. 사용자 원문

> "현재 어드민 통합 스케줄을 기준으로 상담사 와 내담자 도 동일하게 적용 시켜줘 단 자신것만 보여야 됨"

## 1. 목표

- 어드민 **「통합 스케줄」** 화면(매칭 목록 좌측 + 캘린더 우측 + 카드 드래그&드롭 일정 등록)의 UI/UX·정보 구성·1-stop 흐름을 **상담사·내담자**에게 동일하게 확장.
- **role 기반 자기 데이터만 노출**(상담사: 본인 담당 매핑·일정 / 내담자: 본인 매핑·일정).
- 어드민 화면은 본 PR 무영향(현행 유지).

---

## 2. P0 인벤토리 (직접 조사 — 코드 변경 0)

### 2.1 Cat A — 어드민 통합 스케줄 현황

| 영역 | 파일·자원 | 비고 |
|------|------------|------|
| 라우트 | `frontend/src/App.js:758-765` | `/admin/integrated-schedule` → `<AdminCommonLayout title="통합 스케줄링"><IntegratedMatchingSchedule/></AdminCommonLayout>` |
| LNB 메뉴 | `frontend/src/components/dashboard-v2/constants/menuItems.js:14` | `DEFAULT_MENU_ITEMS` 항목 "통합 스케줄 센터" (어드민 LNB 폴백) — 본 메뉴는 DB 메뉴(`/api/v1/menus/lnb`)가 우선이고 폴백으로 사용됨 |
| 페이지 컴포넌트 | `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js` (~353 lines) | 좌: 매칭 목록(필터·드래그 가능 카드) / 우: `UnifiedScheduleComponent` 캘린더 / 헤더: "신규 매칭" 버튼 / 모달: `ScheduleModal`, `MappingCreationModal`, `MappingPaymentModal`, `MappingDepositModal` |
| 페이지 CSS | `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.css` | B0KlA 셸 (`mg-v2-ad-b0kla`) |
| Atomic 서브 | `integrated-schedule/molecules/CardMeta.js`, `MappingPartiesRow.js`, `CardActionGroup.js` / `organisms/MappingScheduleCard.js` | 본 분리 자산을 상담사·내담자 화면에서 **재사용 후보** |
| 사이드바 필터 상수 | `constants/integratedScheduleSidebarFilterConstants.js` + 동일 폴더 테스트 | NEW / REMAINING / ALL view filter, status filter (`ongoing` 등), `canScheduleForMapping`, `isOngoingMapping` |
| 공통 컨테이너 | `ContentArea`, `ContentHeader`, `MGButton` | dashboard-v2 content / common 공통 컴포넌트 |
| 의존 API (매칭) | `GET /api/v1/admin/mappings` | `AdminController#getAllMappings` (line ~960). `PermissionCheckUtils.checkPermission(MAPPING_VIEW)` + `SessionUtils.getTenantId` 필수 + `TenantContextHolder.setTenantId` |
| 의존 API (스케줄) | `GET /api/v1/schedules/admin` (= `UnifiedScheduleComponent` 내 `API_SCHEDULES_ADMIN`) | `ScheduleController#getSchedulesForAdmin` line 1248. `isAdminUser(currentUser)` 가드 |
| 의존 API (액션) | `POST /api/v1/admin/mappings/{id}/approve`, `POST /api/v1/schedules` 등 | 매칭 승인·결제·예치금·일정 등록 |
| 전역 SSOT | `frontend/src/constants/apiEndpoints.js` `API_ENDPOINTS.ADMIN.MAPPINGS.{LIST,STATS,ACTIVE,PENDING_PAYMENT,PAYMENT_CONFIRMED,PENDING_DEPOSIT,SESSIONS_EXHAUSTED}` | 본 PR에서 `MY` 분기 추가 후보 |

### 2.2 Cat B — 상담사·내담자 기존 스케줄 화면

| 역할 | 라우트 | 파일 | 데이터 형태 |
|------|--------|------|--------------|
| 상담사 (레거시) | `/consultant/schedule` (App.js:593) | `frontend/src/components/consultant/ConsultantSchedule.js` | `AdminCommonLayout` + `UnifiedScheduleComponent(userRole="CONSULTANT", userId=user.id)` 만. **매칭 목록 사이드바 없음** |
| 상담사 (리뉴얼·앱셸) | `/consultant/renewal/schedule` (App.js:559) | `frontend/src/components/consultant/ConsultantScheduleRenewal.js` (351 lines) | 별도 주간/일간 뷰. `TenantAwareApiClient` + `SCHEDULE_API`. 본 PR 범위 밖(앱셸 UX 별도)이나 통합 시 충돌 가능 — **C5 컨펌 필요** |
| 상담사 LNB | `CONSULTANT_MENU_ITEMS` | menuItems.js:134 | "일정 관리 > 전체 스케줄" → `/consultant/schedule` |
| 내담자 | `/client/schedule` (App.js:641-645, `ProtectedRoute requiredRoles=[CLIENT]`) | `frontend/src/components/client/ClientSchedule.js` (~131 lines) | `AdminCommonLayout` + `<ScheduleCalendar userRole=CLIENT userId>` 만. **매칭 목록 사이드바 없음** |
| 내담자 LNB | `CLIENT_MENU_ITEMS` | menuItems.js:128 | "스케줄" → `/client/schedule` |

### 2.3 Cat C — 백엔드 role 기반 필터링 현황

| API | 컨트롤러 | 권한 가드 | 데이터 범위 |
|-----|----------|------------|--------------|
| `GET /api/v1/admin/mappings` | `AdminController#getAllMappings` (~L960) | `MAPPING_VIEW` 동적 권한 + `SessionUtils.getTenantId` | 테넌트 내 전체 매칭 (ADMIN/STAFF 전용 사실상) |
| `GET /api/v1/admin/mappings/consultant/{consultantId}/clients` | `AdminController` L476 | `MAPPING_VIEW` | 상담사 ID 기준 매칭, 자신·관리자만 접근 허용 로직 **부족 가능** — C-1 디버거 검증 필요 |
| `GET /api/v1/admin/mappings/client?clientId=` | `AdminController#getMappingsByClient` L624 | **명시 가드 없음(권한 체크 누락 의심)** | 내담자 ID 매칭. **본인만으로 제한 필요** (디버거·코더 위임) |
| `GET /api/v1/schedules/admin` | `ScheduleController#getSchedulesForAdmin` L1248 | `isAdminUser(currentUser)` | 테넌트 전체 |
| `GET /api/v1/schedules/consultant/{consultantId}/my-schedules` | `ScheduleController` L306 | `userRole` 쿼리 param 기반 (admin/staff 또는 본인) | 상담사 본인 일정 |
| `GET /api/v1/schedules/consultant/{consultantId}` | `ScheduleController` L371 | `isAdminOrStaffRole` OR `currentUser.getId().equals(consultantId)` | 상담사 본인 일정 (기간 필터 지원) |
| `GET /api/v1/schedules/client/{clientId}` | `ScheduleController` L725 | **admin/staff만 허용** (request param `userRole`) | **내담자 본인 직접 호출 경로 부재** — 신설 또는 권한 확장 필요 |
| `@PreAuthorize` 적용 | `AdminController` 대부분 메서드 | `hasAnyRole('ADMIN','STAFF')` | `/api/v1/admin/mappings` GET 자체는 동적 권한만(공통코드 기반 `MAPPING_VIEW`) |

**소결**: 본 확장은 백엔드 **(a) 본인 매핑 조회 엔드포인트** 신설/표준화 + **(b) 본인 스케줄 조회(내담자) 권한 확장**이 핵심 의존성. role 분기는 **`@PreAuthorize` + tenantId 필터 + 본인 ID 일치 가드 3중**으로 통일 권장.

### 2.4 Cat D — 멀티테넌트 격리

| 항목 | 현황 |
|------|------|
| `TenantContextHolder.setTenantId` | `ScheduleController#ensureTenantContextFromSession` 패턴 / `AdminController#getAllMappings`에서 명시 설정 |
| 쿼리 레벨 격리 | `userRepository.findByTenantIdAndId`, `ScheduleMappingContextResolver.buildActiveOrExhaustedMappingLookup(tenantId, ...)` |
| 위험 | 신규 "본인" 엔드포인트에서 tenantId 누락 시 다른 테넌트 데이터 노출 가능 — **모든 신규 API에 tenantId 강제** 필수 |

---

## 3. 확장 옵션 비교

| 옵션 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **A. 단일 컴포넌트 공유 + role-aware 필터** | 현 `IntegratedMatchingSchedule.js` 를 `role`·`useSession()` 분기 형태로 일반화하여 ADMIN/CONSULTANT/CLIENT 모두 같은 컴포넌트 사용 | 코드 중복 최소 / 디자인 100% 일치 보장 | props·분기 복잡도 ↑ / 어드민 고유 기능(신규 매칭 생성, 결제·예치 모달) 노출 가드 누락 위험 / 회귀 리스크 ↑ |
| **B. 어드민 컴포넌트 답습 + 페이지 별도 신설** | `consultant/IntegratedSchedule.js`, `client/IntegratedSchedule.js` 신설, 어드민 페이지를 복제·축소 | 어드민 회귀 0 / role별 노출 명확 | 코드 중복(3 페이지) / 향후 디자인 변경 시 3곳 동기 부담 |
| **C. 하이브리드 — atoms·molecules·organisms·필터 상수 공유 + 페이지 컴포넌트 분리** | `integrated-schedule/` 하위 atoms/molecules/organisms (`MappingScheduleCard`, `CardMeta`, `MappingPartiesRow`, `CardActionGroup`)·필터 상수·`UnifiedScheduleComponent` 를 그대로 재사용하고, 페이지(라우트별)는 role 전용으로 분리 | 디자인 일관성 + 라우트·LNB·권한 노출 명확 + 어드민 회귀 0 + 추후 변경은 atomic 자산만 수정 | 페이지 컴포넌트 3개 유지 (수용 가능 — 어드민 액션 차이 명확화에 도움) |

### 3.1 권고

**옵션 C (하이브리드)** 권고. 근거:

1. 어드민 화면은 「신규 매칭」「승인」「결제·예치금」 모달 등 **권한·정보 노출이 어드민 전용 액션**과 결합되어 있어 단일 컴포넌트 props 분기는 노출 가드 누락 가능성이 높다(보안·UX 리스크).
2. atoms/molecules/organisms는 이미 `integrated-schedule/` 폴더로 분리되어 **재사용 준비 완료** — 디자인 일관성 비용은 옵션 A 대비 거의 동일.
3. LNB/라우트 가드(`ProtectedRoute requiredRoles`)·뱃지 카운트·필터 라벨이 role마다 자연스럽게 달라야 함(예: 상담사 화면 "내 담당 매칭", 내담자 화면 "내 진행중 패키지").

> 단, 옵션 C 채택 시 **공통 컴포넌트·상수 SSOT 유지**가 필수. 디자이너·코더 위임 시 "어드민 페이지에 변경 가하지 말 것, atomic 자산은 props 호환 유지" 명시.

---

## 4. 사용자 관점 — 사용성·정보 노출·레이아웃 (디자이너 전달용 §0.4)

### 4.1 사용성

| 역할 | 주 동작 | 빈도 |
|------|---------|------|
| 상담사 | 본인 담당 매핑 카드 확인 → 캘린더에 일정 등록(예약 잡기) → 일정 상세 조회·재예약 | 高 |
| 내담자 | 본인 패키지(매핑) 카드 확인(남은 회기·결제 상태) → 캘린더에서 예약 일정 확인 → (선택) 본인 예약 변경 요청 | 中 |

### 4.2 정보 노출 범위 (역할별)

| 정보 | 어드민 | 상담사 | 내담자 |
|------|--------|--------|--------|
| 매핑 ID | O | O | O |
| 상담사 이름 | O | (본인) | O |
| 내담자 이름 | O | O | (본인) |
| 패키지·총회기·잔여회기 | O | O | O |
| 결제 상태 | O | O(읽기) | O(읽기) |
| 결제 금액·결제수단 | O | **숨김 또는 마스킹 권고 — C2 컨펌** | **부분 노출 — C3 컨펌** |
| 다른 상담사 매핑 | O | **X** | **X** |
| 다른 내담자 매핑 | O | (본인 담당 한정 노출) | **X** |
| 「신규 매칭」 버튼 | O | **X** | **X** |
| 「매칭 승인」 버튼 | O | X | X |
| 「결제 확인·예치금 확인」 모달 | O | X | X |
| 일정 등록 (캘린더 드롭/모달) | O | **본인 가용시간 범위 내만 — C2** | **예약 요청 또는 읽기 전용 — C3** |

### 4.3 레이아웃

- 어드민 동일: **좌(매칭 사이드바) + 우(캘린더)** 1-stop, 상단 `ContentHeader` (제목·서브타이틀·액션)
- 모바일: 어드민의 반응형 답습. 사이드바 → 상단 가로 스크롤 카드 또는 드로어. (디자이너 검토)

---

## 5. Phase·분배실행 (P2~P7)

> ⚠ 본 문서는 **P0-inv + P1 기획**까지. P2 이후는 사용자 컨펌(§7) 통과 후 부모 에이전트가 분배실행 표대로 호출.

| Phase | 담당 서브에이전트 | 모델 권장 | 목적 | 전달 프롬프트 요약 | 의존 |
|-------|----------------------|------------|------|----------------------|------|
| **P2 디자인 핸드오프** | `core-designer` | `gemini-3.1-pro` | 상담사·내담자 통합 스케줄 시안(데스크톱·모바일), atomic 자산 재사용 명세, 정보 노출 차이 시각화 | "어드민 `IntegratedMatchingSchedule` 시안 답습. 좌측 사이드바 라벨·필터 상수는 role별 변형(상담사: '내 담당', 내담자: '내 패키지'). atoms `MappingScheduleCard` 재사용. 헤더 액션 버튼은 role별 가시성. B0KlA·`unified-design-tokens.css`·`AdminCommonLayout` 준수. 산출: `docs/design-system/SCREEN_SPEC_INTEGRATED_SCHEDULE_ROLE.md`" | P1 컨펌 |
| **P3 백엔드 코딩** | `core-coder` | (기본) | role 필터 API 신설·표준화 | "신설/표준화: `GET /api/v1/mappings/my` (현 사용자 role 기반 ConsultantClientMapping 자기 데이터 — CONSULTANT는 `consultant_id=me`, CLIENT는 `client_id=me`, ADMIN/STAFF는 기존 `/api/v1/admin/mappings` 사용 권장). `GET /api/v1/schedules/client/{clientId}` 본인 호출 허용 또는 `/api/v1/schedules/client/me` 신설. **3중 가드 필수**: `@PreAuthorize(hasAnyRole(...))` + `TenantContextHolder.getTenantId()` + `currentUser.getId() == path.id` 검증. 스킬: `/core-solution-backend`, `/core-solution-multi-tenant`, `/core-solution-database-first`. 단위·통합 테스트 시나리오 동봉(타 테넌트 접근 401, 타 role 접근 403)" | P2 컨펌 |
| **P4 프론트엔드 코딩** | `core-coder` | (기본) | 페이지 컴포넌트·라우트·LNB 추가 | "신설: `frontend/src/components/consultant/ConsultantIntegratedSchedule.js`, `frontend/src/components/client/ClientIntegratedSchedule.js`. 어드민 `IntegratedMatchingSchedule.js` UI 패턴 답습, atoms/molecules/organisms 재사용(`integrated-schedule/` 폴더). API는 P3 신설 엔드포인트 사용(`API_ENDPOINTS` SSOT 추가). 라우트: `/consultant/integrated-schedule`, `/client/integrated-schedule`. `ProtectedRoute requiredRoles=[CONSULTANT|CLIENT]` 적용. LNB(`menuItems.js`)에 항목 추가 — 위치는 C5 컨펌. 모달·드래그&드롭은 role별 가시성 제어. `useSession()` 기반 user.id 사용. **어드민 페이지 무변경**. 스킬: `/core-solution-frontend`, `/core-solution-common-modules`, `/core-solution-atomic-design`. SSOT `apiEndpoints.js` 갱신" | P3 완료 |
| **P5 i18n·접근성·표준화** | `core-coder` | (기본) | 라벨 다국어·a11y·하드코딩 게이트 | "신규 UI 텍스트는 `useTranslation()` + `common.labels.*`/신규 키. `safeDisplay` 적용. 검수: `npm run check-hardcode`, ESLint, 디자인 토큰 일치(`unified-design-tokens.css`)" | P4 완료 |
| **P6 테스트** | `core-tester` | `gemini-3.1-pro` | role 격리 + 시각 회귀 | "단위·통합: 상담사 A가 상담사 B의 매핑·일정 조회 시 403 / 내담자 X가 내담자 Y의 매핑·일정 조회 시 403 / 다른 테넌트 데이터 노출 0. E2E: 상담사·내담자 로그인 → 통합 스케줄 화면 진입 → 매칭 카드는 본인 것만 → 캘린더는 본인 일정만. 시각 회귀: 어드민·상담사·내담자 3 화면(데스크톱·모바일). 스킬: `/core-solution-testing`, `/core-solution-multi-tenant`" | P4 완료 |
| **P7 배포** | `core-deployer` | (기본) | 운영 반영 | "GitHub Actions 트리거 절차만(체크리스트 인용). main 푸시 금지(이 PR은 develop). 운영 반영은 별도 사용자 지시 시" | P6 완료 |

**병렬 가능**: P5(i18n·표준화)는 P4 완료 후 P6과 병렬 가능. P3·P2는 P3가 P2 시안 일부에 의존하지 않으므로 부분 병렬 가능(엔드포인트 설계는 시안 무관).

---

## 6. 리스크·제약·완료 기준

### 6.1 리스크

- **권한 누수**: 신규 "본인" 엔드포인트에서 path id ≠ session userId 가드 누락 시 다른 사용자 데이터 노출. **필수**: 3중 가드(@PreAuthorize + tenantId + id 일치).
- **단일 페이지 회귀**: 옵션 C에서도 atomic 자산을 손대면 어드민 화면 회귀. **필수**: atoms props 호환 유지 명시.
- **ConsultantScheduleRenewal 충돌**: 앱셸(/consultant/renewal/schedule)이 별도 UX. **C5 컨펌**: 통합 스케줄 LNB 위치를 기존 메뉴 답습할지 새 메뉴로 둘지 사용자 결정.
- **내담자 일정 등록 정책**: 어드민 화면은 캘린더 드롭 = 일정 즉시 등록. 내담자에게 동일 권한 부여 시 무분별 예약 가능 — **C3 컨펌**.
- **클라이언트 `/api/v1/admin/mappings/client?clientId=` 가드 부족**: 본 확장 무관하게 **사전 디버거 점검 권고** (별도 핫픽스 트랙 가능).

### 6.2 완료 기준 (3-Gate)

- **Gate-1 (Backend)**: `/api/v1/mappings/my`·`/api/v1/schedules/client/me`(또는 신설 경로) 단위·통합 테스트 통과 + 401/403 시나리오 통과 + tenantId 격리 단위 테스트 통과.
- **Gate-2 (Frontend)**: 상담사·내담자 통합 스케줄 화면 진입 시 본인 데이터만 노출 / 어드민 회귀 0 / `npm run check-hardcode` 통과 / Lint·a11y 통과.
- **Gate-3 (QA)**: 시각 회귀 3 화면 통과 / role-cross E2E 시나리오 통과 / 운영 반영 체크리스트(`docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`) 항목 갱신.

---

## 7. 사용자 컨펌 6~8건 (대기)

| ID | 질문 | 디폴트 후보 | 영향 |
|----|------|--------------|------|
| **C1** | 확장 전략 — **A(단일 컴포넌트 공유) / B(별도 페이지 신설) / C(하이브리드 = atoms 공유·페이지 분리)** | **C** (권고) | P2·P3·P4 구조 전체 |
| **C2** | 상담사 화면 범위 — **(a) 본인 담당 매핑만** / (b) 매핑 + 본인이 작성한 일정 / (c) 본인 가용시간 등록까지 포함 | **(c)** (어드민과 동일 1-stop UX, 일정 등록 포함) | 백엔드 API 범위, 캘린더 모달 액션 |
| **C3** | 내담자 화면 범위 — **(a) 확정된 일정 + 내 매핑 카드 읽기 전용** / (b) (a) + 예약 요청 모달 / (c) (b) + 예약 변경 요청 | **(a)** (안전 디폴트. 예약은 어드민·상담사 경유) | 일정 등록 모달 / 권한 / 알림 흐름 |
| **C4** | 권한 거부 시 UX — **(a) 페이지 자체 차단(`ProtectedRoute`)** / (b) 페이지 진입 허용 + 데이터 빈 상태 / (c) 데이터 마스킹 | **(a)** (현행 패턴 일관) | 라우트 가드, 빈 상태 UI |
| **C5** | LNB 위치 — **(a) 기존 메뉴 답습**(상담사: "일정 관리" 아래 "통합 스케줄" 서브, 내담자: "스케줄" 메뉴 라벨 변경) / (b) 새 메뉴 "통합 스케줄" 신설 / (c) 기존 `/consultant/schedule`·`/client/schedule`를 통합 화면으로 **치환** | **(a)** 서브 추가 (회귀·접근성 균형) | LNB·라우트·기존 화면 운명 |
| **C6** | 운영 반영 방식 — **(a) Backend → Frontend 분할 PR**(점진 배포) / (b) 일괄 PR | **(a)** (백엔드 가드 누락 가능성 사전 검증 안전) | 배포 흐름, 롤백 단위 |
| **C7** | 시각 회귀 범위 — **(a) 어드민 + 상담사 + 내담자 3 화면 전부** / (b) 신규 영역만 | **(a)** (어드민 atomic 자산 재사용으로 회귀 가능성 존재) | P6 테스트 범위·시간 |
| **C8** | 디자이너 시안 시점 — **(a) P1 컨펌 직후 즉시 P2** / (b) P3 백엔드 합의 후 P2 / (c) P3·P2 동시 | **(a)** (시안이 P3 엔드포인트 설계에 정보 노출 범위를 제공) | P2~P4 진행 순서 |

### 7.1 부속 컨펌 (선택)

| ID | 질문 | 디폴트 |
|----|------|--------|
| C2-x | 상담사 화면에서 결제 금액·결제수단 노출 — 마스킹 / 비노출 / 노출 | **마스킹** |
| C3-x | 내담자 예약 요청 채택 시(C3=b) — 어드민 자동 알림(SMS/카카오/푸시) 발송 | 비활성(추후) |

---

## 8. 분배실행 표 (요약)

| Order | Phase | subagent_type | model | 의존 | 산출 |
|-------|-------|----------------|-------|------|------|
| 1 | P0-inv + P1 기획 | core-planner (본 문서) | (기본) | — | 이 문서 |
| 2 | P2 디자인 핸드오프 | core-designer | gemini-3.1-pro | C1·C2·C3·C5 | `docs/design-system/SCREEN_SPEC_INTEGRATED_SCHEDULE_ROLE.md` |
| 3 | P3 백엔드 | core-coder | (기본) | C2·C3·C6 | `/api/v1/mappings/my`, `/api/v1/schedules/client/me`(또는 권한 확장) + 통합 테스트 |
| 4 | P4 프론트엔드 | core-coder | (기본) | P2·P3·C5 | `ConsultantIntegratedSchedule.js`, `ClientIntegratedSchedule.js` + LNB·라우트 |
| 5 | P5 i18n·표준화 | core-coder | (기본) | P4 | i18n 키·`safeDisplay`·`check-hardcode` 통과 |
| 6 | P6 테스트 | core-tester | gemini-3.1-pro | P4 (병렬 P5) | role 격리 E2E + 시각 회귀 보고서 |
| 7 | P7 배포 | core-deployer | (기본) | P6 + 사용자 운영 반영 지시 | GitHub Actions 트리거 / 체크리스트 갱신 |

> 실제 호출은 부모 에이전트가 **사용자 컨펌(§7) 통과 후** 이 표대로 순차/병렬 호출. 각 서브에이전트 결과는 본 기획에게 보고되어 다음 Phase 분배 / 사용자 보고 갱신에 사용.

---

## 9. 참조 문서

- `docs/standards/TENANT_ROLE_SYSTEM_STANDARD.md` (역할·테넌트 표준)
- `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md` (위임 순서·테스터 게이트)
- `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md` (`safeDisplay`·React #130)
- `docs/design-system/v2/INTEGRATED_SCHEDULE_LAYOUT_AND_CARD_SPEC.md`, `INTEGRATED_SCHEDULE_CARD_FINAL_SPEC.md`
- `docs/standards/COMMON_MODULES_USAGE_GUIDE.md` (공통 모듈)
- `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`
- 스킬: `/core-solution-planning`, `/core-solution-business-flow`, `/core-solution-multi-tenant`, `/core-solution-frontend`, `/core-solution-backend`, `/core-solution-common-modules`, `/core-solution-encapsulation-modularization`
