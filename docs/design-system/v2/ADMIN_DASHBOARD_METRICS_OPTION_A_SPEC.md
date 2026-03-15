# 관리자 대시보드 지표 영역 — 옵션 A(파이프라인 유지·개선) 세부 디자인 스펙

**버전**: 1.0.0  
**상태**: 디자인 스펙 (Design Spec)  
**결론**: 옵션 A(파이프라인 유지·개선)로 진행. 데이터 연동·레이아웃·스타일 수정 후 접근성 보강.  
**참조**: [ADMIN_DASHBOARD_METRICS_VISUALIZATION_SPEC.md](./ADMIN_DASHBOARD_METRICS_VISUALIZATION_SPEC.md), `PENCIL_DESIGN_GUIDE.md`, 어드민 대시보드 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample

---

## 1. 개요

- **범위**: AdminDashboard 상단 지표 영역 중 **CoreFlowPipeline 5단계**만 유지·개선. ContentCard(또는 `mg-v2-ad-b0kla__card`)와의 관계, 단계 카드 비주얼, 반응형, 로딩/에러 상태를 코더가 추측 없이 구현할 수 있도록 스펙만 정의한다.
- **코드 작성 없음**: 본 문서는 디자인 스펙만 포함하며, 구현은 core-coder가 수행한다.

---

## 2. CoreFlowPipeline 5단계 카드 — 비주얼 스펙

### 2.1 단계 카드(PipelineStepCard) 치수·간격

| 항목 | 값 | 토큰/클래스 |
|------|-----|--------------|
| **카드 최소 너비** | 160px (데스크톱), 140px (태블릿 이하) | `min-width` — 브레이크포인트별 상이 |
| **카드 패딩** | 16px (데스크톱), 12px (태블릿/모바일) | `var(--mg-spacing-md)` / `var(--mg-spacing-sm)` |
| **카드 내부 gap** | 8px (아이콘↔콘텐츠), 4px (제목↔배지) | `var(--mg-spacing-sm)`, `var(--mg-spacing-xs)` |
| **단계 카드 간 gap** | 20px (데스크톱), 16px (태블릿 이하) | `var(--mg-spacing-lg)` / `var(--mg-spacing-md)` |
| **커넥터 폭** | 24px (고정) | `core-flow-pipeline__connector` |
| **카드 border-radius** | 12px | `var(--ad-b0kla-radius-sm)` |

### 2.2 배지·아이콘 위치

- **아이콘**: 카드 상단 좌측. 크기 20px(또는 24px 통일). 색은 variant에 따라 토큰 적용.
- **제목**: 아이콘 아래, 1줄 말줄임(`...`) 허용. 폰트 12~13px(0.75rem~0.8125rem), fontWeight 600, 색 `var(--ad-b0kla-title-color)` 또는 `var(--mg-color-text-main)`.
- **배지(PipelineStepBadge)**: 제목 아래. **값(value)** + **라벨(label)** 세로 배치 또는 가로 배치(스펙 선택 시 일관 적용). 배지 패딩 4px 8px, border-radius 8px, 폰트 value 12px/600, label 11px(0.7rem).

### 2.3 Variant별 색상 토큰 (B0KlA/마인드가든 톤)

단계별 variant와 토큰 매핑. **hex 직접 사용 금지**, 아래 토큰만 사용.

| Variant | 카드 배경 | 아이콘/강조 색 | 배지 배경 | 배지 텍스트 |
|---------|-----------|----------------|-----------|-------------|
| **success** | `var(--ad-b0kla-green-bg)` | `var(--ad-b0kla-green)` | `var(--ad-b0kla-green-bg)` | `var(--ad-b0kla-title-color)` 또는 `var(--mg-color-text-main)` |
| **warning** | `var(--ad-b0kla-orange-bg)` | `var(--ad-b0kla-orange)` | `var(--ad-b0kla-orange-bg)` | `var(--ad-b0kla-title-color)` |
| **info** | `var(--ad-b0kla-blue-bg)` | `var(--ad-b0kla-blue)` | `var(--ad-b0kla-blue-bg)` | `var(--ad-b0kla-title-color)` |
| **auto** / **neutral** | `var(--mg-color-surface-main)` 또는 `var(--ad-b0kla-card-bg)` | `var(--ad-b0kla-icon-color)` | `var(--mg-gray-100)` 또는 동일 | `var(--ad-b0kla-text-secondary)` |

- **테두리**: 단계 카드 외곽 테두리는 **1px** `var(--ad-b0kla-border)` 또는 `var(--mg-color-border-main)`. 선택 사항: variant별 좌측 세로 악센트(4px)로 구분 가능.
- **커넥터(connector)**: 2px dashed, 색 `var(--mg-color-border-main)` 또는 `var(--ad-b0kla-border)`.

### 2.4 ContentCard 래퍼와의 관계 — 이중 카드 제거, overflow 정책

- **이중 카드 제거**: 현재 `mg-v2-ad-b0kla__card` 안에 `core-flow-pipeline`이 있고, B0KlA CSS에서 `.core-flow-pipeline`에도 카드형 배경/테두리/radius가 적용되어 있음. **옵션 A에서는 외곽 1개만 카드로 간주**한다.
  - **권장**: 지표 영역 전체를 감싸는 **하나의** `mg-v2-ad-b0kla__card`(또는 ContentCard)만 카드 스타일 적용. **`.core-flow-pipeline`에는 카드 배경/테두리/그림자를 적용하지 않는다.** (파이프라인은 카드 “내부 콘텐츠”로만 처리.)
  - 즉, `CoreFlowPipeline.css` 또는 `AdminDashboardB0KlA.css`에서 `.mg-v2-ad-b0kla__card .core-flow-pipeline`에 주었던 배경/테두리/radius/box-shadow는 **제거**하고, 파이프라인 컨테이너는 투명 배경·테두리 없음으로 둔다.
- **overflow 정책**:
  - **ContentCard(또는 `mg-v2-ad-b0kla__card`)**: `overflow: visible` 권장. 파이프라인 가로 스크롤이 카드 밖으로 살짝 나와도 되거나, 카드 내부에서 스크롤 영역이 잘리지 않도록 한다.
  - **파이프라인 전용 래퍼**: **스크롤은 `core-flow-pipeline__steps`에만** 둔다. 이 영역만 `overflow-x: auto`, `-webkit-overflow-scrolling: touch`, 필요 시 좌우 패딩으로 스크롤 시작/끝 여백 확보. 상위 `.core-flow-pipeline`은 `overflow: visible` 또는 `overflow: hidden`(스크롤 영역만 내부에서 처리할 경우) 중 정책 하나로 통일.

---

## 3. 반응형 — 데스크톱 / 태블릿 / 모바일

`RESPONSIVE_LAYOUT_SPEC.md` 브레이크포인트 준수.

### 3.1 데스크톱 (1280px 이상)

- **배치**: 5개 단계 카드 + 커넥터를 **한 줄 가로 배치**. `justify-content: center`로 중앙 정렬하여 좌우 여백 균형.
- **스크롤**: 가로 스크롤 없음(5카드+커넥터가 보통 한 화면에 들어옴). 필요 시 `overflow-x: auto` 유지하되 스크롤바는 필요할 때만 표시.
- **패딩**: `core-flow-pipeline__steps` 좌우 패딩 `var(--mg-spacing-lg)` 또는 24px. 상하 패딩 12~16px.

### 3.2 태블릿 (768px 이상 ~ 1280px 미만)

- **배치**: 동일하게 한 줄 가로. 공간 부족 시 **가로 스크롤** 활성화. `core-flow-pipeline__steps`에 `overflow-x: auto` 유지.
- **단계 카드 최소 너비**: 140px. gap 16px.
- **스크롤 영역**: 파이프라인 전용 래퍼(`core-flow-pipeline__steps`) 내부만 스크롤. 터치 스크롤 부드럽게 `-webkit-overflow-scrolling: touch`.

### 3.3 모바일 (375px ~ 768px 미만)

- **배치**: 한 줄 가로 유지, **가로 스크롤 필수**. 5단계가 한 화면에 다 안 들어오므로 스크롤로 노출.
- **단계 카드 최소 너비**: 140px. gap 12~16px.
- **스크롤 영역**: 동일하게 `core-flow-pipeline__steps`만 `overflow-x: auto`. 좌우 패딩 16px로 스크롤 시작/끝 여백 확보.
- **터치**: 최소 터치 영역 44px 권장(카드 전체가 클릭 영역이면 만족).

### 3.4 요약 표

| 브레이크포인트 | 단계 카드 배치 | 스크롤 영역 | steps 패딩 | 카드 min-width / gap |
|----------------|----------------|-------------|------------|----------------------|
| 데스크톱 1280px+ | 1행 가로, 중앙 정렬 | 필요 시만 auto | 12px 24px | 160px / 20px |
| 태블릿 768~1279px | 1행 가로 | overflow-x: auto | 12px 20px | 140px / 16px |
| 모바일 &lt;768px | 1행 가로 | overflow-x: auto | 12px 16px | 140px / 12~16px |

---

## 4. 레이아웃 수정 방향

### 4.1 ContentCard overflow

- **권장**: ContentCard(또는 `mg-v2-ad-b0kla__card`)는 **overflow: visible**. 파이프라인 스크롤은 내부 `core-flow-pipeline__steps`에서만 처리.
- **대안**: 카드가 스크롤 시 그림자/테두리가 잘리지 않게 하려면 카드에 `overflow: visible`을 유지하고, steps 래퍼만 `overflow-x: auto` + `min-height`로 높이 고정.

### 4.2 파이프라인 전용 래퍼 overflow

- **파이프라인 전용 래퍼**: `core-flow-pipeline__steps`만 **overflow-x: auto** 적용. 세로 overflow는 visible.
- **상위 `.core-flow-pipeline`**: `overflow: hidden` 또는 `visible` 중 하나로 통일. 스크롤바가 steps 영역 안에만 나오도록 하면 **hidden**이 유리.

### 4.3 padding 중첩 완화

- **원칙**: 섹션 블록 1개 = 카드 1개. 그 안에 파이프라인이 있으므로 **카드 패딩 1번만** 적용.
- **수치**:  
  - **외곽 카드**(`mg-v2-ad-b0kla__card`) 패딩: 데스크톱 24px, 태블릿 20px, 모바일 16px. (`RESPONSIVE_LAYOUT_SPEC.md` 섹션 패딩과 동일.)  
  - **파이프라인 steps** 내부 패딩: 카드와 동일하게 하지 말고, **steps 자체**에만 좌우 16~24px(브레이크포인트별), 상하 12px. 즉, 카드 패딩 24px + steps 추가 패딩으로 이중으로 들어가면 **steps 상하 패딩은 0**으로 두고, **카드 패딩만**으로 위아래 여백 확보해도 됨.  
- **규칙**: “카드 패딩”과 “steps 컨테이너 패딩”을 동시에 크게 주지 말고, **한 레이어에서만** 세로 패딩을 담당하도록 명시. 권장: 카드 24px(데스크톱) → steps는 좌우만 24px, 상하 0.

---

## 5. 로딩 / 에러 상태 UI 방향

### 5.1 stats 미로딩 (데이터 요청 중)

- **권장**: **스켈레톤** 표시. 숫자·배지 자리에 스켈레톤 플레이스홀더(회색 막대 또는 B0KlA 톤의 연한 회색 블록)를 두어 “로딩 중”임을 명확히 한다.
- **대안**: 0으로 표시하는 방식은 “데이터 없음”과 구분이 안 되므로 비권장. 반드시 0이 “진짜 0건”일 때만 0 표시.
- **적용 위치**: 각 PipelineStepCard의 배지 value/라벨 영역을 스켈레톤으로 대체. 아이콘·제목은 유지하거나 제목도 스켈레톤 처리 가능(팀 정책).

### 5.2 API 실패 (에러)

- **위치**: 파이프라인 **전체 영역 상단** 또는 **카드(ContentCard) 내부 상단**에 에러 메시지 1줄 표시. 5개 카드 각각에 “에러”를 넣지 않는다.
- **문구**: 예) “지표를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.” (또는 팀 공통 에러 문구)
- **스타일**: `var(--ad-b0kla-danger)` 또는 `var(--mg-error-500)` 텍스트, 12~14px. 아이콘(경고/에러 아이콘) 선택.
- **동작**: 에러 시 기존 5단계 카드는 **숫자만 0 또는 — 로 두거나**, 스켈레톤으로 유지한 채 상단에만 에러 문구 노출. 전체 파이프라인 비노출보다는 **구조는 유지 + 에러 문구**를 권장.

### 5.3 요약

| 상태 | UI 방향 |
|------|----------|
| 로딩 중 | 스켈레톤(배지/숫자 영역). 0 표시는 비권장. |
| API 실패 | 카드 상단 1줄 에러 문구. 카드 구조는 유지, 숫자는 0 또는 —. |
| 데이터 없음(성공 응답이지만 0건) | 숫자 0, 라벨은 그대로 표시. |

---

## 6. 접근성 보강 (방향만)

- **섹션**: `core-flow-pipeline`에 `aria-label="5단계 핵심 파이프라인"` 유지.
- **단계 카드**: 각 PipelineStepCard를 `<article>` 또는 버튼/링크로 감쌌을 때 `aria-label`에 단계명 + 건수 포함 (예: “내담자/상담사 매칭, 매칭됨 3건”).
- **커넥터**: `aria-hidden="true"` 유지.
- **제목 계층**: 파이프라인 섹션 제목이 있다면 `h2`, 단계 카드 제목은 `h3` 유지.

---

## 7. 참조 문서·토큰

| 문서/파일 | 용도 |
|-----------|------|
| `docs/design-system/PENCIL_DESIGN_GUIDE.md` | B0KlA 팔레트·레이아웃·체크리스트 |
| `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` | 브레이크포인트·패딩·그리드 |
| `docs/design-system/v2/ADMIN_DASHBOARD_METRICS_VISUALIZATION_SPEC.md` | 지표 옵션 A/B/C 개요 |
| `frontend/src/styles/unified-design-tokens.css` | `var(--mg-*)` |
| `frontend/src/styles/dashboard-tokens-extension.css` | `--ad-b0kla-*` |
| `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css` | `mg-v2-ad-b0kla__card` 등 |

---

**요약**: 옵션 A는 CoreFlowPipeline 5단계만 유지·개선한다. (1) 단계 카드 치수·간격·배지/아이콘 위치·variant별 토큰을 명시했고, (2) ContentCard는 이중 카드 제거 후 하나만 카드 스타일, overflow는 카드 visible·steps만 overflow-x auto, (3) padding 중첩 완화(카드 24px, steps 상하 0·좌우만), (4) 로딩은 스켈레톤·에러는 상단 1줄 문구로 방향을 정했다. 코드는 작성하지 않으며 스펙만 산출한다.
