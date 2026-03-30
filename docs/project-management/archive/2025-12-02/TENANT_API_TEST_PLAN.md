# 테넌트 API 테스트 계획서

**작성일:** 2025년 12월 2일 (화요일)  
**작성자:** AI Assistant  
**프로젝트:** MindGarden CoreSolution  
**목적:** 테넌트 관련 핵심 API 실제 동작 검증

---

## 📋 테스트 개요

### 테스트 목표
- 백엔드 API가 실제로 정상 동작하는지 검증
- 프론트엔드와 백엔드 간 연동 상태 확인
- 데이터베이스 저장 및 조회 기능 검증
- 테넌트별 데이터 격리 확인

### 테스트 범위
1. **상담사 등록 API** (`/api/admin/consultants`)
2. **내담자 등록 API** (`/api/admin/clients`)
3. **매칭 생성 API** (`/api/admin/mappings`)
4. **대시보드 관리 API** (`/api/v1/tenant/dashboards`)

---

## 🔧 테스트 환경 설정

### 사전 준비사항
- [x] 백엔드 서버 실행 확인 (포트: 8080)
- [x] 프론트엔드 서버 실행 확인 (포트: 3000)
- [ ] 테스트용 테넌트 관리자 계정 준비
- [ ] 데이터베이스 접속 확인
- [ ] API 테스트 도구 준비 (Postman/curl)

### 테스트 계정 정보
```
테넌트 관리자 계정:
- 아이디: superadmin@mindgarden.com
- 비밀번호: admin123
- 역할: ADMIN
```

### 테스트 서버 정보
```
로컬 환경:
- 백엔드: http://localhost:8080
- 프론트엔드: http://localhost:3000
- 데이터베이스: MySQL (beta0629.cafe24.com:3306/core_solution)
```

---

## 📝 테스트 케이스

### 1. 상담사 등록 API 테스트

#### 1.1 API 기본 정보
```
Method: POST
URL: http://localhost:8080/api/admin/consultants
Content-Type: application/json
Authorization: 세션 기반 (로그인 필요)
```

#### 1.2 테스트 데이터
```json
{
  "username": "test_consultant_001",
  "email": "consultant001@test.com",
  "password": "test123!",
  "name": "테스트 상담사",
  "phone": "010-1234-5678",
  "address": "서울시 강남구",
  "addressDetail": "테스트빌딩 101호",
  "postalCode": "12345",
  "specialization": "심리상담",
  "qualifications": "심리상담사 2급",
  "experience": "3년",
  "notes": "테스트용 상담사 등록"
}
```

#### 1.3 예상 응답
```json
{
  "success": true,
  "message": "상담사가 성공적으로 등록되었습니다",
  "data": {
    "id": 123,
    "username": "test_consultant_001",
    "name": "테스트 상담사",
    "email": "consultant001@test.com",
    "role": "CONSULTANT",
    "isActive": true,
    "branchCode": "BRANCH001"
  }
}
```

#### 1.4 검증 포인트
- [ ] HTTP 상태 코드: 201 Created
- [ ] 응답 데이터 구조 확인
- [ ] 데이터베이스에 실제 저장 확인
- [ ] 전화번호 암호화 처리 확인
- [ ] 지점코드 자동 할당 확인
- [ ] tenantId 필터링 적용 확인

### 2. 내담자 등록 API 테스트

#### 2.1 API 기본 정보
```
Method: POST
URL: http://localhost:8080/api/admin/clients
Content-Type: application/json
Authorization: 세션 기반 (로그인 필요)
```

#### 2.2 테스트 데이터
```json
{
  "username": "test_client_001",
  "email": "client001@test.com",
  "password": "test123!",
  "name": "테스트 내담자",
  "phone": "010-9876-5432",
  "address": "서울시 서초구",
  "addressDetail": "테스트아파트 202호",
  "postalCode": "54321",
  "emergencyContact": "010-1111-2222",
  "emergencyContactName": "보호자",
  "consultationNeeds": "스트레스 관리",
  "notes": "테스트용 내담자 등록"
}
```

#### 2.3 예상 응답
```json
{
  "success": true,
  "message": "내담자가 성공적으로 등록되었습니다",
  "data": {
    "id": 456,
    "name": "테스트 내담자",
    "email": "client001@test.com",
    "phone": "encrypted_phone_data",
    "branchCode": "BRANCH001"
  }
}
```

#### 2.4 검증 포인트
- [ ] HTTP 상태 코드: 201 Created
- [ ] 개인정보 암호화 처리 확인
- [ ] 응급연락처 저장 확인
- [ ] 상담 요구사항 저장 확인
- [ ] 매칭 대기 상태 설정 확인

### 3. 매칭 생성 API 테스트

#### 3.1 API 기본 정보
```
Method: POST
URL: http://localhost:8080/api/admin/mappings
Content-Type: application/json
Authorization: 세션 기반 (로그인 필요)
```

#### 3.2 테스트 데이터
```json
{
  "consultantId": 123,
  "clientId": 456,
  "startDate": "2025-12-02",
  "endDate": "2026-06-02",
  "status": "ACTIVE",
  "notes": "테스트 매칭",
  "totalSessions": 20,
  "remainingSessions": 20,
  "packageName": "기본 상담 패키지",
  "packagePrice": 1000000,
  "paymentStatus": "PAID",
  "paymentAmount": 1000000,
  "paymentMethod": "CARD",
  "mappingType": "NEW"
}
```

#### 3.3 예상 응답
```json
{
  "success": true,
  "message": "매칭이 성공적으로 생성되었습니다",
  "data": {
    "id": 789,
    "consultantId": 123,
    "clientId": 456,
    "status": "ACTIVE",
    "startDate": "2025-12-02",
    "totalSessions": 20,
    "remainingSessions": 20,
    "branchCode": "BRANCH001"
  }
}
```

#### 3.4 검증 포인트
- [ ] HTTP 상태 코드: 201 Created
- [ ] 상담사-내담자 관계 설정 확인
- [ ] 회기 정보 저장 확인
- [ ] 결제 정보 연동 확인
- [ ] 매칭 상태 관리 확인

### 4. 대시보드 관리 API 테스트

#### 4.1 API 기본 정보
```
Method: GET
URL: http://localhost:8080/api/v1/tenant/dashboards
Authorization: 세션 기반 (로그인 필요)
```

#### 4.2 예상 응답
```json
{
  "success": true,
  "data": [
    {
      "dashboardId": "admin_dashboard_001",
      "dashboardName": "관리자 대시보드",
      "dashboardNameKo": "관리자 대시보드",
      "tenantRoleId": "ADMIN",
      "roleNameKo": "관리자",
      "widgets": [
        {
          "widgetType": "statistics",
          "widgetName": "오늘의 통계"
        }
      ]
    }
  ]
}
```

#### 4.3 검증 포인트
- [ ] HTTP 상태 코드: 200 OK
- [ ] 테넌트별 대시보드 목록 조회
- [ ] 역할별 대시보드 필터링 확인
- [ ] 위젯 정보 포함 여부 확인

---

## 🧪 테스트 실행 절차

### Phase 1: 환경 준비 (10분)
1. **서버 상태 확인**
   ```bash
   curl http://localhost:8080/actuator/health
   ```

2. **로그인 세션 생성**
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "username": "superadmin@mindgarden.com",
       "password": "admin123"
     }' \
     -c cookies.txt
   ```

3. **세션 확인**
   ```bash
   curl http://localhost:8080/api/auth/me \
     -b cookies.txt
   ```

### Phase 2: API 순차 테스트 (30분)
1. **상담사 등록 테스트**
   ```bash
   curl -X POST http://localhost:8080/api/admin/consultants \
     -H "Content-Type: application/json" \
     -b cookies.txt \
     -d @consultant_test_data.json
   ```

2. **내담자 등록 테스트**
   ```bash
   curl -X POST http://localhost:8080/api/admin/clients \
     -H "Content-Type: application/json" \
     -b cookies.txt \
     -d @client_test_data.json
   ```

3. **매칭 생성 테스트**
   ```bash
   curl -X POST http://localhost:8080/api/admin/mappings \
     -H "Content-Type: application/json" \
     -b cookies.txt \
     -d @mapping_test_data.json
   ```

4. **대시보드 조회 테스트**
   ```bash
   curl http://localhost:8080/api/v1/tenant/dashboards \
     -b cookies.txt
   ```

### Phase 3: 데이터 검증 (20분)
1. **데이터베이스 직접 확인**
   ```sql
   -- 상담사 등록 확인
   SELECT * FROM users WHERE username = 'test_consultant_001';
   
   -- 내담자 등록 확인
   SELECT * FROM users WHERE username = 'test_client_001';
   
   -- 매칭 생성 확인
   SELECT * FROM consultant_client_mappings 
   WHERE consultant_id = 123 AND client_id = 456;
   ```

2. **암호화 데이터 확인**
   ```sql
   -- 전화번호 암호화 확인
   SELECT phone FROM users WHERE username = 'test_consultant_001';
   ```

3. **테넌트 격리 확인**
   ```sql
   -- tenantId 필터링 확인
   SELECT tenant_id, username FROM users 
   WHERE username IN ('test_consultant_001', 'test_client_001');
   ```

---

## 📊 테스트 결과 기록

### 테스트 결과 템플릿
```
테스트 케이스: [API 이름]
실행 시간: [YYYY-MM-DD HH:MM:SS]
결과: [PASS/FAIL]
HTTP 상태 코드: [200/201/400/500 등]
응답 시간: [ms]
오류 메시지: [있는 경우]
비고: [특이사항]
```

### 성공 기준
- [ ] 모든 API가 예상 HTTP 상태 코드 반환
- [ ] 응답 데이터 구조가 예상과 일치
- [ ] 데이터베이스에 정확한 데이터 저장
- [ ] 암호화 처리 정상 동작
- [ ] 테넌트별 데이터 격리 확인
- [ ] 권한 체크 정상 동작

### 실패 시 대응 방안
1. **API 호출 실패**: 서버 로그 확인, 엔드포인트 재확인
2. **데이터 저장 실패**: 데이터베이스 연결 상태 확인
3. **권한 오류**: 세션 상태 및 권한 설정 확인
4. **암호화 오류**: 암호화 설정 및 키 확인

---

## 🔍 추가 검증 사항

### 보안 테스트
- [ ] 세션 없이 API 호출 시 401 Unauthorized 반환
- [ ] 권한 없는 사용자의 API 호출 시 403 Forbidden 반환
- [ ] SQL Injection 방어 확인
- [ ] XSS 방어 확인

### 성능 테스트
- [ ] API 응답 시간 2초 이내
- [ ] 동시 요청 처리 능력 확인
- [ ] 메모리 사용량 모니터링

### 데이터 무결성 테스트
- [ ] 중복 데이터 생성 방지
- [ ] 필수 필드 누락 시 적절한 오류 반환
- [ ] 데이터 타입 검증
- [ ] 길이 제한 검증

---

## 📋 체크리스트

### 테스트 실행 전
- [ ] 백엔드 서버 실행 확인
- [ ] 프론트엔드 서버 실행 확인
- [ ] 데이터베이스 연결 확인
- [ ] 테스트 계정 준비
- [ ] 테스트 데이터 파일 준비

### 테스트 실행 중
- [ ] 각 API 호출 결과 기록
- [ ] 오류 발생 시 로그 수집
- [ ] 데이터베이스 상태 확인
- [ ] 응답 시간 측정

### 테스트 완료 후
- [ ] 테스트 결과 정리
- [ ] 발견된 이슈 문서화
- [ ] 테스트 데이터 정리
- [ ] 다음 단계 계획 수립

---

**⚠️ 중요 사항**
- 테스트 데이터는 실제 운영 데이터와 구분하여 사용
- 테스트 완료 후 생성된 테스트 데이터 정리
- 발견된 보안 이슈는 즉시 보고
- 모든 테스트 과정과 결과를 상세히 기록

---

*작성일: 2025년 12월 2일 (화요일)*  
*다음 업데이트: 테스트 완료 후*
