# Trinity Frontend

Trinity 홈페이지 및 온보딩 시스템 프론트엔드

## 환경 설정

### 1. 환경 변수 파일 생성

프로젝트 루트에서 다음 명령어를 실행하여 환경 변수 파일을 생성하세요:

```bash
# macOS/Linux
cp env.local.example .env.local

# Windows
copy env.local.example .env.local
```

### 2. 환경 변수 설정

`.env.local` 파일을 열어서 다음 값들을 설정하세요:

- `NEXT_PUBLIC_API_BASE_URL`: 백엔드 API 기본 URL (기본값: `http://localhost:8080`)
- `NEXT_PUBLIC_TOSS_CLIENT_KEY`: 토스페이먼츠 클라이언트 키 (테스트 키: `test_ck_jExPeJWYVQ56w5kKdmpqV49R5gvN`)
- `NEXT_PUBLIC_TOSS_TEST_MODE`: 토스페이먼츠 테스트 모드 (기본값: `true`)

### 3. 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

서버는 `http://localhost:3001`에서 실행됩니다.

## 주요 기능

- 홈페이지 (회사 소개, 서비스 소개)
- 온보딩 신청 시스템
- 토스페이먼츠 결제 수단 등록

## 환경 변수 목록

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | 백엔드 API 기본 URL | `http://localhost:8080` |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 토스페이먼츠 클라이언트 키 | - |
| `NEXT_PUBLIC_TOSS_TEST_MODE` | 토스페이먼츠 테스트 모드 | `true` |

## 주의사항

- `.env.local` 파일은 Git에 커밋되지 않습니다 (보안)
- 프로젝트를 새로 클론하거나 리셋한 후에는 반드시 `.env.local` 파일을 다시 생성해야 합니다
- `env.local.example` 파일을 참고하여 환경 변수를 설정하세요
