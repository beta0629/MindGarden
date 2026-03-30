# 개발서버 테스트 계획

**작성일**: 2025-12-11  
**테스트 환경**: 개발 서버 (beta0629.cafe24.com)  
**상태**: 준비 완료

---

## 🔧 개발서버 접속 정보

### 서버 정보
- **서버 주소**: `beta0629.cafe24.com`
- **SSH 접속**: `ssh root@beta0629.cafe24.com`
- **데이터베이스**: `beta0629.cafe24.com:3306/core_solution`
- **DB 계정**: `mindgarden_dev` / `MindGardenDev2025!@#`

### 서비스 정보
- **CoreSolution 백엔드**: `https://dev.core-solution.co.kr/api/v1/`
- **Ops Portal 백엔드**: `https://ops.dev.e-trinity.co.kr/api/v1/`
- **Ops Portal 프론트엔드**: `https://ops.dev.e-trinity.co.kr/`
- **Trinity 프론트엔드**: `https://trinity.dev.e-trinity.co.kr/`
- **온보딩 프론트엔드**: `https://trinity.dev.e-trinity.co.kr/onboarding`

---

## 📋 테스트 계획

### 1. 백엔드 배포 워크플로우 검증

#### 1.1 GitHub Actions 배포 상태 확인
- [ ] 최근 배포 이력 확인
  - [ ] `.github/workflows/deploy-backend-dev.yml` 실행 상태 확인
  - [ ] 포트 종료 로직 정상 동작 확인
  - [ ] Java 프로세스 정리 로직 정상 동작 확인
  - [ ] 에러 처리 정상 동작 확인
- [ ] 배포 로그 확인
  - [ ] 배포 성공 여부 확인
  - [ ] 오류 발생 시 로그 확인

#### 1.2 서버 상태 확인
- [ ] CoreSolution 백엔드 서비스 상태 확인
  ```bash
  ssh root@beta0629.cafe24.com
  sudo systemctl status mindgarden-dev.service
  ```
- [ ] 포트 8080 사용 상태 확인
  ```bash
  sudo lsof -i:8080
  ```
- [ ] Java 프로세스 확인
  ```bash
  ps aux | grep java
  ```

#### 1.3 API 헬스 체크
- [ ] CoreSolution 백엔드 헬스 체크
  ```bash
  curl -f https://dev.core-solution.co.kr/api/v1/actuator/health
  ```
- [ ] Ops Portal 백엔드 헬스 체크
  ```bash
  curl -f https://ops.dev.e-trinity.co.kr/api/v1/actuator/health
  ```

---

### 2. 온보딩 플로우 전체 테스트

#### 2.1 온보딩 요청 생성 테스트
- [ ] **Step 1: 기본 정보 입력**
  - [ ] 온보딩 페이지 접속: `https://trinity.dev.e-trinity.co.kr/onboarding`
  - [ ] 이메일 도메인 자동완성 동작 확인
  - [ ] 이메일 인증 프로세스 확인
  - [ ] 지역 선택 및 저장 확인 (`regionCode` → `region` 필드)
  - [ ] 브랜드명 입력 및 저장 확인 (`brandName` → `brand_name` 필드)
- [ ] **Step 2: 업종 선택**
  - [ ] 메인 카테고리 선택 확인
  - [ ] 세부 업종 선택 (있는 경우)
  - [ ] 세부 업종 없이 진행 가능 확인
- [ ] **Step 3: 요금제 선택**
  - [ ] 요금제 카드 중앙 정렬 확인
  - [ ] 반응형 레이아웃 확인
- [ ] **Step 4: 결제 정보 입력**
- [ ] **Step 5: 완료 화면**
- [ ] **데이터베이스 저장 확인**
  ```sql
  SELECT id, email, region, brand_name, checklist_json, status, created_at
  FROM onboarding_request
  ORDER BY created_at DESC
  LIMIT 1;
  ```
  - [ ] `onboarding_request.region` 필드 확인
  - [ ] `onboarding_request.brand_name` 필드 확인
  - [ ] `onboarding_request.checklist_json`에 `regionCode`, `brandName` 포함 확인

#### 2.2 온보딩 승인 프로세스 테스트
- [ ] **Ops Portal 접속**
  - [ ] `https://ops.dev.e-trinity.co.kr/` 접속
  - [ ] 로그인 (관리자 계정)
- [ ] **온보딩 요청 조회**
  - [ ] 대기 중 목록 확인
  - [ ] 활성 온보딩 목록 확인
  - [ ] 보류 온보딩 목록 확인
- [ ] **온보딩 요청 상세 조회**
  - [ ] 카드 UI 표시 확인
  - [ ] 상태 드롭다운 한글 표시 확인
- [ ] **결정 저장 테스트**
  - [ ] **승인 결정 저장**
    - [ ] 테넌트 ID 자동 생성 확인 (`tenant-{지역코드}-{업종코드}-{순번}`)
    - [ ] 관리자 계정 자동 생성 확인
    - [ ] 기본 역할 자동 생성 확인 (원장, 상담사, 내담자, 사무원)
    - [ ] 브랜딩 정보 설정 확인 (`tenants.branding_json`)
  - [ ] **거부 결정 저장**
  - [ ] **보류 결정 저장**
- [ ] **토스트 알림 확인**
  - [ ] 성공 알림 표시 확인
  - [ ] 에러 알림 표시 확인

---

### 3. Ops Portal 기능 테스트

#### 3.1 대시보드 테스트
- [ ] **대시보드 메트릭 확인**
  - [ ] 온보딩 대기 카운트 확인
  - [ ] 활성 온보딩 카운트 확인
  - [ ] 보류 온보딩 카운트 확인
- [ ] **카드 클릭 시 필터링 동작 확인**
  - [ ] 대기 중 카드 클릭 → 대기 중 목록 필터링 확인
  - [ ] 활성 카드 클릭 → 활성 목록 필터링 확인
  - [ ] 보류 카드 클릭 → 보류 목록 필터링 확인

#### 3.2 온보딩 관리 테스트
- [ ] **온보딩 요청 목록 조회**
  - [ ] 카드 UI 표시 확인
  - [ ] 반응형 레이아웃 확인 (모바일/태블릿/데스크탑)
- [ ] **온보딩 요청 상세 조회**
  - [ ] "보기" 버튼 클릭 시 상세 페이지 이동 확인
- [ ] **상태 필터링 테스트**
  - [ ] 상태별 필터링 동작 확인
  - [ ] 공통코드 기반 한글 상태 표시 확인

#### 3.3 공통 알림 시스템 테스트
- [ ] **결정 저장 성공 시 토스트 알림 확인**
- [ ] **결정 저장 실패 시 토스트 알림 확인**
- [ ] **로그인 실패 시 토스트 알림 확인**

#### 3.4 API 호출 테스트
- [ ] **모든 API 호출이 표준화된 경로 사용 확인**
  - [ ] 브라우저 개발자 도구 Network 탭 확인
  - [ ] API 경로가 상수로 정의된 경로인지 확인
- [ ] **공통코드 API 호출 확인**
  - [ ] CoreSolution 백엔드 공통코드 API 호출 확인
  - [ ] 한글 상태 표시 정상 동작 확인
- [ ] **CORS 설정 확인**
  - [ ] CORS 오류 발생 여부 확인

---

### 4. 프로시저 검증 테스트

#### 4.1 CreateOrActivateTenant 프로시저 테스트
- [ ] **새 테넌트 생성 테스트**
  ```sql
  CALL CreateOrActivateTenant(
    'tenant-test-consultation-001',
    '테스트 상담센터',
    'CONSULTATION',
    'test@example.com',
    '$2a$12$...', -- BCrypt 해시
    'ops_core',
    @p_success,
    @p_message
  );
  SELECT @p_success, @p_message;
  ```
  - [ ] 테넌트 생성 확인
  - [ ] 관리자 계정 생성 확인
  - [ ] 기본 역할 생성 확인 (원장, 상담사, 내담자, 사무원)
  - [ ] 브랜딩 정보 설정 확인
- [ ] **기존 테넌트 활성화 테스트**
  - [ ] 기존 테넌트 활성화 확인
  - [ ] 관리자 계정 생성 확인 (없는 경우)
- [ ] **에러 처리 테스트**
  - [ ] 중복 테넌트 ID 처리 확인
  - [ ] 필수 파라미터 누락 시 에러 처리 확인

#### 4.2 데이터베이스 검증
- [ ] **테넌트 정보 확인**
  ```sql
  SELECT tenant_id, tenant_name, business_type, status, branding_json
  FROM tenants
  WHERE tenant_id = 'tenant-test-consultation-001';
  ```
- [ ] **관리자 계정 확인**
  ```sql
  SELECT u.id, u.user_id, u.email, u.name, u.tenant_id, u.is_active
  FROM users u
  WHERE u.email = 'test@example.com';
  ```
- [ ] **역할 할당 확인**
  ```sql
  SELECT ura.user_id, ura.role, tr.role_name, tr.role_name_en
  FROM user_role_assignments ura
  JOIN tenant_roles tr ON ura.role = tr.tenant_role_id
  WHERE ura.user_id = (SELECT id FROM users WHERE email = 'test@example.com');
  ```

---

### 5. 통합 테스트

#### 5.1 전체 플로우 테스트
- [ ] **온보딩 신청 → 승인 → 테넌트 생성 → 관리자 계정 생성 → 로그인**
  1. [ ] 온보딩 신청 완료
  2. [ ] Ops Portal에서 승인 결정 저장
  3. [ ] 테넌트 생성 확인
  4. [ ] 관리자 계정 생성 확인
  5. [ ] CoreSolution 로그인 테스트
     - [ ] `https://dev.core-solution.co.kr/` 접속
     - [ ] 온보딩에서 입력한 이메일/비밀번호로 로그인
     - [ ] 로그인 성공 확인
     - [ ] 대시보드 접근 확인

#### 5.2 크로스 브라우저 테스트
- [ ] **Chrome 테스트**
- [ ] **Safari 테스트**
- [ ] **Firefox 테스트**
- [ ] **Edge 테스트**

#### 5.3 반응형 디자인 테스트
- [ ] **모바일 (320px ~ 768px) 테스트**
- [ ] **태블릿 (768px ~ 1024px) 테스트**
- [ ] **데스크탑 (1024px 이상) 테스트**

---

## 🔍 테스트 실행 가이드

### 1. 서버 접속
```bash
ssh root@beta0629.cafe24.com
```

### 2. 서비스 상태 확인
```bash
# CoreSolution 백엔드 상태 확인
sudo systemctl status mindgarden-dev.service

# 포트 사용 확인
sudo lsof -i:8080

# Java 프로세스 확인
ps aux | grep java
```

### 3. 로그 확인
```bash
# CoreSolution 백엔드 로그
sudo journalctl -u mindgarden-dev.service -f

# 또는 로그 파일 확인
tail -f /var/log/mindgarden-dev.log
```

### 4. 데이터베이스 접속
```bash
mysql -h beta0629.cafe24.com -u mindgarden_dev -p'MindGardenDev2025!@#' core_solution
```

### 5. API 테스트
```bash
# 헬스 체크
curl -f https://dev.core-solution.co.kr/api/v1/actuator/health

# 공통코드 조회
curl -f https://dev.core-solution.co.kr/api/v1/common-codes?codeGroup=ONBOARDING_STATUS
```

---

## 📊 테스트 결과 기록

### 테스트 실행 일시
- **시작 시간**: 
- **종료 시간**: 
- **테스트 환경**: 개발 서버 (beta0629.cafe24.com)

### 테스트 결과 요약
- **총 테스트 항목**: 
- **성공**: 
- **실패**: 
- **건너뜀**: 

### 발견된 이슈
1. 
2. 
3. 

### 개선 사항
1. 
2. 
3. 

---

## 📝 다음 작업

1. **즉시**: 테스트 실행 및 결과 기록
2. **단기**: 발견된 이슈 수정
3. **중기**: 테스트 자동화 구축
4. **장기**: 프로덕션 배포 준비

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-11

