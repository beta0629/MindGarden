# P0 Seq 5 — SidePeekShell · DensityToggle SSOT 중복 검토

**작성일**: 2026-07-07  
**담당**: core-component-manager (문서·제안만, 코드 변경 없음)  
**선행**: P0-design-review Seq 4 gap 분석 ☑ (baseline `93c39c35b`)  
**참조**: [`ADMIN_IMPLEMENTATION_GOVERNANCE.md`](./ADMIN_IMPLEMENTATION_GOVERNANCE.md), [`ADMIN_COMMERCIAL_UX_PER_PAGE_ANALYSIS.md`](./ADMIN_COMMERCIAL_UX_PER_PAGE_ANALYSIS.md) G1-01, [`ADMIN_INAPP_VISUALIZATION_DESIGN_HANDOFF.md`](./ADMIN_INAPP_VISUALIZATION_DESIGN_HANDOFF.md) §3.1

---

## 1. 요약 결론

| 대상 | SSOT 단일 여부 | 통합/alias 필요 | 권고 |
|------|----------------|-----------------|------|
| **SidePeekShell** | **예** — 구현체 1개 | alias **문서만** (handoff 가칭 → 코드 정식명) | `common/organisms/SidePeekShell` 유지. `SidePeekDrawer`·`SidePeekPanel` 신규 구현 **기각** |
| **DensityToggle** | **예** — 구현체 1개 | alias **문서만** (`ScheduleDensityToggle` → `DensityToggle`) | 통합일정 도메인 `molecules` 유지. `ViewModeToggle`과 **별개 SSOT** |

**중복 구현 0건.** handoff·기획 문서의 가칭명과 코드 정식명 불일치만 정리 대상이다.

---

## 2. 기존 컴포넌트 인벤토리

### 2.1 SidePeekShell 계열

| 컴포넌트 | 경로 | 계층 | 용도 | 프로덕션 사용처 수 |
|----------|------|------|------|-------------------|
| **SidePeekShell** | `frontend/src/components/common/organisms/SidePeekShell.js` | Organism (common) | R-PEEK 우측 360px 분할 패널 — 헤더·닫기·`data-region=R-PEEK`·Escape | **5** |
| sidePeekShellConstants | `frontend/src/constants/sidePeekShellConstants.js` | 상수 SSOT | 폭 360px, CSS 클래스, region attr | SidePeekShell + 테스트 |
| ClientSidePeekContent | `frontend/src/components/admin/ClientComprehensiveManagement/molecules/ClientSidePeekContent.js` | Molecule (도메인) | 내담자 peek 본문 stub | 1 |
| ConsultantSidePeekContent | `frontend/src/components/admin/ConsultantComprehensiveManagement/molecules/ConsultantSidePeekContent.js` | Molecule (도메인) | 상담사 peek 본문 stub | 1 |
| StaffSidePeekContent | `frontend/src/components/admin/StaffManagement/molecules/StaffSidePeekContent.js` | Molecule (도메인) | 스태프 peek 본문 stub | 1 |
| MappingScheduleSidePeekContent | `frontend/src/components/admin/mapping-management/integrated-schedule/molecules/MappingScheduleSidePeekContent.js` | Molecule (도메인) | 통합일정·매칭 peek 본문 stub | **2** |

**SidePeekShell 프로덕션 사용처 (5)**

1. `IntegratedMatchingSchedule.js` — G1-01 통합일정
2. `MappingManagementPage.js` — G1-04 매칭 목록
3. `ClientComprehensiveManagement.js` — G2-01 내담자
4. `ConsultantComprehensiveManagement.js` — G2-02 상담사
5. `StaffManagement.js` — G2-03 스태프

**공통 export**: `frontend/src/components/common/index.js` → `export { default as SidePeekShell }`.

**테스트**: `SidePeekShell.test.js` + 페이지별 sidePeek 연동 테스트 5 suites.

### 2.2 DensityToggle 계열

| 컴포넌트 | 경로 | 계층 | 용도 | 프로덕션 사용처 수 |
|----------|------|------|------|-------------------|
| **DensityToggle** | `frontend/src/components/admin/mapping-management/integrated-schedule/molecules/DensityToggle.js` | Molecule (도메인) | 사이드바 Comfortable ↔ Compact 단일 버튼 토글 (`aria-pressed`) | **1** |
| integratedScheduleSidebarDensityConstants | `frontend/src/components/admin/mapping-management/constants/integratedScheduleSidebarDensityConstants.js` | 상수 SSOT | `comfortable` / `compact`, `useViewModePreference` pageId | DensityToggle, MatchingScheduleSidebar, MatchingScheduleList |
| MatchingScheduleList (density prop) | `.../organisms/MatchingScheduleList.js` | Organism | compact row 렌더 분기 | 1 (sidebar에서 density 전달) |

**DensityToggle 프로덕션 사용처 (1)**

- `MatchingScheduleSidebar.js` — 필터 행 우측 밀도 토글 + `useViewModePreference` persist (`admin.integrated-schedule.sidebar-density`)

**테스트**: `DensityToggle.test.js`, `MatchingScheduleList.compactDensity.test.js`.

### 2.3 유사·인접 컴포넌트 (중복 아님)

| 컴포넌트 | 경로 | SidePeekShell / DensityToggle과의 관계 |
|----------|------|----------------------------------------|
| ViewModeToggle | `common/ViewModeToggle.js` | **별개 SSOT** — 목록 보기 모드(table/card/calendar·largeCard/smallCard/list). 밀도(comfortable/compact)와 무관 |
| MobileLnbDrawer | `dashboard-v2/organisms/MobileLnbDrawer.js` | 모바일 LNB — R-PEEK·어드민 peek와 목적·레이아웃 상이 |
| UnifiedModal | `common/modals/UnifiedModal` | peek **대체 금지** (handoff Must not) |
| SessionProgress | 카드 내 L-B 시각화 | peek·밀도와 직교 |

### 2.4 handoff·문서 가칭 (코드 미존재)

| 문서 가칭 | 코드 실체 | 상태 |
|-----------|-----------|------|
| `SidePeekDrawer` | `SidePeekShell` | 구현 완료, 명칭만 불일치 |
| `SidePeekPanel` | `SidePeekShell` | PER_PAGE·systemic 문서 가칭; 코드 없음 |
| `ScheduleDensityToggle` | `DensityToggle` | handoff §3.1 트리 가칭 |
| `DensityPreviewToggle` | *(없음)* | `ADMIN_VISUALIZATION_PLATFORM_SPEC.md` L-C 미래 항목 |

---

## 3. 중복/유사 컴포넌트 표 (신규 vs 재사용)

| handoff/기획 명 | 실제 구현 | 판정 | 조치 |
|-----------------|-----------|------|------|
| SidePeekDrawer (신규 가칭) | `SidePeekShell` (기존 공통) | **재사용** — 중복 신규 불필요 | 문서 alias만 `SidePeekShell`로 통일 |
| SidePeekPanel (신규 가칭) | `SidePeekShell` | **재사용** | 신규 Panel 컴포넌트 **기각** |
| ScheduleDensityToggle (신규 가칭) | `DensityToggle` | **재사용** — 단일 구현 | handoff 트리 명칭 갱신 |
| DensityPreviewToggle (신규 예정) | 없음 | **미구현** | `DensityToggle`과 별 기능(L-C preview). 당분간 DensityToggle이 SSOT; preview 필요 시 **확장 prop** 또는 하위 molecule로 추가 검토 |
| *SidePeekContent (도메인별 4종)* | 각 admin 도메인 molecules | **의도적 분리** — shell 중복 아님 | 통합 **불필요**; 도메인별 본문만 유지 |
| ViewModeToggle | common | **별 축** | DensityToggle과 merge **금지** |

### Seq 4 gap 대비 현재 상태 (post V0~V3+)

| 항목 | Seq 4 gap (baseline) | 현재 (검토 시점) |
|------|----------------------|------------------|
| SidePeekShell | 부재 | ☑ common organism, 5화면 |
| DensityToggle | 부재 (V0 Seq 8 cancelled 이력) | ☑ V3+ Seq 28f 재도입, 1 consumer |
| SessionProgress | (Seq 4 별도) | ☑ 구현됨 — 본 문서 범위 외 |

---

## 4. SSOT 권고

### 4.1 SidePeekShell

- **SSOT**: `frontend/src/components/common/organisms/SidePeekShell.js` + `frontend/src/constants/sidePeekShellConstants.js`
- **단일 구현**: 예. 코드베이스에 두 번째 peek shell/drawer **없음**.
- **통합**: 불필요.
- **alias**: 문서·handoff에서 `SidePeekDrawer`, `SidePeekPanel` → **`SidePeekShell`** 로만 참조. re-export alias 파일 추가는 **비권장** (검색·SSOT 혼선).
- **배치**: `common/organisms` 적절 — G1·G2·G1-04 cross-page 공통.
- **도메인 본문**: `*SidePeekContent`는 각 admin 도메인 `molecules` 유지 (shell과 책임 분리).

**부가 패턴 (shell 외, 중복은 아님)**: 5화면이 각자 `peek* state` + `*__peek-layout--peek-open` CSS modifier를 보유. shell SSOT와 별도로 **레이아웃 연동 패턴** 문서화는 후속 optional.

### 4.2 DensityToggle

- **SSOT**: `frontend/src/components/admin/mapping-management/integrated-schedule/molecules/DensityToggle.js` + `integratedScheduleSidebarDensityConstants.js`
- **단일 구현**: 예. `ScheduleDensityToggle` 등 중복 파일 **없음**.
- **통합**: 불필요.
- **alias**: handoff `ScheduleDensityToggle` → **`DensityToggle`** 문서 정리만.
- **배치**: 현재 **도메인 molecule** 유지 권고 — consumer 1곳(G1-01 통합일정 사이드바). `common` 승격은 **두 번째 화면에서 밀도 토글 요구 시** 재검토.
- **ViewModeToggle과 구분**: 목록 viewMode vs 사이드바 row/card 밀도 — prop·상수·i18n 키 공유 **금지**.

### 4.3 COMMON_MODULES_USAGE_GUIDE 반영 (문서 후속)

현재 `docs/standards/COMMON_MODULES_USAGE_GUIDE.md`에 SidePeekShell·DensityToggle 항목 **없음**. PR-H1에서 SidePeekShell만 common 모듈 표에 추가; DensityToggle은 도메인 SSOT로 PER_PAGE G1-01 링크 명시 권고.

---

## 5. core-coder 후속 PR 가설 (1 PR = 1 가설)

### PR-H1: 문서·가칭 SSOT 정렬 (코드 변경 최소)

**가설**: handoff/기획 문서의 가칭명이 신규 컴포넌트 착시를 유발하므로, 정식명으로 통일하면 중복 구현 시도를 예방한다.

**범위**

- `ADMIN_INAPP_VISUALIZATION_DESIGN_HANDOFF.md` §3.1: `SidePeekDrawer` → `SidePeekShell`, `ScheduleDensityToggle` → `DensityToggle`
- `ADMIN_COMMERCIAL_UX_PER_PAGE_ANALYSIS.md` G1-01: `SidePeekPanel`(신규) → `SidePeekShell`(common SSOT)
- `docs/standards/COMMON_MODULES_USAGE_GUIDE.md`: SidePeekShell 행 추가 (경로·용도·R-PEEK 360px)
- `ADMIN_VISUALIZATION_PLATFORM_SPEC.md`: `DensityPreviewToggle`을 “미구현·L-C optional”로 명시, 구현 SSOT는 `DensityToggle` 참조

**완료 조건**: grep으로 `SidePeekDrawer`·`SidePeekPanel`·`ScheduleDensityToggle` 잔존 여부 확인; 코드 diff 없음 또는 주석/문서만.

### PR-H2: Peek 레이아웃 연동 패턴 정리 (선택, 구현 최소)

**가설**: 5화면의 `peek* state` + layout open modifier가 반복되나 shell과는 다른 축이므로, 상수·훅 또는 짧은 가이드로 패턴만 SSOT화하면 유지보수 비용을 줄일 수 있다.

**범위 (택1)**

- A) 문서만: `docs/standards/` 또는 본 문서 §부록에 “peek 열림 시 main region margin/width 조정” 패턴 예시
- B) 코드: `useSidePeekState` 훅 또는 `SIDE_PEEK_SHELL_OPEN_CLASS`와 연동하는 공통 layout wrapper (기존 페이지별 BEM modifier는 유지)

**완료 조건**: 5화면 중 최소 1곳 pilot 적용 + 기존 sidePeek Jest PASS. **DensityToggle·SidePeekShell 파일 이동/통합은 범위 외.**

---

## 6. component-manager sign-off

| 체크 | 결과 |
|------|------|
| SidePeekShell 중복 구현 0건 | ☑ |
| DensityToggle 중복 구현 0건 | ☑ |
| 신규 SidePeekPanel/Drawer 구현 기각 권고 | ☑ |
| ViewModeToggle과 DensityToggle merge 기각 | ☑ |
| 도메인 SidePeekContent 4종 통합 불필요 | ☑ |
| COMMON_MODULES 가이드 갱신 필요 | ☑ (PR-H1) |

**다음 담당**: core-coder — PR-H1(문서 정렬) 우선. PR-H2는 planner/designer 우선순위에 따라 선택.

---

## 7. 변경 이력

| 날짜 | 변경 |
|------|------|
| 2026-07-07 | P0 Seq 5 초안 — component-manager |
