# SSL 인증서 자동 갱신 설정 가이드

**목적**: 개발/운영 서버에서 Let's Encrypt SSL 인증서가 자동 갱신되도록 설정

---

## 1. 자동 갱신 실패 원인 (개발 서버 사례)

### 1.1 `authenticator = standalone` 사용

- **문제**: standalone은 80번 포트를 직접 사용하는데, Nginx가 이미 80번 포트 사용 중
- **오류**: `Could not bind TCP port 80 because it is already in use`
- **해결**: 인증서 발급/갱신 시 `--nginx` 플러그인 사용 (certbot이 Nginx를 통해 HTTP-01 검증)

### 1.2 와일드카드 인증서 (`*.domain`)

- **문제**: 와일드카드는 DNS-01 검증만 지원 → `authenticator = manual` 사용
- **특성**: 사람이 DNS TXT 레코드를 추가해야 하므로 **자동 갱신 불가**
- **해결**: 3개월마다 수동 갱신 또는 DNS API 연동(예: certbot-dns-gabia)

---

## 2. 인증서 유형별 자동 갱신 가능 여부

| 인증서 | authenticator | 자동 갱신 | 비고 |
|--------|---------------|-----------|------|
| app.core-solution.co.kr | nginx | ✅ | `certbot --nginx` 사용 시 |
| api.core-solution.co.kr | nginx | ✅ | 동일 |
| api.dev.core-solution.co.kr | nginx | ✅ | 2026-02 수정 완료 |
| *.dev.core-solution.co.kr | manual (dns-01) | ❌ | 수동 갱신 필요 |
| *.core-solution.co.kr | manual (dns-01) | ❌ | 수동 갱신 필요 |

---

## 3. 자동 갱신 활성화 체크리스트

### 3.1 certbot.timer 확인

```bash
systemctl status certbot.timer
# active (waiting) 이어야 함. 12시간마다 certbot renew 실행
```

### 3.2 갱신 설정 authenticator 확인

```bash
# Nginx 사용자(개별 도메인) - nginx여야 자동 갱신 가능
grep authenticator /etc/letsencrypt/renewal/*.conf
```

- `authenticator = nginx` → ✅ 자동 갱신 가능
- `authenticator = standalone` → ❌ 포트 80 충돌로 실패. nginx로 재발급 필요
- `authenticator = manual` → ❌ 와일드카드. 수동 갱신만 가능

### 3.3 잘못된 설정 수정 (standalone → nginx)

```bash
# 예: api.core-solution.co.kr이 standalone인 경우
sudo certbot certonly --nginx -d api.core-solution.co.kr --force-renewal --non-interactive --agree-tos -m admin@core-solution.co.kr

# 갱신 후 Nginx 재로드
sudo systemctl reload nginx
```

---

## 4. 개발 서버 (114.202.247.246 / beta0629.cafe24.com)

### 4.1 개별 도메인 (nginx 플러그인)

```bash
ssh root@beta0629.cafe24.com

# api.dev.core-solution.co.kr - 2026-02 수정 완료 (nginx)
# dev.core-solution.co.kr, apply.dev.e-trinity.co.kr 등 - nginx 사용 권장

# 설정 확인
sudo certbot certificates
cat /etc/letsencrypt/renewal/api.dev.core-solution.co.kr.conf | grep authenticator
# authenticator = nginx 이어야 함
```

### 4.2 와일드카드 (*.dev.core-solution.co.kr)

- **자동 갱신 불가**. 3개월마다 수동 갱신 필요
- 갱신: `scripts/server-management/ssl/issue-wildcard-ssl-dev.sh` 또는 수동 DNS TXT 추가 후 certbot 실행

---

## 5. 운영 서버 (211.37.179.204)

### 5.1 사전 확인

```bash
ssh root@<운영서버호스트>

# 1. certbot.timer 활성화 확인
systemctl status certbot.timer

# 2. 각 인증서 authenticator 확인
for f in /etc/letsencrypt/renewal/*.conf; do
  echo "=== $f ==="
  grep -E "authenticator|installer" "$f" 2>/dev/null || true
done
```

### 5.2 nginx로 통일 (standalone인 경우)

운영 서버에서 `authenticator = standalone` 인 도메인이 있으면 아래처럼 nginx로 재발급:

```bash
# app.core-solution.co.kr
sudo certbot certonly --nginx -d app.core-solution.co.kr --force-renewal --non-interactive --agree-tos -m admin@core-solution.co.kr

# api.core-solution.co.kr
sudo certbot certonly --nginx -d api.core-solution.co.kr --force-renewal --non-interactive --agree-tos -m admin@core-solution.co.kr

# e-trinity 관련
sudo certbot certonly --nginx -d e-trinity.co.kr -d www.e-trinity.co.kr --force-renewal --non-interactive --agree-tos -m admin@e-trinity.co.kr
sudo certbot certonly --nginx -d apply.e-trinity.co.kr --force-renewal --non-interactive --agree-tos -m admin@e-trinity.co.kr
sudo certbot certonly --nginx -d ops.e-trinity.co.kr --force-renewal --non-interactive --agree-tos -m admin@e-trinity.co.kr

# 갱신 후
sudo systemctl reload nginx
```

### 5.3 와일드카드 (*.core-solution.co.kr)

- **자동 갱신 불가**. 3개월마다 수동 갱신
- 스크립트: `scripts/server-management/ssl/issue-wildcard-ssl-prod.sh`

---

## 6. 갱신 테스트 (실제 갱신 없이)

```bash
sudo certbot renew --dry-run
```

- 성공: `Congratulations, all simulated renewals succeeded`
- 실패: 오류 메시지 확인 후 authenticator 수정

---

## 7. 만료 알림 (선택)

- Let's Encrypt는 만료 30일 전부터 갱신 시도
- 추가로 만료 알림을 받으려면 모니터링 스크립트 또는 cron에서 `certbot certificates` 출력을 검사

---

## 8. 요약

| 작업 | 개발 서버 | 운영 서버 |
|------|-----------|-----------|
| certbot.timer | ✅ 활성화 확인 | ✅ 활성화 확인 |
| 개별 도메인 authenticator | nginx로 통일 | nginx로 통일 |
| 와일드카드 | 3개월 수동 갱신 | 3개월 수동 갱신 |
| 갱신 테스트 | `certbot renew --dry-run` | `certbot renew --dry-run` |
