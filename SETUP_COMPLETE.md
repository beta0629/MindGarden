# 홈페이지 프로젝트 로컬 세팅 완료

**작성일**: 2025-12-13  
**상태**: ✅ 완료

## 완료된 작업

1. ✅ Git 클론 완료 (homepage/develop 브랜치)
2. ✅ `.env` 파일 생성 및 개발 DB 연결 설정
3. ✅ `npm install` 완료 (의존성 설치)

## 현재 설정

### 환경 변수 (.env)
- **NODE_ENV**: development
- **포트**: 4000
- **DB 호스트**: beta0629.cafe24.com (개발 서버)
- **DB 이름**: mindgarden_homepage
- **DB 사용자**: mindgarden_dev

## 다음 단계

### 개발 서버 실행

```bash
cd MindGarden_Homepage_temp
npm run dev
```

서버가 http://localhost:4000 에서 실행됩니다.

### 빌드 및 프로덕션 실행

```bash
npm run build
npm start
```

## 참고사항

- 개발 서버 DB 사용 중 (beta0629.cafe24.com)
- 포트: 4000
- 브랜치: homepage/develop

