# V51 마이그레이션 실패 수정

**작성일**: 2025-11-25  
**문제**: V51 마이그레이션 실패로 인한 배포 오류

---

## 🔴 문제 상황

```
Schema `core_solution` contains a failed migration to version 51 !
```

V51 마이그레이션이 실패하여 애플리케이션이 시작되지 않음.

---

## 🔍 원인 분석

V51 마이그레이션 파일(`V51__insert_default_session_fee_common_code.sql`)에서 `tenant_id` 컬럼이 누락되었습니다.

- V10 마이그레이션에서 `common_codes` 테이블에 `tenant_id` 컬럼이 추가됨
- 코어 솔루션 코드는 `tenant_id = NULL`로 설정해야 함
- V51 마이그레이션에서 `tenant_id`를 명시하지 않아 실패

---

## ✅ 해결 방법

### 1. V51 마이그레이션 파일 수정

`src/main/resources/db/migration/V51__insert_default_session_fee_common_code.sql` 파일에 `tenant_id` 컬럼 추가:

```sql
INSERT INTO common_codes (
    tenant_id,  -- ✅ 추가됨
    code_group,
    code_value,
    ...
)
VALUES (
    NULL,  -- ✅ 코어 솔루션 코드 (모든 테넌트 공통)
    'SYSTEM_CONFIG',
    ...
)
```

### 2. 실패한 마이그레이션 레코드 삭제

개발 서버에서 실패한 마이그레이션 레코드를 삭제:

```bash
# 방법 1: 스크립트 사용 (권장)
./scripts/fix-v51-migration.sh

# 방법 2: 직접 MySQL 접속
mysql -h beta0629.cafe24.com -u mindgarden_dev -p core_solution
DELETE FROM flyway_schema_history WHERE version = '51' AND success = 0;
```

### 3. 서버 재시작

수정된 마이그레이션이 정상적으로 실행됩니다.

---

## 📝 참고사항

- 코어 솔루션 코드: `tenant_id = NULL` (모든 테넌트 공통)
- 테넌트별 코드: `tenant_id = 특정 테넌트 ID`
- `SYSTEM_CONFIG` 그룹은 코어 코드이므로 `tenant_id = NULL` 사용

---

## ✅ 수정 완료

- [x] V51 마이그레이션 파일에 `tenant_id` 컬럼 추가
- [x] 실패한 마이그레이션 복구 스크립트 생성 (`scripts/fix-v51-migration.sh`)


