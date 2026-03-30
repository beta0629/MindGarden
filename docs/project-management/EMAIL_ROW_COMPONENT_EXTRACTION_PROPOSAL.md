# 이메일 행 공통 Molecules 컴포넌트 추출 제안

**역할**: core-component-manager  
**목적**: `.mg-v2-form-email-row` 사용처 전수 목록, 공통 Molecules 추출 가능 여부·장단점, 수정 위치 요약. 코드 작성 없음.  
**관련**: `EMAIL_ROW_USAGE_CONSISTENCY_REVIEW.md`(사용처·마크업 일관성 검토) 보완.

---

## 1. 이메일+중복확인 행을 쓰는 모든 화면 목록

| # | 화면/페이지 | 컴포넌트 | 파일 (절대 경로 기준) | 이메일 행 라인(대략) | 비고 |
|---|-------------|----------|------------------------|----------------------|------|
| 1 | 내담자 종합관리 | ClientModal | `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.js` | 290–318 | 등록 시에만 중복확인 버튼, `type === 'create'` |
| 2 | 스태프 관리 | StaffManagement | `frontend/src/components/admin/StaffManagement.js` | 755–779 | 항상 중복확인 버튼 |
| 3 | 상담사 종합관리 | ConsultantComprehensiveManagement | `frontend/src/components/admin/ConsultantComprehensiveManagement.js` | 1567–1592 | 등록 시에만 버튼, `modalType === 'create'` |
| 4 | 태블릿 등록(인증) | TabletRegister | `frontend/src/components/auth/TabletRegister.js` | 335–395 | **`__input-wrap` 미사용**(인라인 스타일 래퍼), 이메일 도메인 제안 `ul` 포함 |
| 5 | (테스트) | ClientModal.emailForm.test.js | `frontend/src/components/admin/ClientComprehensiveManagement/__tests__/ClientModal.emailForm.test.js` | 39–64 | `.mg-v2-form-email-row`, `__input-wrap`, 중복확인 버튼 존재 검증 |

**API·핸들러 위치 요약**

| 화면 | 중복확인 API | 핸들러 이름 | 정의 라인(대략) |
|------|----------------|-------------|------------------|
| ClientModal | `/api/v1/admin/duplicate-check/email` | `handleEmailDuplicateCheck` | ClientModal.js 38 |
| StaffManagement | `/api/v1/admin/duplicate-check/email` | `handleStaffEmailDuplicateCheck` | StaffManagement.js 220 |
| ConsultantComprehensiveManagement | `/api/v1/admin/duplicate-check/email` | `handleEmailDuplicateCheck` | ConsultantComprehensiveManagement.js 611 |
| TabletRegister | `/api/v1/auth/duplicate-check/email` | `handleEmailDuplicateCheck` / `checkEmailDuplicate` | TabletRegister.js 80, 95 |

**CSS에서만 참조하는 곳**

- **AdminDashboardB0KlA.css**: `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row` 등 — JSX에서 이메일 행을 직접 쓰지 않음. 모달 공통 스타일만 타깃.

---

## 2. 공통 Molecules 컴포넌트 추출 가능 여부

### 2.1 추출 대상

- **UI**: 라벨(선택) + `.mg-v2-form-email-row` + `.__input-wrap` + `input.mg-v2-form-input` + 중복확인 버튼(`.mg-v2-button--compact` 또는 Auth용 클래스).
- **행 밖**: help 텍스트(에러/성공/편집 불가 메시지)는 사용처마다 조건이 달라 **props 또는 children(slot)** 으로 넘기는 형태가 적합.

### 2.2 장점

| 항목 | 설명 |
|------|------|
| **마크업·구조 일관성** | `__input-wrap` 필수 사용을 한 곳에서만 보장 → DOM에 input/button 누락·깨짐 방지. |
| **스타일 단일화** | 이메일 행 관련 CSS를 컴포넌트 또는 공통 CSS 한 곳으로 모을 수 있어, B0KlA·ClientModal 간 중복 제거와 캐스케이드 충돌 감소. |
| **유지보수** | 4곳 인라인 마크업 대신 한 컴포넌트 수정으로 동일 동작·레이아웃 적용. |
| **테스트** | 공통 컴포넌트 단위 테스트로 “행 구조·접근성” 검증을 한 곳에서 수행 가능. |
| **표준 준수** | 아토믹 디자인 Molecules, 캡슐화·모듈화 스킬(반복 제거·공통 추출)에 부합. |

### 2.3 단점·고려 사항

| 항목 | 설명 |
|------|------|
| **API·컨텍스트 차이** | Admin 3곳은 `/api/v1/admin/duplicate-check/email`, TabletRegister는 `/api/v1/auth/duplicate-check/email`. 공통 컴포넌트는 “중복확인 호출”을 **콜백(props)** 으로 받는 설계가 필요. |
| **조건부 버튼** | ClientModal·Consultant는 create 시에만 버튼 노출. **`showDuplicateCheckButton`** 같은 prop으로 제어 필요. |
| **TabletRegister 전용 UI** | 이메일 도메인 제안(`ul.mg-v2-email-suggestions`)이 **행 내부**에 있음. 공통 컴포넌트는 `children` 또는 `suggestionSlot`으로 **입력 영역 내부 확장**을 허용하는 설계가 필요. |
| **버튼 클래스 차이** | 모달 3곳은 `mg-v2-button--compact`, TabletRegister는 `mg-v2-auth-email-check-btn`. **variant** prop(`'modal' | 'auth'`) 또는 **buttonClassName**으로 처리 가능. |
| **id / name / form 상태** | id(접근성·label 연결), name, value, disabled, required 등은 모두 부모 폼에서 관리하므로 **제어 컴포넌트**로 value/onChange를 props로 받는 형태가 적합. |

### 2.4 결론

- **추출 가능**: 네. 라벨 + row + input-wrap + input + 버튼을 하나의 Molecules로 묶고, API 호출·조건부 노출·도메인 제안·help 텍스트는 props/children으로 주입하면 됨.
- **추출 시 권장 위치**:  
  - **옵션 A**: `frontend/src/components/common/EmailRowWithDuplicateCheck.js` (또는 `common/molecules/EmailRowWithDuplicateCheck.js` 신설)  
  - **옵션 B**: `frontend/src/components/ui/Form/EmailRowWithDuplicateCheck.js`  
  - 프로젝트에 공통 폼 조각을 `common`에 두는 패턴이 있으므로 **옵션 A**를 우선 제안. `COMPONENT_STRUCTURE_STANDARD`·아토믹 디자인에 맞게 common 하위에 molecules 폴더를 두지 않았다면 기존 `common/` 직계에 두어도 무방.

---

## 3. 추출 시 수정 위치 요약 (core-coder 적용용)

### 3.1 신규 생성

| 대상 | 경로 |
|------|------|
| 공통 Molecules 컴포넌트 | `frontend/src/components/common/EmailRowWithDuplicateCheck.js` (또는 위 2.4 대안) |
| 전용 CSS(선택) | 동일 디렉터리 `EmailRowWithDuplicateCheck.css` 또는 디자인 시스템 공통 파일 한 곳 |

### 3.2 기존 파일에서 import·교체할 위치

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.js` | 이메일 form-group 블록(라벨+row+help 등)을 `<EmailRowWithDuplicateCheck>` 로 교체. `value`, `onChange`, `onDuplicateCheck`, `showDuplicateButton={type === 'create'}`, `disabled`, `helpText`(edit 시), `emailCheckStatus` 등 props 전달. |
| 2 | `frontend/src/components/admin/StaffManagement.js` | 동일. `createForm.email`, `handleCreateFormChange`, `handleStaffEmailDuplicateCheck`, `staffEmailCheckStatus` 등 매핑. |
| 3 | `frontend/src/components/admin/ConsultantComprehensiveManagement.js` | 동일. `formData.email`, `handleFormChange`, `handleEmailDuplicateCheck`, `showDuplicateButton={modalType === 'create'}`, `emailCheckStatus` 등 매핑. |
| 4 | `frontend/src/components/auth/TabletRegister.js` | 동일. **마크업 정렬** 포함: `__input-wrap` 사용하도록 변경하고, 도메인 제안 UI는 `children` 또는 slot으로 공통 컴포넌트에 넘기기. `variant="auth"` 또는 `buttonClassName="mg-v2-auth-email-check-btn"` 처리. |

### 3.3 CSS 정리

| 파일 | 조치 |
|------|------|
| `AdminDashboardB0KlA.css` | 이메일 행 규칙을 공통 컴포넌트용 CSS 또는 디자인 시스템 한 곳으로 이전 검토 후, 필요 시 선택자만 유지 또는 제거. |
| `ClientModal.css` | 이메일 행 관련 중복 블록 제거, 공통 규칙과 통합(`EMAIL_ROW_USAGE_CONSISTENCY_REVIEW.md` §6.1 참고). |
| `AuthPageCommon.css` | `.__input-wrap` 타깃 규칙 추가 또는 공통 이메일 행 규칙이 `.mg-v2-auth-form` 하위에도 적용되도록 확장. |

### 3.4 테스트

| 파일 | 조치 |
|------|------|
| `ClientComprehensiveManagement/__tests__/ClientModal.emailForm.test.js` | 기존: ClientModal 내부 DOM 검증. 공통 컴포넌트 도입 후에는 (1) ClientModal 테스트는 그대로 두되, 실제 DOM은 `EmailRowWithDuplicateCheck`에서 렌더되므로 셀렉터 유지 가능. (2) **추가 권장**: `common/EmailRowWithDuplicateCheck.test.js`에서 `.mg-v2-form-email-row`, `__input-wrap`, input, button 존재·접근성 검증. |

---

## 4. 문서 간 관계

- **EMAIL_ROW_USAGE_CONSISTENCY_REVIEW.md**: 사용처 목록, 표준 마크업, 사용처별 일치 여부, CSS 적용 위치, 중복·불일치 정리, 수정 적용 순서.
- **본 문서(EMAIL_ROW_COMPONENT_EXTRACTION_PROPOSAL.md)**: 사용처 **파일·라인·API·핸들러** 전수 목록, **공통 Molecules 추출** 장단점, **수정 위치** 요약(어디에서 import·교체할지).

실제 코드 반영은 **core-coder**가 수행하고, 반영 후 필요 시 component-manager가 두 문서를 갱신한다.

---

## 5. 참조

- `docs/project-management/EMAIL_ROW_USAGE_CONSISTENCY_REVIEW.md`
- `docs/design-system/CLIENT_MODAL_EMAIL_ROW_LAYOUT_SPEC.md`
- `.cursor/skills/core-solution-encapsulation-modularization/SKILL.md`
- `.cursor/skills/core-solution-atomic-design/SKILL.md`
- `docs/standards/COMPONENT_STRUCTURE_STANDARD.md`
