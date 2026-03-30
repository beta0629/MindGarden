# 개발 서버 SSL 인증서 오류 (ERR_CERT_DATE_INVALID) — 네이버/카카오 OAuth

## 증상

- 브라우저: **"The certificate for this site is not trusted"** / `net::ERR_CERT_DATE_INVALID`
- 인증서 유효기간: **1970. 1. 21.** 등 잘못된 날짜
- **네이버 로그인** 등 OAuth callback (`https://dev.core-solution.co.kr/api/auth/naver/callback`) 접속 시 인증서 오류로 실패

## 원인

- `dev.core-solution.co.kr`에 사용 중인 SSL 인증서가 **날짜 오류**(1970년대) 또는 **만료/비정상** 상태임.
- Nginx 설정은 `/etc/letsencrypt/live/dev.core-solution.co.kr/` Let's Encrypt 인증서를 참조하나, 해당 경로에 잘못된 인증서가 있거나 갱신이 안 된 경우.

## 즉시 조치 (개발 서버 SSH 접속 후)

개발 서버에 SSH 접속한 뒤 아래를 **순서대로** 실행하세요.

```bash
# 1) 인증서 상태 확인
sudo openssl x509 -in /etc/letsencrypt/live/dev.core-solution.co.kr/fullchain.pem -noout -startdate -enddate 2>/dev/null || echo "인증서 없음"

# 2) 잘못된 인증서 삭제 후 재발급 (Nginx 잠시 중지)
sudo certbot delete --cert-name dev.core-solution.co.kr --non-interactive 2>/dev/null || true
sudo systemctl stop nginx

# 3) Let's Encrypt로 재발급 (standalone, 80 포트 사용)
sudo certbot certonly --standalone -d dev.core-solution.co.kr \
  --non-interactive --agree-tos --email admin@core-solution.co.kr \
  --preferred-challenges http

# 4) Nginx 재시작
sudo systemctl start nginx
sudo nginx -t && sudo systemctl reload nginx
```

재발급 후 브라우저에서 `https://dev.core-solution.co.kr` 접속해 인증서가 정상인지 확인하고, 네이버 로그인을 다시 시도하세요.

## 자동 반영 (CI)

- **Nginx 설정 배포 워크플로** (`.github/workflows/deploy-nginx-dev.yml`)에서 `dev.core-solution.co.kr` 인증서를 검사합니다.
- 인증서가 없거나 **날짜가 1970년** 등 비정상이면 자동으로 재발급을 시도합니다.
- `config/nginx/**` 변경 후 push하거나, 워크플로를 **수동 실행**하면 동일 검사/재발급이 수행됩니다.

## 참고

- Nginx 설정: `config/nginx/core-solution-dev.conf` — `dev.core-solution.co.kr`의 `ssl_certificate` 경로는 `/etc/letsencrypt/live/dev.core-solution.co.kr/fullchain.pem` 입니다.
- OAuth redirect URI: `config/environments/development/dev.env` — `NAVER_REDIRECT_URI=https://dev.core-solution.co.kr/api/auth/naver/callback`
