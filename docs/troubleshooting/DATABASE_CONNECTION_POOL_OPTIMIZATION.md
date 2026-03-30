# 데이터베이스 연결 풀 최적화 가이드

**작성일**: 2025-12-28  
**버전**: 1.0.0  
**상태**: 적용 완료

---

## 📋 문제 상황

### 증상
- MySQL "Too many connections" 오류 발생
- 최대 연결 수(300개) 초과하여 새로운 연결 생성 불가
- JPA EntityManager 트랜잭션 생성 실패 (500 오류)

### 원인 분석
1. **연결 풀 설정 과다**
   - backend-ops: maximum-pool-size: 20
   - 여러 서비스가 동시 실행 시 연결 수 급증
   - 유휴 연결 타임아웃이 길어 연결 해제가 느림

2. **연결 누수 가능성**
   - 트랜잭션 미종료로 인한 연결 유지
   - 장시간 대기 상태의 연결 존재

3. **타임아웃 설정 부적절**
   - idle-timeout: 10분 (600초) - 너무 김
   - max-lifetime: 30분 (1800초) - 너무 김

---

## 🔧 조치 내용

### 1. backend-ops 연결 풀 설정 최적화

**변경 파일**: `backend-ops/src/main/resources/application-dev.yml`

**변경 전**:
```yaml
hikari:
  minimum-idle: 5
  maximum-pool-size: 20
  connection-timeout: 30000
  idle-timeout: 600000  # 10분
  max-lifetime: 1800000  # 30분
  leak-detection-threshold: 60000  # 60초
```

**변경 후**:
```yaml
hikari:
  minimum-idle: 2  # 5 -> 2로 감소
  maximum-pool-size: 5  # 20 -> 5로 감소
  connection-timeout: 5000  # 30초 -> 5초로 단축
  validation-timeout: 3000  # 5초 -> 3초로 단축
  idle-timeout: 180000  # 10분 -> 3분으로 단축
  max-lifetime: 300000  # 30분 -> 5분으로 단축
  leak-detection-threshold: 30000  # 60초 -> 30초로 단축
  keepalive-time: 30000  # 30초 추가
```

### 2. 최적화 효과

- **연결 수 감소**: 서비스당 최대 5개 연결로 제한
- **연결 해제 촉진**: 유휴 연결 3분 후 자동 해제
- **연결 순환**: 연결 수명 5분으로 단축하여 순환 촉진
- **누수 감지 강화**: 30초 내 연결 누수 감지

---

## 📊 연결 풀 설정 가이드

### 권장 설정 값

| 설정 항목 | 권장 값 | 설명 |
|----------|---------|------|
| `minimum-idle` | 2-5 | 최소 유휴 연결 수 (너무 크면 불필요한 연결 유지) |
| `maximum-pool-size` | 5-10 | 최대 연결 수 (서비스 수 × 5-10) |
| `connection-timeout` | 5000 | 연결 대기 시간 (5초, 빠른 실패) |
| `idle-timeout` | 180000 | 유휴 연결 타임아웃 (3분) |
| `max-lifetime` | 300000 | 연결 최대 수명 (5분) |
| `leak-detection-threshold` | 30000 | 연결 누수 감지 (30초) |

### 서비스별 권장 연결 풀 크기

- **메인 서비스** (coresolution): maximum-pool-size: 10-15
- **Ops 서비스** (backend-ops): maximum-pool-size: 5
- **총 연결 수 계산**: (메인 서비스 × 10) + (Ops 서비스 × 5) + 여유분(20%)

예시: 메인 2개 + Ops 1개 = (2 × 10) + (1 × 5) = 25개 + 여유분 20% = 30개
MySQL max_connections는 최소 50 이상 권장

---

## 🔍 연결 누수 방지

### 1. 트랜잭션 관리

```java
@Service
@Transactional  // 클래스 레벨 또는 메서드 레벨
public class MyService {
    
    @Transactional(readOnly = true)  // 읽기 전용 트랜잭션
    public void readData() {
        // ...
    }
    
    @Transactional(rollbackFor = Exception.class)
    public void writeData() {
        // ...
    }
}
```

### 2. 리소스 정리

- `@Transactional` 사용 시 자동으로 리소스 정리
- 수동 Connection 사용 시 `try-with-resources` 사용
- `@Async` 메서드에서 트랜잭션 주의

### 3. 연결 누수 감지

```java
// HikariCP가 자동으로 감지하여 로그 출력
// leak-detection-threshold 설정 값(30초) 이상 연결이 유지되면 경고 로그 출력
```

---

## 📈 모니터링

### 1. 연결 풀 상태 확인 API

```
GET /api/v1/system/connection-pool/status
```

응답:
```json
{
  "poolName": "HikariPool-1",
  "activeConnections": 3,
  "idleConnections": 2,
  "totalConnections": 5,
  "maximumPoolSize": 5,
  "threadsAwaitingConnection": 0
}
```

### 2. MySQL 연결 수 확인

```sql
-- 현재 연결 수 확인
SHOW STATUS LIKE 'Threads_connected';

-- 최대 연결 수 확인
SHOW VARIABLES LIKE 'max_connections';

-- 사용자별 연결 수 확인
SELECT user, COUNT(*) as conn_count 
FROM information_schema.processlist 
GROUP BY user;
```

### 3. 연결 풀 로그 모니터링

- 연결 누수 감지 로그: `Connection leak detection triggered`
- 연결 타임아웃 로그: `Connection timeout`
- 연결 풀 고갈 로그: `Connection pool is full`

---

## 🚨 긴급 조치

### 연결 수 초과 시

1. **오래된 연결 종료**
```sql
-- 대기 중인 쿼리 종료
KILL QUERY <connection_id>;

-- 연결 종료
KILL <connection_id>;
```

2. **서비스 재시작**
```bash
# 서비스별로 순차적 재시작
systemctl restart mindgarden.service
systemctl restart mindgarden-ops.service
```

3. **MySQL 연결 수 임시 증가** (긴급 시)
```sql
SET GLOBAL max_connections = 500;  -- 임시 조치
```

---

## ✅ 체크리스트

### 개발 시
- [ ] 트랜잭션 어노테이션 올바르게 사용
- [ ] Connection 수동 사용 시 try-with-resources 사용
- [ ] 연결 풀 크기 적절히 설정
- [ ] 연결 누수 감지 로그 확인

### 배포 전
- [ ] 연결 풀 설정 검토
- [ ] 서비스별 연결 수 계산
- [ ] MySQL max_connections 충분히 설정
- [ ] 모니터링 도구 설정

### 운영 중
- [ ] 정기적인 연결 풀 상태 확인
- [ ] 연결 누수 로그 모니터링
- [ ] MySQL 연결 수 모니터링
- [ ] 필요 시 연결 풀 크기 조정

---

## 📚 참고 자료

- [HikariCP Configuration](https://github.com/brettwooldridge/HikariCP#configuration-knobs-baby)
- [MySQL Connection Management](https://dev.mysql.com/doc/refman/8.0/en/too-many-connections.html)
- CoreSolution 연결 풀 관리 서비스: `ConnectionPoolManagementService`

---

**문서 버전**: 1.0.0  
**최종 수정일**: 2025-12-28

