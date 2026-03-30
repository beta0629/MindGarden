# 모달 이메일 행 "입력란 미노출" UI/UX·레이아웃 원인 분석 및 스펙 제안

**역할**: core-designer (분석·스펙만, 코드 작성 없음)  
**대상**: 내담자/상담사/스태프 등록·수정 모달의 이메일 행  
**참조**: PENCIL_DESIGN_GUIDE.md, 어드민 대시보드 샘플, unified-design-tokens

---

## 1. 현상 요약

- 모달 내 이메일 행에서 **입력 필드가 보이지 않고** "이메일 * 중복확인"만 한 줄로 보임(입력란 0 너비 또는 미노출).
- DOM: `.mg-modal-overlay.mg-v2-ad-b0kla` → `.mg-modal__body` → `.mg-v2-modal-body` → `form.mg-v2-form` → `div.mg-v2-form-group`(이메일 행) → label + `.mg-v2-form-email-row` → `.__input-wrap` + 버튼.

---

## 2. 원인 분석 (UI/UX·레이아웃·비주얼 관점)

### 2.1 선택자 특이도·적용 순서

| 파일 | 선택자 (이메일 행 관련) | 특이도 | 비고 |
|------|-------------------------|--------|------|
| **AdminDashboardB0KlA.css** | `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row__input-wrap` | 낮음 (클래스 3개) | 공통 규칙. **동일 블록 내에 min-width: 0과 min-width: 12rem 동시 존재** → 최종값은 12rem이지만, 의도와 반대인 0이 먼저 선언되어 유지보수·다른 규칙과의 상호작용 시 혼란 가능. |
| **ClientModal.css** | `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body .mg-v2-form-email-row__input-wrap` | 높음 (클래스 5개 + .mg-modal) | `.mg-modal__body .mg-v2-modal-body` 포함으로 B0KlA보다 우선. min-width: 12rem만 명시. |

- **로드 순서**: 예) StaffManagement에서는 `ClientModal.css` → `AdminDashboardB0KlA.css` 순으로 import. ClientModal이 더 구체적이므로 `.mg-modal__body .mg-v2-modal-body`가 있는 모달에서는 ClientModal 규칙이 적용됨.
- **위험 요인**: B0KlA가 나중에 번들되는 페이지에서, **동일 특이도**인 다른 규칙(예: input 직접 타깃)이 있으면 나중 것이 이길 수 있음. 또한 B0KlA 내 **min-width: 0** 선언은 “flex 수축 허용”으로 해석될 수 있어, 다른 전역 규칙이나 유틸(.u-min-w-0 등)과 결합 시 **0이 최종 적용**될 가능성이 있음.

**결론**: 선택자만으로는 12rem이 무너질 직접 원인은 아니나, **B0KlA의 __input-wrap 규칙에 min-width: 0를 두는 것은 위험**이며, **이메일 행은 공통으로 더 구체적인 단일 규칙**으로 정리하는 것이 안전함.

---

### 2.2 flex / min-width 충돌

- **구조**: `.mg-v2-form-email-row`(display: flex, width: 100%) → 자식 `.__input-wrap`(flex: 1 1 0%, min-width: 12rem) + `.mg-v2-button`(flex: 0 0 auto).
- **부모 체인**: `_unified-modals.css`에서 `.mg-modal__body`, `.mg-modal__body .mg-v2-modal-body`에 **min-width: 0** 적용 → flex/그리드 하위에서 **수축 가능**하도록 한 설정.
- **동작**: `flex: 1 1 0%`는 basis 0이므로 초기 너비 0. 여기에 **min-width: 12rem**이 있으면 수축 한계가 12rem이 되어 입력란은 최소 12rem을 유지해야 함.
- **문제가 되는 경우**:
  1. **__input-wrap에 min-width: 0만 적용되거나 나중에 0이 덮어쓰이는 경우** (유틸 클래스, 다른 스타일시트 등): flex가 0까지 수축해 입력란 너비가 0으로 보임.
  2. **행 자체가 좁은 컨테이너 안에 있는 경우**: 부모가 min-width: 0으로 줄어들어 행 너비가 매우 작아지면, 12rem이 있어도 overflow로 잘리거나 레이아웃이 깨져 “안 보인다”고 느낄 수 있음 (특히 작은 뷰포트·다단 레이아웃).

**결론**: **flex + min-width: 0 부모 체인**은 유지하되, **이메일 행의 __input-wrap에는 반드시 min-width를 0이 아닌 값(권장 12rem 또는 토큰)**으로 단일·명시하고, **동일 규칙 안에 min-width: 0을 두지 않는 것**이 필요함.

---

### 2.3 전역 스타일·덮어쓰기

| 소스 | 영향 가능성 | 내용 |
|------|-------------|------|
| **unified-design-tokens.css** | 중간 | `.mg-v2-form-input { width: 100% }` 다수 정의. input은 __input-wrap 안에 있으므로 래퍼 너비가 0이면 100%도 0. **입력란 미노출의 직접 원인은 래퍼(__input-wrap)의 min-width 상실**로 보는 것이 타당함. |
| **emergency-design-fix.css** | 있음 | `.mg-v2-modal-body { min-width: 0 }`, `.mg-v2-form-input { width: 100%, … }`. 모달 바디 min-width: 0은 flex 수축을 허용해, **위 2.2와 결합 시** 하위 폼 행이 좁아질 수 있음. 입력란 자체를 숨기기보다는 **래퍼 최소 너비가 지켜지지 않을 때** 문제가 됨. |
| **_unified-modals.css** | 있음 | `.mg-modal__body`, `.mg-modal__body .mg-v2-modal-body`에 min-width: 0. 의도는 오버플로/스크롤 처리이나, **이메일 행처럼 “최소 너비를 보장해야 하는” flex 자식**은 별도 min-width로 보호해야 함. |
| **유틸리티** | 위험 | `_utilities.css`의 `.u-min-w-0 { min-width: 0 !important; }`가 **__input-wrap 또는 이메일 행에 적용되면** 12rem이 무시되어 입력란이 0 너비로 보일 수 있음. |

**결론**: 전역에서 `.mg-v2-form-input`가 width: 100%인 것은 정상이며, **입력란 미노출의 핵심은 __input-wrap(또는 동일 역할 래퍼)의 min-width가 0으로 덮이거나, 유틸/다른 규칙으로 0이 적용되는 것**으로 보는 것이 맞음. 전역 스타일은 “모달·폼 그룹의 min-width: 0”으로 수축을 허용하므로, **이메일 행만 예외로 최소 너비를 명시**하는 설계가 필요함.

---

### 2.4 B0KlA·디자인 토큰과의 일관성

- **unified-design-tokens / B0KlA**: 폼 입력은 `var(--mg-*)`, `var(--ad-b0kla-*)` 등 토큰 사용. 이메일 행도 **간격(gap)·최소 너비·radius·버튼 크기**를 토큰으로 통일하면, 환경이 바뀌어도 한 줄 레이아웃이 안정적으로 유지됨.
- **현재**: `min-width: 12rem` 등은 하드코딩. 토큰(예: `--mg-form-input-min-width` 또는 `--ad-b0kla-form-email-row-input-min-width`)으로 두면 반응형·테마 확장 시 일관되게 조정 가능.

---

## 3. 레이아웃/비주얼 스펙 제안 (코드 작성 없음, core-coder 구현용)

아래는 “이메일 행이 한 줄에 안정적으로 보이도록” 하기 위한 **클래스명·속성 권장**만 정리한 것이다. 코드 수정은 core-coder가 수행한다.

### 3.1 구조·클래스 (유지)

- **행**: `.mg-v2-form-email-row` — `display: flex`, `align-items: center`, `gap`: 토큰(예: `var(--mg-spacing-sm)` 또는 12px), `width: 100%`, `box-sizing: border-box`.
- **입력 래퍼**: `.mg-v2-form-email-row__input-wrap` — flex가 “한 줄에서 남는 공간”을 차지하되, **절대 0으로 수축하지 않도록** 최소 너비 보장.
- **입력**: `.mg-v2-form-email-row__input-wrap .mg-v2-form-input` — 래퍼 안에서 `width: 100%`, `box-sizing: border-box`.
- **버튼**: `.mg-v2-form-email-row .mg-v2-button` — `flex: 0 0 auto` / `flex-shrink: 0`, compact 스타일은 기존 `.mg-v2-button--compact` 또는 `[data-action="email-duplicate-check"]` 유지.

### 3.2 __input-wrap 필수 속성 (권장)

- **flex**: `1 1 0%` (또는 `1 1 auto` + 아래 min-width로 보호).
- **min-width**: **0이 아닌 값**만 사용. 권장:
  - `12rem` 또는
  - 디자인 토큰 도입 시: `var(--mg-form-email-input-min-width, 12rem)` / `var(--ad-b0kla-form-email-row-input-min-width, 12rem)`.
- **금지**: 동일 규칙 또는 더 높은 특이도/나중 로드에서 **__input-wrap에 min-width: 0**을 두지 않음. **유틸 클래스 `.u-min-w-0`를 이 래퍼 또는 이메일 행에 적용하지 않음.**

### 3.3 선택자·캐스케이드 정리

- **단일 소스 권장**: 이메일 행(__input-wrap 포함)은 **한 곳**에서 정의.  
  - 옵션 A: AdminDashboardB0KlA.css에서 **모든 B0KlA 모달**에 적용하는 공통 규칙 하나만 두고, **min-width: 0 제거**, min-width만 위 3.2대로 명시.  
  - 옵션 B: 모달 본문 구조가 있는 경우(`.mg-modal__body .mg-v2-modal-body`)만 더 구체적인 선택자로 **동일 min-width·flex 값**을 적용해, 로드 순서/다른 페이지와 관계없이 항상 12rem(또는 토큰)이 적용되도록 함.
- **특이도**: ClientModal.css처럼 `.mg-modal__body .mg-v2-modal-body`를 넣은 선택자는 B0KlA 공통 규칙보다 우선하므로, “내담자/상담사/스태프 공통”과 “내담자 전용”이 겹치지 않게 한 쪽으로 통일하는 것이 좋음.

### 3.4 전역·모달 보조 설정

- `.mg-modal__body`, `.mg-v2-modal-body`의 **min-width: 0**은 유지(스크롤/오버플로 목적).  
- **이메일 행**만 예외로 **__input-wrap**에 위와 같이 **min-width: 12rem(또는 토큰)**을 명시해, flex 수축으로 인한 0 너비를 방지.

### 3.5 반응형·접근성

- **좁은 뷰포트**: 12rem(약 192px)이 모달 최소 너비(예: large 720px)보다 작으므로, 한 줄 유지가 무리 없음. 필요 시 미디어 쿼리에서 `min-width`를 더 줄이는 값(예: 10rem)으로만 조정하고, **0은 사용하지 않음**.
- **시각**: B0KlA·PENCIL_DESIGN_GUIDE에 맞춰, 입력란과 버튼이 한 줄에 나란히 보이도록 gap·패딩·버튼 compact 스타일은 기존 디자인 시스템과 동일하게 유지.

---

## 4. 요약 (기획 보고용)

| 구분 | 내용 |
|------|------|
| **원인 요약** | (1) **선택자**: B0KlA 동일 규칙 내 `min-width: 0` + `min-width: 12rem` 혼재로, 다른 규칙/유틸과 결합 시 0이 적용될 여지. (2) **flex**: 부모 min-width: 0 체인 아래에서 `flex: 1 1 0%`만 있고 래퍼 min-width가 0이면 입력란 0 너비. (3) **전역**: `min-width: 0` 모달/폼 그룹 + `.u-min-w-0` 등이 __input-wrap에 적용되면 12rem이 무시됨. |
| **권장 조치** | __input-wrap에 **min-width: 0 제거**, **min-width: 12rem(또는 토큰)** 단일·명시; 이메일 행/래퍼에 `.u-min-w-0` 미적용; 이메일 행 규칙을 한 곳으로 모아 특이도·로드 순서와 무관하게 동일하게 적용. |
| **스펙** | 위 3.1~3.5를 core-coder에게 전달해, B0KlA·ClientModal·전역 CSS에서 해당 규칙만 정리·반영하면 됨. |

이 문서는 기획(core-planner)에게 전달해, 코더 작업 범위와 우선순위 정리 시 참고할 수 있음.
