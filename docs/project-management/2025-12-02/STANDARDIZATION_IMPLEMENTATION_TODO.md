# 표준화 구현 TODO 리스트

**작성일**: 2025-12-02  
**상태**: 진행 중

---

## 🎯 우선순위 작업

### Phase 1: 배치 표준화 ⭐⭐⭐⭐⭐ (오늘 진행)

#### 현재 운영 중인 스케줄러 (12개)
1. ✅ `SalaryBatchScheduler.java` - 급여 배치 (매일 새벽 2시)
2. ✅ `SubscriptionSchedulerConfig.java` - 구독 만료 처리 (매일 새벽 2시)
3. ✅ `ScheduleAutoCompleteService.java` - 스케줄 자동 완료 (매 10분)
4. ✅ `StatisticsSchedulerServiceImpl.java` - 통계 생성 (매일 자정 1분, 3분, 5분)
5. ✅ `WellnessNotificationScheduler.java` - 웰니스 알림 (매일 오전 9시)
6. ✅ `ConsultationRecordAlertScheduler.java` - 상담일지 알림 (매일 오전 9시, 매주 월요일 10시, 매월 1일 11시)
7. ✅ `WorkflowAutomationServiceImpl.java` - 워크플로우 자동화 (매 10분, 매시간, 매일 오후 6시, 매월 1일 오전 9시)
8. ✅ `BankTransferServiceImpl.java` - 은행 이체 처리 (매 5분)
9. ✅ `PersonalDataDestructionService.java` - 개인정보 파기 (매일 새벽 3시)
10. ✅ `StatisticsGenerationScheduler.java` - 통계 생성 (매일 새벽 1시, 매시간)
11. ✅ `SessionCleanupScheduler.java` - 세션 정리 (매 5분, 매 1시간)
12. ✅ `SchemaChangeDetectionScheduler.java` - 스키마 변경 감지 (매일 새벽 2시, 매 1시간)

#### 표준화 작업 항목

##### 1. 공통 인프라 구축
- [ ] `SchedulerExecutionLogService.java` 생성
  * 실행 로그 저장
  * 실행 요약 저장
  * 실행 이력 조회
  * 실패 조회
- [ ] `scheduler_execution_log` 테이블 생성
- [ ] `scheduler_execution_summary` 테이블 생성
- [ ] `SchedulerAlertService.java` 생성
  * 실패 알림 발송
  * 성공률 저하 알림

##### 2. 스케줄러별 표준화 적용 (12개)
- [ ] `SalaryBatchScheduler.java` 표준화
  * 테넌트별 독립 실행 로직 추가
  * 실행 로그 저장
  * 에러 처리 개선
  * application.yml 설정 추가
- [ ] `SubscriptionSchedulerConfig.java` 표준화
- [ ] `ScheduleAutoCompleteService.java` 표준화
- [ ] `StatisticsSchedulerServiceImpl.java` 표준화
- [ ] `WellnessNotificationScheduler.java` 표준화
- [ ] `ConsultationRecordAlertScheduler.java` 표준화
- [ ] `WorkflowAutomationServiceImpl.java` 표준화
- [ ] `BankTransferServiceImpl.java` 표준화
- [ ] `PersonalDataDestructionService.java` 표준화
- [ ] `StatisticsGenerationScheduler.java` 표준화
- [ ] `SessionCleanupScheduler.java` 표준화
- [ ] `SchemaChangeDetectionScheduler.java` 표준화

##### 3. 설정 파일 표준화
- [ ] `application.yml`에 스케줄러 설정 추가
  ```yaml
  scheduler:
    salary-batch:
      enabled: ${SCHEDULER_SALARY_BATCH_ENABLED:true}
      cron: ${SCHEDULER_SALARY_BATCH_CRON:0 0 2 * * ?}
    subscription-expiration:
      enabled: ${SCHEDULER_SUBSCRIPTION_EXPIRATION_ENABLED:true}
      cron: ${SCHEDULER_SUBSCRIPTION_EXPIRATION_CRON:0 0 2 * * ?}
    # ... 나머지 스케줄러 설정
  ```

##### 4. 모니터링 API 구축
- [ ] `SchedulerMonitoringController.java` 생성
  * 실행 이력 조회 API
  * 실행 통계 API
  * 최근 실패 조회 API

---

### Phase 2: 보안 표준화 ⭐⭐⭐⭐⭐ (오늘 진행)

#### 1. JWT 보안 강화
- [ ] `JwtSecretValidator.java` 생성
  * JWT 비밀키 길이 검증 (최소 32자)
  * 기본값 사용 경고
  * 환경 변수 필수 확인
- [ ] `StandardJwtService.java` 개선
  * Access Token 표준 생성
  * Refresh Token 표준 생성
  * 토큰 검증 강화
- [ ] `TokenBlacklistService.java` 구현
  * Redis 기반 블랙리스트 관리
  * 로그아웃 시 토큰 블랙리스트 추가
  * 토큰 블랙리스트 확인

#### 2. 비밀번호 보안 강화
- [ ] `PasswordService.java` 생성
  * 비밀번호 정책 검증 (8자 이상, 대소문자/숫자/특수문자)
  * BCrypt 암호화 (Strength: 12)
  * 비밀번호 일치 확인
- [ ] 비밀번호 정책 적용
  * 회원가입 시 검증
  * 비밀번호 변경 시 검증

#### 3. 개인정보 암호화
- [ ] `PersonalDataEncryption.java` 구현
  * AES-256 암호화
  * 암호화 키 환경 변수 관리
  * 암호화 키 길이 검증 (최소 32자)
- [ ] 개인정보 필드 암호화 적용
  * 주민등록번호
  * 전화번호
  * 주소
  * 계좌번호

#### 4. 보안 감사 로그
- [ ] `SecurityAuditAspect.java` 생성
  * @SecurityAudit 어노테이션 처리
  * 보안 이벤트 자동 로깅
  * IP 주소, User Agent 기록
- [ ] `security_audit_log` 테이블 생성
- [ ] 보안 이벤트 타입 정의 (13가지)
  * LOGIN, LOGOUT, LOGIN_FAILED
  * PASSWORD_CHANGE, PASSWORD_RESET
  * PERMISSION_GRANTED, PERMISSION_REVOKED
  * SENSITIVE_DATA_ACCESS, PERSONAL_DATA_EXPORT
  * BULK_DATA_DOWNLOAD
  * SECURITY_CONFIG_CHANGE, KEY_ROTATION
  * SUSPICIOUS_ACTIVITY

#### 5. 로그인 보안
- [ ] `LoginSecurityService.java` 구현
  * 로그인 실패 제한 (5회)
  * 계정 잠금 (30분)
  * Redis 기반 실패 횟수 관리
  * 계정 잠금 알림 발송

#### 6. 키 관리
- [ ] `KeyRotationService.java` 생성
  * JWT 비밀키 로테이션 체크 (90일)
  * 암호화 키 로테이션 체크 (180일)
  * API 키 로테이션 체크 (365일)
  * 로테이션 알림 발송
- [ ] `security_keys` 테이블 생성
  * 키 메타데이터 관리
  * 로테이션 이력 관리

---

### Phase 3: 파일 스토리지 표준화 (다음 작업)

#### 1. 스토리지 전략 구현
- [ ] `StorageStrategy` 인터페이스 생성
- [ ] `LocalStorageStrategy` 구현
- [ ] `S3StorageStrategy` 구현
- [ ] `StorageService` 생성

#### 2. 파일 메타데이터 관리
- [ ] `file_metadata` 테이블 생성
- [ ] UUID 기반 파일명 생성
- [ ] 테넌트별 파일 격리

#### 3. 파일 보안
- [ ] 파일 타입 검증 (화이트리스트)
- [ ] 파일 크기 제한
- [ ] 매직 넘버 검증

---

### Phase 4: 이메일 시스템 표준화 (다음 작업)

#### 1. 이메일 템플릿 관리
- [ ] `email_templates` 테이블 생성
- [ ] 테넌트별 템플릿 커스터마이징
- [ ] 템플릿 변수 렌더링

#### 2. 이메일 발송
- [ ] `StandardEmailService` 구현
- [ ] 비동기 발송
- [ ] 재시도 로직 (최대 3회)
- [ ] 발송 이력 저장

---

## 📊 진행 상황

### 완료된 작업
- ✅ 표준 문서 21개 작성 완료
- ✅ 현재 운영 중인 스케줄러 12개 파악

### 진행 중인 작업
- 🔄 배치 표준화 (Phase 1)
- 🔄 보안 표준화 (Phase 2)

### 예정된 작업
- 📋 파일 스토리지 표준화 (Phase 3)
- 📋 이메일 시스템 표준화 (Phase 4)

---

## 🎯 오늘의 목표

1. ✅ 표준 문서 정독
2. ✅ 현재 스케줄러 파악
3. 🔄 배치 표준화 시작
   - 공통 인프라 구축 (로그 서비스, 테이블)
   - 1-2개 스케줄러 표준화 적용
4. 🔄 보안 표준화 시작
   - JWT 보안 강화
   - 비밀번호 보안 강화
   - 보안 감사 로그 구축

---

**최종 업데이트**: 2025-12-02

