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

**완료 조건 (origin proof)**: `mindgarden-dev` 가 **DEV(`.dev`) origin** 과 같고 **운영(prod) 과 다르다**는 것을 증명한다.  
**HTTP 200 alone is NOT proof** — Cloudflare wildcard `*.core-solution.co.kr` 가 운영으로 붙어도 200 이 나올 수 있다.  
로그인·자격증명·쓰기 요청은 origin proof 통과 전까지 하지 않는다 (검증 워크플로도 read-only curl 만).

### 5.1 FE 번들 지문 (`/login` HTML)

세 호스트를 비교한다.

| Host | URL |
|------|-----|
| ALIAS | `https://mindgarden-dev.core-solution.co.kr` |
| DEV | `https://mindgarden.dev.core-solution.co.kr` |
| PROD | `https://mindgarden.core-solution.co.kr` |

```bash
# 각 호스트 /login 에서 static/js/main.<hash>.js 추출 후 비교
# 하드 게이트:
#   - ALIAS hash 비어 있으면 FAIL
#   - ALIAS hash == PROD hash → FAIL (prod wildcard 잔존)
#   - ALIAS hash != DEV hash → FAIL (.dev 와 불일치)
# Last-Modified 는 참고 로그 (게이트 아님)
```

### 5.2 Backend 지문 (`/actuator/health` + `/actuator/info`)

```bash
# ALIAS + DEV /actuator/health → HTTP 200 이고 status UP (DEV baseline 없으면 증명 불가 → FAIL)
# ALIAS + DEV + PROD /actuator/info JSON
#   - ALIAS git.commit.id == DEV (commit 없으면 git.branch 로 대조)
#   - PROD info 가용 시 ALIAS commit != PROD commit
#   - PROD branch 가 prod / release/prod 이면 ALIAS 는 그 값이 아니어야 함
# DEV /actuator/info 가 502 등이면 soft-pass 금지 — "cannot prove" 로 FAIL
```

### 5.3 테넌트 판별 (origin proof **이후**만)

```bash
curl -sS https://mindgarden-dev.core-solution.co.kr/api/v1/tenants/current
# 기대: TENANT_ID_REQUIRED 없음. redirectToLogin / 인증이 필요합니다 또는 401/403
# (mindgarden.dev 와 동일하게 테넌트는 잡히고 미인증인 상태)
```

수동 workflow: `.github/workflows/verify-mindgarden-dev-alias.yml` (`workflow_dispatch`)  
순서: **(1) FE 번들 대조 → (2) actuator health/info 대조 → (3) tenants/current**.  
(1)(2) 실패 시 (3) 은 실행되지 않는다.

## 6. 관련 메모

- Playwright 등 host gate(#1600 계열)가 `*.dev.core-solution.co.kr` 만 허용하면 alias 를 `base_url` 로 쓰면 거부될 수 있다. 검증은 별칭 전용 curl/workflow 권장.
- Open PR 겹침: sync scripts(#1595), diagnose(#1599), playwright host gate(#1600) — 해당 파일은 이 작업에서 수정하지 않음.
