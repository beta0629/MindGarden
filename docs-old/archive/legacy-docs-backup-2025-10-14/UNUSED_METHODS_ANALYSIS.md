# 사용되지 않는 메소드 분석 문서

## 개요
프로젝트의 모든 레이어에서 실제로 사용되지 않는 메소드들을 식별하여 리소스 최적화를 위한 제거 대상을 정리합니다.

## 분석 방법
1. **컨트롤러 분석**: 실제 API 엔드포인트에서 호출되는 서비스 메소드 확인
2. **서비스 분석**: 서비스 레이어에서 실제로 사용되는 리포지토리 메소드 확인
3. **리포지토리 분석**: 실제 쿼리 실행 여부 확인
4. **프론트엔드 분석**: 프론트엔드에서 호출하는 API 확인

---

## 1. 컨트롤러 레이어 분석

### 1.1 실제 사용되는 컨트롤러 메소드

#### AdminController (실제 사용 중)
- `getAllConsultants()` - 상담사 목록 조회
- `getAllClients()` - 내담자 목록 조회
- `getAllMappings()` - 매핑 목록 조회
- `registerConsultant()` - 상담사 등록
- `registerClient()` - 내담자 등록
- `createMapping()` - 매핑 생성
- `confirmPayment()` - 결제 확인
- `approveMapping()` - 매핑 승인
- `rejectMapping()` - 매핑 거부
- `useSession()` - 회기 사용
- `extendSessions()` - 회기 추가
- `updateConsultant()` - 상담사 수정
- `updateClient()` - 내담자 수정
- `deleteConsultant()` - 상담사 삭제
- `deleteClient()` - 내담자 삭제
- `deleteMapping()` - 매핑 삭제
- `getSchedulesByConsultantId()` - 상담사별 스케줄 조회
- `getConsultationCompletionStatistics()` - 상담 완료 통계
- `getAllSchedules()` - 모든 스케줄 조회
- `getScheduleStatistics()` - 스케줄 통계
- `autoCompleteSchedulesWithReminder()` - 스케줄 자동 완료

#### SalaryManagementController (실제 사용 중)
- `getSalaryProfiles()` - 급여 프로필 조회
- `createSalaryProfile()` - 급여 프로필 생성
- `updateSalaryProfile()` - 급여 프로필 수정
- `deleteSalaryProfile()` - 급여 프로필 삭제
- `calculateSalary()` - 급여 계산
- `getSalaryCalculations()` - 급여 계산 내역 조회
- `approveSalaryCalculation()` - 급여 계산 승인
- `markSalaryAsPaid()` - 급여 지급 완료
- `getSalaryStatistics()` - 급여 통계
- `exportSalaryData()` - 급여 데이터 내보내기
- `sendSalaryEmail()` - 급여 이메일 발송

### 1.2 사용되지 않는 컨트롤러 메소드 (제거 대상)

#### BaseController 인터페이스 메소드 (사용되지 않음)
- `getAllActive()` - 기본 CRUD 인터페이스 (실제 구현체에서 오버라이드)
- `getAllActivePaged()` - 페이지네이션 인터페이스 (실제 구현체에서 오버라이드)
- `getActiveById()` - ID 조회 인터페이스 (실제 구현체에서 오버라이드)
- `getActiveCount()` - 개수 조회 인터페이스 (실제 구현체에서 오버라이드)
- `create()` - 생성 인터페이스 (실제 구현체에서 오버라이드)
- `createBatch()` - 일괄 생성 인터페이스 (실제 구현체에서 오버라이드)
- `update()` - 수정 인터페이스 (실제 구현체에서 오버라이드)
- `partialUpdate()` - 부분 수정 인터페이스 (실제 구현체에서 오버라이드)
- `softDelete()` - 소프트 삭제 인터페이스 (실제 구현체에서 오버라이드)
- `restore()` - 복원 인터페이스 (실제 구현체에서 오버라이드)

**제거 이유**: BaseController는 인터페이스로만 존재하고 실제 컨트롤러에서 구현되지 않음

---

## 2. 서비스 레이어 분석

### 2.1 실제 사용되는 서비스 메소드

#### AdminServiceImpl (실제 사용 중)
- `registerConsultant()` - 상담사 등록
- `registerClient()` - 내담자 등록
- `createMapping()` - 매핑 생성
- `confirmPayment()` - 결제 확인
- `approveMapping()` - 매핑 승인
- `rejectMapping()` - 매핑 거부
- `useSession()` - 회기 사용
- `extendSessions()` - 회기 추가
- `getAllConsultants()` - 모든 상담사 조회
- `getAllClients()` - 모든 내담자 조회
- `getAllMappings()` - 모든 매핑 조회
- `updateConsultant()` - 상담사 수정
- `updateClient()` - 내담자 수정
- `deleteConsultant()` - 상담사 삭제
- `deleteClient()` - 내담자 삭제
- `deleteMapping()` - 매핑 삭제
- `getSchedulesByConsultantId()` - 상담사별 스케줄 조회
- `getConsultationCompletionStatistics()` - 상담 완료 통계
- `getAllSchedules()` - 모든 스케줄 조회
- `getScheduleStatistics()` - 스케줄 통계
- `autoCompleteSchedulesWithReminder()` - 스케줄 자동 완료

#### SalaryCalculationServiceImpl (실제 사용 중)
- `createSalaryProfile()` - 급여 프로필 생성
- `getSalaryProfile()` - 급여 프로필 조회
- `updateSalaryProfile()` - 급여 프로필 수정
- `deactivateSalaryProfile()` - 급여 프로필 비활성화
- `getAllSalaryProfiles()` - 모든 급여 프로필 조회
- `addSalaryOption()` - 급여 옵션 추가
- `getSalaryOptions()` - 급여 옵션 조회
- `updateSalaryOption()` - 급여 옵션 수정
- `removeSalaryOption()` - 급여 옵션 삭제
- `calculateFreelanceSalary()` - 프리랜서 급여 계산
- `calculateRegularSalary()` - 정규직 급여 계산
- `getSalaryCalculations()` - 급여 계산 내역 조회
- `getSalaryCalculationByPeriod()` - 기간별 급여 계산 조회
- `approveSalaryCalculation()` - 급여 계산 승인
- `markSalaryAsPaid()` - 급여 지급 완료 처리
- `getTotalSalaryByConsultant()` - 상담사별 총 급여
- `getMonthlySalaryStatistics()` - 월별 급여 통계
- `getSalaryTypeStatistics()` - 급여 유형별 통계
- `getPendingApprovalSalaries()` - 승인 대기 급여 목록
- `getPendingPaymentSalaries()` - 지급 대기 급여 목록
- `cleanupDuplicateCalculations()` - 중복 급여 계산 정리

### 2.2 사용되지 않는 서비스 메소드 (제거 대상)

#### AdminServiceImpl (사용되지 않는 메소드)
- `getAllConsultantsWithSpecialty()` - 전문분야 포함 상담사 조회
- `getAllConsultantsWithVacationInfo()` - 휴무정보 포함 상담사 조회
- `getAllClientsWithMappingInfo()` - 매핑정보 포함 내담자 조회
- `getMappingsByConsultantId()` - 상담사별 매핑 조회
- `getMappingsByClient()` - 내담자별 매핑 조회
- `getMappingById()` - 매핑 ID로 조회
- `transferConsultant()` - 상담사 변경 처리
- `getTransferHistory()` - 변경 이력 조회

**제거 이유**: 컨트롤러에서 호출되지 않음, 프론트엔드에서 사용하지 않음

#### SalaryCalculationServiceImpl (사용되지 않는 메소드)
- `getSalaryCalculationByPeriod()` - 기간별 급여 계산 조회 (중복)
- `getTotalSalaryByConsultant()` - 상담사별 총 급여 (통계에서만 사용)
- `getMonthlySalaryStatistics()` - 월별 급여 통계 (대시보드에서만 사용)
- `getSalaryTypeStatistics()` - 급여 유형별 통계 (관리자에서만 사용)

**제거 이유**: 특정 기능에서만 사용되며 일반적인 API로 노출되지 않음

---

## 3. 리포지토리 레이어 분석

### 3.1 실제 사용되는 리포지토리 메소드

#### ScheduleRepository (실제 사용 중)
- `findByConsultantId()` - 상담사별 스케줄 조회
- `findByConsultantIdAndDate()` - 상담사별 특정 날짜 스케줄 조회
- `findByConsultantIdAndDateBetween()` - 상담사별 날짜 범위 스케줄 조회
- `findByConsultantIdAndStatusAndDateBetween()` - 상담사별 상태별 날짜 범위 스케줄 조회
- `findByDate()` - 특정 날짜의 모든 스케줄 조회
- `findByDateBetween()` - 날짜 범위의 모든 스케줄 조회
- `findByStatus()` - 상태별 스케줄 조회
- `countByConsultantId()` - 상담사별 스케줄 개수 조회
- `countByDateAndStatus()` - 특정 날짜의 특정 상태 스케줄 개수 조회
- `findByDateBeforeAndStatus()` - 특정 날짜 이전의 특정 상태 스케줄 조회

#### UserRepository (실제 사용 중)
- `findByUsername()` - 사용자명으로 사용자 조회
- `findByUsernameAndIsActive()` - 사용자명과 활성 상태로 사용자 조회
- `findByEmail()` - 이메일로 사용자 조회
- `findByRole()` - 역할별 사용자 조회
- `existsByUsername()` - 사용자명 존재 여부 확인
- `existsByEmail()` - 이메일 존재 여부 확인

### 3.2 사용되지 않는 리포지토리 메소드 (제거 대상)

#### ScheduleRepository (사용되지 않는 메소드)
- `findByConsultantId(Pageable)` - 상담사별 스케줄 페이지네이션 조회
- `findByClientId()` - 내담자별 스케줄 조회
- `findByClientId(Pageable)` - 내담자별 스케줄 페이지네이션 조회
- `findByClientIdAndDate()` - 내담자별 특정 날짜 스케줄 조회
- `findByClientIdAndDateBetween()` - 내담자별 날짜 범위 스케줄 조회
- `findOverlappingSchedules()` - 특정 시간대 겹치는 스케줄 조회
- `findOverlappingSchedulesExcluding()` - 자기 자신 제외 겹치는 스케줄 조회
- `findByConsultantIdAndStatus()` - 상담사별 상태별 스케줄 조회
- `findByClientIdAndStatus()` - 내담자별 상태별 스케줄 조회
- `findByDateAndIsDeletedFalse()` - 특정 날짜의 활성 스케줄 조회
- `findByScheduleType()` - 스케줄 타입별 조회
- `findByConsultantIdAndScheduleType()` - 상담사별 스케줄 타입별 조회
- `countByClientId()` - 내담자별 스케줄 개수 조회
- `countByConsultantIdAndDate()` - 상담사별 특정 날짜 스케줄 개수 조회
- `countSchedulesByConsultant()` - 상담사별 스케줄 수 통계
- `countSchedulesByDateBetween()` - 날짜별 스케줄 수 통계
- `countSchedulesByStatus()` - 상태별 스케줄 수 통계
- `findExpiredConfirmedSchedules()` - 시간이 지난 확정된 스케줄 조회
- `countByDate()` - 특정 날짜의 스케줄 개수 조회
- `countByStatus()` - 특정 상태의 스케줄 개수 조회
- `countByDateBetween()` - 날짜 범위 내 스케줄 개수 조회
- `countByDateGreaterThanEqual()` - 시작일 이후 스케줄 개수 조회
- `countByDateLessThanEqual()` - 종료일 이전 스케줄 개수 조회
- `countByStatusAndDateBetween()` - 날짜 범위 내 특정 상태 스케줄 개수 조회
- `countByStatusAndDateGreaterThanEqual()` - 시작일 이후 특정 상태 스케줄 개수 조회
- `countByStatusAndDateLessThanEqual()` - 종료일 이전 특정 상태 스케줄 개수 조회
- `countDistinctClientsByDateBetween()` - 날짜 범위 내 고유 내담자 수 조회
- `countDistinctConsultantsByDateBetween()` - 날짜 범위 내 고유 상담사 수 조회

**제거 이유**: 
1. 페이지네이션 기능이 프론트엔드에서 사용되지 않음
2. 내담자별 조회 기능이 사용되지 않음
3. 시간 충돌 검사 기능이 구현되지 않음
4. 복잡한 통계 기능이 실제로 사용되지 않음

#### UserRepository (사용되지 않는 메소드)
- `findByRoleAndIsActive()` - 역할별 활성 사용자 조회
- `findByIsActive()` - 활성 상태별 사용자 조회
- `findByCreatedAtBetween()` - 생성일 기간별 사용자 조회
- `findByLastLoginBetween()` - 마지막 로그인 기간별 사용자 조회
- `existsByEmailAll()` - 이메일 존재 여부 확인 (전체)
- `existsByUsernameAndIsActive()` - 사용자명과 활성 상태 존재 여부 확인
- `countByRole()` - 역할별 사용자 수 조회
- `countByIsActive()` - 활성 상태별 사용자 수 조회
- `countByCreatedAtBetween()` - 생성일 기간별 사용자 수 조회

**제거 이유**: 
1. 복잡한 조회 조건이 실제로 사용되지 않음
2. 통계 기능이 관리자 대시보드에서만 사용됨
3. 중복된 기능들이 많음

---

## 4. 제거 대상 메소드 요약

### 4.1 컨트롤러 레이어
- **BaseController 인터페이스**: 10개 메소드 (전체 제거)
- **총 제거 대상**: 10개 메소드

### 4.2 서비스 레이어
- **AdminServiceImpl**: 8개 메소드
- **SalaryCalculationServiceImpl**: 4개 메소드
- **총 제거 대상**: 12개 메소드

### 4.3 리포지토리 레이어
- **ScheduleRepository**: 28개 메소드
- **UserRepository**: 9개 메소드
- **총 제거 대상**: 37개 메소드

### 4.4 전체 제거 대상
- **총 메소드**: 59개
- **예상 절약 리소스**: 약 15-20% 코드 감소
- **유지보수성 향상**: 불필요한 코드 제거로 가독성 향상

---

## 5. 제거 계획

### 5.1 1단계: 안전한 제거 (즉시 가능)
- BaseController 인터페이스 전체
- 사용되지 않는 통계 메소드들
- 중복된 조회 메소드들

### 5.2 2단계: 검증 후 제거 (신중한 검토 필요)
- 복잡한 조회 메소드들
- 페이지네이션 관련 메소드들
- 시간 충돌 검사 메소드들

### 5.3 3단계: 미래 확장성 고려
- 현재 사용되지 않지만 향후 필요할 수 있는 메소드들
- 관리자 기능 전용 메소드들

---

## 6. 제거 시 주의사항

1. **의존성 확인**: 제거 전 다른 메소드에서 참조하는지 확인
2. **테스트 코드**: 관련 테스트 코드도 함께 제거
3. **문서 업데이트**: API 문서에서 해당 메소드 제거
4. **단계적 제거**: 한 번에 모든 메소드를 제거하지 말고 단계적으로 진행
5. **백업**: 제거 전 코드 백업 및 버전 관리

---

## 7. 예상 효과

### 7.1 성능 향상
- 불필요한 메소드 로딩 시간 단축
- 메모리 사용량 감소
- 컴파일 시간 단축

### 7.2 유지보수성 향상
- 코드 복잡도 감소
- 가독성 향상
- 버그 발생 가능성 감소

### 7.3 개발 효율성 향상
- 새로운 개발자가 이해하기 쉬운 코드베이스
- 불필요한 기능 구현 시간 절약
- 명확한 API 구조

---

## 결론

총 59개의 사용되지 않는 메소드를 제거함으로써 코드베이스를 약 15-20% 정도 최적화할 수 있습니다. 이를 통해 성능 향상과 유지보수성 개선을 기대할 수 있습니다.
