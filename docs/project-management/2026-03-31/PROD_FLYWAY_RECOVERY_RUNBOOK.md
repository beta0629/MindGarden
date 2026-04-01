# PROD Flyway 근본복구 Runbook

## 1) 목적 / 범위

### 목적
- 운영 점검창에서 Flyway 이력 불일치, 과거 실패 봉합(success=1) 잔재, hotfix 우회 설정을 제거하고 **정상 마이그레이션 체계**로 복구한다.
- 복구 후 애플리케이션이 정상 기동되고 API가 정상 응답하는지까지 검증한다.

### 현재 상태(반영)
- `flyway_schema_history` 상태: `success=1` 행 12개(`installed_rank` 1~12), `success=0` 행 0개
- 과거 이슈: `V10`, `V12` 실패 후 `success=1`로 봉합한 이력 존재
- 운영 호스트에 drop-in 파일 존재: `95-hotfix-disable-flyway.conf`
- 서비스 상태: `active`

### 범위
- 운영 서버의 Flyway 이력/마이그레이션 파일 정합성 점검
- `flyway repair` / `flyway validate` 실행(앱 배포 환경 기준)
- Flyway 비활성화 hotfix drop-in 해제
- 서비스 재기동 후 로그/API 검증

### 범위 제외
- 신규 DB 스키마 설계 및 기능 개발
- 애플리케이션 코드 수정

---

## 2) 사전준비(백업 / 중단공지 / 롤백)

### 2-1. 백업
1. DB 백업 수행(스냅샷 또는 덤프)
2. 현재 애플리케이션 배포본 및 설정 백업
3. `flyway_schema_history` 테이블 증적 백업(CSV/SQL)

### 2-2. 중단 공지
1. 점검 시작/예상 종료 시각 공지
2. 점검 중 쓰기 작업 제한 또는 서비스 영향 범위 공지
3. 장애 연락 체계(담당자/승인자/에스컬레이션) 확인

### 2-3. 롤백 준비
1. 즉시 적용 가능한 이전 배포본 경로 확인
2. drop-in 파일 원복 경로 확인
3. DB 백업 복구 리허설 절차/담당자 확인

---

## 3) 단계별 명령어(복붙 가능)

> 아래 변수는 운영 환경 값으로 치환한다.

```bash
export APP_NAME="mindgarden"
export APP_USER="mind"
export APP_GROUP="mind"
export APP_DIR="/opt/mindgarden"
export APP_JAR="$APP_DIR/app.jar"
export SERVICE_NAME="mindgarden.service"
export SYSTEMD_DROPIN_DIR="/etc/systemd/system/${SERVICE_NAME}.d"
export HOTFIX_FILE="${SYSTEMD_DROPIN_DIR}/95-hotfix-disable-flyway.conf"
export LOG_FILE="/var/log/mindgarden/application.log"
export DB_HOST="<DB_HOST>"
export DB_PORT="<DB_PORT>"
export DB_NAME="<DB_NAME>"
export DB_USER="<DB_USER>"
export DB_PASSWORD="<DB_PASSWORD>"
```

### 3-1. 증적 수집

```bash
date
hostnamectl
systemctl status "${SERVICE_NAME}" --no-pager
systemctl cat "${SERVICE_NAME}"
ls -al "${SYSTEMD_DROPIN_DIR}" || true
if [ -f "${HOTFIX_FILE}" ]; then echo "[INFO] hotfix drop-in exists: ${HOTFIX_FILE}"; else echo "[INFO] hotfix drop-in not found"; fi
```

```bash
mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" -e "
SELECT success, count(*) AS rows
FROM flyway_schema_history
GROUP BY success
ORDER BY success DESC;
"
```

```bash
mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" -e "
SELECT installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success
FROM flyway_schema_history
ORDER BY installed_rank;
"
```

```bash
mkdir -p ~/runbook-evidence
mysqldump -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" \
  --no-create-info --skip-triggers --complete-insert flyway_schema_history \
  > ~/runbook-evidence/flyway_schema_history_$(date +%F_%H%M%S).sql
```

### 3-2. migration 파일 목록 대조

```bash
cd "${APP_DIR}" || exit 1
jar tf "${APP_JAR}" | rg "db/migration/.*\.sql$" | sort > ~/runbook-evidence/migration_files_from_jar.txt
rg "^V[0-9_]+__.*\.sql$" ~/runbook-evidence/migration_files_from_jar.txt || true
wc -l ~/runbook-evidence/migration_files_from_jar.txt
```

```bash
mysql -N -B -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" -e "
SELECT script
FROM flyway_schema_history
WHERE success = 1
ORDER BY installed_rank;
" > ~/runbook-evidence/migration_scripts_from_db.txt

wc -l ~/runbook-evidence/migration_scripts_from_db.txt
diff -u ~/runbook-evidence/migration_scripts_from_db.txt ~/runbook-evidence/migration_files_from_jar.txt || true
```

### 3-3. flyway repair / validate 절차(앱 배포 환경 기준)

> 원칙: 애플리케이션과 동일한 Flyway 버전/설정으로 수행한다.
> 점검창 내 쓰기 트래픽 통제 상태에서 실행한다.

```bash
systemctl stop "${SERVICE_NAME}"
systemctl is-active "${SERVICE_NAME}" || true
```

```bash
# 환경에 맞는 Flyway 실행 바이너리/경로로 치환
export FLYWAY_CMD="flyway"

if command -v "${FLYWAY_CMD}" >/dev/null 2>&1; then
  "${FLYWAY_CMD}" \
    -url="jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}" \
    -user="${DB_USER}" \
    -password="${DB_PASSWORD}" \
    -locations="classpath:db/migration" \
    -table="flyway_schema_history" \
    repair
else
  echo "[WARN] flyway CLI not found. repair 단계는 건너뛰고 3-5 로그 검증으로 대체 확인한다."
fi
```

```bash
if command -v "${FLYWAY_CMD}" >/dev/null 2>&1; then
  "${FLYWAY_CMD}" \
    -url="jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}" \
    -user="${DB_USER}" \
    -password="${DB_PASSWORD}" \
    -locations="classpath:db/migration" \
    -table="flyway_schema_history" \
    validate
else
  echo "[WARN] flyway CLI not found. 서비스 기동 후 Flyway validate 관련 로그를 반드시 확인한다."
fi
```

```bash
mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" -e "
SELECT success, count(*) AS rows
FROM flyway_schema_history
GROUP BY success
ORDER BY success DESC;
"
```

### 3-4. hotfix drop-in 해제 및 daemon-reload / restart

```bash
if [ -f "${HOTFIX_FILE}" ]; then
  cp -a "${HOTFIX_FILE}" "${HOTFIX_FILE}.bak.$(date +%F_%H%M%S)"
  rm -f "${HOTFIX_FILE}"
fi
```

```bash
systemctl daemon-reload
systemctl restart "${SERVICE_NAME}"
sleep 3
systemctl status "${SERVICE_NAME}" --no-pager
```

### 3-5. 기동 / 로그 / API 검증

배포 직후에는 `journalctl`로 최근 로그를 확인하고, 애플리케이션 리스닝 포트(예: `127.0.0.1:8080`)에서 헬스·핵심 API의 HTTP 상태 코드가 기대 범위인지 점검한 뒤, 사용자가 실제로 쓰는 HTTPS URL(역프록시·도메인)에서도 동일하게 응답 코드가 정상인지 확인한다. 설치된 JAR이 기대 빌드인지 보려면 `unzip -p "${APP_JAR}" META-INF/MANIFEST.MF`와 `unzip -p "${APP_JAR}" BOOT-INF/classes/git.properties`, `unzip -p "${APP_JAR}" BOOT-INF/classes/META-INF/build-info.properties`를 참고한다(소스 트리 없이 빌드되면 Git 관련 값은 `unknown` 등으로 남을 수 있다).

```bash
journalctl -u "${SERVICE_NAME}" -n 300 --no-pager
```

```bash
# "Successfully validated", "Current version of schema", "Started Application" 등 확인
# (flyway CLI 미설치 환경에서는 이 로그 확인을 validate 대체 근거로 사용)
journalctl -u "${SERVICE_NAME}" -n 500 --no-pager | rg -i "flyway|validate|migrate|started|error|exception"
```

```bash
# 헬스체크 엔드포인트는 운영 실제 경로로 치환
curl -i --max-time 10 "http://127.0.0.1:8080/actuator/health"
```

```bash
# 필수 비즈니스 API 최소 1건 검증(운영 실제 엔드포인트/인증 헤더로 치환)
curl -i --max-time 10 "http://127.0.0.1:8080/api/v1/health"
```

---

## 4) 중단 기준(Stop Criteria)

아래 중 하나라도 발생하면 즉시 중단하고 롤백 절차로 전환한다.

1. `flyway validate` 실패(체크섬 불일치/누락 migration/순서 불일치)
2. `flyway_schema_history`에 `success=0` 재발생
3. 서비스 재기동 후 `active` 미복귀 또는 반복 크래시
4. 로그에 치명 오류(`ERROR`, `Exception`, DB 연결 실패, migration 실패) 지속
5. 핵심 API/헬스체크 실패(HTTP 5xx, timeout)

---

## 5) 롤백 절차

### 5-1. 서비스 안정화
```bash
systemctl stop "${SERVICE_NAME}"
```

### 5-2. drop-in 원복
```bash
ls -al "${SYSTEMD_DROPIN_DIR}"
# 직전 백업본이 있으면 복구
LATEST_BAK="$(ls -1t "${HOTFIX_FILE}.bak."* 2>/dev/null | head -n 1 || true)"
if [ -n "${LATEST_BAK}" ]; then
  cp -a "${LATEST_BAK}" "${HOTFIX_FILE}"
fi
```

### 5-3. DB 롤백
- 사전 준비한 DB 백업에서 `flyway_schema_history` 및 필요 스키마를 운영 정책에 따라 복구한다.
- DB 롤백은 DBA 승인 하에 수행한다.

### 5-4. 서비스 재기동 및 확인
```bash
systemctl daemon-reload
systemctl restart "${SERVICE_NAME}"
sleep 3
systemctl status "${SERVICE_NAME}" --no-pager
journalctl -u "${SERVICE_NAME}" -n 200 --no-pager
```

---

## 6) 완료 기준

모든 항목을 만족하면 복구 완료로 판정한다.

1. `flyway validate` 성공
2. `flyway_schema_history`에 `success=0` 0건 유지
3. `installed_rank` 기준 1~12 성공 행 유지(현재 기준)
4. `95-hotfix-disable-flyway.conf` 제거 상태 확인
5. 서비스 `active` 안정 상태(재시작 루프 없음)
6. 로그에서 Flyway/기동 치명 오류 없음
7. 헬스체크 및 핵심 API 응답 정상

---

## 부록: 점검 결과 기록 템플릿

- 점검 일시:
- 작업자/검토자:
- 사전 백업 완료 여부:
- 증적 파일 경로:
- `repair` 결과:
- `validate` 결과:
- drop-in 제거 여부:
- 서비스 상태:
- API 검증 결과:
- 이슈/특이사항:
- 최종 판정(완료/중단/롤백):
