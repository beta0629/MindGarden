# 통합 스케줄 하드코딩 디버그 보고서

**대상**: `integrated-schedule` 관련 CSS/JS, `IntegratedMatchingSchedule.css`, `fc-event` / `integrated-schedule__card`  
**목적**: 하드코딩된 색상·수치 목록 정리 및 통합 디자인 토큰·B0KlA 토큰 매핑 권장  
**참조**: `INTEGRATED_SCHEDULE_LAYOUT_AND_CARD_SPEC.md`, `MG_BUTTON_B0KLA_ATOMIC_SPEC.md`, `docs/standards/`, `frontend/src/styles/dashboard-tokens-extension.css`, `responsive-layout-tokens.css`

---

## 1. 요약

- **색상 하드코딩**: `rgba(255,255,255,0.25)` 1건, `var(..., #hex)` fallback 다수(토큰 미정의 시 유효). 카드/버튼 관련 **리터럴 hex**는 fallback 내부에만 존재.
- **수치 하드코딩**: `px`/고정 수치 다수 — gap, padding, min-height, font-size, border-radius, width 등이 **디자인 토큰 없이** 직접 기입됨.
- **권장**: 색상은 `--mg-*` / `--ad-b0kla-*` / `--mg-color-*` 로 통일; 수치는 `--mg-spacing-*`, `--mg-radius-*`, `--mg-font-*`, 레이아웃 토큰(`--mg-layout-*`)으로 치환.

---

## 2. 하드코딩 목록 (파일별)

### 2.1 IntegratedMatchingSchedule.css

| 라인 | 현재 값 | 유형 | 비고 |
|------|---------|------|------|
| 196 | `rgba(255, 255, 255, 0.25)` | 색상 리터럴 | 선택된 필터 내 배지 배경 |
| 233–234 | `var(--mg-color-primary-main, #3D5246)`, `var(--mg-color-primary-inverse, #FAF9F7)` | fallback hex | 토큰 정의 여부 확인 필요 |
| 240–241 | `var(--mg-color-primary-dark, #2d3d34)`, `#FAF9F7` | fallback hex | 동일 |
| 296, 312 | `var(--mg-card-hover-shadow, 0 4px 12px rgba(0, 0, 0, 0.08))` | fallback rgba | 그림자 토큰 사용 권장, fallback은 유지 가능 |
| 21 | `24px` | font-size | `var(--mg-font-size-2xl)` 또는 `var(--mg-font-xxl)` |
| 31–34 | `10px`, `14px 26px`, `52px`, `16px` | gap, padding, min-height, font-size | `var(--mg-spacing-*)`, `var(--button-height-lg)` 등 |
| 54–55 | `2px` | outline | `var(--mg-border-width-normal)` 또는 2px 유지(접근성) |
| 68–69 | `320px` | width | `var(--mg-layout-sidebar-width)` 등 레이아웃 토큰 검토(현재 260px 정의됨 → 320 전용 토큰 추가 검토) |
| 74 | `16px` | border-radius | `var(--mg-radius-lg)` (12px)와 불일치 — 스펙 확인 후 `var(--ad-b0kla-radius-sm)` 등 |
| 84–85 | `8px`, `16px` | gap, font-size | `var(--mg-spacing-8)`(정의 여부 확인), `var(--mg-font-md)` |
| 94–97 | `4px`, `16px`, `2px` | width/height, border-radius | `var(--mg-spacing-4)`, `var(--mg-radius-xs)` 등 |
| 144–145 | `36px`, `13px` | min-height, font-size | `var(--mg-font-sm)` 등 |
| 163 | `0 0 0 2px ...` | box-shadow | 2px → `var(--mg-border-width-normal)` 검토 |
| 186–188 | `20px`, `2px 6px`, `11px` | min-width, padding, font-size | `var(--mg-font-xs)` 등 |
| 205–207 | `14px`, `8px`, `40px`, `14px` | padding, gap, min-height, font-size | spacing/타이포 토큰 |
| 271–277 | `140px`, `16px`, `12px`, `12px` | min-height, padding, gap, border-radius | min-height 140px는 스펙 고정 — 토큰화 시 `--mg-card-min-height-schedule` 등 |
| 321–322 | `16px` | border-radius | `var(--mg-radius-lg)` |
| 334 | `1024px` | 미디어 쿼리 | `var(--mg-breakpoint-lg)` |

### 2.2 integrated-schedule/atoms/StatusBadge.css

| 라인 | 현재 값 | 유형 | 비고 |
|------|---------|------|------|
| 6 | `12px` | font-size | `var(--mg-font-size-xs)` / `var(--mg-font-xs)` |
| 29–30 | `var(--mg-gray-100)`, `var(--mg-gray-600)` | 시맨틱 그레이 | 토큰 사용 중 — 유지. (미정의 시 확장 토큰에서 정의 확인) |

- **하드코딩**: `12px` font-size 1건 → 토큰 치환 권장.

### 2.3 integrated-schedule/atoms/RemainingSessionsBadge.css

| 라인 | 현재 값 | 유형 | 비고 |
|------|---------|------|------|
| 5–6 | `2px`, `6px`, `11px` | padding, font-size | `var(--mg-spacing-2)`, `var(--mg-spacing-6)`, `var(--mg-font-xs)` |
| 8 | `6px` | border-radius | `var(--mg-radius-sm)` (8px인 경우와 혼동 주의 — 스펙 6px이면 토큰 추가 검토) |

### 2.4 integrated-schedule/molecules/CardMeta.css

- **하드코딩**: 없음. `var(--mg-spacing-8, 8px)` 등 fallback만 사용.

### 2.5 integrated-schedule/molecules/CardActionGroup.css

| 라인 | 현재 값 | 유형 | 비고 |
|------|---------|------|------|
| 8 | `44px` | min-height | 터치 타겟 — `var(--touch-target-min)` (00-core: 44px) |
| 15–17 | `6px`, `8px 12px`, `13px` | gap, padding, font-size | `var(--mg-spacing-6)`, `var(--mg-spacing-8)` / `var(--mg-spacing-12)`, `var(--mg-font-sm)` |
| 23 | `8px` | border-radius | `var(--mg-radius-sm)` |
| 28 | `var(--mg-color-primary-dark, #2d3d34)` | fallback hex | B0KlA primary dark |
| 39, 65 | `0.6` | opacity | 유지 또는 `var(--mg-opacity-disabled)` 등 |
| 54–55 | `6px`, `8px 12px`, `13px` | 동일 | 위와 동일 토큰 |
| 60 | `8px` | border-radius | `var(--mg-radius-sm)` |
| 103–105 | `8px 12px`, `13px` | padding, font-size | 동일 |

### 2.6 integrated-schedule/molecules/MappingPartiesRow.css

| 라인 | 현재 값 | 유형 | 비고 |
|------|---------|------|------|
| 3 | `14px` | font-size | `var(--mg-font-size-sm)` / `var(--mg-font-sm)` |

### 2.7 integrated-schedule/organisms/MappingScheduleCard.css

| 라인 | 현재 값 | 유형 | 비고 |
|------|---------|------|------|
| 3 | `64px` | min-height | `var(--mg-spacing-3xl)`(64px) 또는 `--mg-card-body-min-height` 등 |

---

## 3. 통합 디자인 토큰·B0KlA 토큰 매핑 권장

### 3.1 색상

| 용도 | 현재 | 권장 토큰 | 비고 |
|------|------|-----------|------|
| 카드 호버 그림자 | `0 4px 12px rgba(0,0,0,0.08)` | `var(--mg-card-hover-shadow)` | unified-design-tokens에 정의됨 |
| 선택 필터 배지 배경(반투명 흰색) | `rgba(255,255,255,0.25)` | `var(--mg-overlay-light)` 또는 신규 `--mg-badge-on-primary-bg` | B0KlA 주조 위 배지용 |
| Primary 메인 | `#3D5246` | `var(--mg-color-primary-main)` | responsive-layout: `--mg-layout-sidebar-active-bg`와 동일값으로 정의 권장 |
| Primary dark (호버) | `#2d3d34` | `var(--mg-color-primary-dark)` | 동일 |
| Primary 위 텍스트 | `#FAF9F7` | `var(--mg-color-primary-inverse)` / `var(--mg-color-text-on-primary)` | B0KlA 스펙 |

- **추가 제안**: `dashboard-tokens-extension.css` 또는 `responsive-layout-tokens.css`에 아래가 없으면 추가.
  - `--mg-color-primary-main`: `#3D5246` (또는 `var(--mg-layout-sidebar-active-bg)`)
  - `--mg-color-primary-dark`: `#2d3d34`
  - `--mg-color-primary-inverse`: `#FAF9F7` (또는 `var(--mg-layout-header-bg)`)

### 3.2 간격·레이아웃 (px → 토큰)

| 현재 값 | 권장 토큰 | 정의 위치 참고 |
|---------|-----------|----------------|
| 4px | `var(--mg-spacing-4)` 또는 `var(--cs-spacing-xs)` | 4px = 0.25rem |
| 6px | `var(--mg-spacing-6)` (미정의 시 추가) 또는 0.375rem | |
| 8px | `var(--mg-spacing-8)` (미정의 시 추가) 또는 `var(--cs-spacing-sm)` | 8px = 0.5rem |
| 10px | `var(--mg-radius-md)` (버튼 radius) / spacing은 토큰 추가 | B0KlA 10px |
| 12px | `var(--mg-spacing-12)` 또는 `var(--mg-radius-lg)` (12px) | |
| 14px | `var(--mg-spacing-14)` (미정의 시) 또는 0.875rem | |
| 16px | `var(--mg-spacing-16)` 또는 `var(--cs-spacing-md)` | 16px = 1rem |
| 20px | `var(--mg-spacing-20)` (미정의 시) | |
| 24px | `var(--mg-spacing-24)` 또는 `var(--cs-spacing-lg)` | 24px = 1.5rem |
| 320px (사이드바) | `var(--mg-layout-integrated-sidebar-width)` (신규) | 현재 `--mg-layout-sidebar-width: 260px`와 별도 |
| 140px (카드 min-height) | `var(--mg-card-schedule-min-height)` (신규) | 스펙 고정값 |
| 44px (버튼 영역) | `var(--touch-target-min)` | 00-core _variables.css |
| 64px (카드 body) | `var(--mg-spacing-3xl)` 또는 4rem | |

### 3.3 타이포그래피

| 현재 값 | 권장 토큰 |
|---------|-----------|
| 11px | `var(--mg-font-size-xs)` 또는 `var(--mg-font-xs)` (12px일 수 있음 — 11px 유지 시 토큰 추가) |
| 12px | `var(--mg-font-xs)` |
| 13px | `var(--mg-font-sm)` (14px) 또는 `--mg-font-size-caption` 13px |
| 14px | `var(--mg-font-sm)` |
| 16px | `var(--mg-font-md)` / `var(--mg-font-size-base)` |
| 24px | `var(--mg-font-xxl)` / `var(--mg-font-size-2xl)` |

### 3.4 border-radius

| 현재 값 | 권장 토큰 |
|---------|-----------|
| 2px | `var(--mg-radius-xs)` (정의 시) 또는 2px 유지 |
| 6px | `var(--mg-radius-sm)` (8px와 다름 — 6px 스펙이면 토큰 추가) |
| 8px | `var(--mg-radius-sm)` |
| 10px | `var(--mg-radius-md)` (B0KlA 버튼 10px) |
| 12px | `var(--mg-radius-lg)` |
| 16px | `var(--mg-radius-xl)` |
| 9999px | `var(--mg-radius-full)` |

### 3.5 브레이크포인트

| 현재 값 | 권장 |
|---------|------|
| 1024px | `var(--mg-breakpoint-lg)` (mindgarden-design-system.css 등) |

---

## 4. 수정 방향 (core-coder 전달용)

1. **IntegratedMatchingSchedule.css**
   - 196: `rgba(255,255,255,0.25)` → `var(--mg-badge-on-primary-bg, rgba(255,255,255,0.25))` (토큰 추가 후 치환).
   - 233–241: fallback hex 유지하되, `:root`에 `--mg-color-primary-main`, `--mg-color-primary-dark`, `--mg-color-primary-inverse` 정의되어 있는지 확인 후 제거 또는 유지.
   - 296, 312: `var(--mg-card-hover-shadow)` 단독 사용(이미 정의됨).
   - 21, 31–34, 68–69, 74, 84–85, 94–97, 144–145, 186–188, 205–207, 271–277, 321–322, 334: 위 표 기준으로 `--mg-spacing-*`, `--mg-radius-*`, `--mg-font-*`, `--mg-layout-*`, `--touch-target-min` 등으로 치환.

2. **StatusBadge.css**
   - 6: `12px` → `var(--mg-font-xs)`.

3. **RemainingSessionsBadge.css**
   - 5–6, 8: padding/font-size/radius → `var(--mg-spacing-*)`, `var(--mg-font-xs)`, `var(--mg-radius-sm)` (6px 스펙이면 토큰 추가).

4. **CardActionGroup.css**
   - 8: `44px` → `var(--touch-target-min)`.
   - 15–17, 23, 54–55, 60, 103–105: gap/padding/font-size/radius → `var(--mg-spacing-*)`, `var(--mg-radius-sm)`, `var(--mg-font-sm)`.
   - 28: fallback `#2d3d34` → 토큰 정의 확인 후 제거 가능.

5. **MappingPartiesRow.css**
   - 3: `14px` → `var(--mg-font-sm)`.

6. **MappingScheduleCard.css**
   - 3: `64px` → `var(--mg-spacing-3xl)` 또는 전용 토큰.

7. **숫자 스케일 토큰**
   - `--mg-spacing-4`, `--mg-spacing-6`, `--mg-spacing-8`, `--mg-spacing-10`, `--mg-spacing-12`, `--mg-spacing-14`, `--mg-spacing-16`, `--mg-spacing-20`, `--mg-spacing-24` 등이 없으면 `dashboard-tokens-extension.css` 또는 `responsive-layout-tokens.css`에 추가 후 위 치환에 사용.

---

## 5. 체크리스트 (수정 후 확인)

- [ ] `/admin/integrated-schedule`에서 카드·필터·버튼 색상이 B0KlA/디자인 시스템과 동일하게 보이는지 확인.
- [ ] 필터 선택 시 배지 배경(반투명 흰색)이 정상 표시되는지 확인.
- [ ] 카드 hover 시 그림자가 `var(--mg-card-hover-shadow)`와 동일한지 확인.
- [ ] 1024px 미만에서 사이드바 숨김 동작이 `var(--mg-breakpoint-lg)`와 일치하는지 확인.
- [ ] StatusBadge / RemainingSessionsBadge / CardActionGroup 글자 크기·패딩이 다른 화면과 일관되는지 확인.
- [ ] JS 파일에는 인라인 스타일·색상/px 리터럴 없음 확인(현재 integrated-schedule/*.js에는 없음).

---

## 6. 참고 — 사용 중인 토큰 (정의 확인용)

- `--mg-color-background-main`, `--mg-color-surface-main`, `--mg-color-border-main`, `--mg-color-text-main`, `--mg-color-text-secondary`
- `--mg-color-primary-main`, `--mg-color-primary-dark`, `--mg-color-primary-inverse`
- `--mg-bg-card`, `--mg-shadow-sm`, `--mg-card-hover-shadow`
- `--mg-spacing-24`, `--mg-spacing-16`, `--mg-spacing-12`, `--mg-spacing-8`, `--mg-spacing-6`, `--mg-spacing-4`, `--mg-spacing-2` (숫자 스케일은 프로젝트 전역 정의 여부 확인)
- `--mg-radius-md`, `--mg-radius-sm`, `--mg-radius-lg`, `--mg-radius-full`
- `--ad-b0kla-green`, `--mg-color-white`
- `--touch-target-min` (44px, 00-core _variables.css)

위 토큰이 `unified-design-tokens.css`, `dashboard-tokens-extension.css`, `responsive-layout-tokens.css` 등에 정의되어 있으면 fallback 제거 또는 유지만 결정하면 됨.
