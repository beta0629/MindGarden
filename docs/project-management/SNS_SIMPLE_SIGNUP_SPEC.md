# MindGarden SNS 간편 회원가입 — 기획·구현 가이드 (SSOT 초안)

| 항목 | 내용 |
|------|------|
| **상태** | 초안 — 법무·보안 검토 후 확정 |
| **작성** | 2026-05-13 |
| **범위** | 카카오·네이버(및 동일 패턴 소셜) **최초 방문자** 가입 UX 간소화, MindGarden·테넌트 측 동의·원장 |
| **비범위** | 애플·구글 등 미연동 제공자 전체 일반화(별 문서), 학원 전용 `academy_signup_mode` 상세 |

---

## 1. 목적

소셜 SDK로 **인증은 성공**했으나 테넌트에 **미등록 사용자**인 경우(`requiresSignup: true`), 현재는 특히 **Expo**에서 “관리자에게 문의”로 끊겨 **이탈·CS 부담**이 크다.  
본 문서는 **우리 쪽(MindGarden) SNS 가입 절차를 짧게** 만들되, **멀티테넌트·약관·보안**을 만족하는 구현 방향을 한곳에 정의한다.

---

## 2. 현황 요약 (코드 기준)

| 영역 | 동작 | 참고 경로 |
|------|------|-----------|
| 네이티브 소셜 로그인 | `POST /api/auth/social-login` — 미가입 시 `requiresSignup: true` + `socialUserInfo` | `OAuth2Controller.java` (`socialLoginWithAccessToken`) |
| Expo 로그인 화면 | `requiresSignup` 시 안내만, 가입 화면 없음 | `expo-app/app/(auth)/login.tsx` |
| 웹 OAuth 콜백 | `requiresSignup=true` 쿼리 시 회원가입 플로로 유도 | `frontend/src/components/auth/OAuth2Callback.js` |
| 웹 소셜 유틸 | `requiresSignup` 반환 처리 | `frontend/src/utils/socialLogin.js` |
| 소셜 회원가입 API | `POST /api/v1/auth/social/signup` + `tenantId`(쿼리 또는 컨텍스트) | `SocialAuthController.java` |
| 가입 서비스 | 이메일·**비밀번호 8자+**·`privacyConsent`·`termsConsent` 필수, 휴대폰 선택(형식 엄격) | `SocialAuthServiceImpl.java`, `SocialSignupRequest.java` |
| 가입 성공 응답 | JWT 없음, “다시 로그인” + 웹 로그인 URL | `SocialSignupResponse.java` |

---

## 3. 설계 원칙

1. **테넌트 격리**: 가입·로그인 모두 `tenantId`(헤더·컨텍스트) 없으면 진행 불가. (`.cursor/skills/core-solution-multi-tenant/SKILL.md`)
2. **카카오·네이버 개발자 센터 정책은 보조**: 동의 UI·스코프 최소화에 활용하되, **서비스·테넌트 약관·개인정보**는 MindGarden 측 **최소 동의 + 버전·시각 저장**을 병행(법무 확정).
3. **하드코딩 금지**: 문구·URL은 설정·i18n·테넌트 브랜딩 정책에 따름.
4. **웹·Expo 정합**: 동일 백엔드 계약; 화면 단계 수만 플랫폼에 맞게 조정.

---

## 4. 목표 UX (권고)

### 4.1 공통 (웹·Expo)

1. 소셜 로그인 SDK 성공 → 백엔드 `social-login`.
2. **`requiresSignup: true`** 이면 **가입 전용 짧은 화면**으로 이동(모달 또는 라우트).
3. 화면 구성(권장 최소):
   - **서비스 이용약관·개인정보 처리방침** 동의(체크) + 전문 링크(웹뷰 또는 외부 브라우저).
   - (선택) **마케팅 수신** 동의.
   - (정책상 필요 시만) **휴대폰** — 소셜에서 이미 제공·검증된 값이 있으면 **읽기 전용 표시 + 수정 최소화** 검토.
4. 제출 → `POST /api/v1/auth/social/signup` (본문에 `provider`, `providerUserId`, 이메일·닉네임 등 `socialUserInfo`와 합치).
5. 성공 후 **즉시 다시 `social-login` 호출**해 JWT 수령(또는 백엔드가 가입 응답에 JWT 포함하도록 확장 시 그 경로로 통일).

### 4.2 “간편”의 한계 (백엔드)

- 현재 서버는 **비밀번호 필수(8자 이상)**. 순수 소셜만으로 끝내려면 다음 중 **하나를 택해 기획·법무 합의 후** 문서·API를 고친다.
  - **A안**: 서버가 **내부용 강난수 비밀번호**를 생성·해시 저장, 사용자에게는 비밀번호 입력 없음(이메일 찾기·ID 로그인 정책과 충돌 시 정리).
  - **B안**: `SOCIAL_ONLY` 계정 유형 추가, 로그인 경로를 소셜·JWT 위주로 제한(스코프 큼).
  - **C안**: “간편”이 아니라 **짧은 비밀번호 1회 설정**(8자)만 받는 화면 유지(구현 부담 최소, UX는 중간).

본 문서 **권고 초기값**: 구현 속도 우선 시 **C안**, 이탈 최소 시 **A안** + 법무 검토.

---

## 5. 카카오·네이버 개발자 센터와의 역할 분담

| 구분 | 개발자 센터(플랫폼) | MindGarden |
|------|---------------------|------------|
| 동의 | OAuth 범위·플랫폼 약관에 따른 **제3자 정보 제공 동의** | **서비스 제공·테넌트 처리**에 대한 약관·개인정보 동의 |
| 데이터 | 프로필·이메일 등 **제공 범위 내** | 수신 데이터 **저장 목적·보관 기간** 고지 |
| UX | 카카오 싱크 등 **가입 동선** 옵션 검토 | 테넌트 브랜딩·한 화면 요약·딥링크 복귀 |

---

## 6. API·계약 (정리)

| API | 용도 |
|-----|------|
| `POST /api/auth/social-login` | SDK 토큰·프로필로 로그인 또는 `requiresSignup` |
| `POST /api/v1/auth/social/signup?tenantId=` | 신규 사용자 생성 + `UserSocialAccount` 연동 |
| (선택 확장) 가입 응답에 `accessToken`/`refreshToken` | 재호출 없이 앱 세션 완료 — **보안 리뷰 후**만 권장 |

**멱등**: 동일 `tenantId + provider + providerUserId` 재가입 시도는 기존과 동일하게 **중복 이메일·계정** 규칙으로 거절.

---

## 7. 구현 체크리스트 (배치용)

### 7.1 기획·법무

- [ ] 가입 트리거: `requiresSignup`만 허용할지, `requiresPhoneAccountSelection` 등 **분기 통합** 문구.
- [ ] 비밀번호 정책: **A/B/C안** 확정 및 이용약관·고객센터 FAQ 반영.
- [ ] 동의 로그: 약관 **버전 ID**, 동의 시각, `tenantId`, `userId`(생성 후), 채널(`WEB`/`EXPO`).

### 7.2 백엔드 (`core-coder`)

- [ ] 선택한 비밀번호 정책에 맞춰 `SocialAuthServiceImpl`·DTO 검증 수정.
- [ ] (선택) 가입 직후 JWT 발급 또는 **명시적 `social-login` 재호출** 가이드.
- [ ] `requiresPhoneAccountSelection`과 순서·문구 정합.

### 7.3 Expo (`core-coder`)

- [ ] `(auth)/social-signup.tsx`(가칭) 또는 모달: 약관 + 제출 + 로딩·에러.
- [ ] `AuthService.socialSignup(...)` 래퍼, 성공 후 `loginWithKakao`/`loginWithNaver` 재호출 또는 토큰 수신.
- [ ] `X-Tenant-Id`·테넌트 선행 선택 흐름과 충돌 없음 확인.

### 7.4 웹 (`core-coder`)

- [ ] 기존 OAuth 콜백·소셜 가입 폼과 **필드·메시지 통일**.
- [ ] `StandardizedApi`, 표시 경계(`safeDisplay`) 준수.

### 7.5 검증 (`core-tester`)

- [ ] 미가입 소셜 → 가입 → 로그인까지 **E2E 한 줄**.
- [ ] 동일 소셜 재가입·다른 테넌트 동일 이메일(정책에 따라) 시나리오.
- [ ] 동의 미체크 시 400 및 메시지.

---

## 8. 위임 순서 (권장)

1. **core-planner**: 본 문서를 입력으로 C안 vs A안 **결정 요청** 및 일정 반영.
2. **core-designer**: 가입 1~2화면 와이어(웹·모바일 공통 톤).
3. **core-coder**: 백엔드 → Expo → 웹 순 또는 백엔드+웹 병렬.
4. **core-tester**: 위 7.5.

참조: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`

---

## 9. 관련 문서·코드 인덱스

| 유형 | 경로 |
|------|------|
| OAuth 트러블슈팅 | `docs/troubleshooting/OAUTH2_CALLBACK_AUTH_LOGIN_400_PASSWORD_REQUIRED.md` |
| Expo 로그인 | `expo-app/app/(auth)/login.tsx`, `expo-app/src/services/AuthService.ts` |
| 웹 콜백 | `frontend/src/components/auth/OAuth2Callback.js` |
| 네이티브 소셜 로그인 | `OAuth2Controller.java` (`/api/auth/social-login`) |
| 소셜 가입 | `SocialAuthController.java`, `SocialAuthServiceImpl.java` |
| 상수 메시지 | `OAuth2Constants.MESSAGE_SIGNUP_REQUIRED` 등 |

---

## 10. 개정 이력

| 날짜 | 내용 |
|------|------|
| 2026-05-13 | 초안 작성 — 현황·원칙·체크리스트·위임 순서 |
