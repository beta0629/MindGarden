# 개발·운영 서버 로그·백업 정합 (beta0629 / beta74)

서버에 적용된 설정의 단일 참고 문서. 실제 파일은 각 호스트 `/root/scripts/ops/`, `/etc/logrotate.d/`, `/etc/cron.d/` 를 따른다.

## 공통

| 항목 | 경로·내용 |
|------|-----------|
| Nginx 로그 prune | `/root/scripts/ops/prune-old-logs.sh` (레포: `scripts/ops/prune-old-logs.sh` 와 동일 내용) |
| Prune 스케줄 | `/etc/cron.d/mg-prune-nginx-logs` — 매주 일요일 04:17 |
| Certbot 갱신 후 Nginx | `/etc/letsencrypt/renewal-hooks/deploy/01-reload-nginx.sh` |
| Certbot 일일 renew + reload | `/etc/cron.d/mindgarden-ssl` → `/root/scripts/deployment/certbot-renew-and-reload-nginx.sh` |
| systemd | `certbot.timer` (하루 2회 `certbot -q renew`; deploy hook으로 reload) |
| `/var/log/mindgarden/*.log` | `/etc/logrotate.d/mindgarden` — weekly, rotate 8, compress |
| `/var/log/certbot-renew.log` | `/etc/logrotate.d/certbot-renew` — monthly, rotate 6, **`su root syslog`** |
| goaccess | 패키지 설치 권장; 사용 예는 각 서버 `README-log-tools.txt` |
| 롤백 백업 | `/root/backups/ops-stabilization-*` (타임스탬프) |

## 환경별 (앱 로그 경로)

| 환경 | 앱 로그 디렉터리 | logrotate 파일 |
|------|------------------|------------------|
| 개발 | `/var/www/mindgarden-dev/logs/*.log` | `/etc/logrotate.d/mindgarden-dev` |
| 운영 | `/var/www/mindgarden/logs/*.log` | `/etc/logrotate.d/mindgarden-www` |

## 서버별 빠른 참조 파일

- 개발: `/root/scripts/ops/README-log-tools.txt` (beta0629 nginx access 목록)
- 운영: `/root/scripts/ops/README-log-tools.txt` (beta74)

## 수동 확인

- 와일드카드 인증서(DNS-01) 갱신 시 가비아 TXT 유예 — `scripts/deployment/certbot-renew-and-reload-nginx.sh` 주석 참고.
- `journalctl --vacuum-time=30d` 는 필요 시 각 호스트에서 수동 실행(용량 이슈 시).
