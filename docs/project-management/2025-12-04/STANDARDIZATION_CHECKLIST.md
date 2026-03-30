# 시스템 표준화 실행 체크리스트

**작성일**: 2025-12-04  
**버전**: 1.0.0  
**상태**: 실행 중

---

## 📌 개요

시스템 표준화 작업의 상세 체크리스트입니다.  
각 Phase별로 작업 항목을 나열하고, 완료 여부를 체크합니다.

### 참조 문서
- [시스템 표준화 실행 계획](./SYSTEM_STANDARDIZATION_PLAN.md)
- [시스템 표준화 우선순위 계획](./SYSTEM_STANDARDIZATION_PRIORITY_PLAN.md)
- [표준 문서 목록](../../standards/README.md)

---

## 🔴 Phase 1: 보안 및 핵심 아키텍처 (2주)

### 1.1 보안 표준 적용 (3일)

#### Day 1: 환경 변수 보안 검토
- [ ] `.gitignore` 파일 확인
  - [ ] `.env` 파일 제외 확인
  - [ ] `.env.local` 파일 제외 확인
  - [ ] `.env.production` 파일 제외 확인
  - [ ] `application-prod.yml` 파일 제외 확인
- [ ] 환경 변수 문서화 확인
  - [ ] `.env.example` 파일 존재 확인
  - [ ] 환경 변수 목록 문서화 확인
- [ ] 민감한 정보 하드코딩 검사
  - [ ] 비밀번호 하드코딩 검사 (0개)
  - [ ] API 키 하드코딩 검사 (0개)
  - [ ] JWT 시크릿 하드코딩 검사 (0개)

#### Day 2: 암호화 표준 적용 검증
- [ ] 개인정보 암호화 검증
  - [ ] `PersonalDataEncryptionUtil` 사용 확인
  - [ ] 암호화 대상 필드 확인 (이름, 전화번호, 생년월일 등)
  - [ ] 복호화 로직 검증
- [ ] 암호화 키 관리 검증
  - [ ] 키 로테이션 전략 확인
  - [ ] 키 저장소 보안 확인

#### Day 3: 보안 감사 로그 검증
- [ ] 보안 이벤트 로깅 확인
  - [ ] 로그인/로그아웃 기록
  - [ ] 권한 변경 기록
  - [ ] 민감 데이터 접근 기록
- [ ] 로그 레벨 검증
  - [ ] 보안 이벤트 로그 레벨 확인
  - [ ] 로그 파일 보안 확인

**완료 기준**:
- ✅ 환경 변수 보안 100% 준수
- ✅ 암호화 표준 100% 적용
- ✅ 보안 감사 로그 정상 동작

---

### 1.2 브랜치 코드 완전 제거 (5일)

#### Day 1: TenantContextFilter 브랜치 로직 제거
- [ ] `TenantContextFilter.extractBranchId()` 메서드 제거
- [ ] 세션에서 `branchCode` 추출 로직 제거
- [ ] HTTP 헤더에서 `X-Branch-Id` 추출 로직 제거
- [ ] 테스트 실행 및 검증

#### Day 2: Repository 쿼리에서 브랜치 필터링 제거
- [ ] `UserRepository` 브랜치 필터링 제거
- [ ] `ConsultantRepository` 브랜치 필터링 제거
- [ ] 기타 Repository 브랜치 필터링 제거
- [ ] 모든 쿼리에 `tenant_id` 조건 추가 확인
- [ ] 테스트 실행 및 검증

**발견된 파일 목록** (20개):
- [ ] `AdminServiceImpl.java`
- [ ] `AuthController.java`
- [ ] `ConsultationMenuController.java`
- [ ] `SocialAuthServiceImpl.java`
- [ ] `AuthServiceImpl.java`
- [ ] `AdminController.java`
- [ ] `SalaryManagementServiceImpl.java`
- [ ] `ConsultantSalaryProfileRepository.java`
- [ ] `Item.java` (Entity)
- [ ] `DiscountAccountingTransaction.java` (Entity)
- [ ] `Account.java` (Entity)
- [ ] `DailyStatistics.java` (Entity)
- [ ] `UserServiceImpl.java`
- [ ] `UserRepository.java`
- [ ] `CourseServiceImpl.java`
- [ ] `ClassServiceImpl.java`
- [ ] `UserRoleAssignmentServiceImpl.java`
- [ ] `BaseTenantServiceImpl.java`
- [ ] `BaseTenantEntityServiceImpl.java`
- [ ] `ClassScheduleServiceImpl.java`

#### Day 3: Entity에서 브랜치 필드 검토 - 완료 ✅
- [x] Entity 클래스에서 `branchCode`, `branchId` 필드 확인 완료 (13개 Entity)
- [x] 레거시 호환성을 위한 NULL 허용 유지 확인 완료
- [x] 새로운 코드에서 사용 금지 주석 추가 완료
- [x] 주석으로 레거시 호환 표시 완료

#### Day 4: Frontend 브랜치 코드 제거
- [ ] `SessionContext.js` 브랜치 세션 제거
- [ ] `HQDashboard.js` 브랜치 관련 로직 제거
- [ ] `DashboardFormModal.js` 브랜치 참조 제거
- [ ] 기타 Frontend 파일 브랜치 코드 제거

**발견된 파일 목록** (10개):
- [ ] `App.js`
- [ ] `DashboardFormModal.js`
- [ ] `HQDashboard.js`
- [ ] `IntegratedFinanceDashboard.js`
- [ ] `ConsultantComprehensiveManagement.js`
- [ ] `SessionContext.js`
- [ ] `PerformanceMetricsModal.js` (백업 파일들 제외)

#### Day 5: 통합 테스트 및 검증
- [ ] 코드베이스 전체 검색: `branchCode` (0개 결과)
- [ ] 코드베이스 전체 검색: `branchId` (0개 결과)
- [ ] 코드베이스 전체 검색: `branch_code` (0개 결과)
- [ ] 코드베이스 전체 검색: `branch_id` (0개 결과)
- [ ] 통합 테스트 실행
- [ ] 기능 테스트 실행

**완료 기준**:
- ✅ 브랜치 코드 사용: 30개 → 0개
- ✅ 모든 기능 정상 동작
- ✅ 테넌트 시스템만 사용

---

### 1.3 테넌트 격리 검증 (2일)

#### Day 1: 모든 SELECT 쿼리 검증
- [ ] 모든 SELECT 쿼리에 `tenant_id` 조건 확인
- [ ] 테넌트 구분 없이 조회하는 쿼리 수정
- [ ] Repository 메서드에 `tenant_id` 파라미터 추가 (필요 시)
- [ ] 테넌트 컨텍스트에서 자동 주입 확인

#### Day 2: 모든 INSERT/UPDATE 검증
- [ ] 모든 INSERT에 `tenant_id` 포함 확인
- [ ] 모든 UPDATE에 `tenant_id` 조건 확인
- [ ] 테넌트 컨텍스트에서 자동 주입 확인
- [ ] 인덱스에 `tenant_id` 포함 확인
- [ ] 복합 인덱스 최적화

#### 테넌트 격리 테스트
- [ ] 테넌트 A의 데이터를 테넌트 B에서 조회 불가 확인
- [ ] 테넌트 A의 데이터를 테넌트 B에서 수정 불가 확인
- [ ] 테넌트 A의 데이터를 테넌트 B에서 삭제 불가 확인

**완료 기준**:
- ✅ 테넌트 격리 100% 준수
- ✅ 테넌트 간 데이터 접근 차단 확인

---

## 🔴 Phase 2: API 및 에러 처리 표준화 (2주)

### 2.1 API 경로 표준화 (5일)

#### Day 1-2: 핵심 컨트롤러 변경 (5개)

**우선순위 컨트롤러**:
- [ ] `AuthController`: `/api/auth` → `/api/v1/auth` (레거시 경로 유지)
- [ ] `AdminController`: `/api/admin` → `/api/v1/admin`
- [ ] `ConsultationMessageController`: `/api/consultation-messages` → `/api/v1/consultation-messages`
- [ ] `OAuth2ConfigController`: `/api/auth/config/oauth2` → `/api/v1/auth/config/oauth2`
- [ ] `CssThemeController`: `/api/admin/css-themes` → `/api/v1/admin/css-themes`

**작업 항목**:
- [ ] 컨트롤러 경로 변경
- [ ] 레거시 경로 매핑 추가 (`@Deprecated`)
- [ ] 프론트엔드 API 호출 업데이트
- [ ] API 문서화 업데이트
- [ ] 통합 테스트 업데이트

#### Day 3-4: 나머지 컨트롤러 변경 (10개)
- [ ] `ConsultationMenuController`
- [ ] `SchedulerMonitoringController`
- [ ] `AIMonitoringController`
- [ ] `SystemMetricsController`
- [ ] `SecurityAuditController`
- [ ] `SecurityConfig` (필터 경로)
- [ ] `OpenApiConfig` (문서화 경로)
- [ ] `DynamicPermissionServiceImpl`
- [ ] `PermissionManagementController`
- [ ] 기타 컨트롤러

#### Day 5: 프론트엔드 API 호출 업데이트
- [ ] `apiEndpoints.js` 상수 업데이트
- [ ] 모든 API 호출 경로 업데이트
- [ ] 레거시 경로 사용 제거

**완료 기준**:
- ✅ API 경로 표준 준수율 100%
- ✅ 레거시 경로 하위 호환성 유지

---

### 2.2 에러 처리 표준화 (3일)

#### Day 1: Controller try-catch 제거
- [ ] Controller에서 try-catch 블록 검색
- [ ] try-catch 블록 제거
- [ ] GlobalExceptionHandler에 위임

#### Day 2: 커스텀 예외 클래스 추가/보완
- [ ] `EntityNotFoundException` 확인/보완
- [ ] `ValidationException` 확인/보완
- [ ] `BusinessException` 추가 (필요 시)
- [ ] `UnauthorizedException` 추가 (필요 시)
- [ ] `ForbiddenException` 추가 (필요 시)

#### Day 3: GlobalExceptionHandler 보완
- [ ] 모든 커스텀 예외 처리 추가
- [ ] ErrorResponse 형식 통일
- [ ] HTTP 상태 코드 매핑 확인
- [ ] 에러 응답 테스트

**완료 기준**:
- ✅ 에러 처리 표준 준수율 100%
- ✅ 일관된 에러 응답 형식

---

### 2.3 API 응답 형식 통일 (2일)

#### Day 1: ApiResponse 사용 확인
- [ ] 모든 API가 `ApiResponse` 사용 확인
- [ ] 비표준 응답 형식 수정
- [ ] 페이징 응답 표준화

#### Day 2: 에러 응답 형식 통일
- [ ] 모든 에러 응답이 `ErrorResponse` 사용 확인
- [ ] 에러 코드 체계 통일
- [ ] 에러 메시지 표준화

**완료 기준**:
- ✅ API 응답 형식 통일 100%

---

## 🟡 Phase 3: 하드코딩 제거 및 동적화 (3주)

### 3.1 역할 이름 하드코딩 제거 (3일)

#### Day 1: Backend 역할 문자열 제거
**발견된 파일** (5+ 파일):
- [ ] `ConsultationMessageController.java` (Line 124)
- [ ] `AdminController.java` (Line 403)
- [ ] `BranchManagementController.java` (Line 147-148)
- [ ] `SystemConfigController.java` (Line 47-53)
- [ ] `BranchServiceImpl.java` (Line 405-407)

**작업 내용**:
- [ ] 역할 문자열 → 공통코드 조회로 변경
- [ ] 역할 체크 → 권한 시스템 활용
- [ ] enum 사용 (가능한 경우)

#### Day 2: Frontend 역할 문자열 제거
**발견된 파일** (14 파일):
- [ ] 역할 문자열 하드코딩 파일 검색
- [ ] 공통코드 조회로 변경
- [ ] 권한 시스템 활용

#### Day 3: 공통코드 조회 로직 적용
- [ ] 역할 코드 그룹 확인
- [ ] 공통코드 조회 로직 적용
- [ ] 캐싱 전략 적용

**완료 기준**:
- ✅ 역할 이름 하드코딩 0개
- ✅ 모든 역할이 공통코드로 조회

---

### 3.2 색상 하드코딩 제거 (5일)

#### Day 1-2: CSS 파일 색상 정리
- [ ] `css-variables.js` 색상 정리
- [ ] `cssConstants.js` 색상 정리
- [ ] CSS 파일에서 하드코딩된 색상 검색
- [ ] CSS 변수로 전환

**발견된 파일** (50+ 파일):
- [ ] CSS 변수 파일들 정리
- [ ] 디자인 시스템 CSS 변수 사용

#### Day 3-4: JavaScript 파일 인라인 스타일 제거
- [ ] 인라인 스타일 검색
- [ ] CSS 클래스로 전환
- [ ] CSS 변수 사용

#### Day 5: CSS 변수 시스템 적용
- [ ] 디자인 시스템 CSS 변수 사용
- [ ] 테마 시스템 적용
- [ ] 일관성 검증

**완료 기준**:
- ✅ 색상 하드코딩 0개
- ✅ 모든 색상이 CSS 변수 사용

---

### 3.3 상태값 공통코드 전환 (5일) ⭐⭐⭐⭐⭐

**목표**: 모든 상태값을 공통코드에서 동적으로 조회하도록 전환

**핵심 원칙**: [공통코드 시스템 표준](../../standards/COMMON_CODE_SYSTEM_STANDARD.md)에 따라 **모든 코드값은 공통코드에서 조회** 필수

**발견된 위치**: 
- Backend: `AdminController.java`, `ConsultationServiceImpl.java`, `TestDataController.java`
- Frontend: `UnifiedScheduleComponent.js`, `ScheduleDetailModal.js`

#### Day 1: 공통코드 데이터 확인 및 추가
- [ ] `SCHEDULE_STATUS` 공통코드 확인/추가
  - [ ] `AVAILABLE`, `BOOKED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` 등
- [ ] `MAPPING_STATUS` 공통코드 확인/추가
  - [ ] `ACTIVE`, `PENDING`, `APPROVED`, `REJECTED` 등
- [ ] `CONSULTATION_STATUS` 공통코드 확인
  - [ ] `REQUESTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` 등
- [ ] `PAYMENT_STATUS` 공통코드 확인
  - [ ] `PENDING`, `CONFIRMED`, `FAILED`, `REFUNDED` 등
- [ ] `USER_STATUS` 공통코드 확인
  - [ ] `ACTIVE`, `INACTIVE`, `SUSPENDED`, `TERMINATED` 등
- [ ] 마이그레이션 파일 생성 (필요 시)

#### Day 2: Backend 유틸리티 클래스 생성
- [ ] `StatusCodeHelper` 유틸리티 클래스 생성
  - [ ] `src/main/java/com/coresolution/core/util/StatusCodeHelper.java`
- [ ] 캐싱 로직 구현
  - [ ] `ConcurrentHashMap` 기반 캐싱
  - [ ] 캐시 무효화 메서드
- [ ] 편의 메서드 구현
  - [ ] `isStatus(String codeGroup, String codeValue, String status)`
  - [ ] `getStatusCodes(String codeGroup)`
  - [ ] `getStatusCodeValue(String codeGroup, String codeValue)`
  - [ ] `getStatusKoreanName(String codeGroup, String codeValue)`

#### Day 3: Backend 코드 수정
- [ ] `AdminController.java` 수정
  - [ ] `MappingStatusConstants` → `StatusCodeHelper` 사용
  - [ ] `PaymentStatus` → `StatusCodeHelper` 사용
  - [ ] `ConsultationStatus` → `StatusCodeHelper` 사용
- [ ] `ConsultationServiceImpl.java` 수정
  - [ ] `ConsultationStatus.COMPLETED` → 공통코드 조회
  - [ ] `ConsultationStatus.REQUESTED` → 공통코드 조회
- [ ] `TestDataController.java` 수정
  - [ ] `MappingStatusConstants` → `StatusCodeHelper` 사용
  - [ ] `ConsultationStatus` → `StatusCodeHelper` 사용
- [ ] 상수 클래스 사용 제거 확인

#### Day 4: Frontend 코드 수정
- [ ] `UnifiedScheduleComponent.js` 수정
  - [ ] 하드코딩된 상태 옵션 제거
  - [ ] `commonCodeApi.getCodesByGroup('SCHEDULE_STATUS')` 사용
  - [ ] 상태 비교 로직 수정
- [ ] `ScheduleDetailModal.js` 수정
  - [ ] 하드코딩된 상태 옵션 제거
  - [ ] 공통코드 API 사용
  - [ ] 상태 비교 로직 수정
- [ ] 기타 Frontend 파일 수정 (필요 시)

#### Day 5: 통합 테스트 및 검증
- [ ] 전체 시스템 테스트
  - [ ] 스케줄 상태 변경 테스트
  - [ ] 매핑 상태 변경 테스트
  - [ ] 상담 상태 변경 테스트
- [ ] 성능 테스트 (캐싱 효과)
  - [ ] 공통코드 조회 성능 확인
  - [ ] 캐시 히트율 확인
- [ ] 문서화 업데이트
  - [ ] `STATUS_COMMON_CODE_MIGRATION_PLAN.md` 업데이트
  - [ ] API 문서 업데이트

**체크리스트**:
- [ ] 필요한 공통코드 그룹 확인 및 추가
- [ ] `StatusCodeHelper` 유틸리티 클래스 생성
- [ ] Backend 상수 클래스 사용 제거
- [ ] Frontend 하드코딩 제거
- [ ] 공통코드 API 통합
- [ ] 캐싱 적용 및 성능 검증
- [ ] 전체 기능 테스트

**완료 기준**:
- ✅ 상태값 하드코딩 0개
- ✅ 상수 클래스 사용: 다수 → 0개
- ✅ 모든 상태가 공통코드로 관리
- ✅ 공통코드 기반 조회: 0개 → 100%

**참조 문서**:
- [상태값 공통코드 전환 계획](./STATUS_COMMON_CODE_MIGRATION_PLAN.md)
- [공통코드 시스템 표준](../../standards/COMMON_CODE_SYSTEM_STANDARD.md)

---

### 3.4 URL/경로 하드코딩 제거 (2일)

#### Day 1: 상수 파일로 이동
- [ ] URL/경로 하드코딩 검색
- [ ] 상수 파일로 이동
- [ ] API 엔드포인트 상수 사용

#### Day 2: 환경 변수 사용 (필요 시)
- [ ] 환경별 URL 환경 변수로 관리
- [ ] 설정 파일 확인

**완료 기준**:
- ✅ URL/경로 하드코딩 0개

---

## 🟢 Phase 4: 프론트엔드 표준화 (3주)

### 4.1 컴포넌트 템플릿 적용 (5일)

#### 페이지 컴포넌트 템플릿 적용
- [ ] 페이지 컴포넌트 목록 작성
- [ ] 템플릿 적용
- [ ] 공통 처리 자동화 (로딩, 에러, 빈 상태)

#### 리스트 컴포넌트 템플릿 적용
- [ ] 리스트 컴포넌트 목록 작성
- [ ] 템플릿 적용
- [ ] 연속 스크롤 적용

#### 폼 컴포넌트 템플릿 적용
- [ ] 폼 컴포넌트 목록 작성
- [ ] 템플릿 적용
- [ ] 유효성 검사 자동화

**완료 기준**:
- ✅ 컴포넌트 템플릿 적용률 100%

---

### 4.2 표준 컴포넌트 사용 (5일)

#### 버튼 표준화
- [ ] 비표준 버튼 검색
- [ ] 표준 버튼 컴포넌트로 전환
- [ ] 2중 클릭 방지 적용

#### 로딩바 표준화
- [ ] 하드코딩된 로딩바 검색
- [ ] UnifiedLoading으로 전환

#### 알림 표준화
- [ ] 비표준 알림 검색
- [ ] NotificationManager 사용

**완료 기준**:
- ✅ 표준 컴포넌트 사용률 100%

---

### 4.3 UI/UX 표준화 (5일)

#### 리스트 → 카드 형태 전환
- [ ] 리스트 형태 컴포넌트 검색
- [ ] 카드 형태로 전환

#### 반응형 레이아웃 적용
- [ ] 모든 페이지 반응형 확인
- [ ] 모바일/태블릿/데스크탑 대응

#### 버튼 디자인 통일
- [ ] 버튼 스타일 통일
- [ ] 호버 효과 표준화

**완료 기준**:
- ✅ UI 일관성 100%

---

## 🟢 Phase 5: 코드 품질 및 문서화 (1주)

### 5.1 코드 스타일 통일 (2일)

#### Day 1: Checkstyle 검증
- [ ] Java 코드 Checkstyle 실행
- [ ] 검증 오류 수정

#### Day 2: ESLint 검증
- [ ] JavaScript/React 코드 ESLint 실행
- [ ] 검증 오류 수정
- [ ] 자동 포맷팅 적용

**완료 기준**:
- ✅ 코드 스타일 준수율 100%

---

### 5.2 주석 및 문서화 (2일)

#### Day 1: JavaDoc 작성
- [ ] 모든 공개 클래스 JavaDoc 작성
- [ ] 모든 공개 메서드 JavaDoc 작성

#### Day 2: JSDoc 작성 및 API 문서화
- [ ] 주요 함수 JSDoc 작성
- [ ] Swagger API 문서화 완료

**완료 기준**:
- ✅ 문서화 완료율 100%

---

### 5.3 테스트 표준 적용 (1일)

- [ ] 단위 테스트 커버리지 80% 이상 확인
- [ ] 통합 테스트 작성
- [ ] 테스트 표준 준수

**완료 기준**:
- ✅ 테스트 커버리지 80% 이상

---

## 📊 전체 진행률 추적

### Phase별 진행률

| Phase | 작업 항목 | 진행률 | 상태 | 완료일 |
|-------|----------|--------|------|--------|
| Phase 1.1 | 보안 표준 적용 | 0% | 🔴 대기 | - |
| Phase 1.2 | 브랜치 코드 제거 | 0% | 🔴 대기 | - |
| Phase 1.3 | 테넌트 격리 검증 | 0% | 🔴 대기 | - |
| Phase 2.1 | API 경로 표준화 | 0% | 🔴 대기 | - |
| Phase 2.2 | 에러 처리 표준화 | 0% | 🔴 대기 | - |
| Phase 2.3 | API 응답 형식 통일 | 0% | 🔴 대기 | - |
| Phase 3.1 | 역할 이름 하드코딩 제거 | 0% | 🔴 대기 | - |
| Phase 3.2 | 색상 하드코딩 제거 | 0% | 🔴 대기 | - |
| Phase 3.3 | 상태값 공통코드 전환 | 0% | 🔴 대기 | - |
| Phase 3.4 | URL/경로 하드코딩 제거 | 0% | 🔴 대기 | - |
| Phase 4.1 | 컴포넌트 템플릿 적용 | 0% | 🔴 대기 | - |
| Phase 4.2 | 표준 컴포넌트 사용 | 0% | 🔴 대기 | - |
| Phase 4.3 | UI/UX 표준화 | 0% | 🔴 대기 | - |
| Phase 5.1 | 코드 스타일 통일 | 0% | 🔴 대기 | - |
| Phase 5.2 | 주석 및 문서화 | 0% | 🔴 대기 | - |
| Phase 5.3 | 테스트 표준 적용 | 0% | 🔴 대기 | - |

### 전체 진행률: **0%**

---

## 🎯 Phase별 완료 체크

### Phase 1 완료 체크
- [ ] 보안 표준 적용 완료
- [ ] 브랜치 코드 제거 완료 (0개 확인)
- [ ] 테넌트 격리 검증 완료 (100% 준수)
- [ ] 통합 테스트 통과

### Phase 2 완료 체크
- [ ] API 경로 표준화 완료 (100% 준수)
- [ ] 에러 처리 표준화 완료 (100% 준수)
- [ ] API 응답 형식 통일 완료
- [ ] 통합 테스트 통과

### Phase 3 완료 체크
- [ ] 역할 이름 하드코딩 제거 완료 (0개)
- [ ] 색상 하드코딩 제거 완료 (0개)
- [ ] 상태값 공통코드 전환 완료 (0개 하드코딩, 100% 공통코드 조회)
- [ ] URL/경로 하드코딩 제거 완료 (0개)

### Phase 4 완료 체크
- [ ] 컴포넌트 템플릿 적용 완료 (100%)
- [ ] 표준 컴포넌트 사용 완료 (100%)
- [ ] UI 일관성 확인 완료 (100%)

### Phase 5 완료 체크
- [ ] 코드 스타일 통일 완료 (100%)
- [ ] 문서화 완료 (100%)
- [ ] 테스트 커버리지 80% 이상

---

## 📝 일일 작업 로그

### 2025-12-04 (시작일)
- [x] 표준화 실행 계획 문서 작성
- [x] 우선순위 계획 문서 작성
- [x] 체크리스트 문서 작성
- [ ] Phase 1 작업 시작

---

**최종 업데이트**: 2025-12-04

