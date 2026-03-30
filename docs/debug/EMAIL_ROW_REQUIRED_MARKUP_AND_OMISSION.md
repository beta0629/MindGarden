# 이메일 행(.mg-v2-form-email-row) 필수 마크업 및 누락 원인 후보

**역할**: core-publisher (마크업/구조 제안·정리만, 코드 수정 없음)  
**목적**: 실제 DOM에서 `div.mg-v2-form-email-row` 내부에 input·button 없이 "중복확인" 텍스트만 있을 때, **필수 자식 구조**와 **누락될 수 있는 위치**를 퍼블 관점에서 정리  
**참조**: CLIENT_MODAL_EMAIL_ROW_MARKUP_SPEC.md, CLIENT_MODAL_EMAIL_ROW_LAYOUT_SPEC.md, EMAIL_FORM_ROW_BREAKAGE_ROOT_CAUSE_ANALYSIS.md

---

## 1. `.mg-v2-form-email-row` 필수 자식 구조 (퍼블 제안)

### 1.1 상위 구조

- **form-group 직하**: `label`(형제) + `div.mg-v2-form-email-row`  
  → 다른 form-group과 동일하게 "라벨 + 제어 영역" 한 덩어리.

### 1.2 email-row 직계 자식 (필수)

| 순서 | 요소 | 클래스/역할 | 비고 |
|------|------|-------------|------|
| 1 | `div` | `mg-v2-form-email-row__input-wrap` | input만 감싸는 래퍼. flex에서 "한 칸"이 되어 남은 공간 차지. **없으면 입력란 0 너비·미노출 가능.** |
| 2 | `button` | `mg-v2-button mg-v2-button-secondary mg-v2-button--compact`, `data-action="email-duplicate-check"` | 중복확인. 형제로 래퍼 옆에 위치. |

### 1.3 __input-wrap 직계 자식 (필수)

| 요소 | 클래스/속성 | 비고 |
|------|-------------|------|
| `input` | `type="email"`, `class="mg-v2-form-input"`, `id`(label `for`와 일치) | 래퍼 안에 **반드시 1개**. |

### 1.4 트리 요약

```
div.mg-v2-form-group
  ├── label.mg-v2-form-label (for="…")
  ├── div.mg-v2-form-email-row
  │     ├── div.mg-v2-form-email-row__input-wrap   ← 필수
  │     │     └── input.mg-v2-form-input          ← 필수
  │     └── button (중복확인)                      ← 필수(등록 모드 시 권장, 수정 모드에서는 비노출 가능)
  ├── small.mg-v2-form-help (조건부)
  └── datalist (해당 시)
```

- **BEM**: 블록 `mg-v2-form-email-row`, 요소 `mg-v2-form-email-row__input-wrap`.  
- **시맨틱**: label + row 한 그룹, input은 __input-wrap 내부에만 두고 버튼은 row 직계 자식(형제).

---

## 2. 필수 클래스 정리

| 역할 | 클래스 | 필수 여부 |
|------|--------|-----------|
| 이메일 행(블록) | `mg-v2-form-email-row` | ✅ |
| 입력 래퍼(요소) | `mg-v2-form-email-row__input-wrap` | ✅ (없으면 flex에서 입력란 0 너비 가능) |
| 입력 필드 | `mg-v2-form-input` | ✅ |
| 중복확인 버튼 | `mg-v2-button mg-v2-button-secondary mg-v2-button--compact` + `data-action="email-duplicate-check"` | ✅ (등록 시; 수정 시는 비노출 가능) |

---

## 3. 해당 노드(.__input-wrap, input, button)를 생성해야 하는 컴포넌트/파일

| 파일 | 위치(행 부근) | 담당 | 비고 |
|------|----------------|------|------|
| **ClientComprehensiveManagement/ClientModal.js** | 291~318 | `renderFormContent()` 내 이메일 form-group | __input-wrap + input 항상 렌더. 버튼은 `type === 'create'`일 때만. |
| **StaffManagement.js** | 757~780 | 스태프 생성 모달 폼 | __input-wrap + input + button 모두 항상 렌더. |
| **ConsultantComprehensiveManagement.js** | 1569~1596 | 상담사 등록/수정 모달 폼 | __input-wrap + input 항상. 버튼은 `modalType === 'create'`일 때만. |
| **auth/TabletRegister.js** | 336~379 | 태블릿 회원가입 폼 | `mg-v2-form-email-row` 사용하나 **`mg-v2-form-email-row__input-wrap` 미사용** — 내부가 `div` + 인라인 스타일(`minWidth: 0`). 스펙 미준수·레이아웃 위험 구간. |

- **정리**: 어드민 모달(내담자·스태프·상담사)에서는 **반드시** `.__input-wrap` + `input` + (등록 시) `button`을 **같은 row 안에** 생성해야 함. TabletRegister는 별도 컨텍스트(인증)이나, 동일 블록 클래스를 쓰는 경우 **__input-wrap 클래스와 최소 구조**를 맞추는 것이 안전함.

---

## 4. 누락 시 원인 후보 (퍼블/구조 관점)

### 4.1 “이 row는 반드시 __input-wrap + input + button(등록 시)을 자식으로 가져야 한다”는 점

- **스펙**: `mg-v2-form-email-row`는 **항상** 직계 자식으로 `mg-v2-form-email-row__input-wrap`(그 안에 input 1개)을 두고, 등록 모드일 때는 형제로 중복확인 `button`을 둠.
- **수정 모드**: ClientModal·ConsultantComprehensiveManagement에서는 버튼만 조건부 비노출(의도). 이때도 **__input-wrap + input은 필수**.

### 4.2 현재 DOM에 input/button이 없다면 — 누락될 수 있는 위치

| 후보 | 설명 |
|------|------|
| **1. 조건부 렌더(버튼만)** | ClientModal·ConsultantComprehensiveManagement에서 **edit 모드**일 때는 **버튼만** 안 그려짐. 이 경우에는 input·__input-wrap은 있어야 함. 따라서 “중복확인만 있고 input이 없다”는 증상과는 **반대** 시나리오. |
| **2. 다른 탭/다른 JSX 경로** | ClientModal은 `renderDeleteContent()`와 `renderFormContent()`를 구분해 사용. 제공된 DOM 경로(`form.mg-v2-form` > … > `mg-v2-form-email-row`)는 **폼 안**이므로 `renderFormContent()` 경로. 해당 경로에서는 __input-wrap·input이 조건 없이 렌더됨. 즉 **현재 코드상 이 경로에서 노드 누락 분기는 없음**. |
| **3. 동일 클래스만 쓰는 다른 컴포넌트** | 다른 페이지/모달에서 `mg-v2-form-email-row` 클래스만 쓰고, **__input-wrap·input 없이** “중복확인” 텍스트만 넣은 마크업이 있다면 그곳에서 누락 발생. 현재 검색된 사용처(ClientModal, StaffManagement, ConsultantComprehensiveManagement, TabletRegister)에서는 **래퍼+input을 빼는 분기 없음**. |
| **4. TabletRegister 구조 이탈** | TabletRegister는 `mg-v2-form-email-row`를 쓰지만 **`mg-v2-form-email-row__input-wrap` 미사용**, 내부 `div`에 `minWidth: 0` 등 인라인 스타일만 사용. 여기서는 input 자체는 있으나 **스펙 미준수**이며, 유사 구조를 복사해 쓸 때 __input-wrap·input을 빼고 텍스트만 넣는 실수가 나올 수 있는 **위험 구간**. |
| **5. 하이드레이션/빌드/캐시** | React는 위 파일들에서 항상 __input-wrap + input을 렌더하므로, **실제 DOM에 없음**이 확인되면 하이드레이션 실패, 오래된 번들, 캐시된 마크업 등 **비퍼블 요인** 가능성. |
| **6. 접근성 트리/스냅샷 한계** | 제공 스냅샷이 접근성 트리이거나 일부만 캡처한 경우, 실제 Elements에는 __input-wrap·input이 있는데 **보이지 않거나 0 너비**로 나와 “없다”고 인지했을 수 있음. → **Elements 탭에서 .mg-v2-form-email-row 하위 자식 노드 존재 여부 확인 필수.** |

### 4.3 요약

- **퍼블 관점**: `.mg-v2-form-email-row`는 **항상** `.__input-wrap` > `input`을 갖고, 등록 모드에서는 형제로 `button`을 둠.
- **코드상**: ClientModal / StaffManagement / ConsultantComprehensiveManagement에서 **__input-wrap·input을 조건부로 제거하는 경로는 없음**. 따라서 “실제 DOM에 input/button이 없다”면 (가) 다른 미확인 코드 경로, (나) 하이드레이션/빌드/캐시, (다) 시각적 0 너비(실제 노드는 있음) 중 하나일 가능성이 큼.
- **점검 권장**: (1) DevTools Elements에서 `.mg-v2-form-email-row` 하위에 `.__input-wrap`·`input`·`button` 존재 여부 확인. (2) 동일 클래스를 쓰는 모든 사용처에서 **필수 자식 구조** 준수 여부 검사. (3) TabletRegister는 `mg-v2-form-email-row__input-wrap` 도입 및 `min-width: 0` 제거 검토(코더 작업).

---

## 5. HTML 구조 예시 (스펙 준수)

```html
<div class="mg-v2-form-group">
  <label for="client-modal-email" class="mg-v2-form-label">이메일 *</label>
  <div class="mg-v2-form-email-row">
    <div class="mg-v2-form-email-row__input-wrap">
      <input type="email"
             id="client-modal-email"
             name="email"
             required
             placeholder="example@email.com"
             class="mg-v2-form-input"
             autocomplete="email"
             aria-required="true" />
    </div>
    <button type="button"
            class="mg-v2-button mg-v2-button-secondary mg-v2-button--compact"
            data-action="email-duplicate-check"
            aria-label="이메일 중복 확인">
      중복확인
    </button>
  </div>
  <small class="mg-v2-form-help">…</small>
</div>
```

- 수정 모드에서는 위 `button`을 비노출해도 되며, **__input-wrap과 input은 유지**.

---

*이 문서는 core-publisher의 마크업/구조 정리이며, JS/React·CSS 수정은 하지 않습니다. 구현·수정은 core-coder가 수행합니다.*
