# E2E 테스트 설정 가이드

## 설치 방법

E2E 테스트를 실행하기 전에 다음 명령어로 패키지를 설치해야 합니다:

```bash
cd e2e-tests
npm install
npx playwright install --with-deps chromium
```

## 타입 오류 해결

현재 TypeScript 파일에서 타입 오류가 발생할 수 있습니다. 이는 패키지가 설치되지 않아서 발생하는 것입니다.

패키지 설치 후 타입 오류가 자동으로 해결됩니다.

## 실행 방법

```bash
# e2e-tests 디렉토리에서
npm test

# 또는 프로젝트 루트에서
./scripts/run-e2e-tests.sh
```

## 참고

- 타입 오류는 `@ts-ignore` 주석으로 임시로 무시됩니다
- 패키지 설치 후에는 타입 오류가 자동으로 해결됩니다
- 실제 테스트 실행 시에는 Playwright가 설치되어 있어야 합니다

