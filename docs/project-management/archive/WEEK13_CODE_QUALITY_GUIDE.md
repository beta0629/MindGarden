# Week 13: 코드 품질 가이드

## 개요

이 문서는 MindGarden 플랫폼의 코드 품질 관리 시스템 사용 가이드를 제공합니다.

## 1. 하드코딩 금지 규칙

### 1.1 금지 사항

다음 항목들은 **절대 하드코딩하지 않습니다**:

1. **문자열 하드코딩 금지**
   - 모든 UI 텍스트는 상수 파일에서 관리
   - 에러 메시지는 상수 또는 리소스 번들 사용
   - 예: `"아이디 또는 비밀번호 틀림"` → `ERROR_MESSAGES.LOGIN_FAILED`

2. **숫자 하드코딩 금지 (매직 넘버)**
   - 매직 넘버는 상수로 정의
   - 예: `setTimeout(3000, ...)` → `TYPING_TIMEOUT_MS = 3000`

3. **URL/경로 하드코딩 금지**
   - 모든 URL은 환경 변수 또는 상수 파일에서 관리
   - 예: `"https://dev.m-garden.co.kr"` → `SERVER_BASE_URL`

4. **IP 주소 하드코딩 금지**
   - 모든 IP 주소는 환경 변수 또는 상수 파일에서 관리
   - 예외: localhost (127.0.0.1)는 허용

5. **설정값 하드코딩 금지**
   - 모든 설정값은 환경 변수 또는 설정 파일에서 관리

### 1.2 하드코딩 검사 실행

#### 로컬 실행
```bash
node scripts/check-hardcoding-enhanced.js
```

#### Maven 빌드 시 자동 실행
```bash
mvn clean verify
```

#### GitHub Actions에서 자동 실행
- Pull Request 생성 시 자동 실행
- 배포 워크플로우에서 자동 실행

### 1.3 리포트 확인

하드코딩 검사 리포트는 다음 위치에 저장됩니다:
- `test-reports/hardcoding/hardcoding-report-{timestamp}.json`

## 2. 코드 품질 메트릭 수집

### 2.1 메트릭 수집 실행

```bash
node scripts/collect-code-quality-metrics.js
```

### 2.2 수집 항목

- 파일 수 및 라인 수
- 테스트 파일 수
- 하드코딩 통계
- 코드 커버리지 정보

### 2.3 리포트 위치

- `test-reports/code-quality/code-quality-{timestamp}.json`

## 3. 코드 품질 리포트 생성

### 3.1 리포트 생성 실행

```bash
node scripts/generate-code-quality-report.js
```

### 3.2 리포트 내용

- 코드 커버리지
- 하드코딩 통계
- 기술 부채 추정
- 코드 복잡도

### 3.3 리포트 위치

- `test-reports/code-quality-reports/code-quality-report-{timestamp}.json`

## 4. 동적 시스템 감시

### 4.1 모니터링 엔드포인트

**권한**: ADMIN 또는 OPS 역할 필요

- `/api/admin/monitoring/status`: 시스템 상태 조회
- `/api/admin/monitoring/memory`: 메모리 사용량 조회
- `/api/admin/monitoring/cpu`: CPU 사용량 조회
- `/api/admin/monitoring/database`: 데이터베이스 상태 조회
- `/api/admin/monitoring/errors`: 최근 에러 로그 조회
- `/api/admin/monitoring/api-stats`: API 응답 시간 통계 조회

### 4.2 Actuator 엔드포인트

- `/actuator/health`: 헬스 체크
- `/actuator/metrics`: 모든 메트릭 조회
- `/actuator/prometheus`: Prometheus 형식 메트릭

## 5. 자동 알림 시스템

### 5.1 알림 유형

1. **코드 품질 저하 알림**
   - 코드 품질 메트릭이 임계값 이하로 떨어질 때

2. **하드코딩 감지 알림**
   - 하드코딩 오류가 발견될 때

3. **시스템 이상 징후 알림**
   - 메모리 사용량이 80% 이상일 때
   - API 응답 시간이 5초 이상일 때

### 5.2 알림 임계값

- 메모리 사용량: 80%
- API 응답 시간: 5초

## 6. CI/CD 파이프라인

### 6.1 코드 품질 검사 워크플로우

**파일**: `.github/workflows/code-quality-check.yml`

**트리거**:
- Pull Request 생성 시
- main/develop 브랜치에 push 시
- 수동 실행

**검사 항목**:
- Checkstyle 검사
- SpotBugs 검사
- 하드코딩 검사
- 테스트 실행
- 코드 품질 메트릭 수집
- 코드 품질 리포트 생성

### 6.2 배포 워크플로우 강화

**파일들**:
- `.github/workflows/deploy-production.yml`
- `.github/workflows/deploy-dev.yml`

**추가된 검사**:
- Checkstyle 검사
- 하드코딩 검사

## 7. 코드 리뷰 프로세스

### 7.1 Pull Request 템플릿

**파일**: `.github/pull_request_template.md`

PR 생성 시 다음 항목을 확인해야 합니다:
- [ ] 코드 품질 검증 통과
- [ ] 하드코딩 검사 통과
- [ ] 테스트 커버리지 유지
- [ ] 상수 사용 확인

### 7.2 코드 리뷰 체크리스트

#### 필수 체크 항목

1. **하드코딩 확인**
   - [ ] 문자열 하드코딩 없음
   - [ ] 숫자 하드코딩 없음
   - [ ] URL/경로 하드코딩 없음

2. **코드 품질**
   - [ ] ESLint/Checkstyle 규칙 준수
   - [ ] 코드 복잡도 적절함
   - [ ] 중복 코드 없음

3. **보안**
   - [ ] SQL Injection 방지
   - [ ] XSS 방지
   - [ ] 인증/권한 검증

4. **성능**
   - [ ] 불필요한 쿼리 없음
   - [ ] 적절한 인덱스 사용
   - [ ] N+1 문제 없음

5. **테스트**
   - [ ] 단위 테스트 작성
   - [ ] 통합 테스트 작성 (필요 시)

## 8. 통합 테스트 실행

### 8.1 전체 통합 테스트

```bash
./scripts/run-week13-integration-tests.sh
```

### 8.2 테스트 항목

1. 하드코딩 검사
2. 코드 품질 메트릭 수집
3. 코드 품질 리포트 생성
4. Maven 빌드 검증
5. 테스트 실행

## 9. 빌드 프로세스

### 9.1 로컬 빌드

```bash
# 코드 품질 검사 포함 빌드
mvn clean verify

# 테스트 포함 빌드
mvn clean package
```

### 9.2 빌드 시 자동 검사

`mvn clean verify` 실행 시 다음 검사가 자동으로 실행됩니다:
1. Checkstyle 검사
2. SpotBugs 검사
3. 하드코딩 검사 (verify phase)

### 9.3 빌드 실패 시

빌드 실패 시 상세 리포트가 생성됩니다:
- 하드코딩 리포트: `test-reports/hardcoding/`
- 코드 품질 리포트: `test-reports/code-quality-reports/`

## 10. 문제 해결

### 10.1 하드코딩 검사 실패

1. 리포트 확인: `test-reports/hardcoding/`
2. 오류 위치 확인 (파일명, 라인 번호)
3. 상수 파일에 값 추가
4. 코드 수정 후 재검사

### 10.2 코드 품질 메트릭 수집 실패

1. 하드코딩 리포트가 있는지 확인
2. 코드 품질 메트릭 리포트가 있는지 확인
3. 스크립트 실행 권한 확인: `chmod +x scripts/collect-code-quality-metrics.js`

### 10.3 빌드 실패

1. Checkstyle 오류 확인
2. SpotBugs 오류 확인
3. 하드코딩 검사 오류 확인
4. 리포트 확인 후 수정

## 11. 참고 문서

- 하드코딩 감지 시스템: `docs/mgsb/WEEK13_CODE_QUALITY_MONITORING.md`
- 자동 알림 시스템: `docs/mgsb/WEEK13_ALERT_AND_REVIEW_PROCESS.md`
- CI/CD 워크플로우: `docs/mgsb/CI_CD_WORKFLOW.md`

