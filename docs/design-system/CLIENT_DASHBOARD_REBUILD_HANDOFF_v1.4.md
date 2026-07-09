# 내담자 대시보드 v1.4 Rebuild 핸드오프 (Design Spec)

**상태**: v1.4 Rebuild (Design Handoff) — **Admin 어드민 대시보드 동급 시각 스펙 Freeze**  
**작성자**: `core-planner` (정책) · `core-designer` (v1.4 디자인 SSOT)  
**SSOT**: `PENCIL_DESIGN_GUIDE.md`, `mindgarden-design-system.pen`, `unified-design-tokens.css`, `SCREEN_SPEC_ADMIN_DASHBOARD_G1-02_FULL.md`

> **[Design Freeze Sign-off (2026-07-07)]**
> - **no defer on visual**: Admin 수준의 완성도를 보장하기 위한 최종 스펙입니다.
> - 시각적 갭(P2 visual)은 P0로 승격되어 ListTableView, B0KlA section-block, KPI 4-grid 등으로 전면 해소됩니다.
> - Web 전용 스펙이며, AppShell 시안 강제 이식을 금지합니다.

---

## 1. 개요 및 목표

기존 v1.1~1.3의 파편화된 UI를 어드민 대시보드(G1-02) 레이아웃 표준을 차용하여 전면 재구현합니다. 
하드코딩된 픽셀/색상값을 배제하고 100% 토큰과 공통 클래스 기반으로 재설계합니다.

- **디자인 톤**: B0KlA 어드민 대시보드의 "섹션 블록(`mg-v2-section-block`) + 좌측 악센트" 구조 차용. 둥근 모서리(16px)와 서페이스 여백.
- **핵심 원칙**: `ProfileCard` 등 부적절한 컴포넌트 렌더링 배제. 다크모드 완벽 호환. 섹션 스켈레톤 제공.

---

## 2. 섹션별 컴포넌트 트리 및 UI 스펙

전체 페이지 래퍼: `<div class="mg-v2-layout-main bg-[var(--mg-color-background-main)]">`

### 2.1 상단 바 (Page Header)
- **`ContentHeader`**: Breadcrumb · Title · 주요 액션(1개 버튼).

### 2.2 나의 현황 (KPI 4-grid) 
- **`ContentKpiRow`**: 가로 4칸의 Kpi 카드로 재구성. 상단 배치.
- 1280px 해상도에서 화면 스크롤 없이 전부 노출되어야 합니다. 높이와 마진 최소화.
- KPI 드릴다운(이동)은 **웹-native 경로**에만 의존합니다.

### 2.3 다음 일정 및 액션 (ListTableView)
- **`SectionBlock`**: 배경 `var(--mg-color-surface-main)`, 테두리 `1px solid var(--mg-color-border-main)`, 좌측 4px 악센트 띠 적용.
- **`ListTableView`**: 구형 카드/인라인 스타일을 폐기하고 `ListTableView`(Compact 밀도)로 데이터 출력.
- 다중 CTA 금지. '전체 일정 보기' 단일 CTA만 허용.

### 2.4 빠른 메뉴 (Quick Menu 4 SSOT)
- **Web**: 앱 패리티 기능(App-only UI)을 강제로 렌더링하지 않음.
- Desktop: LNB 정합 4버튼 (스케줄, 회기 관리, 결제 내역, 설정). (`clientDashboardRoutes.js` 기준)
- 앱 하단 바텀탭(Bottom Navigation) 디자인 차용 금지.

---

## 3. Empty / Loading (스켈레톤) / Error 처리

| 섹션 | Loading 상태 | Empty 상태 | Error 상태 |
|------|-------------|------------|------------|
| KPI 4-grid | `ContentKpiRow` 4칸 스켈레톤 | 숫자 `0` 표기 | `-` (하이픈) 표시 |
| 다음 일정 | `ListTableView` 3줄 스켈레톤 | "예정된 일정이 없습니다" | "데이터 로드 실패" |
| 퀵 메뉴 | 아이콘 로더 또는 기본 렌더 | 해당 없음 | 버튼 비활성화 (disabled) |

- 페이지 전체를 덮는 Loading Spinner 금지. 각 섹션 블록 단위의 스켈레톤 UI를 제공해야 합니다.

---

## 4. 제거할 Legacy 패턴 및 Must-not

1. **v1.1 이전 유틸 및 인라인 스타일**: hex 색상, 마진/패딩 하드코딩 금지.
2. **ProfileCard 렌더링**: 리스트 출력용으로 오용 금지.
3. **앱 경로 매핑**: `/client/wellness-hub` 등 App 전용 경로를 웹에서 딥링크/라우팅 처리 금지.
4. **다중 CTA**: 하나의 테이블 열(Row)에 2개 이상의 버튼 삽입 금지.

---

## 5. Coder 핸드오프: Admin 대비 완료 체크리스트 (Quality Gate)

구현 담당자(`core-coder`)는 PR 생성 전 아래 체크리스트를 통과해야 합니다.

- [ ] **B0KlA 토큰 100% 매핑**: `var(--mg-*)` 및 `mg-v2-section-block` 외 임의 색상/테두리 0건.
- [ ] **레이아웃**: 좌측 사이드바 + 우측 메인 형태 유지. 섹션 타이틀 좌측에 악센트 바(4px) 적용.
- [ ] **KPI 4-grid**: 1280px 스크롤 없이 한눈에 표출되는가.
- [ ] **ListTableView**: 일정 목록에서 `ProfileCard`를 전면 폐기하고 `ListTableView`를 적용했는가.
- [ ] **Quick Menu 4 SSOT**: 웰니스 등 앱 전용 메뉴를 빼고 LNB와 동일한 4개의 필수 항목만 제공하는가.
- [ ] **Loading/Error**: 빈 화면일 때 섹션별 스켈레톤 UI가 렌더링되는가.
- [ ] **Dark Mode Cascade**: 강제 색상 없이 테마 토글 시 배경, 텍스트, 보더의 색상이 즉시 반전되는가.
- [ ] **반응형 회귀 0건**: 1280px, 768px, 414px에서 가로 스크롤 발생 및 컴포넌트 겹침이 없는가.
