# 운영 → 개발 DB 일일 동기화 (D-1) 런북

## 목적

개발 DB에 **운영과 유사한 데이터**를 주기적으로 넣어 검증·디버깅 품질을 올린다.  
배치는 저장소의 `scripts/database/sync/prod-to-dev-daily.sh` 를 서버 `cron` 등으로 **매일 새벽**에 실행하는 것을 권장한다 (운영 피크 회피·전일 데이터 정리 후).

## D-1 의미

| 모드 | 설명 |
|------|------|
| `SYNC_MODE=dump_live` (기본) | 실행 시점의 운영 DB 일관 스냅샷(`mysqldump --single-transaction`)을 개발 DB에 복원. 스케줄을 **새벽(예: 03:30 KST)** 에 두면 전일 업무 데이터에 가깝다. |
| `SYNC_MODE=from_file` | **전일(어제) 캘린더 날짜**가 파일명에 포함된 덤프만 사용. 예: `mind_garden_20260408.sql.gz` 은 **실행일이 2026-04-09** 일 때 선택. 운영 측에서 **매일 전일분 덤프 파일**을 먼저 저장해야 한다. |

> “전일 데이터만”을 법적으로 엄밀히 맞추려면 운영에서 **일일 덤프 + `from_file`** 조합을 권장한다.

## 보안·권한

- 운영 계정은 **읽기 전용(dump 전용)** 으로 제한하는 것을 권장.
- 개발 DB 계정은 해당 DB에 대한 **DDL/DML** 권한 필요(`DROP DATABASE`, `CREATE`, import).
- 비밀번호는 `/etc/mindgarden/prod-to-dev-sync.env` (퍼미션 `600`) 또는 Secrets Manager·`mysql_config_editor` 사용. 저장소에 실비번 커밋 금지.
- **PII**: 필요 시 덤프 후 마스킹 스크립트·별도 DB 스키마 제외를 검토한다.

## 설치

1. 저장소에서 스크립트 배포 경로로 복사(예: `/opt/mindgarden/scripts/database/sync/`).
2. `chmod +x prod-to-dev-daily.sh`
3. 설정:

   ```bash
   sudo cp scripts/database/sync/prod-to-dev-daily.env.example /etc/mindgarden/prod-to-dev-sync.env
   sudo chmod 600 /etc/mindgarden/prod-to-dev-sync.env
   # 값 편집: PROD_*, DEV_*, SYNC_MODE, NON_INTERACTIVE=1
   ```

4. 수동 1회 검증(NON_INTERACTIVE 생략 후 `yes` 입력).

## Cron 예시 (새벽 고정)

저장소 템플릿: `scripts/database/sync/crontab.example`

```cron
# 한국 새벽 기준(서버가 UTC이면 CRON_TZ 필수 — cronie 등)
CRON_TZ=Asia/Seoul

# 매일 새벽 03:30
30 3 * * * NON_INTERACTIVE=1 /opt/mindgarden/scripts/database/sync/prod-to-dev-daily.sh >> /var/log/mindgarden/prod-to-dev-cron.log 2>&1
```

- **시각 변경**: 분·시만 바꾸면 됨 (예: `30 3` → 매일 03:30 KST, `crontab.example` 과 동일).
- **타임존**: OS가 이미 `Asia/Seoul` 이면 `CRON_TZ` 생략 가능. 그 외에는 `date` 로 확인 후 `CRON_TZ` 유지.
- 로그: 스크립트 자체가 `LOG_DIR` 아래 `prod-to-dev-sync_*.log` 에도 기록한다 (기본 `/var/log/mindgarden`).

## 복원 후 개발 서버

- 스키마 버전이 어긋나면 **Flyway** `repair` / 마이그레이션 재실행 필요 여부를 배포 런북과 맞출 것.
- `POST_SYNC_SQL_FILE`로 개발 전용 플래그·외부 발송 차단 등 후처리 SQL을 선택 적용할 수 있다.

## 관련 스크립트

- `scripts/database/backups/database-backup.sh` — 운영 월간 백업(레거시 경로)
- `scripts/database/backups/database-restore.sh` — 단일 호스트 복원(대화형)

## 트러블슈팅

- **MariaDB / 구버전 MySQL**: `mysqldump` 가 `--set-gtid-purged` 를 모르면 `EXTRA_DUMP_OPTS` 로 덮어쓰거나 스크립트에서 해당 옵션을 제거한 포크를 둔다.
- **DEFINER 오류**: 운영 덤프의 `DEFINER` 가 개발에 없으면 복원 실패할 수 있다. 필요 시 덤프 후처리(`sed`) 또는 개발에 동일 DEFINER 계정 생성을 검토한다.

### 배치가 “안 도는 것 같을 때” (확인 순서)

1. **스크립트·설정 경로**  
   - `sudo test -x /opt/mindgarden/scripts/database/sync/prod-to-dev-daily.sh`  
   - `sudo test -f /etc/mindgarden/prod-to-dev-sync.env`  
   저장소만 최신이고 **서버에 복사·`chmod +x`·env 미배포**이면 cron은 아무 것도 안 한다.

2. **cron 등록 여부**  
   - `sudo crontab -l` / 배치 전용 유저 crontab에 `prod-to-dev-daily.sh` 한 줄이 있는지 확인.  
   - **없으면** `scripts/database/sync/crontab.example` 을 참고해 등록.

3. **`NON_INTERACTIVE=1`**  
   - cron 줄에 **반드시** 포함. 없으면 스크립트가 `yes` 입력을 기다리며 **표준입력 없어 실패·멈춤**.

4. **`SYNC_MODE=from_file` 인 경우**  
   - 전일 날짜 파일 `DUMP_DIR/${DUMP_FILE_PREFIX}YYYYMMDD.sql.gz` 가 **실제로 존재**해야 함. 없으면 스크립트가 즉시 종료(`전일 덤프 파일 없음`).  
   - 운영 측 **일일 덤프 배치가 먼저** 돌아야 한다.

5. **`dump_live` 인 경우**  
   - 실행 호스트에서 **운영 MySQL·개발 MySQL 모두** 방화벽/보안그룹으로 접속 가능한지 (`mysql -h ... -e 'SELECT 1'`).

6. **cron 환경의 PATH**  
   - `mysql: command not found` 이면 실패. 스크립트는 기본 PATH를 보강하지만, 필요 시 crontab 상단에 `PATH=/usr/local/bin:/usr/bin` 등 명시.

7. **로그**  
   - `/var/log/mindgarden/prod-to-dev-cron.log` (cron 리다이렉트)  
   - `/var/log/mindgarden/prod-to-dev-sync_*.log` (스크립트 본문 로그)  
   GitHub Actions `check-dev-server-logs.yml` 도 동일 항목을 출력한다.

8. **개발 앱이 안 바뀌는 것처럼 보일 때**  
   - DB는 갱신됐으나 **앱이 다른 호스트/다른 DB 이름**을 바라보는 경우가 있다. 개발 서버 `.env` 의 `DB_HOST` / DB 이름이 `DEV_*` 와 일치하는지 확인.

### `mysqldump` 권한 오류 (실서버 확인 사례: 개발 배치 호스트)

- **`PROCESS` / tablespaces**: `Access denied; you need PROCESS privilege ... when trying to dump tablespaces`  
  - 스크립트에 **`--no-tablespaces`** 가 포함되어 있다(저장소 최신본). 구버전 스크립트면 갱신하거나, env에 `EXTRA_DUMP_OPTS="--no-tablespaces"` 를 추가.
- **`SHOW CREATE PROCEDURE`**: 덤프 계정에 루틴 덤프 권한이 없으면 실패할 수 있음.  
  - **권장**: 운영 DB에서 덤프 전용 계정에 `SHOW ROUTINE`(및 필요 시 `TRIGGER` 등) 부여.  
  - **임시**: `/etc/mindgarden/prod-to-dev-sync.env` 에  
    `EXTRA_DUMP_OPTS='--skip-routines --skip-events'`  
    (개발은 Flyway·배포 프로시저로 보완 가능 — 운영 정책과 합의 후)

### 운영 서버에 cron이 없는 경우

- 런북상 배치는 **운영·개발 DB에 모두 네트워크로 닿는 호스트**(보통 **개발/점프 서버**)에서 실행하는 것이 일반적이다. **운영(beta74)에는 스크립트가 없어도 정상**일 수 있다.

## 참고

- 이 작업은 **GitHub Actions만으로 운영 DB에 접속**하기 어려운 경우가 많다. **내부 배치 서버 + cron** 이 기본안이다.
