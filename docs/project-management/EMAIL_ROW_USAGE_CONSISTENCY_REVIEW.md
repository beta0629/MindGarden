# 이메일 행(.mg-v2-form-email-row) 사용처·일관성 검토

**역할**: core-component-manager  
**목적**: 사용처 나열, 마크업 구조 일치 여부 검토, 중복/불일치 정리 및 수정 적용 위치 제안 (코드 직접 수정 없음)  
**참조**: ClientModal.js, StaffManagement.js, ConsultantComprehensiveManagement.js, TabletRegister.js, AdminDashboardB0KlA.css, ClientModal.css, AuthPageCommon.css, CLIENT_MODAL_EMAIL_ROW_LAYOUT_SPEC.md, EMAIL_ROW_LAYOUT_PRECISE_ANALYSIS.md

---

## 1. 사용처 목록

| # | 화면/페이지 | 컴포넌트 | 파일 경로 | 이메일 행 용도 |
|---|-------------|----------|-----------|----------------|
| 1 | 내담자 종합관리 | ClientModal | `ClientComprehensiveManagement/ClientModal.js` | 등록/수정 모달 — 이메일 + 중복확인 |
| 2 | 스태프 관리 | StaffManagement | `admin/StaffManagement.js` | 새 스태프 등록 모달 — 이메일 + 중복확인 |
| 3 | 상담사 종합관리 | ConsultantComprehensiveManagement | `admin/ConsultantComprehensiveManagement.js` | 등록/수정 모달 — 이메일 + 중복확인 |
| 4 | 태블릿 등록(인증) | TabletRegister | `auth/TabletRegister.js` | 회원가입 폼 — 이메일 + 중복확인 + 도메인 제안 |
| 5 | (테스트) | ClientModal.emailForm.test.js | `ClientComprehensiveManagement/__tests__/` | 이메일 행 구조 검증용 |

**기타**: `.mg-v2-form-email-row` 검색 결과 위 4개 화면 + 테스트 1곳만 사용. 공통 컴포넌트로 추출된 이메일 행은 없음.

---

## 2. 표준 마크업 구조 (기준)

디자인 스펙·기존 디버그 문서 기준 **권장 구조**:

```
.mg-v2-form-group
  └ label.mg-v2-form-label (행 밖, 형제)
  └ .mg-v2-form-email-row
      ├ .mg-v2-form-email-row__input-wrap   ← 필수 (flex 공간 + min-width 보장)
      │   └ input.mg-v2-form-input
      └ button.mg-v2-button.mg-v2-button--compact[data-action="email-duplicate-check"] (형제)
  └ .mg-v2-form-help 등 (행 밖, 형제)
```

- **라벨**: 행 밖, `.mg-v2-form-group` 직계, 행과 형제.
- **input-wrap**: BEM 요소 클래스 `__input-wrap` 필수 — 레이아웃 깨짐 방지를 위해 래퍼가 flex 공간을 차지하고 `min-width`로 수축 방지.
- **버튼**: 행 내부, `__input-wrap`과 형제.

---

## 3. 사용처별 마크업 구조 일치 여부

### 3.1 ClientModal (ClientComprehensiveManagement)

| 항목 | 여부 | 비고 |
|------|------|------|
| `.mg-v2-form-email-row` | ✅ | 사용 |
| `.mg-v2-form-email-row__input-wrap` | ✅ | 사용 |
| input 내부 위치 | ✅ | `__input-wrap` 내부 |
| 형제 button | ✅ | `type === 'create'` 시 노출, `data-action="email-duplicate-check"`, `mg-v2-button--compact` |
| 라벨 위치 | ✅ | `.mg-v2-form-group` > label (행 밖) |
| help 텍스트 | ✅ | 행 밖, form-group 직계 |

**결론**: 표준 구조와 **일치**.

---

### 3.2 StaffManagement

| 항목 | 여부 | 비고 |
|------|------|------|
| `.mg-v2-form-email-row` | ✅ | 사용 |
| `.mg-v2-form-email-row__input-wrap` | ✅ | 사용 |
| input 내부 위치 | ✅ | `__input-wrap` 내부 |
| 형제 button | ✅ | 항상 노출, `data-action="email-duplicate-check"`, `mg-v2-button--compact` |
| 라벨 위치 | ✅ | `.mg-v2-form-group` > label (행 밖) |
| help 텍스트 | ✅ | 행 밖, form-group 직계 |

**결론**: 표준 구조와 **일치**.

---

### 3.3 ConsultantComprehensiveManagement

| 항목 | 여부 | 비고 |
|------|------|------|
| `.mg-v2-form-email-row` | ✅ | 사용 |
| `.mg-v2-form-email-row__input-wrap` | ✅ | 사용 |
| input 내부 위치 | ✅ | `__input-wrap` 내부 |
| 형제 button | ✅ | `modalType === 'create'` 시 노출, `data-action="email-duplicate-check"`, `mg-v2-button--compact` |
| 라벨 위치 | ✅ | `.mg-v2-form-group` > label (행 밖) |
| help 텍스트 | ✅ | 행 밖, form-group 직계 |

**결론**: 표준 구조와 **일치**.

---

### 3.4 TabletRegister (인증 폼)

| 항목 | 여부 | 비고 |
|------|------|------|
| `.mg-v2-form-email-row` | ✅ | 사용 |
| `.mg-v2-form-email-row__input-wrap` | ❌ | **미사용** — 대신 `<div style={{ position: 'relative', flex: 1, minWidth: 0 }}>` 사용 |
| input 내부 위치 | ⚠️ | 인라인 스타일 래퍼 내부 (BEM 클래스 없음) |
| 형제 button | ✅ | 존재, `mg-v2-button mg-v2-button-secondary mg-v2-auth-email-check-btn` (compact 대신 auth 전용 클래스) |
| 라벨 위치 | ✅ | `.mg-v2-form-group` > label (행 밖) |
| 추가 UI | ✅ | 행 내 래퍼 안에 이메일 도메인 제안 `ul.mg-v2-email-suggestions` (드롭다운) |

**결론**: 표준 구조와 **불일치**.  
- **불일치 요약**: `__input-wrap` 미사용 → 공통 CSS의 `.__input-wrap` 규칙이 적용되지 않음. AuthPageCommon.css는 `.mg-v2-form-email-row .mg-v2-form-input`에 직접 flex/min-width를 걸어 현재는 동작하나, BEM·공통 레이아웃 규칙과 불일치하여 다른 화면과 동일한 수정을 적용할 때 누락·깨짐 위험 있음.

---

## 4. CSS 적용 위치 요약

| 파일 | 적용 범위 (선택자) | 사용처 |
|------|--------------------|--------|
| **AdminDashboardB0KlA.css** | `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row`, `__input-wrap`, `.mg-v2-form-input`, `.mg-v2-button` | 모달 내부 공통 — ClientModal, StaffManagement, ConsultantComprehensiveManagement |
| **ClientModal.css** | `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body .mg-v2-form-email-row__input-wrap` 등 (더 구체적) | ClientModal 전용 오버라이드 (특이도 높음) |
| **AuthPageCommon.css** | `.mg-v2-auth-form .mg-v2-form-email-row`, `.mg-v2-form-input`, `.mg-v2-auth-email-check-btn` | TabletRegister (인증 폼) — `__input-wrap` 미타깃 |

- **ClientModal / StaffManagement**: 모달에 `mg-v2-modal-body` 사용 → ClientModal.css가 있으면 그 규칙이 B0KlA보다 우선.
- **ConsultantComprehensiveManagement**: 동일 모달 클래스 사용하나 **ClientModal.css 미로드** → B0KlA.css만 적용.
- **TabletRegister**: `mg-v2-auth-form` 하위만 타깃, `__input-wrap` 선택자 없음.

---

## 5. 중복·불일치 정리

### 5.1 중복

- **이메일 행 레이아웃 규칙이 여러 파일에 분산**
  - B0KlA: 모달 공통 (row, __input-wrap, input, button).
  - ClientModal: 동일 내용을 더 구체적인 선택자로 **중복 정의** (min-width 12rem, padding, compact 버튼 등).
- **위험**: 두 곳 수정 시 누락·값 불일치 가능. 한 곳에서만 min-width를 0이 아닌 값으로 유지해야 한다는 스펙이 이미 문서화되어 있음.

### 5.2 불일치

| 구분 | 내용 |
|------|------|
| **TabletRegister 마크업** | `__input-wrap` 미사용, 인라인 스타일 래퍼 사용 → 공통 BEM·공통 CSS와 불일치. |
| **TabletRegister 버튼 클래스** | `mg-v2-button--compact` 대신 `mg-v2-auth-email-check-btn` 단독 사용 → 공통 compact 규칙과 별개. |
| **CSS 적용 차이** | Consultant는 ClientModal.css 미로드로 B0KlA만 적용. 내담자/스태프는 ClientModal 오버라이드 적용 → 동일 모달인데 페이지별로 다른 스타일 경로. |

### 5.3 깨짐 가능성

- **모달 3곳**: `__input-wrap`의 `min-width`가 전역/유틸 등으로 0으로 덮이면 입력란 미노출 (기존 디버그 문서와 동일).
- **TabletRegister**: `__input-wrap`이 없어 공통 수정이 적용되지 않음. Auth 전용 규칙에만 의존하므로, 나중에 공통 이메일 행 스타일을 바꿀 때 누락·깨짐 가능.

---

## 6. 수정 적용 위치·순서 제안

### 6.1 공통 CSS vs 페이지별 CSS

| 우선순위 | 제안 | 이유 |
|----------|------|------|
| 1 | **이메일 행 공통 규칙 단일화** | B0KlA와 ClientModal에 흩어진 규칙을 **한 곳**(공통 컴포넌트용 CSS 또는 디자인 시스템 공통 파일)으로 모으고, `__input-wrap`의 `min-width`를 0이 아닌 값 하나만 명시. 중복 제거 시 특이도·캐스케이드 충돌 감소. |
| 2 | **모달 공통 선택자로 통일** | ClientModal 전용 오버라이드는 “ClientModal만의 차이”가 있을 때만 유지. 동일 레이아웃이면 `.mg-modal.mg-v2-ad-b0kla .mg-v2-modal-body .mg-v2-form-email-row...` 같은 **공통 선택자 한 벌**만 두고, ClientModal.css의 중복 블록은 제거 검토. |
| 3 | **Auth(TabletRegister) 구조 정렬** | TabletRegister에 `.mg-v2-form-email-row__input-wrap` 도입해 마크업을 표준과 일치시키고, AuthPageCommon.css에서 `__input-wrap`을 타깃하는 규칙 추가(또는 공통 이메일 행 규칙이 auth 폼에서도 적용되도록 범위 확장). 인라인 스타일은 제거 권장. |

### 6.2 적용 순서 권장

1. **공통 스펙 확정**  
   - `CLIENT_MODAL_EMAIL_ROW_LAYOUT_SPEC.md` 등을 기준으로 “이메일 행” 단일 스펙 확정 (row / __input-wrap / input / button, min-width 권장값).

2. **공통 CSS 정리 (모달 3곳)**  
   - AdminDashboardB0KlA.css 또는 전역 공통 파일 한 곳에 이메일 행 규칙 통합.  
   - ClientModal.css에서 동일 내용 중복 제거 후, 필요한 경우에만 최소 오버라이드 유지.  
   - 적용 순서: **B0KlA(또는 공통) 먼저 정리** → **ClientModal 중복 제거** → Consultant/Staff/Client 동일하게 공통 규칙만 적용되도록 확인.

3. **TabletRegister 마크업·CSS 정렬**  
   - `__input-wrap` 추가, 인라인 스타일 제거.  
   - AuthPageCommon.css에 `.__input-wrap` 규칙 추가하거나, 공통 이메일 행 규칙이 `.mg-v2-auth-form` 하위에도 적용되도록 선택자 확장.  
   - 버튼은 기존 `mg-v2-auth-email-check-btn` 유지해도 되나, compact와 시각적 일관성이 필요하면 공통 compact 클래스 병행 검토.

4. **공통 컴포넌트 추출 (선택)**  
   - 4곳 모두 동일한 “이메일 + 중복확인” 패턴이므로, **Molecules 수준의 공통 컴포넌트**(예: `EmailRowWithDuplicateCheck`) 추출을 검토.  
   - 추출 시 사용처는 “표준 마크업 + 표준 클래스”만 사용하게 되므로, 일관성·유지보수에 유리. (도메인 제안 등 TabletRegister 전용 기능은 props/슬롯으로 처리.)

### 6.3 요약 표

| 조치 | 대상 | 적용 위치 |
|------|------|-----------|
| 이메일 행 규칙 단일화 | 모달 3곳 | 공통 CSS(또는 B0KlA) 한 곳, ClientModal.css 중복 제거 |
| 마크업 표준화 | TabletRegister | JSX에 `__input-wrap` 추가, 인라인 스타일 제거 |
| Auth CSS 정렬 | TabletRegister | AuthPageCommon.css에 `__input-wrap` 반영 또는 공통 규칙 확장 |
| 공통 컴포넌트 추출 | 전체(선택) | common/ 또는 ui/ Molecules, 4곳에서 재사용 |

---

## 7. 참조 문서

- `docs/design-system/CLIENT_MODAL_EMAIL_ROW_LAYOUT_SPEC.md` — 레이아웃/비주얼 스펙
- `docs/debug/EMAIL_ROW_LAYOUT_PRECISE_ANALYSIS.md` — 깨짐 원인·캐스케이드 분석
- `docs/debug/EMAIL_ROW_MARKUP_ACCESSIBILITY_ANALYSIS.md` — 마크업·접근성
- `.cursor/skills/core-solution-encapsulation-modularization/SKILL.md` — 캡슐화·모듈화 원칙

---

**문서 유지**: 사용처·파일 경로·CSS 변경 시 본 문서 갱신 권장. 실제 코드 수정은 **core-coder**가 수행.
