# 회원가입 및 비밀번호 찾기 리뉴얼 기획

**작성일**: 2026-03-04
**역할**: core-planner
**대상**: 
- `frontend/src/components/auth/TabletRegister.js` (회원가입)
- `frontend/src/components/auth/ForgotPassword.js` (비밀번호 찾기)
- `frontend/src/components/auth/ResetPassword.js` (비밀번호 재설정)
- 관련된 CSS 파일들 (`TabletRegister.css`, `ForgotPassword.css` 등)

---

## 1. 목표 및 배경
- **요구사항**: 통합 로그인 화면과 마찬가지로 회원가입 및 비밀번호 찾기/재설정 페이지도 완전히 새롭게 리뉴얼한다.
- **방향성**: 
  - 최근 로그인 페이지 리뉴얼(`UnifiedLogin.js`)에서 적용한 좌우 분할(Split Screen) 레이아웃 혹은 프로젝트 공통 템플릿(`CommonPageTemplate`)을 사용하여 통일감 있는 경험을 제공한다.
  - 아토믹 디자인 패턴과 프로젝트 고유의 디자인 토큰(`var(--mg-*)`) 및 `mg-v2-*` 클래스를 엄격하게 적용한다.
  - 마인드가든(MindGarden) 브랜딩 대신 `CoreSolution` 브랜딩을 유지/적용한다.

---

## 2. 범위
- **포함**: 
  - `TabletRegister.js` (또는 통합 회원가입) 화면 UI 개편. (기존 로직 유지)
  - `ForgotPassword.js` 화면 UI 개편.
  - `ResetPassword.js` 화면 UI 개편.
  - 각 화면의 마크업, CSS (하드코딩 제거 및 토큰화).
- **유지**: 회원가입 API, 이메일 전송 API, 비밀번호 재설정 API 등 모든 기능과 비즈니스 로직.

---

## 3. 단계별 실행 (분배실행 표)

| Phase | 담당 에이전트 | 목표 | 전달할 프롬프트(태스크 설명) 초안 |
|---|---|---|---|
| **Phase 1** | `core-designer` | UI/UX 및 아토믹 레이아웃 설계 | "회원가입 및 비밀번호 찾기/재설정 페이지의 리뉴얼을 위한 화면 설계서(`docs/design-system/AUTH_PAGES_REDESIGN_SPEC.md`)를 작성해 주세요. 로그인 페이지(UnifiedLogin)와 일관된 좌우 분할 레이아웃(또는 세련된 중앙 정렬 카드 레이아웃)을 사용하고, CoreSolution 브랜딩을 적용하세요." |
| **Phase 2** | `core-coder` | 컴포넌트 및 CSS 구현 | "설계서를 바탕으로 `TabletRegister.js`, `ForgotPassword.js`, `ResetPassword.js` 및 관련 CSS 파일들을 수정하세요. 디자인 토큰을 철저히 적용하고 기존의 비즈니스 로직은 한 줄도 삭제하거나 변경하지 마세요." |

---

## 4. 완료 기준 (Checklist)
- [ ] 회원가입, 비밀번호 찾기, 비밀번호 재설정 페이지의 UI가 새롭게 변경되었는가?
- [ ] 사진/이미지(또는 브랜딩 배경)가 포함된 레이아웃이 적용되었는가?
- [ ] 하드코딩된 색상 없이 `var(--mg-*)` 디자인 토큰이 사용되었는가?
- [ ] "CoreSolution" 브랜딩 텍스트가 올바르게 적용되었는가?
- [ ] 기존 API 통신 및 상태 관리 로직이 모두 정상 동작하는가?
