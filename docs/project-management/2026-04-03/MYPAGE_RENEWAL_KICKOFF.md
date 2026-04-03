# 마이페이지 전면 리뉴얼 — 킥오프 회의록 및 WBS

**일자**: 2026-04-03  
**주관**: core-planner  
**참여 역할(가상 회의)**: core-component-manager, core-designer, core-publisher, core-coder, (후속) core-tester  

---

## 1. 회의 목적·합의 사항

### 1.1 목표

`frontend/src/components/mypage/` 이하 마이페이지를 **아토믹 디자인 시스템**에 맞춰 **전면 리뉴얼**한다. 비즈니스 로직(API·세션·탭 상태 등)은 유지하되, **표현층(마크업·스타일·컴포넌트 구조)은 신규 표준만 사용**한다.

### 1.2 절대 원칙(전 역할 공통)

| 원칙 | 설명 |
|------|------|
| **레거시 UI/CSS 금지** | 기존 `MyPage.css`, `components/*.css`(ProfileSection, SettingsSection, SecuritySection, SocialAccountsSection, PrivacyConsentSection, AddressInput, ProfileImageUpload, Password*Modal 등)는 **참고·복붙·확장 대상이 아님**. 최종 구현에서 **제거 또는 폐기**한다. |
| **토큰 필수** | 색·간격·타이포는 `frontend/src/styles/unified-design-tokens.css` 및 프로젝트 표준 클래스(B0KlA 계열 등)를 따른다. 임의 하드코딩 색상 지양. |
| **비주얼 레퍼런스** | 마인드가든 **어드민 대시보드 샘플**(`https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample`) 스타일을 **시각 언어**로 적용한다. (마이페이지가 어드민 LNB를 쓰지 않을 수 있으나, 카드·타이포·여백·강조색은 동일 계열로 맞춘다.) |
| **공통 모듈 우선** | 모달은 `UnifiedModal`, 상단 제목 영역은 `ContentHeader` 등 **기존 공통 모듈**을 우선 검토·사용한다. `/core-solution-common-modules`, `docs/standards/COMMON_MODULES_USAGE_GUIDE.md` 준수. |
| **아토믹 계층** | Atoms → Molecules → Organisms → Templates → Pages. 페이지는 조합만 담당하고, 재사용 단위는 하위 계층으로 내린다. |

### 1.3 사용자 관점(디자이너·퍼블·코더 전달용 요약)

- **사용성**: 로그인 사용자(내담자·상담사 등 역할은 기존 마이페이지와 동일)가 **프로필·설정·보안·소셜·개인정보 동의**를 한 화면 흐름에서 빠르게 전환할 수 있도록 탭(또는 동등한 1차 내비)을 명확히 한다. 자주 쓰는 동작(프로필 저장, 비밀번호 변경)은 해당 탭 상단 또는 주요 카드에 배치한다.
- **정보 노출**: 이메일·전화·주소 등 민감 정보는 역할·정책에 맞게 표시/마스킹(기존 API 응답 규칙 유지). 소셜 연동 상태는 연결됨/미연결을 한눈에 구분.
- **레이아웃**: 상단 페이지 제목·탭 내비 → 본문은 **카드형 섹션** 중심(반응형 기본). 모바일에서는 탭 스크롤 또는 드로어 패턴 검토.

### 1.4 범위(파일 인벤토리 기준)

**포함**

- `MyPage.js`, `ProfileEdit.js`
- `components/`: ProfileSection, SettingsSection, SecuritySection, SocialAccountsSection, PrivacyConsentSection, ProfileImageUpload, AddressInput, PasswordChangeModal, PasswordResetModal 및 각종 **레거시 `.css`**

**제외(본 킥오프에서 명시적 제외하지 않음)**

- API 계약 변경은 **불필요하면 하지 않음**. UI 리뉴얼이 목적.
- 라우팅 상위 레이아웃이 마이페이지 전용 래퍼를 쓰는 경우, 해당 파일은 **코더 단계에서 필요 시만** 조정.

---

## 2. 가상 킥오프 회의록(요약)

| 순서 | 발언 역할 | 합의 내용 |
|------|-----------|-----------|
| 1 | core-planner | Phase를 **인벤토리·설계 → 마크업 → React 결합 → 테스트**로 나누고, 1차로 **컴포넌트 매니저 + 디자이너**를 병렬 가동한다. |
| 2 | core-component-manager | 마이페이지에 필요한 아토믹 단위를 목록화하고, 저장소 내 **재사용 가능 컴포넌트 vs 신규 제작**을 표로 제안한다. 코드 수정 없이 제안서만 산출. |
| 3 | core-designer | 어드민 샘플 스타일을 반영한 **화면설계서(레이아웃·탭·카드·모달·상태)**를 작성한다. 코드 작성 없음. |
| 4 | core-publisher | 디자이너 스펙 + 컴포넌트 매니저 제안을 반영해 **순수 HTML + BEM·아토믹 구조의 마크업·CSS 뼈대**를 작성한다. React/JS 없음. |
| 5 | core-coder | 퍼블리셔 산출물과 기존 훅·API 호출·탭 상태를 결합해 React로 재구성한다. 레거시 CSS 제거, 토큰 적용. |
| 6 | core-tester | 회귀 시나리오(탭 전환, 저장, 비밀번호·소셜·동의 흐름) E2E 또는 스모크 보강을 후속 배치. |

---

## 3. WBS(작업 분해 구조)

| ID | 작업 | 담당 | 산출물 | 선행 |
|----|------|------|--------|------|
| W1 | 마이페이지 아토믹·공통 컴포넌트 인벤토리 및 재사용/신규 분류 | core-component-manager | 제안서(텍스트, 파일 경로 목록) | 없음 |
| W2 | 마이페이지 UI/UX 화면설계(5탭 반영) | core-designer | `docs/design-system/` 하위 스펙 문서(또는 동등 산출) | 없음(기획 요구 반영) |
| W3 | 정적 마크업·CSS 구조 | core-publisher | HTML(+필요 시 전용 마크업용 CSS 파일 경로 제안) | W1, W2 |
| W4 | React 전면 재작성·레거시 CSS 제거 | core-coder | `mypage/` 이하 JS/TS 정리, 토큰 기반 스타일 | W3 |
| W5 | 테스트·회귀 | core-tester | 테스트 케이스·실행 결과 | W4 |

**병렬 가능**: W1 ∥ W2. W3은 W1+W2 완료 후. W4는 W3 후. W5는 W4 후.

---

## 4. 분배실행 표(서브에이전트 호출용)

| Phase | subagent | 적용 스킬·문서 | 전달 요약 |
|-------|----------|----------------|-----------|
| P0 | (완료) core-planner | `/core-solution-planning` | 본 문서 작성 |
| P1a | core-component-manager | `/core-solution-common-modules`, `/core-solution-atomic-design`, `COMMON_MODULES_USAGE_GUIDE.md` | 마이페이지 기능별 필요 컴포넌트 인벤토리, UnifiedModal·ContentHeader 등 매핑, 신규 후보 목록. **레거시 CSS/컴포넌트 스타일 참조 금지** 명시 |
| P1b | core-designer | `/core-solution-design-handoff`, `/core-solution-atomic-design`, 어드민 샘플, `unified-design-tokens.css` | 프로필·설정·보안·소셜·개인정보 동의 탭 포함 화면설계. §0.4 사용성·정보 노출·배치 반영. **코드 없음** |
| P2 | core-publisher | `/core-solution-publisher` | P1a+P1b 산출 기반 HTML·BEM·CSS 구조. React 금지 |
| P3 | core-coder | `/core-solution-frontend`, `/core-solution-api`, `/core-solution-unified-modal`, 운영 게이트 문서(하드코딩) | 마크업+로직 결합, `MyPage.css` 등 폐기, 토큰 사용 |
| P4 | core-tester | `/core-solution-testing` | 마이페이지 플로우 검증 |

---

## 5. 리스크·제약

- **레이아웃 래퍼**: 마이페이지가 `AdminCommonLayout`이 아닐 수 있음 — 시각은 B0KlA 계열, 구조는 실제 부모 레이아웃에 맞게 코더가 조정.
- **모달 다수**: 비밀번호 변경/재설정 등은 **UnifiedModal** 표준 위반 여부를 P1a에서 점검.
- **하드코딩 게이트**: 코더 단계에서 색상·문구 하드코딩이 스캔에 걸리지 않도록 `ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF` §17, `SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION` §1.3, `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`를 위임문에 포함.

---

## 6. 본 턴(2026-04-03) 실행 결과 기록란

| 항목 | 상태 |
|------|------|
| 본 킥오프·WBS 문서 | 작성 완료 (`docs/project-management/2026-04-03/MYPAGE_RENEWAL_KICKOFF.md`) |
| P1a core-component-manager | 완료 — 인벤토리·재사용 맵·신규 후보 제안을 플래너가 회신에 취합(원문은 Task 응답) |
| P1b core-designer | 완료 — `docs/design-system/SCREEN_SPEC_MYPAGE_RENEWAL.md` 저장 |

### 6.1 P1b 산출 요약

- B0KlA·어드민 샘플 시각 언어, 토큰·`mg-v2-ad-b0kla__*` 카드·pill 탭 명시. AdminCommonLayout 미사용 전제(역할별 앱 셸).
- 5탭 흐름·마스킹·모달·반응형·아토믹·공통 모듈 매핑·완료 체크리스트 포함. 문서 상단에 레거시 MyPage CSS 금지 명시.

### 6.2 P1a 산출 요약

- 탭별 UI 블록 표, 공통 모듈 재사용 표(ContentArea/ContentHeader/ContentSection/ContentCard, UnifiedModal, FormInput, Avatar, ProfileImageInput, PrivacyConsentModal, StandardizedApi 등).
- 신규 후보: `MypageTabNav`, `MypageProfileOrganism`, `MypageAddressFields`, `MypagePreferenceRow`, 소셜/개인정보 Organism 등. ProfileImageUpload vs ProfileImageInput 통합, ProfileEdit·섹션 중복 정리는 코더 단계 이슈로 표시.
- 플래너 후속 결정 권고: 탭 네비 패턴 단일화, ConfirmModal 표준화, ProfileEdit 통합 여부.

---

## 7. 다음 턴 권장 실행 요청문(호출자용)

1. **P2 core-publisher**: P1a·P1b 산출물 경로를 입력으로 HTML/CSS 뼈대 작성.  
2. **P3 core-coder**: 퍼블 산출 + `frontend/src/components/mypage/**` 재작성.  
3. **P4 core-tester**: 회귀·E2E.  

---

## 부록: P1a / P1b에 넘긴 태스크 설명(전문 초안)

### 부록 A — core-component-manager

`frontend/src/components/mypage/` 전역을 대상으로, 마이페이지 리뉴얼에 필요한 **아토믹 계층별(Atoms~Organisms) 컴포넌트 인벤토리**를 작성하라. `UnifiedModal`, `ContentHeader`, 프로필 아바타/업로드 UI에 쓸 수 있는 기존 공통 컴포넌트가 있으면 **파일 경로와 용도**로 매핑하라. **신규로 만들 것으로 보이는 컴포넌트**는 계층과 이름 후보를 제안하라. **기존 mypage의 `.css` 및 클래스명은 분석 대상에서 제외**하고, **오직 저장소 표준·공통 모듈·디자인 시스템 관점**에서만 제안하라. 코드 수정 금지, **제안서 텍스트만** 산출.

### 부록 B — core-designer

마이페이지(탭: 프로필, 설정, 보안, 소셜 계정, 개인정보 동의)에 대해 **어드민 대시보드 샘플과 동일한 시각 언어**로 레이아웃·카드·탭·모달·반응형 동작을 규정하는 **화면설계서**를 작성하라. 본 킥오프 §1.3 사용성·정보 노출·배치를 반영하라. 산출물은 `docs/design-system/`에 저장하는 것을 권장한다. **코드·CSS 작성 없음**. `unified-design-tokens.css` 및 B0KlA 토큰/클래스 참조를 명시하라.
