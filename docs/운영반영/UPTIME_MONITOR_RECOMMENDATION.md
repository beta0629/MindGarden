# 외부 Uptime Monitor 권고 — GitHub Actions cron 보완

본 문서는 `.github/workflows/ops-health-snapshot.yml` 의 5 분 cron 폴링을 **장기적으로 외부 uptime monitor 로 이관**하기 위한 비교·결정 가이드이다. GitHub Actions runner 자체 장애 시 헬스 알람이 끊기는 단점을 보완한다.

- 배경: `docs/project-management/2026-06-11/AI_MONITORING_ROADMAP.md` §6 Phase 1
- 함께 보기: `docs/운영반영/DISCORD_WEBHOOK_AND_AI_MONITORING_GUIDE.md`

---

## 1. 왜 외부 monitor 가 필요한가

| 한계 | GitHub Actions 5분 cron | 외부 uptime monitor |
| --- | --- | --- |
| GitHub Actions runner 자체 장애 | 알람 불가 (감시자도 같이 정지) | 영향 없음 (외부 인프라) |
| 응답시간 SLA 측정 | 제공 안 함 | 1초·30초 단위 측정 |
| Status Page 자동 발행 | 직접 구축 | SaaS 가 자동 제공 |
| 무료 한도 | Actions 무료 분 (~2000분/월) 소진 위험 | 대부분 5개 monitor 까지 무료 |
| 트리거 빈도 | 최소 5분 (cron 한계) | 30초~3분 |

### 1.1 cron Frequency 충돌 방지 (중요)

GitHub Actions 무료 분은 월 2000 분이다. `ops-health-snapshot.yml` 의 5 분 cron 은 1 run ≈ 1 분 가정 시 월 **~8640 분** 을 소비할 수 있다 (2000 분 초과 시 과금 또는 throttle). **외부 monitor 도입과 동시에** 본 워크플로 cron 을 다음 중 하나로 줄여 충돌을 막는다.

- 옵션 1: `cron: '0 0,12 * * *'` (하루 2회, 본래 빈도) — 외부 monitor 가 1차 감시, Actions 는 deep snapshot 만.
- 옵션 2: `cron: '*/15 * * * *'` (15분 간격) — 외부 monitor 가 fast-fail 알람, Actions 는 fallback.

외부 monitor 등록 직후 본 워크플로의 schedule cron 만 PR 로 줄이면 된다 (`if` 조건 변경 불필요).

---

## 2. 후보 비교

| 항목 | UptimeRobot | BetterStack (Better Uptime) | Pingdom |
| --- | --- | --- | --- |
| 무료 monitor 수 | 50 개 | 10 개 | 1 개 (트라이얼 14일) |
| 최소 폴링 간격 (무료) | 5분 | 3분 | 1분 |
| Discord 연동 (무료) | ✅ webhook | ✅ webhook + 공식 integration | ❌ 유료만 |
| Status Page (무료) | ✅ | ✅ | ❌ 유료만 |
| 응답시간 측정 | ✅ | ✅ | ✅ |
| SMS 알람 | 유료 | 무료 10건/월 | 유료 |
| TLS 인증서 만료 알람 | ✅ | ✅ | ✅ |
| 추천 시나리오 | **저비용·다중 endpoint** | **on-call 핫라인 필요** | 1초 단위 측정 필요 |

### 2.1 결론

- **1순위: UptimeRobot** — 5분 간격 무료·Discord webhook·50 monitor 까지 무료. ops/core/expo-app API 헬스 3 종을 한 번에 등록 가능. 본 저장소의 Phase 1 (Zero-Cost, $0) 와 가장 정렬.
- **2순위: BetterStack** — on-call rotation·SMS 알람이 필요해지면 이주. 무료 plan 이 더 좁지만 UX 가 우수.
- **Pingdom 비추천** — 무료 1 monitor 한계, Discord 연동 유료 plan 만.

---

## 3. UptimeRobot 등록 절차 (사용자 액션)

1. https://uptimerobot.com 가입 (Google 로그인 가능, 무료)
2. **+ Add New Monitor** → Monitor Type: `HTTP(s)`
3. 입력:
   - Friendly Name: `MindGarden Core (prod)`
   - URL: `https://mindgarden.core-solution.co.kr/api/v1/health/server`
   - Monitoring Interval: `5 minutes` (무료 한도)
   - Monitor Timeout: `30 seconds`
4. **Alert Contacts To Notify** → 새 Alert Contact 추가:
   - Type: `Webhook`
   - URL: `${DISCORD_OPS_WEBHOOK_URL}` (§DISCORD_WEBHOOK_AND_AI_MONITORING_GUIDE.md §1 의 발급 webhook)
   - POST Value: `{ "content": "🚨 [Uptime] *monitorFriendlyName* — *alertType* (*alertDetails*)" }` (UptimeRobot 변수 치환)
   - Content Type: `application/json`
5. **Create Monitor**
6. 동일 절차로 OPS 포털 (`https://ops.e-trinity.co.kr/api/v1/health/server`) 추가
7. 30 분 안에 첫 polling 이 시작되며, DOWN 검지 시 Discord 채널에 1회 알람 + UP 복구 시 1회 알람

> Discord webhook 의 `content` payload 형식 검증은 `docs/운영반영/DISCORD_WEBHOOK_AND_AI_MONITORING_GUIDE.md` §1.4 참고.

---

## 4. 등록 후 본 저장소 변경

UptimeRobot 등록이 끝나면 다음을 PR 로 처리한다.

1. `.github/workflows/ops-health-snapshot.yml` 의 `schedule.cron` 을 §1.1 의 옵션 1 또는 옵션 2 로 변경.
2. `docs/project-management/2026-06-11/AI_MONITORING_ROADMAP.md` Phase 1 체크리스트의 "운영 헬스 DOWN 알람" 항목 외부 monitor 등록 완료 표기.
3. `docs/운영반영/DISCORD_WEBHOOK_AND_AI_MONITORING_GUIDE.md` §0 표에 UptimeRobot 행 추가 (참조용).

---

## 5. 비활성화·롤백

UptimeRobot 측: 좌측 monitor 목록 → 해당 monitor → 우측 메뉴 → Pause 또는 Delete. `DISCORD_OPS_WEBHOOK_URL` 도 함께 비활성화하려면 Discord 채널 → 연동 → 웹후크 → 삭제·재발급.

GitHub Actions 측: 본 워크플로의 schedule cron 을 원복 (`'0 0,12 * * *'`).

---

## 6. 비용·보안 노트

- 위 3개 SaaS 모두 무료 plan 안에서 본 저장소 요구를 충족 — **추가 운영비 $0**.
- Webhook URL 은 외부 monitor 콘솔에 저장되므로, 콘솔 계정 자체에 2FA 적용 권장.
- 외부 monitor 발신 IP 가 운영 nginx WAF 의 rate limit 에 걸리면 false alarm 이 발생할 수 있다 — UptimeRobot 의 IP 목록(`https://uptimerobot.com/inc/files/ips/IPv4.txt`) 을 nginx allowlist 에 등록한다.
