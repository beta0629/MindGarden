---
name: core-solution-server-status
description: 개발·운영 서버 상태·에러 로그·운영 DB(Flyway·프로시저·배포 순서) 확인, 긴급 복구, 원인 분석 후 core-coder 조치 연계. shell → core-debugger → core-coder 워크플로우.
---

# 서버 상태 전용 스킬 (Server Status & Recovery)

개발 서버·운영 서버의 **상태 확인**, **에러 로그 수집**, **긴급 복구**, **원인 분석 후 core-coder 즉시 조치**까지 한 흐름으로 수행할 때 이 스킬을 적용합니다.

## 적용 시점

- "개발 서버 죽어 있어", "운영 서버 502", "서버 상태 확인해줘"
- "에러 로그 확인 후 원인 찾아서 코더한테 조치 시켜줘"
- 배포 후 헬스체크 실패·기동 실패 시 원인 파악 및 복구
- 긴급 상황 대비 복구 절차 수행
- 운영 DB 마이그레이션(Flyway)·프로시저 존재 여부 점검, 배포 순서 확인

## 서브에이전트 워크플로우 (필수 순서)

| 단계 | 서브에이전트 | 역할 |
|------|--------------|------|
| **1. 상태·로그·복구** | **shell** | SSH로 대상 서버 접속, 서비스 상태 확인, 에러 로그 수집(tail/journalctl). 필요 시 백업 복원·재시작. |
| **2. 원인 분석·태스크 작성** | **core-debugger** | 수집된 로그·스택트레이스 해석, 근본 원인 요약, **core-coder용 즉시 조치 태스크** 작성. 코드 수정은 하지 않음. |
| **3. 코드·설정 조치** | **core-coder** | core-debugger가 전달한 태스크 설명·수정 제안대로 코드/설정 수정. |

- **shell**은 로그·상태만 확인하고 복구 명령 실행. 원인 해석은 **core-debugger**에 맡긴다.
- **core-debugger**는 로그 내용을 바탕으로 원인과 수정 방향을 정리하고, **core-coder에게 넘길 태스크 설명**을 구체적으로 작성한다.
- **core-coder**는 해당 태스크만 수행한다.

## SSH 접속 정보 (core-shell / shell 서브에이전트용)

shell 서브에이전트로 개발·운영 서버 로그·상태 확인 시 아래 접속 정보를 사용한다. (프로젝트 스크립트 기준: `scripts/clean-dev-server-logs.sh`, `deployment/check-and-deploy-permission-auto.sh` 등)

| 구분 | SSH 접속 | 비고 |
|------|-----------|------|
| **개발 서버** | `ssh root@beta0629.cafe24.com` | 로그: `/var/www/mindgarden-dev/logs/` |
| **운영 서버** | `ssh root@beta74.cafe24.com` | 로그: `/var/log/mindgarden/` 등 (배포 가이드 참조). 배포 시에는 `beta74` 계정 사용 가능. |

- **GitHub Actions와 맞춤**: `deploy-procedures-dev.yml` 등에서 `DEV_SERVER_HOST`는 보통 **`beta0629.cafe24.com`**, `DEV_SERVER_USER`는 **`root`**(또는 팀 표준). **`DEV_DB_HOST`**는 비어 있으면 CI에서 `127.0.0.1`로 폴백하지만, **실제 값은 개발 서버에서 systemd로 확인**하는 것을 권장한다.

```bash
ssh root@beta0629.cafe24.com 'systemctl cat mindgarden-dev.service'
```

- unit 파일·`EnvironmentFile=`에 있는 **`DB_HOST`**, **`DB_NAME`**, **`DB_USERNAME`**이 곧 GitHub 시크릿 `DEV_DB_HOST`, `DEV_DB_NAME`, `DEV_DB_USER`와 맞춰야 한다(비밀번호는 시크릿에만, 로그에 노출 금지).

- **개발 서버 로그 경로**: `/var/www/mindgarden-dev/logs/` — `error.log`, `coresolution.log`, `sql-error.log`, 롤링 파일 `*.2026-03-*.log`.
- **운영 서버 로그 경로**: `/var/log/mindgarden/application.log`, `memory-alert.log` 등 (`deployment/pre-deployment-checklist.md`, `deployment/application-production.yml` 참조).
- 로컬 `~/.ssh/config` 또는 CI secrets(DEV_SERVER_HOST, DEV_SERVER_SSH_KEY 등)가 있으면 해당 설정 사용. 없으면 위 `root@호스트` 로 접속.

## 대상 서버·경로 (참고)

| 구분 | 서비스/호스트 | 서비스명 | 로그·경로 |
|------|----------------|----------|-----------|
| **개발** | root@beta0629.cafe24.com | mindgarden-dev.service | /var/www/mindgarden-dev/logs/error.log, coresolution.log, sql-error.log, journalctl -u mindgarden-dev.service |
| **운영** | root@beta74.cafe24.com | **mindgarden.service** | /var/log/mindgarden/application.log, `journalctl -u mindgarden.service`, 배포 가이드 참조 |

- shell 서브에이전트는 위 **SSH 접속 정보**를 사용해 `ssh root@beta0629.cafe24.com "tail -n 200 /var/www/mindgarden-dev/logs/error.log"` 형태로 로그 수집.

---

## 운영 데이터베이스 (shell 점검·배포 순서)

운영 반영은 **워크플로 기준**으로 진행하고, DB는 **스키마(마이그레이션) → 애 기동·검증 → 프로시저** 순이 안전하다. (`docs/standards/DEPLOYMENT_STANDARD.md`, `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` 참조.)

### 연결 정보 어디서 읽나 (비밀번호는 저장소에 두지 않음)

- **SSH**: `ssh root@beta74.cafe24.com`
- **앱이 쓰는 DB 환경 변수**는 **운영 서버의 systemd**에 있다. 아래로 실제 값 확인(민감값은 로그·답변에 그대로 붙여 넣지 말 것).

```bash
ssh root@beta74.cafe24.com 'systemctl cat mindgarden.service'
```

- 일반적으로 Spring Boot가 기대하는 키: **`DB_HOST`**, **`DB_PORT`**(기본 3306), **`DB_NAME`**, **`DB_USERNAME`**, **`DB_PASSWORD`**
- **`EnvironmentFile=`** drop-in(예: `/etc/mindgarden/prod-from-dev.env`)이 있으면 **같은 키가 덮어쓸 수 있음** — 항상 `systemctl cat`으로 **최종 적용 순서** 확인.

**코드상 프로덕션 프로필**: `src/main/resources/application-prod.yml` — JDBC URL은 `jdbc:mysql://${DB_HOST}:${DB_PORT:3306}/${DB_NAME}?...`, 사용자/비밀번호는 `${DB_USERNAME}` / `${DB_PASSWORD}`.

### Flyway(마이그레이션) 현황 — 반드시 확인

- **운영 프로필**(`application-prod.yml`): **`spring.flyway`** 기본 **활성**, `classpath:db/migration`, `baseline-on-migrate: true`, `validate-on-migrate: true`. 비상 시에만 서비스에 **`SPRING_FLYWAY_ENABLED=false`** 로 끈다.
- 배포 후 **`deploy-production.yml` 헬스 단계**에서 journalctl Flyway 로그 + `flyway_schema_history` 최신 행 확인을 시도한다.
- 그래도 **“로그만으로 단정하지 말고”** 필요 시 MySQL에서 직접 이력·오류를 본다.
- Flyway를 켠 환경이라면 이력 테이블은 보통 **`flyway_schema_history`**. 없거나 비어 있으면 **수동 SQL/별도 배포 파이프**로 스키마가 맞는지 확인한다.

**실제 DB에 붙어서 이력 확인(서버에서, 환경 변수는 systemd와 동일하게 사용):**

```bash
# 예: unit 파일의 DB_* 를 수동으로 export 하거나, 아래만 형식 참고
mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" \
  -e "SHOW TABLES LIKE 'flyway_schema_history';"
# 테이블이 있으면:
mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" \
  -e "SELECT installed_rank, version, description, success, installed_on FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 20;"
```

- **JPA**: 운영은 `ddl-auto: validate` — 엔티티와 DB 스키마가 어긋나면 **기동 실패**로 드러난다. 로그에 스키마 검증 오류가 없는지 함께 본다.

### 표준화 프로시저 배포·검증

- **워크플로**: `.github/workflows/deploy-procedures-prod.yml` (수동 `workflow_dispatch`)
- **스크립트**: `scripts/automation/deployment/deploy-standardized-procedures.sh` — 인자 `prod`일 때 운영용 SCP/SSH 경로 사용
- **CI 시크릿**: SSH는 **`PRODUCTION_HOST` / `PRODUCTION_USER` / `PRODUCTION_SSH_KEY`** — DB는 **`PRODUCTION_DB_*`** 우선, 비어 있으면 **`DEV_DB_*`** → 최종적으로 스크립트·표준 문서의 기본값(개발 DB 정의와 맞춘 경우가 있음). **운영 DB만 대상으로 하려면 `PRODUCTION_DB_*`를 채운다.**
- **배포되는 프로시저 이름(스크립트 내 배열)**: `CheckTimeConflict`, `GetRefundableSessions`, `GetRefundStatistics`, `ValidateIntegratedAmount`, `GetConsolidatedFinancialData`, `ProcessIntegratedSalaryCalculation`, `GetIntegratedSalaryStatistics`, `ProcessDiscountAccounting`, `UpdateDailyStatistics`, `UpdateConsultantPerformance` 등 — 스크립트 최신본을 단일 출처로 본다.

**원격에서 존재 여부 샘플(스키마명·이름은 환경에 맞게):**

```bash
mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" -e \
  "SELECT ROUTINE_NAME, CREATED, LAST_ALTERED FROM information_schema.ROUTINES \
   WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_TYPE = 'PROCEDURE' \
   AND ROUTINE_NAME IN ('CheckTimeConflict','GetRefundableSessions','GetRefundStatistics') ORDER BY ROUTINE_NAME;"
```

### 운영 배포 워크플로(코어·주변) — DB와의 관계

| 워크플로 | 용도 | DB와의 관계 |
|---------|------|-------------|
| `deploy-production.yml` | Core Solution JAR·통합 프론트·Nginx 등 | 기동 시 Flyway 여부는 **`application-prod.yml` 설정** 따름. 헬스·로그로 기동 확인. |
| `deploy-trinity-prod.yml` | Trinity 정적 (`apply.e-trinity.co.kr`) | DB 직접 없음 |
| `deploy-ops-prod.yml` | Ops 정적 | DB 직접 없음 |
| `deploy-ops-backend-prod.yml` | Ops 백엔드 JAR | 별도 DB·포트 — 코어와 충돌 주의 |
| `deploy-procedures-prod.yml` | 표준화 프로시저 SQL | **스키마가 맞는 뒤** 실행 권장 |

### shell 체크리스트에 넣을 한 줄 순서

1. `systemctl status mindgarden.service --no-pager` + `curl` 로컬 헬스
2. `journalctl -u mindgarden.service -n 300` 에서 Flyway·JPA schema **validate** 오류 유무
3. (필요 시) MySQL로 **`flyway_schema_history`** 또는 핵심 테이블 존재 확인
4. 프로시저 배포 후 **`information_schema.ROUTINES`** 로 대상 프로시저 확인

---

## 1단계: shell — 상태·로그·복구 체크리스트

다음 순서로 실행하도록 shell 서브에이전트에 지시한다.

### 1.1 상태 확인

- `sudo systemctl status <서비스명> --no-pager`
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health` (개발 서버 포트가 8080인 경우)

### 1.2 에러 로그 수집 (기동 실패·502 등)

- **journalctl**: `sudo journalctl -u <서비스명> --no-pager -n 400`
- **애플리케이션 로그**: `sudo tail -200 /var/www/mindgarden-dev/logs/error.log` (개발)
- **stderr**: `sudo tail -200 /var/log/mindgarden/dev-error.log` (개발)

### 1.3 긴급 복구 (서비스 중지/기동 실패 시)

- **백업 복원 후 재시작** (개발 서버 예시):
  - `LATEST=$(ls -t /var/www/mindgarden-dev/backups/app.jar.backup.* 2>/dev/null | head -1)`
  - `[ -n "$LATEST" ] && sudo cp "$LATEST" /var/www/mindgarden-dev/app.jar && sudo systemctl restart mindgarden-dev.service`
- 15~20초 대기 후 다시 health 확인

### 1.4 산출

- 서비스 상태(active/failed), health 응답 코드, 복구 적용 여부, **에러 로그 마지막 부분(예외 메시지·스택 요약)** 을 정리해 반환.

## 2단계: core-debugger — 원인 분석·core-coder용 태스크

- **입력**: 1단계에서 수집한 로그·예외 메시지·상태 요약.
- **수행**: 로그·스택트레이스 해석, 근본 원인 1~2문장 요약, **수정 제안(파일·라인·변경 방향)** 및 **core-coder에게 전달할 태스크 설명** 작성. 코드 직접 수정은 하지 않음.
- **참조**: `/core-solution-debug` 스킬, `docs/troubleshooting/DEV_DEPLOYMENT_STABILITY_CHECKLIST.md`, `docs/troubleshooting/ONBOARDING_DEV_DEPLOY_FAILURE_ANALYSIS.md` 등.

## 3단계: core-coder — 즉시 조치

- **입력**: core-debugger가 작성한 **태스크 설명** 및 수정 제안.
- **수행**: 해당 내용대로 코드·설정만 수정. 서버 재배포는 CI/수동 절차에 따름.

## 참조 문서

- `docs/standards/DEPLOYMENT_STANDARD.md` — 브랜치·워크플로·환경·GitHub Secrets
- `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` — 운영 Go-Live
- `docs/troubleshooting/DEV_DEPLOYMENT_STABILITY_CHECKLIST.md` — 개발 배포·검증·점검
- `docs/troubleshooting/ONBOARDING_DEV_DEPLOY_FAILURE_ANALYSIS.md` — 온보딩 배포 실패 시
- `docs/troubleshooting/DEV_OAUTH2_APPLE_PROVIDER_ISSUE.md` — OAuth2 기동 오류
- `docs/standards/SUBAGENT_USAGE.md` — 서브에이전트 매핑 (서버 상태·복구 행 추가됨)

## 요약

- **서버 상태·에러 로그 확인·긴급 복구** → **shell**로 상태/로그/복구 실행.
- **원인 찾아서 코더에게 조치** → **core-debugger**로 원인·태스크 작성 → **core-coder**로 즉시 수정.
- 이 스킬은 위 3단계( shell → core-debugger → core-coder )를 한 번에 요청할 때 적용한다.
