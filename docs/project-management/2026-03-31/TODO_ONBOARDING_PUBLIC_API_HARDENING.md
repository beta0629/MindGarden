# TODO: Trinity·공개 온보딩 API 보안 보강 (운영)

**배경:** 운영에서 로그인 전 온보딩·이메일 인증 API가 CSRF 없이 동작하도록 `SecurityConfig` 에 `ignoringRequestMatchers` 가 추가됨 (`/api/v1/accounts/integration/**`, `/api/v1/onboarding/**`, `/api/v1/ops/onboarding/**`). 스팸·남용·무차별 요청에 취약해질 수 있어 후속 조치가 필요함.

## 체크리스트

- [ ] **Rate limiting** — IP·이메일 기준 발송/온보딩 POST 제한 (NGINX `limit_req`, Spring Bucket4j, 또는 WAF)
- [ ] **이메일 인증 발송** — 동일 주소·동일 IP 단위 쿨다운 및 일일 상한 (백엔드 또는 메일 게이트웨이)
- [ ] **봇 완화** — 필요 시 CAPTCHA / Turnstile / hCaptcha 등 (Trinity 발송 버튼 직전)
- [ ] **모니터링·알림** — `/api/v1/accounts/integration/**` 4xx·5xx 급증 시 알람
- [ ] **문서화** — `PERMISSION_SYSTEM_STANDARD.md` 또는 배포 문서에 “공개 POST는 CSRF 제외 + 외부 제한 필수” 명시

**참고 커밋:** `fix(security): 운영 CSRF에서 온보딩·이메일 인증 공개 API 제외` (main)

**담당 제안:** `core-coder`(구현), 인프라는 배포/Nginx 담당과 합의
