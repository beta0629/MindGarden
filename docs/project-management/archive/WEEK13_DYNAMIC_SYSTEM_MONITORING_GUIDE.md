# Week 13: 동적 시스템 감시 운영 가이드

## 개요

이 문서는 MindGarden 플랫폼의 동적 시스템 감시 시스템 운영 가이드를 제공합니다.

## 1. 시스템 모니터링 API

### 1.1 엔드포인트 목록

**기본 URL**: `/api/admin/monitoring`

**권한**: ADMIN 또는 OPS 역할 필요

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/status` | GET | 시스템 상태 조회 |
| `/memory` | GET | 메모리 사용량 조회 |
| `/cpu` | GET | CPU 사용량 조회 |
| `/database` | GET | 데이터베이스 상태 조회 |
| `/errors` | GET | 최근 에러 로그 조회 |
| `/api-stats` | GET | API 응답 시간 통계 조회 |

### 1.2 사용 예시

```bash
# 시스템 상태 조회
curl -H "Authorization: Bearer {token}" \
  http://localhost:8080/api/admin/monitoring/status

# 메모리 사용량 조회
curl -H "Authorization: Bearer {token}" \
  http://localhost:8080/api/admin/monitoring/memory

# API 응답 시간 통계 조회
curl -H "Authorization: Bearer {token}" \
  http://localhost:8080/api/admin/monitoring/api-stats
```

## 2. Spring Boot Actuator

### 2.1 엔드포인트

| 엔드포인트 | 설명 |
|-----------|------|
| `/actuator/health` | 헬스 체크 |
| `/actuator/info` | 애플리케이션 정보 |
| `/actuator/metrics` | 모든 메트릭 조회 |
| `/actuator/prometheus` | Prometheus 형식 메트릭 |

### 2.2 사용 예시

```bash
# 헬스 체크
curl http://localhost:8080/actuator/health

# 모든 메트릭 조회
curl http://localhost:8080/actuator/metrics

# Prometheus 형식 메트릭
curl http://localhost:8080/actuator/prometheus
```

## 3. 수집되는 메트릭

### 3.1 API 메트릭

- `api.requests`: API 요청 수
  - 태그: `method`, `uri`, `status`
- `api.duration`: API 응답 시간
  - 태그: `method`, `uri`, `status`
- `api.errors`: API 에러 수
  - 태그: `method`, `uri`, `status`, `exception`

### 3.2 시스템 메트릭

- 메모리 사용량 (Heap, Non-Heap)
- CPU 사용량
- 시스템 업타임
- JVM 정보

## 4. 모니터링 대시보드 (향후 구현)

### 4.1 Prometheus 연동

Prometheus 형식 메트릭을 사용하여 Grafana 대시보드를 구축할 수 있습니다.

### 4.2 APM 도구 연동 (선택 사항)

- New Relic
- Datadog
- Elastic APM

## 5. 알림 설정

### 5.1 알림 임계값

- 메모리 사용량: 80% 이상
- API 응답 시간: 5초 이상

### 5.2 알림 수신자 설정

현재는 로그로만 출력됩니다. 향후 이메일 또는 알림톡 발송 기능 추가 예정.

## 6. 문제 해결

### 6.1 모니터링 API 접근 불가

- ADMIN 또는 OPS 역할 확인
- 인증 토큰 확인

### 6.2 메트릭이 수집되지 않음

- 애플리케이션이 실행 중인지 확인
- API 요청이 발생했는지 확인
- Micrometer 설정 확인

## 7. 참고 문서

- 코드 품질 가이드: `docs/mgsb/WEEK13_CODE_QUALITY_GUIDE.md`
- 자동 알림 시스템: `docs/mgsb/WEEK13_ALERT_AND_REVIEW_PROCESS.md`

