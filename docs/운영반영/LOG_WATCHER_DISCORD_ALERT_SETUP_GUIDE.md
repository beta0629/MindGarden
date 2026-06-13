# 운영 BE 로그 감시기 (log_watcher) — Discord 알람 설치 가이드

운영 BE `journalctl` 에서 ERROR / FATAL / `[OPS-ALERT]` 패턴을 5 분마다 추출해 Discord 채널로 알람을 보낸다. 운영 DB 직접 접근은 하지 않으며, journalctl 만 사용한다 (Zero-Cost AI 모니터링 Phase 1, $0).

- 배경: `docs/project-management/2026-06-11/AI_MONITORING_ROADMAP.md` §6 Phase 1
- 표준화 로드맵 G 카테고리: `docs/project-management/2026-06-11/STANDARDIZATION_ROADMAP.md`
- 코드: `scripts/automation/monitoring/log_watcher.sh`, `log_watcher.service`, `log_watcher.timer`

---

## 1. 사전 준비 (사용자 액션)

### 1.1 Discord 서버·채널·웹후크 준비

상세 절차는 `docs/운영반영/DISCORD_WEBHOOK_AND_AI_MONITORING_GUIDE.md` 참고. 결과물로 다음을 받는다.

```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/<webhook_id>/<webhook_token>
```

### 1.2 운영 서버 SSH 접근

운영 배포·시스템 작업이 가능한 계정 (`mindgarden` 또는 `sudo` 가능 계정) 으로 SSH.

---

## 2. 파일 배치

> 본 저장소를 운영 서버에 동기화하지 않는다면, 아래 3개 파일을 직접 SCP / `sudo cat <<'EOF'` 로 배치한다. 저장소 내 상대 경로는 `scripts/automation/monitoring/` 이다.

### 2.1 스크립트 배치

```bash
sudo install -d -m 755 /opt/mindgarden/scripts/automation/monitoring
sudo install -m 755 -o mindgarden -g mindgarden \
  /tmp/log_watcher.sh /opt/mindgarden/scripts/automation/monitoring/log_watcher.sh
```

또는 운영 서버에 이미 저장소 체크아웃이 있다면 심볼릭 링크 사용:

```bash
sudo ln -sf /var/www/mindgarden/repo/scripts/automation/monitoring/log_watcher.sh \
  /opt/mindgarden/scripts/automation/monitoring/log_watcher.sh
```

### 2.2 systemd unit 배치

```bash
sudo install -m 644 /tmp/log_watcher.service /etc/systemd/system/log_watcher.service
sudo install -m 644 /tmp/log_watcher.timer   /etc/systemd/system/log_watcher.timer
sudo systemctl daemon-reload
```

### 2.3 마커 디렉터리 준비

`log_watcher` 가 마지막 처리 시각을 저장하는 디렉터리:

```bash
sudo install -d -m 755 -o mindgarden -g mindgarden /var/lib/mindgarden
```

---

## 3. Discord webhook 환경변수 주입

`DISCORD_WEBHOOK_URL` 은 **systemd EnvironmentFile** 로만 주입한다. 코드·service unit 본문·로그·git 어디에도 평문으로 두지 않는다.

```bash
# 600 으로 보호된 파일 생성
sudo install -d -m 750 -o root -g mindgarden /etc/mindgarden
sudo tee /etc/mindgarden/log_watcher.env > /dev/null <<'EOF'
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/<webhook_id>/<webhook_token>
# (선택) 감시 대상 서비스 변경
# SERVICE_NAME=mindgarden-core-blue.service
# (선택) 감시 패턴 추가
# LOG_PATTERNS=ERROR|FATAL|\[OPS-ALERT\]|Unable to determine|stub mode in production|MyOwnPattern
EOF
sudo chown root:mindgarden /etc/mindgarden/log_watcher.env
sudo chmod 640 /etc/mindgarden/log_watcher.env
```

> 권한이 `0640 root:mindgarden` 이어야 systemd 가 읽고, 일반 SSH 사용자는 못 본다.

---

## 4. 재시작 루프 알람 (P1)

`log_watcher.sh` 는 `systemctl show <service> -p NRestarts` 의 값을 매 실행마다 추적해, 윈도우(기본 300초) 안에 임계값(기본 3회) 이상 재시작이 발생하면 **별도 critical 알람** (`🚨 BE restart loop detected`) 을 Discord 채널로 발사한다.

운영 적용 절차:

1. **마커 파일 디렉터리** — 이미 `/var/lib/mindgarden` 이 §2.3 에서 준비되어 있으면 추가 작업 없음. 새 마커 파일은 `log_watcher.sh` 첫 실행 시 자동 생성된다 (`log_watcher_restart_count.txt`, 본문 마커와 분리).
2. **(선택) 임계값 조정** — `/etc/mindgarden/log_watcher.env` 에 추가:
   ```env
   # 5분 윈도우에 5회 이상 재시작이면 알람 (기본값: 5분/3회)
   RESTART_LOOP_WINDOW_SEC=300
   RESTART_LOOP_THRESHOLD=5
   ```
3. **systemd 권한** — `systemctl show <service>` 는 root 권한 불필요 (모든 사용자 호출 가능). 단 NRestarts 노출은 systemd v230+ 필요. 미노출 시 graceful skip 로그가 남는다.
4. **반영** — 기존 timer 만 restart:
   ```bash
   sudo systemctl restart log_watcher.timer
   sudo systemctl start log_watcher.service
   sudo journalctl -u log_watcher.service --no-pager -n 30
   ```
5. **테스트** — 운영 적용 직후 BE 를 의도적으로 3 회 빠르게 재시작 (`sudo systemctl restart mindgarden-core-blue.service` × 3, 5분 이내) 하면 다음 timer tick 에 알람이 도착한다. 검증 후 마커 파일을 비워 (`sudo truncate -s 0 /var/lib/mindgarden/log_watcher_restart_count.txt`) 누적 카운트 영향을 막는다.

> 본문 ERROR/FATAL 알람과 재시작 루프 알람은 마커 파일이 분리되어 있어 서로 영향을 주지 않는다. 두 알람 모두 같은 webhook 으로 도착한다.

---

## 5. journalctl 권한 (구 §4)

`mindgarden` 사용자가 `journalctl -u mindgarden-core-blue.service` 를 호출 가능해야 한다. 두 가지 옵션:

### 옵션 A — `systemd-journal` 그룹 추가 (권장)

```bash
sudo usermod -aG systemd-journal mindgarden
# 그룹 반영을 위해 systemctl 재시작 (mindgarden 셸 다시 로그인 필요)
```

### 옵션 B — sudoers NOPASSWD (그룹 추가 어려운 환경)

`/etc/sudoers.d/mindgarden-log-watcher`:

```
mindgarden ALL=(root) NOPASSWD: /usr/bin/journalctl -u mindgarden-core-blue.service *
```

이 경우 `log_watcher.sh` 의 `journalctl ...` 호출 앞에 `sudo` 를 붙이도록 환경변수 또는 `LOG_PATTERNS` 와 함께 분기 패치 PR 별도 진행. 기본 스크립트는 옵션 A 가정.

---

## 6. 활성화 및 가동

```bash
sudo systemctl enable --now log_watcher.timer
sudo systemctl status log_watcher.timer --no-pager
sudo systemctl list-timers --all | grep log_watcher
```

기대 출력:

```
NEXT                        LEFT     LAST                       PASSED ...
Wed 2026-06-11 23:50:00 KST 4min 12s Wed 2026-06-11 23:45:00 KST 47s ago log_watcher.timer log_watcher.service
```

---

## 7. 수동 테스트

### 6.1 즉시 1회 실행

```bash
sudo systemctl start log_watcher.service
sudo journalctl -u log_watcher.service --no-pager -n 30
```

### 6.2 강제 알람 발생 (개발/리허설)

운영 BE 로그에 의도적으로 ERROR 라인이 있는 시점 (예: 직전 배포 실패 직후) 으로 마커를 1 시간 전으로 되돌린다.

```bash
date -u -d '1 hour ago' '+%Y-%m-%d %H:%M:%S' | sudo tee /var/lib/mindgarden/log_watcher_last_seen.txt
sudo systemctl start log_watcher.service
```

Discord 채널에 알람이 도착하면 OK. 도착하지 않으면 `journalctl -u log_watcher.service` 의 출력으로 원인 확인:

| 증상 | 원인 | 조치 |
| --- | --- | --- |
| `DISCORD_WEBHOOK_URL 미설정` | `/etc/mindgarden/log_watcher.env` 누락·권한 | §3 재확인 |
| `Discord 발송 실패 (HTTP 401)` | webhook URL 만료·재발급 | Discord 채널 → 연동 → 웹후크 → URL 재복사 |
| `매칭 없음` | 실제 ERROR 가 그 구간에 없었음 | 정상. `since` 를 더 이전으로 되돌려 재시도 |
| `jq 미설치` | 운영 서버에 jq 없음 | `sudo apt-get install -y jq` |

---

## 8. 패턴 추가/수정

`/etc/mindgarden/log_watcher.env` 에 `LOG_PATTERNS` 를 정의하면 기본값을 덮어쓴다. ERE (egrep) 문법, 백슬래시 이스케이프 필요.

```env
# 기본 패턴 + Apple SIWA 키 누락 + Google fallback dummy
LOG_PATTERNS=ERROR|FATAL|\[OPS-ALERT\]|Unable to determine|silent first|stub mode in production|invalid_client|APPLE_PRIVATE_KEY missing
```

수정 후:

```bash
sudo systemctl restart log_watcher.timer
```

---

## 9. 비활성화·롤백

```bash
sudo systemctl disable --now log_watcher.timer
sudo rm -f /etc/systemd/system/log_watcher.timer /etc/systemd/system/log_watcher.service
sudo rm -f /etc/mindgarden/log_watcher.env  # webhook URL 폐기 시
sudo rm -rf /var/lib/mindgarden/log_watcher_last_seen.txt
sudo systemctl daemon-reload
```

GitHub Actions 의 `notify-discord-on-failure` job 들은 Secret 만 비우면 즉시 skip 된다 (코드 변경 불필요).

---

## 10. 절대 금지

- `DISCORD_WEBHOOK_URL` 을 코드·service unit 본문·git 에 평문으로 두지 않는다 (Secret/EnvironmentFile 만).
- `log_watcher` 가 운영 DB 를 직접 query 하지 않는다 (journalctl 만).
- 본 알람 채널을 일반 알림 (회의·푸시 마케팅 등) 과 공유하지 않는다 — ERROR/FATAL 신호 대비 노이즈만 늘어난다.

---

## 11. 다음 단계 (Phase 2 후보)

- 같은 패턴을 OPS 백엔드(`mindgarden-ops-backend.service`) 에도 확장 — `SERVICE_NAME` 만 다르게 배치한 두 번째 timer.
- ERROR 빈도 임계 알람 (예: 5분간 ERROR 10개 이상이면 별도 채널 고우선) — Phase 2 로드맵 항목.
- 알람 본문에 RUN_URL 대신 가장 최근 배포 PR 링크를 포함하는 enrichment.
