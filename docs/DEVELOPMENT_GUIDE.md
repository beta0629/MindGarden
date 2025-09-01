# 개발 가이드

## 📋 개발 원칙

### **1. 상수 정의 원칙**
- 모든 비즈니스 로직 값은 상수 클래스에 정의
- 하드코딩 금지
- 상수 클래스는 `constant` 패키지에 위치

### **2. 공통화 및 캡슐화 원칙**
- 공통 기능은 Base 클래스에 구현
- 중복 코드 제거
- 일관된 인터페이스 제공

### **3. Hibernate 설정 원칙**
- **로컬 환경**: `ddl-auto: update` 사용으로 개발용 테이블 스키마 업데이트 ✅
- **운영 환경**: `ddl-auto: validate` 사용으로 스키마 검증만 수행
- 엔티티 변경 시 환경에 따라 적절한 DDL 정책 적용 ✅
- **스키마 생성 오류 해결 완료**: 모든 엔티티가 정상적으로 테이블 생성됨 ✅

### **4. 개발 환경 설정 원칙**
- **isDev 프로퍼티**: 로컬 개발 환경에서만 `true`로 설정
- **보안 완화**: 개발 환경에서만 보안 설정 완화 허용
- **CORS 설정**: 개발 환경에서 모든 도메인 허용
- **순환 참조**: 개발 환경에서만 `allow-circular-references: true` 허용

### **5. 소셜 로그인 구현 원칙**
- **OAuth2 통합 아키텍처**: `AbstractOAuth2Service` 기반 확장 가능한 구조 ✅
- **다중 소셜 계정 지원**: 하나의 사용자에게 여러 소셜 계정 연결 가능 ✅
- **암호화 보안**: 개인정보는 AES 암호화로 저장, `providerUserId`는 평문 저장 ✅
- **역할 기반 리다이렉트**: 사용자 역할에 따른 대시보드 자동 이동 ✅

## 🚀 개발 진행 상황

### **✅ 완료된 기능**

#### **1. 기본 인프라**
- [x] Spring Boot 프로젝트 구조 설정
- [x] Hibernate JPA 설정 및 엔티티 설계
- [x] Base 클래스 계층 구조 구현
- [x] 상수 관리 시스템 구축
- [x] 예외 처리 및 로깅 시스템

#### **2. 사용자 관리**
- [x] User 엔티티 및 상속 구조 (Client, Consultant, Admin)
- [x] 사용자 등록/수정/조회 서비스
- [x] 개인정보 암호화 시스템 (AES/CBC/PKCS5Padding)
- [x] 세션 관리 및 JWT 토큰 시스템

#### **3. 소셜 로그인 시스템**
- [x] **카카오 OAuth2 로그인** ✅
- [x] **네이버 OAuth2 로그인** ✅
- [x] 통합 OAuth2 서비스 아키텍처
- [x] 소셜 계정 연동 및 사용자 매핑
- [x] 간편 회원가입 모달 시스템

#### **4. UI/UX 시스템**
- [x] **테블릿 전용 로그인/회원가입 페이지** ✅
- [x] **내담자 대시보드** ✅
- [x] 파스텔톤 디자인 시스템
- [x] 반응형 레이아웃
- [x] 공통 컴포넌트 시스템 (Modal, Alert, Loading)

### **🔄 진행 중인 기능**
- [ ] 상담사 대시보드
- [ ] 관리자 대시보드
- [ ] 상담 예약 시스템
- [ ] 상담 기록 관리

### **📋 예정된 기능**
- [ ] 실시간 알림 시스템
- [ ] 파일 업로드 시스템
- [ ] 결제 시스템 연동
- [ ] 모바일 앱 API

## 🏗️ 아키텍처 패턴

### **Base 클래스 상속 구조**

#### **엔티티 계층**
```java
// 모든 엔티티는 BaseEntity를 상속
@Entity
@Table(name = "users")
public class User extends BaseEntity {
    // 엔티티별 고유 필드
}

@Entity
@Table(name = "clients")
public class Client extends User {
    // 내담자 전용 필드
}

@Entity
@Table(name = "consultants")
public class Consultant extends User {
    // 상담사 전용 필드
}
```

#### **Repository 계층**
```java
// 모든 Repository는 BaseRepository를 상속
public interface UserRepository extends BaseRepository<User, Long> {
    // 사용자 전용 쿼리 메서드
    Optional<User> findByEmail(String email);
    List<User> findByRole(String role);
}
```

#### **Service 계층**
```java
// 모든 Service는 BaseService를 상속
public interface UserService extends BaseService<User, Long> {
    // 사용자 전용 비즈니스 로직
    User registerUser(User user);
    void changePassword(Long userId, String oldPassword, String newPassword);
}

// 구현체는 BaseServiceImpl을 상속
@Service
@Transactional
public class UserServiceImpl extends BaseServiceImpl<User, Long> implements UserService {
    
    @Override
    public BaseRepository<User, Long> getRepository() {
        return userRepository;
    }
    
    // 사용자 전용 메서드 구현
}
```

#### **Controller 계층**
```java
// 모든 Controller는 BaseController를 상속
@RestController
@RequestMapping("/api/users")
public class UserController implements BaseController<User, Long> {
    
    @Override
    public UserService getService() {
        return userService;
    }
    
    // 사용자 전용 엔드포인트 추가
    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@RequestBody User user) {
        User registeredUser = userService.registerUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(registeredUser);
    }
}
```

## 🚀 개발 환경 설정

### **로컬 개발 환경 활성화**

#### **1. 프로파일 설정**
```bash
# Maven 프로파일로 실행 (권장)
mvn spring-boot:run -Dspring-boot.run.profiles=local

# 환경 변수로 설정
export SPRING_PROFILES_ACTIVE=local
mvn spring-boot:run
```

#### **2. isDev 프로퍼티 확인**
```yaml
# application-local.yml
isDev: true
isLocal: true
isDevelopment: true

# 개발 환경 전용 설정
development:
  database:
    initialize: true
    seed-data: true
  security:
    oauth2:
      enabled: false
    jwt:
      secret: "dev-secret-key-for-local-testing-only"
  api:
    cors:
      allowed-origins: "*"
      allowed-methods: "*"
      allowed-headers: "*"
```

#### **3. 개발 환경 전용 설정 클래스**
```java
@Configuration
@Profile("local")
public class DevelopmentConfig implements WebMvcConfigurer {
    
    @Value("${isDev:false}")
    private boolean isDev;
    
    // 개발 환경에서만 CORS 완전 허용
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        if (isDev) {
            registry.addMapping("/**")
                    .allowedOriginPatterns("*")
                    .allowedMethods("*")
                    .allowedHeaders("*");
        }
    }
}
```

### **환경별 설정 차이점**

| 설정 항목 | 로컬 (isDev: true) | 운영 (isDev: false) |
|-----------|---------------------|---------------------|
| **Hibernate ddl-auto** | `create-drop` | `validate` |
| **CORS** | 모든 도메인 허용 | 제한적 허용 |
| **보안** | 완화 (개발용) | 강화 (운영용) |
| **순환 참조** | 허용 | 금지 |
| **로깅** | DEBUG 레벨 | INFO 레벨 |
| **캐시** | 비활성화 | 활성화 |

## 🔧 공통 기능 사용법

### **BaseEntity 활용**

#### **생명주기 훅 사용**
```java
@Entity
public class CustomEntity extends BaseEntity {
    
    @PrePersist
    protected void onCreate() {
        super.onCreate();
        // 엔티티 생성 시 추가 로직
    }
    
    @PreUpdate
    protected void onUpdate() {
        super.onUpdate();
        // 엔티티 수정 시 추가 로직
    }
}
```

#### **낙관적 락 활용**
```java
@Service
public class CustomService {
    
    public void updateEntity(Long id, CustomEntity updateData) {
        CustomEntity entity = repository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("엔티티를 찾을 수 없습니다."));
        
        // 버전 충돌 시 OptimisticLockException 발생
        entity.setName(updateData.getName());
        repository.save(entity);
    }
}
```

### **BaseRepository 활용**

#### **활성 엔티티 조회**
```java
// 활성 상태인 엔티티만 조회
List<User> activeUsers = userRepository.findAllActive();

// 페이징 조회
Page<User> userPage = userRepository.findAllActive(Pageable.ofSize(20));

// 특정 기간에 생성된 엔티티 조회
LocalDateTime startDate = LocalDateTime.now().minusDays(30);
LocalDateTime endDate = LocalDateTime.now();
List<User> recentUsers = userRepository.findByCreatedAtBetween(startDate, endDate);
```

#### **중복 검사**
```java
// 이메일 중복 검사 (활성 상태만)
boolean isDuplicate = userRepository.isDuplicateExcludingId(userId, "email", email);

// 전체 중복 검사 (삭제된 것 포함)
boolean isDuplicateAll = userRepository.isDuplicateExcludingIdAll(userId, "email", email, true);
```

#### **통계 정보 조회**
```java
Object[] stats = userRepository.getEntityStatistics();
long totalCount = (Long) stats[0];
long deletedCount = (Long) stats[1];
long activeCount = (Long) stats[2];
```

### **BaseService 활용**

#### **생명주기 훅 구현**
```java
@Service
public class CustomServiceImpl extends BaseServiceImpl<CustomEntity, Long> {
    
    @Override
    public void beforeSave(CustomEntity entity) {
        // 저장 전 검증 로직
        validateBusinessRules(entity);
    }
    
    @Override
    public void afterSave(CustomEntity entity) {
        // 저장 후 처리 로직
        sendNotification(entity);
    }
    
    @Override
    public void validateEntity(CustomEntity entity) {
        // 엔티티 유효성 검증
        if (entity.getName() == null || entity.getName().trim().isEmpty()) {
            throw new ValidationException("이름은 필수입니다.");
        }
    }
    
    @Override
    public void validateBusinessRules(CustomEntity entity) {
        // 비즈니스 규칙 검증
        if (entity.getAge() < 0) {
            throw new ValidationException("나이는 0 이상이어야 합니다.");
        }
    }
}
```

#### **부분 업데이트**
```java
@Service
public class UserServiceImpl extends BaseServiceImpl<User, Long> {
    
    public User updateUserProfile(Long userId, User updateData) {
        // null이 아닌 필드만 업데이트
        return partialUpdate(userId, updateData);
    }
}
```

### **BaseController 활용**

#### **기본 CRUD 엔드포인트 자동 제공**
```java
@RestController
@RequestMapping("/api/users")
public class UserController implements BaseController<User, Long> {
    
    // BaseController에서 자동으로 제공하는 엔드포인트:
    // GET /api/users - 모든 활성 사용자 조회
    // GET /api/users/page - 페이징 조회
    // GET /api/users/{id} - ID로 조회
    // POST /api/users - 사용자 생성
    // PUT /api/users/{id} - 전체 업데이트
    // PATCH /api/users/{id} - 부분 업데이트
    // DELETE /api/users/{id} - 소프트 삭제
    // POST /api/users/{id}/restore - 복구
    // DELETE /api/users/{id}/hard - 하드 삭제
    
    // 사용자 전용 엔드포인트 추가
    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@RequestBody User user) {
        User registeredUser = userService.registerUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(registeredUser);
    }
}
```

## 🚨 예외 처리 가이드

### **예외 클래스 사용법**

#### **EntityNotFoundException**
```java
@Service
public class UserService {
    
    public User findUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. ID: " + id));
    }
}
```

#### **ValidationException**
```java
@Service
public class UserService {
    
    public void validateUser(User user) {
        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            throw new ValidationException("이메일은 필수입니다.");
        }
        
        if (user.getPassword() != null && user.getPassword().length() < 8) {
            throw new ValidationException("비밀번호는 최소 8자 이상이어야 합니다.");
        }
    }
}
```

### **컨트롤러 예외 처리**
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFound(EntityNotFoundException e) {
        ErrorResponse error = new ErrorResponse("NOT_FOUND", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException e) {
        ErrorResponse error = new ErrorResponse("VALIDATION_ERROR", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
}
```

## 📊 트랜잭션 관리

### **트랜잭션 어노테이션 사용법**

#### **서비스 계층 트랜잭션**
```java
@Service
@Transactional
public class UserServiceImpl extends BaseServiceImpl<User, Long> {
    
    @Override
    @Transactional(readOnly = true)
    public List<User> findAllActive() {
        return super.findAllActive();
    }
    
    @Override
    public User save(User entity) {
        // 기본 트랜잭션 설정 사용
        return super.save(entity);
    }
    
    @Transactional(rollbackFor = Exception.class)
    public void complexOperation() {
        // 복잡한 작업 시 롤백 정책 명시
    }
}
```

## 🔍 테스트 가이드

### **Base 클래스 테스트**

#### **Repository 테스트**
```java
@SpringBootTest
@Transactional
class UserRepositoryTest {
    
    @Autowired
    private UserRepository userRepository;
    
    @Test
    void testFindAllActive() {
        // 활성 사용자만 조회되는지 테스트
        List<User> activeUsers = userRepository.findAllActive();
        assertThat(activeUsers).allMatch(user -> !user.getIsDeleted());
    }
    
    @Test
    void testSoftDelete() {
        User user = createTestUser();
        userRepository.save(user);
        
        userRepository.softDeleteById(user.getId(), LocalDateTime.now());
        
        Optional<User> deletedUser = userRepository.findById(user.getId());
        assertThat(deletedUser).isPresent();
        assertThat(deletedUser.get().getIsDeleted()).isTrue();
    }
}
```

#### **Service 테스트**
```java
@SpringBootTest
@Transactional
class UserServiceTest {
    
    @Autowired
    private UserService userService;
    
    @Test
    void testSaveWithLifecycleHooks() {
        User user = createTestUser();
        
        // beforeSave, afterSave 훅이 호출되는지 테스트
        User savedUser = userService.save(user);
        
        assertThat(savedUser.getId()).isNotNull();
        assertThat(savedUser.getCreatedAt()).isNotNull();
    }
}
```

## 📝 코딩 컨벤션

### **클래스 명명 규칙**
- Base 클래스: `Base` + 역할 (예: `BaseEntity`, `BaseService`)
- 구현체: 인터페이스명 + `Impl` (예: `UserServiceImpl`)
- 상수 클래스: 명사 + `s` (예: `UserRoles`, `UserGrades`)

### **메서드 명명 규칙**
- 조회: `findBy`, `findAll`, `getBy`
- 저장/수정: `save`, `update`, `create`
- 삭제: `delete`, `remove`, `softDelete`
- 검증: `validate`, `check`, `isValid`

### **현재 구현된 패키지 구조** ✅
```
com.mindgarden.consultation
├── constant          # 상수 클래스 (9개 클래스)
│   ├── UserRole.java / UserRoles.java
│   ├── UserGrade.java / UserGrades.java
│   ├── Gender.java
│   ├── AgeGroup.java
│   ├── AddressType.java
│   ├── AlertType.java
│   ├── ConsultationStatus.java
│   ├── PaymentStatus.java
│   └── FileType.java
├── entity           # 엔티티 클래스 (12개 클래스)
│   ├── BaseEntity.java (공통 기반 클래스)
│   ├── User.java / Client.java / Consultant.java
│   ├── UserAddress.java / UserSocialAccount.java
│   ├── Consultation.java / ConsultationRecord.java
│   ├── Schedule.java / ClientConsultantMapping.java
│   ├── Alert.java
│   └── ErrorMessage.java
├── repository       # Repository 인터페이스 (5개)
│   ├── BaseRepository.java (공통 기반 인터페이스)
│   ├── UserRepository.java
│   ├── ConsultationRepository.java
│   ├── ConsultantRepository.java
│   └── AlertRepository.java
├── service          # Service 인터페이스 및 구현체 (7개)
│   ├── BaseService.java (공통 기반 인터페이스)
│   ├── UserService.java / AlertService.java
│   ├── ConsultationService.java / ConsultantService.java
│   ├── AuthService.java / JwtService.java
│   └── impl/        # Service 구현체
│       ├── BaseServiceImpl.java
│       ├── UserServiceImpl.java / AlertServiceImpl.java
│       ├── ConsultationServiceImpl.java / ConsultantServiceImpl.java
│       ├── AuthServiceImpl.java
│       └── CustomUserDetailsService.java
├── controller       # Controller 클래스 (6개)
│   ├── BaseController.java (공통 기반 인터페이스)
│   ├── HomeController.java / UserController.java
│   ├── AuthController.java / ConsultationController.java
│   ├── ConsultantController.java
│   └── TabletController.java
├── dto              # 데이터 전송 객체 (5개)
│   ├── AuthRequest.java / AuthResponse.java
│   ├── RegisterRequest.java / UserDto.java
│   └── ErrorResponse.java
├── config           # 설정 클래스 (5개)
│   ├── SecurityConfig.java / JwtAuthenticationFilter.java
│   ├── CustomAuthenticationEntryPoint.java
│   ├── CustomAccessDeniedHandler.java
│   └── DevelopmentConfig.java
├── exception        # 예외 클래스 (3개)
│   ├── EntityNotFoundException.java
│   ├── ValidationException.java
│   └── GlobalExceptionHandler.java
├── oauth2/          # OAuth2 관련 (향후 구현)
├── security/        # Security 관련 (향후 구현)
└── util/            # 유틸리티 클래스 (향후 확장)
```

## 📊 구현 완료 현황

### **Backend 구현 상태** ✅
- **엔티티 계층**: 12개 엔티티 완성 (100%)
- **Repository 계층**: 5개 Repository 완성 (100%)
- **Service 계층**: 7개 Service 완성 (100%)
- **Controller 계층**: 6개 Controller 완성 (100%)
- **인증 시스템**: JWT 기반 인증 완성 (100%)
- **예외 처리**: 전역 예외 처리 완성 (100%)
- **데이터 검증**: DTO 기반 검증 완성 (100%)

### **Frontend 구현 상태** 🔄
- **템플릿 구조**: Thymeleaf 기본 구조 완성 (70%)
- **JavaScript 모듈**: 공통 모듈 구현 필요 (0%)
- **CSS 스타일**: 디자인 시스템 적용 필요 (30%)
- **반응형 디자인**: 태블릿/데스크톱 대응 필요 (20%)

## 🚀 성능 최적화 팁

### **Repository 최적화** ✅
- `@Query` 어노테이션으로 복잡한 쿼리 최적화
- 인덱스 활용을 위한 쿼리 작성
- N+1 문제 방지를 위한 fetch join 사용
- BaseRepository의 공통 메서드 활용

### **Service 최적화** ✅
- 트랜잭션 범위 최소화
- 읽기 전용 메서드에 `@Transactional(readOnly = true)` 적용
- 배치 처리 시 `saveAll` 사용
- BaseService의 생명주기 훅 활용

### **Controller 최적화** ✅
- 응답 데이터 크기 제한
- 페이징 처리 활용 (BaseController 지원)
- 캐싱 전략 적용
- REST API 표준 준수

## 최근 업데이트 (2025-09-01)

### OAuth2 소셜 로그인 및 계정 연동 개선

#### 1. OAuth2 콜백 처리 개선
- **파일**: `OAuth2Controller.java`
- **변경사항**:
  - `naverCallback`과 `kakaoCallback` 메서드에 `mode` 파라미터 추가
  - `mode="link"`일 때 기존 사용자에게 소셜 계정 연동 기능 구현
  - `SocialUserInfo` 생성 시 `providerUserId` 타입 오류 수정 (`Long` → `String`)

#### 2. OAuth2 서비스 인터페이스 확장
- **파일**: `OAuth2Service.java`
- **변경사항**:
  - `linkSocialAccountToUser` 메서드 추가
  - 기존 사용자에게 소셜 계정 연동 기능 정의

#### 3. OAuth2 서비스 구현체 업데이트
- **파일**: `AbstractOAuth2Service.java`
- **변경사항**:
  - `linkSocialAccountToUser` 메서드 구현
  - 기존 `updateOrCreateSocialAccount` 메서드를 래핑하여 공개 인터페이스 제공

### 프로필 이미지 표시 시스템 개선

#### 1. 백엔드 프로필 이미지 우선순위 로직
- **파일**: `AuthController.java`
- **변경사항**:
  - 프로필 이미지 우선순위 구현: 사용자 업로드 > 소셜 > 기본 아이콘
  - `getCurrentUser` 메서드에서 `UserSocialAccount` 조회 및 이미지 타입 구분
  - `profileImageUrl`, `socialProfileImage`, `socialProvider` 필드 추가

#### 2. 프론트엔드 프로필 이미지 표시 개선
- **파일**: `SessionUserProfile.js`
- **변경사항**:
  - 이미지 로드 에러 처리 및 디버깅 로그 추가
  - 이미지 우선순위 로직 구현
  - 인라인 스타일 추가로 이미지 표시 보장
  - 이미지 타입 배지 표시 기능

#### 3. CSS 스타일링 개선
- **파일**: `frontend/src/styles/tablet/index.css`
- **변경사항**:
  - `.user-avatar`에 `position: relative` 추가
  - `.close-btn` 스타일 개선 (가시성 향상)
  - 햄버거 메뉴 닫기 버튼 스타일 개선

### 햄버거 메뉴 개선

#### 1. 닫기 버튼 가시성 개선
- **파일**: `TabletHamburgerMenu.js`
- **변경사항**:
  - Bootstrap Icons 대신 직접 `✕` 문자 사용
  - 아이콘 라이브러리 의존성 제거

#### 2. CSS 스타일링 개선
- **파일**: `frontend/src/styles/tablet/index.css`
- **변경사항**:
  - `.close-btn` 스타일 개선:
    - `width`, `height` 증가 (36px)
    - `background` 색상 변경 (`var(--gray-300)`)
    - `color` 변경 (`var(--gray-900)`)
    - `font-size` 증가 (`1.25rem`)
    - `font-weight: bold` 추가
    - 호버 효과 추가 (`transform: scale(1.05)`)

### 세션 관리 개선

#### 1. 프론트엔드 세션 체크 개선
- **파일**: `sessionManager.js`
- **변경사항**:
  - 401 Unauthorized 응답을 정상적인 상황으로 처리
  - 로그인되지 않은 상태에서의 오류 메시지 개선
  - 네트워크 오류 처리 개선

### 테스트 데이터 개선

#### 1. 테스트 사용자 프로필 이미지
- **파일**: `AuthController.java`
- **변경사항**:
  - `testLogin` 메서드에서 base64 인코딩된 SVG 이미지 사용
  - 외부 이미지 URL 대신 안정적인 테스트 이미지 제공

## 기술적 세부사항

### 프로필 이미지 우선순위 시스템
```javascript
// 우선순위: 사용자 업로드 > 소셜 > 기본 아이콘
if (user.getProfileImageUrl() != null && !user.getProfileImageUrl().trim().isEmpty()) {
    // 사용자가 직접 업로드한 이미지
    profileImageUrl = user.getProfileImageUrl();
} else if (!socialAccounts.isEmpty()) {
    // 소셜 계정 이미지
    socialProfileImage = primarySocialAccount.getProviderProfileImage();
    socialProvider = primarySocialAccount.getProvider();
}
```

### OAuth2 계정 연동 플로우
```java
// 계정 연동 모드 처리
if ("link".equals(mode)) {
    SocialUserInfo socialUserInfo = new SocialUserInfo();
    socialUserInfo.setProviderUserId(String.valueOf(userInfo.getId()));
    // ... 기타 정보 설정
    oauth2Service.linkSocialAccountToUser(currentUser.getId(), socialUserInfo);
}
```

### 이미지 타입 배지 시스템
- **사용자**: 사용자가 직접 업로드한 이미지
- **소셜**: 소셜 계정에서 가져온 이미지 (NAVER, KAKAO 등)
- **기본**: 기본 아이콘

## 해결된 문제들

1. **OAuth2 계정 연동 실패**: `mode` 파라미터와 연동 로직 구현
2. **프로필 이미지 표시 안됨**: 우선순위 시스템 및 CSS 스타일링 개선
3. **햄버거 메뉴 닫기 버튼 가시성**: 직접 문자 사용 및 스타일 개선
4. **세션 체크 오류 메시지**: 401 응답을 정상적인 상황으로 처리
5. **타입 오류**: `providerUserId` 타입 변환 문제 해결

## 다음 단계

1. 프로필 이미지 업로드 기능 테스트
2. 소셜 계정 연동 기능 완전 테스트
3. 햄버거 메뉴 동작 확인
4. 전체 UI/UX 검증
