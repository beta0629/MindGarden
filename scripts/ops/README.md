# 운영 OPS 스크립트 (`scripts/ops`)

**코어 솔루션(MindGarden 백엔드)** 과 **OPS 포털(`ops.e-trinity.co.kr` 등)** 을 한 번에 점검하는 **읽기 전용 스냅샷**, plus 로그 **보수적 glob + DRY_RUN 기본** 정리 스크립트입니다.  
**`deploy-production.yml`과 트리거·책임이 분리**되어 있습니다. 배포 워크플로에서 이 스크립트를 호출하지 않습니다.

서버 점검·복구 절차는 `.cursor/skills/core-solution-server-status/SKILL.md`와 정렬합니다 (SSH·로그 경로·systemd·actuator).

## 파일

| 파일 | 설명 |
|------|------|
| `prod-health-snapshot.sh` | 코어 `systemctl`·로컬 actuator, **OPS/코어 공개 URL** HTTP, `df`, 로그·nginx 로그 `du` |
| `prod-log-cleanup.sh` | `MG_LOG_ROOT` 하위만, `*.log.*` / `*.gz` / `*.hprof`, `-mtime +N`. 기본 DRY_RUN |

## 환경변수

### `prod-health-snapshot.sh`

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `MG_SERVICE_NAME` | `mindgarden.service` | 코어 **MindGarden** `systemctl is-active` 대상 |
| `MG_HEALTH_URL` | `http://127.0.0.1:8080/actuator/health` | 코어 JVM **직접** actuator |
| `OPS_PORTAL_HEALTH_URL` | `https://ops.e-trinity.co.kr/api/v1/health/server` | **OPS 포털** 공개 경로(nginx·TLS 포함). 끄려면 빈 문자열 |
| `CORE_EDGE_HEALTH_URL` | `https://mindgarden.core-solution.co.kr/api/v1/health/server` | **코어 솔루션** 공개 엣지. 끄려면 빈 문자열 |
| `MG_SKIP_PUBLIC_EDGE_CHECKS` | (미설정) | `1`이면 공개 URL 두 개 검사 생략(로컬 actuator만) |
| `OPS_BACKEND_SERVICE` | (미설정) | 예: `ops-backend.service`. 설정 시에만 `systemctl is-active` 추가 |
| `MG_LOG_DIRS` | `/var/log/mindgarden:/var/log/nginx` | 콜론(`:`)으로 복수 경로(OPS nginx access 등) |
| `MG_HEALTH_CONNECT_TIMEOUT` | `10` | `curl` 연결 타임아웃(초) |

### `prod-log-cleanup.sh`

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `MG_LOG_ROOT` | `/var/log/mindgarden` | **절대 경로**만. 과도하게 짧은 루트(`/`, `/var/log` 등)는 거부 |
| `MG_MAX_AGE_DAYS` | `14` | `find -mtime +N` |
| `MG_LIST_MAX_LINES` | `200` | DRY_RUN/실행 시 경로 출력 상한 |
| `EXECUTE` | `0` | `1`이면 실삭제. CLI `--execute`와 동등 |

실삭제는 **`EXECUTE=1` 또는 `--execute`** 일 때만 수행합니다. `rm -rf`로 루트 전체를 지우지 않습니다.

## GitHub Actions

`.github/workflows/ops-health-snapshot.yml` — **스냅샷만** 주기 실행·수동 실행합니다.  
스케줄 job에서 로그 정리(`prod-log-cleanup.sh`)는 **호출하지 않습니다**.  
워크플로는 저장소의 스크립트를 `/tmp`로 복사한 뒤 원격에서 실행합니다(서버에 repo 경로가 없어도 동작).

**권장**: 동일 스크립트를 서버 `cron`/`systemd` timer로 배치하면 Runner 장애와 무관하게 점검할 수 있습니다.

## 운영 실행 예

### 1) 서버에 SSH한 뒤(또는 서버 로컬 셸에서)

저장소가 서버에 체크아웃된 경로가 있다면:

```bash
cd /path/to/mindGarden
bash scripts/ops/prod-health-snapshot.sh
MG_LOG_DIRS="/var/log/mindgarden:/var/www/mindgarden" bash scripts/ops/prod-health-snapshot.sh
```

로그 정리(기본 DRY_RUN — 삭제 없음):

```bash
bash scripts/ops/prod-log-cleanup.sh
MG_MAX_AGE_DAYS=30 bash scripts/ops/prod-log-cleanup.sh --dry-run
```

### 2) 로컬 머신에서 SSH로 원라이너(스크립트를 먼저 복사)

호스트·사용자는 **환경에만** 두고, 저장소 루트에서:

```bash
scp scripts/ops/prod-health-snapshot.sh "${PRODUCTION_USER}@${PRODUCTION_HOST}:/tmp/prod-health-snapshot.sh"
ssh "${PRODUCTION_USER}@${PRODUCTION_HOST}" 'bash /tmp/prod-health-snapshot.sh'
```

로그 정리는 프로덕에서 실삭제 전 반드시 DRY_RUN으로 목록을 확인한 뒤:

```bash
scp scripts/ops/prod-log-cleanup.sh "${PRODUCTION_USER}@${PRODUCTION_HOST}:/tmp/prod-log-cleanup.sh"
ssh "${PRODUCTION_USER}@${PRODUCTION_HOST}" 'bash /tmp/prod-log-cleanup.sh'
ssh "${PRODUCTION_USER}@${PRODUCTION_HOST}" 'EXECUTE=1 bash /tmp/prod-log-cleanup.sh --execute'
```

비밀·SSH 키·토큰은 로그에 남기지 마세요.

## 검증

```bash
bash -n scripts/ops/*.sh
```
