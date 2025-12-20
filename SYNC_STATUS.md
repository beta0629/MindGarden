# 홈페이지 프로젝트 동기화 완료

**작성일**: 2025-12-13  
**방법**: Git 클론 (권장 방법)  
**상태**: ✅ 완료

## 클론 정보

- **리포지토리**: https://github.com/beta0629/MindGarden.git
- **브랜치**: `homepage/develop`
- **로컬 경로**: `F:\Trinity\workspace\MindGarden_Homepage_temp`

## 동기화 완료 항목

✅ Git 저장소 클론 완료  
✅ 브랜치: `homepage/develop` 체크아웃 완료  
✅ 모든 소스 코드 파일 동기화 완료  
✅ 개발 서버와 동일한 구조 확인

## 다음 단계

### 1. 환경 변수 설정

`.env` 파일 생성:

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

### 2. 의존성 설치

```bash
cd MindGarden_Homepage_temp
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

서버가 http://localhost:4000 에서 실행됩니다.

## 참고사항

- 개발 서버 경로: `/var/www/homepage`
- 개발 서버 브랜치: `homepage/develop`
- 포트: 4000 (개발/프로덕션 모두)
- 별도 데이터베이스 사용: `mindgarden_homepage`

