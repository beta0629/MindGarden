# 내담자 등록 모달(ClientModal) — 이메일 행 중복확인 버튼 스펙

**대상**: `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row` 내부의 **중복확인** 버튼  
**목적**: 버튼이 너무 크게 보인다는 피드백에 따라, **이메일 input 대비 작고 일관된 비율**로 줄인 디자인 스펙 제안.  
**참조**: PENCIL_DESIGN_GUIDE.md, B0KlA·unified-design-tokens, 어드민 대시보드 샘플.

---

## 1. 현재 상태 요약

| 항목 | 현재 값 |
|------|--------|
| 위치 | `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row` 내부 |
| 버튼 클래스 | `mg-v2-button mg-v2-button-secondary` |
| 전역 `.mg-v2-button` (unified-design-tokens) | padding 6px 12px, min-height 32px, font-size 0.8rem |
| 행 레이아웃 | flex, gap 12px, input `flex: 1`, 버튼 `flex-shrink: 0` |
| 이메일 input 높이 | 폼 기본 input 높이 40px (`--input-height-default`) |

---

## 2. 중복확인 버튼 전용 크기 권장안

**이메일 input(40px) 대비 약 0.7 높이**로 줄여, 한 줄에서 input이 주인공이고 버튼은 보조 액션으로 보이도록 한다.

| 속성 | 권장 값 | 토큰·비고 |
|------|---------|------------|
| **padding (상하)** | 4px | `var(--cs-spacing-xs)` (0.25rem = 4px) |
| **padding (좌우)** | 8px | `var(--cs-spacing-sm)` (0.5rem = 8px) |
| **min-height** | 28px | 고정 권장 (input 40px 대비 약 0.7) |
| **max-height** | 30px | 시각적 상한, 필요 시만 지정 |
| **font-size** | 12px | `var(--cs-text-xs)` (0.75rem) 또는 `0.75rem` |
| **line-height** | 1.2 | 가독·클릭 영역과 충돌 방지 |
| **border-radius** | 8px | `var(--cs-radius-md)` 또는 B0KlA 사용 시 `var(--ad-b0kla-radius-sm)`의 절반 수준(8px) 권장 — 작은 버튼에 12px는 과함 |

**시각적 비율**

- 이메일 input 높이: **40px** (`--input-height-default`)
- 중복확인 버튼 높이: **28px** → **input 대비 약 0.7**
- (선택) 0.8로 두고 싶다면 min-height **32px**, padding 4px 8px 유지 가능.

**색·테두리**

- 기존과 동일: secondary 스타일 유지  
  - B0KlA: `var(--ad-b0kla-text-secondary)`, `var(--ad-b0kla-border)`  
  - 배경 transparent, border 2px (기존 `.mg-v2-button-secondary` 규칙 따름).

---

## 3. 다른 폼 버튼과의 구분

- **적용 범위**: **이메일 행의 중복확인 버튼만** 작게 적용.
- **유지**: 같은 모달 내 "주소 검색", "등록", "취소" 등은 **기존 크기 유지** (주요 액션이므로 40px 등 기존 스펙 유지).

**modifier 클래스 제안 (택 1)**

| 옵션 | 클래스명 | 용도 |
|------|----------|------|
| **A** | `mg-v2-button--compact` | 폼 인라인 보조 버튼 공통 (이메일 중복확인, 추후 다른 인라인 액션에 재사용). **권장.** |
| **B** | `mg-v2-form-email-row__btn` | 이메일 행 전용. BEM으로 행 소유 버튼임을 명시. |

**스코프 권장**

- **A** 사용 시: `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row .mg-v2-button.mg-v2-button--compact` 에만 compact 스타일 적용하면, 같은 모달 내 다른 버튼에는 영향 없음.
- **B** 사용 시: `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row .mg-v2-form-email-row__btn` 로 스타일 적용.

---

## 4. 구현 시 코더 전달용 요약

- **대상**: `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row` 안의 중복확인 버튼.
- **추가 클래스**: `mg-v2-button--compact` (권장) 또는 `mg-v2-form-email-row__btn`.
- **오버라이드 값**  
  - padding: `var(--cs-spacing-xs) var(--cs-spacing-sm)` (4px 8px)  
  - min-height: 28px  
  - font-size: `var(--cs-text-xs)` (0.75rem)  
  - line-height: 1.2  
  - border-radius: 8px (또는 `var(--cs-radius-md)`)
- **유지**: 색상·테두리는 기존 `mg-v2-button-secondary` / B0KlA secondary 규칙 유지.
- **다른 버튼**: 주소 검색·등록·취소 등은 기존 스타일·크기 유지.

---

## 5. 참조

- `docs/design-system/PENCIL_DESIGN_GUIDE.md`
- `frontend/src/styles/unified-design-tokens.css` (토큰명 참고)
- `frontend/src/styles/dashboard-tokens-extension.css` (--ad-b0kla-*)
- `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.css` (현재 이메일 행 스타일)

---

## 6. 마크업 권장 (core-publisher)

**목적**: 아토믹 디자인·BEM 관점에서 버튼 클래스와 접근성만 제안. JS/React·CSS 직접 수정은 core-coder 담당.

### 6.1 버튼에 붙일 클래스

**채택 권장**: 디자이너 제안 **A** (`mg-v2-button--compact`) 단일 사용.

| 방식 | 버튼 클래스 조합 | 용도·비고 |
|------|------------------|-----------|
| **권장** | `mg-v2-button mg-v2-button-secondary mg-v2-button--compact` | 폼 인라인 보조 버튼 공통 modifier. 이메일 행뿐 아니라 추후 다른 인라인 액션에서 재사용 가능. 스타일 스코프는 `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row .mg-v2-button.mg-v2-button--compact` 로 한정. |
| 대안 (BEM 요소 명시) | `mg-v2-form-email-row__btn mg-v2-button mg-v2-button-secondary` | 행 소유 버튼임을 BEM 요소로 명시. compact 스타일을 `.mg-v2-form-email-row__btn` 에만 정의하면 `--compact` 없이 동일 비주얼 가능. |
| 병행 (선택) | `mg-v2-form-email-row__btn mg-v2-button mg-v2-button-secondary mg-v2-button--compact` | 요소 역할(__btn) + 공통 modifier(--compact) 둘 다 사용. 셀렉터가 길어지므로 팀 정책에 따라 선택. |

**퍼블리셔 제안**: 재사용성·스펙 일치를 위해 **권장안(A만)** 적용. `mg-v2-form-email-row__btn` 은 “이 행 전용” 셀렉터를 짧게 쓰고 싶을 때만 추가.

### 6.2 중복확인 버튼 — 선택자 강화용 data 속성·고유 클래스

디자이너가 제안한 “선택자 강화 또는 data 속성 사용”을 퍼블리셔 관점에서 정리. BEM·접근성 유지.

| 방식 | 제안 값 | 용도·비고 |
|------|---------|-----------|
| **data 속성 (권장)** | `data-action="email-duplicate-check"` | 행·모달 내 다른 버튼과 구분, E2E·스타일 셀렉터로 사용. 시맨틱·접근성에 영향 없음. |
| **BEM 요소 클래스** | `mg-v2-form-email-row__btn` | 행 소유 버튼임을 명시. 스타일 스코프 `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row .mg-v2-form-email-row__btn` 로 한정 가능. |
| **병행** | `data-action="email-duplicate-check"` + `mg-v2-form-email-row__btn` | data는 동작/테스트용, 클래스는 스타일·BEM 구조용. 팀 정책에 따라 선택. |

**퍼블리셔 권장**: (1) **data 속성** `data-action="email-duplicate-check"` 는 선택자 강화·E2E용으로 적용 권장. (2) compact 스타일만 필요하면 6.1의 `mg-v2-button--compact` 만으로 충분; “이 행 전용” 셀렉터를 짧게 쓰고 싶을 때 `mg-v2-form-email-row__btn` 추가.

### 6.3 현재 마크업 구조 (참고)

```html
<div class="mg-v2-form-group">
  <label for="client-modal-email" class="mg-v2-form-label">이메일 *</label>
  <div class="mg-v2-form-email-row">
    <input type="email" id="client-modal-email" name="email" class="mg-v2-form-input" ... />
    <button type="button"
            class="mg-v2-button mg-v2-button-secondary mg-v2-button--compact"
            data-action="email-duplicate-check"
            aria-label="이메일 중복 확인">
      중복확인
    </button>
  </div>
</div>
```

- 버튼: **data 속성**으로 선택자 강화, **aria-label** 은 접근성 강화 시 선택 적용.
- input **id**: 모달이 여러 개 열릴 수 있으면 `client-modal-email` 처럼 고유 id 권장 (label `for` 와 일치).

### 6.4 접근성 (중복확인 버튼)

- **버튼 텍스트**: "중복확인", "확인 중..." 유지. 스크린리더가 버튼 내 텍스트를 읽으므로 `aria-label` 은 **필수는 아님**.
- **aria-label 추가 시 (선택)**  
  - 권장 문구: `aria-label="이메일 중복 확인"` (고정).  
  - 로딩 시: `aria-busy="true"` 추가 권장 (진행 중 상태 전달).  
- **정리**: 시각적 텍스트만으로도 의미 전달 가능하므로, 팀에서 접근성 강화 시에만 `aria-label` + 로딩 시 `aria-busy` 적용.

---

## 7. 중복확인 버튼 크기 미적용 대응 스펙 (강제 적용)

**배경**: ClientModal.css에서 `.mg-modal__body .mg-v2-modal-body .mg-v2-form-email-row .mg-v2-button.mg-v2-button--compact` 로 padding/min-height/font-size를 지정했음에도 사용자 피드백으로 "아직 수정 안 됐다"가 보고됨.

**가능 원인**: (가) 버튼이 MGButton 컴포넌트가 아니라 네이티브 `<button>`에 `mg-v2-button` 클래스만 있어, Button.css / ActionButton.css / unified-design-tokens.css의 `.mg-v2-button` 또는 `.mg-v2-button--medium` 등이 나중에 적용되며 덮어쓸 수 있음. (나) 전역·공통 스타일이 로드 순서상 뒤에 오면 동일 속성이 덮어씀. (다) 선택자 특이도가 다른 전역 규칙과 동등하거나 낮아서 우선순위에서 밀림.

**권장 스펙 (반드시 작게 보이도록 할 때)**

- **선택자 강화**: 이메일 행이 항상 `.mg-v2-form-group` 직하의 `.mg-v2-form-email-row` 안에 있으므로, **부모 그룹까지 포함**해 특이도를 높인다.  
  - 예: `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body .mg-v2-form-group .mg-v2-form-email-row .mg-v2-button.mg-v2-button--compact`  
  - 효과: 같은 모달 내 다른 `.mg-v2-button`(주소 검색·등록·취소)에는 적용되지 않고, 이메일 행 중복확인 버튼만 타깃됨.
- **고유 타깃 (선택)**: 해당 버튼만 확실히 지정하려면 **data 속성 + 클래스 조합**을 쓴다.  
  - 마크업 예: `class="mg-v2-button mg-v2-button-secondary mg-v2-button--compact" data-client-modal-action="email-duplicate-check"`  
  - 선택자 예: `.mg-modal.mg-v2-ad-b0kla [data-client-modal-action="email-duplicate-check"].mg-v2-button--compact`  
  - 코더는 이 data 속성을 붙이고, CSS는 위 선택자로 compact 크기(padding, min-height, font-size)만 지정하면 다른 규칙과 혼동 가능성이 줄어듦.
- **!important 사용**: 로드 순서나 전역 스타일을 제어하기 어렵다면, **이 한 곳에 한해** `min-height`, `padding`, `font-size`에 `!important`를 두는 것을 **권장**한다. 범위가 "이메일 행 중복확인 버튼"으로 한정되므로 유지보수 리스크가 작고, 시각적 요구사항(반드시 작게 보이기)을 보장하는 데 유리함.

**요약**: (1) 선택자에 `.mg-v2-form-group` 포함 또는 `data-client-modal-action="email-duplicate-check"` 조합으로 타깃을 좁히고, (2) 필요 시 해당 규칙에만 `min-height` / `padding` / `font-size`에 `!important`를 적용해 중복확인 버튼이 반드시 작게 보이도록 한다.

---

## 8. 이메일 자동완성 디자인 권장안

**요청**: "이메일 자동완성" 추가 시 디자인 관점 권장안 정리.

### 8.1 옵션 비교

| 옵션 | 내용 | 장점 | 단점 |
|------|------|------|------|
| **(A) 브라우저 기본** | `input`에 `autocomplete="email"` 만 사용 | 구현 부담 없음, 브라우저·OS와 일관된 UX, 접근성·비밀번호 매니저와 자연스럽게 연동 | 도메인 제안 등 커스텀 동작 없음 |
| **(B) 도메인 제안** | 로컬 입력(@ 앞) + 흔한 도메인(@gmail.com, @naver.com, @daum.net 등) 드롭다운/리스트로 제안 | 한글 사용자에게 익숙한 도메인을 빠르게 선택 가능, 입력량 감소 | 구현·테스트·유지보수 부담, 브라우저 기본과 이중 동작 시 정리 필요 |

### 8.2 권장안

- **1차 권장: (A) 브라우저 기본**  
  - 이유: 내담자 등록은 회원가입·로그인만큼 빈번하지 않고, 이미 이메일 중복확인 등 다른 인터랙션이 있어 복잡도를 올리지 않는 편이 좋음. `autocomplete="email"`만으로도 저장된 이메일·자동완성 이점을 얻을 수 있고, 디자인·코드 변경이 최소라 리스크가 적음.
- **향후 보강 시: (B) 도메인 제안**  
  - 국내 서비스 특성상 @naver.com, @daum.net, @hanmail.net, @kakao.com, @gmail.com 등 제안 수요가 있으면, (A)를 기본으로 두고 **(B)를 추가 옵션**으로 도입하는 것을 권장. 이때 (A)와 병행해도 되며, 제안 UI는 “입력 보조”로 한정해 브라우저 기본 자동완성과 역할을 나누면 됨.

### 8.3 (B) 선택 시 UI 권장

- **노출 시점**: (1) **포커스 시** 빈 입력이면 흔한 도메인 목록만 노출, (2) **`@` 입력 시** 로컬 부분(앞자리) + 도메인 목록을 함께 제안하는 방식이 자연스럽다. `@` 전에는 “앞자리”만 입력 중이므로 포커스 시에는 도메인 목록만, `@` 이후에는 입력한 문자열과 매칭되는 도메인 필터링 표시.
- **표시 형태**: input 하단 또는 인라인(이메일 행 내) **드롭다운/리스트**. B0KlA·unified-design-tokens의 서페이스·테두리·radius(예: `var(--mg-color-surface-main)`, `var(--mg-color-border-main)`, 8px radius)를 쓰고, 한 줄에 하나의 도메인(예: `userid@gmail.com` 형태로 완성 문자열 표시). 호버/포커스 시 배경만 살짝 구분.
- **접근성**: 키보드로 목록 이동·선택 가능, `Esc`로 닫기, 스크린리더용 `aria-autocomplete`, `aria-expanded`, `aria-controls` 등으로 관계 명시 권장.

---

## 7. 이메일 자동완성 마크업 권장 (core-publisher)

**목적**: 이메일 입력 시 브라우저 기본 자동완성 또는 도메인 제안을 위한 **마크업·구조**만 제안. JS/React 로직·이벤트·API 연동은 core-coder 담당.

### 7.1 (A) 브라우저 기본만

- **적용**: input에 `autocomplete="email"` 추가.
- **필요 속성**: `id`(고유, 예: `client-modal-email`), `name="email"`, `type="email"`. label의 `for` 와 input `id` 일치.
- **접근성·키보드**: 별도 마크업 없이 브라우저 기본 동작만 사용. 포커스는 input 하나만 있으면 되므로 추가 요구사항 없음.
- **정리**: 구현 비용이 가장 적고, 브라우저·비밀번호 매니저와 잘 연동되므로 **도메인 제안이 불필요하면 (A)만 적용 권장.**

### 7.2 (B) 도메인 제안 (datalist 또는 listbox)

도메인 옵션(@gmail.com, @naver.com, @daum.net, @kakao.com 등)을 제안할 때의 마크업 구조.

**옵션 1: datalist (권장)**

- **구조**: input에 `list="client-modal-email-domains"` 연결, 문서 내 `<datalist id="client-modal-email-domains">` 에 `<option value="...">` 로 도메인만 또는 로컬파트+도메인 예시 나열.
- **필요 id**: input은 기존과 동일한 고유 id(예: `client-modal-email`), datalist에 `id="client-modal-email-domains"` (같은 페이지 내 유일).
- **접근성**: `datalist` 는 브라우저가 input과 자동 연동하므로 추가 `aria-*` 는 불필요. 키보드 포커스는 input에 두면 화살표로 제안 목록 탐색 가능(UA 의존).
- **예시 마크업**:
```html
<input type="email"
       id="client-modal-email"
       name="email"
       list="client-modal-email-domains"
       autocomplete="email"
       class="mg-v2-form-input" />
<datalist id="client-modal-email-domains">
  <option value="@gmail.com"></option>
  <option value="@naver.com"></option>
  <option value="@daum.net"></option>
  <option value="@kakao.com"></option>
  <!-- 필요 시 value에 예: "user@naver.com" 형태도 가능 -->
</datalist>
```

**옵션 2: role="listbox" 커스텀 드롭다운**

- **구조**: input + 포커스/입력 시 노출되는 별도 컨테이너(`role="listbox"`), 내부에 `role="option"` 항목. input에는 `aria-controls="client-modal-email-listbox"`, `aria-expanded="true|false"`, `aria-activedescendant`(선택된 option id) 등 필요.
- **필요 id**: input id, listbox 컨테이너 id(예: `client-modal-email-listbox`), 각 option id(예: `client-modal-email-opt-gmail`).
- **접근성·키보드**: `role="listbox"` 사용 시 키보드(화살표·Enter·Esc)로 옵션 선택·닫기 구현 필요. 포커스는 input → 리스트 열림 → 옵션에 포커스 이동 또는 `aria-activedescendant` 로 “가상 포커스” 유지. 퍼블리셔는 마크업·id·aria- 구조만 제안하고, 실제 키 이벤트·포커스 이동은 core-coder가 구현.
- **정리**: 커스텀 UX·디자인이 필요할 때만 사용. 유지보수 부담이 있으므로, **퍼블리셔 권장은 (A) + (B)의 datalist** 까지로 하고, listbox는 디자인/기획에서 요구 시 검토.**

### 7.3 퍼블리셔 권장 요약

| 방식 | 권장 | 비고 |
|------|------|------|
| **(A) autocomplete="email"** | ✅ 항상 적용 | 비용 최소, 브라우저·접근성과 잘 맞음. |
| **(B) datalist** | ✅ 도메인 제안 필요 시 적용 | `list`/`id` 연결만 하면 됨. 추가 aria·키보드 규칙 최소. |
| **(B) role="listbox"** | ⚠️ 요구 시만 | id·aria-·키보드 요구사항 많음. 구현은 core-coder. |

- **id 요구사항**: input 고유 id, label `for` 와 일치. datalist 사용 시 `datalist` 에 고유 id.
- **aria 요구사항**: (A) 없음. (B) datalist 없음. (B) listbox 시 `aria-controls`, `aria-expanded`, `aria-activedescendant`, option별 id.
- **키보드**: (A) 기본 input만. (B) datalist는 UA 의존. (B) listbox는 화살표·Enter·Esc 처리 필요.
