# 개발 서버 모니터링 체크리스트

**작성일**: 2025-12-28  
**버전**: 1.0.0  
**서버**: beta0629.cafe24.com

---

## 📋 개요

개발 서버의 상태를 정기적으로 모니터링하여 문제를 조기에 발견하고 예방하기 위한 체크리스트입니다.

---

## 🔍 일일 체크 항목

### 1. 디스크 사용량

**체크 방법**:
```bash
ssh root@beta0629.cafe24.com "df -h"
```

**경고 기준**: 80% 이상  
**위험 기준**: 90% 이상

**조치**:
- 80% 이상: 로그 파일 정리
- 90% 이상: 즉시 로그 파일 정리 및 불필요한 파일 삭제

**자동 정리**:
- `systemd-tmpfiles-clean.timer`: /tmp 디렉토리 자동 정리
- `logrotate.timer`: 로그 파일 자동 회전

---

### 2. MySQL 연결 수

**체크 방법**:
```bash
ssh root@beta0629.cafe24.com "mysql -u root -e 'SHOW STATUS LIKE \"Threads_connected\"; SHOW VARIABLES LIKE \"max_connections\";'"
```

**경고 기준**: 250개 이상 (max_connections 300 기준)  
**위험 기준**: 290개 이상

**조치**:
- 250개 이상: 연결 풀 설정 확인 및 최적화
- 290개 이상: 오래된 연결 종료 및 서비스 재시작 고려

**사용자별 연결 수 확인**:
```bash
ssh root@beta0629.cafe24.com "mysql -u root -e 'SELECT user, COUNT(*) as conn_count FROM information_schema.processlist GROUP BY user;'"
```

---

### 3. 메모리 사용량

**체크 방법**:
```bash
ssh root@beta0629.cafe24.com "free -h"
```

**경고 기준**: 85% 이상  
**위험 기준**: 95% 이상

**조치**:
- 85% 이상: 메모리 사용량이 많은 프로세스 확인
- 95% 이상: 서비스 재시작 고려

---

### 4. 서비스 프로세스 상태

**체크 방법**:
```bash
ssh root@beta0629.cafe24.com "ps aux | grep java | grep -E '(app.jar|ops)' | grep -v grep"
```

**정상**: 1-2개 프로세스 실행 중  
**경고**: 0개 또는 3개 이상

**조치**:
- 프로세스 없음: 서비스 재시작 필요
- 프로세스 3개 이상: 중복 실행 확인 및 불필요한 프로세스 종료

---

### 5. 서비스 Health Check

**체크 방법**:
```bash
ssh root@beta0629.cafe24.com "curl -s http://localhost:8080/actuator/health"
```

**정상**: `{"status":"UP"}` 또는 `"status":"UP"`  
**비정상**: 응답 없음 또는 `"status":"DOWN"`

**조치**:
- Health Check 실패: 서비스 로그 확인 및 재시작

---

### 6. 로그 파일 크기

**체크 방법**:
```bash
ssh root@beta0629.cafe24.com "du -sh /var/www/mindgarden-dev/logs"
ssh root@beta0629.cafe24.com "find /var/www/mindgarden-dev/logs -name '*.log' -mtime +7 | wc -l"
```

**경고 기준**: 로그 디렉토리 1GB 이상 또는 7일 이상 된 로그 100개 이상

**조치**:
- 7일 이상 된 로그 파일 정리
- 로그 로테이션 설정 확인

---

## 🚨 주간 체크 항목

### 1. 데이터베이스 연결 풀 상태

**체크 방법**:
- API 호출: `GET /api/v1/system/connection-pool/status`
- 또는 서버 로그에서 연결 누수 감지 로그 확인

**확인 사항**:
- 활성 연결 수가 최대 풀 크기를 초과하지 않는지
- 연결 누수 경고 로그가 있는지
- 대기 중인 스레드가 있는지

---

### 2. 에러 로그 패턴 분석

**체크 방법**:
```bash
ssh root@beta0629.cafe24.com "grep -i 'error\|exception\|failed' /var/www/mindgarden-dev/logs/*.log | tail -100"
```

**확인 사항**:
- 반복되는 에러 패턴
- 새로운 에러 유형
- 에러 발생 빈도

---

### 3. 서비스 응답 시간

**체크 방법**:
- API 응답 시간 모니터링
- 느린 쿼리 로그 확인

**경고 기준**: 평균 응답 시간 1초 이상

---

## 🛠️ 자동화 스크립트

### 상태 체크 스크립트

**위치**: `scripts/check-dev-server-health.sh`

**사용법**:
```bash
./scripts/check-dev-server-health.sh
```

**체크 항목**:
1. 디스크 사용량
2. /tmp 디스크 공간
3. MySQL 연결 수
4. 메모리 사용량
5. 서비스 프로세스
6. 서비스 Health Check
7. 로그 파일 크기
8. 큰 디렉토리
9. 최근 에러 로그

---

## 📊 모니터링 대시보드 (향후 계획)

### 체크리스트 자동화

- Cron 작업으로 일일 체크 실행
- 결과를 Slack/이메일로 전송
- Grafana 대시보드 연동

---

## 🔧 문제 발생 시 조치 방법

### 디스크 공간 부족

1. 로그 파일 정리
```bash
ssh root@beta0629.cafe24.com "find /var/www/mindgarden-dev/logs -name '*.log' -mtime +7 -delete"
```

2. /tmp 디렉토리 정리
```bash
ssh root@beta0629.cafe24.com "systemctl start systemd-tmpfiles-clean.service"
```

### MySQL 연결 수 초과

1. 오래된 연결 종료
```bash
ssh root@beta0629.cafe24.com "mysql -u root -e \"KILL QUERY <connection_id>;\""
```

2. 서비스 재시작
```bash
ssh root@beta0629.cafe24.com "cd /var/www/mindgarden-dev && pkill -15 -f 'app.jar' && sleep 5 && nohup java -jar app.jar --spring.profiles.active=dev > logs/ops-backend.log 2>&1 &"
```

3. MySQL 연결 수 증가 (임시 조치)
```bash
ssh root@beta0629.cafe24.com "mysql -u root -e \"SET GLOBAL max_connections = 500;\""
```

### 서비스 다운

1. 프로세스 확인
```bash
ssh root@beta0629.cafe24.com "ps aux | grep java | grep app.jar"
```

2. 로그 확인
```bash
ssh root@beta0629.cafe24.com "tail -100 /var/www/mindgarden-dev/logs/ops-backend.log"
```

3. 서비스 재시작
```bash
ssh root@beta0629.cafe24.com "cd /var/www/mindgarden-dev && nohup java -jar app.jar --spring.profiles.active=dev > logs/ops-backend.log 2>&1 &"
```

---

## ✅ 체크리스트

### 일일 체크 (매일 오전 9시)

- [ ] 디스크 사용량 확인 (< 80%)
- [ ] MySQL 연결 수 확인 (< 250)
- [ ] 메모리 사용량 확인 (< 85%)
- [ ] 서비스 프로세스 확인 (1-2개)
- [ ] Health Check 확인 (정상)
- [ ] 최근 에러 로그 확인

### 주간 체크 (매주 월요일)

- [ ] 데이터베이스 연결 풀 상태 확인
- [ ] 에러 로그 패턴 분석
- [ ] 서비스 응답 시간 확인
- [ ] 로그 파일 크기 확인 및 정리
- [ ] 큰 디렉토리 확인 및 정리

---

## 📈 경고 기준 요약

| 항목 | 경고 기준 | 위험 기준 | 조치 |
|------|----------|----------|------|
| 디스크 사용률 | 80% | 90% | 로그 정리 |
| MySQL 연결 수 | 250/300 | 290/300 | 연결 풀 최적화 |
| 메모리 사용률 | 85% | 95% | 서비스 재시작 |
| 서비스 프로세스 | 0개 또는 3개 이상 | - | 재시작 또는 정리 |
| Health Check | 실패 | - | 로그 확인 및 재시작 |

---

**문서 버전**: 1.0.0  
**최종 수정일**: 2025-12-28

