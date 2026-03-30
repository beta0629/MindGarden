# 개발 환경 배포 전략

## 🎯 원칙
**개발 환경 실패는 일단 문서화하고, 운영 환경 배포를 위한 안전한 방법을 우선 수립**

## 현재 상황
- 개발 환경 배포 실패: 구문 오류 지속 발생
- 원인: 파일 형식, DELIMITER 처리, LEAVE 문 등
- **중요**: 개발 환경 실패는 운영 배포에 직접적인 영향을 주지 않음

## 개발 환경 배포 전략

### 옵션 1: 개발 환경은 일단 보류 (권장)
- 개발 환경 배포 실패는 문서화만 진행
- 운영 환경 배포 방법을 안전하게 수립
- 운영 환경 배포 성공 후 개발 환경 재시도

### 옵션 2: 기존 프로시저 형식 분석 후 재시도
1. 개발 DB에 이미 존재하는 프로시저(`AddSessionsToMapping` 등) 형식 분석
2. 동일한 형식으로 표준화된 프로시저 재작성
3. 재배포 시도

### 옵션 3: MySQL 클라이언트 직접 사용
- 서버에 직접 접속하여 mysql 클라이언트 사용
- DELIMITER 사용 가능
- 단계별 배포 (DROP → CREATE)

## 권장 접근 방법

### 1단계: 운영 환경 배포 방법 수립 (우선)
1. ✅ 기존 작동 프로시저 형식 분석
2. ✅ 표준화된 프로시저를 동일 형식으로 재작성
3. ✅ 운영 환경 배포 스크립트 작성
4. ✅ 배포 전 검증 프로세스 수립

### 2단계: 운영 환경 배포 실행
1. 운영 환경 배포 스크립트 실행
2. 배포 성공 확인
3. 테스트 실행

### 3단계: 개발 환경 재시도 (선택)
1. 운영 환경 배포 성공 후 동일 방법으로 개발 환경 재시도
2. 또는 개발 환경은 운영 배포 후 자동으로 동기화

## 개발 환경 배포 스크립트 (운영 성공 후 사용)

```bash
#!/bin/bash
# 개발 환경 프로시저 배포 스크립트
# 운영 환경 배포 성공 후 동일 방법으로 재시도

DEV_DB_HOST="beta0629.cafe24.com"
DEV_DB_USER="mindgarden_dev"
DEV_DB_PASS="MindGardenDev2025!@#"
DEV_DB_NAME="core_solution"
PROCEDURES_DEPLOY_DIR="database/schema/procedures_standardized/deployment"

# 운영 환경과 동일한 방법으로 배포
for proc in CheckTimeConflict GetRefundableSessions; do
    file="${PROCEDURES_DEPLOY_DIR}/${proc}_deploy.sql"
    if [ -f "$file" ]; then
        mysql -h "$DEV_DB_HOST" -u "$DEV_DB_USER" -p"$DEV_DB_PASS" "$DEV_DB_NAME" < "$file"
    fi
done
```

## 다음 단계
1. ✅ 운영 환경 배포 방법 수립 (우선)
2. ✅ 운영 환경 배포 실행
3. ⏸️ 개발 환경 배포는 운영 성공 후 재시도

---

**작성일**: 2025-12-05  
**상태**: 개발 환경 배포는 일단 보류, 운영 환경 배포 우선

