# beta74 — `core-solution.co.kr` HTTPS (apex) 반영

## 배경

- Let’s Encrypt 인증서: `/etc/letsencrypt/live/core-solution.co.kr/` (`*.core-solution.co.kr` + apex)
- 서버 `sites-available/core-solution` 에 **apex `server` 블록이 없으면** 브라우저에서 루트 도메인이 HTTP로만 열림
- 테넌트 와일드카드 블록의 인증서 경로가 **`core-solution.co.kr-0001`** 이면 새 인증서와 불일치 → **`core-solution.co.kr`** 로 수정

## Repo 반영 내용

| 파일 | 내용 |
|------|------|
| `config/nginx/core-solution-prod.conf` | apex(80/443) + `www`→apex 301, 와일드카드 SSL 경로 수정 |
| | **e-trinity.co.kr / apply.e-trinity.co.kr / ops.e-trinity.co.kr** 는 개발(`core-solution-dev.conf`)과 동일 패턴: `html-trinity`·`html-ops` 정적 + `/api/`·`/actuator/` 프록시 |
| `scripts/deployment/apply-core-solution-nginx-beta74.sh` | scp + 원격 `nginx -t` + reload (대화형 확인) |

**전제:** 서버에 `/var/www/html-trinity`, `/var/www/html-ops` 배포가 개발과 같이 되어 있어야 SPA·온보딩·Ops 화면이 뜹니다.

## 서버에 적용 방법

### A) 통합 파일이 서버와 동일한 경우

로컬(MindGarden)에서:

```bash
./scripts/deployment/apply-core-solution-nginx-beta74.sh
```

또는 수동:

```bash
scp config/nginx/core-solution-prod.conf root@beta74.cafe24.com:/tmp/core-solution-prod.conf
ssh root@beta74.cafe24.com
sudo cp -a /etc/nginx/sites-available/core-solution /etc/nginx/sites-available/core-solution.bak.$(date +%Y%m%d%H%M)
sudo cp /tmp/core-solution-prod.conf /etc/nginx/sites-available/core-solution
sudo nginx -t && sudo systemctl reload nginx
```

### B) 서버 파일이 일부만 있는 경우 (e-trinity 등 분리)

`config/nginx/core-solution-prod.conf` 에서 **「Apex 루트 도메인」~「운영 서버: app…」 직전** 블록만 복사해 `/etc/nginx/sites-available/core-solution` **앞쪽**에 붙이고, 테넌트 `server` 의

```nginx
ssl_certificate     /etc/letsencrypt/live/core-solution.co.kr/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/core-solution.co.kr/privkey.pem;
```

로 교체.

## 확인

- `https://core-solution.co.kr` — 자물쇠
- `curl -sI https://core-solution.co.kr/ | head -5`

## 참고

- `conflicting server name` 경고는 **다른 파일에 동일 `server_name` 중복** 시 발생 → `grep -r server_name /etc/nginx/` 로 정리
