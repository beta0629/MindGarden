# 공통 UI 캡슐화·모듈화 — 디자인 시스템 관점 검토

**작성일**: 2025-03-14  
**검토자**: core-designer (디자인 전용)  
**참조**: `docs/project-management/COMMON_UI_ENCAPSULATION_PLAN.md`, `docs/design-system/PENCIL_DESIGN_GUIDE.md`, `docs/design-system/ATOMIC_DESIGN_SYSTEM.md`, 어드민 대시보드 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample

---

## 1. 요약

공통 UI 캡슐화 계획은 **시각적 일관성 확보**와 **토큰·클래스 통합** 측면에서 디자인 시스템과 잘 부합한다. 아래는 배지/버튼/카드 통합 시 **시각 일관성 방안**, **통합 클래스·토큰 명명 제안**, **어드민 샘플 준수 여부**, **아토믹 구조 배치 권장안**을 정리한 디자인 관점 검토 의견이다. 코드 구현은 하지 않으며, 코더(core-coder)가 추측 없이 적용할 수 있도록 **토큰명·클래스명**을 명시한다.

---

## 2. 시각적 일관성 확보 방안

### 2.1 공통화 대상별 시각 기준

| 컴포넌트 | 시각 기준 (단일 소스) | 적용 원칙 |
|----------|------------------------|-----------|
| **StatusBadge** | `PENCIL_DESIGN_GUIDE` B0KlA 팔레트 + `unified-design-tokens.css`의 시맨틱 색상 | variant별 배경/글자색은 **토큰만** 사용. 예: success → `var(--mg-success-100)` / `var(--mg-success-700)`. pill 형태: `border-radius: var(--mg-radius-full)`, 패딩 `var(--mg-spacing-2)` `var(--mg-spacing-8)`, 폰트 `var(--mg-font-xs)`, fontWeight 600. |
| **RemainingSessionsBadge** | 통합 스케줄 카드용 이미 정의된 스타일 (`RemainingSessionsBadge.css`) | 주조 계열로 통일: 배경 `var(--mg-primary-100)`, 글자 `var(--mg-primary-700)`. `border-radius: var(--mg-radius-sm)`, 패딩 `var(--mg-spacing-2)` `var(--mg-spacing-6)`, 폰트 `var(--mg-font-xs)`, fontWeight 500. **카운트 전용**이므로 StatusBadge와 구분 유지. |
| **ActionButton** | 어드민 샘플 버튼: 주조 #3D5246, height 40px, radius 10px, padding 10–20px | primary: `var(--mg-color-primary-main)`, 텍스트 `var(--mg-color-background-main)`. outline: 배경 없음, 테두리 `var(--mg-color-border-main)`. hover 시 **transform 사용 금지**(PENCIL_DESIGN_GUIDE·CARD_VISUAL_UNIFIED_SPEC와 동일). shadow만 변경 허용. |
| **CardContainer** | `CARD_VISUAL_UNIFIED_SPEC` + PENCIL 섹션 블록 | border 1px `var(--mg-color-border-main)`, radius `var(--mg-radius-lg)`(12px), padding `var(--mg-spacing-16)`, min-height 140px, box-shadow `var(--mg-shadow-sm)` / hover 시 `var(--mg-card-hover-shadow)`. **좌측 악센트** 4px `var(--mg-color-primary-main)`, radius `12px 0 0 12px`. 배경 `var(--mg-color-surface-main)`. |

위 수치는 모두 `mindgarden-design-system.pen`, `pencil-new.pen`, `unified-design-tokens.css`에 정의된 **단일 소스**에 맞추어, 공통 컴포넌트가 한 곳에서만 이 값들을 참조하도록 하면 전역 시각 일관성이 유지된다.

### 2.2 일관성 유지를 위한 디자인 규칙

- **색상**: `var(--mg-*)` 토큰만 사용. hex/임의 색상 금지.
- **간격/radius**: `var(--mg-spacing-*)`, `var(--mg-radius-*)` 명시.
- **타이포**: Noto Sans KR, 라벨/캡션 12px(`var(--mg-font-xs)`), 본문 14–16px.
- **호버**: 카드·버튼 모두 **transform 금지**, shadow/opacity만 변경.
- **배지 형태**: 상태 배지는 **pill**(radius-full), 회기/숫자 배지는 **sm radius**로 역할 구분.

---

## 3. 배지 클래스·토큰 통합 제안

### 3.1 현황 (혼재)

조사 결과, 아래 클래스들이 페이지/컴포넌트별로 분산되어 있다.

| 용도 | 현재 클래스 예시 | 비고 |
|------|------------------|------|
| 상태 표시 | `status-badge`, `mg-v2-status-badge`, `integrated-schedule__card-status`, `mg-consultant-card__status-badge`, `mg-client-card__status-badge`, `consent-status-badge`, `security-status-badge` 등 | 네이밍·variant 체계 불일치 |
| 일반 배지(라벨/태그) | `mg-badge`, `mg-v2-badge`, `mg-badge-primary`, `mg-v2-badge-success`, `mg-v2-badge--primary` 등 | BEM 혼용(하이픈 vs 카멜), variant 중복 |
| 메시지/이벤트 타입 | `mg-badge-message-type`, `mg-v2-message-badge` | 도메인 특화 |
| 스케줄/회기 | `integrated-schedule__card-remaining-badge` | 카운트 전용 |

토큰 쪽에는 `--schedule-status-badge-*`, `--transfer-status-badge-*` 등 도메인별 변수와, `mg-v2-status-badge--active` 등 modifier가 섞여 있어, **공통 배지**와 **도메인 특화** 경계가 불명확하다.

### 3.2 통합 클래스·토큰 명명 제안

**원칙**: (1) **공통 Atoms**는 접두사 하나로 통일. (2) **역할별**로 상태용 / 카운트용을 구분. (3) variant는 **BEM modifier** 한 가지 규칙만 사용.

| 구분 | 제안 클래스 (기본) | Modifier (variant) | 용도 |
|------|---------------------|---------------------|------|
| **상태 배지** | `mg-v2-badge mg-v2-badge--status` (또는 단일 클래스 `mg-v2-status-badge`) | `mg-v2-badge--success`, `--warning`, `--neutral`, `--danger`, `--info` | 매칭/상담/결제 등 **상태** 표시. pill 형태. |
| **카운트·회기 배지** | `mg-v2-badge mg-v2-badge--count` (또는 `mg-v2-count-badge`) | 필요 시 `mg-v2-badge--count-primary` | 남은 회기, 필터 카운트 등 **숫자** 강조. |
| **일반 라벨/태그** | `mg-v2-badge` | `mg-v2-badge--primary`, `--secondary`, `--success`, `--warning`, `--danger`, `--info` | 테이블 라벨, 중요도 등. |

**토큰 명명 제안** (unified-design-tokens.css 또는 공통 배지 CSS에서 정의):

- **공통 배지 기본**: `--mg-badge-padding`, `--mg-badge-font-size`, `--mg-badge-font-weight`, `--mg-badge-radius`, `--mg-badge-radius-pill`.
- **상태 variant**: `--mg-badge-success-bg`, `--mg-badge-success-text`, `--mg-badge-warning-bg`, `--mg-badge-warning-text`, … (success/warning/neutral/danger/info 5종).
- **카운트 배지**: `--mg-count-badge-bg`, `--mg-count-badge-text` (주조 계열 권장).

**기존 클래스와의 매핑**:

- `integrated-schedule__card-status` → `mg-v2-status-badge` + `mg-v2-badge--{variant}` (variant는 기존 상태값과 1:1 매핑).
- `integrated-schedule__card-remaining-badge` → `mg-v2-count-badge` (또는 `mg-v2-badge mg-v2-badge--count`).
- `mg-badge`, `mg-v2-badge-primary` 등 → 단일 컴포넌트 `StatusBadge` / 공통 Badge에서 `mg-v2-badge` + `mg-v2-badge--*` 로 점진적 통합.

이렇게 하면 **하나의 디자인 소스**(배지 기본형 + variant 5종 + 카운트 1종)로 정리되고, 기존 `mg-v2-status-badge--active` 등은 `mg-v2-badge--success` 등 시맨틱 variant로 치환 가능하다.

### 3.3 제외·유지 권장

- **도메인 한정 배지**(예: `mg-badge-message-type`, `mg-consultant-detail-status-badge`)는 **공통 variant 체계에 맞춰 확장**하되, 클래스명은 기존 유지 또는 점진적 alias만 두는 방식을 권장. 한 번에 제거보다는 공통 스타일을 **참조**하도록 리팩터링.
- **레거시** `mg-badge`(rank, grade 등)는 별도 스코프에서 유지하고, 신규/통합 스케줄·매칭·클라이언트 탭 등은 **mg-v2-badge + modifier**만 사용하도록 제한.

---

## 4. 어드민 샘플 스타일 준수 여부

**참조**: https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample

### 4.1 계획서 방향과의 부합

- **레이아웃**: 사이드바 260px, 상단 바(브레드크럼·제목·액션), 본문 섹션 블록 구조 — 계획서의 CardContainer·섹션 블록과 동일한 구조로 확장 가능. **준수 가능.**
- **색상**: 주조 #3D5246, 서페이스 #F5F3EF, 테두리 #D4CFC8, 본문 #2C2C2C 등 — PENCIL_DESIGN_GUIDE 및 `var(--mg-color-*)`와 일치. 공통 컴포넌트가 토큰만 쓰면 **자동 준수.**
- **카드/섹션**: 좌측 4px 악센트, 16px radius, 1px 테두리 — CARD_VISUAL_UNIFIED_SPEC과 동일. CardContainer로 통일 시 **준수.**
- **버튼**: 주조 채움, 아웃라인, height 40px, radius 10px — ActionButton 스펙에 위 수치를 명시하면 **준수.**
- **배지**: 샘플에서 상태/라벨용 작은 뱃지 사용. pill 또는 작은 radius, 12px 급 폰트 — 제안한 `mg-v2-badge` / `mg-v2-status-badge` 규격이면 **준수.**

### 4.2 주의사항

- **hover 시 transform** (translateY 등): 현재 일부 `mg-button-*`, `mg-v2-button-*`에 사용 중. PENCIL_DESIGN_GUIDE·CARD_VISUAL_UNIFIED_SPEC에서는 **hover에 transform 금지**. ActionButton 통합 시 **제거**하여 shadow만 변경하는 방향 권장.
- **Premium/Glass** (DESIGN_CENTRALIZATION_STANDARD): 어드민 샘플은 밝은 고정색·섹션 블록 위주이므로, 공통 캡슐화 1차 범위에서는 **B0KlA 고정 팔레트·토큰**만 적용하고, Glass/그라데이션은 별도 테마로 두는 편이 안전하다.

---

## 5. 아토믹 디자인 구조와 공통 컴포넌트 배치 권장안

### 5.1 계층 배치

| 컴포넌트 | 계층 | 배치 권장 | 이유 |
|----------|------|-----------|------|
| **ActionButton** | Atom | `common/` (계획서 방안 A) | 단일 인터랙션 요소, 더 이상 쪼개지 않음. |
| **StatusBadge** | Atom | `common/` | 상태 표시 단일 단위. |
| **RemainingSessionsBadge** | Atom | `common/` | 회기/숫자 표시 단일 단위. |
| **CardContainer** | Molecule | `common/` | 카드 래퍼 = 구조+스타일 조합이지만, 내용물에 무관한 “컨테이너”이므로 molecule로 두는 것이 아토믹 스킬과 부합. |
| **CardActionGroup** | Molecule | `common/` | 버튼 그룹 = ActionButton 조합. |

integrated-schedule의 `atoms/StatusBadge.js` 등은 **common에서 re-export 또는 thin wrapper**로 두고, 스타일은 전부 **공통 클래스**(`mg-v2-status-badge`, `mg-v2-badge--*`)로만 적용하면, “한 사람이 한 것처럼” 동일한 비주얼이 나온다.

### 5.2 디렉터리 구조 권장 (계획서 방안 A 정리)

- **common/**  
  - Atoms: `ActionButton`, `StatusBadge`, `RemainingSessionsBadge`  
  - Molecules: `CardContainer`, `CardActionGroup`  
  - 기존 `MGModal`, `FormInput` 등 유지.
- **admin/mapping-management/integrated-schedule/atoms/**  
  - `StatusBadge.js` → `import { StatusBadge } from '@/components/common';` 후 재export 또는 스타일만 `integrated-schedule__*` modifier로 확장(필요 시).
  - `RemainingSessionsBadge.js` → 동일.
- **스타일**  
  - 공통 시각 규격은 `unified-design-tokens.css` 또는 `common/*.css`에서 `mg-v2-badge`, `mg-v2-status-badge`, `mg-v2-button`, `mg-v2-card` 등 **한 세트**로 정의.  
  - integrated-schedule은 **컨텍스트별 modifier**만 추가(예: 레이아웃·간격).

이렇게 하면 **Atoms → Molecules → Organisms** 흐름이 유지되고, 공통 컴포넌트는 한 곳에서만 비주얼을 정의하므로 일관성이 확보된다.

### 5.3 design-system 폴더(방안 B)에 대한 의견

- **방안 B**는 아토믹 계층을 명시적으로 드러내는 장점이 있으나, 현재 **스타일 토큰**이 이미 `styles/unified-design-tokens.css`에 있으므로, `design-system/tokens/`는 역할이 겹친다.
- **권장**: **방안 A(common 확장)** 유지. 필요 시 `common/README.md`에 “Atoms: …, Molecules: …”만 명시해 두어도 아토믹 스킬·문서와의 대응이 가능하다.

---

## 6. 디자인 체크리스트 (공통화 적용 시)

- [ ] StatusBadge / RemainingSessionsBadge / ActionButton / CardContainer 모두 **PENCIL_DESIGN_GUIDE** 팔레트·토큰(`var(--mg-*)`)만 사용하는가?
- [ ] 배지 클래스가 **mg-v2-badge + mg-v2-badge--{variant}** 또는 **mg-v2-status-badge / mg-v2-count-badge** 제안에 맞춰 정리되었는가?
- [ ] 버튼·카드 hover에 **transform 미적용**, shadow만 변경하는가?
- [ ] 카드 공통 스타일이 **CARD_VISUAL_UNIFIED_SPEC** (border, radius, padding, min-height, ::before 악센트)과 동일한가?
- [ ] 어드민 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample)과 비교해 **색상·타이포·간격**이 일관되는가?
- [ ] common에 배치된 컴포넌트가 **아토믹 계층**(Atoms: 버튼·배지, Molecules: CardContainer·CardActionGroup)에 맞게 문서화되어 있는가?

---

## 7. 참조 문서

- `docs/project-management/COMMON_UI_ENCAPSULATION_PLAN.md`
- `docs/design-system/PENCIL_DESIGN_GUIDE.md`
- `docs/design-system/ATOMIC_DESIGN_SYSTEM.md`
- `docs/design-system/v2/CARD_VISUAL_UNIFIED_SPEC.md`
- `docs/standards/DESIGN_CENTRALIZATION_STANDARD.md`
- `frontend/src/styles/unified-design-tokens.css` (토큰명 참고만, 코드 수정은 코더 담당)

---

**문서 버전**: 1.0  
**다음 단계**: Phase 1 ActionButton 스펙 시 위 배지/버튼/카드 통합 클래스·토큰 제안을 반영하고, Phase 2·3에서 CardContainer·StatusBadge 스펙에 본 검토 내용을 반영할 것.
