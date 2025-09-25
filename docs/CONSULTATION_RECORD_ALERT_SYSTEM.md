# 상담일지 미작성 알림 시스템

## 📝 개요

상담일지 기록의 중요성을 고려하여, 상담 완료 후 상담일지가 미작성된 경우 자동으로 알림을 발송하는 시스템을 PL/SQL 기반으로 구현했습니다.

## 🚀 주요 기능

### 1. 자동 감지 및 알림 생성
- 상담 완료 후 상담일지 미작성시 자동 감지
- HIGH 레벨 알림으로 즉시 알림 생성
- 상담사별 개별 알림 생성

### 2. 스케줄러 기반 자동 확인
- **매일 오전 9시**: 전날 상담일지 미작성 확인
- **매주 월요일 오전 10시**: 지난주 전체 상담일지 확인
- **매월 1일 오전 11시**: 지난달 전체 상담일지 확인

### 3. 자동 알림 해제
- 상담일지 작성 완료시 자동으로 해당 알림 해제
- 상담사별 일괄 알림 해제 기능

### 4. 통계 및 모니터링
- 상담일지 작성 완성률 통계
- 상담사별 미작성 현황 조회
- 지점별 필터링 지원

## 📊 PL/SQL 프로시저

### 1. ValidateConsultationRecordBeforeCompletion
- **목적**: 스케줄 완료 전 상담일지 작성 여부 검증
- **파라미터**: 
  - `p_consultant_id` (BIGINT): 상담사 ID
  - `p_session_date` (DATE): 상담 날짜
  - `p_has_record` (TINYINT): 작성 여부 (OUT)
  - `p_message` (VARCHAR): 결과 메시지 (OUT)
- **기능**: 
  - 해당 상담사의 특정 날짜 상담일지 작성 여부 확인
  - 미작성 시 스케줄 완료 차단
  - 작성 완료 시 스케줄 완료 허용

### 2. CreateConsultationRecordReminder
- **목적**: 상담일지 미작성 알림 생성
- **파라미터**: 
  - `p_schedule_id` (BIGINT): 스케줄 ID
  - `p_consultant_id` (BIGINT): 상담사 ID
  - `p_client_id` (BIGINT): 고객 ID
  - `p_session_date` (DATE): 상담 날짜
  - `p_title` (VARCHAR): 알림 제목
- **기능**: 
  - HIGH 우선순위 알림 생성
  - 상담사별 개별 알림 관리

### 3. ProcessScheduleAutoCompletion
- **목적**: 스케줄 자동 완료 처리 (상담일지 검증 포함)
- **파라미터**: 
  - `p_schedule_id` (BIGINT): 스케줄 ID
  - `p_consultant_id` (BIGINT): 상담사 ID
  - `p_session_date` (DATE): 상담 날짜
  - `p_force_complete` (BOOLEAN): 강제 완료 여부
- **기능**: 
  - 상담일지 작성 여부 자동 확인
  - 미작성 시 알림 생성 후 완료 차단
  - 작성 완료 시 스케줄 상태 완료로 변경

### 4. ProcessBatchScheduleCompletion
- **목적**: 지점별 일괄 스케줄 완료 처리
- **파라미터**: 
  - `p_branch_code` (VARCHAR): 지점 코드
- **기능**: 
  - 해당 지점의 모든 완료 대상 스케줄 일괄 처리
  - 상담일지 검증 후 완료 처리

### 5. CheckMissingConsultationRecords
```sql
-- 상담일지 미작성 확인 및 알림 생성
CALL CheckMissingConsultationRecords(
    '2025-01-10',  -- 확인할 날짜
    'BRANCH001',   -- 지점 코드 (NULL이면 전체)
    @missing_count,
    @alerts_created,
    @success,
    @message
);
```

### 2. GetMissingConsultationRecordAlerts
```sql
-- 상담일지 미작성 알림 조회
CALL GetMissingConsultationRecordAlerts(
    'BRANCH001',   -- 지점 코드
    '2025-01-01',  -- 시작 날짜
    '2025-01-31',  -- 종료 날짜
    @alerts,
    @total_count,
    @success,
    @message
);
```

### 3. ResolveConsultationRecordAlert
```sql
-- 상담일지 작성 완료시 알림 해제
CALL ResolveConsultationRecordAlert(
    123,           -- 상담 ID
    '상담사이름',   -- 해제자
    @success,
    @message
);
```

### 4. GetConsultationRecordMissingStatistics
```sql
-- 상담일지 미작성 통계 조회
CALL GetConsultationRecordMissingStatistics(
    'BRANCH001',   -- 지점 코드
    '2025-01-01',  -- 시작 날짜
    '2025-01-31',  -- 종료 날짜
    @total_consultations,
    @missing_records,
    @completion_rate,
    @consultant_breakdown,
    @success,
    @message
);
```

### 5. AutoCreateMissingConsultationRecordAlerts
```sql
-- 상담일지 미작성 알림 자동 생성 (스케줄러용)
CALL AutoCreateMissingConsultationRecordAlerts(
    7,             -- 며칠 전까지 확인할지
    @processed_days,
    @total_alerts_created,
    @success,
    @message
);
```

## 🔧 API 엔드포인트

### 1. 상담일지 미작성 확인
```http
POST /api/admin/consultation-record-alerts/check-missing
Content-Type: application/json

{
  "checkDate": "2025-01-10",
  "branchCode": "BRANCH001"
}
```

### 2. 상담일지 미작성 알림 조회
```http
GET /api/admin/consultation-record-alerts/missing-alerts?branchCode=BRANCH001&startDate=2025-01-01&endDate=2025-01-31
```

### 3. 상담일지 알림 해제
```http
POST /api/admin/consultation-record-alerts/resolve-alert
Content-Type: application/json

{
  "consultationId": 123,
  "resolvedBy": "상담사이름"
}
```

### 4. 상담일지 미작성 통계 조회
```http
GET /api/admin/consultation-record-alerts/statistics?branchCode=BRANCH001&startDate=2025-01-01&endDate=2025-01-31
```

### 5. 상담사별 미작성 현황 조회
```http
GET /api/admin/consultation-record-alerts/consultant-missing?consultantId=456&startDate=2025-01-01&endDate=2025-01-31
```

### 6. 수동 상담일지 미작성 확인
```http
POST /api/admin/consultation-record-alerts/manual-check?daysBack=7
```

### 7. 시스템 상태 확인
```http
GET /api/admin/consultation-record-alerts/status
```

## ⚙️ 설정 및 배포

### 1. PL/SQL 프로시저 적용
```bash
# 운영 데이터베이스에 프로시저 적용
mysql -h beta74.cafe24.com -u mindgarden -p mind_garden < src/main/resources/sql/procedures/consultation_record_alert_procedures.sql
```

### 2. 스케줄러 활성화 확인
```java
// ConsultationManagementApplication.java에 @EnableScheduling이 있는지 확인
@EnableScheduling
@SpringBootApplication
public class ConsultationManagementApplication {
    // ...
}
```

### 3. 공통 코드 설정
상담일지 미작성 알림과 관련된 공통 코드가 필요합니다:

```sql
-- 알림 유형 추가
INSERT INTO common_codes (code_group, code_value, code_name, code_korean_name, is_active, created_at) VALUES
('ALERT_TYPE', 'MISSING_CONSULTATION_RECORD', 'Missing Consultation Record', '상담일지 미작성', TRUE, NOW());

-- 알림 레벨 추가
INSERT INTO common_codes (code_group, code_value, code_name, code_korean_name, is_active, created_at) VALUES
('ALERT_LEVEL', 'HIGH', 'High Priority', '높음', TRUE, NOW());
```

## 📈 모니터링 및 관리

### 1. 알림 현황 확인
- 관리자 대시보드에서 상담일지 미작성 알림 현황 확인
- 상담사별 미작성 현황 모니터링
- 완성률 통계 추적

### 2. 알림 해제 관리
- 상담일지 작성 완료시 자동 해제
- 수동으로 개별 또는 일괄 해제 가능
- 해제 이력 추적

### 3. 성능 최적화
- PL/SQL 프로시저로 데이터베이스 레벨에서 처리
- 인덱스 최적화로 빠른 조회
- 배치 처리로 시스템 부하 최소화

## 🔍 문제 해결

### 1. 알림이 생성되지 않는 경우
- 상담 상태가 'COMPLETED'인지 확인
- 상담일지가 실제로 미작성인지 확인
- 스케줄러가 정상 작동하는지 확인

### 2. 알림이 해제되지 않는 경우
- 상담일지 작성이 정상적으로 완료되었는지 확인
- 상담 ID가 정확한지 확인
- PL/SQL 프로시저가 정상 작동하는지 확인

### 3. 성능 문제
- 데이터베이스 인덱스 확인
- PL/SQL 프로시저 실행 계획 확인
- 스케줄러 실행 시간 조정

## 📋 체크리스트

- [ ] PL/SQL 프로시저 데이터베이스 적용
- [ ] 스케줄러 활성화 확인
- [ ] 공통 코드 설정
- [ ] API 엔드포인트 테스트
- [ ] 알림 생성 테스트
- [ ] 알림 해제 테스트
- [ ] 통계 조회 테스트
- [ ] 모니터링 대시보드 연동

## 🎯 기대 효과

1. **상담일지 누락 방지**: 자동 감지로 상담일지 누락을 완전히 방지
2. **업무 효율성 향상**: 자동화된 알림으로 수동 확인 작업 감소
3. **품질 관리 강화**: 상담일지 작성 완성률 향상
4. **관리 편의성**: 실시간 모니터링 및 통계 제공
5. **데이터 무결성**: 상담 완료 후 필수 문서 작성 보장

---

**작성일**: 2025-01-11  
**작성자**: MindGarden Development Team  
**버전**: 1.0.0
