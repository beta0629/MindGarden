# MindGarden 상담 관리 시스템

## 🚀 프로젝트 개요

MindGarden은 상담사와 내담자를 위한 통합 상담 관리 시스템입니다. Spring Boot 백엔드와 React 프론트엔드로 구성되어 있으며, OAuth2 소셜 로그인을 지원합니다.

## ✨ 주요 기능

### 🔐 인증 및 보안
- **OAuth2 소셜 로그인**: 카카오, 네이버 지원
- **세션 기반 인증**: Spring Security + HttpSession
- **개인정보 암호화**: AES 암호화로 사용자 데이터 보호
- **CORS 설정**: 프론트엔드-백엔드 간 안전한 통신

### 👥 사용자 관리
- **역할 기반 접근 제어**: CLIENT, CONSULTANT, ADMIN, SUPER_ADMIN
- **프로필 관리**: 사용자 정보 수정 및 관리
- **세션 관리**: 자동 세션 확인 및 관리

### 📱 사용자 인터페이스
- **반응형 디자인**: 태블릿 최적화
- **컴포넌트 기반 구조**: 재사용 가능한 UI 컴포넌트
- **실시간 업데이트**: WebSocket 지원 (구현 예정)

### 🏖️ 휴가 관리 시스템 (NEW!)
- **세밀한 휴가 유형**: 2시간 단위 반반차 휴가 지원
- **관리자 휴가 등록**: 관리자가 상담사 휴가 직접 등록
- **스마트 스케줄 제한**: 휴가 시간대 자동 제한
- **직관적 휴가 표시**: 이모지와 시간 범위로 명확한 표시

## 🏗️ 기술 스택

### Backend
- **Spring Boot 3.2.0**: Java 17 기반
- **Spring Security**: 인증 및 권한 관리
- **Spring Data JPA**: 데이터베이스 접근
- **MySQL**: 데이터베이스
- **Gradle**: 빌드 도구

### Frontend
- **React 19.1.1**: 사용자 인터페이스
- **React Router**: 클라이언트 사이드 라우팅
- **Bootstrap Icons**: 아이콘 라이브러리
- **CSS3**: 스타일링

## 🚀 개발 환경 설정

### 필수 요구사항
- Java 17+
- Node.js 18+
- MySQL 8.0+

### 백엔드 실행
```bash
# 프로젝트 루트에서
mvn spring-boot:run -Dspring.profiles.active=dev
```

### 프론트엔드 실행
```bash
# frontend 디렉토리에서
npm start
```

### 동시 실행 (추천)
```bash
# 프로젝트 루트에서
npm run dev
```

## 📁 프로젝트 구조

```
mindGarden/
├── src/main/java/com/mindgarden/consultation/
│   ├── config/           # Spring Security, CORS 설정
│   ├── controller/       # REST API 컨트롤러
│   ├── entity/          # JPA 엔티티
│   ├── service/         # 비즈니스 로직
│   └── util/            # 암호화, 세션 관리 유틸리티
├── frontend/src/
│   ├── components/      # React 컴포넌트
│   ├── hooks/          # 커스텀 React 훅
│   ├── utils/          # 유틸리티 함수
│   └── styles/         # CSS 스타일
└── docs/               # 프로젝트 문서
```

## 🔧 구현된 기능

### ✅ 완료된 기능
1. **OAuth2 소셜 로그인**
   - 카카오 로그인 구현
   - 네이버 로그인 구현
   - 공통 OAuth2 컨트롤러

2. **세션 관리**
   - Spring Boot 세션 기반 인증
   - React 프론트엔드 세션 관리
   - 자동 세션 확인 및 갱신

3. **사용자 인터페이스**
   - 태블릿 최적화 대시보드
   - 반응형 헤더 및 네비게이션
   - 웰컴 섹션 및 기본 레이아웃

4. **보안 기능**
   - 개인정보 암호화/복호화
   - CORS 설정
   - Spring Security 설정

### 🚧 진행 중인 기능
1. **대시보드 기능**
   - 상담 데이터 표시
   - 통계 및 요약 정보
   - 최근 활동 내역

2. **프로필 관리**
   - 사용자 정보 수정
   - 프로필 이미지 업로드

### 📋 예정된 기능
1. **상담 관리**
   - 상담 일정 관리
   - 상담 기록 관리
   - 알림 시스템

2. **실시간 통신**
   - WebSocket 채팅
   - 실시간 알림

## 🌐 접속 정보

- **백엔드**: http://localhost:8080
- **프론트엔드**: http://localhost:3000
- **API 문서**: http://localhost:8080/api/auth/oauth2/config

## 📝 개발 가이드

### 코드 스타일
- **Java**: Google Java Style Guide 준수
- **JavaScript**: ESLint 규칙 준수
- **CSS**: BEM 방법론 사용

### 커밋 메시지
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 코드 추가
chore: 빌드 프로세스 변경
```

## 🤝 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👥 팀원

- **개발**: MindGarden Team
- **문서**: AI Assistant

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 등록해 주세요.

---

**마지막 업데이트**: 2025년 8월 28일
**버전**: 1.0.0
