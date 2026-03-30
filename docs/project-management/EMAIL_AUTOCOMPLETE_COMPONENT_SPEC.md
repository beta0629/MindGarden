# MgEmailFieldWithAutocomplete 컴포넌트 스펙

**대상**: 이메일 input + 자동완성 코어 컴포넌트  
**참조**: EMAIL_AUTOCOMPLETE_COMPONENT_PLAN.md §10·§11, EMAIL_AUTOCOMPLETE_UI_SPEC.md, MG_EMAIL_FIELD_WITH_AUTOCOMPLETE_MARKUP_SPEC.md

---

## 1. 파일 위치

| 항목 | 경로 |
|------|------|
| 컴포넌트 | `frontend/src/components/common/MgEmailFieldWithAutocomplete.js` |
| 스타일 | `frontend/src/components/common/MgEmailFieldWithAutocomplete.css` |
| 도메인 상수 | `frontend/src/constants/emailDomains.js` (`EMAIL_DOMAINS`) |

---

## 2. Props 요약

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| value | string | — | 입력값 |
| onChange | function | — | (e) => void |
| placeholder | string | `example@email.com` | placeholder |
| disabled | boolean | false | 비활성화 |
| id | string | — | input id (필수, label for·접근성) |
| name | string | — | input name (필수) |
| required | boolean | false | 필수 |
| domains | string[] | EMAIL_DOMAINS | 도메인 목록 (예: @gmail.com) |
| autocompleteMode | `'datalist'` \| `'custom-dropdown'` | `'datalist'` | 자동완성 방식 |
| label | string | — | 라벨 텍스트 (선택, 부모에서 label 렌더 시 생략) |
| ariaDescribedBy | string | — | 도움말/에러 요소 id |
| ariaInvalid | boolean | — | 유효성 오류 시 true |
| onBlur | function | — | input blur 핸들러 (선택) |
| className | string | '' | 루트 추가 클래스 |

---

## 3. 사용처 (A그룹 적용 완료)

| # | 파일 | autocompleteMode | 비고 |
|---|------|------------------|------|
| 1 | `ClientComprehensiveManagement/ClientModal.js` | datalist | 내담자 모달 |
| 2 | `StaffManagement.js` | datalist | 스태프 생성 모달 |
| 3 | `ConsultantComprehensiveManagement.js` | datalist | 상담사 모달 |
| 4 | `auth/TabletRegister.js` | custom-dropdown | 태블릿 회원가입 |

---

## 4. 레이아웃·행과의 관계

- **이메일 행** `.mg-v2-form-email-row`는 레이아웃 전용(입력 영역 + 중복확인 버튼 한 줄).
- 코어 컴포넌트는 **행 안** `mg-v2-form-email-row__input-wrap` 내부에 배치.
- BEM 블록: `mg-v2-email-field`, 요소: `__input-wrap`, `__suggestions`, `__suggestion-item`.

---

*Phase 5(core-coder) 적용 결과 정리.*
