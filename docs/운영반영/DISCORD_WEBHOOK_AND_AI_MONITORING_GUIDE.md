# Discord Webhook · AI 모니터링 Phase 1 — 사용자 액션 가이드

> **AI 모니터링 Phase 1 (Zero-Cost, $0)** 5종 — CI Discord 알람 / log_watcher / Bugbot 정책 / Dependabot / CodeQL — 을 활성화하기 위해 **사용자 (운영 책임자)** 가 1회만 수행하면 되는 액션 모음.
>
> - 본 PR 머지만으로는 알람이 즉시 켜지지 않는다. 아래 §1·§2 (필수) 를 마쳐야 발송된다.
> - log_watcher 의 운영 서버 설치는 §3 에서 별도 진행 (선택, 머지와 무관).
> - 출처: `docs/project-management/2026-06-11/AI_MONITORING_ROADMAP.md` §6 Phase 1
> - 함께 보기: `docs/운영반영/LOG_WATCHER_DISCORD_ALERT_SETUP_GUIDE.md`, `docs/standards/CURSOR_BUGBOT_POLICY.md`

---

## 0. 본 PR 적용 후 자동으로 켜지는 것 / 안 켜지는 것

| 항목 | 상태 | 활성화 조건 |
| --- | --- | --- |
| `.github/dependabot.yml` | ✅ 자동 켜짐 | 머지 직후 GitHub 가 자동 반영 |
| `.github/workflows/codeql.yml` | ✅ 자동 켜짐 | 머지 후 push/pr 트리거 시 자동 실행 |
| `notify-discord-on-failure` (5종 워크플로) | ⚙️ Secret 등록 필요 | **§1** 의 `DISCORD_WEBHOOK_URL` 등록 시 |
| `log_watcher` (운영 BE) | ⚙️ 운영 서버 설치 필요 | **§3** 의 systemd 활성화 시 |
| Bugbot 수동 호출 | ⚙️ 정책만 명문화 | PR 머지 전 수동으로 호출 |

---

## 1. Discord 서버·채널·웹후크 준비 (필수)

### 1.1 Discord 서버 + 채널 생성 (없는 경우)

1. Discord 클라이언트 → 좌측 **+ 서버 추가** → 직접 만들기 → "Mind Garden Ops" 등 이름 부여
2. 서버 안에 **운영 알람 전용 텍스트 채널** 1개 생성 — 권장 이름: `#ops-ci-alert`
   - 채널 분리 권장 이유: ERROR/FATAL/CI 실패 신호 대비 노이즈 (회의·푸시 마케팅 등) 가 섞이면 경보 가치 하락

### 1.2 채널 → 연동 → 웹후크 → 새 웹후크

1. `#ops-ci-alert` 채널 우측 톱니 **편집** 클릭
2. 좌측 **연동** → **웹후크** → **새 웹후크**
3. 이름: `MindGarden CI/Ops Alert` (자유)
4. **웹후크 URL 복사** 클릭 — 형식: `https://discord.com/api/webhooks/<id>/<token>`

> ⚠️ 이 URL 은 **누구나** 채널에 메시지를 보낼 수 있는 비밀값이다. **절대 코드·issue·Slack 평문에 붙이지 말 것.**

### 1.3 GitHub Secrets 등록

1. 브라우저 → 본 저장소 (`beta0629/MindGarden`) → **Settings** → **Secrets and variables** → **Actions**
2. 우측 상단 **New repository secret** 클릭
3. 입력:
   - **Name**: `DISCORD_WEBHOOK_URL`
   - **Value**: §1.2 에서 복사한 URL 그대로 붙여넣기
4. **Add secret** 클릭

> Secret 미등록 상태로 본 PR 이 머지되어도 워크플로는 정상 동작한다 (`if [ -z "$DISCORD_WEBHOOK_URL" ] then ... exit 0`).
> Secret 등록 후 다음 워크플로 실행부터 알람이 발송된다.

### 1.4 동작 확인

- 본 PR 머지 후 develop 또는 main 에 빈 commit (`git commit --allow-empty -m "test ci alert"`) 을 푸시
- 의도적 실패: `code-quality-check.yml` 의 unit test 가 실패하면 `#ops-ci-alert` 채널에 빨간색 임베드 "❌ CI/배포 실패" 메시지가 도착해야 함
- 메시지가 안 오면:
  - GitHub Actions 런 로그 → `notify-discord-on-failure` job → step 로그에서 `DISCORD_WEBHOOK_URL Secret 미등록` 또는 `Discord 발송 실패` 확인
  - URL 만료 / 이름 오타 (예: `DISCORD_WEBHOOK_URL` 대신 `DISCORD_WEBHOOK`) 가 가장 흔한 원인

---

## 2. 본 PR 머지 직후 켜지는 것 (확인만)

### 2.1 Dependabot 동작 확인

머지 후 **수 분 내** 다음이 자동으로 일어난다:

1. **Settings → Code security and analysis** → "Dependabot version updates" 가 자동 활성화
2. 다음 월요일 09:00 KST (Maven · npm-frontend) / 화요일 09:00 KST (npm-expo) / 매월 1일 (github-actions) 에 PR 자동 생성
3. 생성된 PR 은 `dependencies` 라벨 + 영역별 라벨 (`auto-merge-candidate` / `frontend` / `expo-app` / `github-actions`)

> 첫 주 PR 폭증 (밀린 dependency 수십 개) 은 정상이다. `open-pull-requests-limit: 5` 가 영역별 동시 PR 5건으로 제한.

### 2.2 CodeQL 동작 확인

머지 후 develop/main 에 첫 push 가 들어오면:

1. Actions 탭 → "🔒 CodeQL 보안 분석" 워크플로 자동 실행
2. **Security** 탭 → **Code scanning alerts** 에 결과 누적
3. 매주 일요일 18:00 UTC (월 03:00 KST) 정기 스캔

알림이 필요하다면 **Settings → Notifications → Code scanning alerts** 에서 본인 계정 이메일·웹 알림 토글.

---

## 3. 운영 BE log_watcher 설치 (선택, 운영 서버 SSH 필요)

CI/CD 알람과 무관하게 운영 BE 의 **런타임 ERROR/FATAL/[OPS-ALERT]** 를 잡고 싶다면 운영 서버에 systemd timer 로 5분 cron 처럼 설치한다.

전체 절차: **`docs/운영반영/LOG_WATCHER_DISCORD_ALERT_SETUP_GUIDE.md`** 참고. 요약:

```bash
# 1. 운영 서버 SSH (mindgarden 또는 sudo 가능 계정)
ssh ops@core-solution.co.kr

# 2. /etc/mindgarden/log_watcher.env 생성 (DISCORD_WEBHOOK_URL 1줄)
sudo install -d -m 750 -o root -g mindgarden /etc/mindgarden
sudo tee /etc/mindgarden/log_watcher.env > /dev/null <<'EOF'
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/<id>/<token>
EOF
sudo chmod 640 /etc/mindgarden/log_watcher.env
sudo chown root:mindgarden /etc/mindgarden/log_watcher.env

# 3. 스크립트·systemd unit 배치 (저장소 동기화된 경우 ln -s, 아니면 SCP)
sudo install -d /opt/mindgarden/scripts/automation/monitoring
sudo install -m 755 -o mindgarden -g mindgarden /tmp/log_watcher.sh \
  /opt/mindgarden/scripts/automation/monitoring/log_watcher.sh
sudo install -m 644 /tmp/log_watcher.service /etc/systemd/system/
sudo install -m 644 /tmp/log_watcher.timer   /etc/systemd/system/

# 4. 활성화
sudo systemctl daemon-reload
sudo systemctl enable --now log_watcher.timer
sudo systemctl start log_watcher.service   # 즉시 1회 실행 + 동작 검증
sudo journalctl -u log_watcher.service --no-pager -n 30
```

> 동일 webhook URL 을 GitHub Secret 과 운영 서버 EnvironmentFile 에 **동일 값** 으로 등록하면, CI 실패와 운영 BE ERROR 가 같은 채널에 도착한다 (권장). 별도 채널을 원하면 채널·webhook 만 분리하고 본 가이드의 URL 을 각각 다른 값으로 사용.

---

## 4. Bugbot 정책 (수동 호출만)

본 PR 부터 **PR 머지 전 Bugbot 수동 호출** 이 표준이다. 자세한 호출 명령·결과 처리는:

- **`docs/standards/CURSOR_BUGBOT_POLICY.md`** 참조
- 메인 어시스턴트에게 "Bugbot 리뷰" 또는 "리뷰 부탁" 이라고 한 줄 요청하면 자동 위임된다.
- **CI 자동 호출 금지** — 무료 한도 보호.

---

## 5. 비활성화·롤백

| 항목 | 비활성화 방법 |
| --- | --- |
| CI Discord 알람 | GitHub Settings → Secrets → `DISCORD_WEBHOOK_URL` **삭제** (워크플로 코드는 그대로 두고 자동 skip) |
| log_watcher (운영) | `sudo systemctl disable --now log_watcher.timer` (자세한 절차는 §LOG_WATCHER_GUIDE §8) |
| Dependabot | Settings → Code security → Dependabot version updates 토글 OFF |
| CodeQL | Actions 탭 → 워크플로 비활성화 또는 PR 로 `.github/workflows/codeql.yml` 삭제 |
| Bugbot | 수동 호출만 하므로 별도 비활성화 절차 없음 |

---

## 6. 비용·보안·운영 노트

- **모든 항목 $0** — Discord webhook 무료 / GitHub Actions 무료 한도 / Dependabot·CodeQL 무료 / Bugbot 무료 한도
- 유료 SaaS (Datadog / New Relic / Sentry 유료) 추가는 본 가이드 범위가 아니다 — 필요 시 별도 의사결정
- `DISCORD_WEBHOOK_URL` 은 메시지 게시만 가능 (읽기·삭제·다른 채널 접근 불가) — 유출 시 위험은 "악성 메시지 도배" 한 가지. 발견 즉시 채널 → 연동 → 웹후크 → **삭제 후 재발급**
- `notify-discord-on-failure` job 은 본 워크플로의 어느 job 이 실패하면 **무조건** 발송 — 실패 원인이 알람 발송 step 자체일 수 없도록 `if [ -z ... ] exit 0` 가드 / curl 실패 시 `|| echo` 로 본 워크플로 실패 코드를 가리지 않는다

---

## 7. 다음 단계 (Phase 2 후보, 본 PR 범위 외)

`docs/project-management/2026-06-11/AI_MONITORING_ROADMAP.md` Phase 2:

- ERROR 빈도 임계 알람 (5분 10개 이상)
- log_watcher → OPS 백엔드 / Procedures 워크플로 확장
- Bugbot 결과의 PR 코멘트 자동 부착 (수동 호출 → 결과 자동 게시)
- Dependabot auto-merge (P3 패치만, security update 우선)
