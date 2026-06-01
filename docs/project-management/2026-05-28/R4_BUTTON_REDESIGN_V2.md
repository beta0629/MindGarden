# [R4 시각 개선] 사이드바 매칭 카드 "매칭 취소" 버튼 디자인 v2.0

## 1. 개요
R4 PR #59 반영 후 사용자 피드백(텍스트 링크 형태의 시각적 어색함, 오클릭 방지 목적이었으나 강조도가 너무 약해 인지 어려움)에 따라, 사이드바 카드 하단의 "매칭 취소" 버튼을 재설계합니다.
기존 문서(`R4_DESIGN_HANDOFF_DETAIL.md`의 §취소 버튼 부분)는 본 문서로 대체(deprecated)됩니다.

## 2. 옵션 비교 및 권장안

### 옵션 비교
* **옵션 A2 (권장): 풀-width Danger Outline 보조 버튼**
  * 메인 버튼("당일 결제 + 활성화")과 동일한 폭으로 하단에 배치하되, Outline 스타일로 파괴적 액션을 명확히 구분.
* **옵션 B2: 같은 행 2-컬럼 (메인 + 보조)**
  * 한 줄에 메인(3/4)과 보조(1/4)를 배치. 공간은 절약되나 텍스트 줄바꿈 위험이 큼.
* **옵션 C2: 카드 우측 상단 dismiss 아이콘**
  * X 아이콘으로 카드 헤더에 배치. 기존 뱃지("결제 대기 / 0 회기 남음")와 시각적 충돌 발생.

### 권장안: 옵션 A2 (풀-width Danger Outline 보조 버튼)
메인 버튼 아래 위치하며, 시각적 균형을 맞추고 클릭 영역을 충분히 확보하면서도 파괴적 액션의 시각 강도를 메인 버튼보다 낮춰 적절히 강조합니다.

```text
┌─────────────────────────────────┐
│                                 │
│  김선희 선생님 → 이재학 내담자        │
│  [결제 대기] [0 회기 남음]            │
│                                 │
│  ┌───────────────────────────┐  │
│  │       일정 등록             │  │  <- 기존 영역
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │   당일 결제 + 활성화          │  │  <- 메인 (Primary green, Height 44px)
│  └───────────────────────────┘  │
│                                 │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│  │      매칭 취소               │  │  <- 보조 (Danger outline, Height 38px) ★
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
│                                 │
└─────────────────────────────────┘
```

## 3. 상세 명세 (Specs)

### 색상 토큰 (SSOT: `frontend/src/styles/unified-design-tokens.css`)
기존에 존재하는 `unified-design-tokens.css`의 토큰을 재사용합니다.

| 상태 | border | background | color |
|---|---|---|---|
| **default** | `var(--mg-error-500)` 1.5px | `transparent` | `var(--mg-error-600)` |
| **hover** | `var(--mg-error-600)` 1.5px | `var(--mg-error-500)` | `var(--color-text-on-danger)` |
| **active** | `var(--mg-error-700)` 1.5px | `var(--mg-error-600)` | `var(--color-text-on-danger)` |
| **focus-visible** | `var(--mg-error-500)` 1.5px + 2px `var(--mg-error-300)` (ring) | (default) | (default) |
| **disabled** | `var(--mg-v2-neutral-300)` 1.5px | `transparent` | `var(--mg-v2-text-secondary)` |
| **dark mode** | `var(--mg-color-error-dark)` 1.5px | `transparent` | `var(--mg-color-error-100)` |

*(참고: 다크모드의 경우 기존 SSOT에서 지정된 `--mg-color-error-dark`와 `--mg-color-error-100`을 반전 텍스트로 활용)*

### 사이즈 및 간격
* **높이 (Height)**: 38px (메인 44px 대비 시각 강도를 낮춤)
* **폭 (Width)**: 100% (메인과 동일한 폭 유지)
* **간격 (Gap)**: 메인 버튼과의 상단 간격 12px (토큰: `var(--mg-v2-space-3)`)
* **라운드 (Border Radius)**: `var(--mg-v2-radius-md)`
* **폰트**: Noto Sans KR, Weight 500, Size Body-2 (14~15px)

### 반응형 및 접근성 (a11y)
* **모바일**: 사이드바 폭(280~320px)에서 풀-width로 노출. 320px 이하에서 좌우 padding 축소 반영.
* **접근성 (a11y)**:
  * `aria-label="매칭 취소"` 현행 유지
  * 키보드 네비게이션 시 `focus-visible` 링 표시 보장
  * 터치/클릭 영역 확대 (기존 텍스트 링크 대비 대폭 증가)

## 4. 노출 조건 매트릭스 (코드 정합)
기존 R4 정책과 100% 동일하며 기능/노출 변경은 없습니다.

| 매칭 상태 | paymentTiming | 취소 버튼 노출 여부 |
|---|---|---|
| `PENDING_PAYMENT` | `SAME_DAY_CARD` | **노출** |
| `PENDING_PAYMENT` | `ADVANCE` 또는 `NULL` | **노출** |
| `ACTIVE` | (any) | 미노출 |
| `TERMINATED` / `SUSPENDED` | (any) | 미노출 |

## 5. 전달 사항
해당 문서 스펙에 맞추어 `core-coder`가 `develop` 브랜치에 Feature Flag(또는 별도 커밋)로 구현할 수 있도록 위임 가능. v2.0 영역과 완전히 분리되어 충돌이 없습니다.
