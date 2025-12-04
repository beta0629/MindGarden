# 개발/운영 환경 분리 계획

**작성일**: 2025-12-04  
**상태**: 계획 수립  
**우선순위**: P0 (높음)

---

## 📌 개요

현재 `application.yml`에 하드코딩된 민감한 정보 기본값들이 개발/운영 환경 구분 없이 포함되어 있습니다.  
개발 환경과 운영 환경을 명확히 분리하여 보안 표준을 준수하도록 합니다.

---

## 🎯 환경 분리 원칙

### 1. 공통 설정 (`application.yml`)
- ✅ 공통 설정만 포함
- ❌ 민감한 정보 기본값 포함 금지
- ❌ 환경별 특정 설정 포함 금지

### 2. 개발 환경 (`application-local.yml`, `application-dev.yml`)
- ✅ 개발용 기본값 허용 (편의성)
- ✅ 더미 값 사용 가능
- ⚠️ 실제 비밀번호는 환경 변수 권장

### 3. 운영 환경 (`application-prod.yml`)
- ❌ 기본값 절대 금지
- ✅ 모든 민감한 정보는 환경 변수 필수
- ✅ 환경 변수 미설정 시 애플리케이션 시작 실패

---

## 🔍 현재 문제점

### 1. `application.yml` (공통 설정)

**문제점**:
```yaml
jwt:
  secret: ${JWT_SECRET:MindGardenJWTSecretKey2025!@#$%^&*()_+}  # 하드코딩된 기본값

encryption:
  personal-data:
    key: ${PERSONAL_DATA_ENCRYPTION_KEY:MindGardenPersonalDataEncryptionKey2025!@#$%^&*()_+}  # 하드코딩
    iv: ${PERSONAL_DATA_ENCRYPTION_IV:MindGardenPersonalDataEncryptionIV2025!@#$%^&*()_+}  # 하드코딩

payment:
  toss:
    secret-key: ${PAYMENT_TOSS_SECRET_KEY:dummy-toss-secret}  # 더미 값
```

**문제**: 공통 설정에 기본값이 있으면 운영 환경에서도 기본값이 사용될 수 있음

---

### 2. `application-prod.yml` (운영 환경)

**문제점**:
```yaml
jwt:
  secret: ${JWT_SECRET:}  # 기본값은 없지만 환경 변수 검증 없음

encryption:
  personal-data:
    key: ${PERSONAL_DATA_ENCRYPTION_KEY:MindGarden2025SecretKey!@#}  # 여전히 기본값!
    iv: ${PERSONAL_DATA_ENCRYPTION_IV:MindGarden2025IV!@#789}  # 여전히 기본값!
```

**문제**: 운영 환경에도 기본값이 하드코딩되어 있음

---

### 3. `application-dev.yml` (개발 환경)

**현재 상태**: ✅ 양호
- 개발용 기본값 사용
- 더미 값 사용

**유지 가능**: 개발 환경이므로 허용

---

## 📋 수정 계획

### 1. `application.yml` 수정 (공통 설정)

**작업 내용**:
1. 모든 민감한 정보 기본값 제거
2. 환경 변수만 참조하도록 변경
3. 공통 설정만 유지

**수정 예시**:
```yaml
# Before:
jwt:
  secret: ${JWT_SECRET:MindGardenJWTSecretKey2025!@#$%^&*()_+}

# After:
jwt:
  secret: ${JWT_SECRET}  # 기본값 제거, 프로파일별 설정에서 처리
```

---

### 2. `application-dev.yml` 수정 (개발 환경)

**작업 내용**:
1. `application.yml`에서 제거한 기본값을 개발 환경으로 이동
2. 개발 편의성을 위해 기본값 유지
3. 개발용 더미 값 사용 가능

**수정 예시**:
```yaml
jwt:
  secret: ${JWT_SECRET:dev-jwt-secret-key-change-me-in-production}  # 개발용 기본값

encryption:
  personal-data:
    key: ${PERSONAL_DATA_ENCRYPTION_KEY:dev-encryption-key-32-chars-long}
    iv: ${PERSONAL_DATA_ENCRYPTION_IV:dev-iv-16-chars}
```

---

### 3. `application-prod.yml` 수정 (운영 환경)

**작업 내용**:
1. 모든 기본값 제거
2. 환경 변수 필수로 설정
3. 환경 변수 검증 로직 추가

**수정 예시**:
```yaml
# Before:
jwt:
  secret: ${JWT_SECRET:MindGarden2025SecretKey!@#}

# After:
jwt:
  secret: ${JWT_SECRET}  # 기본값 제거, 환경 변수 필수

encryption:
  personal-data:
    key: ${PERSONAL_DATA_ENCRYPTION_KEY}  # 기본값 제거
    iv: ${PERSONAL_DATA_ENCRYPTION_IV}  # 기본값 제거
```

---

### 4. `application-local.yml` 수정 (로컬 환경)

**작업 내용**:
1. 개발용 기본값 포함 (편의성)
2. 환경 변수 우선 사용

---

## 🔧 환경 변수 검증 로직 추가

### 목적
운영 환경에서 환경 변수가 설정되지 않으면 애플리케이션 시작 실패

### 구현 위치
- `src/main/java/com/coresolution/core/config/EnvironmentValidationConfig.java` (신규 생성)

### 검증 항목
- JWT_SECRET
- PERSONAL_DATA_ENCRYPTION_KEY
- PERSONAL_DATA_ENCRYPTION_IV
- DB_PASSWORD (운영 환경)
- 기타 필수 환경 변수

---

## 📊 작업 단계

### Phase 1: 공통 설정 정리 (1시간)
1. `application.yml`에서 민감한 정보 기본값 제거
2. 공통 설정만 유지

### Phase 2: 개발 환경 설정 (30분)
1. `application-dev.yml`에 개발용 기본값 추가
2. `application-local.yml`에 로컬용 기본값 추가

### Phase 3: 운영 환경 설정 (30분)
1. `application-prod.yml`에서 모든 기본값 제거
2. 환경 변수 필수로 변경

### Phase 4: 환경 변수 검증 (1시간)
1. 환경 변수 검증 로직 추가
2. 운영 환경에서만 검증 활성화

---

## ✅ 체크리스트

### 공통 설정 (`application.yml`)
- [ ] JWT Secret 기본값 제거
- [ ] 암호화 키 기본값 제거
- [ ] 결제 시스템 키 기본값 제거
- [ ] 공통 설정만 유지

### 개발 환경 (`application-dev.yml`, `application-local.yml`)
- [ ] 개발용 기본값 추가
- [ ] 더미 값 사용 가능
- [ ] 환경 변수 우선 사용

### 운영 환경 (`application-prod.yml`)
- [ ] 모든 기본값 제거
- [ ] 환경 변수 필수로 설정
- [ ] 환경 변수 검증 로직 추가

### 검증
- [ ] 개발 환경에서 기본값 사용 확인
- [ ] 운영 환경에서 환경 변수 필수 확인
- [ ] 환경 변수 미설정 시 시작 실패 확인

---

**최종 업데이트**: 2025-12-04

