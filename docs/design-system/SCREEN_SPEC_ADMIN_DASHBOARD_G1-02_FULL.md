# Admin Dashboard G1-02 Full Remediation Spec (AD-0)

**작성일**: 2026-07-07  
**담당**: core-designer  
**목적**: 어드민 대시보드(G1-02) 미흡 부분(AD-2~10) 및 P0 잔여 갭 전면 개선을 위한 디자인·UI/UX 스펙  
**참조**: `ADMIN_COMMERCIAL_UX_PER_PAGE_ANALYSIS.md` §G1-02, `ADMIN_DARK_MODE_C3_ROADMAP.md`, 갭 조사 결과  
**원칙**: B0KlA 펜슬 가이드, 아토믹 디자인, 다크모드 C-3 전역 롤아웃

---

## 1. 항목별 개선 스펙 (PR-DASH-01~05 매핑)

### PR-DASH-01: 위젯 목록형 UI 정합 및 CTA 단일화 (AD-2, AD-3, AD-4, AD-10)
- **ProfileCard → Table 롤백**: 대시보드 내 목록형 위젯(`ManualMatchingQueue`, `DepositPendingList`, `SchedulePendingList` 등)에서 오용된 `ProfileCard`를 `ListTableView` (Compact 밀도)로 롤백.
- **CTA ≤ 1 원칙**: 각 위젯 및 행(row)별 인라인 버튼은 제거하고 '전체 보기' 링크 1개만 위젯 상단/하단에 배치.
  - **환불 StatCard**: 4개의 분산된 CTA를 단일 CTA 섹션(예: '환불 관리 가기')으로 통합.
- **ManualMatchingQueue**: `ListTableView` SSOT 적용, 인라인 다중 버튼 제거, overflow 메뉴 또는 단일 CTA(매칭하기)만 유지.
- **위젯 Organism 정합**: 위젯 컨테이너는 `AdminCommonLayout`의 섹션 블록 스타일(`mg-v2-ad-b0kla__section`) 적용.

### PR-DASH-02: 데이터 와이어링 및 데드코드 제거 (P0 갭)
- **SchedulePendingList 데이터 버그**: `pendingDepositList` 데이터를 복붙하여 재사용하는 치명적 버그 수정. 올바른 스케줄 대기 데이터 소스로 분리 및 와이어링.
- **휴가 fetch dead code**: 대시보드에서 사용되지 않는 휴가 데이터를 가져오는 데드코드 제거. (필요 시 별도 위젯으로 분리하거나 대시보드에서 완전히 삭제)

### PR-DASH-03: Dark Mode Cascade (AD-5, P0 갭)
- **KpiFlipCard / Pipeline CSS**: `[data-theme="dark"]` 하위 `--mg-dark-*` 토큰 적용. 하드코딩 hex 절대 금지.
- **Chart.js Theme Toggle**: 다크모드 전환 시 Chart.js의 텍스트, 그리드 라인, 툴팁 배경색 등이 다크 토큰(`var(--mg-dark-text-main)`, `var(--mg-dark-border-main)` 등)을 따르도록 테마 토글 로직 연동.
- **잔여 Dark Cascade**: 모달, 필터 툴바, 테이블, 폼 내 누락된 다크 토큰 전면 적용.

### PR-DASH-04: 레이아웃 및 표시 경계 (AD-7, AD-8, AD-9)
- **1280px KPI 노출**: 1280px 해상도에서 스크롤 없이 KPI 4블록이 한눈에 들어오도록 `KpiFlipCard` 높이 및 마진 최적화. (높이 최대 120px, 패딩 16px 권장)
- **safeDisplay 적용**: 모든 위젯 데이터 출력 시 `safeDisplay` 래퍼를 통해 빈 값(null, undefined) 방어 처리.
- **Header Actions**: `ContentHeader`의 우측 액션 버튼 정리 (Primary 1개 + Secondary/Overflow).
- **관리카드 정합**: 기존 관리카드(Admin Card) 스타일을 B0KlA 섹션 블록 테두리(`var(--mg-color-border-main)`) 및 radius(16px)로 통일.

### PR-DASH-05: Parallel-4 Dev Smoke 체크리스트
- [ ] KpiFlipCard 4-grid 정렬 및 다크모드 전환 시 색상 반전 확인
- [ ] Pipeline 위젯 데이터 렌더링 및 클릭 영역(터치 타겟 44px 이상) 확인
- [ ] Pending Lists Table (Schedule, Deposit) 분리 및 데이터 정합성 확인 (중복 데이터 노출 여부)
- [ ] 1280px 해상도 레이아웃 깨짐 및 가로 스크롤 발생 없는지 확인
- [ ] Chart.js 다크모드 테마 동기화 확인 (축 텍스트, 툴팁 배경)
- [ ] 환불 StatCard 단일 CTA 동작 확인
- [ ] 모든 목록형 위젯에서 ProfileCard가 제거되고 ListTableView(Compact)로 렌더링되는지 확인

---

## 2. 화면 와이어프레임 (1280px 기준)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ AdminCommonLayout — 대시보드                                         [다크 ☾] │
├──────────────────────────────────────────────────────────────────────────────┤
│ [KPI Zone] (1280px 스크롤 없이 노출, KpiFlipCard)                            │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│ │ 금일 예약    │ │ 미결제 건수  │ │ 신규 가입    │ │ 노쇼/취소    │          │
│ │ 24 건        │ │ 3 건         │ │ 12 명        │ │ 1 건         │          │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘          │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Pipeline Zone] (CoreFlowPipeline)                                           │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Core Flow Pipeline                                                       │ │
│ │ (문의) ──▶ (매칭 대기) ──▶ (결제 대기) ──▶ (예약 확정) ──▶ (상담 완료) │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────┬───────────────────────────────────────────────┤
│ [Manual Matching Queue]      │ [Schedule / Deposit Pending Lists]            │
│ ┌──────────────────────────┐ │ ┌───────────────────────────────────────────┐ │
│ │ 매칭 대기 (ListTableView)│ │ 스케줄 대기 (ListTableView)                 │ │
│ │ 김*담 | 우울증 | [매칭]  │ │ 이*담 | 14:00 | [확인]                      │ │
│ │ 박*담 | 불안장애| [매칭]  │ │ 최*담 | 15:00 | [확인]                      │ │
│ │ ──────────────────────── │ │ ───────────────────────────────────────── │ │
│ │ [전체 매칭 대기 보기 ↗]  │ │ [전체 스케줄 보기 ↗]                        │ │
│ └──────────────────────────┘ │ └───────────────────────────────────────────┘ │
└──────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 3. 토큰 및 스타일 스펙 (Must Not)

### 3.1 사용 토큰 (Dark Mode C-3 기준)
- **배경**: `var(--mg-color-background-main)` / Dark: `var(--mg-dark-background-main)`
- **서페이스(카드)**: `var(--mg-color-surface-main)` / Dark: `var(--mg-dark-surface-main)`
- **테두리**: `var(--mg-color-border-main)` / Dark: `var(--mg-dark-border-main)`
- **텍스트**: `var(--mg-color-text-main)` / Dark: `var(--mg-dark-text-main)`
- **섹션 클래스**: `mg-v2-ad-b0kla__section`

### 3.2 Must Not (금지 사항)
- **ProfileCard 오용 금지**: 목록형 위젯에 `ProfileCard` 재사용 절대 금지. 반드시 `ListTableView`(Compact) 사용.
- **다중 CTA 금지**: 위젯 내 행별로 2개 이상의 인라인 버튼 배치 금지. (Primary 1 + Overflow 원칙)
- **하드코딩 Hex 금지**: 다크모드 CSS에 `#2C2C2C` 등 하드코딩 hex 사용 금지.
- **데이터 복붙 금지**: `pendingDepositList` 데이터를 `SchedulePendingList`에 복붙하여 렌더링하는 행위 금지.
- **1280px 스크롤 지옥 금지**: 1280px 해상도에서 KPI 카드가 잘리거나 전체 페이지에 가로 스크롤이 생기지 않도록 할 것.
- **코드 작성 금지**: 본 스펙은 디자인/레이아웃 가이드이며, 실제 구현은 core-coder에게 위임함.
