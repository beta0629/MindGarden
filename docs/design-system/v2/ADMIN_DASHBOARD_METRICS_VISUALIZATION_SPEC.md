# 관리자 대시보드 "여러 지표 시각화" 컴포넌트 — UI/UX 스펙

**버전**: 1.0.0  
**상태**: 디자인 스펙 (Design Spec)  
**참조**: 어드민 대시보드 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample  
**관련**: `PENCIL_DESIGN_GUIDE.md`, `core-solution-design-handoff`, `unified-design-tokens.css`, B0KlA

---

## 1. 개요 및 배경

- **목적**: AdminDashboardV2 상단의 "지표 시각화" 영역 요구사항을 정리하고, 5단계 파이프라인 유지 vs 새 지표 그리드 등 **레이아웃 옵션**을 제안한다. 코더가 구현할 수 있는 수준의 스펙만 제시하며, 코드는 작성하지 않는다.
- **배경**: ContentCard 안에 CoreFlowPipeline(5단계: 매칭 → 입금 확인 → 회기 권한 → 스케줄 등록 → 회기차감/회계)이 있으며, 사용자 피드백으로 "영역이 제대로 안 되고 있다", "다른 컴포넌트로 여러 지표를 시각화해 보여주는 게 필요하다"는 요구가 있다.

---

## 2. 요구사항 정리

### 2.1 지표 종류 (표시 대상)

| 구분 | 지표 | 설명 | 데이터 예시 |
|------|------|------|-------------|
| 매칭 | 내담자/상담사 매칭 건수 | 관리자 매칭 완료 건수 | totalMappings, "매칭됨" |
| 입금 | 입금 대기 건수 | ERP 연동 입금 확인 대기 | pendingDepositCount, "대기중" |
| 회기 | 회기(세션) 권한 부여 건수 | 활성 매핑/부여 완료 | activeMappings, "부여됨" |
| 스케줄 | 스케줄 등록/의견수렴 건수 | 관리자 전담 스케줄 대기 | schedulePendingCount, "의견수렴중" |
| ERP | 자동 회기차감/회계처리 | 배치·일지·연동 상태 | "배치/일지작성", "연동" 등 |

추가로 확장 가능한 지표(선택): 오늘 예약 건수, 완료율, 신규 사용자 수 등 — 현재 ContentKpiRow에 이미 있는 항목과 중복·우선순위만 정하면 됨.

### 2.2 시각화 형태

- **카드**: 단일 지표당 1카드. 숫자 + 라벨 + (선택) 보조 라벨/배지.
- **그리드**: 카드들을 일정 컬럼 수로 배치. 반응형으로 1~4+ 컬럼.
- **숫자+라벨**: 메인 숫자(24px, fontWeight 600), 라벨(12px, 보조 텍스트 색). B0KlA 카드/메트릭 규칙 준수(좌측 세로 악센트 4px 선택).
- **파이프라인(현재 방식)**: 5단계를 가로로 나열, 단계 간 연결선(connector). 단계당 PipelineStepCard(아이콘, 제목, 배지).

### 2.3 비기능 요구사항

- **반응형**: 375px(모바일) ~ 3840px(4K). `RESPONSIVE_LAYOUT_SPEC.md` 브레이크포인트 준수. 모바일에서는 그리드 1열 또는 가로 스크롤 허용.
- **B0KlA/마인드가든 톤 유지**: 색상·간격·타이포·카드 형태는 `mindgarden-design-system.pen`, `unified-design-tokens.css`, `AdminDashboardB0KlA.css`의 토큰·클래스만 사용. 어드민 대시보드 샘플과 동일한 비주얼 언어.
- **접근성**: 섹션/카드에 적절한 aria-label, 제목 계층 유지.

---

## 3. 레이아웃 옵션 제안

### 옵션 A: 현재 CoreFlowPipeline 5단계만 유지·개선

- **설명**: ContentCard 내부에 기존 5단계 파이프라인만 두고, 비주얼·정보 밀도·반응형만 개선.
- **장점**: 비즈니스 흐름(5단계)이 그대로 강조되며, 변경 범위가 작아 안정적이다.
- **단점**: "여러 지표를 한눈에" 보려는 니즈에는 한계가 있고, 지표가 5개로 고정된다.

### 옵션 B: 새 지표 그리드(KPI 타일 그리드)로 대체

- **설명**: ContentCard 안의 파이프라인을 제거하고, 동일 5개(또는 확장) 지표를 **KPI 타일 그리드**로만 표시. 카드 그리드·숫자+라벨 형태.
- **장점**: 지표를 동등한 비중으로 나열해 스캔하기 쉽고, 그리드 레이아웃으로 반응형 대응이 단순하다.
- **단점**: "흐름(1→2→3→4→5)" 의미가 약해지며, 단순 숫자 나열로 보일 수 있다.

### 옵션 C: 상단 KPI 타일 + 하단 파이프라인 분리

- **설명**: 상단에 소수(3~5개) KPI 타일만 배치하고, 그 아래 별도 섹션 블록으로 5단계 파이프라인을 유지. "숫자 요약" + "흐름 시각화"를 동시에 제공.
- **장점**: 한 화면에서 핵심 수치와 흐름을 모두 제공할 수 있어, 사용자 피드백("여러 지표" + "파이프라인")을 동시에 만족시킬 수 있다.
- **단점**: 세로 공간 사용이 늘어나며, KPI와 파이프라인 데이터 중복 표시 가능성이 있다(동일 지표를 타일과 단계 배지에 둘 수 있음).

---

## 4. 어드민 대시보드 샘플과의 일관성 제안

- **색상**: `var(--mg-color-background-main)`, `var(--mg-color-surface-main)`, `var(--mg-color-primary-main)`, `var(--mg-color-text-main)`, `var(--mg-color-text-secondary)`, `var(--mg-color-border-main)` 및 B0KlA 확장 `--ad-b0kla-*`(green, orange, blue, card-bg, border 등)만 사용. hex 직접 사용 금지.
- **간격**: 섹션 패딩 24px(데스크톱), 카드/타일 간 gap 16~24px. `var(--mg-spacing-md)`, `var(--mg-spacing-lg)`, `var(--mg-spacing-xl)` 등으로 명시.
- **카드 형태**: 배경 `var(--ad-b0kla-card-bg)` 또는 `var(--mg-color-surface-main)`, 테두리 1px `var(--ad-b0kla-border)` / `var(--mg-color-border-main)`, border-radius 16px(또는 `var(--ad-b0kla-radius)`). 섹션 블록은 좌측 세로 악센트 바(4px, 주조색) + 제목(16px, 600) 규칙 유지.
- **타이포**: Noto Sans KR. 제목 20~24px/600, 본문 14~16px, 라벨/캡션 12px. 샘플과 동일한 톤.

---

## 5. 코더 구현용 세부 스펙 (옵션별)

코드는 작성하지 않으며, 아래는 **선택한 옵션**에 따라 코더가 적용할 수 있는 블록 구성·토큰·반응형만 명시한다.

### 5.1 공통 — 블록·토큰·반응형

- **컨테이너**: 지표 시각화 영역은 기존 `ContentCard` 또는 `mg-v2-ad-b0kla__card`로 감싼다. 배경·테두리·radius는 `PENCIL_DESIGN_GUIDE.md` 2.3 섹션 블록 및 `--ad-b0kla-*` 토큰 사용.
- **사용 토큰 (공통)**  
  - 배경: `var(--mg-color-surface-main)` 또는 `var(--ad-b0kla-card-bg)`  
  - 테두리: `var(--mg-color-border-main)` 또는 `var(--ad-b0kla-border)`  
  - radius: `var(--ad-b0kla-radius)` (24px) 또는 16px  
  - 간격: `var(--mg-spacing-md)`, `var(--mg-spacing-lg)`, `var(--mg-spacing-xl)`  
  - 텍스트: 제목 `var(--mg-color-text-main)` / `var(--ad-b0kla-title-color)`, 라벨 `var(--mg-color-text-secondary)` / `var(--ad-b0kla-text-secondary)`  
  - 악센트(세로 바·아이콘 배경): `var(--ad-b0kla-green)`, `var(--ad-b0kla-orange)`, `var(--ad-b0kla-blue)` 및 대응 `-bg` 변수
- **반응형 breakpoint** (`RESPONSIVE_LAYOUT_SPEC.md` 기준)  
  - 모바일 375px: 1열 그리드 또는 가로 스크롤, 패딩 16px, gap 12px  
  - 태블릿 768px: 2열, 패딩 20px, gap 16px  
  - 데스크톱 1280px: 3~4열(또는 파이프라인 5단 가로), 패딩 24px, gap 20~24px  
  - Full HD 1920px, 2K 2560px, 4K 3840px: 컨테이너 max-width 및 gap 확대(28~40px) 적용

### 5.2 옵션 A 적용 시

- **상세 스펙**: 옵션 A 세부 비주얼·레이아웃·반응형·로딩/에러는 **[ADMIN_DASHBOARD_METRICS_OPTION_A_SPEC.md](./ADMIN_DASHBOARD_METRICS_OPTION_A_SPEC.md)** 참조.
- **블록 구성**: 1개 섹션 블록. 내부에 `core-flow-pipeline` → `core-flow-pipeline__steps` + `core-flow-pipeline__connector` 유지. 각 단계는 기존 `PipelineStepCard`(아이콘, 제목, 배지) 재사용.
- **토큰**: `CoreFlowPipeline.css`에서 이미 사용 중인 `--mg-spacing-lg`, `--mg-layout-gap`, `--mg-border-default` 등 유지. 카드/배지 색은 `--ad-b0kla-green`, `-orange`, `-blue` 등으로 단계별 variant 매핑.
- **개선 포인트(스펙만)**: 단계 카드 최소 너비·타이포 크기 명시, connector 스타일(2px dashed), 모바일에서 터치 스크롤 유지. 필요 시 섹션 제목 추가("핵심 흐름" 등) + 좌측 악센트 바 4px. **이중 카드 제거**(파이프라인에 카드 스타일 중복 적용 금지), **overflow**(ContentCard visible, steps만 overflow-x auto), **padding 중첩 완화**는 옵션 A 전용 스펙 문서에 정의.

### 5.3 옵션 B 적용 시

- **블록 구성**: 1개 섹션 블록. 내부에 KPI 타일 그리드 1개. 각 타일: 아이콘(선택) + 숫자(24px, 600) + 라벨(12px). 기존 `ContentKpiRow` / `mg-v2-content-kpi-card` 또는 `mg-v2-ad-b0kla__kpi-card` 클래스 재사용 가능.
- **그리드**: `display: grid`, `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))` 또는 브레이크포인트별 명시(모바일 1, 태블릿 2, 데스크톱 4~5). gap은 `var(--mg-spacing-lg)` 이상.
- **토큰**: KPI 카드 배경 `var(--ad-b0kla-card-bg)`, 테두리 `var(--ad-b0kla-border)`, 숫자 `var(--ad-b0kla-title-color)`, 라벨 `var(--ad-b0kla-text-secondary)`. 아이콘 영역 `mg-v2-ad-b0kla__kpi-icon--green/orange/blue` 등 기존 변형 활용.

### 5.4 옵션 C 적용 시

- **블록 구성**:  
  - **상단**: KPI 타일 그리드 1개(옵션 B와 동일한 토큰·그리드). 지표는 3~5개로 제한(중복 최소화).  
  - **하단**: 별도 섹션 블록 1개. 제목(좌측 악센트 바 4px + "핵심 흐름" 등) + `CoreFlowPipeline` 5단계.
- **토큰**: 상단은 옵션 B와 동일. 하단 섹션은 `mg-v2-ad-b0kla__card`, `mg-v2-ad-b0kla__section-title`(또는 동일 스타일) + 기존 파이프라인 토큰.
- **반응형**: 상단 그리드와 하단 파이프라인이 모두 동일 breakpoint에서 열 수 감소/스크롤 적용.

---

## 6. 상호작용·상태 (공통)

- **로딩**: 지표 데이터 로딩 중에는 카드/타일 내 숫자 자리에 스켈레톤 또는 "—" 표시. 기존 로딩 패턴 유지.
- **에러/빈 데이터**: API 실패 시 해당 타일만 "—" 또는 "데이터 없음" 문구. 전체 영역 비노출보다는 빈 상태 유지 권장.
- **클릭(선택)**: 타일/단계 카드를 클릭해 해당 업무 화면(매칭 관리, 입금 확인 등)으로 이동할 경우, `ContentKpiRow`의 `onClick` 패턴처럼 클릭 가능 카드에만 `mg-v2-content-kpi-card--clickable` 등 명시. 포커스·호버 스타일은 B0KlA 버튼/카드 톤 유지.

---

## 7. 참조 문서

| 문서/파일 | 용도 |
|-----------|------|
| `docs/design-system/PENCIL_DESIGN_GUIDE.md` | B0KlA 팔레트·레이아웃·섹션 블록·체크리스트 |
| `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` | 브레이크포인트·컨테이너·패딩·그리드 |
| `docs/design-system/ATOMIC_DESIGN_SYSTEM.md` | Atoms → Organisms 계층, 컴포넌트 재사용 |
| `frontend/src/styles/unified-design-tokens.css` | `var(--mg-*)` 토큰 목록 |
| `frontend/src/styles/dashboard-tokens-extension.css` | `--ad-b0kla-*` 토큰 |
| `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css` | `mg-v2-ad-b0kla__kpi-*`, `mg-v2-ad-b0kla__card` 등 |
| [ADMIN_DASHBOARD_STEP_CHART_COLORS_SPEC.md](./ADMIN_DASHBOARD_STEP_CHART_COLORS_SPEC.md) | 단계별 현황 **도넛 차트** 색상(hex 필수)·라벨–색상 1:1 대응표 |
| `.cursor/skills/core-solution-design-handoff/SKILL.md` | 산출물 형식·코더 전달 항목 |

---

**요약**: 지표 종류(매칭·입금·회기·스케줄·ERP), 카드/그리드/숫자+라벨 형태, 반응형·B0KlA 톤을 요구사항으로 정리했고, (A) 파이프라인 유지·개선, (B) KPI 그리드로 대체, (C) 상단 KPI + 하단 파이프라인 분리 세 가지 옵션의 장단점과, 각 옵션별 블록 구성·토큰·반응형 breakpoint를 코더가 그대로 구현할 수 있도록 명시했다. **옵션 A 진행 시** 세부 비주얼·레이아웃·overflow·로딩/에러는 [ADMIN_DASHBOARD_METRICS_OPTION_A_SPEC.md](./ADMIN_DASHBOARD_METRICS_OPTION_A_SPEC.md)를 따른다. 코드는 작성하지 않았으며, 설계·스펙만 산출한다.
