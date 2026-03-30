# 운영 환경 프로시저 배포 계획

## 🎯 목표
**운영 환경에서 오류 없이 프로시저 배포 보장**

## 현재 상황
- 개발 환경 배포 실패: 구문 오류 지속 발생
- 원인: 파일 형식, DELIMITER 처리, LEAVE 문 등
- **중요**: 개발 환경 실패는 일단 문서화하고, 운영 환경 배포 방법을 안전하게 수립

## 운영 환경 배포 전략

### 1단계: 기존 성공 사례 분석
- ✅ 개발 DB에 이미 존재하는 프로시저들 분석
- ✅ 성공적으로 배포된 프로시저의 형식 확인
- ✅ 동일한 형식으로 표준화된 프로시저 재작성

### 2단계: 배포 방법 검증
- ✅ MySQL 클라이언트 직접 사용 (DELIMITER 사용 가능)
- ✅ 단계별 배포 (DROP → CREATE 분리)
- ✅ 배포 전 구문 검증

### 3단계: 운영 환경 배포 프로세스

#### 방법 A: MySQL 클라이언트 직접 사용 (권장)
```bash
# 서버에 직접 접속하여 mysql 클라이언트 사용
mysql -h [운영DB호스트] -u [사용자] -p [DB명] < procedure.sql
```
- **장점**: DELIMITER 사용 가능, 구문 오류 즉시 확인
- **단점**: 수동 작업 필요

#### 방법 B: Flyway 마이그레이션 사용
```sql
-- V20251205_001__standardize_procedures.sql
DELIMITER //
DROP PROCEDURE IF EXISTS CheckTimeConflict //
CREATE PROCEDURE CheckTimeConflict(...) BEGIN ... END //
DELIMITER ;
```
- **장점**: 버전 관리, 롤백 가능, 자동화
- **단점**: Flyway 설정 필요

#### 방법 C: 단계별 배포 스크립트
1. DROP PROCEDURE만 먼저 실행
2. CREATE PROCEDURE를 별도로 실행
3. 각 단계별 검증

### 4단계: 배포 전 검증 체크리스트
- [ ] 프로시저 구문 검증 (MySQL Workbench 또는 mysql 클라이언트)
- [ ] 테스트 환경에서 동일한 형식으로 배포 성공 확인
- [ ] 롤백 스크립트 준비
- [ ] 운영 환경 MySQL 버전 확인
- [ ] 운영 환경 접근 권한 확인
- [ ] 배포 시간대 결정 (유지보수 시간)
- [ ] 모니터링 계획 수립

### 5단계: 롤백 계획
1. 기존 프로시저 백업 (SHOW CREATE PROCEDURE)
2. 롤백 스크립트 준비
3. 배포 실패 시 즉시 롤백 가능하도록 준비

## 권장 배포 방법

### 1. 기존 프로시저 형식 분석 후 동일 형식으로 재작성
```sql
-- 기존 작동하는 프로시저 형식 분석
SHOW CREATE PROCEDURE AddSessionsToMapping;

-- 동일한 형식으로 표준화된 프로시저 작성
-- (DELIMITER 사용, 형식 정확히 맞춤)
```

### 2. 운영 환경 배포 스크립트 작성
```bash
#!/bin/bash
# 운영 환경 프로시저 배포 스크립트
# 사용법: ./deploy-procedures-prod.sh

PROD_DB_HOST="[운영DB호스트]"
PROD_DB_USER="[운영DB사용자]"
PROD_DB_NAME="core_solution"
PROCEDURE_FILE="CheckTimeConflict_standardized.sql"

# 1. 기존 프로시저 백업
mysql -h "$PROD_DB_HOST" -u "$PROD_DB_USER" -p "$PROD_DB_NAME" \
  -e "SHOW CREATE PROCEDURE CheckTimeConflict\G" > backup_CheckTimeConflict.sql

# 2. 프로시저 배포
mysql -h "$PROD_DB_HOST" -u "$PROD_DB_USER" -p "$PROD_DB_NAME" < "$PROCEDURE_FILE"

# 3. 배포 확인
mysql -h "$PROD_DB_HOST" -u "$PROD_DB_USER" -p "$PROD_DB_NAME" \
  -e "SELECT COUNT(*) FROM information_schema.PARAMETERS 
      WHERE SPECIFIC_SCHEMA = '$PROD_DB_NAME' 
      AND SPECIFIC_NAME = 'CheckTimeConflict';"
```

### 3. 배포 전 필수 작업
1. **기존 프로시저 형식 분석**: 개발 DB의 작동하는 프로시저 확인
2. **표준화된 프로시저 재작성**: 동일한 형식으로 재작성
3. **로컬에서 구문 검증**: MySQL Workbench 또는 로컬 MySQL에서 검증
4. **테스트 환경 배포**: 운영과 동일한 환경에서 테스트
5. **운영 배포**: 검증 완료 후 운영 배포

## 다음 단계
1. ✅ 기존 작동 프로시저 형식 분석 완료
   - `AddSessionsToMapping`: `OUT p_result_code INT, OUT p_result_message VARCHAR(500)` 사용
   - `LEAVE` 문 없이 `ROLLBACK` 후 바로 종료
2. ⏳ 표준화된 프로시저를 동일 형식으로 재작성 필요
   - `LEAVE` 문 제거
   - `ROLLBACK` 후 바로 종료하도록 수정
3. ✅ 운영 환경 안전 배포 스크립트 작성 완료 (`deploy-procedures-prod-safe.sh`)
4. ✅ 배포 전 검증 프로세스 수립 완료
5. ⏳ 운영 배포 실행 (프로시저 재작성 후)

---

**작성일**: 2025-12-05  
**우선순위**: 🔴 **CRITICAL** - 운영 환경 배포 전 필수

