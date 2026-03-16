# 이메일 오토필·자동완성 코어 컴포넌트 기획

> 기획서·분배실행 표. 코드 수정은 core-coder만 수행.

## 1. 목표·요구

- **이메일 오토필/자동완성** 기능을 **재사용 가능한 코어 컴포넌트**로 추출한다.
- **core-component-manager**로 코어 컴포넌트 관점 검토(중복 제거, 적재적소 배치, 네이밍).
- **전체 적용**: 이메일 입력이 들어가는 모든 화면(내담자·상담사·스태프·태블릿 회원가입·기타 폼)에 해당 컴포넌트를 적용한다.
- 설계·마크업·구현은 디자이너·퍼블리셔·코더 서브에이전트 분배 후, **core-coder**가 컴포넌트 구현 및 사용처 교체를 수행한다.

## 2. 현재 상태 (사용자 제공·grep 정리)

- **DOM**: `div.mg-v2-form-email-row` > `div.mg-v2-form-email-row__input-wrap` > `input#email` (type="email", placeholder, autocomplete="email", list="client-modal-email-domains") + `<datalist id="client-modal-email-domains">`.
- **.mg-v2-form-email-row 사용처**: ClientModal.js, StaffManagement.js, ConsultantComprehensiveManagement.js, TabletRegister.js.
- **이메일 datalist(도메인 자동완성)**: ClientModal.js에서만 `client-modal-email-domains` 사용 확인. 나머지 화면은 동일 행 마크업만 쓸 수 있어 추가 조사 필요.
- **type="email" 사용처**: 다수(로그인, 회원가입, 프로필, 내담자/상담사/스태프 모달, 위젯 등). 자동완성(datalist) 적용 여부는 Phase 1 조사 결과에 따름.

## 3. 범위

| 포함 | 제외 |
|------|------|
| 이메일 input + 자동완성(datalist 또는 커스텀 드롭다운) 사용처 전수 | 이메일이 아닌 다른 datalist(예: SystemConfigManagement 모델 preset) |
| 코어 컴포넌트 생성·위치·네이밍 제안 | 기존 API·백엔드 변경(필요 시 별도 Phase) |
| 내담자·상담사·스태프·태블릿 회원가입·기타 이메일 폼 전체 적용 | |

## 4. 의존성·순서

1. **Phase 1 (core-component-manager)**: 사용처 전수 조사·코어 컴포넌트 제안 → 이후 Phase의 입력.
2. **Phase 2·3 (선택, 병렬 가능)**: core-designer(UI 스펙 1페이지), core-publisher(마크업 스펙 1페이지).
3. **Phase 4 (기획)**: 위 결과 취합 → 태스크 목록·core-coder 전달문 정리.
4. **Phase 5 (core-coder)**: 코어 컴포넌트 구현 + 사용처 전체 교체.

## 5. 리스크·제약

- 기존 `.mg-v2-form-email-row` 및 B0KlA·Auth 스타일과의 호환 유지.
- 접근성(label, id, aria-*), MindGarden 코드 스타일 준수.
- 코드 수정은 **core-coder만** 수행(플래너/컴포넌트매니저/디자이너/퍼블리셔는 설계·제안·문서만).

---

## 6. 분배실행 (역할별 실행 분배)

### Phase 1 — 코어 컴포넌트 검토 (선행)

| 항목 | 내용 |
|------|------|
| **담당** | **core-component-manager** |
| **목표** | 이메일 input + 자동완성 사용처 전수 조사, 코어 컴포넌트 이름·위치·기존 이메일 행과의 관계 제안. 코드 작성 없음. |
| **전달 프롬프트** | 아래 "Phase 1 전달문" 참조. |

### Phase 2 — 이메일 자동완성 UI 스펙 (선택, Phase 1과 병렬 불가)

| 항목 | 내용 |
|------|------|
| **담당** | **core-designer** |
| **목표** | 이메일 자동완성 UI 스펙 1페이지(placeholder, datalist 스타일, 접근성, B0KlA 스타일 유지). 코드 작성 없음. |
| **전달 프롬프트** | 아래 "Phase 2 전달문" 참조. |

### Phase 3 — 이메일 필드 필수 마크업 스펙 (선택, Phase 2와 병렬 가능)

| 항목 | 내용 |
|------|------|
| **담당** | **core-publisher** |
| **목표** | 코어 이메일 자동완성 컴포넌트 필수 마크업 1페이지(input + list/datalist, label, id, aria-*). 코드 작성 없음. |
| **전달 프롬프트** | 아래 "Phase 3 전달문" 참조. |

### Phase 4 — 기획 취합·태스크 목록

| 항목 | 내용 |
|------|------|
| **담당** | **core-planner** (기획) |
| **목표** | Phase 1(및 2·3) 결과 취합 → 컴포넌트 파일 경로·props·사용처 목록·교체 방법 정리 → core-coder 전달문 작성. |

### Phase 5 — 구현 및 전체 적용

| 항목 | 내용 |
|------|------|
| **담당** | **core-coder** |
| **목표** | 코어 이메일 오토필/자동완성 컴포넌트 구현 + 사용처 전체 교체. MindGarden 코드 스타일·컴포넌트매니저·디자이너/퍼블리셔 스펙 준수. |
| **전달 프롬프트** | Phase 4에서 작성한 태스크 목록·전달문 전체. |

---

## 7. Phase별 전달문 (서브에이전트 호출 시 사용)

### Phase 1 전달문 (core-component-manager)

```
[컨텍스트]
- MindGarden 프로젝트에서 이메일 input + 자동완성(datalist 또는 커스텀 드롭다운)을 코어 컴포넌트로 추출하려고 합니다.
- 현재: div.mg-v2-form-email-row > div.mg-v2-form-email-row__input-wrap > input#email (type="email", list="client-modal-email-domains") + datalist 가 ClientModal 등에서 사용 중입니다. StaffManagement, ConsultantComprehensiveManagement, TabletRegister 등에도 .mg-v2-form-email-row 가 있습니다.

[요청]
1. 프로젝트(frontend) 내 "이메일 input + 자동완성(datalist 또는 커스텀 드롭다운)" 사용처를 전수 조사해 목록으로 정리해 주세요. (파일 경로, 컴포넌트명, 현재 마크업 요약)
2. 코어 컴포넌트로 만들 때 이름 제안(예: EmailInputWithAutocomplete, MgEmailField 등)과 위치 제안(예: frontend/src/components/common/ 또는 ui/)을 해 주세요. 아토믹 디자인·프로젝트 구조를 고려해 주세요.
3. 기존 "이메일 행"(.mg-v2-form-email-row)과의 관계를 정리해 주세요: "이메일 행이 이 코어 컴포넌트를 포함한다" vs "이메일 행과 별도로 두고 행은 레이아웃만 담당" 등.
4. 중복 제거·적재적소 배치·네이밍 규칙 관점에서 짧은 제안을 포함해 주세요.

코드 작성·수정은 하지 마세요. 조사·제안·문서만 수행해 주세요. 결과를 기획(core-planner)에게 보고해 주세요.
```

### Phase 2 전달문 (core-designer, 선택)

```
[컨텍스트]
- MindGarden에서 이메일 오토필/자동완성 기능을 코어 컴포넌트로 추출합니다. 기존 .mg-v2-form-email-row 및 B0KlA·unified-design-tokens를 유지해야 합니다.

[요청]
이메일 자동완성 UI 스펙을 1페이지 분량으로 제안해 주세요. 포함할 항목:
- placeholder, datalist 노출 스타일(또는 네이티브 datalist 사용 시 제약)
- 접근성(포커스, 키보드, 스크린리더)
- B0KlA·unified-design-tokens.css 참조
코드 작성 없음. 산출물은 docs/design-system/ 또는 docs/project-management/ 에 저장 가능한 형태로. 결과를 기획(core-planner)에게 보고해 주세요.
```

### Phase 3 전달문 (core-publisher, 선택)

```
[컨텍스트]
- MindGarden에서 이메일 오토필/자동완성 코어 컴포넌트의 필수 마크업을 정리합니다.

[요청]
컴포넌트 필수 마크업을 1페이지 분량으로 제안해 주세요. 포함할 항목:
- input + list/datalist 연결, label, id, name
- aria-* 속성(접근성)
- BEM·시맨틱 HTML 관점
코드 작성 없음. 산출물은 docs/design-system/ 또는 docs/project-management/ 에 저장 가능한 형태로. 결과를 기획(core-planner)에게 보고해 주세요.
```

---

## 8. 단계별 완료 기준·체크리스트

- **Phase 1**: 사용처 목록·컴포넌트 이름/위치 제안·이메일 행과의 관계 정리가 문서로 보고됨.
- **Phase 2(선택)**: 이메일 자동완성 UI 스펙 1페이지가 보고됨.
- **Phase 3(선택)**: 이메일 필드 필수 마크업 스펙 1페이지가 보고됨.
- **Phase 4**: 태스크 목록·core-coder 전달문(파일 경로, props, 사용처 목록, 교체 방법)이 정리됨.
- **Phase 5**: (1) 코어 컴포넌트 파일(및 필요 CSS) 생성, (2) 사용처 전체 교체 완료, (3) 필요 시 docs/project-management/EMAIL_AUTOCOMPLETE_COMPONENT_SPEC.md 에 스펙·사용처 목록 정리.

---

## 9. 산출물

- 코어 컴포넌트 파일(예: EmailInputWithAutocomplete.js 또는 MgEmailField.js) 및 필요한 CSS.
- 사용처 교체 완료(내담자·상담사·스태프·태블릿 등).
- 필요 시 `docs/project-management/EMAIL_AUTOCOMPLETE_COMPONENT_SPEC.md` 에 스펙·사용처 목록 정리.

---

## 10. Phase 1 결과 (core-component-manager 보고)

> 전수 조사·제안만 수행. 코드 수정 없음. 기획(core-planner) 취합용.

### 10.1 이메일 input + 자동완성 사용처 전수 조사

#### A. 이메일 행(.mg-v2-form-email-row) + 자동완성 사용처 (우선 적용 대상)

| # | 파일 경로 | 컴포넌트/위치 | 자동완성 방식 | 현재 마크업 요약 |
|---|-----------|---------------|---------------|------------------|
| 1 | `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.js` | ClientModal (내담자 모달) | **datalist** `id="client-modal-email-domains"` | `div.mg-v2-form-email-row` > `div.mg-v2-form-email-row__input-wrap` > `input` (type=email, list=client-modal-email-domains) + `<datalist>` 옵션 @gmail.com, @naver.com 등. 동일 행에 중복확인 버튼. |
| 2 | `frontend/src/components/admin/StaffManagement.js` | 스태프 생성 모달 폼 | **없음** | 동일 행 구조(`.mg-v2-form-email-row` > `__input-wrap` > input). `list`/datalist 없음. 중복확인 버튼 있음. |
| 3 | `frontend/src/components/admin/ConsultantComprehensiveManagement.js` | 상담사 모달 폼 | **없음** | 동일 행 구조. `list`/datalist 없음. create 시 중복확인 버튼 있음. |
| 4 | `frontend/src/components/auth/TabletRegister.js` | 태블릿 회원가입 폼 | **커스텀 드롭다운** | `div.mg-v2-form-email-row` > `div(relative)` > `input` + `ul.mg-v2-email-suggestions` (role=listbox), `EMAIL_DOMAINS` 상수로 도메인 목록. 중복확인 버튼. 스타일: AuthPageCommon.css `.mg-v2-email-suggestions` |

#### B. 이메일만 사용(자동완성·이메일 행 미사용) — 적용 여부는 Phase 4에서 결정

| # | 파일 경로 | 비고 |
|---|-----------|------|
| 5 | `frontend/src/components/consultant/ClientDetailModal.js` | mg-v2-form-group > label + input(type=email). 행/자동완성 없음. |
| 6 | `frontend/src/components/consultant/ClientInfoModal.js` | 동일. placeholder="email@example.com". |
| 7 | `frontend/src/components/dashboard/widgets/consultation/ConsultantRegistrationWidget.js` | form-group > form-control (type=email). 위젯 전용 클래스. |
| 8 | `frontend/src/components/dashboard/widgets/consultation/ClientRegistrationWidget.js` | 동일. |
| 9 | `frontend/src/components/auth/BranchLogin.js`, `UnifiedLogin.js`, `BranchSpecificLogin.js`, `HeadquartersLogin.js`, `TabletLogin.js`, `ForgotPassword.js` | 로그인/비밀번호 찾기 — 단순 email input. |
| 10 | `frontend/src/components/auth/SocialSignupModal.js`, `AccountIntegrationModal.js` | 계정 연동/소셜 가입. |
| 11 | `frontend/src/components/mypage/ProfileEdit.js`, `ProfileSection.js`, `PasswordResetModal.js` | 마이페이지·프로필. |
| 12 | `frontend/src/components/academy/AcademyRegister.js`, `landing/CounselingContact.js`, `common/SalaryExportModal.js`, `admin/ConsultantManagement.js`, `mindgarden/FormShowcase.js`, `pages/AdvancedDesignSample.js`, `test/UnifiedModalTest.js` | 기타 — type=email 단순 입력. |

#### C. 이메일 datalist 아님 (참고만, 범위 제외)

- `frontend/src/components/admin/SystemConfigManagement.js`: `<datalist>` 사용처는 **모델 프리트**(OpenAI/Gemini)용. 이메일 자동완성과 무관.

#### D. 스타일 정의 위치

- `.mg-v2-form-email-row`, `__input-wrap`, 행 내 버튼: `AdminDashboardB0KlA.css`, `AuthPageCommon.css`
- `.mg-v2-email-suggestions`, `.mg-v2-email-suggestion-item`: `AuthPageCommon.css` (TabletRegister 커스텀 드롭다운 전용)

---

### 10.2 코어 컴포넌트 이름·위치 제안

| 항목 | 제안 |
|------|------|
| **이름** | **MgEmailFieldWithAutocomplete** (또는 **MgEmailField**). 프로젝트가 `mg-v2-*`·B0KlA 토큰을 쓰므로 `Mg` 접두사 권장. "WithAutocomplete"는 자동완성 포함을 명시. |
| **위치** | `frontend/src/components/common/MgEmailFieldWithAutocomplete.js` (및 동일 경로 `.css` 필요 시). 아토믹 디자인상 Label+Input+자동완성 UI 조합은 **Molecule**에 해당하나, 현재 프로젝트는 `molecules/` 폴더 없이 `common/`에 FormInput·BadgeSelect·CustomSelect 등 재사용 폼 요소가 있으므로 **common/** 배치 제안. |
| **계층** | Molecule (Atom 아님). input 단일이 아니라 "이메일 필드 + 자동완성" 단위이므로. |

---

### 10.3 기존 "이메일 행"(.mg-v2-form-email-row)과의 관계

| 제안 | 설명 |
|------|------|
| **이메일 행이 코어 컴포넌트를 포함한다** | **권장.** `.mg-v2-form-email-row`는 **레이아웃 전용**으로 유지: "input 영역 + (선택) 중복확인 버튼"을 한 줄에 배치하는 래퍼. 코어 컴포넌트는 **이메일 input + 자동완성(datalist 또는 커스텀 드롭다운)** 만 담당하고, **행 안에** 코어 컴포넌트를 넣어 사용. |
| 구조 예시 | `div.mg-v2-form-email-row` > `div.mg-v2-form-email-row__input-wrap` > `<MgEmailFieldWithAutocomplete ... />` + (선택) 중복확인 버튼. |
| 단일 책임 | 행 = 레이아웃·버튼 배치. 코어 컴포넌트 = 입력·자동완성·접근성. |

---

### 10.4 중복 제거·적재적소 배치·네이밍 짧은 제안

| 관점 | 제안 |
|------|------|
| **도메인 목록 중복** | ClientModal의 datalist 옵션(@gmail.com 등)과 TabletRegister의 `EMAIL_DOMAINS` 상수가 동일. 코어 컴포넌트에서 **도메인 목록 상수 1곳**으로 통합(예: common/constants/emailDomains.js 또는 컴포넌트 내 상수). |
| **자동완성 방식 통일** | 한 코어 컴포넌트에서 **mode** prop으로 `"datalist"` \| `"custom-dropdown"` 지원 시, ClientModal(datalist)·TabletRegister(커스텀) 모두 대체 가능. 구현은 core-coder가 선택. |
| **CSS** | `.mg-v2-email-suggestions` 등 커스텀 드롭다운 스타일은 코어 컴포넌트 전용 CSS(예: MgEmailFieldWithAutocomplete.css)로 이전. AuthPageCommon.css·B0KlA에서 행 레이아웃만 유지. |
| **네이밍** | `Mg` + 기능명. 내부 BEM은 `.mg-email-field`, `.mg-email-field__input-wrap` 등 새 블록으로 정리하고, 기존 `.mg-v2-form-email-row`는 **행 레이아웃용**으로만 유지. |
| **우선 적용** | A그룹(ClientModal, StaffManagement, ConsultantComprehensiveManagement, TabletRegister) 4곳 먼저 코어 컴포넌트 교체. B그룹(나머지 이메일 input)은 Phase 4에서 자동완성 적용 여부 결정 후 필요 시 확대. |

---

**Phase 1 완료.** 기획(core-planner)은 위 결과를 취합해 Phase 2·3 호출 여부를 정하고, Phase 4 태스크 목록·core-coder 전달문 작성 시 본 섹션을 입력으로 사용하면 됩니다.

---

---

## 11. Phase 4 — 기획 취합·태스크 목록 및 core-coder 전달문

> Phase 1·2·3 결과를 취합해 core-coder가 실행할 태스크와 전달문을 정리함.

### 11.1 참조 문서

| 문서 | 용도 |
|------|------|
| **§10 (본 문서)** | 사용처 전수, 컴포넌트 이름·위치, 이메일 행과의 관계, 중복 제거 제안 |
| **docs/design-system/EMAIL_AUTOCOMPLETE_UI_SPEC.md** | UI 스펙(placeholder, datalist/커스텀 스타일, 접근성, B0KlA·토큰) |
| **docs/design-system/MG_EMAIL_FIELD_WITH_AUTOCOMPLETE_MARKUP_SPEC.md** | 필수 마크업(input+list/datalist, label, id, name, aria-*, BEM) |

### 11.2 컴포넌트 생성 태스크

| 항목 | 내용 |
|------|------|
| **파일 경로** | `frontend/src/components/common/MgEmailFieldWithAutocomplete.js` (및 필요 시 `MgEmailFieldWithAutocomplete.css`) |
| **Props** | value, onChange, placeholder(기본 `example@email.com`), disabled, id, name, required, options/domains(도메인 목록), autocompleteMode(`"datalist"` \| `"custom-dropdown"`), label(선택), ariaDescribedBy, ariaInvalid 등. 기존 행에서 쓰던 id/name/중복확인 버튼은 사용처에서 유지. |
| **도메인 목록** | ClientModal·TabletRegister 등에서 쓰던 도메인 목록을 **상수 1곳**으로 통합(예: `frontend/src/constants/emailDomains.js` 또는 컴포넌트 내). |
| **마크업·스타일** | `MG_EMAIL_FIELD_WITH_AUTOCOMPLETE_MARKUP_SPEC.md`, `EMAIL_AUTOCOMPLETE_UI_SPEC.md` 준수. BEM 블록 `mg-v2-email-field`. |
| **관계** | 이메일 행(`.mg-v2-form-email-row`)은 **레이아웃만** 담당. 행 내부 `__input-wrap` 안에 `<MgEmailFieldWithAutocomplete />` 배치. |

### 11.3 사용처 교체 목록 (우선 적용 A그룹 4곳)

| # | 파일 | 교체 방법 |
|---|------|-----------|
| 1 | **ClientModal.js** | 기존 `div.mg-v2-form-email-row` > `__input-wrap` 내부의 input + datalist를 `<MgEmailFieldWithAutocomplete />`로 교체. list id·domains는 코어 컴포넌트/상수 사용. |
| 2 | **StaffManagement.js** | 동일 행 구조 내부 input을 `<MgEmailFieldWithAutocomplete />`로 교체. 자동완성(datalist 또는 custom-dropdown) 적용. |
| 3 | **ConsultantComprehensiveManagement.js** | 동일. 행 내부 input을 코어 컴포넌트로 교체. |
| 4 | **TabletRegister.js** | 기존 `ul.mg-v2-email-suggestions` + EMAIL_DOMAINS 로직을 제거하고 `<MgEmailFieldWithAutocomplete autocompleteMode="custom-dropdown" />` 등으로 교체. |

### 11.4 B그룹(이메일만 사용·행/자동완성 없음)

- Phase 5 범위에서는 **A그룹 4곳만** 교체. B그룹(ClientDetailModal, ClientInfoModal, 로그인, 마이페이지 등)은 필요 시 별도 Phase에서 자동완성 적용 여부 결정 후 확대.

### 11.5 완료 기준

- MgEmailFieldWithAutocomplete.js(및 필요 CSS) 생성, 상수(도메인 목록) 통합.
- ClientModal, StaffManagement, ConsultantComprehensiveManagement, TabletRegister 4곳에서 기존 이메일 input+datalist/커스텀 드롭다운을 코어 컴포넌트로 교체.
- 기존 `.mg-v2-form-email-row` 레이아웃·B0KlA·Auth 스타일 유지.
- 필요 시 `docs/project-management/EMAIL_AUTOCOMPLETE_COMPONENT_SPEC.md` 에 스펙·사용처 목록 정리.

---

**실행 요청**: Phase 1(core-component-manager)을 먼저 호출한 뒤, 결과를 기획에게 전달해 주세요. 기획이 취합 후 Phase 2·3(선택) 호출 여부를 정하고, Phase 4 → Phase 5(core-coder) 순으로 진행합니다.
