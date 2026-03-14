# 통합 스케줄 사이드바 카드 버튼·배지 통일 기획

**작성일**: 2025-03-14  
**목적**: 통합 스케줄 사이드바 카드의 버튼(입금 확인, 결제 확인, 스케줄 등록 등)과 배지(상태배지, 회기배지)를 디자인 시스템에 맞게 통일  
**참조**: `INTEGRATED_SCHEDULE_CARD_FINAL_SPEC.md`, `CARD_VISUAL_UNIFIED_SPEC.md`, `DEPOSIT_MODAL_AND_BUTTON_SPEC.md`, `core-solution-design-system-css` 스킬

---

## 1. 아이콘 제거 범위

### 1.1 대상: CardActionGroup 전체

| 버튼 | 현재 Lucide 아이콘 | 제거 여부 |
|------|-------------------|----------|
| 결제 확인 | `CreditCard` (size=14) | 제거 |
| 입금 확인 | `DollarSign` (size=14) | 제거 |
| 승인 | `CheckCircle` (size=14) | 제거 |
| 스케줄 등록 | `CalendarPlus` (size=14) | 제거 |

**적용 대상 파일**: `frontend/src/components/admin/mapping-management/integrated-schedule/molecules/CardActionGroup.js`

### 1.2 작업 내용

- `lucide-react` import 제거: `CalendarPlus`, `CreditCard`, `DollarSign`, `CheckCircle`
- 각 MGButton의 children에서 아이콘 JSX 제거 → **텍스트만** 노출
- `aria-label` 유지 (접근성)

### 1.3 결과 형태 예시

```jsx
// Before
<MGButton variant="success" size="small" ...>
  <CreditCard size={14} />
  결제 확인
</MGButton>

// After
<MGButton variant="success" size="small" ...>
  결제 확인
</MGButton>
```

---

## 2. 버튼 스타일 통일 기준

### 2.1 MGButton variant/size 매핑

| 버튼 | variant | size | 비고 |
|------|---------|------|------|
| 결제 확인 | `success` | `small` | PENDING_PAYMENT 상태에서 표시 |
| 입금 확인 | `primary` | `small` | PAYMENT_CONFIRMED 상태에서 표시 |
| 승인 | `success` | `small` | DEPOSIT_PENDING 상태에서 표시 |
| 스케줄 등록 | `primary` | `small` | 항상 표시, disabled 조건부 |

### 2.2 기준

- **컴포넌트**: `MGButton` 사용 유지
- **스타일 소스**: MGButton의 `mg-button`, `mg-button--${variant}`, `mg-button--${size}` 클래스
- **아이콘**: 없음 (깔끔한 텍스트 버튼)
- **추가 클래스**: `integrated-schedule__btn-action`, `integrated-schedule__btn-schedule` (레이아웃·간격용)

### 2.3 CardActionGroup.css 조정

- 버튼 컨테이너 `.integrated-schedule__card-actions`: gap, flex 유지
- `--btn-action`, `--btn-schedule` 등 MGButton variant에 맞는 배경/색상 오버라이드는 MGButton 기본 스타일과 충돌하지 않도록 검토
- **권장**: MGButton variant/size만 사용하고, 중복 스타일 제거. 필요 시 `06-components/_buttons.css` 또는 통합 토큰과 일치시키기

---

## 3. 배지 스타일 통일 기준 (Design Tokens)

### 3.1 StatusBadge (`integrated-schedule__card-status`)

| 상태 클래스 | 배경 토큰 | 텍스트 토큰 | 비고 |
|-------------|----------|------------|------|
| `--active`, `--payment_confirmed`, `--deposit_pending` | `var(--mg-success-100)` | `var(--mg-success-700)` | 활성·진행 중 |
| `--pending_payment` | `var(--mg-warning-100)` | `var(--mg-warning-700)` | 결제 대기 |
| `--inactive`, `--terminated`, `--sessions_exhausted`, `--suspended` | `var(--mg-gray-100)` | `var(--mg-gray-600)` | 비활성·종료 |
| 기본 | `var(--mg-color-surface-sub, var(--mg-gray-100))` | `var(--mg-color-text-main, var(--mg-gray-700))` | — |

**통일 기준**: 디자인 토큰 우선 사용. fallback(`var(--mg-success-50)` 등)은 프로젝트에 정의된 토큰 목록과 일치시키기.

### 3.2 RemainingSessionsBadge (`integrated-schedule__card-remaining-badge`)

| 항목 | 토큰 |
|------|------|
| 배경 | `var(--mg-primary-100, var(--mg-primary-50))` |
| 텍스트 | `var(--mg-primary-700, var(--mg-primary-600))` |
| padding | `var(--mg-spacing-2) var(--mg-spacing-6)` |
| font-size | `var(--mg-font-xs)` |
| font-weight | 500 |
| border-radius | `var(--mg-radius-sm)` |

**통일 기준**: `mg-color-primary-*`, `mg-primary-*` 등 프로젝트 통일 토큰 명명 규칙에 맞게 정리. B0KlA·어드민 카드 배지와 시각 일관성 유지.

### 3.3 공통 배지 레이아웃

| 속성 | 값 |
|------|-----|
| display | `inline-flex` |
| align-items | `center` |
| border-radius | pill: `var(--mg-radius-full)` / box: `var(--mg-radius-sm)` |

- StatusBadge: pill 형태(`border-radius: var(--mg-radius-full)`)
- RemainingSessionsBadge: box 형태(`border-radius: var(--mg-radius-sm)`)

---

## 4. 수정 대상 파일 목록

| # | 파일 경로 | 작업 내용 |
|---|-----------|----------|
| 1 | `frontend/src/components/admin/mapping-management/integrated-schedule/molecules/CardActionGroup.js` | Lucide 아이콘 4개 제거, import 정리 |
| 2 | `frontend/src/components/admin/mapping-management/integrated-schedule/molecules/CardActionGroup.css` | MGButton 기본 스타일과 중복 제거, 필요 시 정리 |
| 3 | `frontend/src/components/admin/mapping-management/integrated-schedule/atoms/StatusBadge.css` | design tokens 일관성 점검, fallback 정리 |
| 4 | `frontend/src/components/admin/mapping-management/integrated-schedule/atoms/RemainingSessionsBadge.css` | design tokens 일관성 점검, 토큰 명명 통일 |

**변경 없음 (구조·로직 유지)**  
- `StatusBadge.js`, `RemainingSessionsBadge.js`: 컴포넌트 구조 및 props 유지, 스타일만 CSS에서 통일

---

## 5. 실행 분배 (서브에이전트)

| Phase | 담당 | 전달 프롬프트 요약 |
|-------|------|-------------------|
| **1** | core-coder | CardActionGroup.js: Lucide import 및 4개 버튼 내 아이콘 JSX 제거. 텍스트만 표시. MGButton variant/size 유지. |
| **2** | core-coder | CardActionGroup.css: MGButton variant와 중복되는 배경/색상 오버라이드 검토·정리. card-actions 레이아웃 유지. |
| **3** | core-coder | StatusBadge.css, RemainingSessionsBadge.css: design tokens 기준으로 일관성 점검, fallback·토큰 명명 정리. |

**병렬 가능**: Phase 1만 선행 후, Phase 2·3은 동시 진행 가능.

---

## 6. 완료 기준·체크리스트

### 아이콘 제거
- [ ] CardActionGroup.js에서 `lucide-react` import 제거
- [ ] 결제 확인·입금 확인·승인·스케줄 등록 버튼에 아이콘 없이 텍스트만 표시
- [ ] `aria-label` 유지

### 버튼 스타일
- [ ] MGButton `variant`, `size`로 스타일 통일 (success/primary, small)
- [ ] CardActionGroup.css 중복 스타일 정리

### 배지 스타일
- [ ] StatusBadge: design tokens 일관 적용
- [ ] RemainingSessionsBadge: design tokens 일관 적용
- [ ] 다른 카드(MappingListSection, ClientMappingTab 등)의 배지와 시각 일관성

---

**문서 버전**: 1.0
