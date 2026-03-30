# MVP 테스트 스크립트 가이드

**작성일**: 2025-11-23  
**목적**: 1월 심사/발표를 위한 MVP 기능 테스트 스크립트 모음

---

## 📋 테스트 스크립트 목록

### 1. 통합 테스트 코드 (Java)

**파일**: `MvpOnboardingFlowIntegrationTest.java`  
**위치**: `src/test/java/com/coresolution/core/integration/`

**실행 방법**:
```bash
cd MindGarden
./mvnw test -Dtest=MvpOnboardingFlowIntegrationTest
```

**테스트 항목**:
- CONSULTATION 업종 온보딩 플로우
- ACADEMY 업종 온보딩 플로우
- settings_json subdomain 확인

---

### 2. API 테스트 스크립트

#### PowerShell (Windows)

**파일**: `mvp-onboarding-api-test.ps1`

**실행 방법**:
```powershell
cd MindGarden/scripts/test
.\mvp-onboarding-api-test.ps1
```

**옵션**:
```powershell
# 기본 URL 변경
.\mvp-onboarding-api-test.ps1 -BaseUrl "http://localhost:8080/api/v1"

# 업종 변경
.\mvp-onboarding-api-test.ps1 -BusinessType "ACADEMY"
```

#### Bash (Linux/Mac)

**파일**: `mvp-onboarding-api-test.sh`

**실행 방법**:
```bash
cd MindGarden/scripts/test
chmod +x mvp-onboarding-api-test.sh
./mvp-onboarding-api-test.sh
```

**옵션**:
```bash
# 환경 변수로 설정
export BASE_URL="http://localhost:8080/api/v1"
export BUSINESS_TYPE="ACADEMY"
./mvp-onboarding-api-test.sh
```

---

### 3. SQL 검증 스크립트

**파일**: `mvp-verification.sql`

**실행 방법**:
```sql
-- MySQL 클라이언트에서 실행
mysql -u username -p database_name < mvp-verification.sql

-- 또는 MySQL Workbench에서 직접 실행
-- TENANT_ID와 EMAIL 변수를 실제 값으로 변경 후 실행
```

**변수 설정**:
```sql
SET @TENANT_ID = 'test-consultation-1234567890';
SET @EMAIL = 'admin@consultation-1234567890.com';
```

**검증 항목**:
1. 테넌트 생성 확인
2. settings_json features 확인
3. 관리자 계정 생성 확인
4. 기본 대시보드 생성 확인
5. 대시보드 위젯 상세 확인
6. 기본 컴포넌트 활성화 확인
7. 온보딩 요청 상태 확인
8. 종합 검증 요약

---

### 4. Postman Collection

**파일**: `mvp-postman-collection.json`

**사용 방법**:
1. Postman 열기
2. Import → File 선택
3. `mvp-postman-collection.json` 선택
4. Collection 실행

**자동 변수**:
- `tenantId`: 타임스탬프 기반 자동 생성
- `email`: 타임스탬프 기반 자동 생성
- `requestId`: 첫 번째 요청에서 자동 설정
- `token`: 로그인 후 자동 설정

**테스트 순서**:
1. 온보딩 요청 생성
2. 온보딩 승인
3. 테넌트 확인
4. 관리자 계정 로그인
5. 대시보드 조회

---

## 🚀 빠른 시작

### 방법 1: 통합 테스트 (권장)

```bash
cd MindGarden
./mvnw test -Dtest=MvpOnboardingFlowIntegrationTest
```

### 방법 2: API 스크립트

**Windows**:
```powershell
cd MindGarden/scripts/test
.\mvp-onboarding-api-test.ps1
```

**Linux/Mac**:
```bash
cd MindGarden/scripts/test
chmod +x mvp-onboarding-api-test.sh
./mvp-onboarding-api-test.sh
```

### 방법 3: Postman

1. Postman에서 `mvp-postman-collection.json` Import
2. Collection Runner 실행
3. 모든 요청 순차 실행

### 방법 4: SQL 직접 확인

```sql
-- 온보딩 승인 후 실행
SET @TENANT_ID = '실제_테넌트_ID';
SET @EMAIL = '실제_이메일';
-- mvp-verification.sql 실행
```

---

## 📊 테스트 결과 확인

### 성공 기준

- ✅ 온보딩 요청 생성 성공
- ✅ 온보딩 승인 성공
- ✅ 테넌트 생성 확인 (status = ACTIVE)
- ✅ settings_json.features.consultation = true (CONSULTATION 업종)
- ✅ settings_json.features.academy = true (ACADEMY 업종)
- ✅ 관리자 계정 생성 확인
- ✅ 관리자 계정으로 로그인 성공
- ✅ 기본 대시보드 생성 확인
- ✅ 대시보드에 위젯 3개 이상 포함
- ✅ 기본 컴포넌트 활성화 확인

---

## 🐛 문제 해결

### 문제 1: API 테스트 실패

**증상**: API 호출 실패

**해결**:
- 서버가 실행 중인지 확인
- `BASE_URL` 환경 변수 확인
- 네트워크 연결 확인

### 문제 2: 관리자 로그인 실패

**증상**: 로그인 API 401 에러

**해결**:
- 온보딩 승인 후 충분한 시간 대기 (프로시저 실행 시간)
- 관리자 계정이 실제로 생성되었는지 SQL로 확인
- 비밀번호가 올바른지 확인

### 문제 3: 대시보드 조회 실패

**증상**: 대시보드가 비어있음

**해결**:
- `createDefaultDashboards()` 메서드가 실행되었는지 확인
- `tenant_dashboards` 테이블에 데이터가 있는지 확인
- 로그 확인

---

## 📝 테스트 결과 기록

테스트 결과를 기록하여 문서화하세요:

```markdown
## 테스트 결과 (2025-11-23)

### 테스트 환경
- 서버: localhost:8080
- 데이터베이스: MySQL 8.0
- 테스트 시간: 2025-11-23 16:30

### 테스트 방법
- [ ] 통합 테스트 (Java)
- [x] API 스크립트 (PowerShell)
- [ ] Postman Collection
- [ ] SQL 직접 확인

### 테스트 결과
- ✅ 온보딩 요청 생성: 성공
- ✅ 온보딩 승인: 성공
- ✅ 테넌트 생성: 성공
- ✅ settings_json features: 확인됨
- ✅ 관리자 계정 생성: 성공
- ✅ 관리자 로그인: 성공
- ✅ 대시보드 생성: 성공
- ✅ 위젯 표시: 5개 위젯 확인
- ✅ 컴포넌트 활성화: 3개 컴포넌트 활성화 확인

### 발견된 이슈
- 없음
```

---

**마지막 업데이트**: 2025-11-23

