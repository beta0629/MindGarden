# 비밀번호 초기화 모달 디자인 스펙 (B0KlA 일관 적용)

**버전**: 1.0.0  
**최종 업데이트**: 2025-02-26  
**기준**: `MAPPING_MODALS_DESIGN_SPEC.md`, ClientModal/ConsultantTransferModal 폼 패턴, UnifiedModal  
**적용 대상**: `frontend/src/components/admin/PasswordResetModal.js`

---

## 1. 목적 및 일관성 원칙

- **다른 어드민 모달과 동일한 비주얼·클래스**를 사용한다.
- **UnifiedModal** + **B0KlA 클래스**(`mg-v2-ad-b0kla`, `mg-v2-modal-*`, `mg-v2-form-*`, `mg-v2-button-*`)만 사용하며, `mg-password-reset-*`, `mg-form-*`, `mg-input-*` 등 레거시 클래스는 제거한다.
- core-coder는 이 스펙의 **마크업·클래스명을 그대로** 적용하면 된다.

---

## 2. UnifiedModal props 및 래퍼

| prop | 값 | 비고 |
|------|-----|------|
| `isOpen` | `!!user` | 기존 유지 |
| `onClose` | `onClose` | 기존 유지 |
| `title` | `"비밀번호 초기화"` | 기존 유지 |
| `size` | `"medium"` | 기존 유지 (MappingEditModal, PaymentConfirmationModal과 동일) |
| `backdropClick` | `true` | 기존 유지 |
| `showCloseButton` | `true` | 기존 유지 |
| **`className`** | **`"mg-v2-ad-b0kla"`** | **필수 추가.** 오버레이·모달 컨테이너 모두에 적용되어 B0KlA 스타일 적용 (MappingDetailModal, MappingEditModal, ConsultantTransferHistory, PartialRefundModal 등과 동일) |
| `actions` | 푸터 버튼 (아래 5절) | MGButton 대신 `<button>` + 클래스 또는 MGButton에 className 부여 |

- **모달 전체 래퍼**: UnifiedModal이 이미 `mg-modal`, `mg-modal--medium`을 적용하고, `className="mg-v2-ad-b0kla"`로 B0KlA 스코프가 붙는다. 별도 래퍼 div는 **바디 내부**에만 사용(안내 문구 + 폼 묶음용).

---

## 3. 바디 내부 구조

바디는 UnifiedModal의 `mg-modal__body` 안에 직접 넣는다. 구조는 아래 순서를 따른다.

### 3.1 안내 문구 영역

- **클래스**: `mg-v2-info-box mg-v2-ad-b0kla-info-box`
- **내부**: 아이콘(선택) + 문단. 문단 텍스트에는 **`mg-v2-info-text`** 적용.
- **참조**: ClientModal의 "비밀번호를 입력하지 않으면…" 박스, PartialRefundModal의 `mg-v2-ad-b0kla__card mg-v2-info-box`, ConsultantTransferModal의 `mg-v2-ad-b0kla__card mg-v2-info-box`.

**마크업 예시 (JSX에서는 `class` → `className`):**

```html
<div class="mg-v2-info-box mg-v2-ad-b0kla-info-box">
  <p class="mg-v2-info-text">
    <strong>{userName}</strong> {userTypeLabel}의 비밀번호를 초기화합니다.
  </p>
  <p class="mg-v2-info-text">
    새 비밀번호는 최소 8자 이상이며, 영문과 숫자를 포함해야 합니다.
  </p>
</div>
```

- 기존 `AlertTriangle` 아이콘은 유지해도 되며, 넣을 경우 `mg-v2-info-box` 내부 맨 앞에 두고, 필요 시 `mg-v2-info-text`와 간격(gap/margin)만 맞추면 된다.

### 3.2 폼 영역

- **form 요소**: `id="admin-password-reset-form"` 유지, **클래스**: `mg-v2-form`
- **필드 그룹**: `mg-v2-form-group`
- **라벨**: `mg-v2-form-label`, `htmlFor`로 input id와 연결
- **입력 필드**: `mg-v2-form-input`. 에러 시 **추가 클래스** `mg-v2-form-input-error` (ConsultantTransferModal과 동일. `unified-design-tokens.css`의 `mg-v2-form-input--error`와 동일 용도이나, 어드민 B0KlA 모달에서는 `mg-v2-form-input-error` 사용)
- **에러 메시지**: 필드 아래 `<span class="mg-v2-form-error">` (ConsultantTransferModal, MappingEditModal과 동일)

**마크업 예시 (새 비밀번호 한 필드, JSX에서는 class→className, for→htmlFor):**

```html
<form id="admin-password-reset-form" className="mg-v2-form" onSubmit={handleSubmit}>
  <div className="mg-v2-form-group">
    <label htmlFor="newPassword" className="mg-v2-form-label">새 비밀번호</label>
    <div className="mg-v2-form-input-wrapper">
      <input
        type={showPassword ? 'text' : 'password'}
        id="newPassword"
        className={`mg-v2-form-input ${errors.newPassword ? 'mg-v2-form-input-error' : ''}`}
        ...
      />
      <button type="button" class="mg-v2-form-input-toggle" aria-label="..." ...>
        <!-- Eye / EyeOff (lucide-react) -->
      </button>
    </div>
    {errors.newPassword && <span className="mg-v2-form-error">{errors.newPassword}</span>}
  </div>
  <!-- 비밀번호 확인 필드 동일 패턴 -->
</form>
```

- **제거할 클래스**: `mg-password-reset-form-wrapper`, `mg-password-reset-info`, `mg-password-reset-form`, `mg-form-group`, `mg-form-label`, `mg-input-wrapper`, `mg-input`, `mg-input-error`, `mg-form-error`, `mg-info-icon`, `mg-info-text`.

---

## 4. 비밀번호 보기 토글 버튼

- **래퍼**: 비밀번호 input과 토글을 감쌀 컨테이너 — **`mg-v2-form-input-wrapper`**
- **토글 버튼**: **`mg-v2-form-input-toggle`**
- 어드민 폼에서 비밀번호 토글이 있는 기존 패턴은 **SystemConfigManagement**(Eye/EyeOff) 정도이며, 공통 클래스는 없음. 따라서 **mg-v2-* 로 정의**해 다른 어드민 폼에서도 재사용 가능하게 한다.

| 클래스 | 용도 |
|--------|------|
| `mg-v2-form-input-wrapper` | `display: flex`, input은 flex:1, 토글 버튼은 오른쪽 고정. border/radius는 input과 한 덩어리처럼 보이도록 (기존 mg-input-wrapper와 동일한 역할) |
| `mg-v2-form-input-toggle` | 비밀번호 보기/숨기기 버튼. 아이콘만 보이게, 배경/테두리 B0KlA 톤 (`--ad-b0kla-border`, `--ad-b0kla-text-secondary`). 크기 약 36×36px 또는 input 높이와 동일 |

- **아이콘**: emoji 대신 **lucide-react** `Eye` / `EyeOff` 사용 (다른 B0KlA 모달과 통일).

---

## 5. 액션 버튼 (푸터)

- **취소**: **`mg-v2-button mg-v2-button-secondary`**
- **비밀번호 초기화(확인)**: **`mg-v2-button mg-v2-button-primary`**

프로젝트에서 MappingEditModal, PaymentConfirmationModal, ConsultantTransferHistory, MappingDetailModal 등은 **네이티브 `<button>`**에 위 클래스를 직접 부여한다. MGButton을 유지할 경우, **시각적으로 동일**하게 하려면 `className="mg-v2-button mg-v2-button-secondary"` / `className="mg-v2-button mg-v2-button-primary"`를 넘기고, MGButton 내부가 해당 클래스를 최종 button에 붙이도록 한다. **권장**: 다른 어드민 모달과 완전 일치를 위해 `<button type="button" className="mg-v2-button mg-v2-button-secondary">취소</button>`, `<button type="submit" form="admin-password-reset-form" className="mg-v2-button mg-v2-button-primary">비밀번호 초기화</button>` 사용. 로딩/disabled 처리는 기존 로직 유지.

---

## 6. (선택) 전용 CSS 파일

- **파일명**: `frontend/src/components/admin/PasswordResetModal.css`
- **용도**: 비밀번호 필드 **래퍼·토글**용. `mg-v2-form-input-wrapper`, `mg-v2-form-input-toggle`가 프로젝트 공통(unified-design-tokens.css 또는 AdminDashboardB0KlA.css)에 없으면 여기 정의.

**정의할 클래스 (없을 경우만):**

| 클래스 | 내용 |
|--------|------|
| `.mg-v2-form-input-wrapper` | display: flex; align-items: center; border/radius는 기존 mg-v2-form-input과 동일하게 맞춰 한 덩어리처럼 보이게. input은 flex: 1; border-right: 0 등으로 토글과 시각적 연결 |
| `.mg-v2-form-input-wrapper .mg-v2-form-input` | border-radius: 오른쪽 0 등 (래퍼와 함께 하나의 입력란처럼) |
| `.mg-v2-form-input-toggle` | padding 8px 12px, border 1px solid var(--ad-b0kla-border), border-left: 0, border-radius 0 var(--ad-b0kla-radius-sm) var(--ad-b0kla-radius-sm) 0, background var(--ad-b0kla-card-bg), color var(--ad-b0kla-text-secondary). cursor pointer. (좌측은 input과 맞닿아 있음) |

- B0KlA 모달 공통 스타일(헤더·바디·푸터·버튼)은 **MappingCreationModal.css / AdminDashboardB0KlA.css**에서 이미 `.mg-modal.mg-v2-ad-b0kla`로 적용되므로, PasswordResetModal.css에서는 **비밀번호 래퍼·토글만** 넣으면 된다.  
- 혹은 **AdminDashboardB0KlA.css**에 `.mg-v2-form-input-wrapper`, `.mg-v2-form-input-toggle`를 공통으로 추가하고, PasswordResetModal.css는 두지 않아도 된다 (다른 어드민 폼에서 비밀번호 토글 재사용 시 유리).

---

## 7. 클래스 매핑 요약 (기존 → 변경)

| 기존 (PasswordResetModal.js) | 변경 후 |
|------------------------------|---------|
| (래퍼 없음) | UnifiedModal에 `className="mg-v2-ad-b0kla"` |
| `mg-password-reset-form-wrapper` | 제거. 바디 직하위에 안내 박스 + form |
| `mg-password-reset-info` | `mg-v2-info-box mg-v2-ad-b0kla-info-box` |
| `mg-info-icon` | 유지해도 됨 (필요 시 margin-right 등만 조정) |
| `mg-info-text` | `mg-v2-info-text` |
| `mg-password-reset-form` | `mg-v2-form` |
| `mg-form-group` | `mg-v2-form-group` |
| `mg-form-label` | `mg-v2-form-label` |
| `mg-input-wrapper` | `mg-v2-form-input-wrapper` |
| `mg-input`, `mg-input-error` | `mg-v2-form-input`, 에러 시 `mg-v2-form-input-error` |
| `mg-input-toggle` | `mg-v2-form-input-toggle` |
| `mg-form-error` | `mg-v2-form-error` |
| MGButton variant="secondary" | `mg-v2-button mg-v2-button-secondary` (button 또는 MGButton+className) |
| MGButton variant="primary" | `mg-v2-button mg-v2-button-primary` |

---

## 8. 참조 파일

| 파일 | 용도 |
|------|------|
| `docs/design-system/MAPPING_MODALS_DESIGN_SPEC.md` | B0KlA 모달 구조, 버튼·섹션 클래스 |
| `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.js` | mg-v2-form, mg-v2-form-group, mg-v2-form-label, mg-v2-form-input, mg-v2-info-box, mg-v2-ad-b0kla-info-box |
| `frontend/src/components/admin/mapping/ConsultantTransferModal.js` | mg-v2-form-error, mg-v2-form-input-error, mg-v2-ad-b0kla__card mg-v2-info-box |
| `frontend/src/components/admin/MappingEditModal.js` | UnifiedModal className="mg-v2-ad-b0kla", 푸터 button 클래스 |
| `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css` | mg-v2-ad-b0kla-info-box, mg-v2-button-* B0KlA 오버라이드 |
| `frontend/src/styles/unified-design-tokens.css` | mg-v2-form-input, mg-v2-form-error, mg-v2-form-input--error 참고 |

---

## 9. 구현 체크리스트

| # | 항목 |
|---|------|
| 1 | UnifiedModal에 `className="mg-v2-ad-b0kla"` 적용 |
| 2 | 안내 문구 영역: `mg-v2-info-box mg-v2-ad-b0kla-info-box`, 문단 `mg-v2-info-text` |
| 3 | form: `mg-v2-form`, 그룹 `mg-v2-form-group`, 라벨 `mg-v2-form-label`, input `mg-v2-form-input` |
| 4 | 에러: input에 `mg-v2-form-input-error`, 메시지 `mg-v2-form-error` |
| 5 | 비밀번호 필드: 래퍼 `mg-v2-form-input-wrapper`, 토글 `mg-v2-form-input-toggle`, 아이콘 Eye/EyeOff (lucide-react) |
| 6 | 푸터: 취소 `mg-v2-button mg-v2-button-secondary`, 확인 `mg-v2-button mg-v2-button-primary` |
| 7 | 레거시 클래스 제거: mg-password-reset-*, mg-form-*, mg-input-*, mg-info-* (위 표 기준) |

이 스펙대로 마크업/클래스만 적용하면 다른 어드민 모달과 동일한 비주얼·구조를 갖는다.
