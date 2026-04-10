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

## 참고

- 이 작업은 **GitHub Actions만으로 운영 DB에 접속**하기 어려운 경우가 많다. **내부 배치 서버 + cron** 이 기본안이다.
