# 개발/운영 서버 — 서브도메인(SSL) 자동 갱신

## 1. Certbot이 이미 하는 일

Ubuntu 등에서 `certbot` 패키지를 쓰면 보통 **systemd timer** 또는 **cron**으로  
`certbot renew`가 **하루 2번** 정도 돌아가게 설치됩니다.

확인:

```bash
sudo systemctl list-timers | grep -i certbot
# 또는
sudo cat /etc/cron.d/certbot
```

별도 “배치”가 없어도 **HTTP-01(webroot) 등 무인 갱신 가능한 인증서**는 여기서 갱신됩니다.

갱신 후 nginx를 자동으로 다시 읽게 하려면 **renewal 설정에 deploy hook**을 넣거나, 아래 스크립트를 cron에서 돌리면 됩니다.

---

## 2. 레포 스크립트

`scripts/deployment/certbot-renew-and-reload-nginx.sh`

- `certbot renew` 후 **실제로 갱신된 경우에만** `systemctl reload nginx` (certbot `--deploy-hook`)

서버에 복사 후:

```bash
sudo install -m 755 certbot-renew-and-reload-nginx.sh /root/scripts/
sudo /root/scripts/certbot-renew-and-reload-nginx.sh
```

cron 예시 (이미 certbot cron이 있으면 **중복되지 않게** 하나만 사용):

```cron
0 4 * * * root /root/scripts/certbot-renew-and-reload-nginx.sh >> /var/log/certbot-renew.log 2>&1
```

---

## 3. 중요: 가비아 **수동 DNS** 와일드카드 (`core-solution.co.kr`)

DNS-01 + **수동 TXT**로 받은 인증서는 **`certbot renew`만으로는 끝까지 자동 갱신이 안 됩니다.**  
갱신 시에도 Let’s Encrypt가 새 TXT를 요구하면, **사람이 가비아에 넣거나** DNS API가 있어야 합니다.

선택지:

| 방식 | 자동 갱신 |
|------|-----------|
| HTTP-01 (webroot) | 가능 (해당 호스트만) |
| DNS-01 + 수동 훅 | **매주기마다 수동 또는 실패** |
| DNS-01 + API (가비아 연동 스크립트 등) | 가능 |

**권장:** 와일드카드만 DNS-01이고 나머지는 HTTP-01이면, `app`/`api`/`e-trinity` 등은 자동 갱신에 유리합니다.

---

## 4. renewal 설정에 훅 넣기 (수동 DNS 인증서)

`/etc/letsencrypt/renewal/core-solution.co.kr.conf` 예시:

```ini
[renewalparams]
authenticator = manual
pref_challs = dns-01,
manual_auth_hook = /usr/bin/stdbuf -oL -eL /root/scripts/certbot-hooks/gabia-dns-auth-hook.sh
manual_cleanup_hook = /root/scripts/certbot-hooks/gabia-dns-cleanup-hook.sh
```

`renew`가 돌 때도 같은 훅이 호출되지만, **TXT를 수동으로 맞춰야** 성공합니다.

---

## 5. 체크리스트

- [ ] `systemctl list-timers` / `/etc/cron.d/certbot` 로 기본 갱신 존재 여부 확인  
- [ ] 갱신 후 nginx 반영: `--deploy-hook` 또는 본 레포 스크립트  
- [ ] 와일드카드: 자동화 불가 시 **만료 14일 전** 알람 + 수동 갱신 절차 문서화  
- [ ] `m-garden.co.kr` 같이 만료가 짧은 줄 **우선 갱신** 확인  

---

## 6. 개발 vs 운영

- **동일한 원리**입니다. 각 서버에 certbot + (선택) 본 스크립트 + renewal 훅.  
- 개발 서버도 `sudo certbot renew --dry-run` 으로 주기적으로 점검하는 것을 권장합니다.

```bash
sudo certbot renew --dry-run
```

---

## 7. 만료일 체크·알림 (권장)

`certbot renew` 와 별도로, **남은 일수가 짧을 때 사람에게 알리는** 배치를 두면 안전합니다.

### 스크립트

`scripts/deployment/check-ssl-cert-expiry.sh`

- `/etc/letsencrypt/live/*/cert.pem` 기준으로 **만료일·남은 일수** 출력
- `WARN_DAYS`(기본 30) 이내면 `[WARN]`
- `CRITICAL_DAYS`(기본 14) 이내면 `[CRITICAL]` + **exit 1** (cron이 root 메일 보내기 좋음)
- 선택: `MAILTO=이메일` + `mail` 명령 (CRITICAL 시)
- 선택: `WEBHOOK_URL=` Slack 등 Incoming Webhook (CRITICAL 시, `python3` 있으면 본문 전체 JSON 전송)

### cron 예시 (매일 오전 9시)

```cron
0 9 * * * root WARN_DAYS=30 CRITICAL_DAYS=14 /root/scripts/check-ssl-cert-expiry.sh >> /var/log/ssl-expiry.log 2>&1
```

### 수동 실행

```bash
sudo WARN_DAYS=45 CRITICAL_DAYS=21 ./check-ssl-cert-expiry.sh
```

**수동 DNS 와일드카드**처럼 자동 갱신이 어려운 줄은 **만료 30일·14일 전 알림**이 특히 유용합니다.
