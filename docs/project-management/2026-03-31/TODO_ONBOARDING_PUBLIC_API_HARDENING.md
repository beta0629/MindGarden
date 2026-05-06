# TODO: Trinity·공개 온보딩 API 보안 보강 (운영)

**배경:** 운영에서 로그인 전 온보딩·이메일 인증 API가 CSRF 없이 동작하도록 `SecurityConfig` 에 `ignoringRequestMatchers` 가 추가됨 (`/api/v1/accounts/integration/**`, `/api/v1/onboarding/**`, `/api/v1/ops/onboarding/**`). 스팸·남용·무차별 요청에 취약해질 수 있어 후속 조치가 필요함.

## 체크리스트

- [x] **Rate limiting (앱 + 엣지 문서)** — 앱: `RateLimitingFilter` 등(위와 동일). **엣지**: 저장소 가이드 [`docs/deployment/NGINX_RATE_LIMIT_PUBLIC_API.md`](../../deployment/NGINX_RATE_LIMIT_PUBLIC_API.md) — 실서버 `nginx` 적용·WAF는 인프라 합의 후.
- [x] **이메일 인증 발송** — `AccountIntegrationServiceImpl` 이메일별 쿨다운·일일 상한 (`mindgarden.security.account-integration.*`). 메일 게이트웨이 이중 한도는 선택.
- **봇 완화**
  - [x] 백엔드: `OnboardingController` — `POST` 생성 시 `verifyOnboardingCaptchaIfRequired`, `GET /api/v1/onboarding/captcha/site-key`.
  - [x] Trinity: `frontend-trinity/components/onboarding/OnboardingCaptchaSection.tsx`, `app/onboarding/page.tsx` 대시보드 단계에서 토큰 수집, `useOnboarding.ts`에서 `captchaToken`을 생성 요청에 포함.
  - [ ] **후속**: 이메일 인증 발송 등 다른 공개 `POST`에 CAPTCHA 필드가 없으면 발송 직전 Turnstile은 제품·백엔드 계약·스키마 정의 후.
- [x] **모니터링·알림** — 앱: `RateLimitingFilter` 429 차단 시 `mindgarden.rate_limit.blocked` 카운터 추가됨. Prometheus/Grafana 알람 규칙·대시보드는 인프라 설정에서 명시.
- [x] **문서화** — `docs/standards/PERMISSION_SYSTEM_STANDARD.md` 에 공개 API·CSRF 제외·레이트리밋(운영) 절 추가. 배포 문서 보강은 인프라/릴리스 노트 합의 시.

**참고 커밋:** `fix(security): 운영 CSRF에서 온보딩·이메일 인증 공개 API 제외` (main)

Turnstile 등 **운영 키** 적용과 **Nginx**(엣지 레이트리밋·WAF 연계 포함)는 상단 체크리스트의 **엣지·인프라** 항목과 같은 트랙에서 릴리스·합의한다. 별도 실험 트랙이 아니라 배포 가이드·실서버 `nginx` 반영 절차를 따른다.

**담당 제안:** `core-coder`(구현), 인프라는 배포/Nginx 담당과 합의

---

## 공개 POST 인벤토리 (CSRF 제외·`permitAll` 계열, 코드 근거)

`SecurityConfig` 운영 프로파일: `ignoringRequestMatchers` 및 `permitAll` 에 포함된 `/api/v1/accounts/integration/**`, `/api/v1/onboarding/**`, `/api/v1/ops/onboarding/**` 기준. 아래는 **POST** 만 정리.

| HTTP 메서드·경로 | 앱 레이어 레이트리밋 (IP/분) | CAPTCHA (Turnstile 등) | 기타 앱 보호 | 코드 근거 |
| --- | --- | --- | --- | --- |
| `POST /api/v1/accounts/integration/send-verification-code` | 예 — `RateLimitingFilter` + `mindgarden.security.rate-limit.integration-path-prefix` 접두 매칭 시 IP당 `integration-requests-per-minute` | 없음 (요청 스키마에 토큰 필드 없음) | 예 — 이메일별 쿨다운·일일 상한 (`mindgarden.security.account-integration.*`, `AccountIntegrationServiceImpl`) | `RateLimitingConfig.RateLimitingFilter`, `MindgardenSecurityProperties.RateLimit`, `AccountIntegrationController`, `AccountIntegrationServiceImpl` |
| `POST /api/v1/accounts/integration/verify-code` | 예 — 동일 접두 | 없음 | 없음 (코드 검증만) | 위와 동일 |
| `POST /api/v1/accounts/integration/integrate` | 예 — 동일 | 없음 | 없음 (테넌트 컨텍스트·비즈니스 검증은 서비스) | 위와 동일 |
| `POST /api/v1/accounts/integration/link-social` | 예 — 동일 | 없음 | 없음 | 위와 동일 |
| `POST /api/v1/onboarding/requests` | 예 — URI가 `mindgarden.security.rate-limit.onboarding-create-path` 와 **정확히 일치**하는 POST 만 (`onboarding-create-requests-per-minute`) | 조건부 — `CaptchaVerifier.requiresCaptchaToken()` 이 참일 때 `OnboardingCreateRequest.captchaToken` 검증 (`verifyOnboardingCaptchaIfRequired`) | 없음 | `RateLimitingConfig.RateLimitingFilter`, `OnboardingController#create` |
| `POST /api/v1/onboarding/requests/{id}/decision` | **아니오** (위 온보딩 생성 전용 경로만 한도) | 없음 | `OpsPermissionUtils.requireAdminOrOps()` 는 **`/api/v1/ops/onboarding` 접두일 때만** 호출 | `OnboardingController#decide` |
| `POST /api/v1/onboarding/requests/{id}/retry` | **아니오** | 없음 | ops 접두일 때만 관리자 검사 | `OnboardingController#retryApproval` |
| `POST /api/v1/onboarding/requests/{id}/retry-initialization` | **아니오** | 없음 | ops 접두일 때만 관리자 검사 | `OnboardingController#retryInitialization` |
| `POST /api/v1/ops/onboarding/requests` | **아니오** (레이트리밋은 공개 생성 경로만 명시) | 조건부 — 동일 `create` 핸들러 | ops 경로에서는 세션·역할에 따른 접근 통제가 **별도** 필요(본 표는 레이트리밋·CAPTCHA 만 기술) | `OnboardingController#create` + `SecurityConfig` permitAll |
| `POST /api/v1/ops/onboarding/requests/{id}/decision` | **아니오** | 없음 | 예 — `OpsPermissionUtils.requireAdminOrOps()` | `OnboardingController#decide` |
| `POST /api/v1/ops/onboarding/requests/{id}/retry` | **아니오** | 없음 | 예 — 동일 | `OnboardingController#retryApproval` |
| `POST /api/v1/ops/onboarding/requests/{id}/retry-initialization` | **아니오** | 없음 | 예 — 동일 | `OnboardingController#retryInitialization` |

**차기 스펙 (제품·계약·DTO 합의 후에만 구현)**

- 이메일 인증 발송(`send-verification-code`) 등 CAPTCHA 없는 공개 POST 에 선택적 `captchaToken`(또는 동등 필드) 도입 및 `CaptchaVerifier` 연동.
- 공개 `/api/v1/onboarding/requests/*/decision|retry|retry-initialization` 이 의도된 공개면 별도 레이트리밋·CAPTCHA·인증 설계, 의도되지 않았다면 경로별 권한 정리(별도 변경 요청).
