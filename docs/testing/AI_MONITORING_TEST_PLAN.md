# AI 모니터링 시스템 테스트 계획

**작성일**: 2025-12-02  
**버전**: 1.0.0  
**상태**: 진행 예정

---

## 📋 개요

AI 모니터링 시스템 및 스케줄러 표준화 작업의 테스트 계획입니다.

---

## 🎯 테스트 범위

### 1. AI 모니터링 시스템
- 메트릭 수집 (CPU, 메모리, JVM)
- 이상 탐지 (임계값 기반)
- 보안 위협 탐지 (Brute Force, DDoS, SQL Injection)
- 모니터링 API

### 2. 스케줄러 표준화
- 6개 스케줄러 테넌트별 독립 실행
- 실행 로그 저장
- 알림 발송

### 3. 보안 표준화
- JWT 비밀키 검증
- 비밀번호 정책
- 보안 감사 로그
- 로그인 보안 (계정 잠금)

---

## 🧪 테스트 시나리오

### Phase 1: 메트릭 수집 테스트 (30분)

#### 1.1 자동 메트릭 수집 확인
```bash
# 1. 애플리케이션 시작 후 1분 대기
# 2. 데이터베이스 확인
mysql> SELECT * FROM system_metrics 
       WHERE collected_at > NOW() - INTERVAL 5 MINUTE 
       ORDER BY collected_at DESC 
       LIMIT 10;

# 예상 결과: CPU_LOAD, MEMORY_USAGE, JVM_MEMORY 메트릭 존재
```

#### 1.2 메트릭 조회 API 테스트
```bash
# GET /api/v1/monitoring/metrics
curl -X GET "http://localhost:8080/api/v1/monitoring/metrics?minutes=10" \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json"

# 예상 응답:
# {
#   "success": true,
#   "metrics": [...],
#   "count": 30
# }
```

**성공 기준**:
- ✅ 1분마다 3개 메트릭(CPU, 메모리, JVM) 수집
- ✅ API 응답 시간 < 500ms
- ✅ 메트릭 값이 정상 범위 내

---

### Phase 2: 이상 탐지 테스트 (1시간)

#### 2.1 CPU 이상 탐지 시뮬레이션
```bash
# 1. CPU 부하 생성 (테스트 스크립트)
# 2. 5분 대기 (이상 탐지 스케줄러 실행 대기)
# 3. 데이터베이스 확인

mysql> SELECT * FROM ai_anomaly_detection 
       WHERE detection_type = 'PERFORMANCE' 
       AND metric_type = 'CPU_LOAD'
       AND detected_at > NOW() - INTERVAL 10 MINUTE;

# 예상 결과: CPU 임계값(80%) 초과 시 이상 탐지 레코드 생성
```

#### 2.2 이상 탐지 API 테스트
```bash
# GET /api/v1/monitoring/anomalies
curl -X GET "http://localhost:8080/api/v1/monitoring/anomalies?severity=HIGH" \
  -H "Authorization: Bearer {JWT_TOKEN}"

# 예상 응답:
# {
#   "success": true,
#   "anomalies": [...],
#   "count": 1
# }
```

#### 2.3 이상 해결 API 테스트
```bash
# POST /api/v1/monitoring/anomalies/{id}/resolve
curl -X POST "http://localhost:8080/api/v1/monitoring/anomalies/1/resolve" \
  -H "Authorization: Bearer {JWT_TOKEN}"

# 예상 응답:
# {
#   "success": true,
#   "message": "이상이 해결되었습니다."
# }
```

**성공 기준**:
- ✅ CPU 80% 초과 시 5분 내 이상 탐지
- ✅ 심각도 자동 분류 (LOW/MEDIUM/HIGH/CRITICAL)
- ✅ 이상 해결 처리 정상 동작

---

### Phase 3: 보안 위협 탐지 테스트 (1시간)

#### 3.1 Brute Force 공격 탐지
```bash
# 1. 로그인 5회 연속 실패
for i in {1..5}; do
  curl -X POST "http://localhost:8080/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong_password"}'
done

# 2. 위협 탐지 확인
mysql> SELECT * FROM security_threat_detection 
       WHERE threat_type = 'BRUTE_FORCE' 
       AND source_ip = '127.0.0.1';

# 3. IP 차단 확인
redis-cli GET "blocked:ip:127.0.0.1"
```

**성공 기준**:
- ✅ 5회 실패 시 경고 생성
- ✅ 10회 실패 시 IP 자동 차단 (30분)
- ✅ Redis에 차단 정보 저장

#### 3.2 SQL Injection 탐지
```bash
# SQL Injection 패턴 테스트
curl -X GET "http://localhost:8080/api/users?name=' OR '1'='1" \
  -H "Authorization: Bearer {JWT_TOKEN}"

# 위협 탐지 확인
mysql> SELECT * FROM security_threat_detection 
       WHERE threat_type = 'SQL_INJECTION';
```

**성공 기준**:
- ✅ SQL Injection 패턴 즉시 탐지
- ✅ IP 자동 차단
- ✅ 심각도 HIGH 설정

#### 3.3 보안 위협 조회 API
```bash
# GET /api/v1/monitoring/threats
curl -X GET "http://localhost:8080/api/v1/monitoring/threats?hours=24" \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

**성공 기준**:
- ✅ 최근 24시간 위협 목록 조회
- ✅ 차단된 IP 목록 포함

---

### Phase 4: 스케줄러 표준화 테스트 (2시간)

#### 4.1 테넌트별 독립 실행 확인

**테스트 데이터 준비**:
```sql
-- 테스트 테넌트 2개 생성
INSERT INTO tenant (tenant_id, tenant_name, status, is_deleted) 
VALUES 
  ('test-tenant-1', '테스트 테넌트 1', 'ACTIVE', false),
  ('test-tenant-2', '테스트 테넌트 2', 'ACTIVE', false);
```

**스케줄러 실행 확인**:
```bash
# 1. 스케줄러 실행 대기 (또는 수동 실행)
# 2. 실행 로그 확인

mysql> SELECT 
         execution_id, 
         tenant_id, 
         scheduler_name, 
         status, 
         started_at, 
         completed_at
       FROM scheduler_execution_log 
       WHERE started_at > NOW() - INTERVAL 1 HOUR
       ORDER BY started_at DESC;

# 예상 결과: 각 테넌트별로 별도 로그 존재
```

**성공 기준**:
- ✅ 각 테넌트별로 독립 실행
- ✅ 한 테넌트 실패해도 다른 테넌트 계속 실행
- ✅ 실행 로그 정상 저장

#### 4.2 실행 요약 로그 확인
```sql
SELECT 
  execution_id,
  scheduler_name,
  total_tenants,
  success_count,
  failure_count,
  total_duration,
  started_at,
  completed_at
FROM scheduler_execution_summary
WHERE started_at > NOW() - INTERVAL 1 HOUR
ORDER BY started_at DESC;
```

**성공 기준**:
- ✅ 전체 실행 통계 정상 저장
- ✅ 성공/실패 카운트 정확
- ✅ 실행 시간 기록

#### 4.3 개별 스케줄러 테스트

**4.3.1 SalaryBatchScheduler**
```bash
# 급여 배치 실행 가능 여부 확인
# 매일 새벽 2시 실행 또는 수동 실행
```

**4.3.2 WellnessNotificationScheduler**
```bash
# 웰니스 알림 발송 확인
# 매일 오전 9시 실행

mysql> SELECT * FROM system_notification 
       WHERE notification_type = 'WELLNESS' 
       AND created_at > NOW() - INTERVAL 1 DAY;
```

**4.3.3 StatisticsGenerationScheduler**
```bash
# 통계 생성 확인
# 매일 새벽 1시 실행
```

**4.3.4 SessionCleanupScheduler**
```bash
# 세션 정리 확인
# 매 5분마다 실행
```

**4.3.5 ConsultationRecordAlertScheduler**
```bash
# 상담일지 알림 확인
# 매일 오전 9시 실행

# 수동 실행 테스트
curl -X POST "http://localhost:8080/api/admin/consultation-record-alerts/manual-check?daysBack=1" \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

**4.3.6 SchemaChangeDetectionScheduler**
```bash
# 스키마 변경 감지 확인
# 매일 새벽 2시 실행
```

---

### Phase 5: 보안 표준화 테스트 (1시간)

#### 5.1 JWT 비밀키 검증
```bash
# 1. 애플리케이션 시작 시 로그 확인
grep "JWT 비밀키 검증" logs/application.log

# 예상 로그:
# ✅ JWT 비밀키 검증 완료: 길이=64자
# 또는
# ⚠️ JWT 비밀키가 기본값을 사용하고 있습니다
```

**성공 기준**:
- ✅ 비밀키 길이 32자 이상 확인
- ✅ 기본값 사용 시 경고 출력

#### 5.2 비밀번호 정책 테스트
```bash
# 약한 비밀번호로 회원가입 시도
curl -X POST "http://localhost:8080/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123",
    "name": "테스트"
  }'

# 예상 응답: 비밀번호 정책 위반 오류
```

**성공 기준**:
- ✅ 8자 미만 거부
- ✅ 대소문자/숫자/특수문자 필수
- ✅ BCrypt 암호화 적용

#### 5.3 보안 감사 로그 테스트
```bash
# 1. 로그인 실행
curl -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"correct_password"}'

# 2. 감사 로그 확인
mysql> SELECT * FROM security_audit_log 
       WHERE event_type = 'USER_LOGIN' 
       AND user_email = 'test@example.com'
       ORDER BY created_at DESC LIMIT 1;
```

**성공 기준**:
- ✅ 로그인 이벤트 자동 기록
- ✅ IP 주소, User-Agent 저장
- ✅ 실행 시간 측정

#### 5.4 로그인 보안 (계정 잠금) 테스트
```bash
# 1. 5회 연속 로그인 실패
for i in {1..5}; do
  curl -X POST "http://localhost:8080/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done

# 2. Redis 확인
redis-cli GET "login:lock:test@example.com"

# 3. 6번째 로그인 시도
curl -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"correct_password"}'

# 예상 응답: "계정이 잠겼습니다. 30분 후 다시 시도하세요."
```

**성공 기준**:
- ✅ 5회 실패 시 계정 잠금
- ✅ 30분 자동 잠금 해제
- ✅ 잠금 상태에서 로그인 거부

---

### Phase 6: 대시보드 통계 API 테스트 (30분)

#### 6.1 모니터링 대시보드
```bash
# GET /api/v1/monitoring/dashboard
curl -X GET "http://localhost:8080/api/v1/monitoring/dashboard" \
  -H "Authorization: Bearer {JWT_TOKEN}"

# 예상 응답:
# {
#   "success": true,
#   "dashboard": {
#     "unresolvedAnomalies": 2,
#     "recentThreats": 5,
#     "blockedIps": 3,
#     "systemStatus": "WARNING"
#   }
# }
```

**성공 기준**:
- ✅ 미해결 이상 수 정확
- ✅ 최근 24시간 위협 수 정확
- ✅ 차단된 IP 수 정확
- ✅ 시스템 상태 정확 (HEALTHY/WARNING)

---

## 📊 테스트 체크리스트

### AI 모니터링 시스템
- [ ] 메트릭 자동 수집 (1분마다)
- [ ] CPU 이상 탐지 (80% 초과)
- [ ] 메모리 이상 탐지 (85% 초과)
- [ ] JVM 이상 탐지 (90% 초과)
- [ ] Brute Force 탐지 및 차단
- [ ] SQL Injection 탐지 및 차단
- [ ] DDoS 탐지 및 차단 (100회/분)
- [ ] 모니터링 API 정상 동작
- [ ] 대시보드 통계 정확

### 스케줄러 표준화
- [ ] SalaryBatchScheduler 테넌트별 실행
- [ ] WellnessNotificationScheduler 테넌트별 실행
- [ ] StatisticsGenerationScheduler 테넌트별 실행
- [ ] SessionCleanupScheduler 테넌트별 실행
- [ ] ConsultationRecordAlertScheduler 테넌트별 실행
- [ ] SchemaChangeDetectionScheduler 정상 실행
- [ ] 실행 로그 정상 저장
- [ ] 실행 요약 로그 정상 저장
- [ ] 알림 발송 정상 동작 (로그 확인)

### 보안 표준화
- [ ] JWT 비밀키 검증
- [ ] 비밀번호 정책 적용
- [ ] 보안 감사 로그 자동 기록
- [ ] 로그인 5회 실패 시 계정 잠금
- [ ] 30분 후 자동 잠금 해제
- [ ] IP 차단 정상 동작

---

## 🐛 예상 이슈 및 해결 방안

### 이슈 1: 메트릭 수집 안 됨
**원인**: 스케줄러 비활성화  
**해결**: `application.yml`에서 `spring.task.scheduling.enabled=true` 확인

### 이슈 2: 이상 탐지 안 됨
**원인**: 임계값 설정 문제  
**해결**: `AnomalyDetectionService`의 임계값 확인 및 조정

### 이슈 3: IP 차단 안 됨
**원인**: Redis 연결 문제  
**해결**: Redis 서버 상태 확인 및 연결 설정 확인

### 이슈 4: 스케줄러 중복 실행
**원인**: 여러 인스턴스에서 동시 실행  
**해결**: 분산 락 구현 또는 단일 인스턴스에서만 실행

### 이슈 5: 테넌트 컨텍스트 오류
**원인**: `TenantContextHolder` 정리 누락  
**해결**: `finally` 블록에서 `TenantContextHolder.clear()` 확인

---

## 📝 테스트 결과 기록

### 테스트 실행 정보
- **실행일**: ___________
- **실행자**: ___________
- **환경**: Development / Staging / Production
- **버전**: ___________

### 결과 요약
| 테스트 항목 | 성공 | 실패 | 비고 |
|------------|------|------|------|
| 메트릭 수집 | ☐ | ☐ | |
| 이상 탐지 | ☐ | ☐ | |
| 보안 위협 탐지 | ☐ | ☐ | |
| 스케줄러 표준화 | ☐ | ☐ | |
| 보안 표준화 | ☐ | ☐ | |
| API 테스트 | ☐ | ☐ | |

### 발견된 버그
1. ___________
2. ___________
3. ___________

### 개선 사항
1. ___________
2. ___________
3. ___________

---

## 🎯 다음 단계

1. **Phase 1 테스트 완료 후**
   - 메트릭 수집 안정성 확인
   - 데이터 정확성 검증

2. **Phase 2-3 테스트 완료 후**
   - 이상 탐지 임계값 조정
   - 보안 위협 패턴 추가

3. **Phase 4 테스트 완료 후**
   - 나머지 스케줄러 표준화 적용
   - 알림 시스템 실제 연동

4. **Phase 5-6 테스트 완료 후**
   - 프로덕션 배포 준비
   - 모니터링 대시보드 UI 개발

---

**최종 업데이트**: 2025-12-02

