# 홈페이지 프로젝트 다음 단계 가이드

**작성일**: 2025-12-13  
**현재 상태**: Git 클론 완료 ✅

## 다음 단계 체크리스트

### 1단계: 환경 변수 설정 ✅ 우선순위 높음

`.env` 파일 생성 (루트 디렉토리에):

```bash
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:4000
PORT=4000
NEXT_PUBLIC_PORT=4000

# 홈페이지 전용 데이터베이스
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=homepage_user
DB_PASSWORD=your_password_here
DB_NAME=mindgarden_homepage

# Blog Admin
BLOG_ADMIN_PASSWORD=admin123
```

**주의**: 실제 DB 비밀번호로 변경 필요

### 2단계: 의존성 설치 ✅ 필수

```bash
cd MindGarden_Homepage_temp
npm install
```

### 3단계: 데이터베이스 확인

- 홈페이지 전용 데이터베이스가 생성되어 있는지 확인
- 개발 서버의 DB 정보 확인 후 `.env` 파일 업데이트

### 4단계: 개발 서버 실행 및 테스트

```bash
npm run dev
```

서버가 http://localhost:4000 에서 실행되는지 확인

### 5단계: 빌드 테스트 (선택사항)

```bash
npm run build
npm start
```

## 개발 서버 정보 (참고)

- **서버**: beta0629.cafe24.com
- **경로**: /var/www/homepage
- **브랜치**: homepage/develop
- **포트**: 4000

## 문제 해결

### npm install 오류 시
- Node.js 버전 확인 (18+ 권장)
- `npm cache clean --force` 실행 후 재시도

### 데이터베이스 연결 오류 시
- `.env` 파일의 DB 정보 확인
- 개발 서버의 실제 DB 설정 확인 필요

