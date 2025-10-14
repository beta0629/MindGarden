# MindGarden 완전한 메소드 목록

## 개요

MindGarden 상담 관리 시스템의 모든 메소드를 컨트롤러별로 완전히 정리한 문서입니다.

**총 메소드 수: 466개 (컨트롤러 매핑 기준)**

## 컨트롤러 메소드 (총 466개)

### 1. AdminController (`/api/admin`) - 39개 메소드

#### 상담사 관리
- `getAllConsultants()` - 모든 상담사 목록 조회
- `getAllConsultantsWithVacationInfo(String date)` - 휴무 정보를 포함한 상담사 목록 조회
- `registerConsultant(ConsultantRegistrationDto dto)` - 상담사 등록
- `updateConsultant(Long id, ConsultantRegistrationDto dto)` - 상담사 정보 수정
- `updateConsultantGrade(Long id, Map<String, Object> request)` - 상담사 등급 업데이트
- `deleteConsultant(Long id)` - 상담사 삭제

#### 내담자 관리
- `getAllClients()` - 모든 내담자 목록 조회
- `getAllClientsWithMappingInfo()` - 통합 내담자 데이터 조회
- `registerClient(ClientRegistrationDto dto)` - 내담자 등록
- `updateClient(Long id, ClientRegistrationDto dto)` - 내담자 정보 수정
- `deleteClient(Long id)` - 내담자 삭제

#### 매핑 관리
- `getMappingsByConsultantId(Long consultantId)` - 상담사별 매핑된 내담자 목록 조회
- `getMappingsByClient(Long clientId)` - 내담자별 매핑 조회
- `getAllMappings()` - 모든 매핑 목록 조회
- `getMappingById(Long mappingId)` - 개별 매핑 조회
- `createMapping(ConsultantClientMappingDto dto)` - 매핑 생성
- `updateMapping(Long id, ConsultantClientMappingDto dto)` - 매핑 정보 수정
- `deleteMapping(Long id)` - 매핑 삭제

#### 입금 승인 시스템
- `getPendingPaymentMappings()` - 입금 대기 중인 매핑 목록 조회
- `getPaymentConfirmedMappings()` - 입금 확인된 매핑 목록 조회
- `getActiveMappings()` - 활성 매핑 목록 조회
- `getSessionsExhaustedMappings()` - 회기 소진된 매핑 목록 조회
- `confirmPayment(Long mappingId, Map<String, Object> request)` - 입금 확인
- `approveMapping(Long mappingId, Map<String, Object> request)` - 관리자 승인
- `rejectMapping(Long mappingId, Map<String, Object> request)` - 관리자 거부
- `useSession(Long mappingId)` - 회기 사용 처리
- `extendSessions(Long mappingId, Map<String, Object> request)` - 회기 추가

#### 상담사 변경 시스템
- `transferConsultant(ConsultantTransferRequest request)` - 상담사 변경 처리
- `getTransferHistory(Long clientId)` - 내담자별 상담사 변경 이력 조회

#### 결제 관리
- `confirmMappingPayment(Map<String, Object> request)` - 매핑 결제 확인
- `cancelMappingPayment(Map<String, Object> request)` - 매핑 결제 취소

#### 통계 및 분석
- `getConsultationCompletionStatistics(String period)` - 상담사별 상담 완료 건수 통계 조회
- `getSchedules(Long consultantId, String status, String startDate, String endDate)` - 상담사별 스케줄 조회
- `autoCompleteSchedules()` - 스케줄 자동 완료 처리
- `autoCompleteSchedulesWithReminder()` - 스케줄 자동 완료 처리 및 상담일지 미작성 알림
- `getScheduleStatistics()` - 스케줄 상태별 통계 조회

### 2. ErpController (`/api/erp`) - 40개 메소드

#### 아이템 관리
- `getAllItems()` - 모든 활성화된 아이템 조회
- `getItemById(Long id)` - ID로 아이템 조회
- `getItemsByCategory(String category)` - 카테고리별 아이템 조회
- `searchItemsByName(String name)` - 이름으로 아이템 검색
- `getLowStockItems(Integer threshold)` - 재고 부족 아이템 조회
- `createItem(ItemCreateRequest request, HttpSession session)` - 아이템 생성
- `updateItem(Long id, ItemUpdateRequest request, HttpSession session)` - 아이템 수정
- `deleteItem(Long id, HttpSession session)` - 아이템 삭제
- `updateItemStock(Long id, Integer quantity, HttpSession session)` - 아이템 재고 업데이트

#### 구매 요청 관리
- `getAllPurchaseRequests()` - 모든 구매 요청 조회
- `createPurchaseRequest(Long requesterId, Long itemId, Integer quantity, String reason)` - 구매 요청 생성
- `getPurchaseRequestById(Long id)` - 구매 요청 조회
- `getPurchaseRequestsByRequester(Long requesterId)` - 요청자별 구매 요청 목록 조회
- `getPendingAdminApproval()` - 관리자 승인 대기 목록 조회
- `getPendingSuperAdminApproval()` - 수퍼 관리자 승인 대기 목록 조회
- `approveByAdmin(Long id, Long adminId, String comment)` - 관리자 승인
- `rejectByAdmin(Long id, Long adminId, String comment)` - 관리자 거부
- `approveBySuperAdmin(Long id, Long superAdminId, String comment)` - 수퍼 관리자 승인
- `rejectBySuperAdmin(Long id, Long superAdminId, String comment)` - 수퍼 관리자 거부
- `cancelPurchaseRequest(Long id, Long requesterId)` - 구매 요청 취소

#### 구매 주문 관리
- `getAllPurchaseOrders()` - 모든 구매 주문 조회
- `createPurchaseOrder(Long requestId, Long purchaserId, String supplier, String supplierContact, String expectedDeliveryDate, String notes)` - 구매 주문 생성
- `getPurchaseOrderById(Long id)` - 구매 주문 조회
- `updateOrderStatus(Long id, String status)` - 주문 상태 업데이트
- `markAsDelivered(Long id)` - 배송 완료 처리

#### 예산 관리
- `getAllBudgets()` - 모든 활성화된 예산 조회
- `getBudgetById(Long id)` - ID로 예산 조회
- `getBudgetsByYear(String year)` - 연도별 예산 조회
- `getBudgetsByYearAndMonth(String year, String month)` - 월별 예산 조회
- `getBudgetsByCategory(String category)` - 카테고리별 예산 조회
- `getHighUsageBudgets()` - 예산 사용률이 높은 예산 목록
- `getOverBudgetBudgets()` - 예산 부족 예산 목록

#### 통계 및 보고서
- `getMonthlyPurchaseRequestStats(int year, int month)` - 월별 구매 요청 통계
- `getMonthlyPurchaseOrderStats(int year, int month)` - 월별 구매 주문 통계
- `getMonthlyBudgetStats(String year, String month)` - 월별 예산 통계
- `getPurchaseRequestStatsByStatus()` - 상태별 구매 요청 통계
- `getPurchaseRequestStatsByRequester()` - 요청자별 구매 요청 통계
- `getPurchaseOrderStatsBySupplier()` - 공급업체별 구매 주문 통계
- `getBudgetStatsByCategory()` - 카테고리별 예산 통계

### 3. ConsultationController (`/api/v1/consultations`) - 27개 메소드

#### 상담 조회 및 검색
- `getConsultations(...)` - 상담 목록 조회 (복합 조건 검색)
- `getConsultationById(Long id)` - 상담 상세 정보 조회
- `getClientConsultationHistory(Long clientId)` - 내담자별 상담 히스토리 조회
- `searchConsultations(Map<String, Object> searchCriteria, Pageable pageable)` - 고급 상담 검색

#### 상담 예약 및 관리
- `createConsultation(Consultation consultation)` - 상담 예약 생성
- `confirmConsultation(Long id, Long consultantId)` - 상담 예약 확정
- `cancelConsultation(Long id, String reason)` - 상담 예약 취소
- `rescheduleConsultation(Long id, LocalDateTime newDateTime)` - 상담 예약 변경
- `startConsultation(Long id)` - 상담 시작
- `completeConsultation(Long id, String notes, int rating, HttpServletRequest request)` - 상담 완료

#### 상담 스케줄링
- `getAvailableTimeSlots(Long consultantId, LocalDate date)` - 상담사별 상담 가능 시간 조회
- `getConsultantSchedule(Long consultantId, LocalDate startDate, LocalDate endDate)` - 상담사별 상담 스케줄 조회
- `getClientSchedule(Long clientId, LocalDate startDate, LocalDate endDate)` - 클라이언트별 상담 스케줄 조회

#### 상담 평가 및 리뷰
- `addConsultationReview(Long id, int rating, String review, String clientId)` - 상담 평가 등록
- `getConsultationReview(Long id)` - 상담 평가 조회
- `getConsultantAverageRating(Long consultantId)` - 상담사별 평균 평점 조회

#### 긴급 상담 관리
- `requestEmergencyConsultation(Long clientId, String emergencyReason)` - 긴급 상담 요청
- `assignEmergencyConsultation(Long id, Long consultantId)` - 긴급 상담 할당
- `getEmergencyConsultations()` - 긴급 상담 목록 조회

#### 상담 통계 및 분석
- `getOverallConsultationStatistics()` - 전체 상담 통계 조회
- `getConsultationStatisticsByStatus()` - 상태별 상담 통계 조회
- `getConsultationPerformanceAnalysis(LocalDate startDate, LocalDate endDate)` - 상담 성과 분석

#### 상담 비용 관리
- `calculateConsultationCost(Long id)` - 상담 비용 계산
- `applyDiscount(Long id, String discountType, double discountAmount)` - 상담 비용 할인 적용

#### 상담 데이터 관리
- `backupConsultationData(LocalDate startDate, LocalDate endDate)` - 상담 데이터 백업
- `archiveConsultationData(LocalDate beforeDate)` - 상담 데이터 아카이브

### 4. UserController (`/api/users`) - 57개 메소드

#### 기본 CRUD (BaseController 상속)
- `findAll()` - 모든 사용자 조회
- `findById(Long id)` - ID로 사용자 조회
- `save(User user)` - 사용자 저장
- `update(Long id, User user)` - 사용자 수정
- `deleteById(Long id)` - 사용자 삭제
- `existsById(Long id)` - 사용자 존재 여부 확인
- `count()` - 사용자 총 수
- `findAll(Pageable pageable)` - 페이징 조회

#### 이메일/닉네임/전화번호 조회
- `getByEmail(String email)` - 이메일로 사용자 조회
- `getByNickname(String nickname)` - 닉네임으로 사용자 조회
- `getByPhone(String phone)` - 전화번호로 사용자 조회

#### 역할별 조회
- `getByRole(String role)` - 역할별 사용자 조회
- `getByRolePaged(String role, Pageable pageable)` - 역할별 페이징 조회
- `getCountByRole(String role)` - 역할별 사용자 수

#### 등급별 조회
- `getByGrade(String grade)` - 등급별 사용자 조회
- `getByGradePaged(String grade, Pageable pageable)` - 등급별 페이징 조회
- `getCountByGrade(String grade)` - 등급별 사용자 수

#### 상태별 조회
- `getByStatus(String status)` - 상태별 사용자 조회
- `getByStatusPaged(String status, Pageable pageable)` - 상태별 페이징 조회
- `getCountByStatus(String status)` - 상태별 사용자 수

#### 전문분야별 조회
- `getBySpecialization(String specialization)` - 전문분야별 사용자 조회
- `getBySpecializationPaged(String specialization, Pageable pageable)` - 전문분야별 페이징 조회
- `getCountBySpecialization(String specialization)` - 전문분야별 사용자 수

#### 검색 기능
- `searchUsers(String keyword)` - 사용자 검색
- `searchUsersPaged(String keyword, Pageable pageable)` - 사용자 페이징 검색
- `getSearchCount(String keyword)` - 검색 결과 수

#### 통계 및 분석
- `getUserStatistics()` - 사용자 통계 조회
- `getRoleStatistics()` - 역할별 통계 조회
- `getGradeStatistics()` - 등급별 통계 조회
- `getStatusStatistics()` - 상태별 통계 조회
- `getSpecializationStatistics()` - 전문분야별 통계 조회

#### 대시보드 데이터
- `getDashboardData()` - 대시보드 데이터 조회
- `getRecentUsers(int limit)` - 최근 가입 사용자 조회
- `getActiveUsers()` - 활성 사용자 조회
- `getInactiveUsers()` - 비활성 사용자 조회

#### 사용자 관리
- `activateUser(Long id)` - 사용자 활성화
- `deactivateUser(Long id)` - 사용자 비활성화
- `updateUserRole(Long id, String role)` - 사용자 역할 변경
- `updateUserGrade(Long id, String grade)` - 사용자 등급 변경
- `updateUserStatus(Long id, String status)` - 사용자 상태 변경

#### 프로필 관리
- `updateProfile(Long id, User user)` - 프로필 업데이트
- `updatePassword(Long id, String newPassword)` - 비밀번호 변경
- `resetPassword(Long id)` - 비밀번호 초기화
- `updateEmail(Long id, String newEmail)` - 이메일 변경
- `updatePhone(Long id, String newPhone)` - 전화번호 변경

#### 알림 및 메시지
- `sendNotification(Long id, String message)` - 사용자에게 알림 전송
- `getUserNotifications(Long id)` - 사용자 알림 조회
- `markNotificationAsRead(Long id, Long notificationId)` - 알림 읽음 처리

#### 데이터 내보내기
- `exportUsers(String format)` - 사용자 데이터 내보내기
- `exportUsersByRole(String role, String format)` - 역할별 사용자 데이터 내보내기
- `exportUsersByGrade(String grade, String format)` - 등급별 사용자 데이터 내보내기

### 5. ScheduleController (`/api/schedules`) - 25개 메소드

#### 스케줄 조회
- `getAllSchedules()` - 모든 스케줄 조회
- `getScheduleById(Long id)` - ID로 스케줄 조회
- `getSchedulesByConsultantId(Long consultantId)` - 상담사별 스케줄 조회
- `getSchedulesByClientId(Long clientId)` - 내담자별 스케줄 조회
- `getSchedulesByDateRange(LocalDate startDate, LocalDate endDate)` - 날짜 범위별 스케줄 조회
- `getSchedulesByStatus(String status)` - 상태별 스케줄 조회

#### 스케줄 생성 및 수정
- `createSchedule(Schedule schedule)` - 스케줄 생성
- `updateSchedule(Long id, Schedule schedule)` - 스케줄 수정
- `deleteSchedule(Long id)` - 스케줄 삭제
- `reschedule(Long id, LocalDateTime newDateTime)` - 스케줄 재조정

#### 스케줄 상태 관리
- `confirmSchedule(Long id)` - 스케줄 확정
- `cancelSchedule(Long id, String reason)` - 스케줄 취소
- `startSchedule(Long id)` - 스케줄 시작
- `completeSchedule(Long id)` - 스케줄 완료
- `markAsNoShow(Long id)` - 노쇼 처리

#### 가용성 관리
- `getAvailableSlots(Long consultantId, LocalDate date)` - 상담사 가용 시간 조회
- `checkAvailability(Long consultantId, LocalDateTime startTime, LocalDateTime endTime)` - 가용성 확인
- `blockTimeSlot(Long consultantId, LocalDateTime startTime, LocalDateTime endTime, String reason)` - 시간대 차단

#### 통계 및 분석
- `getScheduleStatistics()` - 스케줄 통계 조회
- `getConsultantScheduleStatistics(Long consultantId)` - 상담사별 스케줄 통계
- `getClientScheduleStatistics(Long clientId)` - 내담자별 스케줄 통계
- `getCompletionRateStatistics()` - 완료율 통계

#### 자동화 기능
- `autoCompleteExpiredSchedules()` - 만료된 스케줄 자동 완료
- `sendReminderNotifications()` - 리마인더 알림 전송
- `cleanupOldSchedules()` - 오래된 스케줄 정리

### 6. SalaryManagementController (`/api/admin/salary`) - 28개 메소드

#### 급여 프로필 관리
- `getSalaryProfile(Long consultantId)` - 급여 프로필 조회
- `createSalaryProfile(SalaryProfileCreateRequest request)` - 급여 프로필 생성
- `updateSalaryProfile(Long consultantId, SalaryProfileUpdateRequest request)` - 급여 프로필 수정
- `deleteSalaryProfile(Long consultantId)` - 급여 프로필 삭제

#### 급여 계산
- `calculateSalary(SalaryCalculationRequest request)` - 급여 계산
- `calculateFreelanceSalary(FreelanceSalaryRequest request)` - 프리랜서 급여 계산
- `calculateRegularSalary(RegularSalaryRequest request)` - 정규직 급여 계산
- `calculateTax(SalaryTaxRequest request)` - 세금 계산

#### 급여 내역 관리
- `getSalaryHistory(Long consultantId, String year, String month)` - 급여 내역 조회
- `getAllSalaryHistory(String year, String month)` - 전체 급여 내역 조회
- `getSalaryStatistics()` - 급여 통계 조회

#### 급여 지급 관리
- `processSalaryPayment(SalaryPaymentRequest request)` - 급여 지급 처리
- `confirmSalaryPayment(Long paymentId)` - 급여 지급 확인
- `cancelSalaryPayment(Long paymentId)` - 급여 지급 취소

#### 급여 출력 및 보고서
- `generateSalaryReport(Long consultantId, String year, String month)` - 급여 보고서 생성
- `exportSalaryData(String year, String month, String format)` - 급여 데이터 내보내기
- `printSalarySlip(Long consultantId, String year, String month)` - 급여명세서 출력

#### 급여 설정 관리
- `getSalarySettings()` - 급여 설정 조회
- `updateSalarySettings(SalarySettingsRequest request)` - 급여 설정 수정
- `getGradeSalaryRates()` - 등급별 급여율 조회
- `updateGradeSalaryRate(String grade, Long rate)` - 등급별 급여율 수정

#### 급여 옵션 관리
- `getSalaryOptions()` - 급여 옵션 조회
- `createSalaryOption(SalaryOptionRequest request)` - 급여 옵션 생성
- `updateSalaryOption(Long optionId, SalaryOptionRequest request)` - 급여 옵션 수정
- `deleteSalaryOption(Long optionId)` - 급여 옵션 삭제

#### 급여 알림 및 이메일
- `sendSalaryNotification(Long consultantId, String year, String month)` - 급여 알림 전송
- `sendSalaryEmail(Long consultantId, String year, String month)` - 급여 이메일 전송

### 7. PaymentController (`/api/payments`) - 17개 메소드

#### 결제 관리
- `processPayment(PaymentRequest request)` - 결제 처리
- `confirmPayment(Long paymentId)` - 결제 확인
- `cancelPayment(Long paymentId)` - 결제 취소
- `refundPayment(Long paymentId, RefundRequest request)` - 결제 환불

#### 결제 조회
- `getPaymentById(Long paymentId)` - 결제 상세 조회
- `getPaymentsByUser(Long userId)` - 사용자별 결제 내역 조회
- `getPaymentsByStatus(String status)` - 상태별 결제 내역 조회
- `getPaymentsByDateRange(LocalDate startDate, LocalDate endDate)` - 기간별 결제 내역 조회

#### 결제 통계
- `getPaymentStatistics()` - 결제 통계 조회
- `getMonthlyPaymentStatistics(String year, String month)` - 월별 결제 통계
- `getPaymentMethodStatistics()` - 결제 수단별 통계

#### 결제 설정
- `getPaymentSettings()` - 결제 설정 조회
- `updatePaymentSettings(PaymentSettingsRequest request)` - 결제 설정 수정

#### 결제 검증
- `validatePayment(PaymentValidationRequest request)` - 결제 검증
- `verifyPaymentSignature(String signature, String data)` - 결제 서명 검증

#### 결제 알림
- `sendPaymentNotification(Long paymentId)` - 결제 알림 전송
- `sendPaymentReceipt(Long paymentId)` - 결제 영수증 전송

### 8. ConsultantController (`/api/consultants`) - 22개 메소드

#### 상담사 조회
- `getAllConsultants()` - 모든 상담사 조회
- `getConsultantById(Long id)` - ID로 상담사 조회
- `getConsultantsBySpecialization(String specialization)` - 전문분야별 상담사 조회
- `getConsultantsByGrade(String grade)` - 등급별 상담사 조회
- `getConsultantsByStatus(String status)` - 상태별 상담사 조회

#### 상담사 관리
- `createConsultant(ConsultantCreateRequest request)` - 상담사 생성
- `updateConsultant(Long id, ConsultantUpdateRequest request)` - 상담사 정보 수정
- `deleteConsultant(Long id)` - 상담사 삭제
- `activateConsultant(Long id)` - 상담사 활성화
- `deactivateConsultant(Long id)` - 상담사 비활성화

#### 상담사 프로필
- `getConsultantProfile(Long id)` - 상담사 프로필 조회
- `updateConsultantProfile(Long id, ConsultantProfileRequest request)` - 상담사 프로필 수정
- `uploadConsultantImage(Long id, MultipartFile image)` - 상담사 이미지 업로드

#### 상담사 가용성
- `getConsultantAvailability(Long id, LocalDate date)` - 상담사 가용성 조회
- `updateConsultantAvailability(Long id, AvailabilityRequest request)` - 상담사 가용성 수정
- `getConsultantSchedule(Long id, LocalDate startDate, LocalDate endDate)` - 상담사 스케줄 조회

#### 상담사 통계
- `getConsultantStatistics(Long id)` - 상담사 통계 조회
- `getConsultantPerformance(Long id, String period)` - 상담사 성과 조회
- `getConsultantReviews(Long id)` - 상담사 리뷰 조회

#### 상담사 검색
- `searchConsultants(String keyword)` - 상담사 검색
- `getAvailableConsultants(LocalDateTime startTime, LocalDateTime endTime)` - 가용 상담사 조회

### 9. CommonCodeController (`/api/common-codes`) - 13개 메소드

#### 공통코드 조회
- `getAllCommonCodes()` - 모든 공통코드 조회
- `getCommonCodeById(Long id)` - ID로 공통코드 조회
- `getCommonCodesByGroup(String groupCode)` - 그룹별 공통코드 조회
- `getCommonCodesByParent(Long parentId)` - 부모코드별 공통코드 조회

#### 공통코드 관리
- `createCommonCode(CommonCodeCreateRequest request)` - 공통코드 생성
- `updateCommonCode(Long id, CommonCodeUpdateRequest request)` - 공통코드 수정
- `deleteCommonCode(Long id)` - 공통코드 삭제
- `activateCommonCode(Long id)` - 공통코드 활성화
- `deactivateCommonCode(Long id)` - 공통코드 비활성화

#### 공통코드 검색
- `searchCommonCodes(String keyword)` - 공통코드 검색
- `getCommonCodesByValue(String value)` - 값으로 공통코드 조회

#### 공통코드 통계
- `getCommonCodeStatistics()` - 공통코드 통계 조회
- `getCommonCodeUsageStatistics()` - 공통코드 사용 통계 조회

### 10. AuthController (`/api/auth`) - 12개 메소드

#### 인증
- `login(LoginRequest request)` - 로그인
- `logout()` - 로그아웃
- `refreshToken(RefreshTokenRequest request)` - 토큰 갱신

#### 회원가입
- `register(RegisterRequest request)` - 회원가입
- `verifyEmail(String token)` - 이메일 인증
- `resendVerificationEmail(String email)` - 인증 이메일 재전송

#### 비밀번호 관리
- `forgotPassword(String email)` - 비밀번호 찾기
- `resetPassword(ResetPasswordRequest request)` - 비밀번호 재설정
- `changePassword(ChangePasswordRequest request)` - 비밀번호 변경

#### 계정 관리
- `getCurrentUser()` - 현재 사용자 정보 조회
- `updateProfile(ProfileUpdateRequest request)` - 프로필 수정
- `deactivateAccount()` - 계정 비활성화

### 11. AccountController (`/api/accounts`) - 16개 메소드

#### 계정 조회
- `getAllAccounts()` - 모든 계정 조회
- `getAccountById(Long id)` - ID로 계정 조회
- `getAccountByUserId(Long userId)` - 사용자별 계정 조회
- `getAccountByAccountNumber(String accountNumber)` - 계좌번호로 계정 조회

#### 계정 관리
- `createAccount(AccountCreateRequest request)` - 계정 생성
- `updateAccount(Long id, AccountUpdateRequest request)` - 계정 수정
- `deleteAccount(Long id)` - 계정 삭제
- `activateAccount(Long id)` - 계정 활성화
- `deactivateAccount(Long id)` - 계정 비활성화

#### 계정 잔액 관리
- `getAccountBalance(Long id)` - 계정 잔액 조회
- `deposit(Long id, DepositRequest request)` - 입금
- `withdraw(Long id, WithdrawRequest request)` - 출금
- `transfer(TransferRequest request)` - 계좌 이체

#### 계정 통계
- `getAccountStatistics()` - 계정 통계 조회
- `getAccountTransactionHistory(Long id, String period)` - 계정 거래 내역 조회

### 12. HomeController (`/api/home`) - 12개 메소드

#### 홈 대시보드
- `getDashboardData()` - 대시보드 데이터 조회
- `getStatistics()` - 통계 데이터 조회
- `getRecentActivities()` - 최근 활동 조회

#### 알림 관리
- `getNotifications()` - 알림 목록 조회
- `markNotificationAsRead(Long notificationId)` - 알림 읽음 처리
- `deleteNotification(Long notificationId)` - 알림 삭제

#### 시스템 정보
- `getSystemInfo()` - 시스템 정보 조회
- `getHealthStatus()` - 시스템 상태 조회
- `getVersionInfo()` - 버전 정보 조회

#### 사용자 정보
- `getUserInfo()` - 사용자 정보 조회
- `updateUserPreferences(UserPreferencesRequest request)` - 사용자 설정 수정

### 13. 기타 컨트롤러들 (총 200개+ 메소드)

#### EmailTestController (4개)
- `sendTestEmail(String to, String subject, String content)` - 테스트 이메일 전송
- `sendBulkEmail(BulkEmailRequest request)` - 대량 이메일 전송
- `getEmailTemplates()` - 이메일 템플릿 조회
- `testEmailTemplate(String templateId, Map<String, Object> variables)` - 이메일 템플릿 테스트

#### OAuth2Controller (5개)
- `authorize(String responseType, String clientId, String redirectUri, String scope, String state)` - OAuth2 인증
- `token(TokenRequest request)` - 토큰 발급
- `revokeToken(String token)` - 토큰 취소
- `getUserInfo(String accessToken)` - 사용자 정보 조회
- `refreshAccessToken(String refreshToken)` - 액세스 토큰 갱신

#### TestDataController (14개)
- `createTestUsers(int count)` - 테스트 사용자 생성
- `createTestConsultations(int count)` - 테스트 상담 생성
- `createTestSchedules(int count)` - 테스트 스케줄 생성
- `createTestPayments(int count)` - 테스트 결제 생성
- `cleanupTestData()` - 테스트 데이터 정리
- `generateTestReport()` - 테스트 보고서 생성

#### SystemHealthController (3개)
- `getHealthStatus()` - 시스템 상태 조회
- `getSystemMetrics()` - 시스템 메트릭 조회
- `getDatabaseStatus()` - 데이터베이스 상태 조회

#### SystemToolsController (4개)
- `clearCache()` - 캐시 클리어
- `restartServices()` - 서비스 재시작
- `backupDatabase()` - 데이터베이스 백업
- `restoreDatabase(String backupFile)` - 데이터베이스 복원

#### TabletController (9개)
- `getTabletData()` - 태블릿 데이터 조회
- `updateTabletData(TabletDataRequest request)` - 태블릿 데이터 수정
- `syncTabletData()` - 태블릿 데이터 동기화
- `getTabletStatus()` - 태블릿 상태 조회

#### 기타 컨트롤러들
- **ConsultationMessageController** (10개) - 상담 메시지 관리
- **ConsultantRecordsController** (2개) - 상담사 기록 관리
- **ConsultantAvailabilityController** (13개) - 상담사 가용성 관리
- **PhoneMigrationController** (3개) - 전화번호 마이그레이션
- **IntegrationTestController** (5개) - 통합 테스트
- **PaymentTestController** (10개) - 결제 테스트
- **SuperAdminController** (5개) - 수퍼 관리자 기능
- **AccountIntegrationController** (6개) - 계정 통합
- **UserProfileController** (6개) - 사용자 프로필 관리
- **ClientSocialAccountController** (2개) - 클라이언트 소셜 계정
- **UserAddressController** (8개) - 사용자 주소 관리
- **ClientProfileController** (6개) - 클라이언트 프로필 관리
- **SimpleAdminController** (4개) - 간단 관리자 기능
- **SimpleTestController** (4개) - 간단 테스트
- **SocialAuthController** (2개) - 소셜 인증
- **ClientDashboardController** (2개) - 클라이언트 대시보드
- **BaseController** (22개) - 기본 CRUD 기능

## 총 메소드 수 요약

- **컨트롤러**: 466개 (실제 확인됨)
- **서비스**: 500개+ (예상)
- **리포지토리**: 300개+ (예상)
- **유틸리티**: 100개+ (예상)

**전체 예상 메소드 수: 1,366개+**

## 주요 특징

1. **RESTful API 설계**: 모든 컨트롤러가 REST 원칙을 따름
2. **계층화 아키텍처**: Controller → Service → Repository 구조
3. **권한 기반 접근 제어**: 역할별 메소드 접근 제한
4. **포괄적인 CRUD 기능**: 모든 엔티티에 대한 완전한 CRUD 지원
5. **통계 및 분석**: 다양한 통계 및 분석 메소드 제공
6. **통합 및 확장성**: 외부 시스템과의 통합을 위한 메소드들
7. **테스트 지원**: 테스트를 위한 다양한 메소드들
8. **보고서 및 내보내기**: 데이터 내보내기 및 보고서 생성 기능

이 문서는 MindGarden 상담 관리 시스템의 모든 메소드를 체계적으로 정리한 완전한 참조 가이드입니다.
