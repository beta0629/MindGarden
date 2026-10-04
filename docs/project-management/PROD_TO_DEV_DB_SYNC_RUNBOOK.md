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
- **PII (필수 권장)**: 복원 직후 `POST_SYNC_SQL_FILE` 로 `post-dev-sync-anonymize.sql` 을 실행한다.  
  **유지(로그인)**: `user_id` / `password` / **`email` / `phone`**.  
  **치환**: name(`DevUser-` / `DevConsultant-` / `DevClient-`), 주소·계좌 등.  
  **표시용 phone/email 마스킹은 FE만** (DB mask 금지 — 로그인 깨짐).  
  미설정 시 스크립트가 WARN 을 남기며, 개발 DB에 운영 표시용 PII(name)가 남을 수 있다.  
  표준: [`PII_PROTECTION_STANDARD.md`](../standards/PII_PROTECTION_STANDARD.md) §2.

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

## 복원 후 익명화 (PII) · 개발 서버

복원(`DROP`/`CREATE` + import) **직후** 개발 DB에서만 PII 치환을 권장한다. **운영 DB WRITE 금지.**

1. env 에 경로 설정 (서버에 SQL 파일 배포 포함):

   ```bash
   POST_SYNC_SQL_FILE=/opt/mindgarden/scripts/database/sync/post-dev-sync-anonymize.sql
   ```

2. `prod-to-dev-daily.sh` 가 복원 후 위 파일을 자동 실행한다. 수동 검증:

   ```bash
   # dry-run (SELECT only)
   mysql ... "$DEV_DB_NAME" < /opt/mindgarden/scripts/database/sync/post-dev-sync-anonymize-dry-run.sql
   ```

3. **전략 요약**  
   - **유지 (로그인 SSOT)**: `user_id` / `password` / **`email` / `phone`** / 소셜·hash lookup. `tenant_id` 불변.  
     → DB에서 phone/email을 `*` 로 바꾸면 **로그인 불가**. (#584 DB 마스킹은 **폐기**)  
   - **name만 치환**: 일반 `DevUser-{id}` · 상담사 `DevConsultant-{id}` · 내담자(clients) `DevClient-{id}`.  
   - **phone/email 화면 마스킹**: 통합 사용자 관리 FE 전용 (`maskPhoneDisplay` / `maskEmailDisplay`). API·DB 원본 유지.  
   - **로그인**: 운영과 동일하게 **원본 email(또는 phone) + password**.  
   - `UserAnonymizationService`(계정 종료·tombstone)와는 **다름**.  
   - **상담사 name**: `users.name` (JOINED `consultants`) — `ROLE_CONSULTANT`·`consultants` JOIN 포함.  
     통합 사용자 관리(`/admin/user-management?type=consultant`)는 이 컬럼을 표시한다.  
   - **캐시**: 익명화 SQL(name) 직후 개발 **백엔드 재시작** 권장.  
   - **#584 잔존**: 이미 Dev DB에서 email/phone이 `***@***.com` / `010****` 로 바뀐 경우,  
     별도 백업 없이는 **원복 불가**. 그 동안은 **마스킹된 값 + password** 로 로그인.  
     **다음 prod→dev 복원**(DROP sync) 시 운영 원본 email/phone이 다시 들어온다.  
     (운영 WRITE·DROP은 사용자 명시 없이는 하지 않음.)

- 스키마 버전이 어긋나면 **Flyway** `repair` / 마이그레이션 재실행 필요 여부를 배포 런북과 맞출 것.
- 동일 `POST_SYNC_SQL_FILE` 훅으로 개발 전용 플래그·외부 발송 차단 SQL을 이어 붙일 수 있다 (경로를 합본 SQL 또는 별도 오케스트레이션으로).

## Flyway 소유 온보딩 프로시저 재적재

운영 덤프는 항상 `--skip-routines` 라서 루틴이 없고, 복원은 `DROP DATABASE` 로 시작한다.
그래서 복사 뒤에는 **저장소 SQL 로 루틴을 다시 만들어야** 한다.

- `redeploy_dev_procedures_from_repo` 가 `procedures_standardized/deployment` 전체를 db-diff 로 다시 만든다.
- **Flyway 마이그레이션에만 정의된 온보딩 프로시저 5건**도 2026-10-04 부터 같은 폴더의
  `<이름>_standardized.sql` 로 들어 있다. `flyway_schema_history` 가 "이미 적용됨" 으로 복원돼
  Flyway 는 이 5건을 다시 만들지 않으므로, 이 경로로만 되살아난다.
- #1410 의 개발 전용 경로(`procedures_flyway_dev_sync/`, `apply-flyway-procedures-dev.sh`)는 제거했다.
  같은 프로시저를 두 정의로 심지 않도록 원본 하나(아래 표)에서 생성한 SQL 하나만 쓴다.
  번들 publish 가 서버에 남은 예전 폴더·스크립트를 지운다.

| 프로시저 | 원본 | 선정 근거 |
| --- | --- | --- |
| `ProcessOnboardingApproval` | `src/main/resources/sql/procedures/process_onboarding_approval.sql` | `pinned`. Flyway 최신(`V20260402_001`)은 파라미터 11개라 호출부(12개)와 맞지 않음 |
| `GenerateErdOnOnboardingApproval` | `V14__create_erd_generation_procedure.sql` | CREATE 가 이 파일에만 있음 |
| `SetupTenantCategoryMapping` | `V41__create_missing_onboarding_procedures.sql` | CREATE 가 이 파일에만 있음 |
| `ActivateDefaultComponents` | `V20260522_002__shop_reward_default_components_onboarding.sql` | CREATE 가 이 파일에만 있음 |
| `CopyDefaultTenantCodes` | `V20260831_002__expense_income_ssot_tenant_backfill.sql` | CREATE 4개 파일 중 최신 버전 |

원본 목록은 `database/schema/procedures_standardized/FLYWAY_SOURCES.tsv` 이고,
이 5건의 `*_standardized.sql` 은 **생성물**이다. 손으로 고치지 말고 아래로 다시 뽑는다.

```bash
# 원본(마이그레이션)이 바뀌었을 때 재생성
bash scripts/database/sync/flyway-procedure-extract.sh generate

# 생성물이 최신 원본과 같은지 검사 (CI·번들 publish 가 같은 명령을 돌린다)
bash scripts/database/sync/flyway-procedure-extract.sh check
```

### 개발 DB 에 수동 1회 적용

전체 복사를 돌리지 않고 프로시저만 넣을 때는 다른 표준 프로시저와 같이
`deploy-procedures-dev.yml` 을 실행한다(`procedures` 입력에 이름, 또는 `mode=db-diff` + `confirm=CONFIRM`).

### 야간 배치 결과 확인 (다음 03:30 이후)

```bash
# 개발 서버. 읽기 전용
grep -E 'db-diff|summary total=' /var/log/mindgarden/prod-to-dev-daily.log | tail -20
mysql --defaults-extra-file=... -N -e "
  SELECT COUNT(*) FROM information_schema.ROUTINES
   WHERE ROUTINE_SCHEMA='core_solution' AND ROUTINE_TYPE='PROCEDURE';
  SELECT ROUTINE_NAME FROM information_schema.ROUTINES
   WHERE ROUTINE_SCHEMA='core_solution' AND ROUTINE_NAME IN
     ('ProcessOnboardingApproval','GenerateErdOnOnboardingApproval','SetupTenantCategoryMapping',
      'ActivateDefaultComponents','CopyDefaultTenantCodes') ORDER BY ROUTINE_NAME;"
```

5건이 모두 나와야 한다.

### 운영 반영

운영은 Flyway 가 이미 만들어 뒀다면 `deploy-procedures-production-mysql.yml` `mode=db-diff` dry-run 에서
이 5건의 차이가 0 으로 나온다. 운영에 없거나 파라미터가 다르면 `missing`/`count` 로 나오며,
`confirm=CONFIRM` 일 때만 safe-replace 한다. Flyway 마이그레이션 파일은 고치지 않는다.

## 관련 스크립트

- `scripts/database/sync/flyway-procedure-extract.sh` — Flyway 소유 온보딩 프로시저 표준 SQL 생성·최신성 검사
- `scripts/database/backups/database-backup.sh` — 운영 월간 백업(레거시 경로)
- `scripts/database/backups/database-restore.sh` — 단일 호스트 복원(대화형)

## 트러블슈팅

- **MariaDB / 구버전 MySQL**: `mysqldump` 가 `--set-gtid-purged` 를 모르면 `EXTRA_DUMP_OPTS` 로 덮어쓰거나 스크립트에서 해당 옵션을 제거한 포크를 둔다.
- **DEFINER 오류**: 운영 덤프의 `DEFINER` 가 개발에 없으면 복원 실패할 수 있다. 필요 시 덤프 후처리(`sed`) 또는 개발에 동일 DEFINER 계정 생성을 검토한다.
- **D-1 restore 후 스키마**: 복원만으로는 develop 코드의 스키마와 맞지 않을 수 있다. **BE가 Flyway를 실행해야** 마이그레이션이 적용된다.
- **가짜 BadCredentials**: `consultants` 등 Consultant JOINED 전용 컬럼(`vehicle_plate` 등) 누락 시 로그인 실패가 BadCredentials로 보일 수 있다. 실제 원인은 `InvalidDataAccessResourceUsageException`(컬럼 없음). 보정: `V20260904_005__ensure_consultants_vehicle_plate.sql` (멱등 ensure).

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
