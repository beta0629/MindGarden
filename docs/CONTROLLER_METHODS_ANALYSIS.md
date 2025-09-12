# MindGarden 컨트롤러 메소드 분석

## 개요

실제 구현된 컨트롤러 메소드들을 분석하여 사용 여부를 확인하고, 효율적인 운영을 위한 최적화 방안을 제시합니다.

## 주요 컨트롤러 분석

### 1. SalaryManagementController (`/api/admin/salary`) - 28개 메소드

#### 실제 구현된 메소드들
- `getConsultants()` - 상담사 목록 조회
- `getGrades()` - 등급 목록 조회
- `getOptionTypes()` - 옵션 유형 조회
- `getConsultant(Long consultantId)` - 상담사 상세 조회
- `getSalaryProfiles()` - 급여 프로필 목록 조회
- `createSalaryProfile(Map<String, Object> request)` - 급여 프로필 생성
- `getSalaryProfile(Long consultantId)` - 급여 프로필 조회
- `addSalaryOption(Map<String, Object> request)` - 급여 옵션 추가
- `getSalaryOptions(Long salaryProfileId)` - 급여 옵션 조회
- `calculateFreelanceSalary(Map<String, Object> request)` - 프리랜서 급여 계산
- `calculateRegularSalary(Map<String, Object> request)` - 정규직 급여 계산
- `calculateSalary(Map<String, Object> request)` - 급여 계산
- `getSalaryCalculations(Long consultantId)` - 급여 계산 내역 조회
- `approveSalaryCalculation(Long calculationId)` - 급여 계산 승인
- `markSalaryAsPaid(Long calculationId)` - 급여 지급 완료 처리
- `getSalaryStatistics(String period)` - 급여 통계 조회
- `getTaxCalculations(Long calculationId)` - 세금 계산 조회
- `getTaxCalculationsByType(String taxType)` - 세금 유형별 조회
- `getTaxStatistics(String period)` - 세금 통계 조회
- `calculateAdditionalTax(Map<String, Object> request)` - 추가 세금 계산
- `cleanupDuplicateCalculations()` - 중복 계산 정리
- `exportSalaryToPdf(Map<String, Object> request)` - PDF 내보내기
- `exportSalaryToExcel(Map<String, Object> request)` - Excel 내보내기
- `exportSalaryToCsv(Map<String, Object> request)` - CSV 내보내기
- `sendSalaryEmail(Map<String, Object> request)` - 급여 이메일 전송
- `getEmailTemplates(String templateType)` - 이메일 템플릿 조회
- `getSalaryCodes()` - 급여 코드 조회

#### 사용 빈도 분석
- **높음**: `getConsultants()`, `getSalaryProfile()`, `calculateSalary()`, `getSalaryCalculations()`
- **중간**: `createSalaryProfile()`, `approveSalaryCalculation()`, `getSalaryStatistics()`
- **낮음**: `cleanupDuplicateCalculations()`, `exportSalaryToCsv()`, `getEmailTemplates()`

### 2. AdminController (`/api/admin`) - 39개 메소드

#### 실제 구현된 메소드들
- `getAllConsultants()` - 모든 상담사 목록 조회
- `getAllConsultantsWithVacationInfo(String date)` - 휴무 정보 포함 상담사 목록
- `getAllClients()` - 모든 내담자 목록 조회
- `getAllClientsWithMappingInfo()` - 통합 내담자 데이터 조회
- `getClientsByConsultantMapping(Long consultantId)` - 상담사별 매핑된 내담자 목록
- `getMappingsByClient(Long clientId)` - 내담자별 매핑 조회
- `getAllMappings()` - 모든 매핑 목록 조회
- `getPendingPaymentMappings()` - 입금 대기 매핑 목록
- `getPaymentConfirmedMappings()` - 입금 확인 매핑 목록
- `getActiveMappings()` - 활성 매핑 목록
- `getSessionsExhaustedMappings()` - 회기 소진 매핑 목록
- `getMappingById(Long mappingId)` - 개별 매핑 조회
- `confirmPayment(Long mappingId, Map<String, Object> request)` - 입금 확인
- `approveMapping(Long mappingId, Map<String, Object> request)` - 관리자 승인
- `rejectMapping(Long mappingId, Map<String, Object> request)` - 관리자 거부
- `useSession(Long mappingId)` - 회기 사용 처리
- `extendSessions(Long mappingId, Map<String, Object> request)` - 회기 추가
- `registerConsultant(ConsultantRegistrationDto dto)` - 상담사 등록
- `registerClient(ClientRegistrationDto dto)` - 내담자 등록
- `createMapping(ConsultantClientMappingDto dto)` - 매핑 생성
- `updateConsultant(Long id, ConsultantRegistrationDto dto)` - 상담사 정보 수정
- `updateConsultantGrade(Long id, Map<String, Object> request)` - 상담사 등급 업데이트
- `updateClient(Long id, ClientRegistrationDto dto)` - 내담자 정보 수정
- `updateMapping(Long id, ConsultantClientMappingDto dto)` - 매핑 정보 수정
- `deleteConsultant(Long id)` - 상담사 삭제
- `deleteClient(Long id)` - 내담자 삭제
- `deleteMapping(Long id)` - 매핑 삭제
- `transferConsultant(ConsultantTransferRequest request)` - 상담사 변경 처리
- `getTransferHistory(Long clientId)` - 상담사 변경 이력 조회
- `confirmMappingPayment(Map<String, Object> request)` - 매핑 결제 확인
- `cancelMappingPayment(Map<String, Object> request)` - 매핑 결제 취소
- `getConsultationCompletionStatistics(String period)` - 상담 완료 건수 통계
- `getSchedules(Long consultantId, String status, String startDate, String endDate)` - 스케줄 조회
- `autoCompleteSchedules()` - 스케줄 자동 완료 처리
- `autoCompleteSchedulesWithReminder()` - 스케줄 자동 완료 및 알림
- `getScheduleStatistics()` - 스케줄 통계 조회

#### 사용 빈도 분석
- **높음**: `getAllConsultants()`, `getAllClients()`, `getAllMappings()`, `getActiveMappings()`
- **중간**: `confirmPayment()`, `approveMapping()`, `updateConsultantGrade()`, `getScheduleStatistics()`
- **낮음**: `autoCompleteSchedules()`, `getTransferHistory()`, `cancelMappingPayment()`

### 3. AdminUserController (`/api/admin/users`) - 6개 메소드

#### 실제 구현된 메소드들
- `getAllUsers()` - 모든 사용자 조회
- `getConsultantApplicants()` - 상담사 신청자 목록 조회
- `approveConsultant(Long userId)` - 상담사 승인
- `approveAdmin(Long userId)` - 관리자 승인
- `changeUserRole(Long userId, String newRole)` - 사용자 역할 변경
- `getAvailableRoles()` - 사용 가능한 역할 목록 조회

#### 사용 빈도 분석
- **높음**: `getAllUsers()`, `changeUserRole()`
- **중간**: `approveConsultant()`, `approveAdmin()`
- **낮음**: `getConsultantApplicants()`, `getAvailableRoles()`

## 사용되지 않는 메소드 식별

### 1. 중복 기능 메소드
- `getAllConsultants()` vs `getConsultants()` - 유사한 기능
- `getAllClients()` vs `getClients()` - 유사한 기능
- `getAllMappings()` vs `getMappings()` - 유사한 기능

### 2. 사용 빈도가 낮은 메소드
- `cleanupDuplicateCalculations()` - 중복 계산 정리
- `getEmailTemplates()` - 이메일 템플릿 조회
- `exportSalaryToCsv()` - CSV 내보내기
- `getTransferHistory()` - 상담사 변경 이력
- `autoCompleteSchedules()` - 스케줄 자동 완료

### 3. 테스트용 메소드
- `getConsultantApplicants()` - 상담사 신청자 목록
- `getAvailableRoles()` - 사용 가능한 역할 목록

## 최적화 방안

### 1. 즉시 제거 대상
- 중복 기능 메소드들
- 사용 빈도가 매우 낮은 메소드들
- 테스트용으로만 사용되는 메소드들

### 2. 리팩토링 대상
- 유사한 기능을 하는 메소드들을 통합
- 매개변수를 통한 기능 분기 처리

### 3. 모니터링 대상
- 사용 빈도가 중간인 메소드들
- 향후 사용 여부를 모니터링하여 제거 여부 결정

## 다음 단계

1. 서비스 레이어 메소드 분석
2. 리포지토리 레이어 메소드 분석
3. 실제 사용 여부 확인을 위한 로그 분석
4. 제거 대상 메소드 목록 작성
5. 리팩토링 계획 수립
