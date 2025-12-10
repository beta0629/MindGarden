# Ops Portal 테스트 체크리스트

**작성일**: 2025-12-10  
**목적**: Ops Portal 테스트 진행 전 상태 확인 및 체크리스트

---

## 📋 사전 확인 사항

### 1. 서버 상태 확인
- [ ] Ops 백엔드 서버 실행 중 (포트 8081)
- [ ] Ops 프론트엔드 서버 실행 중 (포트 4300)
- [ ] CoreSolution 백엔드 서버 실행 중 (포트 8080) - 공통코드 조회용

### 2. 데이터베이스 연결 확인
- [ ] 데이터베이스 연결 정상
- [ ] 시간대 설정 확인 (Asia/Seoul)

### 3. 테스트 데이터 확인
- [ ] PENDING 상태의 온보딩 요청 존재 여부
- [ ] 기존 테스트 데이터 삭제 완료 여부

---

## ✅ 테스트 시나리오

### 시나리오 1: 온보딩 승인 프로세스

#### 1-1. 온보딩 요청 조회
- [ ] Ops Portal 로그인
- [ ] 대시보드에서 온보딩 요청 수 확인
- [ ] 온보딩 목록 페이지 접근
- [ ] PENDING 상태 요청 목록 확인

#### 1-2. 온보딩 상세 조회
- [ ] 온보딩 요청 카드 클릭 또는 "보기" 버튼 클릭
- [ ] 상세 페이지에서 다음 정보 확인:
  - [ ] 테넌트명
  - [ ] 요청자 이메일
  - [ ] 지역 정보 (region)
  - [ ] 브랜드명 (brand_name)
  - [ ] 업종 (business_type)
  - [ ] 체크리스트 JSON (dashboardTemplates, dashboardWidgets 등)
  - [ ] 요청 일시 (한국 표준시로 표시되는지 확인)

#### 1-3. 온보딩 승인
- [ ] 상태 드롭다운에서 "승인됨" 선택
- [ ] 결정 사유 입력 (선택)
- [ ] "결정 저장" 버튼 클릭
- [ ] 토스트 알림 확인 ("결정 저장됨")
- [ ] 페이지 새로고침 후 상태 변경 확인

#### 1-4. 승인 후 생성 확인
- [ ] 테넌트 생성 확인
  - [ ] 테넌트 ID 형식: `tenant-{지역코드}-{업종코드}-{순번}`
  - [ ] 지역코드 매핑 확인 (예: INCHEON → incheon)
  - [ ] 브랜딩 JSON 저장 확인
- [ ] 관리자 계정 생성 확인
  - [ ] 이메일: 요청자 이메일
  - [ ] 역할: ADMIN
  - [ ] 활성 상태: TRUE
- [ ] 기본 역할 생성 확인
  - [ ] CONSULTATION: 4개 (원장, 상담사, 내담자, 사무원)
  - [ ] ACADEMY: 5개 (원장, 교사, 학생, 학부모, 사무원)
- [ ] **대시보드 생성 확인** ⭐
  - [ ] 역할별 대시보드 생성 확인
  - [ ] 대시보드 수 = 역할 수
  - [ ] 각 대시보드의 `dashboard_type`이 `template_code`와 일치하는지 확인

---

### 시나리오 2: 시간대 표시 확인

#### 2-1. 온보딩 요청 시간 표시
- [ ] 온보딩 목록에서 요청 일시 확인
- [ ] 한국 표준시(KST)로 표시되는지 확인
- [ ] 형식: "2025. 12. 10. 오후 06:25" (한국 시간)

#### 2-2. 상세 페이지 시간 표시
- [ ] 상세 페이지에서 요청 일시 확인
- [ ] 한국 표준시로 표시되는지 확인

---

### 시나리오 3: 필터 및 검색

#### 3-1. 상태별 필터
- [ ] "대기 중" 필터 클릭
- [ ] PENDING 상태 요청만 표시되는지 확인
- [ ] "승인됨" 필터 클릭
- [ ] APPROVED 상태 요청만 표시되는지 확인

#### 3-2. 검색 기능
- [ ] 검색어 입력
- [ ] 검색 결과 확인

---

## 🔍 확인 SQL 쿼리

### 승인 후 테넌트 확인
```sql
SELECT 
    tenant_id,
    name,
    business_type,
    status,
    branding_json,
    created_at,
    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at_kst
FROM tenants
WHERE tenant_id = '{생성된_테넌트_ID}'
  AND (is_deleted IS NULL OR is_deleted = FALSE);
```

### 관리자 계정 확인
```sql
SELECT 
    user_id,
    email,
    name,
    role,
    tenant_id,
    is_active,
    created_at,
    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at_kst
FROM users
WHERE tenant_id = '{생성된_테넌트_ID}'
  AND role = 'ADMIN'
  AND (is_deleted IS NULL OR is_deleted = FALSE);
```

### 기본 역할 확인
```sql
SELECT 
    tenant_role_id,
    tenant_id,
    name,
    name_ko,
    display_order,
    role_template_id,
    created_at,
    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at_kst
FROM tenant_roles
WHERE tenant_id = '{생성된_테넌트_ID}'
  AND (is_deleted IS NULL OR is_deleted = FALSE)
ORDER BY display_order;
```

### 대시보드 생성 확인
```sql
SELECT 
    td.dashboard_id,
    td.dashboard_name,
    td.dashboard_name_ko,
    td.tenant_role_id,
    tr.name_ko as role_name,
    tr.display_order as role_display_order,
    td.dashboard_type,
    td.is_default,
    td.is_active,
    td.display_order,
    td.created_at,
    DATE_FORMAT(td.created_at, '%Y-%m-%d %H:%i:%s') as created_at_kst
FROM tenant_dashboards td
LEFT JOIN tenant_roles tr ON td.tenant_role_id = tr.tenant_role_id
WHERE td.tenant_id = '{생성된_테넌트_ID}'
  AND (td.is_deleted IS NULL OR td.is_deleted = FALSE)
ORDER BY td.display_order, td.created_at;
```

### 관리자 역할 할당 확인
```sql
SELECT 
    ura.assignment_id,
    ura.user_id,
    ura.tenant_id,
    ura.tenant_role_id,
    tr.name_ko as role_name,
    u.email,
    u.name as user_name,
    ura.is_active,
    ura.assigned_by,
    ura.created_at,
    DATE_FORMAT(ura.created_at, '%Y-%m-%d %H:%i:%s') as created_at_kst
FROM user_role_assignments ura
LEFT JOIN tenant_roles tr ON ura.tenant_role_id = tr.tenant_role_id
LEFT JOIN users u ON ura.user_id = u.user_id
WHERE ura.tenant_id = '{생성된_테넌트_ID}'
  AND u.email = '{요청자_이메일}'
  AND (ura.is_deleted IS NULL OR ura.is_deleted = FALSE)
ORDER BY ura.created_at;
```

---

## 📝 테스트 결과 기록

### 테스트 일시
- **시작 시간**: (기록)
- **종료 시간**: (기록)

### 테스트한 온보딩 요청
- **요청자 이메일**: (기록)
- **테넌트명**: (기록)
- **지역**: (기록)
- **브랜드명**: (기록)
- **업종**: (기록)

### 생성된 테넌트
- **테넌트 ID**: (기록)
- **생성 시간**: (기록)

### 생성된 대시보드
1. (역할명) 대시보드 - dashboard_id: (기록)
2. (역할명) 대시보드 - dashboard_id: (기록)
3. (역할명) 대시보드 - dashboard_id: (기록)
4. (역할명) 대시보드 - dashboard_id: (기록)
5. (역할명) 대시보드 - dashboard_id: (기록) - ACADEMY인 경우

### 발견된 문제
- (문제 내용 기록)

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-10

