# Admin UI 정보 밀도·뷰 모드 전수 감사 (2026-06-27)

> **목적**: B2B 어드민에서 B2C형 카드·과다 인라인 액션이 반복되는 anti-pattern을 전수 식별하고, **Modify-first(기존 화면 개선)** 정책과 우선순위를 고정한다.  
> **범위**: `frontend/` — admin · consultant · tenant · erp 목록·카드·프로필·대시보드 위젯  
> **검사일**: 2026-06-27 (코드베이스 정적 분석)  
> **관련 회의/태스크**: `USER_MANAGEMENT_VIEW_MODE_MEETING.md`, `LIST_VIEW_TOGGLE_CODER_TASK.md`, `TASK_CORE_CODER_COMPACT_CARD_BADGE_LAYOUT.md`

---

## 1. Executive Summary

MindGarden 어드민·ERP·테넌트 포털 전반에 **「카드 기본 + compact 변형 + 인라인 3~4버튼」** 패턴이 구조적으로 반복되어 있다. `ListTableView`·overflow menu 등 B2B 벤치마크 수단은 이미 존재하나, **기본 viewMode가 card/smallCard**인 화면이 다수이며 CSS는 `ProfileCard.css`와 `unified-design-tokens.css`에 **동일 규칙이 중복·누적**되어 patch-on-patch 상태다.

| 구분 | 건수(본 감사) | 핵심 리스크 |
|------|--------------|------------|
| card/smallCard **기본** + list/table **보유** | 6 | 20+ 행 스캔 불가, 운영자 업무 효율 저하 |
| ProfileCard/ConsultantCard **compact + 인라인 3~4버튼** | 5 | 행당 시각·클릭 부하, 반응형 깨짐 |
| B2C 카드 그리드 only (토글·테이블 없음) | 4 | 벤치마크 불일치, 확장 시 재작업 |
| CSS patch-on-patch (중복·compact 전용 블록) | 3+ 파일 | 수정 비용 기하급수, SSOT 붕괴 |

**즉시 P0 (구조 재설계 배치 대상)**  
1. **내담자 종합 관리** — `smallCard` 기본, compact 카드당 **4버튼** 인라인, `renderClientActions` 3벌 복제  
2. **상담사 종합 관리** — 동일 패턴 + `ConsultantCard` admin-compact 별도 variant  
3. **스태프 관리** — `smallCard` 기본, compact당 **4~5버튼** 인라인, ClientOverviewTab과 동일 action bar 복제  

**정책 방향**: MVP→상용화 구간에서는 **신규 페이지·뷰·카드 variant 추가 금지(예외 승인)**. 기존 `ListTableView`·`ViewModeToggle`·`CardActionGroup` 위에 **default=list + overflow menu**로 수렴한다.

---

## 2. 검사 방법

### 2.1 정적 코드 검색 (2026-06-27 수행)

| 키워드 / 패턴 | 도구 | 목적 |
|--------------|------|------|
| `useState('smallCard'|'largeCard'|'card')` | ripgrep | card-default 화면 식별 |
| `ViewModeToggle`, `ListTableView`, `SmallCardGrid` | import·사용처 | table 보유 여부 |
| `ProfileCard variant="compact"`, `admin-compact` | 컴포넌트 참조 | compact + 인라인 액션 |
| `mg-v2-client-actions`, `--compact` | CSS | patch-on-patch·중복 |
| `renderClientActions`, `renderStaffActionBar` | 함수명 | 액션 bar 복제 |

### 2.2 화면별 판정 기준

| 심각도 | 조건 |
|--------|------|
| **P0** | card-default + list/table 구현됨 + compact 인라인 **≥3 primary actions** + CSS 3회+ patch 징후 |
| **P1** | card-default 또는 compact 과다 버튼; table은 있으나 default 미정렬 |
| **P2** | 카드 only이나 데이터량·역할상 허용 가능(대시보드 위젯 등) |
| **P3** | 이미 table-default 또는 정보 밀도 양호 |

### 2.3 수동 확인 권장 (후속)

- 각 P0 화면 **20+ mock row** 스크롤·액션 reachability  
- 1280px / 768px breakpoint에서 compact 버튼 wrap  
- `localStorage` 또는 URL에 viewMode persist 여부

---

## 3. 페이지별 Inventory

| # | 경로 (컴포넌트) | default viewMode | list/table | 문제 요약 | 심각도 | 우선 |
|---|----------------|------------------|------------|-----------|--------|------|
| 1 | `admin/ClientComprehensiveManagement` (+ `ClientOverviewTab`) | **smallCard** | list ✓ | compact 4버튼(상세·수정·비번·삭제); `mg-v2-client-actions` 3 variant 복제 | **P0** | P1 |
| 2 | `admin/ConsultantComprehensiveManagement` | **smallCard** | list ✓ | `ConsultantCard` admin-list/admin-compact 이중체계; compact 3~4버튼 | **P0** | P1 |
| 3 | `admin/StaffManagement` | **smallCard** | list ✓ | 4~5버튼(상세·수정·역할·삭제); Client와 동일 action 패턴 복붙 | **P0** | P1 |
| 4 | `erp/FinancialManagement` (거래 목록) | **card** | table ✓ | B2B ERP인데 카드 default; compact/card/table 3분기 CSS | P1 | P1 |
| 5 | `admin/mapping-management/organisms/MappingListBlock` | **card** | table·calendar ✓ | 매칭 목록 card default; `MappingCard` 최대 5 ActionButton | P1 | P1 |
| 6 | `erp/SalaryManagement` (상담사 프로필 탭) | **largeCard** | list ✓ | ERP 급여 맥락에서 largeCard default; card 3-mode | P1 | P2 |
| 7 | `admin/UserManagement` | card grid only | ✗ | ViewModeToggle·ListTableView 없음; 역할별 카드 그리드 only | P1 | P2 |
| 8 | `consultant/ConsultantClientList` | card grid only | ✗ | `ClientCard variant="detailed"` 그리드 only; 상담사 업무 스캔 비효율 | P1 | P2 |
| 9 | `tenant/PgConfigurationList` | card only | ✗ | PG 설정 카드 + footer **최대 4~5버튼**; 테이블 뷰 없음 | P1 | P2 |
| 10 | `ui/Card/MappingCard` (매칭 카드 SSOT) | N/A (카드 컴포넌트) | — | 상태별 **최대 5개** ActionButton 노출; overflow 없음 | P1 | P1 |
| 11 | `admin/SessionManagement` (quick/search 탭) | compact grid | ✗ | `ProfileCard variant="compact"` 그리드; 검색 결과도 compact | P2 | P3 |
| 12 | `admin/AdminDashboard` (휴가 위젯) | ProfileCard list | ✗ | 주석「테이블→카드 전환」; 대시보드 preview 한정 | P2 | P3 |
| 13 | `admin/VacationStatistics` | ProfileCard list | ✗ | 상담사별 카드 나열; 통계·드릴다운용 | P2 | P3 |
| 14 | `admin/lifecycle/DormantUsersList` | **table** | ✓ | `<table>` 기반; PII 마스킹·행 액션 3개 | P3 | — |
| 15 | `erp/RefundManagement` | **table** | ✓ | `refundViewMode` default `'table'` — **벤치마크 준수** | P3 | — |
| 16 | `admin/psych-assessment/organisms/PsychDocumentListBlock` | **table** | card ✓ | default table (스펙 `DESIGN_SPEC_FINAL`과 일치) | P3 | — |
| 17 | `admin/consultation-log-view/ConsultationLogTableBlock` | **table** | ✓ | ListTableView only | P3 | — |
| 18 | `admin/AdminShopOrdersPage` | **table** | ✓ | ListTableView | P3 | — |
| 19 | `admin/AdminContentMasterPage` | **table** | ✓ | ListTableView | P3 | — |
| 20 | `admin/AdminCommunityModerationQueuePage` | **table** | ✓ | ListTableView + CardActionGroup | P3 | — |
| 21 | `admin/mapping/AdminPendingPaymentCleanupPage` | **table** | ✓ | ListTableView + CardActionGroup | P3 | — |
| 22 | `schedule/ScheduleDetailModal` | compact cards | — | 모달 내 4× ProfileCard compact (참여자 패널) | P2 | P3 |
| 23 | `dashboard/widgets/consultation/ConsultantClientWidget` | compact | — | 위젯 1행 preview | P2 | P3 |
| 24 | `consultant/ConsultantClientManagementRenewal` | inline ClientCard | ✗ | 로컬 ClientCard duplicate; renewal 실험 UI | P2 | P3 |

**Inventory 건수**: 24건 (P0 3 · P1 7 · P2 7 · P3 7)

---

## 4. CSS·구조 patch-on-patch 징후

| 파일 | 징후 | patch 추정 | 조치 |
|------|------|-----------|------|
| `admin/ProfileCard.css` | `.mg-v2-profile-card--compact`, `.mg-v2-client-actions--compact`, `--table` 변형 | 8+ 블록 | compact 전용 제거 → table row action SSOT |
| `styles/unified-design-tokens.css` | `.mg-client-cards-grid--compact` **2회**, `.mg-consultant-cards-grid--compact` **2회**, `.mg-v2-client-actions` **2회** (L5011/L9356, L5479/L9108, L11871/L12110) | ≥8회 누적 | 중복 삭제·단일 섹션화 |
| `ui/Card/ConsultantCard.js` | `admin-list` / `admin-compact` variant + salary-profile-compact 등 | parallel variant tree | ProfileCard/list row 또는 table cell로 통합 |
| `ClientOverviewTab.js` ↔ `StaffManagement.js` | `renderClientActions` ≈ `renderStaffActionBar` 동일 구조 | logic duplicate | 공통 `EntityRowActions` (overflow) 추출 |

**트리거 정책**: 동일 화면·컴포넌트에 **CSS-only patch 3회 이상** 또는 compact/table 변형 클래스 **3개 이상**이면 **구조 재설계 배치 필수** (신규 CSS patch 금지).

---

## 5. B2B Admin 벤치마크 기준

| 항목 | 기준 | 현재 gap |
|------|------|----------|
| **Default viewMode** | 데이터 목록(사용자·거래·매칭)은 **`list`/`table`** | 6화면 card/smallCard/largeCard default |
| **Row actions** | Primary 1 + **overflow menu** (⋯) | 4~5 full-width 버튼 inline |
| **정보 밀도** | 20+ row viewport 내 스캔 (desktop 1280) | compact card 2~4열 → 행 수 ÷4 |
| **ViewModeToggle** | persist (localStorage/URL) + default=list | state only, remount 시 card reset |
| **컴포넌트** | `ListTableView` + `CardActionGroup` / overflow | ProfileCard compact, MappingCard multi-button |
| **CSS SSOT** | 토큰 1곳 + BEM 1파일 | tokens + ProfileCard + page CSS 중첩 |

**참조 준수 사례**: `RefundManagement`, `PsychDocumentListBlock`, `DormantUsersList`, `ConsultationLogTableBlock`.

---

## 6. 수정 우선 정책 (Modify-first)

### 6.1 MVP → 상용화 원칙

1. **기존 화면 개선(Modify-first) 우선** — 신규 페이지·독립 뷰·카드 variant 추가는 **예외 승인** 후에만 허용.  
2. **신규 컴포넌트 최소화** — `ListTableView`, `ViewModeToggle`, `CardActionGroup`, `UnifiedModal` 등 기존 common 우선.  
3. **default=list/table 전환** — card 뷰는 optional preview·mobile fallback.  
4. **CSS-only patch 3회 이상** → 구조 재설계 배치 필수 (§4).  
5. **B2B admin checklist** (PR·코더 완료 조건):  
   - [ ] default viewMode = `list` 또는 `table`  
   - [ ] row action = primary 1 + overflow  
   - [ ] 20+ row density test (스크린샷 또는 story)  
   - [ ] viewMode persist  
   - [ ] compact variant 신규 추가 없음  

### 6.2 금지·제한

| 금지 | 대안 |
|------|------|
| `ProfileCard variant="compact"` 신규 admin 목록 | table row + avatar cell |
| `ConsultantCard admin-compact` 확장 | list view cell renderer |
| `unified-design-tokens.css`에 page-specific compact block 추가 | `ProfileCard.css` 정리 후 삭제 |
| 화면별 `renderXxxActions` 복붙 | `EntityRowActions` + overflow menu |

---

## 7. 중복 컴포넌트 · 재사용 SSOT

| 현재 (분산) | 역할 | SSOT 목표 | 비고 |
|------------|------|-----------|------|
| `ProfileCard` (list/compact/default) | 사용자·내담자·상담사 카드 | **Admin list → `ListTableView` row**; 카드는 dashboard preview only | compact admin 목록 deprecate |
| `ConsultantCard` (admin-list/admin-compact/…) | 상담사 8+ variant | **2 variant**: `schedule-select`, `dashboard-preview` | admin variant 제거 |
| `ClientCard` / `ConsultantClientManagementRenewal` inline | B2C형 detailed card | **`ConsultantClientList` → ListTableView** | renewal local card 삭제 |
| `MappingCard` | 매칭 카드 5-button | table row + `CardActionGroup` overflow | MappingListBlock default table |
| `renderClientActions` / `renderStaffActionBar` | 4~5 MGButton | **`EntityRowActions`** (common) | Client·Staff·Consultant 공유 |
| `ViewModeToggle` | 3-mode pill | **유지** — options에서 card를 optional로 | default list |
| `ListTableView` | table SSOT | **유지·확장** (avatar column, overflow cell) | 15+ 화면 이미 사용 |
| `CardActionGroup` | 카드/행 하단 버튼 wrap | **overflow menu wrapper**로 승격 검토 | ModerationQueue 등 |
| `SmallCardGrid` | compact grid | **deprecate (admin)** | mobile fallback only |
| `mg-v2-client-actions` CSS | compact/table/button | **삭제 대상** | overflow component 스타일 1벌 |

---

## 8. 다음 배치 제안

### Batch A — P0 구조 (core-designer → core-coder → core-tester)

| 순서 | 대상 | 작업 | 담당 |
|------|------|------|------|
| A1 | ClientComprehensiveManagement | default **`list`**; compact 제거; overflow menu | designer + coder |
| A2 | ConsultantComprehensiveManagement | A1 동일 + admin-compact variant deprecate | coder |
| A3 | StaffManagement | A1 동일 + `EntityRowActions` 추출 | coder |
| A4 | CSS consolidation | tokens 중복 제거, ProfileCard compact block deprecate | coder + design-system |

**완료 조건**: 3화면 20+ row 스크린 · default list · overflow · 회귀 테스트(`ClientModal.*`, StaffManagement test).

### Batch B — P1 ERP·매칭 (A 완료 후)

| 대상 | 작업 |
|------|------|
| FinancialManagement | `transactionViewMode` default → **`table`** |
| MappingListBlock | default → **`table`**; MappingCard 버튼 → overflow |
| UserManagement | ViewModeToggle + ListTableView 도입 |
| PgConfigurationList | table view 추가, card → optional |

### Batch C — P2 consultant·tenant (여유 시)

| 대상 | 작업 |
|------|------|
| ConsultantClientList | card grid → table + mobile card |
| ConsultantClientManagementRenewal | renewal card 제거, list SSOT 합류 |

### Batch D — 정책 게이트 (core-tester + CI)

- PR template에 **§6.1 B2B checklist** 체크박스  
- `check-hardcode` / lint scope에 `useState('smallCard')` admin 경로 warn (optional)  
- `docs/standards/`에 본 문서 링크 추가 (문서 정리 배치)

---

## 9. 부록 — 검색 재현 명령

```bash
# card-default admin 목록
rg "useState\\('smallCard'|useState\\('largeCard'|useState\\('card'" frontend/src/components

# compact ProfileCard
rg 'variant="compact"' frontend/src/components

# ListTableView 보유 페이지
rg 'ListTableView' frontend/src/components --glob '*.{js,jsx}' -l

# CSS 중복
rg 'mg-v2-client-actions|mg-client-cards-grid--compact' frontend/src/styles/unified-design-tokens.css
```

---

## 10. 변경 이력

| 날짜 | 작성 | 내용 |
|------|------|------|
| 2026-06-27 | core-planner (정적 전수 검사) | 초版 — inventory 24건, P0 3건, Modify-first 정책 |
