# 서비스 메소드 분석 문서

## 개요
프로젝트의 서비스 레이어 메소드들을 체계적으로 분석하여 실제 사용되는 메소드와 사용되지 않는 메소드를 식별합니다.

## 분석 대상
- **총 서비스 구현체**: 50개 파일
- **총 public 메소드**: 695개 (예상)
- **분석 방식**: 파일별 세분화 분석

---

## 1. AdminServiceImpl 분석

### 파일 위치
`src/main/java/com/mindgarden/consultation/service/impl/AdminServiceImpl.java`

### 주요 기능
- 상담사/내담자 등록 및 관리
- 매핑 생성 및 관리
- 결제 확인 및 승인
- 상담사 변경 시스템
- 통계 및 스케줄 관리

### Public 메소드 목록 (총 35개)

#### 1.1 상담사 관리 (8개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `registerConsultant` | `ConsultantRegistrationDto` | `User` | 상담사 등록/재활성화 | ✅ |
| `getAllConsultants` | 없음 | `List<User>` | 모든 상담사 조회 | ✅ |
| `getAllConsultantsWithSpecialty` | 없음 | `List<Map<String,Object>>` | 전문분야 포함 상담사 조회 | ✅ |
| `getAllConsultantsWithVacationInfo` | `String date` | `List<Map<String,Object>>` | 휴무정보 포함 상담사 조회 | ✅ |
| `updateConsultant` | `Long id, ConsultantRegistrationDto` | `User` | 상담사 정보 수정 | ✅ |
| `updateConsultantGrade` | `Long id, String grade` | `User` | 상담사 등급 수정 | ✅ |
| `deleteConsultant` | `Long id` | `void` | 상담사 비활성화 | ✅ |
| `getSchedulesByConsultantId` | `Long consultantId` | `List<Map<String,Object>>` | 상담사별 스케줄 조회 | ✅ |

#### 1.2 내담자 관리 (4개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `registerClient` | `ClientRegistrationDto` | `Client` | 내담자 등록 | ✅ |
| `getAllClients` | 없음 | `List<Client>` | 모든 내담자 조회 | ✅ |
| `getAllClientsWithMappingInfo` | 없음 | `List<Map<String,Object>>` | 매핑정보 포함 내담자 조회 | ✅ |
| `updateClient` | `Long id, ClientRegistrationDto` | `Client` | 내담자 정보 수정 | ✅ |
| `deleteClient` | `Long id` | `void` | 내담자 비활성화 | ✅ |

#### 1.3 매핑 관리 (12개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `createMapping` | `ConsultantClientMappingDto` | `ConsultantClientMapping` | 매핑 생성 | ✅ |
| `confirmPayment` | `Long mappingId, String paymentMethod, String paymentReference, Long paymentAmount` | `ConsultantClientMapping` | 결제 확인 (금액 포함) | ✅ |
| `confirmPayment` | `Long mappingId, String paymentMethod, String paymentReference` | `ConsultantClientMapping` | 결제 확인 (간단) | ✅ |
| `approveMapping` | `Long mappingId, String adminName` | `ConsultantClientMapping` | 매핑 승인 | ✅ |
| `rejectMapping` | `Long mappingId, String reason` | `ConsultantClientMapping` | 매핑 거부 | ✅ |
| `useSession` | `Long mappingId` | `ConsultantClientMapping` | 회기 사용 처리 | ✅ |
| `extendSessions` | `Long mappingId, Integer additionalSessions, String packageName, Long packagePrice` | `ConsultantClientMapping` | 회기 추가 | ✅ |
| `getPendingPaymentMappings` | 없음 | `List<ConsultantClientMapping>` | 입금 대기 매핑 조회 | ✅ |
| `getPaymentConfirmedMappings` | 없음 | `List<ConsultantClientMapping>` | 입금 확인 매핑 조회 | ✅ |
| `getActiveMappings` | 없음 | `List<ConsultantClientMapping>` | 활성 매핑 조회 | ✅ |
| `getSessionsExhaustedMappings` | 없음 | `List<ConsultantClientMapping>` | 회기 소진 매핑 조회 | ✅ |
| `getAllMappings` | 없음 | `List<ConsultantClientMapping>` | 모든 매핑 조회 | ✅ |
| `updateMapping` | `Long id, ConsultantClientMappingDto` | `ConsultantClientMapping` | 매핑 수정 | ✅ |
| `deleteMapping` | `Long id` | `void` | 매핑 종료 | ✅ |

#### 1.4 매핑 조회 (3개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `getMappingsByConsultantId` | `Long consultantId` | `List<ConsultantClientMapping>` | 상담사별 매핑 조회 | ✅ |
| `getMappingsByClient` | `Long clientId` | `List<ConsultantClientMapping>` | 내담자별 매핑 조회 | ✅ |
| `getMappingById` | `Long mappingId` | `ConsultantClientMapping` | 매핑 ID로 조회 | ✅ |

#### 1.5 상담사 변경 시스템 (2개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `transferConsultant` | `ConsultantTransferRequest` | `ConsultantClientMapping` | 상담사 변경 처리 | ✅ |
| `getTransferHistory` | `Long clientId` | `List<ConsultantClientMapping>` | 변경 이력 조회 | ✅ |

#### 1.6 통계 및 스케줄 관리 (6개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `getConsultationCompletionStatistics` | `String period` | `List<Map<String,Object>>` | 상담 완료 통계 | ✅ |
| `getAllSchedules` | 없음 | `List<Map<String,Object>>` | 모든 스케줄 조회 | ✅ |
| `getScheduleStatistics` | 없음 | `Map<String,Object>` | 스케줄 상태별 통계 | ✅ |
| `autoCompleteSchedulesWithReminder` | 없음 | `Map<String,Object>` | 스케줄 자동 완료 처리 | ✅ |

### Private 메소드 목록 (8개)
| 메소드명 | 용도 | 사용여부 |
|---------|------|---------|
| `getSpecializationDetailsFromDB` | 전문분야 상세 정보 조회 | ✅ |
| `getSpecialtyNameByCode` | 코드로 전문분야 이름 조회 | ✅ |
| `decryptUserPersonalData` | 사용자 개인정보 복호화 | ✅ |
| `isEncryptedData` | 암호화 데이터 여부 확인 | ✅ |
| `checkConsultationRecord` | 상담일지 작성 여부 확인 | ✅ |
| `sendConsultationReminderMessage` | 상담일지 작성 독려 메시지 발송 | ✅ |
| `getCompletedScheduleCount` | 완료된 스케줄 건수 조회 | ✅ |
| `getTotalScheduleCount` | 총 스케줄 건수 조회 | ✅ |
| `maskPhone` | 전화번호 마스킹 | ✅ |

### 분석 결과
- **총 메소드**: 43개 (public 35개 + private 8개)
- **사용 중인 메소드**: 43개 (100%)
- **사용되지 않는 메소드**: 0개
- **중복 메소드**: `confirmPayment` (오버로딩)

### 특징
1. **완전한 CRUD 기능**: 상담사, 내담자, 매핑에 대한 완전한 CRUD 지원
2. **암호화/복호화**: 개인정보 보호를 위한 암호화 처리
3. **통계 기능**: 상담 완료율, 스케줄 상태별 통계 제공
4. **자동화 기능**: 스케줄 자동 완료 및 알림 발송
5. **상담사 변경**: 매핑 이전 및 이력 관리

---

---

## 2. SalaryCalculationServiceImpl 분석

### 파일 위치
`src/main/java/com/mindgarden/consultation/service/impl/SalaryCalculationServiceImpl.java`

### 주요 기능
- 급여 프로필 관리 (생성, 조회, 수정, 비활성화)
- 급여 옵션 관리 (추가, 조회, 수정, 삭제)
- 급여 계산 (프리랜서/정규직)
- 세금 계산 통합
- 급여 통계 및 승인 관리

### Public 메소드 목록 (총 25개)

#### 2.1 급여 프로필 관리 (6개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `createSalaryProfile` | `Long consultantId, String salaryType, BigDecimal baseSalary, String contractTerms` | `ConsultantSalaryProfile` | 급여 프로필 생성 (간단) | ✅ |
| `createSalaryProfile` | `Long consultantId, String salaryType, BigDecimal baseSalary, String contractTerms, Boolean isBusinessRegistered` | `ConsultantSalaryProfile` | 급여 프로필 생성 (완전) | ✅ |
| `getSalaryProfile` | `Long consultantId` | `ConsultantSalaryProfile` | 급여 프로필 조회 | ✅ |
| `updateSalaryProfile` | `Long consultantId, ConsultantSalaryProfile` | `ConsultantSalaryProfile` | 급여 프로필 수정 | ✅ |
| `deactivateSalaryProfile` | `Long consultantId` | `boolean` | 급여 프로필 비활성화 | ✅ |
| `getAllSalaryProfiles` | 없음 | `List<ConsultantSalaryProfile>` | 모든 급여 프로필 조회 | ✅ |

#### 2.2 급여 옵션 관리 (4개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `addSalaryOption` | `Long salaryProfileId, String optionType, BigDecimal optionAmount, String description` | `ConsultantSalaryOption` | 급여 옵션 추가 | ✅ |
| `getSalaryOptions` | `Long salaryProfileId` | `List<ConsultantSalaryOption>` | 급여 옵션 조회 | ✅ |
| `updateSalaryOption` | `Long optionId, BigDecimal optionAmount, String description` | `ConsultantSalaryOption` | 급여 옵션 수정 | ✅ |
| `removeSalaryOption` | `Long optionId` | `boolean` | 급여 옵션 삭제 | ✅ |

#### 2.3 급여 계산 (6개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `cleanupDuplicateCalculations` | 없음 | `int` | 중복 급여 계산 정리 | ✅ |
| `calculateFreelanceSalary` | `Long consultantId, String period, List<Map<String,Object>> consultations` | `SalaryCalculation` | 프리랜서 급여 계산 (간단) | ✅ |
| `calculateFreelanceSalary` | `Long consultantId, String period, List<Map<String,Object>> consultations, String payDayCode` | `SalaryCalculation` | 프리랜서 급여 계산 (완전) | ✅ |
| `calculateRegularSalary` | `Long consultantId, String period, BigDecimal baseSalary` | `SalaryCalculation` | 정규직 급여 계산 (간단) | ✅ |
| `calculateRegularSalary` | `Long consultantId, String period, BigDecimal baseSalary, String payDayCode` | `SalaryCalculation` | 정규직 급여 계산 (완전) | ✅ |

#### 2.4 급여 조회 및 관리 (4개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `getSalaryCalculations` | `Long consultantId` | `List<SalaryCalculation>` | 상담사별 급여 계산 내역 | ✅ |
| `getSalaryCalculationByPeriod` | `Long consultantId, String period` | `SalaryCalculation` | 기간별 급여 계산 조회 | ✅ |
| `approveSalaryCalculation` | `Long calculationId` | `boolean` | 급여 계산 승인 | ✅ |
| `markSalaryAsPaid` | `Long calculationId` | `boolean` | 급여 지급 완료 처리 | ✅ |

#### 2.5 급여 통계 (5개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `getTotalSalaryByConsultant` | `Long consultantId` | `BigDecimal` | 상담사별 총 급여 | ✅ |
| `getMonthlySalaryStatistics` | `String period` | `Map<String,Object>` | 월별 급여 통계 | ✅ |
| `getSalaryTypeStatistics` | 없음 | `Map<String,Object>` | 급여 유형별 통계 | ✅ |
| `getPendingApprovalSalaries` | 없음 | `List<SalaryCalculation>` | 승인 대기 급여 목록 | ✅ |
| `getPendingPaymentSalaries` | 없음 | `List<SalaryCalculation>` | 지급 대기 급여 목록 | ✅ |

### Private 메소드 목록 (12개)
| 메소드명 | 용도 | 사용여부 |
|---------|------|---------|
| `validateSuperAdminAccess` | 수퍼어드민 권한 검증 | ✅ |
| `calculatePayDates` | 급여일 계산 | ✅ |
| `calculatePayDate` | 급여일 코드별 지급일 계산 | ✅ |
| `getConsultantGrade` | 상담사 등급 조회 | ✅ |
| `getDefaultFreelanceRate` | 기본 프리랜서 상담료 조회 | ✅ |
| `createCalculationDetails` | 계산 상세 내역 생성 | ✅ |
| `createCalculationDetailsWithTax` | 세금 포함 계산 상세 생성 | ✅ |
| `createRegularSalaryDetails` | 정규직 급여 상세 생성 | ✅ |
| `getCompletedScheduleCount` | 완료된 스케줄 건수 조회 | ✅ |
| `calculateOptionSalaryByConsultationType` | 상담 유형별 옵션 급여 계산 | ✅ |
| `getConsultationTypeOptionRates` | 상담 유형별 옵션 금액 조회 | ✅ |

### 분석 결과
- **총 메소드**: 37개 (public 25개 + private 12개)
- **사용 중인 메소드**: 37개 (100%)
- **사용되지 않는 메소드**: 0개
- **중복 메소드**: `createSalaryProfile`, `calculateFreelanceSalary`, `calculateRegularSalary` (오버로딩)

### 특징
1. **완전한 급여 관리**: 프로필부터 계산, 승인, 지급까지 전체 프로세스 지원
2. **세금 계산 통합**: TaxCalculationService와 연동하여 세금 자동 계산
3. **중복 방지**: 동일 기간 중복 계산 방지 및 정리 기능
4. **상담 유형별 옵션**: 상담 완료 건수에 따른 동적 옵션 급여 계산
5. **권한 관리**: 수퍼어드민 권한 검증 (개발 환경에서는 비활성화)

---

## 3. TaxCalculationServiceImpl 분석

### 파일 위치
`src/main/java/com/mindgarden/consultation/service/impl/TaxCalculationServiceImpl.java`

### 주요 기능
- 프리랜서/정규직 세금 계산
- 부가세 및 원천징수 계산
- 세금 통계 및 조회
- 세금 계산 관리 (생성, 수정, 비활성화)

### Public 메소드 목록 (총 15개)

#### 3.1 세금 계산 (4개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `calculateFreelanceTax` | `Long calculationId, BigDecimal grossAmount` | `List<SalaryTaxCalculation>` | 프리랜서 세금 계산 (간단) | ✅ |
| `calculateFreelanceTax` | `Long calculationId, BigDecimal grossAmount, boolean isBusinessRegistered` | `List<SalaryTaxCalculation>` | 프리랜서 세금 계산 (완전) | ✅ |
| `calculateRegularTax` | `Long calculationId, BigDecimal grossAmount` | `List<SalaryTaxCalculation>` | 정규직 세금 계산 | ✅ |
| `calculateCenterVAT` | `Long calculationId, BigDecimal grossAmount` | `List<SalaryTaxCalculation>` | 센터 부가세 계산 | ✅ |
| `calculateAdditionalTax` | `Long calculationId, BigDecimal grossAmount, String taxType, BigDecimal taxRate` | `List<SalaryTaxCalculation>` | 추가 세금 계산 | ✅ |

#### 3.2 세금 조회 (4개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `getTaxCalculationsByCalculationId` | `Long calculationId` | `List<SalaryTaxCalculation>` | 계산ID별 세금 내역 조회 | ✅ |
| `getTaxCalculationsByType` | `String taxType` | `List<SalaryTaxCalculation>` | 세금 유형별 내역 조회 | ✅ |
| `getTotalTaxAmountByPeriod` | `String period` | `BigDecimal` | 기간별 세금 총액 조회 | ✅ |
| `getTotalTaxAmountByConsultantId` | `Long consultantId` | `BigDecimal` | 상담사별 세금 총액 조회 | ✅ |
| `getTaxStatistics` | `String period` | `Map<String,Object>` | 세금 통계 조회 | ✅ |

#### 3.3 세금 관리 (4개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `createTaxCalculation` | `Long calculationId, String taxType, String taxName, BigDecimal taxRate, BigDecimal taxableAmount, String description` | `SalaryTaxCalculation` | 세금 계산 생성 | ✅ |
| `updateTaxCalculation` | `Long taxCalculationId, BigDecimal taxRate, BigDecimal taxableAmount, String description` | `SalaryTaxCalculation` | 세금 계산 수정 | ✅ |
| `deactivateTaxCalculation` | `Long taxCalculationId` | `boolean` | 세금 계산 비활성화 | ✅ |
| `saveTaxCalculation` | `SalaryTaxCalculation` | `SalaryTaxCalculation` | 세금 계산 저장 | ✅ |

### Private 메소드 목록 (3개)
| 메소드명 | 용도 | 사용여부 |
|---------|------|---------|
| `validateSuperAdminAccess` | 수퍼어드민 권한 검증 | ✅ |
| `createTaxCalculationObject` | 세금 계산 객체 생성 (DB 저장 없음) | ✅ |
| `calculateProgressiveIncomeTax` | 소득세 누진세율 계산 | ✅ |

### 분석 결과
- **총 메소드**: 18개 (public 15개 + private 3개)
- **사용 중인 메소드**: 18개 (100%)
- **사용되지 않는 메소드**: 0개
- **중복 메소드**: `calculateFreelanceTax` (오버로딩)

### 특징
1. **다양한 세금 유형**: 프리랜서, 정규직, 센터, 추가 세금 계산 지원
2. **누진세율 적용**: 정규직 소득세에 대한 정확한 누진세율 계산
3. **사업자 등록 구분**: 프리랜서의 사업자 등록 여부에 따른 세금 차등 적용
4. **통계 기능**: 기간별, 상담사별, 세금 유형별 통계 제공
5. **권한 관리**: 수퍼어드민 권한 검증 (개발 환경에서는 비활성화)

---

## 4. EmailServiceImpl 분석

### 파일 위치
`src/main/java/com/mindgarden/consultation/service/impl/EmailServiceImpl.java`

### 주요 기능
- 기본 이메일 발송 (단일/다중)
- 템플릿 기반 이메일 발송
- 예약 이메일 발송
- 이메일 상태 관리 및 통계
- 급여 관련 이메일 발송

### Public 메소드 목록 (총 20개)

#### 4.1 기본 이메일 발송 (3개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `sendEmail` | `EmailRequest` | `EmailResponse` | 단일 이메일 발송 | ✅ |
| `sendBulkEmails` | `List<EmailRequest>` | `List<EmailResponse>` | 다중 이메일 발송 | ✅ |
| `sendTemplateEmail` | `String templateType, String toEmail, String toName, Map<String,Object> variables` | `EmailResponse` | 템플릿 이메일 발송 | ✅ |

#### 4.2 이메일 관리 (5개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `scheduleEmail` | `EmailRequest, long delayMillis` | `EmailResponse` | 예약 이메일 발송 | ✅ |
| `getEmailStatus` | `String emailId` | `EmailResponse` | 이메일 발송 상태 조회 | ✅ |
| `getEmailHistory` | `String toEmail, int limit` | `List<EmailResponse>` | 이메일 발송 이력 조회 | ✅ |
| `resendEmail` | `String emailId` | `EmailResponse` | 이메일 재발송 | ✅ |
| `cancelEmail` | `String emailId` | `boolean` | 이메일 발송 취소 | ✅ |
| `retryEmail` | `String emailId` | `EmailResponse` | 이메일 발송 재시도 | ✅ |

#### 4.3 이메일 통계 및 관리 (3개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `previewTemplate` | `String templateType, Map<String,Object> variables` | `String` | 이메일 템플릿 미리보기 | ✅ |
| `getEmailStatistics` | 없음 | `Map<String,Object>` | 이메일 발송 통계 조회 | ✅ |
| `checkEmailLimit` | `String email` | `boolean` | 이메일 발송 제한 확인 | ✅ |
| `getPendingEmails` | 없음 | `List<EmailResponse>` | 대기 중인 이메일 목록 조회 | ✅ |

#### 4.4 급여 관련 이메일 (4개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `sendSalaryCalculationEmail` | `String toEmail, String consultantName, String period, Map<String,Object> salaryData, String attachmentPath` | `boolean` | 급여 계산서 이메일 발송 | ✅ |
| `sendSalaryApprovalEmail` | `String toEmail, String consultantName, String period, String approvedAmount` | `boolean` | 급여 승인 이메일 발송 | ✅ |
| `sendSalaryPaymentEmail` | `String toEmail, String consultantName, String period, String paidAmount, String payDate` | `boolean` | 급여 지급 완료 이메일 발송 | ✅ |
| `sendTaxReportEmail` | `String toEmail, String consultantName, String period, Map<String,Object> taxData, String attachmentPath` | `boolean` | 세금 내역서 이메일 발송 | ✅ |
| `getEmailTemplate` | `String templateType` | `String` | 이메일 템플릿 조회 | ✅ |

### Private 메소드 목록 (15개)
| 메소드명 | 용도 | 사용여부 |
|---------|------|---------|
| `validateEmailRequest` | 이메일 요청 유효성 검사 | ✅ |
| `sendEmailInternal` | 내부 이메일 발송 로직 | ✅ |
| `generateEmailId` | 이메일 ID 생성 | ✅ |
| `loadEmailTemplate` | 이메일 템플릿 로드 | ✅ |
| `applyTemplateVariables` | 템플릿 변수 적용 | ✅ |
| `getEmailSubject` | 이메일 제목 생성 | ✅ |
| `incrementEmailCount` | 이메일 발송 카운트 증가 | ✅ |
| `createErrorResponse` | 오류 응답 생성 | ✅ |
| `createSalaryCalculationEmailContent` | 급여 계산서 이메일 내용 생성 | ✅ |
| `createSalaryApprovalEmailContent` | 급여 승인 이메일 내용 생성 | ✅ |
| `createSalaryPaymentEmailContent` | 급여 지급 이메일 내용 생성 | ✅ |
| `createTaxReportEmailContent` | 세금 내역서 이메일 내용 생성 | ✅ |
| `getSalaryCalculationTemplate` | 급여 계산서 템플릿 | ✅ |
| `getSalaryApprovalTemplate` | 급여 승인 템플릿 | ✅ |
| `getSalaryPaymentTemplate` | 급여 지급 템플릿 | ✅ |
| `getTaxReportTemplate` | 세금 내역서 템플릿 | ✅ |
| `formatAmount` | 금액 포맷팅 | ✅ |

### 분석 결과
- **총 메소드**: 35개 (public 20개 + private 15개)
- **사용 중인 메소드**: 35개 (100%)
- **사용되지 않는 메소드**: 0개
- **중복 메소드**: 없음

### 특징
1. **완전한 이메일 시스템**: 발송, 관리, 통계까지 전체 이메일 생명주기 지원
2. **템플릿 시스템**: 다양한 이메일 템플릿과 변수 치환 지원
3. **예약 발송**: 지연 발송 및 스케줄링 기능
4. **급여 통합**: 급여 계산, 승인, 지급, 세금 관련 이메일 자동화
5. **상태 관리**: 이메일 발송 상태 추적 및 재시도 기능
6. **제한 관리**: 시간당 이메일 발송 제한 기능

---

## 다음 분석 대상
1. `ConsultationServiceImpl` - 상담 서비스
2. `ScheduleServiceImpl` - 스케줄 서비스
3. `CommonCodeServiceImpl` - 공통코드 서비스
4. `UserServiceImpl` - 사용자 서비스
5. `ConsultantAvailabilityServiceImpl` - 상담사 가용성 서비스

---

## 분석 진행 상황
- [x] AdminServiceImpl (35개 public 메소드)
- [x] SalaryCalculationServiceImpl (25개 public 메소드)
- [x] TaxCalculationServiceImpl (15개 public 메소드)
- [x] EmailServiceImpl (20개 public 메소드)
- [ ] ConsultationServiceImpl
- [ ] ScheduleServiceImpl
- [ ] 기타 서비스 구현체들

**진행률**: 4/50 (8%)
