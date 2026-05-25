# D5 P4 i18n Phase 2 — P1 디자이너 핸드오프 (트랙 A 카피·키 명명) (2026-05-26)

> **산출 유형**: 디자이너 핸드오프 (core-designer 역할, 카피·키 명명 합의). 운영 코드(`frontend/src/**`·`scripts/**`·`docs/standards/**`) 0줄 수정.
> **위임 출처**: 합의서 `DESIGN_TOKEN_GAP_2026Q2_D5_P4_I18N_PHASE_2.md` §4.1 P1 행 + §5.8 C5=c (트랙별 분리) 결정.
> **적용 디자인·비주얼 의사결정 규약**: `CORE_PLANNER_DELEGATION_ORDER.md` — 카피·라벨·i18n 결정 사항은 디자이너 역할 주도.
> **후속**: 본 핸드오프 정착 후 PR-A `core-coder` 위임 진입.

---

## §0 메타

| 항목 | 값 |
|---|---|
| 산출 일자 | 2026-05-26 |
| 산출 역할 | core-designer |
| 합의서 SHA | `8b89df494` (`DESIGN_TOKEN_GAP_2026Q2_D5_P4_I18N_PHASE_2.md` §5.8 일괄 채택본) |
| P0-inv SHA | `a43ed3d7f` (위임 출처 HEAD; 측정 SHA `9e22d9e4c`, D11 P4 push 직전) |
| P0-inv 산출물 | `docs/project-management/2026-05-26/D5_P4_I18N_PHASE_2_P0_INVENTORY.md` + `reports/d5-p4-i18n-inventory-{trackA,trackB,trackC,namespace}-20260526.json` |
| 위임 컨펌 | C1=e / C2=c / C3=a / C4=a / C5=c / C6=b / C7=b (§5.8 일괄) |
| 본 핸드오프 범위 | **트랙 A 카피·키 명명만** (PR-B/PR-C 핸드오프는 별도 후속 라운드) |
| Phase 1 정착물 | `frontend/src/i18n/index.js` · `ko/common.json` (60 leaves) · `ko/admin.json` (350 leaves) |
| 트랙 A 실효 i18n 대상 | 6,494 라인 / 355 파일 (주석 제외 기준, P0-inv §2) |

---

## §1 namespace 분할 합의

### 1.1 현황 → PR-A 후 구조

```
Phase 1 정착 (현재 410 leaves)
  ko/
    common.json   ← 60 leaves (공통 액션·상태·라벨)
    admin.json    ← 350 leaves (어드민 도메인)

PR-A 후 목표 (~1,010 leaves, +600 신설·확장)
  ko/
    common.json   ← ~250 leaves (+190, UnifiedModal·Alert·Confirm 표준 + 공통 액션 12종 + 상태 5종)
    admin.json    ← ~750 leaves (+400, LNB/GNB + 위젯/대시보드 + 권한/세션/사용자 관리 광역)
    error.json    ← ~190 leaves (신설, validation/api/network/business 4분류)
```

### 1.2 namespace 정의 — 3종 (PR-A 대상)

#### `error` — 신설 (PR-A)

| 항목 | 값 |
|---|---|
| 파일 경로 | `frontend/src/locales/ko/error.json` |
| 책임 영역 | 폼 검증 오류 / API·HTTP 오류 / 네트워크 오류 / 비즈니스 로직 오류 / toast 메시지 |
| P0-inv 근거 | 트랙 A error/toast 서브카테고리 22 파일 / 565 라인 (실효 345) |
| 키 분기 | `error.validation.*` / `error.api.*` / `error.network.*` / `error.business.*` |
| PR-A 분담 leaves | ~190 |
| `i18n/index.js` 등록 필요 변경 | `resources.ko.error: koError` import 1행 + `ns: ['common', 'admin', 'error']` 1행 수정 |

> **톤 가이드**: 사용자 불안 최소화·액션 유도. "오류가 발생했습니다. 다시 시도해 주세요." 패턴. 심각도(critical/warning/info) 구분 없이 단일 톤 유지(심각도 구분은 UI 색상·아이콘으로 처리).

#### `common` — 확장 (PR-A)

| 항목 | 값 |
|---|---|
| 현재 leaves | 60 |
| PR-A 목표 leaves | ~250 (+190) |
| 추가 영역 | UnifiedModal 표준 카피 (`modal.*`) + 공통 액션 12종 (`action.*`) + 상태 5종 (`state.*`) + 공통 네비게이션 (`nav.*`) |
| 책임 영역 | 도메인 중립 공통 라벨 — 도메인 종속 라벨은 `admin.*` 또는 도메인 namespace 로 |
| 키 분기 | `action.*` / `state.*` / `modal.*` / `nav.*` / `label.*` / `message.*` |

#### `admin` — 확장 (PR-A)

| 항목 | 값 |
|---|---|
| 현재 leaves | 350 |
| PR-A 목표 leaves | ~750 (+400) |
| 추가 영역 | LNB 메뉴명 전체 / GNB 헤더·프로필·로그아웃 / 어드민 대시보드 위젯·빈 상태·CTA / 권한 관리 / 세션 관리 / 사용자 관리 / 상담사 종합 관리 / AdminOnboarding / 기타 Top-20 컴포넌트 |
| 키 분기 | `admin.lnb.*` / `admin.gnb.*` / `admin.dashboard.*` / `admin.widget.*` / `admin.permission.*` / `admin.session.*` / `admin.user.*` / `admin.consultant.*` / `admin.onboarding.*` |

### 1.3 PR-A/B/C leaves 분담량 도식

| PR | 대상 namespace | 신설/확장 | 분담 leaves (목표) | KPI K=1,500 기여 |
|---|---|:---:|---:|---:|
| **PR-A (트랙 A)** | `error` 신설 + `common` 확장 + `admin` 확장 | 신설 1 + 확장 2 | **~+600** (error 190 + common 190 + admin 220) | 40.0% |
| **PR-B (트랙 B)** | `settings` 신설 + `statistics` 신설 + `report` 신설 | 신설 3 | **~+250** | 16.7% |
| **PR-C (트랙 C)** | `common` 추가 확장 (UnifiedModal i18n props) + `error` 추가 | 확장 2 | **~+150** | 10.0% |
| **후속 (D5 P5)** | `schedule` / `payment` / `consultation` / `dashboard` 등 | — | ~+500 | 33.3% |
| **합계 (Phase 2 종료 목표)** | — | — | **> 1,500** | 100% |

> **현재 기준선**: 410 leaves (Phase 1 + D11 부산물). K=1,500 도달 위해 **+1,090 leaves 필요**. PR-A +600 + PR-B +250 + PR-C +150 = +1,000 → 410+1,000 = 1,410 → K=1,500 미달 11건. 후속 라운드 +90 이상 추가 필요(또는 PR-A 적극 확장으로 보정).

### 1.4 namespace 키 분기 도식

```
common.json
├── action.*       ← 버튼·CTA 12종 (save/cancel/confirm/close/delete/edit/create/search/filter/reset/refresh/retry)
├── state.*        ← 상태 5종 (loading/empty/error/success/pending)
├── modal.*        ← UnifiedModal 표준 카피
│   ├── confirm.*  ← 확인 모달 (title/message/defaultButton)
│   ├── alert.*    ← 알림 모달 (title/message/defaultButton)
│   └── info.*     ← 안내 모달 (title/message/defaultButton)
├── nav.*          ← 공통 네비게이션 라벨
└── label.*        ← 도메인 중립 공통 라벨 (Phase 1 유지)

admin.json
├── lnb.*          ← 1뎁스 LNB 메뉴명 + 2뎁스 서브메뉴
├── gnb.*          ← GNB 헤더 우상단 (프로필/로그아웃/알림)
├── dashboard.*    ← 어드민 대시보드 (위젯·요약·상태)
├── widget.*       ← 위젯 공통 (title/empty/cta 3종)
├── permission.*   ← 권한 관리 화면
├── session.*      ← 세션 관리 화면
├── user.*         ← 사용자 관리 화면
├── consultant.*   ← 상담사 종합 관리 화면
├── onboarding.*   ← AdminOnboarding 심사 화면
└── (기존 유지)    ← Phase 1 350 leaves 무수정

error.json
├── validation.*   ← 폼 필드 검증 오류
├── api.*          ← HTTP/API 오류 (4xx/5xx)
├── network.*      ← 네트워크 연결 오류
└── business.*     ← 도메인 비즈니스 오류
```

---

## §2 키 명명 패턴 합의

### 2.1 기본 패턴 (Phase 1 답습)

`domain.feature.element.purpose`

| 레벨 | 규칙 | 예시 |
|---|---|---|
| domain | namespace 최상위 컨텍스트 | `admin` / `common` / `error` |
| feature | 기능·화면 단위 | `dashboard` / `lnb` / `permission` / `validation` |
| element | UI 요소 또는 세부 분류 | `widget` / `table` / `modal` / `field` |
| purpose | 용도 (leaf) | `title` / `empty` / `cta` / `label` / `message` / `button` |

### 2.2 prefix 카탈로그 (10+ 종)

| # | prefix | namespace | 용도 | 결정 근거 |
|---|---|---|---|---|
| 1 | `admin.lnb.*` | admin | LNB 1·2뎁스 메뉴명 | **결정: `admin.lnb.*` 채택** (vs `layout.lnb.*` 기각) — LNB 는 어드민 도메인 전용 사이드바. `layout.lnb.*` 는 도메인 중립 레이아웃 컴포넌트에 적합하나, 이 프로젝트의 LNB 항목 자체가 어드민 비즈니스 메뉴(세션 관리·권한 관리 등)이므로 `admin` namespace 에 귀속. MenuConstants.js 115 라인 키 SSOT 매핑. |
| 2 | `admin.gnb.*` | admin | GNB 헤더 우상단 (로그아웃·프로필·알림뱃지) | GNB 도 어드민 도메인에 귀속. 공통 알림은 `common.nav.*` 와 분리하여 어드민 전용 텍스트 포함. |
| 3 | `admin.dashboard.*` | admin | 어드민 대시보드 (요약·통계 카드 제목·값 라벨) | AdminDashboard.js 275 라인 / AdminDashboardV2.js 211 라인 흡수. |
| 4 | `admin.widget.{name}.{purpose}` | admin | 위젯 빈 상태·CTA·제목 | `purpose` = `title` / `empty` / `cta` / `description`. 위젯 식별자(`name`)는 camelCase 약어(예: `counselorStatus` / `sessionCount` / `revenueOverview`). |
| 5 | `admin.permission.*` | admin | 권한 매트릭스·토글·확인 모달 카피 | PermissionManagement.js 129 라인 흡수. |
| 6 | `admin.session.*` | admin | 세션 관리 화면 (세션 목록·상태·액션) | SessionManagement.js 102 라인 흡수. |
| 7 | `admin.user.*` | admin | 사용자 관리 (폼 필드 라벨·테이블 헤더·액션) | UserManagement.js 74 라인 흡수. |
| 8 | `admin.consultant.*` | admin | 상담사 종합 관리 (탭·필터·테이블 헤더) | ConsultantComprehensiveManagement.js 270 라인 흡수. |
| 9 | `admin.onboarding.*` | admin | 온보딩 심사 화면 (스텝·버튼·메시지) | AdminOnboarding.jsx + ONBOARDING_MESSAGES 상수 흡수. |
| 10 | `common.modal.*` | common | UnifiedModal 표준 카피 (confirm/alert/info 3종) | UnifiedModal JSX 활성 142 라인 / useConfirm·useAlert 훅 신설 기본 카피 SSOT. |
| 11 | `common.action.*` | common | CTA 버튼·액션 라벨 12종 | Phase 1 `action.*` flat 키 + `actions.*` 중첩 키 통합·정규화. |
| 12 | `common.state.*` | common | 컴포넌트 상태 라벨 5종 (loading/empty/error/success/pending) | Phase 1 `status.*` + `messages.loading` 중복 정규화. |
| 13 | `error.validation.*` | error | 폼 필드 검증 오류 (required/invalid/tooLong/tooShort/pattern/email/phone/date) | 신설 namespace. toast 40자 제약 준수. |
| 14 | `error.api.*` | error | HTTP API 오류 (500/404/403/401/timeout/badRequest) | 서버 응답 fallback 메시지. 백엔드 message 필드와 별개. |
| 15 | `error.network.*` | error | 네트워크 연결 오류 (offline/slow/timeout) | 브라우저 fetch 실패 시 사용. |
| 16 | `error.business.*` | error | 비즈니스 로직 오류 (domainn-specific) | 상담 회기 부족·결제 실패·권한 없음 등. |

### 2.3 키 명명 규칙 보완 (트랙 A 신설)

#### 금지 패턴

| 금지 | 사유 | 대안 |
|---|---|---|
| `layout.lnb.*` | LNB 는 어드민 도메인 메뉴 SSOT 이므로 레이아웃 namespace 분리 부적절 | `admin.lnb.*` |
| `admin.lnb.menuDashboard` | 불필요한 `menu` 접두어 중복 | `admin.lnb.dashboard` |
| `error.message.required` | `message` 중간 레벨 불필요 | `error.validation.required` |
| `common.btn.save` | `btn` 은 UI 구현 의존적 | `common.action.save` |
| 한글 포함 키 | 다국어 1:1 미러 시 키 오염 | 영문 camelCase only |

#### 변환 규칙 (Phase 1 → Phase 2 정규화)

| Phase 1 키 (잔존) | Phase 2 정규화 대상 키 | 정책 |
|---|---|---|
| `action.save` (flat) | `common.action.save` 로 alias 통합 | Phase 1 flat 키 유지 + Phase 2 canonical 키 신설 (fallback 중복 허용, PR-A 이후 flat 키 deprecated 예정) |
| `actions.cancel` (중첩) | `common.action.cancel` | 동일 |
| `status.loading` | `common.state.loading` | 동일 |
| `messages.loading` | `common.state.loading` | 동일 (중복 제거) |
| `labels.*` | 유지 (flat label은 Phase 1 SSOT, 과도한 재구조화 금지) | 신규 라벨은 `admin.*` 또는 도메인 namespace |

### 2.4 위젯 식별자 (`admin.widget.{name}.*`) 네이밍 SSOT

| 위젯 식별자 (`name`) | 한글 위젯명 | 출처 |
|---|---|---|
| `counselorStatus` | 상담사 현황 | AdminDashboard.js |
| `sessionCount` | 세션 현황 | AdminDashboard.js |
| `revenueOverview` | 수익 개요 | AdminDashboard.js |
| `clientStatus` | 내담자 현황 | AdminDashboard.js |
| `matchingStatus` | 매칭 현황 | AdminDashboard.js |
| `vacationOverview` | 휴가 현황 | AdminDashboard.js |
| `notificationSummary` | 알림 요약 | AdminDashboardV2.js |
| `wellnessSummary` | 웰니스 요약 | AdminDashboardV2.js |

---

## §3 트랙 A 핵심 화면 카피 시안

> **카피 원칙**: (a) 정중·간결·구어 회피, "하세요" 종결. (b) 의문문은 "～하시겠어요?" 통일. (c) 40자 이하 (toast 제약). (d) LNB 260px 너비 기준 최대 10자(한글 약 140px + padding). (e) 모달 헤더 최대 16자. (f) 다국어 키 1:1 미러를 위해 한국어 특수 어휘 회피.

---

### 3.1 AdminDashboard.js (admin.dashboard.* / admin.widget.*)

| # | key | ko_fallback | category | source_file_hint |
|---|---|---|---|---|
| 1 | `admin.dashboard.title` | 관리자 대시보드 | admin.dashboard | AdminDashboard.js |
| 2 | `admin.dashboard.subtitle` | 운영 현황 한눈에 보기 | admin.dashboard | AdminDashboard.js |
| 3 | `admin.dashboard.lastUpdated` | 마지막 업데이트: {{time}} | admin.dashboard | AdminDashboard.js |
| 4 | `admin.dashboard.refreshAll` | 전체 새로고침 | admin.dashboard | AdminDashboard.js |
| 5 | `admin.dashboard.loadingError` | 대시보드를 불러올 수 없습니다. | admin.dashboard | AdminDashboard.js |
| 6 | `admin.widget.counselorStatus.title` | 상담사 현황 | admin.widget | AdminDashboard.js |
| 7 | `admin.widget.counselorStatus.empty` | 등록된 상담사가 없습니다. | admin.widget | AdminDashboard.js |
| 8 | `admin.widget.counselorStatus.cta` | 상담사 등록하기 | admin.widget | AdminDashboard.js |
| 9 | `admin.widget.sessionCount.title` | 세션 현황 | admin.widget | AdminDashboard.js |
| 10 | `admin.widget.sessionCount.empty` | 진행 중인 세션이 없습니다. | admin.widget | AdminDashboard.js |
| 11 | `admin.widget.sessionCount.description` | 오늘 진행·예약된 세션 수 | admin.widget | AdminDashboard.js |
| 12 | `admin.widget.revenueOverview.title` | 수익 개요 | admin.widget | AdminDashboard.js |
| 13 | `admin.widget.revenueOverview.empty` | 이번 달 수익 데이터가 없습니다. | admin.widget | AdminDashboard.js |
| 14 | `admin.widget.revenueOverview.cta` | 상세 내역 보기 | admin.widget | AdminDashboard.js |
| 15 | `admin.widget.clientStatus.title` | 내담자 현황 | admin.widget | AdminDashboard.js |
| 16 | `admin.widget.clientStatus.empty` | 등록된 내담자가 없습니다. | admin.widget | AdminDashboard.js |
| 17 | `admin.widget.clientStatus.cta` | 내담자 등록하기 | admin.widget | AdminDashboard.js |
| 18 | `admin.widget.matchingStatus.title` | 매칭 현황 | admin.widget | AdminDashboard.js |
| 19 | `admin.widget.matchingStatus.empty` | 대기 중인 매칭이 없습니다. | admin.widget | AdminDashboard.js |
| 20 | `admin.widget.matchingStatus.cta` | 매칭 처리하기 | admin.widget | AdminDashboard.js |
| 21 | `admin.widget.vacationOverview.title` | 휴가 현황 | admin.widget | AdminDashboard.js |
| 22 | `admin.widget.vacationOverview.empty` | 이번 달 휴가 신청이 없습니다. | admin.widget | AdminDashboard.js |
| 23 | `admin.dashboard.summary.totalCounselors` | 전체 상담사 | admin.dashboard | AdminDashboard.js |
| 24 | `admin.dashboard.summary.activeSessions` | 진행 중 세션 | admin.dashboard | AdminDashboard.js |
| 25 | `admin.dashboard.summary.pendingMatching` | 대기 매칭 | admin.dashboard | AdminDashboard.js |
| 26 | `admin.dashboard.summary.monthlyRevenue` | 이번 달 수익 | admin.dashboard | AdminDashboard.js |
| 27 | `admin.dashboard.filterPeriod.today` | 오늘 | admin.dashboard | AdminDashboard.js |
| 28 | `admin.dashboard.filterPeriod.week` | 이번 주 | admin.dashboard | AdminDashboard.js |
| 29 | `admin.dashboard.filterPeriod.month` | 이번 달 | admin.dashboard | AdminDashboard.js |
| 30 | `admin.dashboard.noDataForPeriod` | 선택한 기간에 데이터가 없습니다. | admin.dashboard | AdminDashboard.js |

---

### 3.2 ConsultantComprehensiveManagement.js (admin.consultant.*)

| # | key | ko_fallback | category | source_file_hint |
|---|---|---|---|---|
| 31 | `admin.consultant.title` | 상담사 종합 관리 | admin.consultant | ConsultantComprehensiveManagement.js |
| 32 | `admin.consultant.tab.list` | 상담사 목록 | admin.consultant | ConsultantComprehensiveManagement.js |
| 33 | `admin.consultant.tab.detail` | 상세 정보 | admin.consultant | ConsultantComprehensiveManagement.js |
| 34 | `admin.consultant.tab.sessions` | 세션 현황 | admin.consultant | ConsultantComprehensiveManagement.js |
| 35 | `admin.consultant.tab.settlements` | 정산 내역 | admin.consultant | ConsultantComprehensiveManagement.js |
| 36 | `admin.consultant.filter.status` | 상태 | admin.consultant | ConsultantComprehensiveManagement.js |
| 37 | `admin.consultant.filter.specialization` | 전문 분야 | admin.consultant | ConsultantComprehensiveManagement.js |
| 38 | `admin.consultant.filter.searchPlaceholder` | 이름 또는 이메일로 검색 | admin.consultant | ConsultantComprehensiveManagement.js |
| 39 | `admin.consultant.table.name` | 이름 | admin.consultant | ConsultantComprehensiveManagement.js |
| 40 | `admin.consultant.table.email` | 이메일 | admin.consultant | ConsultantComprehensiveManagement.js |
| 41 | `admin.consultant.table.status` | 상태 | admin.consultant | ConsultantComprehensiveManagement.js |
| 42 | `admin.consultant.table.sessionCount` | 총 세션 수 | admin.consultant | ConsultantComprehensiveManagement.js |
| 43 | `admin.consultant.table.joinDate` | 가입일 | admin.consultant | ConsultantComprehensiveManagement.js |
| 44 | `admin.consultant.table.action` | 관리 | admin.consultant | ConsultantComprehensiveManagement.js |
| 45 | `admin.consultant.table.empty` | 조건에 맞는 상담사가 없습니다. | admin.consultant | ConsultantComprehensiveManagement.js |
| 46 | `admin.consultant.action.approve` | 승인 | admin.consultant | ConsultantComprehensiveManagement.js |
| 47 | `admin.consultant.action.suspend` | 정지 | admin.consultant | ConsultantComprehensiveManagement.js |
| 48 | `admin.consultant.action.viewDetail` | 상세 보기 | admin.consultant | ConsultantComprehensiveManagement.js |
| 49 | `admin.consultant.status.active` | 활성 | admin.consultant | ConsultantComprehensiveManagement.js |
| 50 | `admin.consultant.status.inactive` | 비활성 | admin.consultant | ConsultantComprehensiveManagement.js |
| 51 | `admin.consultant.status.suspended` | 정지됨 | admin.consultant | ConsultantComprehensiveManagement.js |
| 52 | `admin.consultant.status.pending` | 승인 대기 | admin.consultant | ConsultantComprehensiveManagement.js |
| 53 | `admin.consultant.confirmSuspend.title` | 상담사 정지 확인 | admin.consultant | ConsultantComprehensiveManagement.js |
| 54 | `admin.consultant.confirmSuspend.message` | 해당 상담사를 정지하시겠어요? 정지 중에는 신규 세션이 배정되지 않습니다. | admin.consultant | ConsultantComprehensiveManagement.js |
| 55 | `admin.consultant.loadError` | 상담사 정보를 불러올 수 없습니다. | admin.consultant | ConsultantComprehensiveManagement.js |

---

### 3.3 AdminDashboardV2.js (admin.dashboard.v2.* / admin.widget.*)

| # | key | ko_fallback | category | source_file_hint |
|---|---|---|---|---|
| 56 | `admin.dashboard.v2.title` | 어드민 대시보드 V2 | admin.dashboard | AdminDashboardV2.js |
| 57 | `admin.dashboard.v2.gnb.homeLink` | 홈으로 | admin.dashboard | AdminDashboardV2.js |
| 58 | `admin.dashboard.v2.gnb.settingsLink` | 설정 | admin.dashboard | AdminDashboardV2.js |
| 59 | `admin.dashboard.v2.header.welcome` | 안녕하세요, {{name}}님 | admin.dashboard | AdminDashboardV2.js |
| 60 | `admin.dashboard.v2.header.roleLabel` | {{role}} 계정 | admin.dashboard | AdminDashboardV2.js |
| 61 | `admin.widget.notificationSummary.title` | 알림 요약 | admin.widget | AdminDashboardV2.js |
| 62 | `admin.widget.notificationSummary.empty` | 새로운 알림이 없습니다. | admin.widget | AdminDashboardV2.js |
| 63 | `admin.widget.notificationSummary.cta` | 알림 전체 보기 | admin.widget | AdminDashboardV2.js |
| 64 | `admin.widget.wellnessSummary.title` | 웰니스 요약 | admin.widget | AdminDashboardV2.js |
| 65 | `admin.widget.wellnessSummary.empty` | 오늘의 웰니스 데이터가 없습니다. | admin.widget | AdminDashboardV2.js |
| 66 | `admin.widget.wellnessSummary.cta` | 웰니스 현황 보기 | admin.widget | AdminDashboardV2.js |
| 67 | `admin.dashboard.v2.layout.addWidget` | 위젯 추가 | admin.dashboard | AdminDashboardV2.js |
| 68 | `admin.dashboard.v2.layout.editLayout` | 레이아웃 편집 | admin.dashboard | AdminDashboardV2.js |
| 69 | `admin.dashboard.v2.layout.resetLayout` | 기본 레이아웃으로 초기화 | admin.dashboard | AdminDashboardV2.js |
| 70 | `admin.dashboard.v2.layout.saveLayout` | 레이아웃 저장 | admin.dashboard | AdminDashboardV2.js |
| 71 | `admin.dashboard.v2.layout.emptyState` | 위젯을 추가해 대시보드를 구성하세요. | admin.dashboard | AdminDashboardV2.js |
| 72 | `admin.dashboard.v2.widget.loadError` | 위젯 데이터를 불러올 수 없습니다. | admin.dashboard | AdminDashboardV2.js |
| 73 | `admin.dashboard.v2.widget.retry` | 다시 불러오기 | admin.dashboard | AdminDashboardV2.js |
| 74 | `admin.dashboard.v2.period.realtime` | 실시간 | admin.dashboard | AdminDashboardV2.js |
| 75 | `admin.dashboard.v2.period.daily` | 일간 | admin.dashboard | AdminDashboardV2.js |

---

### 3.4 DashboardFormModal.js (admin.dashboard.formModal.*)

| # | key | ko_fallback | category | source_file_hint |
|---|---|---|---|---|
| 76 | `admin.dashboard.formModal.createTitle` | 대시보드 생성 | admin.dashboard | DashboardFormModal.js |
| 77 | `admin.dashboard.formModal.editTitle` | 대시보드 편집 | admin.dashboard | DashboardFormModal.js |
| 78 | `admin.dashboard.formModal.field.name` | 대시보드 이름 | admin.dashboard | DashboardFormModal.js |
| 79 | `admin.dashboard.formModal.field.namePlaceholder` | 대시보드 이름을 입력하세요. | admin.dashboard | DashboardFormModal.js |
| 80 | `admin.dashboard.formModal.field.description` | 설명 | admin.dashboard | DashboardFormModal.js |
| 81 | `admin.dashboard.formModal.field.descriptionPlaceholder` | 대시보드 용도·목적을 간략히 설명하세요. | admin.dashboard | DashboardFormModal.js |
| 82 | `admin.dashboard.formModal.field.layout` | 레이아웃 유형 | admin.dashboard | DashboardFormModal.js |
| 83 | `admin.dashboard.formModal.field.visibility` | 공개 범위 | admin.dashboard | DashboardFormModal.js |
| 84 | `admin.dashboard.formModal.visibility.private` | 비공개 (나만 보기) | admin.dashboard | DashboardFormModal.js |
| 85 | `admin.dashboard.formModal.visibility.team` | 팀 공개 | admin.dashboard | DashboardFormModal.js |
| 86 | `admin.dashboard.formModal.visibility.public` | 전체 공개 | admin.dashboard | DashboardFormModal.js |
| 87 | `admin.dashboard.formModal.btn.create` | 대시보드 생성 | admin.dashboard | DashboardFormModal.js |
| 88 | `admin.dashboard.formModal.btn.save` | 변경 사항 저장 | admin.dashboard | DashboardFormModal.js |
| 89 | `admin.dashboard.formModal.btn.cancel` | 취소 | admin.dashboard | DashboardFormModal.js |
| 90 | `admin.dashboard.formModal.createSuccess` | 대시보드가 생성되었습니다. | admin.dashboard | DashboardFormModal.js |
| 91 | `admin.dashboard.formModal.editSuccess` | 대시보드가 수정되었습니다. | admin.dashboard | DashboardFormModal.js |
| 92 | `admin.dashboard.formModal.saveError` | 저장 중 오류가 발생했습니다. 다시 시도해 주세요. | admin.dashboard | DashboardFormModal.js |

---

### 3.5 PermissionManagement.js (admin.permission.*)

| # | key | ko_fallback | category | source_file_hint |
|---|---|---|---|---|
| 93 | `admin.permission.title` | 권한 관리 | admin.permission | PermissionManagement.js |
| 94 | `admin.permission.matrix.roleColumn` | 역할 | admin.permission | PermissionManagement.js |
| 95 | `admin.permission.matrix.permissionColumn` | 권한 항목 | admin.permission | PermissionManagement.js |
| 96 | `admin.permission.matrix.grant` | 허용 | admin.permission | PermissionManagement.js |
| 97 | `admin.permission.matrix.deny` | 거부 | admin.permission | PermissionManagement.js |
| 98 | `admin.permission.toggle.enable` | 권한 활성화 | admin.permission | PermissionManagement.js |
| 99 | `admin.permission.toggle.disable` | 권한 비활성화 | admin.permission | PermissionManagement.js |
| 100 | `admin.permission.confirm.grant.title` | 권한 부여 확인 | admin.permission | PermissionManagement.js |
| 101 | `admin.permission.confirm.grant.message` | {{role}} 역할에 {{permission}} 권한을 부여하시겠어요? | admin.permission | PermissionManagement.js |
| 102 | `admin.permission.confirm.revoke.title` | 권한 회수 확인 | admin.permission | PermissionManagement.js |
| 103 | `admin.permission.confirm.revoke.message` | {{role}} 역할의 {{permission}} 권한을 회수하시겠어요? | admin.permission | PermissionManagement.js |
| 104 | `admin.permission.saveSuccess` | 권한 설정이 저장되었습니다. | admin.permission | PermissionManagement.js |
| 105 | `admin.permission.saveError` | 권한 저장 중 오류가 발생했습니다. | admin.permission | PermissionManagement.js |
| 106 | `admin.permission.matrix.empty` | 설정 가능한 권한 항목이 없습니다. | admin.permission | PermissionManagement.js |
| 107 | `admin.permission.matrix.loadError` | 권한 매트릭스를 불러올 수 없습니다. | admin.permission | PermissionManagement.js |

---

### 3.6 LNB / GNB / UnifiedHeader (admin.lnb.* / admin.gnb.* / common.nav.*)

#### LNB 1뎁스 메뉴명 (MenuConstants.js 매핑)

| # | key | ko_fallback | category | source_file_hint |
|---|---|---|---|---|
| 108 | `admin.lnb.dashboard` | 대시보드 | admin.lnb | MenuConstants.js / AdminLayout.js |
| 109 | `admin.lnb.sessions` | 세션 관리 | admin.lnb | MenuConstants.js |
| 110 | `admin.lnb.consultations` | 상담 관리 | admin.lnb | MenuConstants.js |
| 111 | `admin.lnb.clients` | 내담자 관리 | admin.lnb | MenuConstants.js |
| 112 | `admin.lnb.consultants` | 상담사 관리 | admin.lnb | MenuConstants.js |
| 113 | `admin.lnb.matching` | 매칭 관리 | admin.lnb | MenuConstants.js |
| 114 | `admin.lnb.courses` | 강좌 관리 | admin.lnb | MenuConstants.js |
| 115 | `admin.lnb.classes` | 반 관리 | admin.lnb | MenuConstants.js |
| 116 | `admin.lnb.enrollments` | 수강 관리 | admin.lnb | MenuConstants.js |
| 117 | `admin.lnb.attendance` | 출석 관리 | admin.lnb | MenuConstants.js |
| 118 | `admin.lnb.tuitionFees` | 수강료 관리 | admin.lnb | MenuConstants.js |
| 119 | `admin.lnb.erpDashboard` | ERP 대시보드 | admin.lnb | MenuConstants.js |
| 120 | `admin.lnb.purchases` | 구매 관리 | admin.lnb | MenuConstants.js |
| 121 | `admin.lnb.adminDashboard` | 관리자 대시보드 | admin.lnb | MenuConstants.js |
| 122 | `admin.lnb.users` | 사용자 관리 | admin.lnb | MenuConstants.js |
| 123 | `admin.lnb.systemStatus` | 시스템 상태 | admin.lnb | MenuConstants.js |
| 124 | `admin.lnb.permissions` | 권한 관리 | admin.lnb | MenuConstants.js + PermissionManagement.js |
| 125 | `admin.lnb.sessionManagement` | 세션 관리 | admin.lnb | MenuConstants.js + SessionManagement.js |
| 126 | `admin.lnb.onboarding` | 온보딩 심사 | admin.lnb | AdminOnboarding.jsx |
| 127 | `admin.lnb.aiProvider` | AI 프로바이더 관리 | admin.lnb | admin.json lnb.aiProviderManagement (기존 키 통합) |

#### GNB 헤더 우상단

| # | key | ko_fallback | category | source_file_hint |
|---|---|---|---|---|
| 128 | `admin.gnb.profile` | 프로필 | admin.gnb | UnifiedHeader.js / AdminLayout.js |
| 129 | `admin.gnb.logout` | 로그아웃 | admin.gnb | UnifiedHeader.js / AdminLayout.js |
| 130 | `admin.gnb.notifications` | 알림 | admin.gnb | UnifiedHeader.js |
| 131 | `admin.gnb.notificationCount` | 알림 {{count}}건 | admin.gnb | UnifiedHeader.js |
| 132 | `admin.gnb.settings` | 설정 | admin.gnb | UnifiedHeader.js |
| 133 | `admin.gnb.myPage` | 마이페이지 | admin.gnb | UnifiedHeader.js |

#### UnifiedHeader 공통 라벨

| # | key | ko_fallback | category | source_file_hint |
|---|---|---|---|---|
| 134 | `common.nav.myPage` | 마이페이지 | common.nav | UnifiedHeader.js |
| 135 | `common.nav.help` | 도움말 | common.nav | MenuConstants.js |
| 136 | `common.nav.notifications` | 알림 | common.nav | UnifiedHeader.js |
| 137 | `common.nav.backToHome` | 홈으로 돌아가기 | common.nav | UnifiedHeader.js |

---

### 3.7 UnifiedModal / Alert / Confirm 표준 카피 (common.modal.*)

| # | key | ko_fallback | category | source_file_hint |
|---|---|---|---|---|
| 138 | `common.modal.confirm.defaultTitle` | 확인 | common.modal | UnifiedModal / useConfirm |
| 139 | `common.modal.confirm.defaultMessage` | 계속 진행하시겠어요? | common.modal | UnifiedModal / useConfirm |
| 140 | `common.modal.confirm.defaultConfirmButton` | 확인 | common.modal | UnifiedModal / useConfirm |
| 141 | `common.modal.confirm.defaultCancelButton` | 취소 | common.modal | UnifiedModal / useConfirm |
| 142 | `common.modal.alert.defaultTitle` | 알림 | common.modal | UnifiedModal / useAlert |
| 143 | `common.modal.alert.defaultMessage` | 처리가 완료되었습니다. | common.modal | UnifiedModal / useAlert |
| 144 | `common.modal.alert.defaultConfirmButton` | 확인 | common.modal | UnifiedModal / useAlert |
| 145 | `common.modal.info.defaultTitle` | 안내 | common.modal | UnifiedModal |
| 146 | `common.modal.info.defaultMessage` | 안내 사항을 확인해 주세요. | common.modal | UnifiedModal |
| 147 | `common.modal.info.defaultConfirmButton` | 확인 | common.modal | UnifiedModal |
| 148 | `common.modal.warning.defaultTitle` | 주의 | common.modal | UnifiedModal / useConfirm (variant=warning) |
| 149 | `common.modal.warning.defaultMessage` | 이 작업은 되돌릴 수 없습니다. 계속하시겠어요? | common.modal | UnifiedModal / useConfirm (variant=warning) |
| 150 | `common.modal.danger.defaultTitle` | 삭제 확인 | common.modal | UnifiedModal / useConfirm (variant=danger) |
| 151 | `common.modal.danger.defaultMessage` | 삭제하면 복구할 수 없습니다. 정말 삭제하시겠어요? | common.modal | UnifiedModal / useConfirm (variant=danger) |
| 152 | `common.modal.danger.defaultConfirmButton` | 삭제 | common.modal | UnifiedModal / useConfirm (variant=danger) |
| 153 | `common.modal.success.defaultTitle` | 완료 | common.modal | UnifiedModal / useAlert (variant=success) |
| 154 | `common.modal.success.defaultMessage` | 성공적으로 처리되었습니다. | common.modal | UnifiedModal / useAlert (variant=success) |

---

### 3.8 common.action / common.state 표준 12종 + 5종

| # | key | ko_fallback | category | source_file_hint |
|---|---|---|---|---|
| 155 | `common.action.save` | 저장 | common.action | 전체 (Phase 1 `action.save` 통합) |
| 156 | `common.action.cancel` | 취소 | common.action | 전체 |
| 157 | `common.action.confirm` | 확인 | common.action | 전체 |
| 158 | `common.action.close` | 닫기 | common.action | 전체 |
| 159 | `common.action.delete` | 삭제 | common.action | 전체 |
| 160 | `common.action.edit` | 수정 | common.action | 전체 |
| 161 | `common.action.create` | 생성 | common.action | 전체 |
| 162 | `common.action.search` | 검색 | common.action | 전체 |
| 163 | `common.action.filter` | 필터 | common.action | 전체 |
| 164 | `common.action.reset` | 초기화 | common.action | 전체 |
| 165 | `common.action.refresh` | 새로고침 | common.action | 전체 |
| 166 | `common.action.retry` | 다시 시도 | common.action | 전체 |
| 167 | `common.state.loading` | 로딩 중... | common.state | 전체 (Phase 1 `status.loading` 통합) |
| 168 | `common.state.empty` | 데이터가 없습니다. | common.state | 전체 |
| 169 | `common.state.error` | 오류가 발생했습니다. | common.state | 전체 |
| 170 | `common.state.success` | 처리가 완료되었습니다. | common.state | 전체 |
| 171 | `common.state.pending` | 처리 중입니다... | common.state | 전체 |

---

### 3.9 error.validation.* (폼 검증 오류)

> toast 40자 제약 준수. 필드 이름을 포함할 경우 보간 변수(`{{field}}`) 사용.

| # | key | ko_fallback | category | source_file_hint |
|---|---|---|---|---|
| 172 | `error.validation.required` | 필수 입력 항목입니다. | error.validation | 폼 필드 전체 |
| 173 | `error.validation.requiredField` | {{field}}을(를) 입력해 주세요. | error.validation | 폼 필드 전체 |
| 174 | `error.validation.invalid` | 올바른 형식으로 입력해 주세요. | error.validation | 폼 필드 전체 |
| 175 | `error.validation.tooLong` | 최대 {{max}}자까지 입력할 수 있습니다. | error.validation | 폼 필드 |
| 176 | `error.validation.tooShort` | 최소 {{min}}자 이상 입력해 주세요. | error.validation | 폼 필드 |
| 177 | `error.validation.pattern` | 입력 형식이 올바르지 않습니다. | error.validation | 폼 필드 |
| 178 | `error.validation.email` | 이메일 형식으로 입력해 주세요. | error.validation | 이메일 필드 |
| 179 | `error.validation.phone` | 올바른 전화번호를 입력해 주세요. | error.validation | 전화번호 필드 |
| 180 | `error.validation.duplicated` | 이미 사용 중인 값입니다. | error.validation | 중복 검사 |
| 181 | `error.validation.range` | {{min}}~{{max}} 사이의 값을 입력해 주세요. | error.validation | 숫자 필드 |

---

### 3.10 error.api.* (HTTP/API 오류)

| # | key | ko_fallback | category | source_file_hint |
|---|---|---|---|---|
| 182 | `error.api.500` | 서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. | error.api | NotificationContext.js / 전체 API 호출부 |
| 183 | `error.api.404` | 요청한 정보를 찾을 수 없습니다. | error.api | 전체 API 호출부 |
| 184 | `error.api.403` | 접근 권한이 없습니다. 관리자에게 문의하세요. | error.api | 전체 API 호출부 |
| 185 | `error.api.401` | 로그인이 필요합니다. 다시 로그인해 주세요. | error.api | 전체 API 호출부 |
| 186 | `error.api.badRequest` | 요청 정보를 확인한 후 다시 시도해 주세요. | error.api | 전체 API 호출부 |
| 187 | `error.api.timeout` | 요청 시간이 초과되었습니다. 다시 시도해 주세요. | error.api | 전체 API 호출부 |
| 188 | `error.api.unknown` | 알 수 없는 오류가 발생했습니다. 다시 시도해 주세요. | error.api | 전체 API 호출부 |

---

### 3.11 error.network.* (네트워크 오류)

| # | key | ko_fallback | category | source_file_hint |
|---|---|---|---|---|
| 189 | `error.network.offline` | 인터넷 연결을 확인해 주세요. | error.network | 전체 fetch 오류 처리부 |
| 190 | `error.network.slow` | 네트워크가 불안정합니다. 잠시 후 다시 시도해 주세요. | error.network | 전체 fetch 오류 처리부 |
| 191 | `error.network.timeout` | 연결 시간이 초과되었습니다. 다시 시도해 주세요. | error.network | 전체 fetch 오류 처리부 |
| 192 | `error.network.retry` | 연결 재시도 중... | error.network | 전체 fetch 재시도 UI |

---

### 3.12 error.business.* (비즈니스 로직 오류)

| # | key | ko_fallback | category | source_file_hint |
|---|---|---|---|---|
| 193 | `error.business.sessionInsufficient` | 남은 세션 회기가 부족합니다. | error.business | 세션 결제·예약 흐름 |
| 194 | `error.business.paymentFailed` | 결제에 실패했습니다. 결제 수단을 확인해 주세요. | error.business | 결제 흐름 |
| 195 | `error.business.duplicateBooking` | 이미 예약된 시간대입니다. 다른 시간을 선택해 주세요. | error.business | 예약 흐름 |
| 196 | `error.business.permissionDenied` | 권한이 없습니다. | error.business | 권한 제한 기능 |
| 197 | `error.business.accountSuspended` | 계정이 정지되었습니다. 관리자에게 문의하세요. | error.business | 계정 상태 오류 |
| 198 | `error.business.tokenExpired` | 인증이 만료되었습니다. 다시 로그인해 주세요. | error.business | 토큰 만료 |
| 199 | `error.business.operationFailed` | 처리에 실패했습니다. 다시 시도해 주세요. | error.business | 일반 비즈니스 오류 |
| 200 | `error.business.dataConflict` | 데이터 충돌이 발생했습니다. 새로고침 후 다시 시도해 주세요. | error.business | 동시 편집 충돌 |

---

### 3.13 AdminOnboarding 추가 카피 (admin.onboarding.*)

> §5 AdminOnboarding 흡수 정책 결정과 연동. 본 카피는 §5 권장값 "(b) i18n 직접 (상수 제거)" 채택 시 적용.

| # | key | ko_fallback | category | source_file_hint |
|---|---|---|---|---|
| 201 | `admin.onboarding.title` | 온보딩 심사 | admin.onboarding | AdminOnboarding.jsx |
| 202 | `admin.onboarding.btn.prev` | 이전 | admin.onboarding | AdminOnboarding.jsx / ONBOARDING_MESSAGES.BTN_PREV |
| 203 | `admin.onboarding.btn.next` | 다음 | admin.onboarding | AdminOnboarding.jsx / ONBOARDING_MESSAGES.BTN_NEXT |
| 204 | `admin.onboarding.btn.approve` | 승인 | admin.onboarding | AdminOnboarding.jsx / ONBOARDING_MESSAGES.BTN_APPROVE |
| 205 | `admin.onboarding.btn.reject` | 거절 | admin.onboarding | AdminOnboarding.jsx / ONBOARDING_MESSAGES.BTN_REJECT |
| 206 | `admin.onboarding.confirm.approve` | 이 온보딩 요청을 승인하시겠어요? | admin.onboarding | ONBOARDING_MESSAGES.CONFIRM_APPROVE |
| 207 | `admin.onboarding.msg.approveSuccess` | 온보딩이 성공적으로 승인되었습니다. | admin.onboarding | ONBOARDING_MESSAGES.APPROVE_SUCCESS |
| 208 | `admin.onboarding.msg.rejectSuccess` | 온보딩이 반려되었습니다. | admin.onboarding | ONBOARDING_MESSAGES.REJECT_SUCCESS |
| 209 | `admin.onboarding.msg.errorDecision` | 심사 처리 중 오류가 발생했습니다. 다시 시도해 주세요. | admin.onboarding | ONBOARDING_MESSAGES.ERROR_DECISION |
| 210 | `admin.onboarding.msg.rejectReasonRequired` | 반려 사유를 입력해 주세요. | admin.onboarding | ONBOARDING_MESSAGES.REJECT_REASON_REQUIRED |
| 211 | `admin.onboarding.modal.rejectTitle` | 온보딩 반려 | admin.onboarding | ONBOARDING_MESSAGES.MODAL_REJECT_TITLE |
| 212 | `admin.onboarding.modal.rejectSubtitle` | 반려 사유를 입력해 주세요. 해당 사유는 요청자에게 전달될 수 있습니다. | admin.onboarding | ONBOARDING_MESSAGES.MODAL_REJECT_SUBTITLE |
| 213 | `admin.onboarding.modal.rejectReasonPlaceholder` | 반려 사유 상세 입력 | admin.onboarding | ONBOARDING_MESSAGES.MODAL_PLACEHOLDER_REASON |

---

**카피 시안 총계**: 213 키 (§3.1~§3.13 합산)

| 카테고리 | 키 수 |
|---|---:|
| admin.dashboard.* / admin.widget.* | 50 |
| admin.consultant.* | 25 |
| admin.lnb.* / admin.gnb.* / common.nav.* | 30 |
| admin.permission.* | 15 |
| admin.onboarding.* | 13 |
| common.modal.* | 17 |
| common.action.* / common.state.* | 17 |
| error.validation.* | 10 |
| error.api.* | 7 |
| error.network.* | 4 |
| error.business.* | 8 |
| **합계** | **196** |

> **최소 100 키 요건 충족**: 196 키 (§3 카피 시안) + §4 useConfirm/useAlert 20 키 = **216 키** 총계.

---

## §4 useConfirm / useAlert 훅 기본 카피 SSOT (PR-C 선행 정의)

> **배경**: P0-inv §4.3 — `useConfirm`/`useAlert` 훅 현재 **0건** (미정착). PR-C 진입 시 훅 신설 필요. PR-A 단계에서 미리 표준 카피·시그니처 정의하여 PR-C 코더가 즉시 적용 가능하도록 SSOT 고정.

### 4.1 훅 시그니처 SSOT

#### `useConfirm`

```javascript
/**
 * @param {Object} options
 * @param {string} [options.titleKey='common.modal.confirm.defaultTitle']
 * @param {string} options.messageKey                           // 필수 (또는 message 문자열 직접)
 * @param {string} [options.confirmLabelKey='common.modal.confirm.defaultConfirmButton']
 * @param {string} [options.cancelLabelKey='common.modal.confirm.defaultCancelButton']
 * @param {'info'|'warning'|'danger'|'success'} [options.variant='info']
 * @param {Record<string, unknown>} [options.interpolation]    // i18next 보간 변수
 * @returns {Promise<boolean>}  확인 → true, 취소 → false
 */
useConfirm(options): Promise<boolean>
```

#### `useAlert`

```javascript
/**
 * @param {Object} options
 * @param {string} [options.titleKey]                          // 미지정 시 variant 기본 제목 사용
 * @param {string} options.messageKey                          // 필수 (또는 message 문자열 직접)
 * @param {string} [options.confirmLabelKey='common.modal.alert.defaultConfirmButton']
 * @param {'info'|'warning'|'danger'|'success'} [options.variant='info']
 * @param {Record<string, unknown>} [options.interpolation]
 * @returns {Promise<void>}
 */
useAlert(options): Promise<void>
```

### 4.2 variant 4종 + 카피 톤 가이드

| variant | 사용 상황 | 기본 제목 키 | 기본 메시지 키 | 확인 버튼 키 | 취소 버튼 키 | UI 색상 (참고) |
|---|---|---|---|---|---|---|
| `info` | 일반 안내·진행 확인 | `common.modal.info.defaultTitle` ("안내") | `common.modal.info.defaultMessage` | `common.modal.alert.defaultConfirmButton` | `common.modal.confirm.defaultCancelButton` | 파란색 계열 |
| `warning` | 주의 필요·되돌리기 어려운 작업 | `common.modal.warning.defaultTitle` ("주의") | `common.modal.warning.defaultMessage` | `common.action.confirm` | `common.action.cancel` | 노란색·주황색 계열 |
| `danger` | 삭제·비활성화 등 파괴적 작업 | `common.modal.danger.defaultTitle` ("삭제 확인") | `common.modal.danger.defaultMessage` | `common.modal.danger.defaultConfirmButton` ("삭제") | `common.action.cancel` | 빨간색 계열 |
| `success` | 완료 알림 (useAlert 전용) | `common.modal.success.defaultTitle` ("완료") | `common.modal.success.defaultMessage` | `common.modal.alert.defaultConfirmButton` | — (useAlert는 취소 없음) | 초록색 계열 |

### 4.3 useConfirm/useAlert 기본 카피 키 목록 (~20 키)

| # | key | ko_fallback | variant | 용도 |
|---|---|---|---|---|
| 214 | `common.modal.confirm.defaultTitle` | 확인 | info | useConfirm 기본 제목 |
| 215 | `common.modal.confirm.defaultMessage` | 계속 진행하시겠어요? | info | useConfirm 기본 메시지 |
| 216 | `common.modal.confirm.defaultConfirmButton` | 확인 | info | useConfirm 확인 버튼 |
| 217 | `common.modal.confirm.defaultCancelButton` | 취소 | info | useConfirm 취소 버튼 |
| 218 | `common.modal.alert.defaultTitle` | 알림 | info | useAlert 기본 제목 |
| 219 | `common.modal.alert.defaultMessage` | 처리가 완료되었습니다. | info | useAlert 기본 메시지 |
| 220 | `common.modal.alert.defaultConfirmButton` | 확인 | info | useAlert 확인 버튼 |
| 221 | `common.modal.info.defaultTitle` | 안내 | info | variant=info 제목 |
| 222 | `common.modal.info.defaultMessage` | 안내 사항을 확인해 주세요. | info | variant=info 메시지 |
| 223 | `common.modal.info.defaultConfirmButton` | 확인 | info | variant=info 확인 버튼 |
| 224 | `common.modal.warning.defaultTitle` | 주의 | warning | variant=warning 제목 |
| 225 | `common.modal.warning.defaultMessage` | 이 작업은 되돌릴 수 없습니다. 계속하시겠어요? | warning | variant=warning 메시지 |
| 226 | `common.modal.warning.defaultConfirmButton` | 계속 진행 | warning | variant=warning 확인 버튼 |
| 227 | `common.modal.warning.defaultCancelButton` | 취소 | warning | variant=warning 취소 버튼 |
| 228 | `common.modal.danger.defaultTitle` | 삭제 확인 | danger | variant=danger 제목 |
| 229 | `common.modal.danger.defaultMessage` | 삭제하면 복구할 수 없습니다. 정말 삭제하시겠어요? | danger | variant=danger 메시지 |
| 230 | `common.modal.danger.defaultConfirmButton` | 삭제 | danger | variant=danger 확인 버튼 |
| 231 | `common.modal.danger.defaultCancelButton` | 취소 | danger | variant=danger 취소 버튼 |
| 232 | `common.modal.success.defaultTitle` | 완료 | success | variant=success 제목 |
| 233 | `common.modal.success.defaultMessage` | 성공적으로 처리되었습니다. | success | variant=success 메시지 |

> **§4 총계**: 20 키 (일부 §3.7 키와 중복 선언이나, 훅 SSOT 명시 목적으로 독립 항목 유지).

### 4.4 사용 예시 (PR-C 코더 위임 시 즉시 적용)

```javascript
// 삭제 확인 (variant=danger)
const confirmed = await useConfirm({
  titleKey: 'common.modal.danger.defaultTitle',
  messageKey: 'common.modal.danger.defaultMessage',
  variant: 'danger'
});

// 도메인 커스텀 메시지
const confirmed = await useConfirm({
  messageKey: 'admin.consultant.confirmSuspend.message',
  interpolation: { role: '상담사', name: consultantName },
  variant: 'warning'
});

// 완료 알림 (variant=success)
await useAlert({
  variant: 'success',
  messageKey: 'admin.permission.saveSuccess'
});
```

### 4.5 window.alert/confirm 치환 매핑 (PR-C 진입 시 참조)

> P0-inv §4.2 운영 도메인 bare 호출 7건 + window.confirm 10건 = 17건 일괄 치환 대상.

| 현재 호출 | 치환 키 | variant |
|---|---|---|
| `window.confirm('정말 삭제하시겠습니까?')` | `common.modal.danger.defaultMessage` | danger |
| `window.confirm('정말 수강을 취소하시겠습니까?')` | 신설 `admin.lnb.enrollments` 관련 confirm 키 | warning |
| `window.confirm(ONBOARDING_MESSAGES.CONFIRM_APPROVE)` | `admin.onboarding.confirm.approve` | info |
| `alert(ONBOARDING_MESSAGES.APPROVE_SUCCESS)` | `admin.onboarding.msg.approveSuccess` | success |
| `alert(ONBOARDING_MESSAGES.ERROR_DECISION)` | `admin.onboarding.msg.errorDecision` | — (toast) |
| `alert(ONBOARDING_MESSAGES.REJECT_REASON_REQUIRED)` | `admin.onboarding.msg.rejectReasonRequired` | — (toast) |
| `alert(ONBOARDING_MESSAGES.REJECT_SUCCESS)` | `admin.onboarding.msg.rejectSuccess` | success |
| `alert('신고가 접수되었습니다...')` | 신설 `error.business.reportSubmitted` 또는 `common.state.success` | — (toast) |
| `confirm('정말 이 결제 수단을 삭제하시겠습니까?')` | `common.modal.danger.defaultMessage` | danger |

---

## §5 AdminOnboarding 흡수 정책 결정

### 5.1 현황 (P0-inv §4.2 확인)

`frontend/src/constants/adminOnboarding.js` 의 `ONBOARDING_MESSAGES` 상수 **15건** (APPROVE_SUCCESS / REJECT_SUCCESS / ERROR_DECISION / REJECT_REASON_REQUIRED / CONFIRM_APPROVE / MODAL_REJECT_TITLE / MODAL_REJECT_SUBTITLE / MODAL_PLACEHOLDER_REASON / BTN_PREV / BTN_NEXT / BTN_APPROVE / BTN_REJECT / BTN_CANCEL / BTN_CONFIRM 등).

`AdminOnboarding.jsx` 에서 `alert(ONBOARDING_MESSAGES.*)` + `window.confirm(ONBOARDING_MESSAGES.*)` 형태로 직접 참조.

### 5.2 선택지

| 선택 | 방식 | 장점 | 단점 |
|---|---|---|---|
| (a) 상수 유지 + 키 매핑 | 상수를 i18n 키 값으로 교체 (값만 변경) | 컴포넌트 변경 최소화 | 상수·i18n 이중 관리; 다국어 진입 시 상수 재수정 필요 |
| **(b) i18n 직접 (상수 제거) — 권장** | 상수 제거 후 컴포넌트에서 `t('admin.onboarding.*')` 직접 호출 | 단일 SSOT; 다국어 확장 시 locale 파일만 추가 | AdminOnboarding.jsx 수정 + adminOnboarding.js 상수 파일 수정 2파일 |

### 5.3 권장값: **(b) i18n 직접 (상수 제거)**

**이유**:
1. **다국어 1:1 미러**: 향후 D5 P5 에서 `en-US`/`ja-JP` 진입 시 `ONBOARDING_MESSAGES.APPROVE_SUCCESS` 상수를 다시 분기할 필요 없이 `locales/en-US/admin.json` 에 동일 키만 추가.
2. **SSOT 단순화**: 메시지 SSOT 가 `adminOnboarding.js` (상수) + `admin.json` (locale) 이중 관리에서 `admin.json` 단일 SSOT 로 통합.
3. **PR-A 진입 시 처리 가능**: `AdminOnboarding.jsx` 는 P0-inv Top-20 포함 (admin 영역) — PR-A 1차 청크에 포함하면 추가 PR 불필요.

**적용 범위**:
- `adminOnboarding.js` → `ONBOARDING_MESSAGES` 객체 제거 (BTN_PREV/BTN_NEXT 등 일반 버튼은 `common.action.*` 흡수)
- `AdminOnboarding.jsx` → `alert(...)` / `window.confirm(...)` 호출을 `useAlert(...)` / `useConfirm(...)` 훅으로 치환 (PR-C 또는 PR-A 에서 처리 — PR-A 코더와 PR-C 코더 역할 분리 필요 시 PR-C 로 위임)
- 본 핸드오프 §3.13 의 `admin.onboarding.*` 13 키 적용

**예외**: `ONBOARDING_TEXT.{step label}` (스텝퍼 단계 제목) 도 i18n 키로 흡수 권장. 단 스텝 단계명은 `admin.onboarding.step.{1|2|3}.label` 키로 별도 정의 (본 핸드오프 키 범위 외, PR-A 코더 위임 시 추가).

---

## §6 추가 언어 미포함 명시 + 향후 다국어 진입 가이드

### 6.1 본 라운드 범위 — 한국어 only (C1=e)

합의서 §5.8 **C1=e (한국어 only 유지)** 결정에 따라:
- D5 P4 PR-A/B/C 모든 locale 파일은 `frontend/src/locales/ko/` 한국어 파일만 생성·확장.
- `en-US` / `ja-JP` / `zh-CN` 번역 시안 **0건** (본 라운드 완전 미포함).
- `i18n/index.js` `SUPPORTED_LANGUAGES = ['ko']` 유지 (PR-A 에서 수정 금지).

### 6.2 향후 다국어 진입 시 1:1 미러 가이드 (D5 P5 / D12+ 참조용)

#### 키 명명 — 한국어 특수 어휘 회피 원칙

| 위반 예시 | 개선 예시 | 이유 |
|---|---|---|
| `admin.lnb.sangdamManagement` | `admin.lnb.consultationManagement` | 로마자 한글 음차는 다국어 키로 의미 불명확 |
| `error.validation.pilsu` | `error.validation.required` | 한글 음차 키는 영문 locale 에서 의미 없음 |
| `common.modal.hwagIn` | `common.modal.confirm` | 동일 |

#### 다국어 진입 절차 (참고)

1. `locales/en-US/admin.json`, `locales/en-US/common.json`, `locales/en-US/error.json` 신설 (ko 키 1:1 미러).
2. `i18n/index.js` `SUPPORTED_LANGUAGES = ['ko', 'en-US']` + `resources.en-US.{ns}: en-US-{ns}` 등록.
3. CI 게이트: `scripts/i18n/check-locale-parity.js` — ko ↔ en-US 키 일치 검증 (§8.4 완화안).
4. 텍스트 길이 LNB/모달 시각 회귀 검수 (§8 참고).
5. `t('admin.lnb.dashboard', '대시보드')` — 두 번째 인자 fallback 은 ko 기준. 영문 locale 등록 후 fallback 파라미터 제거 권장.

#### 예상 다국어 leaves 증가량

| 언어 추가 | 신설 파일 수 | 신규 leaves | 번들 사이즈 증가 (gzip 기준) |
|---|---|---|---|
| `en-US` 1개 추가 | 3 (common/admin/error) | ~1,500 (ko 미러) | ~+15KB |
| `en-US` + `ja-JP` 2개 추가 | 6 | ~3,000 | ~+30KB |

---

## §7 PR-A 진입 입력 (코더 위임 시 인용 영역)

> **PR-A `core-coder` 위임 시 본 §7 을 입력 SSOT 로 인용합니다.**

### 7.1 변경 파일 범위

| 파일 | 변경 유형 | 상세 |
|---|---|---|
| `frontend/src/locales/ko/admin.json` | 확장 | §3.1~§3.6, §3.13 카피 시안 반영 (~+400 leaves) |
| `frontend/src/locales/ko/common.json` | 확장 | §3.7~§3.8, §4 카피 시안 반영 (~+190 leaves) |
| `frontend/src/locales/ko/error.json` | **신설** | §3.9~§3.12 카피 시안 (~+190 leaves) |
| `frontend/src/i18n/index.js` | **수정 (최소)** | `import koError from '../locales/ko/error.json';` 1행 + `resources.ko.error: koError` 1행 + `ns: ['common', 'admin', 'error']` 배열 갱신 3줄 — **Phase 1 나머지 코드 무수정** |
| 컴포넌트 (~355 파일, Top-20 우선) | t() 치환 | 한글 문자열 → `t('key', '한글 fallback')` 패턴. Phase 1 기존 `t()` 호출 280 라인 **무수정** |
| `frontend/src/constants/adminOnboarding.js` | 수정 | §5.3 권장값 (b) 채택 시: `ONBOARDING_MESSAGES` 객체 제거. BTN_PREV/BTN_NEXT 등 → `common.action.*` 대체 |
| `frontend/src/components/admin/onboarding/AdminOnboarding.jsx` | 수정 | `alert(...)` → `useAlert(...)`, `window.confirm(...)` → `useConfirm(...)` 치환 (PR-C 분리 가능) |

### 7.2 Phase 1 정착물 무수정 확인

| 정착물 | 가드 조건 |
|---|---|
| `i18n/index.js` 초기화 로직 | `error` namespace 등록 3줄 **만** 추가. LanguageDetector·init 설정 무수정. |
| `ko/common.json` 기존 60 leaves | 기존 키 삭제·변경 금지. Phase 2 신규 키만 추가. |
| `ko/admin.json` 기존 350 leaves | 기존 키 삭제·변경 금지. Phase 2 신규 키만 추가. |
| 기존 275 컴포넌트 `t()` 호출 1,012 라인 | Phase 1 키·fallback 변경 금지. |

### 7.3 PR-A 완료 조건 (P3 검수 입력)

| 항목 | 목표값 |
|---|---|
| 한국어 라인 (트랙 A admin/common/layout/error 영역) | ~9,181 → ~5,000 (-45%~-50%) |
| `t(` 호출 라인 | 1,012 → ~2,500 (+~1,500) |
| ko leaves 합계 | 410 → ~1,010 (+600) |
| `window.alert/confirm` 잔존 (AdminOnboarding 치환 시) | 11 → 9 (-2 AdminOnboarding 건) |
| Phase 1 정착물 회귀 | `git diff HEAD -- frontend/src/i18n/index.js frontend/src/locales/ko/common.json frontend/src/locales/ko/admin.json` 에서 기존 키 변경 0건 |

### 7.4 PR-A 코더 위임 프롬프트 인용 영역

본 핸드오프 문서에서 코더가 참조해야 할 핵심 섹션:

- **§1.1~1.4** — namespace 분할 구조 + `i18n/index.js` 수정 방법
- **§2.1~2.4** — 키 명명 패턴 + prefix 카탈로그 + 금지 패턴
- **§3 전체** — 카피 시안 196 키 (`{key, ko_fallback, category, source_file_hint}` 4필드)
- **§4.1~4.4** — useConfirm/useAlert 훅 시그니처 + variant 4종 (PR-C 선행 정의)
- **§5.3** — AdminOnboarding 흡수 정책 권장값 (상수 제거 + i18n 직접)
- **§7.2** — Phase 1 정착물 무수정 가드
- **§7.3** — PR-A 완료 조건

---

## §8 위험·트레이드오프

### 8.1 텍스트 길이 — LNB 260px 시뮬레이션

> 한글 14px font-size 기준 1자 ≈ 14px (Noto Sans KR 중간 굵기).

| LNB 메뉴명 | 글자 수 | 추정 너비 | LNB 260px 적합성 |
|---|---|---|---|
| 대시보드 | 4 | ~56px | ✅ 여유 |
| 세션 관리 | 4 | ~56px | ✅ 여유 |
| 상담사 종합 관리 | 8 | ~112px | ✅ 여유 |
| AI 프로바이더 관리 | 9+2(영문) | ~126px+padding | ✅ (padding 제외 시 여유) |
| 수강료 관리 | 5 | ~70px | ✅ |
| **가장 긴 LNB 항목**: 상담사 관리·온보딩 심사 등 | 6~7 | ~84~98px | ✅ 안전 |

**결론**: 현재 한국어 LNB 메뉴명 범위(4~9자)는 260px 너비에 안전. **영어 진입 시 위험**: `Consultant Management` (영문) ≈ ~175px (13자 × 13.5px avg, 260px 한계 도달). 영문 진입 시 약어(`Counselors`) 또는 `text-truncation` CSS 대응 필요.

### 8.2 모달 헤더 길이 시뮬레이션

> 모달 헤더 폰트 18px, 최대 너비 ~400px 기준 → 최대 ~18자.

| 모달 제목 | 글자 수 | 적합성 |
|---|---|---|
| 확인 | 2 | ✅ |
| 삭제 확인 | 4 | ✅ |
| 권한 부여 확인 | 6 | ✅ |
| 상담사 정지 확인 | 7 | ✅ |
| 온보딩 반려 | 5 | ✅ |
| 대시보드 편집 | 6 | ✅ |
| **상한 경계**: 이 작업은 되돌릴 수 없습니다. (헤더 아님, body 텍스트) | — | body 사용 ✅ |

**결론**: 모달 헤더 카피 모두 8자 이하 — 400px 모달에서 안전. 단, 모달 body `common.modal.warning.defaultMessage` ("이 작업은 되돌릴 수 없습니다. 계속하시겠어요?", 23자)는 2줄 렌더 가능성 — body wrap 허용으로 UX 무영향.

### 8.3 toast 40자 제약 시뮬레이션

| 카피 | 글자 수 | 제약(40자) 준수 |
|---|---|---|
| `error.api.500`: 서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. | 29 | ✅ |
| `error.api.403`: 접근 권한이 없습니다. 관리자에게 문의하세요. | 23 | ✅ |
| `error.business.sessionInsufficient`: 남은 세션 회기가 부족합니다. | 16 | ✅ |
| `admin.onboarding.modal.rejectSubtitle`: 반려 사유를 입력해 주세요. 해당 사유는 요청자에게 전달될 수 있습니다. | 37 | ✅ (모달 body 사용, toast 아님) |
| `error.business.duplicateBooking`: 이미 예약된 시간대입니다. 다른 시간을 선택해 주세요. | 26 | ✅ |

**결론**: 모든 error 계열 toast 카피 40자 이내 충족.

### 8.4 Phase 1 키 중복·중첩 정규화 위험

- `action.save` (Phase 1 flat) vs `common.action.save` (Phase 2 신설) — 동일 namespace 내 중복 존재 가능. **완화**: PR-A 에서 flat `action.*` 키는 유지 (기존 275 컴포넌트 t() 회귀 방지), canonical `common.action.*` 를 신규 치환 대상에만 적용. flat 키 deprecated 처리는 PR-B 이후.
- `labels.client` (admin.json 중첩) vs `common.labels.client` — 중복 키 병존 허용 (Phase 2 기간). 통합은 D5 P5 범위.

### 8.5 AdminOnboarding 상수 제거 범위 주의

- `adminOnboarding.js` 의 `ONBOARDING_MESSAGES` 제거 시 동일 파일의 `ONBOARDING_STEPS` / `ONBOARDING_API_ENDPOINTS` / `ONBOARDING_TEXT` / `ONBOARDING_MOCK_DATA` 상수는 **유지** (i18n 범위 외 상수). 선택적 제거.
- `ONBOARDING_MESSAGES.BTN_PREV` / `BTN_NEXT` 등 일반 버튼은 `common.action.cancel` / `common.action.confirm` 으로 치환 시 의미 정합 확인 필요 (방향성 이전/다음 버튼은 `common.action.prev` / `common.action.next` 신설 권장).

### 8.6 D11 라운드와의 PR conflict 회피

- D11 P4 운영 push (`9e22d9e4c` 이후) 후 D5 P4 PR-A 진입. 동일 컴포넌트 파일 CSS·라벨 동시 수정 위험은 D11 정착 완료 이후 PR-A 진입으로 회피 (§7.1 G1 게이트 준수).
- PR-A 브랜치 생성 시 `git fetch origin develop && git rebase origin/develop` 선행 권고.

---

## §9 변경 이력

| 일자 | 작성 | 내용 |
|---|---|---|
| 2026-05-26 | core-designer | D5 P4 i18n Phase 2 P1 트랙 A 디자이너 핸드오프 최초 작성. 합의서 §5.8 C5=c (트랙별 분리) 결정에 따라 트랙 A 카피·키 명명만 정착. **namespace 분할 합의** — `error` 신설 (~190 leaves) + `common` 확장 (~+190) + `admin` 확장 (~+400), PR-A 분담 ~+600 leaves (KPI K=1,500 의 40%). **키 명명 prefix 카탈로그** 16종 — `admin.lnb.*` 채택 (vs `layout.lnb.*` 기각), `admin.widget.{name}.{purpose}` 위젯 식별자 SSOT, `error.{validation|api|network|business}.*` 4분류. **카피 시안 196 키** (§3.1~§3.13, `{key, ko_fallback, category, source_file_hint}` 4필드) — Top-20 컴포넌트 + LNB/GNB + UnifiedModal + error 합산. **useConfirm/useAlert 훅 SSOT** (§4) — 훅 시그니처 2종 + variant 4종 + 기본 카피 20 키, PR-C 선행 정의. **AdminOnboarding 흡수 정책** (§5) — 권장값 (b) i18n 직접 (상수 제거), `ONBOARDING_MESSAGES` 13 키 → `admin.onboarding.*` 흡수. **추가 언어 미포함** (§6) — C1=e (한국어 only), 키 명명 한국어 특수 어휘 회피 원칙 명시. 운영 코드 0줄 수정, develop 브랜치 커밋·푸시 없음. |
