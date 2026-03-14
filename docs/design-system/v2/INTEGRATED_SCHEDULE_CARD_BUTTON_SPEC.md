# 통합 스케줄링 센터 — 매칭 카드 액션 버튼 스펙

## 1. 개요 및 목적

- **대상 화면**: `/admin/integrated-schedule` (통합 스케줄링 센터) 좌측 **매칭 카드** 액션 버튼 영역.
- **목적**: 결제 확인·입금 확인·승인·스케줄 등록 버튼의 **컴포넌트·스타일 통일** 및 **카드 레이아웃 일관성** 확보. B0KlA·unified-design-tokens 준수.
- **산출물**: 코더가 추측 없이 구현할 수 있는 레이아웃·토큰·클래스·시각적 위계 명세. **코드 작성 없음.**

---

## 2. 디자인 기준

- **단일 소스**: `mindgarden-design-system.pen`, `pencil-new.pen`, `frontend/src/styles/unified-design-tokens.css`
- **참조**: 어드민 대시보드 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample
- **필수 문서**: `docs/design-system/PENCIL_DESIGN_GUIDE.md` 디자이너 숙지 체크리스트 적용

---

## 3. 현재 불일치 요약

| 버튼 | 현재 구현 | 비고 |
|------|-----------|------|
| 결제 확인 | plain `<button>` + `integrated-schedule__btn-action integrated-schedule__btn-action--payment` | 로딩 미지원 |
| 입금 확인 | plain `<button>` + `integrated-schedule__btn-action integrated-schedule__btn-action--deposit` | 로딩 미지원 |
| 승인 | **MGButton** (variant="success", size="small") + `integrated-schedule__btn-action integrated-schedule__btn-action--approve` | loading, preventDoubleClick 사용 |
| 스케줄 등록 | plain `<button>` + `integrated-schedule__btn-schedule` | 별도 클래스, 다른 스타일 |

**문제점**:
- 컴포넌트 혼재(plain button vs MGButton)
- 카드별 버튼 구성·개수 차이로 **카드 높이 불일치** (예: 106px vs 136px)
- 버튼 영역 시각적 일관성 부족

---

## 4. 액션 버튼 통일 스펙

### 4.1 권장 방향: 전부 MGButton 사용

**이유**:
- 디자인 시스템 일관성: 프로젝트 표준인 MGButton 사용
- 승인 버튼의 **loading** 상태를 그대로 활용 가능
- **preventDoubleClick** 등 공통 기능 일괄 적용
- 향후 결제/입금 확인도 비동기 처리 시 loading 지원 용이

### 4.2 MGButton 적용 매핑

| 버튼 | variant | size | loading | 기존 시맨틱 색상 유지 |
|------|---------|------|---------|------------------------|
| 결제 확인 | success | small | 없음 (필요 시 추가) | `var(--mg-success-600)` 계열 |
| 입금 확인 | primary | small | 없음 (필요 시 추가) | `var(--mg-color-primary-main)` 계열 |
| 승인 | success | small | **필수** | `var(--mg-success-600)` 계열 |
| 스케줄 등록 | primary | small | 없음 | `var(--mg-color-primary-main)` 계열 |

### 4.3 MGButton + 커스텀 클래스 병행

- MGButton에 **BEM 모디파이어**를 추가로 적용해 기존 시맨틱 색상 유지:
  - `integrated-schedule__btn-action integrated-schedule__btn-action--payment` (결제 확인)
  - `integrated-schedule__btn-action integrated-schedule__btn-action--deposit` (입금 확인)
  - `integrated-schedule__btn-action integrated-schedule__btn-action--approve` (승인)
  - `integrated-schedule__btn-schedule` (스케줄 등록)

- 또는 MGButton의 `variant`만으로 통일하고, CSS 모디파이어는 **override용**으로만 사용. (코더 판단)

### 4.4 대안: 전부 native button + 동일 CSS 클래스

**선택 시 고려사항**:
- 승인 버튼 **로딩 UI** 필요:  
  - 버튼 내부 `Loader` 스피너 표시  
  - `disabled` + `aria-busy="true"` + 텍스트 "승인 중..."  
  - 또는 버튼 오른쪽에 별도 로딩 인디케이터
- **권장하지 않음**: MGButton이 이미 loading·접근성·중복 클릭 방지를 제공하므로, 일관성을 위해 MGButton 사용이 유리함.

---

## 5. 카드 레이아웃 일관성

### 5.1 목표

상태별로 버튼 개수(1~2개)가 달라도 **카드 전체 높이·버튼 영역**이 일정하게 보이도록 한다.

### 5.2 레이아웃 규칙

| 규칙 | 값 | 설명 |
|------|-----|------|
| `.integrated-schedule__card-actions` | `min-height: 44px` | 버튼 영역 최소 높이 고정 |
| `.integrated-schedule__card-actions` | `display: flex; flex-wrap: wrap; align-items: center; gap: var(--mg-spacing-8)` | 버튼 정렬 및 간격 |
| `.integrated-schedule__card` | `display: flex; flex-direction: column; gap: var(--mg-spacing-12)` | 카드 내부 일관된 gap |
| 버튼 1개일 때 | `justify-content: flex-start` (또는 `space-between`으로 우측 정렬 가능) | 일관된 정렬 방향 유지 |

### 5.3 권장 수치

- **버튼 영역 min-height**: `44px` (터치·접근성 최소 높이 기준)
- **gap**: `var(--mg-spacing-8)` (8px) — `integrated-schedule__card-actions` 내부
- **카드 body ↔ actions gap**: `var(--mg-spacing-12)` (12px) — 기존 유지

### 5.4 선택적: 고정 높이

더 엄격한 일관성이 필요할 경우:
- `.integrated-schedule__card-actions`에 `height: 44px` (min-height 대신) 고정
- 버튼이 2개일 때만 wrap, 1개일 때는 동일한 높이 유지

---

## 6. 색상·타이포 (시각적 위계 유지)

### 6.1 기존 색상 유지

| 버튼 | 배경 토큰 | 텍스트 토큰 | hover 시 |
|------|-----------|-------------|----------|
| 결제 확인 | `var(--mg-success-600)` | `var(--mg-color-white)` | `var(--mg-success-700)` |
| 입금 확인 | `var(--mg-color-primary-main)` | `var(--mg-color-primary-inverse)` | `var(--mg-color-primary-dark)` |
| 승인 | `var(--mg-success-600)` | `var(--mg-color-white)` | `var(--mg-success-700)` |
| 스케줄 등록 | `var(--mg-color-primary-main)` | `var(--mg-color-primary-inverse)` | `var(--mg-color-primary-dark)` |

### 6.2 시각적 위계

- **Primary**: 입금 확인, 스케줄 등록 → 주조색 `var(--mg-color-primary-main)` (#3D5246)
- **Success**: 결제 확인, 승인 → 성공색 `var(--mg-success-600)` (#059669 계열)
- **Secondary**: 없음. 현재 구조에서는 primary/success 두 위계만 사용.

### 6.3 타이포그래피

- **폰트**: Noto Sans KR
- **크기**: `13px` (기존 유지)
- **굵기**: `font-weight: 600`
- **버튼 패딩**: `8px 12px` (기존 유지)
- **border-radius**: `var(--mg-radius-sm)` (8px)

---

## 7. 토큰·클래스 매핑 (B0KlA·unified-design-tokens)

### 7.1 버튼 공통

| 속성 | 토큰/값 |
|------|---------|
| padding | `8px 12px` |
| font-size | 13px |
| font-weight | 600 |
| border-radius | `var(--mg-radius-sm)` (8px) |
| gap (아이콘·텍스트) | 6px |

### 7.2 결제 확인 (btn-action--payment)

| 속성 | 토큰 |
|------|------|
| background | `var(--mg-success-600)` |
| color | `var(--mg-color-white)` |
| hover background | `var(--mg-success-700)` |

### 7.3 입금 확인 (btn-action--deposit)

| 속성 | 토큰 |
|------|------|
| background | `var(--mg-color-primary-main)` |
| color | `var(--mg-color-primary-inverse)` |
| hover background | `var(--mg-color-primary-dark)` |

### 7.4 승인 (btn-action--approve)

| 속성 | 토큰 |
|------|------|
| background | `var(--mg-success-600)` |
| color | `var(--mg-color-white)` |
| hover background | `var(--mg-success-700)` |

### 7.5 스케줄 등록 (btn-schedule)

| 속성 | 토큰 |
|------|------|
| background | `var(--mg-color-primary-main)` |
| color | `var(--mg-color-primary-inverse)` |
| hover background | `var(--mg-color-primary-dark)` |
| disabled | `var(--mg-color-border-main)`, `opacity: 0.6` |

### 7.6 카드 액션 영역 (card-actions)

| 속성 | 토큰/값 |
|------|---------|
| min-height | 44px |
| display | flex |
| flex-wrap | wrap |
| align-items | center |
| gap | `var(--mg-spacing-8)` |
| margin-top | `var(--mg-spacing-4)` |

---

## 8. 구현 시 체크리스트

- [ ] 결제 확인·입금 확인·승인·스케줄 등록을 **동일한 컴포넌트 패턴**으로 통일 (권장: 전부 MGButton)
- [ ] 승인 버튼: `loading`, `loadingText="승인 중..."`, `preventDoubleClick` 유지
- [ ] `.integrated-schedule__card-actions`에 `min-height: 44px`, `gap: var(--mg-spacing-8)` 적용
- [ ] 기존 색상 토큰(`--mg-success-600`, `--mg-color-primary-main` 등) 유지
- [ ] 모든 버튼 `size="small"`, 패딩 8px 12px, font-size 13px, border-radius 8px
- [ ] 스케줄 등록 disabled 시 `opacity: 0.6`, 배경 `var(--mg-color-border-main)` 유지
- [ ] `aria-label` 등 접근성 속성 유지

---

**문서 버전**: 1.0  
**작성일**: 2025-03-14  
**참조**: `docs/design-system/PENCIL_DESIGN_GUIDE.md`, `docs/design-system/v2/INTEGRATED_SCHEDULE_FILTER_UI_SPEC.md`  
**적용 화면**: `/admin/integrated-schedule` (통합 스케줄링 센터 좌측 매칭 카드)
