# MindGarden 메소드 목록

## 개요

MindGarden 상담 관리 시스템의 모든 메소드를 체계적으로 정리한 문서입니다.

## 컨트롤러 메소드

### 1. SalaryManagementController (`/api/admin/salary`)

#### 급여 프로필 관리
- `getConsultants()` - 상담사 목록 조회
- `getGrades()` - 등급 목록 조회
- `getOptionTypes()` - 옵션 유형 목록 조회
- `getConsultant(Long consultantId)` - 상담사 상세 조회
- `getSalaryProfiles()` - 급여 프로필 목록 조회
- `createSalaryProfile(Map<String, Object> request)` - 급여 프로필 생성
- `getSalaryProfile(Long consultantId)` - 급여 프로필 조회
- `addSalaryOption(Map<String, Object> request)` - 급여 옵션 추가
- `getSalaryOptions(Long salaryProfileId)` - 급여 옵션 목록 조회

#### 급여 계산
- `calculateFreelanceSalary(Map<String, Object> request)` - 프리랜서 급여 계산
- `calculateRegularSalary(Map<String, Object> request)` - 정규직 급여 계산
- `calculateSalary(Map<String, Object> request)` - 급여 계산 (통합)
- `getSalaryCalculations(Long consultantId)` - 급여 계산 내역 조회
- `approveSalaryCalculation(Long calculationId)` - 급여 계산 승인
- `markSalaryAsPaid(Long calculationId)` - 급여 지급 완료 처리

#### 통계 및 관리
- `getSalaryStatistics(String period)` - 급여 통계 조회
- `cleanupDuplicateCalculations()` - 중복 계산 정리

#### 세금 관리
- `getTaxCalculations(Long calculationId)` - 세금 계산 내역 조회
- `getTaxCalculationsByType(String taxType)` - 세금 유형별 조회
- `getTaxStatistics(String period)` - 세금 통계 조회
- `calculateAdditionalTax(Map<String, Object> request)` - 추가 세금 계산

#### 급여 출력 및 이메일
- `exportSalaryToPdf(Map<String, Object> request)` - PDF 급여 계산서 출력
- `exportSalaryToExcel(Map<String, Object> request)` - Excel 급여 계산서 출력
- `exportSalaryToCsv(Map<String, Object> request)` - CSV 급여 계산서 출력
- `sendSalaryEmail(Map<String, Object> request)` - 급여 계산서 이메일 전송
- `getEmailTemplates(String templateType)` - 이메일 템플릿 조회
- `getSalaryCodes()` - 급여 관련 공통코드 조회

### 2. AdminController (`/api/admin`)

#### 상담사 관리
- `getAllConsultants()` - 상담사 목록 조회
- `getAllConsultantsWithVacationInfo(String date)` - 휴가 정보 포함 상담사 목록
- `registerConsultant(ConsultantRegistrationDto dto)` - 상담사 등록
- `updateConsultant(Long id, ConsultantRegistrationDto dto)` - 상담사 정보 수정
- `updateConsultantGrade(Long id, Map<String, Object> request)` - 상담사 등급 수정
- `deleteConsultant(Long id)` - 상담사 삭제

#### 내담자 관리
- `getAllClients()` - 내담자 목록 조회
- `getAllClientsWithMappingInfo()` - 매핑 정보 포함 내담자 목록
- `getClientsByConsultantMapping(Long consultantId)` - 상담사별 내담자 목록
- `registerClient(ClientRegistrationDto dto)` - 내담자 등록
- `updateClient(Long id, ClientRegistrationDto dto)` - 내담자 정보 수정
- `deleteClient(Long id)` - 내담자 삭제

#### 매핑 관리
- `getMappingsByClient(Long clientId)` - 내담자별 매핑 조회
- `getAllMappings()` - 모든 매핑 조회
- `getPendingPaymentMappings()` - 결제 대기 매핑 조회
- `getPaymentConfirmedMappings()` - 결제 완료 매핑 조회
- `getActiveMappings()` - 활성 매핑 조회
- `getSessionsExhaustedMappings()` - 세션 소진 매핑 조회
- `getMappingById(Long mappingId)` - 매핑 상세 조회
- `createMapping(ConsultantClientMappingDto dto)` - 매핑 생성
- `updateMapping(Long id, ConsultantClientMappingDto dto)` - 매핑 수정
- `deleteMapping(Long id)` - 매핑 삭제
- `useSession(Long mappingId)` - 세션 사용
- `confirmMappingPayment(Map<String, Object> request)` - 매핑 결제 확인
- `cancelMappingPayment(Map<String, Object> request)` - 매핑 결제 취소

#### 상담사 이전
- `transferConsultant(ConsultantTransferRequest request)` - 상담사 이전
- `getTransferHistory(Long clientId)` - 이전 이력 조회

#### 스케줄 관리
- `autoCompleteSchedules()` - 스케줄 자동 완료
- `autoCompleteSchedulesWithReminder()` - 알림 포함 스케줄 자동 완료
- `getScheduleStatistics()` - 스케줄 통계 조회

### 3. AdminUserController (`/api/admin/users`)

#### 사용자 관리
- `getAllUsers()` - 모든 사용자 조회
- `getConsultantApplicants()` - 상담사 신청자 조회
- `approveConsultant(Long userId)` - 상담사 승인
- `approveAdmin(Long userId)` - 관리자 승인
- `getAvailableRoles()` - 사용 가능한 역할 조회

### 4. CommonCodeController (`/api/common-codes`)

#### 공통코드 관리
- `getCodeValuesByGroup(String groupCode)` - 그룹별 코드값 조회
- `getAllCommonCodes()` - 모든 공통코드 조회
- `getCommonCodesByGroup(String codeGroup)` - 그룹별 공통코드 조회
- `getActiveCommonCodesByGroup(String codeGroup)` - 활성 공통코드 조회
- `getCommonCodeById(Long id)` - 공통코드 상세 조회
- `createCommonCode(CommonCodeDto dto)` - 공통코드 생성
- `updateCommonCode(Long id, CommonCodeDto dto)` - 공통코드 수정
- `deleteCommonCode(Long id)` - 공통코드 삭제
- `toggleCommonCodeStatus(Long id)` - 공통코드 상태 토글
- `getAllCodeGroups()` - 모든 코드 그룹 조회
- `getCodeGroupStatistics(String codeGroup)` - 코드 그룹 통계
- `createCommonCodesBatch(List<CommonCodeDto> dtos)` - 공통코드 일괄 생성

### 5. ScheduleController (`/api/schedules`)

#### 스케줄 관리
- `getMySchedules(Long consultantId)` - 내 스케줄 조회
- `checkClientMapping(Map<String, Object> request)` - 내담자 매핑 확인
- `getConsultationRecordsByClient(Long clientId)` - 내담자별 상담 기록 조회
- `getConsultationRecordsGroupedBySession(Long clientId)` - 세션별 상담 기록 조회

### 6. EmailTestController (`/api/email`)

#### 이메일 테스트
- `sendTestEmail(EmailRequest request)` - 테스트 이메일 전송
- `sendWelcomeEmail(String to)` - 환영 이메일 전송

### 7. OAuth2ConfigController (`/api/oauth2`)

#### OAuth2 설정
- `getOAuth2Config()` - OAuth2 설정 조회

### 8. HomeController (`/api/home`)

#### 홈페이지
- `home(Model model)` - 홈페이지
- `homepageMain(Model model)` - 메인 홈페이지
- `login(Model model)` - 로그인 페이지
- `register(Model model)` - 회원가입 페이지
- `forgotPassword(Model model)` - 비밀번호 찾기 페이지
- `accessDenied(Model model)` - 접근 거부 페이지
- `demo(Model model)` - 데모 페이지

### 9. 기타 컨트롤러들

#### UserController (`/api/users`)
- 사용자 프로필 관리
- 주소 관리
- 세션 관리

#### AuthController (`/api/auth`)
- 로그인/로그아웃
- 세션 관리
- 토큰 갱신

#### OAuth2Controller (`/api/oauth2`)
- OAuth2 인증
- 소셜 로그인

#### ConsultantController (`/api/consultants`)
- 상담사 프로필 관리
- 가용성 관리

#### ConsultationController (`/api/consultations`)
- 상담 관리
- 상담 기록

#### ErpController (`/api/erp`)
- ERP 시스템 관리
- 아이템 관리
- 구매 관리

#### PaymentController (`/api/payments`)
- 결제 관리
- 결제 내역

#### SuperAdminController (`/api/super-admin`)
- 수퍼어드민 기능
- 시스템 관리

## 서비스 메소드

### 1. SalaryCalculationServiceImpl

#### 급여 프로필 관리
- `createSalaryProfile(Long consultantId, String salaryType, BigDecimal baseSalary, String contractTerms)` - 급여 프로필 생성
- `createSalaryProfile(Long consultantId, String salaryType, BigDecimal baseSalary, String contractTerms, Boolean isBusinessRegistered)` - 급여 프로필 생성 (사업자 등록 포함)
- `getSalaryProfile(Long consultantId)` - 급여 프로필 조회
- `updateSalaryProfile(Long consultantId, ConsultantSalaryProfile updatedProfile)` - 급여 프로필 수정
- `deactivateSalaryProfile(Long consultantId)` - 급여 프로필 비활성화
- `getAllSalaryProfiles()` - 모든 급여 프로필 조회

#### 급여 옵션 관리
- `addSalaryOption(Long salaryProfileId, String optionType, BigDecimal optionAmount, String description)` - 급여 옵션 추가
- `getSalaryOptions(Long salaryProfileId)` - 급여 옵션 조회
- `updateSalaryOption(Long optionId, BigDecimal optionAmount, String description)` - 급여 옵션 수정
- `removeSalaryOption(Long optionId)` - 급여 옵션 삭제

#### 급여 계산
- `cleanupDuplicateCalculations()` - 중복 계산 정리
- `calculateFreelanceSalary(Long consultantId, String period, List<Map<String, Object>> consultations)` - 프리랜서 급여 계산
- `calculateFreelanceSalary(Long consultantId, String period, List<Map<String, Object>> consultations, String payDayCode)` - 프리랜서 급여 계산 (급여일 지정)
- `calculateRegularSalary(Long consultantId, String period, BigDecimal baseSalary)` - 정규직 급여 계산
- `calculateRegularSalary(Long consultantId, String period, BigDecimal baseSalary, String payDayCode)` - 정규직 급여 계산 (급여일 지정)

#### 급여 관리
- `getSalaryCalculations(Long consultantId)` - 급여 계산 내역 조회
- `getSalaryCalculationByPeriod(Long consultantId, String period)` - 기간별 급여 계산 조회
- `approveSalaryCalculation(Long calculationId)` - 급여 계산 승인
- `markSalaryAsPaid(Long calculationId)` - 급여 지급 완료 처리

#### 통계
- `getTotalSalaryByConsultant(Long consultantId)` - 상담사별 총 급여 조회
- `getMonthlySalaryStatistics(String period)` - 월별 급여 통계
- `getSalaryTypeStatistics()` - 급여 유형별 통계
- `getPendingApprovalSalaries()` - 승인 대기 급여 목록
- `getPendingPaymentSalaries()` - 지급 대기 급여 목록

### 2. TaxCalculationServiceImpl

#### 세금 계산
- `calculateFreelanceTax(Long calculationId, BigDecimal grossAmount)` - 프리랜서 세금 계산
- `calculateFreelanceTax(Long calculationId, BigDecimal grossAmount, boolean isBusinessRegistered)` - 프리랜서 세금 계산 (사업자 등록 포함)
- `calculateRegularTax(Long calculationId, BigDecimal grossAmount)` - 정규직 세금 계산
- `calculateCenterVAT(Long calculationId, BigDecimal grossAmount)` - 센터 부가세 계산

#### 세금 조회
- `getTaxCalculationsByCalculationId(Long calculationId)` - 계산 ID별 세금 조회
- `getTaxCalculationsByType(String taxType)` - 세금 유형별 조회
- `getTotalTaxAmountByPeriod(String period)` - 기간별 총 세금 금액
- `getTotalTaxAmountByConsultantId(Long consultantId)` - 상담사별 총 세금 금액
- `getTaxStatistics(String period)` - 세금 통계

#### 세금 관리
- `deactivateTaxCalculation(Long taxCalculationId)` - 세금 계산 비활성화
- `saveTaxCalculation(SalaryTaxCalculation taxCalculation)` - 세금 계산 저장

### 3. ConsultationServiceImpl

#### 상담 CRUD
- `save(Consultation consultation)` - 상담 저장
- `saveAll(List<Consultation> consultations)` - 상담 일괄 저장
- `update(Consultation consultation)` - 상담 수정
- `partialUpdate(Long id, Consultation updateData)` - 상담 부분 수정
- `softDeleteById(Long id)` - 상담 소프트 삭제
- `restoreById(Long id)` - 상담 복원
- `hardDeleteById(Long id)` - 상담 완전 삭제

#### 상담 조회
- `findAllActive()` - 활성 상담 목록
- `findActiveById(Long id)` - 활성 상담 조회
- `findActiveByIdOrThrow(Long id)` - 활성 상담 조회 (예외 발생)
- `countActive()` - 활성 상담 수
- `findAllDeleted()` - 삭제된 상담 목록
- `countDeleted()` - 삭제된 상담 수
- `existsActiveById(Long id)` - 활성 상담 존재 여부

#### 상담 검색
- `findByIdAndVersion(Long id, Long version)` - ID와 버전으로 조회
- `findByClientId(Long clientId)` - 내담자별 상담 조회
- `findByConsultantId(Long consultantId)` - 상담사별 상담 조회
- `findByStatus(String status)` - 상태별 상담 조회
- `findByPriority(String priority)` - 우선순위별 상담 조회
- `findByRiskLevel(String riskLevel)` - 위험도별 상담 조회
- `findByConsultationMethod(String consultationMethod)` - 상담 방법별 조회
- `findByIsEmergency(Boolean isEmergency)` - 응급 상담 조회
- `findByIsFirstSession(Boolean isFirstSession)` - 첫 상담 조회

#### 상담 통계
- `getCompletedConsultationCount(Long consultantId, LocalDate startDate, LocalDate endDate)` - 완료된 상담 건수
- `getEntityStatistics()` - 엔티티 통계
- `cleanupOldDeleted(LocalDateTime cutoffDate)` - 오래된 삭제 데이터 정리

### 4. 기타 주요 서비스들

#### UserService
- 사용자 CRUD
- 프로필 관리
- 권한 관리

#### AdminService
- 관리자 기능
- 사용자 승인
- 통계 관리

#### ScheduleService
- 스케줄 관리
- 가용성 체크
- 자동 완료

#### EmailService
- 이메일 전송
- 템플릿 관리
- 알림 발송

## 리포지토리 메소드

### 1. SalaryCalculationRepository

#### 기본 조회
- `findByConsultantIdOrderByCreatedAtDesc(Long consultantId)` - 상담사별 급여 계산 내역
- `findByConsultantIdAndPeriod(Long consultantId, String period)` - 상담사별 기간별 급여 계산
- `findByConsultantIdAndCalculationPeriod(Long consultantId, String calculationPeriod)` - 상담사별 계산 기간별 조회
- `findByConsultantId(Long consultantId)` - 상담사별 급여 계산
- `findDistinctConsultantIds()` - 고유 상담사 ID 목록

#### 상태별 조회
- `findByStatusOrderByCreatedAtDesc(String status)` - 상태별 급여 계산
- `findByCalculationPeriodOrderByCreatedAtDesc(String period)` - 기간별 급여 계산
- `findByConsultantIdAndStatusOrderByCreatedAtDesc(Long consultantId, String status)` - 상담사별 상태별 급여 계산
- `findPendingApproval()` - 승인 대기 급여 계산
- `findPendingPayment()` - 지급 대기 급여 계산

#### 통계 및 집계
- `findByDateRange(LocalDateTime startDate, LocalDateTime endDate)` - 날짜 범위별 조회
- `getTotalPaidSalaryByConsultantId(Long consultantId)` - 상담사별 총 지급 급여
- `getMonthlySalaryStatistics()` - 월별 급여 통계

### 2. ScheduleRepository

#### 상담사별 조회
- `findByConsultantId(Long consultantId)` - 상담사별 스케줄
- `findByConsultantId(Long consultantId, Pageable pageable)` - 상담사별 스케줄 (페이징)
- `findByConsultantIdAndDate(Long consultantId, LocalDate date)` - 상담사별 날짜별 스케줄
- `findByConsultantIdAndDateBetween(Long consultantId, LocalDate startDate, LocalDate endDate)` - 상담사별 기간별 스케줄
- `findByConsultantIdAndIsDeletedFalse(Long consultantId)` - 상담사별 활성 스케줄

#### 내담자별 조회
- `findByClientId(Long clientId)` - 내담자별 스케줄
- `findByClientId(Long clientId, Pageable pageable)` - 내담자별 스케줄 (페이징)
- `findByClientIdAndDate(Long clientId, LocalDate date)` - 내담자별 날짜별 스케줄
- `findByClientIdAndDateBetween(Long clientId, LocalDate startDate, LocalDate endDate)` - 내담자별 기간별 스케줄

#### 상태별 조회
- `findByStatus(String status)` - 상태별 스케줄
- `findByConsultantIdAndStatus(Long consultantId, String status)` - 상담사별 상태별 스케줄
- `findByConsultantIdAndStatusAndDateBetween(Long consultantId, String status, LocalDate startDate, LocalDate endDate)` - 상담사별 상태별 기간별 스케줄
- `findByClientIdAndStatus(Long clientId, String status)` - 내담자별 상태별 스케줄

#### 날짜별 조회
- `findByDate(LocalDate date)` - 날짜별 스케줄
- `findByDateBetween(LocalDate startDate, LocalDate endDate)` - 기간별 스케줄
- `findByDateAndIsDeletedFalse(LocalDate date)` - 날짜별 활성 스케줄

#### 유형별 조회
- `findByScheduleType(String scheduleType)` - 스케줄 유형별 조회
- `findByConsultantIdAndScheduleType(Long consultantId, String scheduleType)` - 상담사별 스케줄 유형별 조회

#### 카운트 메소드
- `countByConsultantId(Long consultantId)` - 상담사별 스케줄 수
- `countByClientId(Long clientId)` - 내담자별 스케줄 수
- `countByConsultantIdAndDate(Long consultantId, LocalDate date)` - 상담사별 날짜별 스케줄 수
- `countByDateAndStatus(LocalDate date, String status)` - 날짜별 상태별 스케줄 수
- `countByDate(LocalDate date)` - 날짜별 스케줄 수
- `countByStatus(String status)` - 상태별 스케줄 수
- `countByDateBetween(LocalDate startDate, LocalDate endDate)` - 기간별 스케줄 수

#### 통계 메소드
- `countSchedulesByConsultant()` - 상담사별 스케줄 통계
- `countSchedulesByDateBetween(LocalDate startDate, LocalDate endDate)` - 기간별 스케줄 통계
- `countSchedulesByStatus()` - 상태별 스케줄 통계
- `countDistinctClientsByDateBetween(LocalDate startDate, LocalDate endDate)` - 기간별 고유 내담자 수
- `countDistinctConsultantsByDateBetween(LocalDate startDate, LocalDate endDate)` - 기간별 고유 상담사 수

### 3. ConsultationRepository

#### 기본 조회
- `findByClientId(Long clientId)` - 내담자별 상담 조회
- `findByConsultantId(Long consultantId)` - 상담사별 상담 조회
- `countByClientId(Long clientId)` - 내담자별 상담 수
- `countByConsultantId(Long consultantId)` - 상담사별 상담 수

#### 상태별 조회
- `findByStatus(String status)` - 상태별 상담 조회
- `countByStatus(String status)` - 상태별 상담 수

#### 날짜별 조회
- `findByConsultationDate(LocalDate date)` - 상담 날짜별 조회
- `countByConsultationDate(LocalDate date)` - 상담 날짜별 수
- `findByConsultationDateBetween(LocalDate startDate, LocalDate endDate)` - 상담 기간별 조회
- `countByConsultationDateBetween(LocalDate startDate, LocalDate endDate)` - 상담 기간별 수

#### 특성별 조회
- `findByPriority(String priority)` - 우선순위별 조회
- `countByPriority(String priority)` - 우선순위별 수
- `findByRiskLevel(String riskLevel)` - 위험도별 조회
- `countByRiskLevel(String riskLevel)` - 위험도별 수
- `findByConsultationMethod(String method)` - 상담 방법별 조회
- `countByConsultationMethod(String method)` - 상담 방법별 수

#### 특수 조회
- `findEmergencyConsultations()` - 응급 상담 조회
- `countEmergencyConsultations()` - 응급 상담 수
- `findFirstSessions()` - 첫 상담 조회
- `countFirstSessions()` - 첫 상담 수
- `findByIsEmergency(Boolean isEmergency)` - 응급 여부별 조회
- `findByIsFirstSession(Boolean isFirstSession)` - 첫 상담 여부별 조회

#### 세션 관리
- `findBySessionNumber(Integer sessionNumber)` - 세션 번호별 조회
- `countBySessionNumber(Integer sessionNumber)` - 세션 번호별 수
- `findByClientIdAndSessionNumber(Long clientId, Integer sessionNumber)` - 내담자별 세션 번호 조회
- `findMaxSessionNumberByClientId(Long clientId)` - 내담자별 최대 세션 번호
- `findMaxSessionNumberByConsultantId(Long consultantId)` - 상담사별 최대 세션 번호

#### 통계 메소드
- `getClientConsultationStatistics(Long clientId)` - 내담자별 상담 통계
- `getConsultantConsultationStatistics(Long consultantId)` - 상담사별 상담 통계
- `getOverallConsultationStatistics()` - 전체 상담 통계
- `getConsultationStatisticsByStatus()` - 상태별 상담 통계
- `getConsultationStatisticsByPriority()` - 우선순위별 상담 통계
- `getConsultationStatisticsByRiskLevel()` - 위험도별 상담 통계
- `getConsultationStatisticsByMethod()` - 방법별 상담 통계
- `getConsultationStatisticsByDate()` - 날짜별 상담 통계

### 4. 기타 주요 리포지토리들

#### SalaryTaxCalculationRepository
- 세금 계산 데이터 접근
- 세금 통계 조회

#### ConsultantSalaryProfileRepository
- 급여 프로필 데이터 접근
- 프로필 상태 관리

#### ConsultantSalaryOptionRepository
- 급여 옵션 데이터 접근
- 옵션 유형별 조회

#### PurchaseRequestRepository
- 구매 요청 데이터 접근
- 승인 상태 관리

#### UserRepository
- 사용자 데이터 접근
- 역할별 조회

#### CommonCodeRepository
- 공통코드 데이터 접근
- 그룹별 조회

## 유틸리티 메소드

### 1. SessionUtils
- 세션 관리 유틸리티
- 사용자 정보 추출

### 2. 암호화 유틸리티
- 개인정보 암호화/복호화
- 비밀번호 해싱

### 3. 이메일 유틸리티
- 이메일 템플릿 처리
- 이메일 발송

## 상수 클래스

### 1. 사용자 관련
- `UserRole` - 사용자 역할
- `UserGrade` - 사용자 등급
- `Gender` - 성별
- `AgeGroup` - 연령대

### 2. 상담 관련
- `ConsultationStatus` - 상담 상태
- `ConsultationType` - 상담 유형
- `ScheduleConstants` - 스케줄 상수

### 3. 급여 관련
- `PaymentConstants` - 결제 상수
- `BankTransferConstants` - 계좌이체 상수

### 4. 시스템 관련
- `SessionConstants` - 세션 상수
- `EmailConstants` - 이메일 상수
- `AdminConstants` - 관리자 상수

## 총 메소드 수

- **컨트롤러 메소드**: 약 200개
- **서비스 메소드**: 약 400개
- **리포지토리 메소드**: 약 300개
- **유틸리티 메소드**: 약 50개
- **총 메소드 수**: 약 950개

## 버전 정보

- **문서 버전**: 1.0.0
- **마지막 업데이트**: 2025년 1월 11일
- **프로젝트 버전**: 1.0.0

---

이 문서는 MindGarden 상담 관리 시스템의 모든 메소드를 체계적으로 정리한 것입니다. 
새로운 기능이 추가되거나 기존 기능이 수정될 때마다 이 문서를 업데이트해야 합니다.
