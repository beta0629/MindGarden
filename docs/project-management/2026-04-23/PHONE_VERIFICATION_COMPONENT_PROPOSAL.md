# 전화번호 입력·검증·중복 체크 — 컴포넌트·모듈 중복 분석 및 제안

**문서 유형:** core-component-manager 산출 (제안·문서 전용, 코드 수정 없음)  
**작성일:** 2026-04-23  
**관련 SSOT:** [`PHONE_VERIFICATION_POLICY.md`](./PHONE_VERIFICATION_POLICY.md)  
**참조 표준(언급만):** `.cursor/skills/core-solution-atomic-design/SKILL.md`(아토믹 계층), `docs/standards/COMMON_MODULES_USAGE_GUIDE.md`(공통 모듈·StandardizedApi 등)

---

## 1. 프론트: 중복된 컴포넌트·패턴과 통합 제안

### 1.1 중복·분산 목록 (요약)

| 구분 | 위치(예) | 중복 내용 |
|------|-----------|-----------|
| **표시 포맷(하이픈)** | `frontend/src/utils/common.js` → `koreanMobilePhone.formatKoreanMobileForDisplay` | 공식 SSOT는 `koreanMobilePhone.js`이나, 동일 로직이 **다른 파일에 재구현**됨. |
| **표시 포맷(로컬 구현)** | `TabletLogin.js` — 함수 `formatPhoneNumber` (3-3-4) | `common`/`koreanMobilePhone`과 **동일 목적의 인라인 유틸**. |
| **표시 포맷(로컬 구현)** | `MyPage.js` — `formatPhoneNumber` (숫자만 잘라 3-3-4) | 위와 동일. |
| **휴대폰 유효성** | `koreanMobilePhone.js` — `isValidKoreanMobileDigits` / `normalizeKoreanMobileDigits` | **태블릿 공개 가입** 등에서 사용. |
| **휴대폰·유선 혼합 검증** | `validationUtils.js` — `validatePhone` (정규식에 02·지역번호 등 포함) | **의미가 다른** “한국 전화” 검증(유선 포함). 휴대전용 SSOT(`koreanMobilePhone`)과 **책임이 겹침**. |
| **11자리 수동 검사** | `SocialSignupModal.js` (공백 제거 길이 11) | `isValidKoreanMobileDigits`와 **정합성未확인**(011 등 변형·정규화 누락 가능). |
| **중복 API 호출** | `TabletRegister.js` — `GET /api/v1/auth/duplicate-check/phone` + 정규화 후 전달 | **유일하게** 흐름이 뚜렷한 공개가입용 패턴. |
| **이메일만 중복 확인** | `StaffManagement.js`, `ClientModal.js`, `ConsultantComprehensiveManagement.js`(일부) | **전화는 필드·저장만** 있고, 가입/편집 시 **휴대폰 중복 API·상태**가 이메일과 **비대칭**. |
| **OAuth 전화** | `OAuth2Callback.js` | **전화 입력 필드**보다 `requiresPhoneAccountSelection`·후보 선택 **모달·토큰** 흐름. 입력 정규화·중복는 **다른 경로(백엔드 매칭)**. |

### 1.2 통합 제안 (UI 계층·배치)

- **Atom 수준**  
  - **한국 휴대폰 전용** 입력/표시는 `koreanMobilePhone` + (필요 시) **얇은 래퍼**로 모으는 것을 권장.  
  - `validationUtils.validatePhone`은 **“일반 전화(유선 포함)”** 용도로 **이름·문서(주석)에서 역할을 분리**하거나, 정책 SSOT(휴대만)와 맞지 않으면 **호출처를 점검**하는 제안(코딩은 core-coder).
- **Molecule**  
  - “라벨 + `input` + (선택) 중복확인 버튼 + 상태 메시지(available/duplicate/checking)”는 `TabletRegister`에 구현된 패턴을 **도메인 중립 이름**의 Molecule(예: `PhoneFieldWithDuplicateCheck` 성격)으로 **추출 후** Staff/Client/Consultant·마이페이지에 **필요할 때만** 재사용하는 방안.  
  - **아토믹 디자인** 스킬에 따라: 순수 UI·접근성·BEM/토큰은 Atoms/Molecules, **비즈니스(어떤 API를 칠지)** 는 Page/Container에서 주입.  
- **common / ui**  
  - `docs/standards/COMMON_MODULES_USAGE_GUIDE.md`에 맞게, API 호출은 **StandardizedApi** 등 **기존 공통 패턴**을 전화 중복·SMS에도 일관 적용.  
  - `formatPhoneNumber`는 **한 곳**(`common` → `koreanMobilePhone`)만 쓰고, `MyPage`·`TabletLogin`의 **로컬 복제 제거**를 P1 권장.

### 1.3 정책 문서와의 정렬(프론트 관점)

- `PHONE_VERIFICATION_POLICY.md`의 **정규화·표시/저장 분리**는 프론트에서도 “**입력 중 표시(하이픈)** / **API 전송(정규화 digits)**”를 한 패턴으로 묶는 것이 유리하다(현재 `TabletRegister`가 이에 가장 가깝다).

---

## 2. 백엔드: 정규화·중복·암호화 경로의 중복·분산과 공통화 제안

### 2.1 정규화·휴대 유효성 (SSO 후보)

- **단일 구현(`LoginIdentifierUtils`)**  
  - `normalizeKoreanMobileDigits`, `isValidKoreanMobileDigits` — **AuthController**(공개 가입·`duplicate-check/phone`), **UserServiceImpl**, **AdminServiceImpl**(내담자 등록 등), **AbstractOAuth2Service**, DTO·소셜 프로필 등에서 사용.  
- **이중·분산(프론트·백엔드 대칭 SSOT 이슈)**  
  - 프론트 `koreanMobilePhone.js`와 **동일 수학**을 유지하지 않으면 **중복·로그·검색이 어긋남** — “유틸 동기화”가 정책 2.3, 3절과 직접 연결.  
- **다른 정규식·문자 그대로 비교**  
  - `AuthController` 내 **일부 SMS/레거시** 구간: `^01[0-9]{8,9}$` 등 **문자열 직접 정규식** — `LoginIdentifierUtils`와 **합치 여부**를 Service 계층에서 **한 진입점**으로 모을지 검토(중복·오차 방지).  
- **SmsAuthController / SmsAuthService**  
  - 컨트롤러: 빈 값 위주, **휴대형식·정규화는 SmsAuthService에 거의 없음**.  
  - 발송·검증 전에 `LoginIdentifierUtils` 수준 **정규화 + 유효성**을 **공통 전처리**로 둘지(제안만): OTP 정책(7·9절)과 연계.

### 2.2 중복 검사 (두 갈래·의미 혼동 리스크)

| 경로 | 엔드포인트(개요) | 구현 경향 |
|------|------------------|------------|
| **공개 가입·Auth** | `GET /api/v1/auth/duplicate-check/phone` | `UserService.existsPhoneDuplicateForPublicSignup` — **암호화 저장** 가정, **복호화·정규화** 후 비교. |
| **사용자 API** | `UserController` `GET .../duplicate-check/phone` | `userService.isDuplicateExcludingId(..., "phone", phone)` — **제네릭 필드 중복**; **암호화 컬럼**과 **평문 입력**이 어떻게 맞는지 **코딩 룰·리포지토리**와 함께 **재검증 필요**(분산/상충 위험). |

- **제안:** “전화 중복”의 **의미를 하나로** 정의(`tenantId` 범위, 암호화·정규화)하고, **UserService**에 `existsPhoneDuplicateForTenant( normalized, excludeUserId, … )` 같은 **단일 진입**을 두고, Auth·User(마이/관리) **모두 위임**하는 구조를 Service 계층에서 권장한다.

### 2.3 암호화 저장·마스킹 (분산)

- **User.phone**: `UserServiceImpl`에서 복호화·`LoginIdentifierUtils` 정규화 비교, **findByPhone** 등.  
- **Admin/Consultant 등록**: `encryptionUtil.safeEncrypt` — **경로에 따라 `request.getPhone()`을 정규화 전에 암호화**하는지 **일부만** `LoginIdentifierUtils` 선행(예: 내담자 등록은 앞단에서 정규화·검사).  
- **`registerStaff`**: `request.getPhone()`이 **비어 있지 않을 때** 암호화만 하고, **`existsPhoneDuplicateForPublicSignup` 없음** — explore 요약과 일치(스태프 전화 **중복 검사 누락** 가능).  
- **마스킹:** `AdminServiceImpl.maskPhone`, `KakaoAlimTalkServiceImpl.maskPhoneNumber`, `PhoneMigrationService` 등 **유사 private 메서드** — `maskPhone` **공용 유틸(또는 PII 마스킹 서비스)** 으로 모을지 제안(정책 9절·`ENCRYPTION_STANDARD.md` 정합).

### 2.4 OAuth·전화 “매칭”

- **AbstractOAuth2Service** + DTO `OAuthExistingUserResolution` / 프론트 `OAuth2Callback` **계정 선택** — “중복”이 **입력필드가 아닌** 기가입·역할 **충돌** 해소.  
- 정책 10절과의 정렬: **전화 = 검증됨** 자동 인정 여부, **여러 User 동일 정규화 번호**는 **백엔드 분기 + UI 선택**이 이미 존재; 향후 **SMS 검증**과 **연결/단절**은 별도 Phase에서 설계.

---

## 3. core-coder 우선순위 Phase (P1 / P2 / P3)

| 우선순위 | 범주 | 제안 작업(실행은 core-coder) |
|----------|------|--------------------------------|
| **P1** | 일관성·보안/버그 | • 전화 **중복 검사** API 의미 통합( Auth vs UserController vs 암호화). • `registerStaff`에 **정규화 + 테넌트 스코프 중복 검사** 여부(제품 결정 연동). • 프론트 **표시용 `formatPhoneNumber` 단일화**(`MyPage`, `TabletLogin` → `common`/`koreanMobilePhone`). |
| **P1** | 정책 대비 | • SMS 발송/검증/레거시 Auth 내부 SMS의 **전화 정규화**를 `LoginIdentifierUtils` 기준으로 **한 경로**로(중복·불일치 제거). |
| **P2** | 공통 UI | • `PhoneField` Molecule(입력+표시+선택적 중복 확인) 추출, **TabletRegister**·관리 **클라이언트/상담사** 등 **필요 화면만** 점진 적용. • `SocialSignupModal` 휴대 검증을 **`koreanMobilePhone`과 정합**. |
| **P2** | 백엔드 정리 | • `validationUtils` vs `koreanMobilePhone` **역할 문서화**; 유선·070 등 **정책 `[제품결정]`** 반영 시 한쪽으로 몰지 결정. • 마스킹 로직 **공용화** 후 **로그/응답** 점검(정책 9절). |
| **P3** | UX·운영 | • OTP 쿨다운/한도(정책 7절) UI·API. • 미검증 계정(8절) **화면·문구**는 core-designer 시안 이후. • `PhoneMigrationService`와 **신규 저장 정책** 정합. |

---

## 4. core-designer 산출(`SCREEN_SPEC_PHONE_VERIFICATION_ADMIN_AND_SIGNUP.md`)과의 정렬 포인트

> **참고:** 저장소 기준 2026-04-23에 해당 파일명이 **아직 없을 수** 있다. core-designer가 `SCREEN_SPEC_PHONE_VERIFICATION_ADMIN_AND_SIGNUP.md`를 내보내면 아래를 **필드·문구·한계상황(에러) 목록**으로 맞출 것을 권장한다.

| 정렬 항목 | 이 제안서·코드베이스와의 연결 |
|------------|------------------------------|
| **가입(태블릿) vs 관리(스태프·클라이언트·상담사)** | 태블릿은 `duplicate-check/phone` + `koreanMobilePhone`; 관리 쪽은 **이메일 중복만** 강한 화면이 있어, 스펙에서 **“전화 중복 필수/선택/제외(역할)”** 를 명시하면 1.2 Molecule·P1 백엔드와 **동시에** 맞출 수 있음. |
| **검증됨/미검증 배지** | DB·API **verified 플래그**가 스펙에 없으면 UI만 먼저 그리지 말고, `PHONE_VERIFICATION_POLICY` 1.2·8절과 **데이터 모델**을 디자이너·코더가 공유. |
| **OAuth 계정 선택** | `OAuth2Callback`의 **다중 User·전화** 모달은 정책 10절·4절 **매트릭스 TBD**와 **동일 축(역할×번호)** 으로 정리할지 합의. |
| **SMS** | `SmsAuthController` 경로(`/send-code`, `/verify-code`) vs **프론트 constants(`css-variables` 등)의 `/api/v1/auth/sms/...`)** — 스펙에 **실제 연동 API**·파라미터(`sentCode` 등) **그대로** 기입해 프론트·백 **단일**되게. |
| **접근성·모달** | 공통 **UnifiedModal**·디자인 토큰은 `COMMON_MODULES_USAGE_GUIDE`·unified-modal 스킬; 전화·OTP **화면 spec**에 포커스·오류 region 포함 권장. |

---

**저장 경로:** `docs/project-management/2026-04-23/PHONE_VERIFICATION_COMPONENT_PROPOSAL.md`
