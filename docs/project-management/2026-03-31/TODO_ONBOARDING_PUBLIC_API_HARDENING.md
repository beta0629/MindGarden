# TODO: Trinity·공개 온보딩 API 보안 보강 (운영)

**배경:** 운영에서 로그인 전 온보딩·이메일 인증 API가 CSRF 없이 동작하도록 `SecurityConfig` 에 `ignoringRequestMatchers` 가 추가됨 (`/api/v1/accounts/integration/**`, `/api/v1/onboarding/**`, `/api/v1/ops/onboarding/**`). 스팸·남용·무차별 요청에 취약해질 수 있어 후속 조치가 필요함.

## 체크리스트

- [x] **Rate limiting (앱 + 엣지 문서)** — 앱: `RateLimitingFilter` 등(위와 동일). **엣지**: 저장소 가이드 [`docs/deployment/NGINX_RATE_LIMIT_PUBLIC_API.md`](../../deployment/NGINX_RATE_LIMIT_PUBLIC_API.md) — 실서버 `nginx` 적용·WAF는 인프라 합의 후.
- [x] **이메일 인증 발송** — `AccountIntegrationServiceImpl` 이메일별 쿨다운·일일 상한 (`mindgarden.security.account-integration.*`). 메일 게이트웨이 이중 한도는 선택.
- [~] **봇 완화** — 백엔드: `CaptchaVerifier`·`POST /api/v1/onboarding/requests`·`GET /api/v1/onboarding/captcha/site-key`·`OnboardingControllerCaptchaWebMvcTest`. **잔여**: Trinity 온보딩 UI(Turnstile·발송 버튼 직전)·운영 키·필요 시 hCaptcha 등
- [x] **모니터링·알림** — 앱: `RateLimitingFilter` 429 차단 시 `mindgarden.rate_limit.blocked` 카운터 추가됨. Prometheus/Grafana 알람 규칙·대시보드는 인프라 설정에서 명시.
- [x] **문서화** — `docs/standards/PERMISSION_SYSTEM_STANDARD.md` 에 공개 API·CSRF 제외·레이트리밋(운영) 절 추가. 배포 문서 보강은 인프라/릴리스 노트 합의 시.

**참고 커밋:** `fix(security): 운영 CSRF에서 온보딩·이메일 인증 공개 API 제외` (main)

**담당 제안:** `core-coder`(구현), 인프라는 배포/Nginx 담당과 합의
