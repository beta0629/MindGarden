# 어드민 모달 이메일 행 — 현재 vs 목표 UI 및 목표 비주얼·레이아웃 스펙

**역할**: core-designer (UI/UX·레이아웃·비주얼 스펙만, 코드 작성 없음)  
**대상**: 어드민 모달 내 이메일 폼 행 (`div.mg-v2-form-email-row`)  
**목적**: 깨진 상태(버튼 미비주얼)를 정리하고, **현재 vs 목표** 및 **목표 비주얼·레이아웃**을 단일 스펙으로 정의  
**참조**: 어드민 대시보드 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample, PENCIL_DESIGN_GUIDE.md, B0KlA·unified-design-tokens, ADMIN_MODAL_EMAIL_ROW_LAYOUT_SPEC.md, CLIENT_MODAL_EMAIL_BUTTON_SPEC.md

---

## 1. 현재 화면 vs 목표 UI 정리

### 1.1 현재 상태 (깨진 UI)

| 구역 | 현재 비주얼 | 원인·비고 |
|------|-------------|-----------|
| **왼쪽** | "이메일 *" 라벨 + 입력란("agisunny@daum.net") 정상 노출 | 라벨·input은 의도대로 동작 |
| **오른쪽** | **빈 입력란처럼 보이는 큰 흰색 박스**(회색 테두리) 안에 "중복확인" 텍스트만 있음 | input/button 노드 없이 텍스트만 있거나, 버튼이 버튼 스타일 없이 렌더됨 |
| **전체** | `div.mg-v2-form-email-row` 안에 input/button이 시맨틱·스타일적으로 구분되지 않음 | 버튼이 **버튼처럼 보이지 않음**(테두리·배경·패딩·호버 등 미적용) |

**증거 요약**: `div.mg-v2-form-email-row` 안에 input/button 노드 없이 "중복확인" 텍스트만 있음. 오른쪽은 빈 입력란처럼 보이는 큰 흰색 박스(회색 테두리) + "중복확인" 텍스트만 있어, **버튼으로 인지되지 않음**.

### 1.2 목표 상태

| 구역 | 목표 비주얼 |
|------|-------------|
| **왼쪽** | "이메일 *" 라벨(폼 그룹 상단) + **이메일 입력 필드**(한 줄, 최소 너비 보장, B0KlA 입력 스타일) |
| **오른쪽** | **명확한 버튼**으로 보이는 "중복확인" 버튼(테두리·배경 또는 아웃라인·패딩·호버 피드백, B0KlA secondary/compact) |
| **전체** | 라벨 / 입력 / 버튼이 **역할별로 시각적으로 구분**되고, **한 줄(또는 반응 시 명확한 줄바꿈)** 레이아웃 유지 |

**목표 한 줄**: 이메일 입력란 + **명확한 버튼**으로 보이는 "중복확인" 버튼.

---

## 2. 이메일 행 목표 비주얼·레이아웃 스펙

### 2.1 구조·배치 (한 줄, 좌→우)

- **폼 그룹**: `mg-v2-form-group` — 이메일 필드 전체 래퍼.
- **1행**: 라벨 `mg-v2-form-label` — "이메일 *", 폼 그룹 **상단 한 줄** (이메일 행과 별도 줄).
- **2행**: `mg-v2-form-email-row` — **한 줄**: [입력 래퍼] + [중복확인 버튼], 좌→우.
  - **입력 래퍼**: `mg-v2-form-email-row__input-wrap` — flex로 남는 공간 차지, **최소 너비 보장**(0 수축 금지).
  - **입력 필드**: `mg-v2-form-input` — 래퍼 안에서 100% 너비.
  - **버튼**: `mg-v2-button` + modifier — "중복확인", flex 수축 없음, **버튼으로 명확히 보이도록** 스타일 필수.

라벨 | 입력 | 버튼을 한 줄에 두는 방식은 **사용하지 않음**. 라벨은 상단, 이메일 행은 "입력 + 버튼"만 포함.

### 2.2 버튼이 버튼처럼 보이게 할 시각 요구

B0KlA·unified-design-tokens·어드민 대시보드 샘플 기준으로, "중복확인"이 **클릭 가능한 버튼**으로 인지되도록 아래를 만족한다.

| 속성 | 목표 값 | 토큰·클래스 (구현 시) |
|------|---------|------------------------|
| **배경** | 아웃라인 스타일 시: 투명; 주조 스타일 시: 주조색 | `var(--mg-color-primary-main)` (주조) 또는 배경 transparent (아웃라인) |
| **테두리** | 2px 실선, 보조/테두리 색 | `var(--mg-color-border-main)` 또는 `var(--mg-color-text-secondary)` |
| **텍스트 색** | 본문 또는 보조 텍스트 | `var(--mg-color-text-main)` 또는 `var(--mg-color-text-secondary)` |
| **패딩** | 상하 4–6px, 좌우 8–12px (compact) | `var(--mg-spacing-xs)` ~ `var(--mg-spacing-sm)` (4px, 8px) 또는 6px 12px |
| **높이** | input(40px) 대비 약 0.7 권장 | min-height 28px (compact) 또는 32px |
| **border-radius** | 8px (compact) | B0KlA·PENCIL: 10px 대비 작은 버튼은 8px |
| **호버** | 배경 또는 테두리 강조로 클릭 가능성 전달 | 예: 배경 `var(--mg-color-surface-main)` 또는 테두리/배경 살짝 진하게 |
| **포커스** | 포커스 링/아웃라인으로 접근성 유지 | 기존 B0KlA 포커스 스타일 유지 |

**클래스 조합 (권장)**: `mg-v2-button mg-v2-button-secondary mg-v2-button--compact` (CLIENT_MODAL_EMAIL_BUTTON_SPEC.md §3, §6과 동일).  
**선택자 강화**: `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-group .mg-v2-form-email-row .mg-v2-button.mg-v2-button--compact` 또는 `[data-action="email-duplicate-check"]`로 이 행의 버튼만 타깃.

**금지**: 버튼을 div/span만으로 감싸서 텍스트만 넣고, 버튼용 클래스·스타일을 적용하지 않음. 반드시 **`<button>` + `mg-v2-button` 계열 클래스**로 렌더되어 **테두리·배경·패딩·호버**가 적용된 상태가 목표.

### 2.3 입력 영역 (래퍼·input)

| 속성 | 목표 값 | 토큰 (구현 시) |
|------|---------|----------------|
| **입력 래퍼 min-width** | 12rem (192px) | `var(--mg-form-email-input-min-width, 12rem)` 또는 `var(--ad-b0kla-form-email-row-input-min-width, 12rem)` |
| **입력 래퍼 flex** | 1 1 0% (또는 1 1 auto) | min-width로 0 수축 방지 필수 |
| **행 gap** (입력 ↔ 버튼) | 12px | `var(--mg-spacing-md)` 또는 12px |
| **행 정렬** | align-items: center | 입력란과 버튼 세로 중앙 |

**금지**: `__input-wrap` 또는 `.mg-v2-form-email-row`에 `min-width: 0`, `.u-min-w-0` 적용 금지 (ADMIN_MODAL_EMAIL_ROW_LAYOUT_SPEC.md §3.1, CLIENT_MODAL_EMAIL_ROW_LAYOUT_SPEC.md §3.2).

### 2.4 반응형·줄바꿈

| 상황 | 동작 |
|------|------|
| **데스크톱·태블릿** | 한 줄 유지: [입력 래퍼] + [중복확인 버튼]. 모달 최소 너비(예: 720px) 내에서 12rem + 버튼 + gap 확보. |
| **좁은 뷰포트** | (선택) 행 단위 줄바꿈: `flex-wrap: wrap`, 두 번째 줄에 버튼만 올 수 있음. 이 경우에도 **입력 래퍼 min-width는 0이 아닌 값**(예: 10rem) 유지. |
| **최소 너비** | 입력 래퍼는 **0 미사용**. 브레이크포인트는 PENCIL_DESIGN_GUIDE §3, RESPONSIVE_LAYOUT_SPEC 참조 (375px~3840px). |

---

## 3. 디자인 토큰·클래스 요약 (코더 전달용)

| 용도 | 토큰·클래스 |
|------|-------------|
| 행 gap, 라벨–행 간격 | `var(--mg-spacing-sm)`, `var(--mg-spacing-md)` |
| 입력 래퍼 min-width | `var(--mg-form-email-input-min-width, 12rem)` 또는 동일 의미 토큰 |
| 테두리·배경(입력) | `var(--mg-color-border-main)`, `var(--mg-color-surface-main)` |
| 라벨/캡션 | `var(--mg-color-text-secondary)` |
| 본문 텍스트 | `var(--mg-color-text-main)` |
| 버튼(아웃라인) | 테두리 `var(--mg-color-border-main)` 또는 `var(--mg-color-text-secondary)`, 배경 transparent |
| 버튼(주조) | `var(--mg-color-primary-main)`, 텍스트 `var(--mg-color-background-main)` |
| 버튼 radius(compact) | 8px |
| 버튼 클래스 | `mg-v2-button mg-v2-button-secondary mg-v2-button--compact`, 필요 시 `data-action="email-duplicate-check"` |

단일 소스: `mindgarden-design-system.pen`, `pencil-new.pen`, `unified-design-tokens.css`, PENCIL_DESIGN_GUIDE.md 팔레트.

---

## 4. 적용 체크리스트 (디자이너 숙지)

- [ ] **현재 vs 목표**: 오른쪽이 "빈 박스 + 텍스트"가 아니라 **명확한 버튼**으로 보이도록 스펙 반영했는가?
- [ ] **버튼 시각**: 테두리·배경(또는 아웃라인)·패딩·호버를 토큰·클래스로 명시했는가?
- [ ] **레이아웃**: 라벨 상단, 이메일 행 한 줄(입력 래퍼 + 버튼), gap 12px, 입력 래퍼 min-width 0 아님?
- [ ] **반응형**: 한 줄 유지 우선, 줄바꿈 시에도 __input-wrap min-width 0 미사용?
- [ ] **토큰·클래스**: `var(--mg-*)`, `mg-v2-form-email-row`, `mg-v2-button--compact` 등 코더가 추측 없이 쓸 수 있게 명시했는가?

---

## 5. 참조 문서

| 문서 | 용도 |
|------|------|
| **본 문서** | 어드민 모달 이메일 행 현재 vs 목표 및 목표 비주얼·레이아웃 스펙 |
| `docs/design-system/ADMIN_MODAL_EMAIL_ROW_LAYOUT_SPEC.md` | 이메일 행 레이아웃(깨짐 방지)·클래스·최소 치수 |
| `docs/design-system/CLIENT_MODAL_EMAIL_BUTTON_SPEC.md` | 중복확인 버튼 크기·modifier·마크업·강제 적용 |
| `docs/design-system/CLIENT_MODAL_EMAIL_ROW_LAYOUT_SPEC.md` | 입력란 미노출 원인 분석·스펙 제안 |
| `docs/design-system/PENCIL_DESIGN_GUIDE.md` | 펜슬·B0KlA 비주얼·토큰·반응형 |
| `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` | 브레이크포인트·패딩·그리드 |
| `frontend/src/styles/unified-design-tokens.css` | 구현용 토큰 (디자이너는 토큰명 참고만) |

---

*이 문서는 UI/UX·레이아웃·비주얼 스펙이며, 코드 구현은 core-coder가 수행한다.*
