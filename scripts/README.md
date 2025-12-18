# 서버 실행 스크립트

마인드가든 홈페이지 서버 실행을 위한 스크립트입니다.

## 포트 설정

- **프론트엔드**: 포트 3000
- **코어솔루션 API**: 포트 8080 (외부 서버)
- Next.js는 프론트엔드와 API Routes를 모두 제공하므로 하나의 서버로 실행됩니다

## 사용 방법

### 개발 서버 실행

```bash
./scripts/dev.sh
```

또는

```bash
npm run dev
```

**기능:**
- 포트 3000에서 개발 서버 실행
- 환경 변수 파일(.env.local) 확인
- 포트 충돌 시 포트 변경 옵션 제공

### 프로덕션 서버 실행

```bash
./scripts/start.sh
```

또는

```bash
npm run build
npm run start
```

**기능:**
- 빌드 확인 및 자동 빌드
- 포트 3000에서 프로덕션 서버 실행
- 포트 충돌 시 포트 변경 옵션 제공

## 포트 변경

포트를 변경하려면:

```bash
# 개발 서버 (포트 3002로 변경 예시)
npm run dev -- -p 3002

# 프로덕션 서버 (포트 3002로 변경 예시)
npm run start -- -p 3002
```

## 환경 변수

`.env.local` 파일에 다음 환경 변수를 설정하세요:

```env
NEXT_PUBLIC_API_BASE_URL=http://beta0629.cafe24.com:8080
BLOG_ADMIN_PASSWORD=your-secure-password
```

## 문제 해결

### 포트가 이미 사용 중인 경우

스크립트가 자동으로 포트 변경 옵션을 제공합니다. 또는 수동으로 다른 포트를 지정할 수 있습니다.

### 권한 오류

스크립트 실행 권한이 없는 경우:

```bash
chmod +x scripts/dev.sh
chmod +x scripts/start.sh
```

