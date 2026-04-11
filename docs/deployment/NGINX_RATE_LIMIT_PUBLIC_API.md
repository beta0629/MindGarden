# SEC-01: 엣지(Nginx) 레이트리밋 — 공개 API (IP 기준)

**목적**: 공개 POST 엔드포인트에 대해 **애플리케이션 레이어**와 별도로 **엣지(Nginx)** 에서 요청 속도를 제한하는 패턴을 저장소에 고정한다.  
**범위**: 문서·예시 설정만. 실제 서버 배포·`nginx -t`·`reload` 는 인프라 절차에 따른다.

---

## 배경·정합

로그인 전·온보딩·계정 연동 등 **공개 POST** 는 `SecurityConfig` 에서 CSRF 검증이 제외될 수 있다. 이 경우 브라우저 CSRF 토큰만으로는 남용 방지가 되지 않으므로, 표준 문서에서 요구하는 대로 다음을 **함께** 적용한다.

| 층 | 역할 |
|----|------|
| **앱** | `mindgarden.security.*`(예: 계정 연동 쿨다운·일일 상한), `RateLimitingFilter` 등으로 IP 기준 429 |
| **엣지(선택·권장)** | Nginx `limit_req` 등으로 동일·우선 경로에 **추가 상한**(이중 방어) |

정합 참고:

- [`docs/standards/PERMISSION_SYSTEM_STANDARD.md`](../standards/PERMISSION_SYSTEM_STANDARD.md) — 공개 API·CSRF 제외·레이트리밋(운영), 메트릭 `mindgarden.rate_limit.blocked`
- [`docs/project-management/2026-03-31/TODO_ONBOARDING_PUBLIC_API_HARDENING.md`](../project-management/2026-03-31/TODO_ONBOARDING_PUBLIC_API_HARDENING.md) — 온보딩·연동 공개 API 하드닝, 엣지 `limit_req` 는 인프라 합의 후 별도

저장소 Nginx 운영 예시 레이아웃은 `config/nginx/core-solution-prod.conf` 의 **`server_name api.core-solution.co.kr`** 블록(루트 `location /` 프록시)을 참고한다. 아래 예시는 **API 전용 호스트**에만 `limit_req` 를 두는 패턴이다(앱 정적 호스트의 `/api/` 와 혼동하지 않음).

---

## `limit_req_zone` / `limit_req` 예시 (IP 기준)

`http` 컨텍스트(또는 `conf.d` 에서 `include` 되는 상단 파일)에 **존**을 정의하고, **API 호스트** `server` 안에서 우선 경로만 별도 `location` 으로 잡아 적용한다.

### 1) 존 정의 (`http` 블록 내부)

키는 `$binary_remote_addr`(클라이언트 IP)를 사용한다. 실제 `rate`(초당·분당 요청 수)·존 이름은 트래픽·용량에 맞게 인프라에서 조정한다.

```nginx
# 예: 분당 N회(초당 환산 rate=r/s). 숫자는 합의 후 확정.
limit_req_zone $binary_remote_addr zone=mg_public_api:10m rate=5r/s;
```

### 2) API 호스트에서 경로별 `location` (프록시에만 적용)

`api.core-solution.co.kr` 의 `server { ... }` 안에서, **더 긴 접두 경로**를 가진 `location` 을 기존 `location /` 보다 **위**에 둔다(접두 매칭 우선). 각 블록에 `limit_req` 후 기존과 동일한 `proxy_pass`·헤더를 반복한다.

우선 적용 후보 경로 예시:

- `/api/v1/onboarding/`
- `/api/v1/accounts/integration/`

```nginx
# 예시: API 전용 server 블록 내부 (ssl·로그는 기존과 동일)
# 먼저 민감 경로 — 엣지 레이트리밋
location /api/v1/onboarding/ {
    limit_req zone=mg_public_api burst=20 nodelay;
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    # CORS 등 기존 API server 블록과 동일 정책을 맞출 것
}

location /api/v1/accounts/integration/ {
    limit_req zone=mg_public_api burst=20 nodelay;
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# 나머지 API — 기존 location / 유지 (limit_req 없음 또는 별도 존)
location / {
    proxy_pass http://127.0.0.1:8080;
    # ...
}
```

**주의**

- `ops` 전용 온보딩 등 예외 경로가 있으면 `location ^~ /api/v1/ops/onboarding/` 처럼 **제외·별도 한도**를 문서화한다.
- 리버스 프록시 앞에 또 다른 프록시가 있으면 실제 클라이언트 IP 를 `X-Forwarded-For` / `real_ip` 로 맞추는 설정이 선행되어야 IP 기준이 의미 있다.

---

## 앱 메트릭·Prometheus 알람 (인프라 연계)

애플리케이션은 429 차단 시 Micrometer 카운터 **`mindgarden.rate_limit.blocked`** (태그 `reason` 등)를 증가시킨다. Prometheus·Grafana 에서 **`rate(mindgarden_rate_limit_blocked_total[5m])`** 등 임계 알람을 거는 규칙·대시보드는 **인프라 측** 저장소·알람 채널에서 별도로 정의·배포한다. 엣지 `limit_req` 가 503/429 를 반환하는 경우는 Nginx `error.log`·`stub_status` 등과 함께 운영 관측 정책에 편입한다.

---

## 롤백

- 해당 **`location` 블록만** 주석 처리하거나, `limit_req` 줄만 제거한 뒤 `nginx -t` 및 `reload` 를 인프라 절차대로 수행한다.
- `limit_req_zone` 정의는 다른 `location` 에서 재사용 중이면 함부로 삭제하지 말고, 미사용 시에만 정리한다.

---

## 배포·저장소 연계

- Nginx 설정 변경은 저장소 `config/nginx/**` 및 GitHub Actions [`deploy-nginx-dev.yml`](../../.github/workflows/deploy-nginx-dev.yml) 등과의 정합을 따른다.
- 운영 반영 전 체크리스트: [`docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md), [`docs/standards/DEPLOYMENT_STANDARD.md`](../standards/DEPLOYMENT_STANDARD.md).

**최종 업데이트**: 2026-04-11
