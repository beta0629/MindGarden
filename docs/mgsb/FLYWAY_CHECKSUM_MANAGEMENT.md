# Flyway Checksum 관리 가이드

## 문제 상황

Flyway checksum mismatch 오류가 자주 발생하는 이유:
- 이미 적용된 마이그레이션 파일을 수정했을 때
- 로컬 파일과 데이터베이스에 적용된 파일의 checksum이 다를 때
- Git에서 파일을 가져올 때 checksum이 변경될 수 있음

## 해결 방안

### 1. 환경별 Flyway 설정

#### 로컬 개발 환경 (`application-local.yml`)
```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
    validate-on-migrate: false  # ✅ 로컬에서는 검증 완화
    clean-disabled: true
```

#### 개발 서버 환경 (`application-dev.yml`)
```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
    validate-on-migrate: false  # ✅ 개발 서버에서는 검증 완화
    clean-disabled: true
```

#### 운영 환경 (`application-prod.yml`)
```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: false  # 운영에서는 baseline 비활성화
    validate-on-migrate: true   # ✅ 운영에서는 엄격한 검증
    clean-disabled: true
    # 운영 환경에서는 checksum mismatch 시 서버 시작 실패
    # 이는 데이터 무결성을 보장하기 위함
```

### 2. 마이그레이션 파일 수정 원칙

**절대 금지:**
- ❌ 이미 적용된 마이그레이션 파일 수정
- ❌ 이미 적용된 마이그레이션 파일 삭제
- ❌ 이미 적용된 마이그레이션 파일의 버전 번호 변경

**올바른 방법:**
- ✅ 새로운 마이그레이션 파일 생성 (V19, V20, ...)
- ✅ 변경사항은 새로운 마이그레이션 파일에 작성
- ✅ 롤백이 필요한 경우 새로운 마이그레이션 파일로 처리

### 3. Checksum Mismatch 발생 시 대응

#### 개발 환경 (로컬/개발 서버)
```bash
# 방법 1: Flyway repair 실행 (권장)
mvn flyway:repair -Dspring.profiles.active=local

# 방법 2: 데이터베이스에서 직접 수정
mysql -u root -p core_solution -e "
UPDATE flyway_schema_history 
SET checksum = [로컬 파일의 실제 checksum] 
WHERE version = '[버전 번호]';
"
```

#### 운영 환경
- 운영 환경에서는 `validate-on-migrate: true`로 설정되어 있어 checksum mismatch 시 서버 시작 실패
- 이는 **의도된 동작**이며, 데이터 무결성을 보장하기 위함
- 운영 환경에서 checksum mismatch가 발생하면:
  1. 로컬/개발 환경에서 마이그레이션 파일 확인
  2. 운영 환경의 마이그레이션 파일과 일치하는지 확인
  3. 불일치 시 운영 환경의 마이그레이션 파일을 로컬과 동일하게 맞춤
  4. 또는 새로운 마이그레이션 파일로 변경사항 적용

### 4. Checksum 계산 방법

```python
import zlib

def calculate_checksum(file_path):
    with open(file_path, 'rb') as f:
        content = f.read()
        checksum = zlib.crc32(content) & 0xffffffff
        # Java int로 변환 (signed 32-bit)
        if checksum > 0x7fffffff:
            checksum = checksum - 0x100000000
        return checksum
```

### 5. 테스트 전략

#### 개발 환경 (로컬/개발 서버)
- ✅ `validate-on-migrate: false` 설정으로 checksum 검증 완화
- ✅ 개발 중 마이그레이션 파일 수정 허용
- ✅ 테스트 및 디버깅 편의성 향상

#### 운영 환경
- ✅ `validate-on-migrate: true` 설정으로 엄격한 검증
- ✅ 마이그레이션 파일 수정 불가
- ✅ 데이터 무결성 보장

### 6. 권장 워크플로우

1. **로컬 개발**
   - 마이그레이션 파일 작성 및 테스트
   - 필요시 수정 및 재테스트
   - `validate-on-migrate: false`로 설정되어 있어 자유롭게 수정 가능

2. **개발 서버 배포**
   - 로컬에서 테스트 완료된 마이그레이션 파일 배포
   - 개발 서버에서도 `validate-on-migrate: false`로 설정되어 있어 유연하게 처리

3. **운영 환경 배포**
   - 운영 환경 배포 전 마이그레이션 파일 최종 확인
   - 운영 환경에서는 `validate-on-migrate: true`로 엄격한 검증
   - 마이그레이션 파일 수정 금지

### 7. 주의사항

⚠️ **중요:**
- 운영 환경에서는 절대 `validate-on-migrate: false`로 설정하지 마세요
- 이미 적용된 마이그레이션 파일은 절대 수정하지 마세요
- 변경사항이 필요하면 항상 새로운 마이그레이션 파일을 만드세요

### 8. 자동화 스크립트

개발 환경에서 checksum을 자동으로 수정하는 스크립트:

```bash
#!/bin/bash
# scripts/fix-flyway-checksum.sh

# 로컬 파일의 checksum 계산 및 DB 업데이트
# 사용법: ./scripts/fix-flyway-checksum.sh V11 V13
```

## 요약

- **개발 환경 (로컬/개발 서버)**: `validate-on-migrate: false` - 유연한 검증
- **운영 환경**: `validate-on-migrate: true` - 엄격한 검증
- **테스트**: 개발 환경에서만 자유롭게 테스트 가능
- **운영 배포**: 운영 환경에서는 엄격한 검증으로 데이터 무결성 보장

