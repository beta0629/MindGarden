# 자동화 테스트 가이드

화면에서 직접 입력하는 번거로움 없이 모든 테스트를 자동으로 실행할 수 있습니다.

## 🚀 빠른 시작

### 전체 테스트 실행 (권장)

```bash
./scripts/run-all-automated-tests.sh
```

이 명령어는 다음을 자동으로 실행합니다:
1. API 테스트 (인증 자동 처리)
2. E2E 테스트 (브라우저 자동화)

### 개별 테스트 실행

#### API 테스트만 실행

```bash
./scripts/run-automated-api-tests.sh
```

**특징:**
- ✅ 자동 로그인 및 세션 관리
- ✅ 모든 API 엔드포인트 자동 테스트
- ✅ 결과 리포트 자동 생성

#### E2E 테스트만 실행

```bash
./scripts/run-e2e-tests.sh
```

**특징:**
- ✅ 브라우저 자동화 (Playwright)
- ✅ 실제 사용자 플로우 테스트
- ✅ 스크린샷 및 비디오 자동 저장

## 📋 테스트 범위

### API 테스트 (`run-automated-api-tests.sh`)

- ✅ 자동 로그인 및 세션 획득
- ✅ 사용자 정보 조회
- ✅ 지점 관리 API (CRUD)
- ✅ 상담사 관리 API
- ✅ 공통코드 API
- ✅ Health Check API

### E2E 테스트 (`run-e2e-tests.sh`)

- ✅ 인증 테스트 (로그인/로그아웃)
- ✅ 관리자 대시보드
- ✅ 지점 관리 (생성/수정/조회)
- ✅ 상담사 대시보드
- ✅ 클라이언트 대시보드

## ⚙️ 설정

### 테스트 계정 변경

기본값:
- 사용자명: `superadmin@mindgarden.com`
- 비밀번호: `admin123`

다른 계정으로 실행:

```bash
TEST_USERNAME=admin@example.com TEST_PASSWORD=password ./scripts/run-all-automated-tests.sh
```

### 서버 URL 변경

```bash
API_BASE_URL=http://localhost:8080 BASE_URL=http://localhost:3000 ./scripts/run-all-automated-tests.sh
```

## 📊 결과 확인

### 리포트 위치

모든 테스트 리포트는 `test-reports/` 디렉토리에 저장됩니다:

```
test-reports/
├── automated-api/
│   └── {timestamp}/
│       ├── test-summary.md
│       └── *.json (API 응답)
├── automated-all/
│   └── {timestamp}/
│       ├── test-summary.md
│       ├── api-tests.log
│       └── e2e-tests.log
└── playwright-report/ (E2E 테스트 HTML 리포트)
```

### E2E 테스트 리포트 보기

```bash
cd e2e-tests
npm run test:report
```

브라우저에서 HTML 리포트가 열립니다.

## 🔧 문제 해결

### 서버가 실행 중이 아닌 경우

```bash
# 백엔드 서버 시작
./scripts/start-backend.sh local

# 프론트엔드 서버 시작
./scripts/start-frontend.sh

# 또는 전체 시작
./scripts/start-all.sh
```

### Playwright 브라우저 설치

```bash
cd e2e-tests
npx playwright install --with-deps chromium
```

### 테스트 실패 시

1. **로그 확인**: `test-reports/automated-all/{timestamp}/` 디렉토리 확인
2. **스크린샷 확인**: E2E 테스트 실패 시 자동으로 스크린샷 저장
3. **비디오 확인**: E2E 테스트 실패 시 자동으로 비디오 저장

## 📝 테스트 추가하기

### API 테스트 추가

`scripts/run-automated-api-tests.sh` 파일에 새로운 테스트 케이스 추가:

```bash
# 예시: 새로운 API 테스트
test_api "GET" "/api/v1/new-endpoint" "200" "새 엔드포인트 테스트"
```

### E2E 테스트 추가

`e2e-tests/tests/` 디렉토리에 새로운 테스트 파일 추가:

```typescript
// e2e-tests/tests/new-feature.spec.ts
import { test, expect } from '@playwright/test';

test('새 기능 테스트', async ({ page }) => {
  // 자동 로그인
  await page.goto('/login');
  await page.fill('input[name="username"]', 'superadmin@mindgarden.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  // 테스트 실행
  // ...
});
```

## 🎯 CI/CD 통합

### GitHub Actions 예시

```yaml
name: Automated Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Start Backend
        run: |
          ./scripts/start-backend.sh local &
          sleep 30
      
      - name: Start Frontend
        run: |
          cd frontend && npm install && npm start &
          sleep 30
      
      - name: Run Automated Tests
        run: ./scripts/run-all-automated-tests.sh
      
      - name: Upload Test Reports
        uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: test-reports/
```

## 📚 관련 문서

- [API 테스트 가이드](docs/mgsb/AUTO_TEST_GUIDE.md)
- [테스트 전략](docs/mgsb/PHASE1_QA_TEST_STRATEGY.md)
- [Playwright 공식 문서](https://playwright.dev)

## 💡 팁

1. **개발 중**: API 테스트만 실행하여 빠른 피드백 (`./scripts/run-automated-api-tests.sh`)
2. **커밋 전**: 전체 테스트 실행 (`./scripts/run-all-automated-tests.sh`)
3. **디버깅**: E2E 테스트를 헤드 모드로 실행 (`cd e2e-tests && npm run test:headed`)

