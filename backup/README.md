# 🧠 MindGarden - 통합 상담관리 시스템

## 📋 프로젝트 개요

**MindGarden**은 Spring Boot 3.x, Hibernate 6.x, MySQL 8.x, Thymeleaf를 기반으로 한 통합 상담관리 시스템입니다.

## ✨ 주요 기능

- 🔐 **통합 권한 관리 시스템 (RBAC)**
- 📱 **SNS 로그인 통합** (카카오, 네이버, 페이스북, 인스타그램)
- 📊 **모듈화 대시보드** (사용자 맞춤형)
- 📅 **풀 캘린더 시스템** (상담 일정 관리)
- 📝 **상담일지 관리** (세션별 기록)
- 📱 **디바이스별 최적화** (태블릿/홈페이지 분리)
- 🔔 **공통 알림 시스템** (실시간 알림)
- 📡 **AJAX 공통 모듈** (비동기 통신)
- 🎨 **파스텔 톤 디자인** (부드러운 UI/UX)

## 🛠 기술 스택

### Backend
- **Java 17+**
- **Spring Boot 3.2.0**
- **Spring Security 6.x**
- **Spring Data JPA**
- **Hibernate 6.4.0.Final**
- **MySQL 8.0.33**

### Frontend
- **Thymeleaf 3.x**
- **Bootstrap 5**
- **JavaScript (ES6+)**
- **CSS3 (파스텔 톤)**

### Security
- **JWT (JSON Web Token)**
- **OAuth2 (SNS 로그인)**
- **Spring Security Method Security**

### Database
- **MySQL 8.x** (운영/개발)
- **H2 Database** (테스트)

## 🚀 시작하기

### 필수 요구사항
- Java 17 이상
- Maven 3.6 이상
- MySQL 8.0 이상

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/mindgarden.git
cd mindgarden
```

### 2. 데이터베이스 설정
```sql
-- 로컬 개발용 데이터베이스
CREATE DATABASE mind_garden CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 운영용 데이터베이스 (필요시)
CREATE DATABASE mindgarden_consultation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 환경 변수 설정
```bash
# .env 파일 생성 또는 환경 변수 설정
export DB_USERNAME=your_username
export DB_PASSWORD=your_password
export JWT_SECRET=your_jwt_secret
export PERSONAL_INFO_ENCRYPTION_KEY=your_encryption_key
export KAKAO_CLIENT_ID=your_kakao_client_id
export KAKAO_CLIENT_SECRET=your_kakao_client_secret
export NAVER_CLIENT_ID=your_naver_client_id
export NAVER_CLIENT_SECRET=your_naver_client_secret
export FACEBOOK_CLIENT_ID=your_facebook_client_id
export FACEBOOK_CLIENT_SECRET=your_facebook_client_secret
export INSTAGRAM_CLIENT_ID=your_instagram_client_id
export INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
```

### 4. 애플리케이션 실행
```bash
# 로컬 개발 환경 (기본값)
mvn spring-boot:run -Dspring-boot.run.profiles=local

# 운영 환경
mvn spring-boot:run -Dspring-boot.run.profiles=prod

# 또는
mvn clean install
java -jar target/consultation-management-system-1.0.0.jar --spring.profiles.active=local
```

### 5. 접속
- **애플리케이션**: http://localhost:8080
- **Actuator**: http://localhost:8080/actuator
- **H2 Console (테스트)**: http://localhost:8080/h2-console

## 📁 프로젝트 구조

```
src/
├── main/
│   ├── java/
│   │   └── com/mindgarden/consultation/
│   │       ├── config/          # 설정 클래스
│   │       ├── constant/        # 상수 정의
│   │       ├── controller/      # 컨트롤러
│   │       ├── service/         # 서비스
│   │       ├── repository/      # 리포지토리
│   │       ├── entity/          # 엔티티
│   │       ├── dto/             # 데이터 전송 객체
│   │       ├── exception/       # 예외 처리
│   │       ├── util/            # 유틸리티
│   │       ├── security/        # 보안
│   │       └── oauth2/          # OAuth2 설정
│   └── resources/
│       ├── static/              # 정적 리소스
│       │   ├── css/             # 스타일시트
│       │   ├── js/              # 자바스크립트
│       │   ├── images/          # 이미지
│       │   └── fonts/           # 폰트
│       ├── templates/           # Thymeleaf 템플릿
│       └── application.yml      # 설정 파일
└── test/                        # 테스트 코드
```

## 🔧 개발 환경 설정

### 로컬 개발 환경 (기본값)
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### 운영 환경
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

### 빌드 및 배포
```bash
# 로컬 환경용 빌드
mvn clean package -Plocal

# 운영 환경용 빌드
mvn clean package -Pprod

# 운영 환경 실행
java -jar target/consultation-management-system-1.0.0.jar --spring.profiles.active=prod
```

## 📚 문서

- [📋 AI 에이전트 참조 문서](docs/AI_AGENT_REFERENCE.md)
- [🏗 시스템 설계 문서](docs/SYSTEM_DESIGN.md)
- [🔌 API 설계 문서](docs/API_DESIGN.md)
- [🎨 디자인 가이드](docs/DESIGN_GUIDE.md)
- [📁 폴더 구조 문서](docs/FOLDER_STRUCTURE.md)
- [💻 개발 가이드](docs/DEVELOPMENT_GUIDE.md)
- [🌍 환경별 설정 가이드](docs/ENVIRONMENT_SETUP.md)

## 🧪 테스트

```bash
# 전체 테스트 실행
mvn test

# 특정 테스트 실행
mvn test -Dtest=UserServiceTest

# 테스트 커버리지 확인
mvn jacoco:report
```

## 🚀 배포

### Docker 배포
```bash
# Docker 이미지 빌드
docker build -t mindgarden-consultation .

# Docker 컨테이너 실행
docker run -p 8080:8080 mindgarden-consultation
```

### JAR 배포
```bash
mvn clean package -Pprod
java -jar target/consultation-management-system-1.0.0.jar --spring.profiles.active=prod
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👥 팀

- **MindGarden Team** - [mindgarden@example.com](mailto:mindgarden@example.com)

## 🙏 감사의 말

- Spring Boot 팀
- Hibernate 팀
- MySQL 팀
- 모든 오픈소스 기여자들

---

**🚨 중요**: 이 프로젝트는 **문서 우선 원칙 (Document-First Principle)**을 따릅니다. 모든 변경사항은 반드시 문서를 먼저 업데이트한 후에 구현해야 합니다.
