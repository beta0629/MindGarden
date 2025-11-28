# Week 13: 코드 품질 모니터링 및 동적 시스템 감시

## Day 1: 코드 품질 모니터링 대시보드 및 하드코딩 감지 시스템

### 완료된 작업

#### 1. 하드코딩 감지 시스템 개선 ✅

**파일**: `scripts/check-hardcoding-enhanced.js`

**개선 사항**:
- ✅ 더 정확한 패턴 감지 (7가지 패턴)
  - 한글 문자열 하드코딩
  - 영문 문자열 하드코딩 (긴 문자열)
  - URL 하드코딩
  - IP 주소 하드코딩 (localhost 제외)
  - 매직 넘버 (큰 숫자)
  - 이메일 주소 하드코딩
  - 파일 경로 하드코딩
- ✅ 상수 파일 자동 인식 (57개 상수 파일 인식)
- ✅ JSON 리포트 자동 생성 (`test-reports/hardcoding/`)
- ✅ 빌드 통합 (Maven verify phase에서 자동 실행)

**검사 결과** (초기 실행):
- 검사 파일: 1,101개
- 오류: 2개 (IP 주소 하드코딩 - localhost 제외 패턴 추가로 해결)
- 경고: 3,487개

#### 2. Maven 빌드 통합 ✅

**파일**: `pom.xml`

**추가된 플러그인**:
```xml
<plugin>
    <groupId>org.codehaus.mojo</groupId>
    <artifactId>exec-maven-plugin</artifactId>
    <version>3.1.0</version>
    <executions>
        <execution>
            <id>check-hardcoding</id>
            <phase>verify</phase>
            <goals>
                <goal>exec</goal>
            </goals>
            <configuration>
                <executable>node</executable>
                <arguments>
                    <argument>scripts/check-hardcoding-enhanced.js</argument>
                </arguments>
            </configuration>
        </execution>
    </executions>
</plugin>
```

**실행 방법**:
```bash
# 빌드 시 자동 실행 (verify phase)
mvn clean verify

# 수동 실행
node scripts/check-hardcoding-enhanced.js
```

### 다음 작업 (Day 1 계속)

#### 3. 코드 품질 모니터링 대시보드 구축

**옵션 1: SonarQube 연동**
- SonarQube 서버 설정
- Maven 플러그인 통합
- 코드 커버리지 추적
- 코드 복잡도 모니터링
- 기술 부채 추적

**옵션 2: CodeClimate 연동**
- CodeClimate 서비스 연동
- GitHub Actions 통합
- 자동 코드 리뷰

**옵션 3: 자체 대시보드 구축**
- 간단한 웹 대시보드
- 코드 품질 메트릭 수집
- 리포트 시각화

### 하드코딩 감지 패턴 상세

#### 패턴 1: 한글 문자열 하드코딩
- **패턴**: `["']([가-힣]{2,})["']`
- **심각도**: Warning
- **제외**: 주석, 어노테이션, 로그 메시지

#### 패턴 2: 영문 문자열 하드코딩 (긴 문자열)
- **패턴**: `["']([A-Za-z\s]{20,})["']`
- **심각도**: Warning
- **제외**: 주석, 어노테이션, 로그 메시지

#### 패턴 3: URL 하드코딩
- **패턴**: `["'](https?:\/\/[^\s"']+)["']`
- **심각도**: Error
- **제외**: 주석, 환경 변수 (`@Value`)

#### 패턴 4: IP 주소 하드코딩
- **패턴**: `["'](\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})["']`
- **심각도**: Error
- **제외**: 주석, localhost (127.0.0.1), 환경 변수

#### 패턴 5: 매직 넘버 (큰 숫자)
- **패턴**: `\b([0-9]{4,})\b`
- **심각도**: Warning
- **제외**: 주석, 버전 번호, 포트 번호, 시간 관련

#### 패턴 6: 이메일 주소 하드코딩
- **패턴**: `["']([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["']`
- **심각도**: Warning
- **제외**: 주석, 환경 변수

#### 패턴 7: 파일 경로 하드코딩
- **패턴**: `["']([\/\\][^\s"']*\.(java|js|jsx|ts|tsx|css|html|xml|yml|yaml|properties|sql))["']`
- **심각도**: Warning
- **제외**: 주석, import/require 문, 환경 변수

### 리포트 형식

**JSON 리포트 위치**: `test-reports/hardcoding/hardcoding-report-{timestamp}.json`

**리포트 구조**:
```json
{
  "timestamp": "2025-11-18T01:22:07.110Z",
  "totalFiles": 1101,
  "errors": [...],
  "warnings": [...],
  "summary": {
    "errors": 2,
    "warnings": 3487
  }
}
```

### 빌드 실패 시 상세 리포트

하드코딩 검사 실패 시:
1. 콘솔에 오류 상세 정보 출력
2. JSON 리포트 자동 생성
3. 빌드 실패 (exit code 1)
4. 오류 위치 (파일명, 라인 번호, 컬럼 번호) 제공

#### 3. 코드 품질 메트릭 수집 시스템 ✅

**파일**: `scripts/collect-code-quality-metrics.js`

**수집 항목**:
- ✅ 파일 수 및 라인 수
- ✅ 테스트 파일 수
- ✅ 하드코딩 통계 (최신 리포트에서 읽기)
- ✅ 코드 커버리지 정보 (기본)

**리포트 위치**: `test-reports/code-quality/code-quality-{timestamp}.json`

**실행 방법**:
```bash
node scripts/collect-code-quality-metrics.js
```

### 다음 단계

- [ ] 코드 품질 모니터링 대시보드 구축 (SonarQube 또는 자체 대시보드) - 옵션
- [ ] 코드 커버리지 추적 설정 (JaCoCo 연동) - 옵션
- [ ] 코드 복잡도 모니터링 설정 - 옵션
- [ ] 기술 부채 추적 설정 - 옵션

**참고**: SonarQube나 CodeClimate 같은 외부 서비스 연동은 선택 사항입니다. 현재 구축한 메트릭 수집 시스템으로도 기본적인 코드 품질 모니터링이 가능합니다.

## Day 2: 동적 시스템 감시 시스템 구축 및 런타임 메트릭 수집

### 완료된 작업

#### 1. 런타임 메트릭 수집 구현 ✅

**파일들**:
- `MetricsConfig.java`: 메트릭 레지스트리 설정
- `MetricsInterceptor.java`: API 응답 시간 모니터링 인터셉터
- `MetricsWebConfig.java`: 인터셉터 등록

**수집 메트릭**:
- ✅ API 요청 수 (`api.requests`)
- ✅ API 응답 시간 (`api.duration`)
- ✅ API 에러 수 (`api.errors`)
- ✅ 메모리 사용량
- ✅ CPU 사용량
- ✅ 시스템 업타임

**엔드포인트**:
- `/actuator/metrics`: 모든 메트릭 조회
- `/actuator/prometheus`: Prometheus 형식 메트릭
- `/api/admin/monitoring/*`: 커스텀 모니터링 엔드포인트

#### 2. 동적 시스템 감시 시스템 구축 ✅

**파일들**:
- `SystemMonitoringService.java`: 시스템 모니터링 서비스 인터페이스
- `SystemMonitoringServiceImpl.java`: 시스템 모니터링 서비스 구현체
- `SystemMonitoringController.java`: 시스템 모니터링 API 컨트롤러

**제공 기능**:
- ✅ 시스템 상태 조회 (`/api/admin/monitoring/status`)
- ✅ 메모리 사용량 조회 (`/api/admin/monitoring/memory`)
- ✅ CPU 사용량 조회 (`/api/admin/monitoring/cpu`)
- ✅ 데이터베이스 상태 조회 (`/api/admin/monitoring/database`)
- ✅ 최근 에러 로그 조회 (`/api/admin/monitoring/errors`)
- ✅ API 응답 시간 통계 조회 (`/api/admin/monitoring/api-stats`)

**보안**: ADMIN 또는 OPS 역할만 접근 가능 (`@PreAuthorize`)

### 다음 단계

- [ ] APM (Application Performance Monitoring) 도구 연동 (선택 사항)
- [ ] 에러 추적 시스템 (Sentry 등) 연동 (선택 사항)
- [ ] 로그 집계 및 분석 시스템 구축 (선택 사항)

