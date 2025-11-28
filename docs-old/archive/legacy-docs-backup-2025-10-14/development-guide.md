# MindGarden 개발 가이드

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [개발 환경 설정](#개발-환경-설정)
3. [아키텍처 개요](#아키텍처-개요)
4. [백엔드 개발](#백엔드-개발)
5. [프론트엔드 개발](#프론트엔드-개발)
6. [데이터베이스](#데이터베이스)
7. [보안 설정](#보안-설정)
8. [배포 가이드](#배포-가이드)

## 🚀 프로젝트 개요

MindGarden은 상담사와 내담자를 위한 통합 상담 관리 시스템입니다.

### 주요 특징
- **OAuth2 소셜 로그인**: 카카오, 네이버 지원
- **세션 기반 인증**: Spring Security + HttpSession
- **개인정보 암호화**: AES 암호화로 사용자 데이터 보호
- **반응형 디자인**: 태블릿 최적화

### 기술 스택
- **Backend**: Spring Boot 3.2.0, Java 17
- **Frontend**: React 19.1.1
- **Database**: MySQL 8.0
- **Build**: Gradle, npm

## 🛠️ 개발 환경 설정

### 필수 요구사항
```bash
# Java
java -version  # Java 17+

# Node.js
node --version  # Node.js 18+

# MySQL
mysql --version  # MySQL 8.0+
```

### 프로젝트 클론 및 설정
```bash
# 프로젝트 클론
git clone <repository-url>
cd mindGarden

# 백엔드 의존성 설치
./gradlew build

# 프론트엔드 의존성 설치
cd frontend
npm install
cd ..
```

### 개발 서버 실행
```bash
# 방법 1: 개별 실행
# 터미널 1 - 백엔드
mvn spring-boot:run -Dspring.profiles.active=dev

# 터미널 2 - 프론트엔드
cd frontend && npm start

# 방법 2: 동시 실행 (추천)
npm run dev
```

## 🏗️ 아키텍처 개요

### 전체 구조
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │  Spring Boot    │    │     MySQL      │
│   (Port 3000)   │◄──►│   (Port 8080)   │◄──►│   Database     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 컴포넌트 구조
```
frontend/src/
├── components/          # React 컴포넌트
│   ├── layout/         # 레이아웃 컴포넌트
│   ├── dashboard/      # 대시보드 컴포넌트
│   ├── auth/           # 인증 컴포넌트
│   └── profile/        # 프로필 컴포넌트
├── hooks/              # 커스텀 React 훅
├── utils/              # 유틸리티 함수
└── styles/             # CSS 스타일

src/main/java/
├── config/             # Spring 설정
├── controller/         # REST API 컨트롤러
├── entity/            # JPA 엔티티
├── service/           # 비즈니스 로직
└── util/              # 유틸리티 클래스
```

## 🔧 백엔드 개발

### Spring Boot 설정

#### SecurityConfig.java
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(authz -> authz
                .anyRequest().permitAll()
            );
        return http.build();
    }
}
```

#### CORS 설정
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList(
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ));
    configuration.setAllowCredentials(true);
    // ... 기타 설정
    return source;
}
```

### OAuth2 구현

#### OAuth2Controller.java
```java
@RestController
@RequestMapping("/api/auth/oauth2")
public class OAuth2Controller {
    
    @GetMapping("/callback")
    public ResponseEntity<?> oauth2Callback(
            @RequestParam String provider,
            @RequestParam String code, 
            HttpServletRequest request) {
        // OAuth2 콜백 처리
        // 사용자 정보 저장 및 세션 설정
    }
}
```

#### 개인정보 암호화
```java
@Component
public class PersonalDataEncryptionUtil {
    
    public String encrypt(String plainText) {
        // AES 암호화 구현
    }
    
    public String decrypt(String encryptedText) {
        // AES 복호화 구현
    }
}
```

### 세션 관리

#### SessionUtils.java
```java
@Component
public class SessionUtils {
    
    public static User getCurrentUser(HttpSession session) {
        return (User) session.getAttribute("user");
    }
    
    public static void setCurrentUser(HttpSession session, User user) {
        session.setAttribute("user", user);
    }
}
```

#### AuthController.java
```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @GetMapping("/current-user")
    public ResponseEntity<SessionInfo.UserInfo> getCurrentUser(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user != null) {
            SessionInfo.UserInfo userInfo = new SessionInfo.UserInfo();
            userInfo.setUsername(encryptionUtil.decrypt(user.getName()));
            // ... 기타 정보 설정
            return ResponseEntity.ok(userInfo);
        }
        return ResponseEntity.status(401).build();
    }
}
```

## 🎨 프론트엔드 개발

### React 컴포넌트 구조

#### App.js - 메인 라우팅
```jsx
function App() {
  const { user, sessionInfo, isLoading, checkSession, logout } = useSession();
  
  return (
    <Router>
      <Routes>
        <Route path="/client/dashboard" element={
          <TabletLayout user={user} onLogout={handleLogout}>
            <CommonDashboard user={user} />
          </TabletLayout>
        } />
        {/* 기타 라우트 */}
      </Routes>
    </Router>
  );
}
```

#### useSession 훅
```jsx
export const useSession = () => {
  const [sessionState, setSessionState] = useState({
    user: null,
    sessionInfo: null,
    isLoading: true
  });
  
  useEffect(() => {
    const initializeSession = async () => {
      await sessionManager.checkSession();
    };
    initializeSession();
  }, []);
  
  return { ...sessionState, checkSession, logout };
};
```

#### SessionManager 클래스
```javascript
class SessionManager {
  async checkSession() {
    this.isLoading = true;
    try {
      const [userResponse, sessionResponse] = await Promise.all([
        fetch('http://localhost:8080/api/auth/current-user', { 
          credentials: 'include' 
        }),
        fetch('http://localhost:8080/api/auth/session-info', { 
          credentials: 'include' 
        })
      ]);
      
      if (userResponse.ok && sessionResponse.ok) {
        this.user = await userResponse.json();
        this.sessionInfo = await sessionResponse.json();
      }
    } finally {
      this.isLoading = false;
    }
  }
}
```

### 컴포넌트 예시

#### TabletHeader.js
```jsx
const TabletHeader = ({ user, onHamburgerToggle, onProfileClick }) => {
  return (
    <header className="tablet-header">
      <div className="tablet-logo">
        <i className="bi bi-flower1"></i>
        <span className="logo-text">MindGarden</span>
      </div>
      
      {user && (
        <div className="tablet-user-profile">
          <div className="user-name">{user.username}</div>
          <div className="user-role">{user.role}</div>
        </div>
      )}
    </header>
  );
};
```

#### CommonDashboard.js
```jsx
const CommonDashboard = ({ user: propUser }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadDashboardData = async () => {
      const sessionUser = sessionManager.getUser();
      const currentUser = sessionUser || propUser;
      
      if (!currentUser && !sessionManager.isLoggedIn()) {
        navigate('/login');
        return;
      }
      
      setUser(currentUser);
      setIsLoading(false);
    };
    
    loadDashboardData();
  }, [propUser, navigate]);
  
  if (isLoading) {
    return <div className="loading-container">로딩 중...</div>;
  }
  
  return (
    <div className="tablet-dashboard-page">
      <WelcomeSection user={user} />
      <SummaryPanels user={user} />
      {/* 기타 컴포넌트 */}
    </div>
  );
};
```

## 🗄️ 데이터베이스

### 주요 테이블

#### User 엔티티
```java
@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "name", nullable = false)
    private String name; // 암호화된 사용자명
    
    @Column(name = "email", unique = true, nullable = false)
    private String email;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private UserRole role;
    
    @Column(name = "nickname")
    private String nickname; // 암호화된 닉네임
}
```

#### UserSocialAccount 엔티티
```java
@Entity
@Table(name = "user_social_accounts")
@Data
public class UserSocialAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false)
    private SocialProvider provider;
    
    @Column(name = "provider_user_id", nullable = false)
    private String providerUserId;
}
```

### 데이터베이스 설정
```yaml
# application-dev.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mindgarden?useSSL=false&serverTimezone=UTC
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:password}
    driver-class-name: com.mysql.cj.jdbc.Driver
  
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true
```

## 🔒 보안 설정

### Spring Security 설정
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(authz -> authz
                .anyRequest().permitAll()
            );
        return http.build();
    }
}
```

### 개인정보 암호화
```java
@Component
public class PersonalDataEncryptionUtil {
    
    @Value("${encryption.personal-data.key:default-encryption-key-32}")
    private String encryptionKey;
    
    @Value("${encryption.personal-data.iv:default-iv-16-chars}")
    private String encryptionIv;
    
    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    
    public String encrypt(String plainText) {
        // AES 암호화 구현
    }
    
    public String decrypt(String encryptedText) {
        // AES 복호화 구현
    }
}
```

### CORS 설정
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    
    // 허용할 Origin 설정
    configuration.setAllowedOrigins(Arrays.asList(
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ));
    
    // 허용할 HTTP 메서드 설정
    configuration.setAllowedMethods(Arrays.asList(
        "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
    ));
    
    // 인증 정보 포함 허용
    configuration.setAllowCredentials(true);
    
    return source;
}
```

## 🚀 배포 가이드

### 개발 환경
```bash
# 백엔드
mvn spring-boot:run -Dspring.profiles.active=dev

# 프론트엔드
cd frontend && npm start
```

### 프로덕션 빌드
```bash
# 백엔드 JAR 파일 생성
mvn clean package -Dspring.profiles.active=prod

# 프론트엔드 빌드
cd frontend && npm run build
```

### 환경 변수 설정
```bash
# .env 파일
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
KAKAO_CLIENT_ID=your_kakao_client_id
NAVER_CLIENT_ID=your_naver_client_id
ENCRYPTION_KEY=your_encryption_key
ENCRYPTION_IV=your_encryption_iv
```

## 📝 개발 가이드라인

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

### 브랜치 전략
```
main          # 프로덕션 브랜치
develop       # 개발 브랜치
feature/*     # 기능 개발 브랜치
hotfix/*      # 긴급 수정 브랜치
```

## 🔍 디버깅 가이드

### 백엔드 로그 확인
```bash
# Spring Boot 로그 확인
tail -f logs/spring.log

# 또는 터미널 출력 확인
mvn spring-boot:run -Dspring.profiles.active=dev
```

### 프론트엔드 디버깅
```javascript
// 브라우저 개발자 도구 콘솔에서
console.log('🔍 세션 확인 시작...');
console.log('👤 사용자 정보:', user);
console.log('🔐 로그인 상태:', sessionManager.isLoggedIn());
```

### API 테스트
```bash
# 세션 정보 확인
curl -v http://localhost:8080/api/auth/current-user

# OAuth2 설정 확인
curl -v http://localhost:8080/api/auth/oauth2/config
```

## 📚 추가 리소스

### 공식 문서
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

### 유용한 도구
- [Spring Initializr](https://start.spring.io/)
- [Create React App](https://create-react-app.dev/)
- [MySQL Workbench](https://www.mysql.com/products/workbench/)

---

**마지막 업데이트**: 2025년 8월 28일  
**버전**: 1.0.0  
**작성자**: AI Assistant
