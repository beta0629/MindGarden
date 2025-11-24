# 테넌트 생성 및 위젯 테스트 가이드

**작성일**: 2025-11-24  
**목적**: 상담소 및 학원 테넌트 생성 후 위젯 편집 UI 테스트  
**서버**: 개발 서버 (`beta0629.cafe24.com:8080`)

---

## 📋 테스트 목표

1. **상담소 테넌트 생성** (CONSULTATION)
2. **학원 테넌트 생성** (ACADEMY)
3. 각 테넌트로 위젯 편집 UI 테스트
4. 대시보드 위젯 표시 확인

---

## 🚀 Step 1: 온보딩 요청 생성

### 1.1 상담소 테넌트 온보딩 요청

**API**: `POST http://beta0629.cafe24.com:8080/api/v1/onboarding/requests`

**요청 본문**:
```json
{
  "tenantName": "테스트 상담소",
  "requestedBy": "test-consultation-20241124@example.com",
  "businessType": "CONSULTATION",
  "checklistJson": "{\"adminPassword\": \"Test1234!@#\", \"contactPhone\": \"010-1234-5678\", \"address\": \"서울특별시 강남구\"}"
}
```

**예상 결과**:
- 테넌트 ID: `tenant-{지역}-consultation-{순번}` (예: `tenant-seoul-consultation-001`)
- 관리자 계정: `test-consultation-20241124@example.com` / `Test1234!@#`

---

### 1.2 학원 테넌트 온보딩 요청

**API**: `POST http://beta0629.cafe24.com:8080/api/v1/onboarding/requests`

**요청 본문**:
```json
{
  "tenantName": "테스트 학원",
  "requestedBy": "test-academy-20241124@example.com",
  "businessType": "ACADEMY",
  "checklistJson": "{\"adminPassword\": \"Test1234!@#\", \"contactPhone\": \"010-9876-5432\", \"address\": \"서울특별시 강남구\"}"
}
```

**예상 결과**:
- 테넌트 ID: `tenant-{지역}-academy-{순번}` (예: `tenant-seoul-academy-001`)
- 관리자 계정: `test-academy-20241124@example.com` / `Test1234!@#`

---

## ✅ Step 2: 온보딩 승인 (Ops Portal)

### 2.1 Ops Portal 로그인

- **URL**: `https://ops.dev.e-trinity.co.kr/auth/login` (또는 개발 서버 URL)
- **계정**: `superadmin@mindgarden.com` / `admin123`

### 2.2 온보딩 요청 승인

1. 메뉴: "온보딩" → "대기 중인 요청"
2. 생성한 두 개의 요청 선택
3. 각각 "승인" 클릭

**확인 사항**:
- [ ] 상담소 테넌트 승인 완료
- [ ] 학원 테넌트 승인 완료
- [ ] 각 테넌트의 상태가 `APPROVED`로 변경됨
- [ ] 관리자 계정 생성 확인

---

## 🧪 Step 3: 위젯 편집 UI 테스트

### 3.1 상담소 테넌트 위젯 테스트

#### 3.1.1 로그인
- **URL**: `http://beta0629.cafe24.com:8080/login`
- **계정**: `test-consultation-20241124@example.com`
- **비밀번호**: `Test1234!@#`

#### 3.1.2 위젯 편집 UI 접속
- **경로**: `/admin/dashboards`
- **URL**: `http://beta0629.cafe24.com:8080/admin/dashboards`

#### 3.1.3 테스트 항목
- [ ] 대시보드 목록 표시 확인
- [ ] 대시보드 생성 버튼 클릭
- [ ] 대시보드 생성 모달 열림
- [ ] "위젯 편집" 탭 선택
- [ ] 위젯 추가 기능 테스트
- [ ] 위젯 삭제 기능 테스트
- [ ] 드래그 앤 드롭 레이아웃 편집 테스트
- [ ] 위젯 설정 변경 테스트
- [ ] 대시보드 저장 후 위젯 반영 확인
- [ ] 대시보드 접속 시 위젯 정상 표시 확인

---

### 3.2 학원 테넌트 위젯 테스트

#### 3.2.1 로그인
- **URL**: `http://beta0629.cafe24.com:8080/login`
- **계정**: `test-academy-20241124@example.com`
- **비밀번호**: `Test1234!@#`

#### 3.2.2 위젯 편집 UI 접속
- **경로**: `/admin/dashboards`
- **URL**: `http://beta0629.cafe24.com:8080/admin/dashboards`

#### 3.2.3 테스트 항목
- [ ] 대시보드 목록 표시 확인
- [ ] 대시보드 생성 버튼 클릭
- [ ] 대시보드 생성 모달 열림
- [ ] "위젯 편집" 탭 선택
- [ ] 위젯 추가 기능 테스트
- [ ] 위젯 삭제 기능 테스트
- [ ] 드래그 앤 드롭 레이아웃 편집 테스트
- [ ] 위젯 설정 변경 테스트
- [ ] 대시보드 저장 후 위젯 반영 확인
- [ ] 대시보드 접속 시 위젯 정상 표시 확인

---

## 📊 Step 4: 테넌트별 대시보드 확인

### 4.1 상담소 테넌트 대시보드

**예상 대시보드**:
- 관리자 대시보드 (ADMIN)
- 상담사 대시보드 (CONSULTANT)
- 고객 대시보드 (CLIENT)

**확인 사항**:
- [ ] 각 역할별 대시보드 생성 확인
- [ ] 대시보드 위젯 정상 표시
- [ ] 역할별 메뉴 표시 확인

---

### 4.2 학원 테넌트 대시보드

**예상 대시보드**:
- 관리자 대시보드 (ADMIN)
- 강사 대시보드 (TEACHER)
- 학생 대시보드 (STUDENT)

**확인 사항**:
- [ ] 각 역할별 대시보드 생성 확인
- [ ] 대시보드 위젯 정상 표시
- [ ] 역할별 메뉴 표시 확인

---

## 🔍 Step 5: 데이터베이스 확인 (선택사항)

### 5.1 테넌트 생성 확인

```sql
-- 테넌트 목록 확인
SELECT 
    tenant_id,
    name,
    business_type,
    status,
    created_at
FROM tenants
WHERE tenant_id LIKE 'tenant-%consultation%' 
   OR tenant_id LIKE 'tenant-%academy%'
ORDER BY created_at DESC;
```

### 5.2 관리자 계정 확인

```sql
-- 관리자 계정 확인
SELECT 
    id,
    tenant_id,
    email,
    username,
    role,
    is_active
FROM users
WHERE email IN (
    'test-consultation-20241124@example.com',
    'test-academy-20241124@example.com'
)
ORDER BY created_at DESC;
```

### 5.3 대시보드 생성 확인

```sql
-- 대시보드 목록 확인
SELECT 
    dashboard_id,
    tenant_id,
    dashboard_name,
    dashboard_type,
    role_code,
    is_default
FROM tenant_dashboards
WHERE tenant_id LIKE 'tenant-%consultation%' 
   OR tenant_id LIKE 'tenant-%academy%'
ORDER BY tenant_id, created_at;
```

---

## 📝 테스트 결과 기록

### 상담소 테넌트 테스트 결과

- **테넌트 ID**: `_________________`
- **관리자 계정**: `test-consultation-20241124@example.com`
- **위젯 편집 UI**: [ ] 성공 [ ] 실패
- **대시보드 표시**: [ ] 성공 [ ] 실패
- **비고**: 
  ```
  
  ```

---

### 학원 테넌트 테스트 결과

- **테넌트 ID**: `_________________`
- **관리자 계정**: `test-academy-20241124@example.com`
- **위젯 편집 UI**: [ ] 성공 [ ] 실패
- **대시보드 표시**: [ ] 성공 [ ] 실패
- **비고**: 
  ```
  
  ```

---

## 🐛 문제 발생 시

### 문제 1: 온보딩 요청 생성 실패
- API 응답 확인
- 서버 로그 확인
- 데이터베이스 연결 확인

### 문제 2: 온보딩 승인 실패
- Ops Portal 로그 확인
- 프로시저 실행 로그 확인
- 데이터베이스 오류 확인

### 문제 3: 위젯 편집 UI 접근 불가
- 로그인 상태 확인
- 권한 확인
- 대시보드 생성 여부 확인

### 문제 4: 위젯 표시 안 됨
- 대시보드 설정 확인
- 위젯 레지스트리 확인
- 브라우저 콘솔 오류 확인

---

## 🔗 관련 문서

- [테스트 계정 정보](./TEST_ACCOUNTS.md)
- [프론트엔드 로그인 테스트 결과](./FRONTEND_LOGIN_TEST_RESULTS.md)
- [Ops Portal 로그인 테스트 결과](./OPS_LOGIN_TEST_RESULTS.md)

---

**최종 업데이트**: 2025-11-24

