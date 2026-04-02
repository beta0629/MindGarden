# Flyway 실패 마이그레이션 후 `repair` (빠른 참조)

운영 기동이 **컴파일 오류가 아니라** Flyway 검증에서 막힌 경우의 최소 절차입니다. 상세·변수·증적 수집은 [PROD Flyway 복구 Runbook 7절](../project-management/2026-03-31/PROD_FLYWAY_RECOVERY_RUNBOOK.md#7-사례-20260402002-align-consultation-type-검증-실패-기동-불가)을 따릅니다.

## 증상 (로그 키워드)

- `FlywayValidateException` / `Migrations have failed validation`
- `Detected failed migration`
- `20260402.002` (또는 `align consultation type with schedule codes`)

## 조치 순서

1. **DB 백업** (스냅샷 또는 덤프) 및 `flyway_schema_history` 증적 보관.
2. **Flyway CLI**로 동일 스키마에 대해 `flyway repair` 실행.  
   - JDBC URL, 사용자, 비밀번호는 **배포 환경 변수·비밀 저장소**에서 설정 (본 문서에 호스트·비밀번호를 적지 않음).
3. **애플리케이션 재기동**: `mindgarden` 서비스 재시작 또는 배포 파이프라인(`deploy-production` 등) 재실행으로 마이그레이션이 다시 적용되도록 함.

## 검증 SQL (`flyway_schema_history`)

**실패 직후(문제 확인)** — 아래 조건에 해당하는 행이 있으면 `repair` 대상입니다.

```sql
SELECT installed_rank, version, description, type, script, success, installed_on
FROM flyway_schema_history
WHERE success = 0
  AND version = '20260402.002';
```

`repair` 및 재기동·재마이그레이션 후에는 Runbook 7절 및 해당 DB 절차에 따라 성공 행·검증(`validate`)·헬스/API까지 확인합니다.
