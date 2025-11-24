# 위젯 테스트 계정 정보

**작성일**: 2025-11-24  
**생성 시간**: 2025-11-24 21:44  
**목적**: 위젯 편집 UI 테스트용 테넌트 계정

---

## 📋 테스트 계정 목록

### 1. 상담소 테넌트 (CONSULTATION)

- **테넌트 ID**: `tenant-unknown-consultation-001`
- **테넌트 이름**: 테스트 상담소
- **이메일**: `test-consultation-1763988242@example.com`
- **비밀번호**: `Test1234!@#`
- **업종**: CONSULTATION
- **온보딩 요청 ID**: 71

**로그인 URL**: `https://dev.core-solution.co.kr/login`

---

### 2. 학원 테넌트 (ACADEMY)

- **테넌트 ID**: `tenant-unknown-academy-001`
- **테넌트 이름**: 테스트 학원
- **이메일**: `test-academy-1763988263@example.com`
- **비밀번호**: `Test1234!@#`
- **업종**: ACADEMY
- **온보딩 요청 ID**: 72

**로그인 URL**: `https://dev.core-solution.co.kr/login`

---

## 🧪 위젯 테스트 가이드

### Step 1: 로그인

각 테넌트 계정으로 로그인합니다.

**상담소 테넌트**:
```
URL: http://beta0629.cafe24.com:8080/login
이메일: test-consultation-1763988242@example.com
비밀번호: Test1234!@#
```

**학원 테넌트**:
```
URL: http://beta0629.cafe24.com:8080/login
이메일: test-academy-1763988263@example.com
비밀번호: Test1234!@#
```

---

### Step 2: 위젯 편집 UI 접속

로그인 후 다음 경로로 접속합니다.

**URL**: `http://beta0629.cafe24.com:8080/admin/dashboards`

---

### Step 3: 위젯 테스트 항목

#### 3.1 대시보드 목록 확인
- [ ] 대시보드 목록이 정상적으로 표시됨
- [ ] 기본 대시보드가 생성되어 있음

#### 3.2 대시보드 생성/수정
- [ ] "대시보드 생성" 버튼 클릭
- [ ] 대시보드 생성 모달이 열림
- [ ] 대시보드 이름, 타입 입력 가능

#### 3.3 위젯 편집 탭
- [ ] "위젯 편집" 탭 선택
- [ ] 위젯 목록이 표시됨
- [ ] 위젯 추가 버튼 클릭 가능

#### 3.4 위젯 추가/삭제
- [ ] 위젯 추가 기능 테스트
- [ ] 위젯 삭제 기능 테스트
- [ ] 위젯 목록 업데이트 확인

#### 3.5 드래그 앤 드롭 레이아웃 편집
- [ ] 위젯 드래그 가능
- [ ] 위젯 위치 변경 가능
- [ ] 레이아웃 그리드 정렬 확인

#### 3.6 위젯 설정 변경
- [ ] 위젯 설정 모달 열기
- [ ] 위젯 설정 값 변경
- [ ] 설정 저장 확인

#### 3.7 대시보드 저장 및 확인
- [ ] 대시보드 저장 버튼 클릭
- [ ] 저장 성공 메시지 확인
- [ ] 대시보드 접속 시 위젯 정상 표시 확인

---

## 📊 테스트 결과 기록

### 상담소 테넌트 테스트 결과

- **테스트 일시**: _________________
- **위젯 편집 UI**: [ ] 성공 [ ] 실패
- **대시보드 표시**: [ ] 성공 [ ] 실패
- **비고**: 
  ```
  
  ```

---

### 학원 테넌트 테스트 결과

- **테스트 일시**: _________________
- **위젯 편집 UI**: [ ] 성공 [ ] 실패
- **대시보드 표시**: [ ] 성공 [ ] 실패
- **비고**: 
  ```
  
  ```

---

## 🔍 데이터베이스 확인 (선택사항)

### 테넌트 정보 확인

```sql
SELECT 
    tenant_id,
    name,
    business_type,
    status,
    created_at
FROM tenants
WHERE tenant_id IN (
    'tenant-unknown-consultation-001',
    'tenant-unknown-academy-001'
);
```

### 관리자 계정 확인

```sql
SELECT 
    u.id,
    u.email,
    u.tenant_id,
    u.role,
    u.is_active,
    t.name as tenant_name,
    t.business_type
FROM users u
INNER JOIN tenants t ON u.tenant_id = t.tenant_id
WHERE u.email IN (
    'test-consultation-1763988242@example.com',
    'test-academy-1763988263@example.com'
)
AND u.role = 'ADMIN'
AND u.is_deleted = FALSE;
```

### 대시보드 확인

```sql
SELECT 
    dashboard_id,
    tenant_id,
    dashboard_name,
    dashboard_type,
    role_code,
    is_default,
    created_at
FROM tenant_dashboards
WHERE tenant_id IN (
    'tenant-unknown-consultation-001',
    'tenant-unknown-academy-001'
)
ORDER BY tenant_id, created_at;
```

---

## 🔗 관련 문서

- [테스트 계정 정보](./TEST_ACCOUNTS.md)
- [테넌트 생성 및 위젯 테스트 가이드](./TENANT_CREATION_WIDGET_TEST.md)

---

**최종 업데이트**: 2025-11-24 21:45

