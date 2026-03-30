# 어드민 대시보드 V2 시각화 그룹 레이아웃 스펙

**대상**: AdminDashboardV2 — 상담 현황 추이 / 예약 vs 완료 / 단계별 현황 3개 차트 카드  
**목적**: 3개 시각화를 **한 그룹**으로 묶어 B0KlA 스타일을 적용하고, 레이아웃·사이즈를 조절해 한 화면에 더 컴팩트하게 노출  
**기준**: `PENCIL_DESIGN_GUIDE.md`, 어드민 대시보드 샘플, `unified-design-tokens.css`  
**코드 수정**: 없음 — 스펙·수치만 문서화

---

## 1. 현재 구조 (참조)

| 영역 | 클래스 | 구성 |
|------|--------|------|
| Row | `.mg-v2-content-growth-row` | grid `2fr 1fr` |
| 왼쪽 | `.mg-v2-content-growth-row__left` | flex column, gap 1.5rem, 카드 3개 **세로 배치** |
| 카드1 | — | 상담 현황 추이 (막대 차트, height 200px) |
| 카드2 | — | 예약 vs 완료 (라인 차트, height 200px) |
| 카드3 | — | 단계별 현황 (도넛, height 200px) |
| 오른쪽 | — | 우수 상담사 평점 카드 |

**문제**: 3개 카드가 세로로 길게 쌓여 그룹 전체 높이가 과도하게 커짐.

---

## 2. 시각화 그룹 래퍼 (B0KlA 스타일)

### 2.1 그룹 컨테이너

- **역할**: "상담 현황 추이", "예약 vs 완료", "단계별 현황" 3개 차트만을 감싸는 **단일 섹션 블록**.
- **제안 클래스명**: `.mg-v2-content-visualization-group` (또는 `mg-v2-ad-b0kla__visualization-group`).
- **위치**: 기존 `.mg-v2-content-growth-row__left` **내부** 최상위 래퍼. 즉 `growth-row__left` → **visualization-group** → 그 안에 3개 차트 카드.

### 2.2 섹션 제목 (B0KlA)

- **표시 텍스트**: "시각화" 또는 "차트" (팀 합의 후 확정).
- **스타일** (PENCIL_DESIGN_GUIDE 2.3 섹션 블록):
  - **좌측 세로 악센트 바**: 폭 4px, `var(--mg-color-primary-main)` (#3D5246), border-radius 2px.
  - **제목 텍스트**: 16px, fontWeight 600, `var(--mg-color-text-main)` (#2C2C2C).
  - **제목–악센트 정렬**: 제목과 악센트 바를 한 줄에 배치, 악센트 왼쪽, 제목 오른쪽(간격 8~12px).
- **토큰**: `var(--mg-color-primary-main)`, `var(--mg-color-text-main)`.

### 2.3 그룹 블록 스타일 (섹션 블록과 동일)

- **배경**: `var(--mg-color-surface-main)` (#F5F3EF).
- **테두리**: 1px `var(--mg-color-border-main)` (#D4CFC8).
- **border-radius**: 16px (또는 `var(--ad-b0kla-radius)`).
- **패딩**: 24px (데스크톱). 토큰 `var(--mg-spacing-lg)` 또는 24px.
- **내부 gap**: 그룹 제목과 카드 그리드 사이 16px; 그리드 내부 갭은 아래 3절.

---

## 3. 레이아웃 제안 (3개 카드 배치)

### 3.1 권장: 2+1 그리드 (상단 2열, 하단 1열)

- **1행**: 2열 — **상담 현황 추이** | **예약 vs 완료** (동일 비율).
- **2행**: 1열 — **단계별 현황** (전체 너비).

| 항목 | 값 |
|------|-----|
| **그리드** | `grid-template-columns: 1fr 1fr`; `grid-template-rows: auto auto` |
| **열 갭** | 1rem ~ 1.25rem (`var(--mg-spacing-md)` ~ `var(--mg-spacing-lg)`) |
| **행 갭** | 1rem ~ 1.25rem (동일) |
| **카드 최대 높이** | 행당 1개일 때(2행): 상단 셀 max-height 200px, 하단 셀 max-height 200px (또는 하단만 200px, 상단 180px로 축소 가능). 전체 그룹 높이 제한 목표: 약 420~460px 이하(패딩·제목·갭 포함). |

**장점**: 추이·예약vs완료를 나란히 비교하기 좋고, 도넛은 하단에서 넓게 표시.

### 3.2 대안: 3열 동등

- **1행**: 3열 — 상담 현황 추이 | 예약 vs 완료 | 단계별 현황.

| 항목 | 값 |
|------|-----|
| **그리드** | `grid-template-columns: 1fr 1fr 1fr` |
| **갭** | 1rem |
| **카드 높이** | 동일 높이 160~180px 권장 (도넛이 좁아지므로 180px 이상 유지). |

**장점**: 한 줄에 모두 노출. **단점**: 도넛이 좁은 열에 들어가 레이블 겹침 가능성 있음.

### 3.3 반응형

- **데스크톱 (1280px 이상)**: 위 2+1 또는 3열 적용.
- **태블릿 (768px ~ 1279px)**: 2+1일 때 2열 유지 또는 1열로 스택(2행 + 1행). 3열일 때 2열 + 1열 또는 1열 스택.
- **모바일 (375px ~ 767px)**: 1열 스택, 갭 12px, 패딩 16px. 카드 높이 160~180px 유지.

---

## 4. 차트·카드 크기

### 4.1 차트 영역 높이

| 차트 | 현재 | 제안 (2+1 레이아웃) |
|------|------|---------------------|
| 상담 현황 추이 (막대) | 200px | **180px** (동일 유지 시 200px) |
| 예약 vs 완료 (라인) | 200px | **180px** |
| 단계별 현황 (도넛) | 200px | **180px** (min-height 160px 이상 권장) |

- **목표**: 그룹 전체 높이가 과도하게 커지지 않도록 180px로 통일 권장. 가독성 우선이면 200px 유지 가능.
- **도넛 wrapper**: 현재 `.mg-v2-ad-b0kla__chart-wrapper--donut` min-height 220px → 그룹 내부에서는 **180px** 또는 **200px**로 제한 권장 (그룹 내부 한정).

### 4.2 카드 패딩·min-height

| 항목 | 값 |
|------|-----|
| **카드 패딩** | 16px ~ 20px (`var(--mg-spacing-md)` ~ `var(--mg-spacing-lg)`). 24px도 가능하나 컴팩트하게 16~20px 권장. |
| **카드 min-height** | 지정하지 않거나 160px. 차트 높이(180px) + 제목·토글 등으로 자연스럽게 결정. |
| **카드 스타일** | 기존 B0KlA 카드: 배경 `var(--mg-color-surface-main)` 또는 `var(--ad-b0kla-card-bg)`, 테두리 1px `var(--mg-color-border-main)`, radius 16px. |

### 4.3 그룹 전체 높이 목표 (참고)

- **2+1 레이아웃, 차트 180px 기준**:  
  제목(~24px) + 갭(16px) + 1행(180px + 카드 여백) + 갭(16px) + 2행(180px + 카드 여백) + 그룹 패딩(24*2) → **약 440~480px** 수준 권장.

---

## 5. 토큰·클래스 정리 (코더 전달용)

| 용도 | 토큰 또는 클래스 |
|------|------------------|
| 그룹 래퍼 | `.mg-v2-content-visualization-group` (신규) |
| 그룹 제목 영역 | 좌측 악센트 4px `var(--mg-color-primary-main)` + 제목 16px 600 `var(--mg-color-text-main)` |
| 그룹 배경·테두리 | `var(--mg-color-surface-main)`, `var(--mg-color-border-main)`, radius 16px |
| 그룹 패딩·갭 | `var(--mg-spacing-lg)`(24px), 내부 갭 `var(--mg-spacing-md)`(16px) 또는 1rem |
| 차트 카드 | 기존 차트 카드 클래스 유지, 높이만 180px 또는 200px로 제한 |
| 도넛 래퍼(그룹 내) | min-height 180px 또는 200px (그룹 내 한정) |

---

## 6. 구조 요약 (변경 후)

```
.mg-v2-content-growth-row (grid 2fr 1fr 유지)
├── .mg-v2-content-growth-row__left
│   └── .mg-v2-content-visualization-group  ← 신규 래퍼
│       ├── [섹션 제목: 악센트 바 + "시각화"]
│       └── [그리드: 2+1 또는 3열]
│           ├── 카드1: 상담 현황 추이 (height 180px)
│           ├── 카드2: 예약 vs 완료 (height 180px)
│           └── 카드3: 단계별 현황 (height 180px)
└── [우측: 우수 상담사 평점 카드]
```

---

## 6-1. 마크업 권장 (아토믹·BEM·접근성)

코드 수정 없이 퍼블리셔·코더 전달용 **마크업 순서·클래스명·접근성** 제안.

### 마크업 순서

```
.mg-v2-content-growth-row__left
└── .mg-v2-content-visualization-group   ← 그룹 래퍼 (section)
    ├── .mg-v2-content-visualization-group__header   ← 제목 블록
    │   ├── .mg-v2-content-visualization-group__accent   ← 좌측 악센트 바 (장식)
    │   └── h2.mg-v2-content-visualization-group__title   ← 섹션 제목 ("시각화" 등)
    └── .mg-v2-content-visualization-group__grid   ← 그리드 컨테이너 (2+1)
        ├── .mg-v2-ad-b0kla__card   ← 카드1: 상담 현황 추이
        ├── .mg-v2-ad-b0kla__card   ← 카드2: 예약 vs 완료
        └── .mg-v2-ad-b0kla__card   ← 카드3: 단계별 현황
```

### 클래스명 정리 (BEM)

| 역할 | 클래스명 | 비고 |
|------|----------|------|
| 그룹 래퍼 | `.mg-v2-content-visualization-group` | 블록. `section` 권장 |
| 제목 블록 | `.mg-v2-content-visualization-group__header` | 악센트 + 제목 한 줄 |
| 좌측 악센트 | `.mg-v2-content-visualization-group__accent` | 4px 세로 바, 장식용 |
| 섹션 제목 | `.mg-v2-content-visualization-group__title` | `h2` 권장, id 부여 시 `aria-labelledby` 연동 |
| 그리드 컨테이너 | `.mg-v2-content-visualization-group__grid` | 2+1 시 `grid-template-columns: 1fr 1fr`, gap 1rem~1.25rem |
| 카드 | `.mg-v2-ad-b0kla__card` | 기존 유지, 차트 height 180px 권장 |

### 접근성 권장

- **섹션 레이블**: 그룹 제목을 스크린리더에 노출하려면 둘 중 하나 적용.
  - **권장 A**: `<section class="mg-v2-content-visualization-group" aria-labelledby="admin-viz-group-title">` + 제목에 `id="admin-viz-group-title"` 부여.
  - **권장 B**: `<section class="mg-v2-content-visualization-group" aria-label="시각화: 상담 현황 추이, 예약 대비 완료, 단계별 현황">` (제목과 중복되지 않게 팀 합의 후 선택).
- **악센트 바**: 시각적 장식이므로 `aria-hidden="true"` 권장.
- **그리드**: 역할 부여 불필요. 카드 내부 제목·차트는 기존 시맨틱·aria 유지.

### HTML 조각 예시 (참고용, 로직 없음)

```html
<section class="mg-v2-content-visualization-group" aria-labelledby="admin-viz-group-title">
  <div class="mg-v2-content-visualization-group__header">
    <span class="mg-v2-content-visualization-group__accent" aria-hidden="true"></span>
    <h2 id="admin-viz-group-title" class="mg-v2-content-visualization-group__title">시각화</h2>
  </div>
  <div class="mg-v2-content-visualization-group__grid">
    <div class="mg-v2-ad-b0kla__card"><!-- 상담 현황 추이 --></div>
    <div class="mg-v2-ad-b0kla__card"><!-- 예약 vs 완료 --></div>
    <div class="mg-v2-ad-b0kla__card"><!-- 단계별 현황 --></div>
  </div>
</section>
```

- **레이아웃**: `__grid`에 CSS Grid 적용 (2+1 시 `grid-template-columns: 1fr 1fr`, `grid-template-rows: auto auto`, gap `1rem`~`1.25rem`). 차트 영역 height 180px 권장은 본 스펙 4절 참조.

---

## 7. 체크리스트

- [ ] 시각화 그룹 래퍼에 섹션 제목("시각화" 또는 "차트") + 좌측 악센트 바(B0KlA) 적용.
- [ ] 3개 차트만 그룹 내부에 두고, 우측 상담사 카드는 기존대로 growth-row 오른쪽 유지.
- [ ] 레이아웃: 2+1 그리드(상단 2열, 하단 1열) 또는 3열 중 선택 적용.
- [ ] 차트 높이 180px 권장, 카드 패딩 16~20px로 컴팩트화.
- [ ] 그룹 전체 높이 440~480px 수준으로 제한 목표.
- [ ] 반응형: 태블릿/모바일에서 1열 스택, 갭·패딩 축소.
- [ ] 토큰·클래스명 스펙에 명시해 코더가 추측 없이 구현 가능하도록 함.
- [ ] 마크업: `__header`(제목 블록), `__grid`(그리드 컨테이너) 적용; 섹션에 `aria-labelledby` 또는 `aria-label` 적용(6-1절 참조).

---

**문서 끝.**  
구현 시 `docs/design-system/PENCIL_DESIGN_GUIDE.md`, `unified-design-tokens.css`, 기존 `ContentArea.css`·`AdminDashboardB0KlA.css`와 함께 참조.
