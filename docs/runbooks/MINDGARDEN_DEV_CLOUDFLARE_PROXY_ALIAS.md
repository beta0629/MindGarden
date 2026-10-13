# mindgarden-dev Cloudflare 프록시 별칭 (DEV)

**목표**: `https://mindgarden-dev.core-solution.co.kr` 가 DEV 에서 `mindgarden.dev.core-solution.co.kr` 와 동일 `mindgarden` 테넌트로 동작하게 한다.

**범위**: DEV only. 운영(`*.core-solution.co.kr` grey/prod) 설정·nginx·yml 기본값은 변경하지 않는다.

## 1. DNS (수동 — Cloudflare API/워크플로 없음)

Zone: `core-solution.co.kr`

| Type | Name | Content | Proxy status |
|------|------|---------|--------------|
| A | `mindgarden-dev` | `114.202.247.246` | **Proxied** (orange cloud) |

- `*.dev.core-solution.co.kr` 레코드는 **DNS only(grey)** 로 유지한다.
- 글로벌 SSL/TLS 모드(예: Full)는 바꾸지 않는다. Origin 은 Origin CA + Full(strict) 전제.

## 2. Origin CA (서버)

프록시 호스트에는 **certbot HTTP-01 을 쓰지 않는다** (Cloudflare 가 challenge 를 가로챔).

### 권장: GitHub Environment `dev` Secrets → `deploy-nginx-dev`

`deploy-nginx-dev.yml` 은 job 에 `environment: dev` 를 두고, 배포 시 Origin CA PEM 을 서버에 설치한다.

| GitHub Environment `dev` Secret (이름만) | 서버 경로 |
|------------------------------------------|-----------|
| `MINDGARDEN_DEV_ORIGIN_CERT` | `/etc/ssl/cloudflare/mindgarden-dev.core-solution.co.kr/cert.pem` (mode 644) |
| `MINDGARDEN_DEV_ORIGIN_KEY` | `/etc/ssl/cloudflare/mindgarden-dev.core-solution.co.kr/privkey.pem` (mode 600) |

- Secret **값·PEM 본문은 문서·로그에 남기지 않는다.**
- `DEV_SERVER_HOST` / `DEV_SERVER_USER` / `DEV_SERVER_SSH_KEY` 는 repository-level 이어도 `environment: dev` job 에서 상속된다. 동일 키가 Environment 에도 있으면 Environment 값이 우선한다.
- Secrets 가 비어 있으면 Origin CA 설치 step 이 실패한다 (값 미출력).

### 수동 설치 (로컬/시크릿 없는 수동 실행용)

1. Cloudflare Dashboard → SSL/TLS → Origin Server → Create Certificate  
   - Hostnames: `mindgarden-dev.core-solution.co.kr`
2. 서버에 설치:

```bash
sudo mkdir -p /etc/ssl/cloudflare/mindgarden-dev.core-solution.co.kr
# cert.pem = Origin Certificate, privkey.pem = Private Key
sudo install -m 644 cert.pem /etc/ssl/cloudflare/mindgarden-dev.core-solution.co.kr/cert.pem
sudo install -m 600 privkey.pem /etc/ssl/cloudflare/mindgarden-dev.core-solution.co.kr/privkey.pem
sudo nginx -t && sudo systemctl reload nginx
```

`deploy-nginx-dev.yml` 적용 step 은 위 PEM 이 없으면 mindgarden-dev **HTTPS** 블록만 제거하고 경고 후 나머지 vhost 는 정상 reload 한다 (시크릿 없는 로컬/수동 폴백). CI 에서는 설치 step 이 먼저 돌아가 PEM 이 있으면 HTTPS 블록을 유지한다. **nginx stop / 앱 restart 금지**.

## 3. 앱 설정 (DEV)

| 위치 | 키 | 값 예 |
|------|-----|--------|
| `config/environments/development/dev.env` | `TENANT_HOST_ALIASES` | `mindgarden-dev.core-solution.co.kr:mindgarden` |
| `application-dev.yml` | `tenant.host-aliases` | `${TENANT_HOST_ALIASES:...}` |
| `dev.env` | `CORS_ALLOWED_ORIGINS` | (optional) extra exact origins |
| FE 빌드 (`deploy-frontend-dev.yml`) | `REACT_APP_TENANT_HOST_ALIASES` | 동일 형식 |

호스트명 매핑은 env/yml 만 사용한다. Java/JS 비즈니스 로직에 호스트 하드코딩 금지.

DEV CORS 는 `tenant.host-aliases` / `TENANT_HOST_ALIASES` 호스트를 자동으로 exact origin(`https://`·`http://`)에 합류한다 — `CORS_ALLOWED_ORIGINS` 가 비어 있어도 별칭 Origin 이 허용된다.

- OAuth apex·Kakao/Naver redirect URI 는 `dev.core-solution.co.kr` 유지.
- 쿠키는 DEV host-only — 별칭 호스트에서 Domain 변경 불필요.
- PortOne 웹훅은 가능하면 canonical `mindgarden.dev` 유지. 필요 시 `REACT_APP_PG_WEBHOOK_PUBLIC_ORIGIN` 문서만 참고(prod 기본값 변경 금지).

## 4. 배포 순서

1. DNS A(proxied) + Origin CA 설치  
2. nginx 설정 배포 (`deploy-nginx-dev`)  
3. 백엔드 DEV 배포 (TENANT_HOST_ALIASES / CORS 반영)  
4. 프론트엔드 DEV 빌드·배포 (`REACT_APP_TENANT_HOST_ALIASES`)

## 5. 검증

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://mindgarden-dev.core-solution.co.kr/actuator/health
curl -sS -o /dev/null -w '%{http_code}\n' https://mindgarden-dev.core-solution.co.kr/login
# 기대: 200

# 테넌트 판별 신호 (별칭 미적용 시 TENANT_ID_REQUIRED)
curl -sS https://mindgarden-dev.core-solution.co.kr/api/v1/tenants/current
# 기대: TENANT_ID_REQUIRED 없음. redirectToLogin / 인증이 필요합니다 또는 401/403
# (mindgarden.dev 와 동일하게 테넌트는 잡히고 미인증인 상태)
```

수동 workflow: `.github/workflows/verify-mindgarden-dev-alias.yml` (`workflow_dispatch`) — health, login, **`/api/v1/tenants/current` 테넌트 판별** 3단계.

## 6. 관련 메모

- Playwright 등 host gate(#1600 계열)가 `*.dev.core-solution.co.kr` 만 허용하면 alias 를 `base_url` 로 쓰면 거부될 수 있다. 검증은 별칭 전용 curl/workflow 권장.
- Open PR 겹침: sync scripts(#1595), diagnose(#1599), playwright host gate(#1600) — 해당 파일은 이 작업에서 수정하지 않음.
