# Cloudflare 520 Host Error — Origin Hang 재발 방지

**대상**: `mindgarden.core-solution.co.kr` (및 Core `*.core-solution.co.kr` / `app` API 프록시)  
**배포**: GitHub Actions 만 (`deploy-production.yml`). 수동 SSH 배포·임의 재시작 금지.

## 1. 인시던트 요약 (예시)

| 항목 | 값 |
|------|-----|
| 증상 | Cloudflare **520 Host Error** (blank 응답) |
| Ray ID 예 | `a3f204556d825cbc` |
| 시각 (UTC) | 2026-09-22 14:33:29 |
| 엣지 | Browser / Cloudflare OK |
| Origin | 예방적 restart **없이** 자체 회복. Blue+green 둘 다 active, actuator 200 |

원인 계열: origin(JVM/커넥션)이 hang·empty·reset 되어 Cloudflare 가 원본 응답을 못 받고 **520** 을 표시. Nginx 가 먼저 타임아웃하면 **502/504** 로 정리되어 진단이 쉬워진다.

## 2. CF520 vs Nginx 502/504

| 계층 | 의미 |
|------|------|
| **CF 520** | Origin 연결은 되었으나 유효한 HTTP 응답이 없거나 연결이 비정상 종료 (hang / empty / reset). CF 프록시 타임아웃(~**100s**) 근처에서 blank Host Error 로 보일 수 있음. |
| **Nginx 502** | Upstream 연결 실패·즉시 거부 (`connect() failed` 등). |
| **Nginx 504** | Upstream 응답 대기 초과 (`upstream timed out`). |

**예방 원칙**: Core `proxy_read_timeout` / `proxy_send_timeout` = **60s**(CF ~100s 미만), `proxy_connect_timeout` = **10s**. Core 를 **120s 로 올리지 않음**.

공통 스니펫: `/etc/nginx/snippets/mindgarden-core-proxy-params.conf`  
(`proxy_http_version 1.1` + `Connection ""` + 위 타임아웃)

## 3. 탐지

1. **헬스 스냅샷** — `scripts/ops/prod-health-snapshot.sh`  
   - `/etc/mindgarden/active-backend`  
   - `/etc/nginx/snippets/mindgarden-core-backend-upstream.conf` (`server` + `keepalive`)  
   - blue/green actuator 에 **ACTIVE** / **idle** 라벨  
   - 공개 엣지: `CORE_EDGE_HEALTH_URL` (기본 `https://mindgarden.core-solution.co.kr/api/v1/health/server`)
2. **Actions** — `.github/workflows/ops-health-snapshot.yml` (Discord 프로브는 active-backend 포트; `MG_HEALTH_URL` 오버라이드 가능)
3. **Nginx error_log** 패턴  
   - `upstream timed out`  
   - `connect() failed`  
   - 호스트별: `/var/log/nginx/tenant.core-solution.co.kr.error.log`, `app.core-solution.co.kr.error.log` 등
4. **업타임** — [UPTIME_MONITOR_RECOMMENDATION.md](../운영반영/UPTIME_MONITOR_RECOMMENDATION.md)

## 4. 인시던트 복구 (실패가 증명될 때만)

**비목표(명시)**: KST **11:00–20:00** 구간에 **예방적 rolling restart / 정기 재시작 cron·워크플로를 두지 않는다.**  
Origin 은 본 인시던트처럼 **자체 회복**할 수 있다. 복구는 **헬스·엣지가 실패를 증명**할 때만.

1. `sudo cat /etc/mindgarden/active-backend` — 트래픽 슬롯 (`blue`→8080 / `green`→8081)
2. `sudo cat /etc/nginx/snippets/mindgarden-core-backend-upstream.conf` — 단일 `server 127.0.0.1:<port>` + `keepalive 32`
3. 양쪽 actuator:  
   `curl -sS http://127.0.0.1:8080/actuator/health`  
   `curl -sS http://127.0.0.1:8081/actuator/health`  
   및 엣지 URL
4. 스니펫·vhost 변경 후: `sudo nginx -t && sudo systemctl reload nginx`
5. 트래픽 슬롯이 죽은 경우만 BG **cutover / rollback** — Actions +  
   [PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md](../deployment/PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md)

배포·설정 반영은 **GitHub Actions 만**.

## 5. 선택 노브 (라이브 기본값 / 하지 말 것)

| 항목 | 권장 |
|------|------|
| Upstream | **단일 active server** + `keepalive 32` (Actions cutover 가 이미 기록) |
| Location | `include` proxy-params: `Connection ""`, connect **10s**, send/read **60s** |
| `proxy_next_upstream` | 라이브 BG **미사용**. 듀얼 server + next_upstream 은 **POST 이중 실행** 위험 |
| `max_conns=N` | open-source nginx 호스트에서 지원 확인 후에만. 미확인 시 활성화하지 말 것 |
| `queue` | **nginx Plus** 전용. Plus 미확인 시 사용 금지 — 연결 압박은 모니터링·용량으로 |
| Core timeout 120s | **금지** (CF 520 blank 쪽과 경합) |

## 6. 관련 파일

- `config/nginx/core-solution-prod.conf`
- `config/nginx/snippets/mindgarden-core-proxy-params.conf`
- `config/nginx/snippets/mindgarden-core-backend-upstream.conf`
- `.github/workflows/deploy-production.yml` (스니펫 SCP → `/etc/nginx/snippets/`)
- `scripts/ops/prod-health-snapshot.sh` · `scripts/ops/README.md`
- `.github/workflows/ops-health-snapshot.yml`
- [PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md](../deployment/PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md)
- [UPTIME_MONITOR_RECOMMENDATION.md](../운영반영/UPTIME_MONITOR_RECOMMENDATION.md)
