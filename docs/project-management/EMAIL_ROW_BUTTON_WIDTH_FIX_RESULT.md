# 이메일 폼 행 "중복확인" 버튼 과도한 넓이 수정 — 회의 결과

**일자**: 2025-03-16  
**목적**: 새 내담자 등록 모달 이메일 행에서 중복확인 버튼이 비정상적으로 넓고 입력란이 눌리던 문제의 원인 규명·수정안·적용 요약  
**제한**: 디버거/디자이너/퍼블리셔/플래너는 코드 수정하지 않음. **core-coder만** CSS 수정 수행.

---

## 1. 증상 (사용자 보고)

- **새 내담자 등록** 모달, 이메일 행:
  - 왼쪽: 이메일 입력 필드 → **너비가 짧게 눌려 보임**(압축된 느낌).
  - 오른쪽: **"중복확인" 버튼이 비정상적으로 매우 넓음**(연한 녹색 배경, 진한 녹색 테두리). 버튼 안 텍스트 "중복확인"은 오른쪽 정렬.
- 결과: **버튼이 과도하게 넓고, 입력란은 좁아서** 레이아웃 불균형.

---

## 2. 원인 (core-debugger·기획 취합)

- **유력 원인**  
  - (A) 다른 스타일시트에서 `.mg-v2-button`에 `width: 100%` 또는 `flex: 1`이 적용되어, B0KlA의 `.mg-v2-form-email-row .mg-v2-button { flex: 0 0 auto }`보다 **나중에 로드되거나 더 구체적인 셀렉터**로 덮이는 경우.  
  - (E) `.mg-v2-form-email-row__input-wrap`의 `flex: 1 1 0%`가 더 구체적인 셀렉터에 의해 덮여, 입력 래퍼가 내용 크기만 차지하고 남은 공간이 버튼 쪽으로 넘어가 버튼이 넓어 보이는 경우.
- **상세 규칙·후보**: `docs/debug/EMAIL_ROW_BUTTON_WIDTH_ROOT_CAUSE.md` 참고.

---

## 3. 수정안 (core-designer·core-publisher·기획 체크리스트)

- **목표**: 이메일 행 = **입력란(가변 너비, 가용 공간 차지)** + **중복확인 버튼(콤팩트, 자동 너비)**.
- **입력 래퍼**: `flex: 1 1 0%`, `min-width: 12rem` 유지. `min-width: 0` 금지.  
  → `docs/design-system/EMAIL_ROW_INPUT_BUTTON_LAYOUT_SPEC.md`
- **버튼**: `flex: 0 0 auto`, `width: auto`, 필요 시 `min-width: 90px` 수준으로 콤팩트만 유지.  
  → 동일 스펙 + `docs/design-system/EMAIL_ROW_STRUCTURE_AND_MARKUP_SPEC.md`
- **마크업**: row 직계 자식 2개(`__input-wrap`, button) 유지. JS/JSX 변경 없이 CSS만으로 해결.

---

## 4. 적용 요약 (core-coder 수행)

| 항목 | 내용 |
|------|------|
| **수정 파일** | `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css` 만 수정. JS/JSX·ClientModal.css 변경 없음. |
| **버튼** | 이메일 행 버튼에 대해 `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body .mg-v2-form-email-row .mg-v2-button` 및 compact·`[data-action="email-duplicate-check"]` 셀렉터 추가. `flex: 0 0 auto`, `flex-shrink: 0`, `width: auto`, `min-width: 90px` 명시로 캐스케이드 우선순위 확보. |
| **입력 래퍼** | `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body .mg-v2-form-email-row__input-wrap` 셀렉터 추가. `flex: 1 1 0%`, `min-width: 12rem !important` 유지. |
| **적용 범위** | `mg-v2-ad-b0kla`를 쓰는 모든 모달(새 내담자 등록·상담사/스태프 등록·수정 등)에 동일 적용. |

---

## 5. 참고 문서

- **원인 분석**: `docs/debug/EMAIL_ROW_BUTTON_WIDTH_ROOT_CAUSE.md`
- **레이아웃 스펙**: `docs/design-system/EMAIL_ROW_INPUT_BUTTON_LAYOUT_SPEC.md`
- **구조·마크업**: `docs/design-system/EMAIL_ROW_STRUCTURE_AND_MARKUP_SPEC.md`

---

*기획(core-planner) 취합. 실제 코드 수정은 core-coder가 수행.*
