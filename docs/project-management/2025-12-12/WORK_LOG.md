# 작업 로그

**작성일**: 2025-12-12  
**이관일**: 2025-12-11

---

## 📋 오늘의 작업 계획 (12월 12일)

### 문서 관리
- [x] 12월 12일 날짜 폴더 생성
- [x] TODO 리스트 생성 (12월 11일 이어서)
- [x] 체크리스트 생성 (12월 11일 이어서)
- [x] 워크로그 생성
- [x] 어제(12월 11일) 작업 내용 상세 업데이트
- [x] 미완료 항목 오늘(12월 12일)로 이관

### 서브도메인 기능 구현 (오늘 완료)
- [x] 서브도메인 중복 체크 API 구현
- [x] 서브도메인 유효성 검증 로직 추가
- [x] 프론트엔드 서브도메인 입력 필드 추가
- [x] 프론트엔드 실시간 중복 체크 구현
- [x] 도메인 미리보기 기능 추가

---

## ✅ 2025-12-11 완료된 작업 (상세)

### 1. 서브도메인 필드 추가

#### 1.1 데이터베이스 마이그레이션
- [x] **Tenant 테이블에 subdomain 필드 추가**
  - 마이그레이션: `V65__add_subdomain_to_tenants.sql`
  - 필드: `subdomain VARCHAR(100) NULL`
  - 인덱스: `idx_subdomain` 추가
- [x] **OnboardingRequest 테이블에 subdomain 필드 추가**
  - 마이그레이션: `V66__add_subdomain_to_onboarding_request.sql`
  - 필드: `subdomain VARCHAR(100) NULL`

#### 1.2 엔티티 및 DTO 업데이트
- [x] **Tenant 엔티티에 subdomain 필드 추가**
  - `@Column(name = "subdomain", length = 100)`
  - `@Size(max = 100, message = "서브도메인은 100자 이하여야 합니다")`
- [x] **OnboardingRequest 엔티티에 subdomain 필드 추가**
  - `@Column(name = "subdomain", length = 100)`
- [x] **OnboardingCreateRequest DTO에 subdomain 필드 추가**
  - `String subdomain` (선택적)

#### 1.3 비즈니스 로직 업데이트
- [x] **온보딩 요청 생성 시 subdomain 저장**
  - `OnboardingServiceImpl.create()` 메서드에 subdomain 파라미터 추가
  - `OnboardingRequest` 엔티티에 subdomain 저장
- [x] **테넌트 생성 후 subdomain 업데이트**
  - `OnboardingServiceImpl.decideInternal()` 메서드에서 승인 시 subdomain 업데이트
  - `Tenant.settings_json`에 `subdomain` 및 `domain` 저장
- [x] **OnboardingController에서 subdomain 처리**
  - `OnboardingController.create()` 메서드에서 subdomain 추출
  - `checklistJson`에 subdomain 포함

---

## ✅ 2025-12-12 완료된 작업 (상세)

### 1. 서브도메인 중복 체크 API 구현

#### 1.1 Repository 메서드 추가
- [x] **TenantRepository에 서브도메인 조회 메서드 추가**
  - `existsBySubdomain(String subdomain)`: 서브도메인 존재 여부 확인
  - `findBySubdomainIgnoreCase(String subdomain)`: 서브도메인으로 테넌트 조회
- [x] **OnboardingRequestRepository에 서브도메인 조회 메서드 추가**
  - `existsBySubdomainAndPendingStatus(String subdomain)`: 대기 중인 온보딩 요청의 서브도메인 중복 확인

#### 1.2 Service 계층 구현
- [x] **OnboardingService에 서브도메인 중복 체크 메서드 추가**
  - `checkSubdomainDuplicate(String subdomain)`: 서브도메인 중복 확인
  - `SubdomainCheckResult` record 추가 (isDuplicate, available, message, isValid)
- [x] **OnboardingServiceImpl에 서브도메인 중복 체크 로직 구현**
  - 유효성 검증:
    - 빈 값 체크
    - 길이 제한 (최대 63자)
    - 형식 검증 (영문, 숫자, 하이픈만 허용)
    - 하이픈으로 시작/끝나는지 체크
  - 예약어 체크: dev, app, api, staging, www, admin, ops, apply
  - 테넌트 테이블 중복 확인
  - 온보딩 요청 테이블 중복 확인 (PENDING, IN_REVIEW, ON_HOLD 상태만)

#### 1.3 Controller 엔드포인트 추가
- [x] **OnboardingController에 `/api/v1/onboarding/subdomain-check` 엔드포인트 추가**
  - `GET /api/v1/onboarding/subdomain-check?subdomain={subdomain}`
  - 응답: `{ subdomain, isDuplicate, available, isValid, message, previewDomain }`
  - `previewDomain`: 사용 가능한 경우 `{subdomain}.dev.core-solution.co.kr` 반환

### 2. 프론트엔드 서브도메인 입력 필드 추가

#### 2.1 API 함수 추가
- [x] **`frontend-trinity/utils/api.ts`에 `checkSubdomainDuplicate` 함수 추가**
  - `GET /api/v1/onboarding/subdomain-check` 호출
  - 응답 타입 정의

#### 2.2 인터페이스 및 타입 업데이트
- [x] **`OnboardingCreateRequest` 인터페이스에 `subdomain` 필드 추가**
- [x] **`OnboardingFormData` 인터페이스에 `subdomain` 필드 추가**

#### 2.3 훅 업데이트
- [x] **`useOnboarding` 훅에 서브도메인 관련 상태 추가**
  - `subdomainDuplicateChecked`: 중복 확인 완료 여부
  - `subdomainDuplicateChecking`: 중복 확인 진행 중 여부
  - `subdomainDuplicateError`: 중복 확인 에러 메시지
  - `subdomainPreview`: 미리보기 도메인
- [x] **`handleCheckSubdomainDuplicate` 함수 구현**
  - 서브도메인 중복 체크 API 호출
  - 결과에 따라 상태 업데이트
- [x] **`handleSubmit` 함수에 subdomain 포함**
  - `OnboardingCreateRequest`에 subdomain 추가
  - `checklistJson`에 subdomain 포함

#### 2.4 컴포넌트 업데이트
- [x] **`Step1BasicInfoProgressive` 컴포넌트에 서브도메인 입력 필드 추가**
  - 입력 필드: 자동 소문자 변환 및 특수문자 제거
  - 중복 확인 버튼: 클릭 시 중복 체크 API 호출
  - 에러 메시지 표시: 중복이거나 유효하지 않은 경우
  - 도메인 미리보기: 사용 가능한 경우 `{subdomain}.dev.core-solution.co.kr` 표시
- [x] **`onboarding/page.tsx`에서 서브도메인 관련 props 전달**
  - `subdomainDuplicateChecked`, `subdomainDuplicateChecking`, `subdomainDuplicateError`, `subdomainPreview`
  - `setSubdomainDuplicateChecked`, `setSubdomainDuplicateError`, `setSubdomainPreview`
  - `checkSubdomainDuplicate`

---

## 📋 오늘(12월 12일) 테스트 계획 (이관)

### 1. 서브도메인 기능 테스트
- [ ] 서브도메인 중복 체크 API 테스트
  - [ ] 유효한 서브도메인 중복 체크
  - [ ] 중복된 서브도메인 체크
  - [ ] 유효하지 않은 서브도메인 체크 (형식 오류)
  - [ ] 예약어 체크
- [ ] 프론트엔드 서브도메인 입력 필드 테스트
  - [ ] 입력 시 자동 소문자 변환 확인
  - [ ] 특수문자 자동 제거 확인
  - [ ] 중복 확인 버튼 동작 확인
  - [ ] 에러 메시지 표시 확인
  - [ ] 도메인 미리보기 표시 확인
- [ ] 온보딩 플로우에서 서브도메인 저장 테스트
  - [ ] 서브도메인 입력 후 온보딩 요청 생성
  - [ ] 데이터베이스에 subdomain 저장 확인
  - [ ] 온보딩 승인 후 tenants 테이블에 subdomain 저장 확인
  - [ ] tenants.settings_json에 subdomain, domain 저장 확인

### 2. 백엔드 배포 워크플로우 테스트 (12월 11일 이관)
- [ ] GitHub Actions 배포 테스트
  - [ ] 포트 종료 로직 정상 동작 확인
  - [ ] Java 프로세스 정리 로직 정상 동작 확인
  - [ ] 에러 처리 정상 동작 확인
  - [ ] 배포 성공 확인

### 3. 온보딩 플로우 전체 테스트 (12월 11일 이관)
- [ ] 온보딩 요청 생성 테스트
  - [ ] Step 1: 기본 정보 입력
  - [ ] Step 2: 업종 선택
  - [ ] Step 3: 요금제 선택
  - [ ] Step 4: 결제 정보 입력
  - [ ] Step 5: 완료 화면
- [ ] 온보딩 승인 프로세스 테스트
  - [ ] Ops Portal에서 온보딩 요청 조회
  - [ ] 결정 저장 테스트 (승인/거부/보류)
  - [ ] 토스트 알림 확인

### 4. Ops Portal 기능 테스트 (12월 11일 이관)
- [ ] 대시보드 테스트
- [ ] 온보딩 관리 테스트
- [ ] 공통 알림 시스템 테스트

### 5. 프로시저 검증 테스트 (12월 11일 이관)
- [ ] CreateOrActivateTenant 프로시저 테스트
  - [ ] 새 테넌트 생성 테스트
  - [ ] 기존 테넌트 활성화 테스트
  - [ ] 에러 처리 테스트

### 6. 통합 테스트 (12월 11일 이관)
- [ ] 전체 플로우 테스트
  - [ ] 온보딩 신청 → 승인 → 테넌트 생성 → 관리자 계정 생성 → 로그인
  - [ ] 서브도메인 설정 및 와일드카드 도메인 접근 테스트
- [ ] 크로스 브라우저 테스트
- [ ] 반응형 디자인 테스트

---

## 📊 진행 상황

### 문서 관리
- **완료**: 5개 항목
- **진행 중**: 0개 항목
- **대기 중**: 0개 항목

### 서브도메인 기능 구현
- **완료**: 5개 주요 작업
  - 서브도메인 중복 체크 API: 5개 항목
  - 서브도메인 유효성 검증: 4개 항목
  - 프론트엔드 구현: 5개 항목
  - 실시간 중복 체크: 3개 항목
  - 도메인 미리보기: 2개 항목

### 2025-12-11 작업
- **완료**: 2개 주요 작업
  - 서브도메인 필드 추가: 8개 항목
  - 문서 관리: 4개 항목

### 오늘(12월 12일) 테스트 계획
- **계획**: 6개 테스트 카테고리
- **완료**: 0개 항목
- **진행 중**: 0개 항목

---

## 📝 다음 작업

1. **즉시**: 서브도메인 기능 테스트 진행
2. **단기**: 온보딩 및 Ops Portal 테스트 진행
3. **중기**: 백엔드 배포 워크플로우 테스트
4. **장기**: 전체 표준화 완료 및 배포 준비

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-12

