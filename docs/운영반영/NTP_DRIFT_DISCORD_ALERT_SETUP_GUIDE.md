# 운영 BE NTP drift 감시 — Discord 알람 설치 가이드

운영 서버의 시스템 시계 동기화 상태와 offset 을 1 시간마다 검사해, 동기화가 끊기거나 offset 절대값이 60 초를 넘으면 Discord 채널로 알람을 보낸다. 운영 DB 직접 접근은 하지 않고 `timedatectl` / `chronyc tracking` 만 사용한다 (Zero-Cost AI 모니터링 Phase 1, $0).

- 배경: `docs/project-management/2026-06-11/AI_MONITORING_ROADMAP.md` §6 Phase 1
- 코드: `scripts/automation/monitoring/ntp_drift_check.sh`, `ntp_drift_check.service`, `ntp_drift_check.timer`
- 패턴: `docs/운영반영/LOG_WATCHER_DISCORD_ALERT_SETUP_GUIDE.md` 와 동일 (Discord webhook + systemd timer)

---

## 1. 사전 준비 (사용자 액션)

### 1.1 Discord webhook 발급

`docs/운영반영/DISCORD_WEBHOOK_AND_AI_MONITORING_GUIDE.md` 의 §1 절차를 따라 webhook URL 1개 발급. log_watcher 와 **동일 채널 공유 권장** (`#ops-ci-alert`).

```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/<webhook_id>/<webhook_token>
```

### 1.2 운영 서버 SSH

`mindgarden` 또는 `sudo` 가능 계정으로 SSH.

### 1.3 NTP 클라이언트 동작 확인

`chronyd` 또는 `systemd-timesyncd` 둘 중 하나가 가동 중이어야 한다.

```bash
systemctl is-active chronyd 2>/dev/null || systemctl is-active systemd-timesyncd
chronyc tracking 2>/dev/null || timedatectl status
```

`System clock synchronized: yes` 또는 chronyc 의 `Leap status : Normal` 이 나오면 정상.

---

## 2. 파일 배치

저장소를 운영 서버에 동기화하지 않는다면 다음 3개 파일을 SCP 한다.

```bash
sudo install -d -m 755 /opt/mindgarden/scripts/automation/monitoring
sudo install -m 755 -o mindgarden -g mindgarden \
  /tmp/ntp_drift_check.sh /opt/mindgarden/scripts/automation/monitoring/ntp_drift_check.sh
sudo install -m 644 /tmp/ntp_drift_check.service /etc/systemd/system/ntp_drift_check.service
sudo install -m 644 /tmp/ntp_drift_check.timer   /etc/systemd/system/ntp_drift_check.timer
sudo systemctl daemon-reload
```

또는 저장소 체크아웃이 있다면 심볼릭 링크 사용:

```bash
sudo ln -sf /var/www/mindgarden/repo/scripts/automation/monitoring/ntp_drift_check.sh \
  /opt/mindgarden/scripts/automation/monitoring/ntp_drift_check.sh
```

### 2.1 마커 디렉터리 준비 (log_watcher 와 공용 가능)

```bash
sudo install -d -m 755 -o mindgarden -g mindgarden /var/lib/mindgarden
```

---

## 3. Discord webhook 환경변수 주입

`DISCORD_WEBHOOK_URL` 은 **systemd EnvironmentFile** 로만 주입한다. 코드·service unit 본문·로그·git 어디에도 평문으로 두지 않는다.

옵션 A — log_watcher 와 동일 webhook 공유 (권장):

```bash
ls -l /etc/mindgarden/log_watcher.env
# 이미 존재하면 추가 작업 불필요. service unit 의 EnvironmentFile=-/etc/mindgarden/log_watcher.env 가 자동 로드.
```

옵션 B — NTP 전용 webhook (다른 채널) 또는 임계값 조정:

```bash
sudo install -d -m 750 -o root -g mindgarden /etc/mindgarden
sudo tee /etc/mindgarden/ntp_drift.env > /dev/null <<'EOF'
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/<id>/<token>
# (선택) 임계값 (기본 60초)
# NTP_DRIFT_THRESHOLD=120
EOF
sudo chown root:mindgarden /etc/mindgarden/ntp_drift.env
sudo chmod 640 /etc/mindgarden/ntp_drift.env
```

> 권한 `0640 root:mindgarden` — systemd 가 읽고 일반 SSH 사용자는 못 본다.

---

## 4. 활성화 및 가동

```bash
sudo systemctl enable --now ntp_drift_check.timer
sudo systemctl status ntp_drift_check.timer --no-pager
sudo systemctl list-timers --all | grep ntp_drift_check
```

기대 출력:

```
NEXT                        LEFT       LAST                       PASSED ...
Sun 2026-06-14 06:00:00 KST 47min ago  Sun 2026-06-14 05:00:00 KST 13min ago ntp_drift_check.timer ntp_drift_check.service
```

---

## 5. 수동 테스트

### 5.1 즉시 1회 실행

```bash
sudo systemctl start ntp_drift_check.service
sudo journalctl -u ntp_drift_check.service --no-pager -n 30
```

기대 출력 (정상):

```
[ntp_drift_check] OK (offset=0.000123s, threshold=60s, source=chronyc)
```

### 5.2 강제 알람 (개발/리허설)

임계값을 0.001 초로 낮춰 한 번 실행해본다 — 정상 시계도 알람이 발사된다.

```bash
sudo NTP_DRIFT_THRESHOLD=0.001 DISCORD_WEBHOOK_URL="<발급받은 URL>" \
  /opt/mindgarden/scripts/automation/monitoring/ntp_drift_check.sh
```

Discord 채널에 `🚨 [NTP] 시계 동기화 이상 — <hostname>` 메시지가 도착하면 OK.

| 증상 | 원인 | 조치 |
| --- | --- | --- |
| `offset 측정 불가` | chronyc·timedatectl 미설치 / NTP 미가동 | `sudo apt-get install chrony` 또는 `systemctl enable --now systemd-timesyncd` |
| `Discord 발송 실패 (HTTP 401)` | webhook URL 만료 | Discord 채널 → 연동 → 웹후크 → URL 재복사 |
| `jq 미설치` | 운영 서버에 jq 없음 | `sudo apt-get install -y jq` |

---

## 6. 비활성화·롤백

```bash
sudo systemctl disable --now ntp_drift_check.timer
sudo rm -f /etc/systemd/system/ntp_drift_check.timer /etc/systemd/system/ntp_drift_check.service
sudo systemctl daemon-reload
# /etc/mindgarden/ntp_drift.env 는 옵션 B 로 별도 등록한 경우에만 삭제
```

---

## 7. 절대 금지

- `DISCORD_WEBHOOK_URL` 을 코드·service unit 본문·git 에 평문으로 두지 않는다 (EnvironmentFile 만).
- 본 스크립트가 운영 DB 를 query 하지 않는다 (timedatectl / chronyc 만).
- 본 채널을 노이즈 채널과 공유하지 않는다 — 시계 이상은 인증·정산 무결성에 직결되는 P0 신호이다.

---

## 8. 다음 단계 (Phase 2 후보)

- 다중 호스트(blue/green/ops) 동시 감시 — 호스트별 마커 + 호스트명을 알람 본문에 포함.
- offset 추세 (지난 N 시간 평균) 가 임계값 초과 시 별도 고우선 알람.
- 외부 NTP 서버 reachability 모니터링 (chrony sources -v 출력 파싱).
