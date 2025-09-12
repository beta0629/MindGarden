# 개발 가이드

## 📋 개발 원칙

### **🚨 상수화 필수 원칙** ⚠️ **절대 준수**

**모든 개발자는 다음 원칙을 반드시 준수해야 합니다:**

#### **상수화 대상**
- **JavaScript 변수**: 모든 스크립트 변수는 상수 파일에 정의
- **CSS 변수**: 모든 CSS 값은 CSS 변수나 상수로 정의  
- **Java 변수**: 모든 자바 변수는 상수 클래스에 정의
- **API 엔드포인트**: 모든 API URL은 상수로 정의
- **문자열 리터럴**: 모든 하드코딩된 문자열은 상수로 정의
- **숫자 리터럴**: 모든 하드코딩된 숫자는 상수로 정의

#### **상수화 효과**
- **유지보수성 향상**: 값 변경 시 한 곳만 수정
- **일관성 보장**: 동일한 값은 하나의 상수로 통일
- **오류 방지**: 하드코딩으로 인한 오타 방지
- **가독성 향상**: 의미있는 상수명으로 코드 이해도 증진

### **1. 상수 정의 원칙** ⚠️ **필수**
- **모든 비즈니스 로직 값은 상수 클래스에 정의**
- **하드코딩 절대 금지**
- **상수 클래스는 `constant` 패키지에 위치**
- **CSS 변수, JavaScript 상수, API 엔드포인트 모두 상수화 필수**
- **스크립트 변수, CSS 변수, 자바 변수 모두 상수로 생성하여 개발**
- **모든 변수는 상수화하여 유지보수성과 일관성 확보**

### **2. 컴포넌트화 원칙** ⚠️ **필수**
- **모든 UI 요소는 재사용 가능한 컴포넌트로 구현**
- **단일 책임 원칙 준수**
- **Props 기반 설계**
- **독립적인 CSS 파일 분리**
- **컴포넌트별 테스트 가능한 구조**

### **3. 공통화 및 캡슐화 원칙**
- 공통 기능은 Base 클래스에 구현
- 중복 코드 제거
- 일관된 인터페이스 제공

### **4. Hibernate 설정 원칙**
- **로컬 환경**: `ddl-auto: update` 사용으로 개발용 테이블 스키마 업데이트 ✅
- **운영 환경**: `ddl-auto: validate` 사용으로 스키마 검증만 수행
- 엔티티 변경 시 환경에 따라 적절한 DDL 정책 적용 ✅
- **스키마 생성 오류 해결 완료**: 모든 엔티티가 정상적으로 테이블 생성됨 ✅

### **5. 공통 리다이렉션 시스템 원칙** ⚠️ **필수**
- **모든 로그인 후 리다이렉션은 공통 유틸리티 사용 필수**
- **역할별 대시보드 경로는 중앙에서 관리**
- **백엔드**: `DashboardRedirectUtil` 클래스 사용
- **프론트엔드**: `session.js`의 공통 함수 사용
- **리다이렉션 로직 중복 구현 절대 금지**
- **새로운 역할 추가 시 백엔드-프론트엔드 매핑 동시 수정**

### **6. 개발 환경 설정 원칙**
- **isDev 프로퍼티**: 로컬 개발 환경에서만 `true`로 설정
- **보안 완화**: 개발 환경에서만 보안 설정 완화 허용
- **CORS 설정**: 개발 환경에서 모든 도메인 허용
- **순환 참조**: 개발 환경에서만 `allow-circular-references: true` 허용

### **6. 소셜 로그인 구현 원칙**
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
- [x] 전화번호 암호화 마이그레이션 시스템 ✅
- [x] 자동 전화번호 암호화 로직 ✅
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
- **컴포넌트 클래스**: 기능명 + `Component` (예: `SystemStatus`, `SystemTools`)

### **메서드 명명 규칙**
- 조회: `findBy`, `findAll`, `getBy`
- 저장/수정: `save`, `update`, `create`
- 삭제: `delete`, `remove`, `softDelete`
- 검증: `validate`, `check`, `isValid`

## 🧩 컴포넌트화 가이드

### **컴포넌트 생성 원칙** ⚠️ **필수**

#### **1. 컴포넌트 구조**
```
frontend/src/components/
├── admin/
│   ├── AdminDashboard.js
│   ├── AdminDashboard.css
│   └── system/                    # 기능별 컴포넌트 폴더
│       ├── SystemStatus.js        # 시스템 상태 컴포넌트
│       ├── SystemStatus.css       # 독립적인 스타일
│       ├── SystemTools.js         # 시스템 도구 컴포넌트
│       ├── SystemTools.css        # 독립적인 스타일
│       └── index.js               # 컴포넌트 내보내기
```

#### **2. 컴포넌트 Props 설계**
```javascript
// ✅ 올바른 Props 설계
const SystemStatus = ({ 
    systemStatus,      // 상태 데이터
    onStatusCheck,     // 이벤트 핸들러
    loading           // 로딩 상태
}) => {
    // 컴포넌트 로직
};

// ❌ 잘못된 Props 설계 (하드코딩)
const SystemStatus = () => {
    const systemStatus = { server: 'healthy', database: 'error' }; // 하드코딩 금지
    // ...
};
```

#### **3. 컴포넌트 사용법**
```javascript
// ✅ 올바른 컴포넌트 사용
import { SystemStatus, SystemTools } from './system';

const AdminDashboard = () => {
    const [systemStatus, setSystemStatus] = useState({});
    const [loading, setLoading] = useState(false);
    
    return (
        <div>
            <SystemStatus 
                systemStatus={systemStatus}
                onStatusCheck={handleStatusCheck}
                loading={loading}
            />
            <SystemTools 
                onRefresh={handleRefresh}
                onViewLogs={handleViewLogs}
                onClearCache={handleClearCache}
                onCreateBackup={handleCreateBackup}
                loading={loading}
            />
        </div>
    );
};
```

### **상수 사용 가이드** ⚠️ **필수**

#### **상수화 원칙**
- **모든 변수는 상수로 정의**: 스크립트 변수, CSS 변수, 자바 변수 모두 상수화
- **하드코딩 절대 금지**: 모든 값은 상수 파일에서 관리
- **일관성 유지**: 동일한 값은 하나의 상수로 통일
- **유지보수성**: 값 변경 시 상수 파일만 수정하면 전체 적용

#### **1. JavaScript 상수**
```javascript
// ✅ 올바른 상수 사용
// frontend/src/constants/system.js
export const SYSTEM_API_ENDPOINTS = {
    HEALTH_SERVER: '/api/health/server',
    HEALTH_DATABASE: '/api/health/database',
    LOGS_RECENT: '/api/admin/logs/recent',
    CACHE_CLEAR: '/api/admin/cache/clear',
    BACKUP_CREATE: '/api/admin/backup/create'
};

export const SYSTEM_STATUS = {
    HEALTHY: 'healthy',
    ERROR: 'error',
    UNKNOWN: 'unknown'
};

// 컴포넌트에서 사용
import { SYSTEM_API_ENDPOINTS, SYSTEM_STATUS } from '../../constants/system';

const SystemStatus = () => {
    const checkStatus = async () => {
        const response = await fetch(SYSTEM_API_ENDPOINTS.HEALTH_SERVER);
        // ...
    };
};

// ❌ 잘못된 하드코딩
const SystemStatus = () => {
    const checkStatus = async () => {
        const response = await fetch('/api/health/server'); // 하드코딩 금지
        // ...
    };
};
```

#### **2. CSS 상수**
```css
/* ✅ 올바른 CSS 변수 사용 */
/* frontend/src/constants/css-variables.js */
export const CSS_VARIABLES = {
    COLORS: {
        PRIMARY: '#4A90E2',
        SUCCESS: '#28a745',
        ERROR: '#dc3545',
        WARNING: '#ffc107'
    },
    SPACING: {
        XS: '4px',
        SM: '8px',
        MD: '16px',
        LG: '24px',
        XL: '32px'
    }
};

/* CSS에서 사용 */
.system-status-display {
    background: var(--admin-white);
    border: 1px solid var(--admin-border-color);
    border-radius: var(--admin-radius-lg);
    padding: var(--admin-spacing-lg);
}

/* ❌ 잘못된 하드코딩 */
.system-status-display {
    background: #ffffff;        /* 하드코딩 금지 */
    border: 1px solid #e5e7eb; /* 하드코딩 금지 */
    border-radius: 8px;        /* 하드코딩 금지 */
    padding: 24px;             /* 하드코딩 금지 */
}
```

#### **3. Java 상수**
```java
// ✅ 올바른 Java 상수 사용
// src/main/java/com/mindgarden/consultation/constant/UserRoles.java
public class UserRoles {
    public static final String CLIENT = "CLIENT";
    public static final String CONSULTANT = "CONSULTANT";
    public static final String ADMIN = "ADMIN";
    
    // 상수 그룹화
    public static final String[] ALL_ROLES = {CLIENT, CONSULTANT, ADMIN};
    
    // 유효성 검증 메서드
    public static boolean isValidRole(String role) {
        return Arrays.asList(ALL_ROLES).contains(role);
    }
}

// 서비스에서 사용
@Service
public class UserServiceImpl {
    public User createUser(User user) {
        if (!UserRoles.isValidRole(user.getRole())) {
            throw new ValidationException("유효하지 않은 역할입니다.");
        }
        // ...
    }
}

// ❌ 잘못된 하드코딩
@Service
public class UserServiceImpl {
    public User createUser(User user) {
        if (!"CLIENT".equals(user.getRole()) && !"CONSULTANT".equals(user.getRole())) {
            throw new ValidationException("유효하지 않은 역할입니다.");
        }
        // ...
    }
}
```

#### **4. API 엔드포인트 상수**
```javascript
// ✅ 올바른 API 상수 사용
// frontend/src/constants/api.js
export const API_ENDPOINTS = {
    ADMIN: {
        MAPPINGS: '/api/admin/mappings',
        CONSULTANTS: '/api/admin/consultants',
        CLIENTS: '/api/admin/clients',
        COMMON_CODES: '/api/admin/common-codes'
    },
    HEALTH: {
        SERVER: '/api/health/server',
        DATABASE: '/api/health/database'
    }
};

// 컴포넌트에서 사용
import { API_ENDPOINTS } from '../../constants/api';

const AdminDashboard = () => {
    const loadStats = async () => {
        const [consultantsRes, clientsRes, mappingsRes] = await Promise.all([
            fetch(API_ENDPOINTS.ADMIN.CONSULTANTS),
            fetch(API_ENDPOINTS.ADMIN.CLIENTS),
            fetch(API_ENDPOINTS.ADMIN.MAPPINGS)
        ]);
        // ...
    };
};
```

### **컴포넌트 테스트 가이드**

#### **1. 단위 테스트**
```javascript
// SystemStatus.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import SystemStatus from './SystemStatus';

describe('SystemStatus', () => {
    const mockProps = {
        systemStatus: {
            server: 'healthy',
            database: 'error',
            lastChecked: '2025-01-03 14:30:00'
        },
        onStatusCheck: jest.fn(),
        loading: false
    };

    test('시스템 상태를 올바르게 표시한다', () => {
        render(<SystemStatus {...mockProps} />);
        
        expect(screen.getByText('서버')).toBeInTheDocument();
        expect(screen.getByText('정상')).toBeInTheDocument();
        expect(screen.getByText('데이터베이스')).toBeInTheDocument();
        expect(screen.getByText('오류')).toBeInTheDocument();
    });

    test('상태 체크 버튼 클릭 시 핸들러가 호출된다', () => {
        render(<SystemStatus {...mockProps} />);
        
        const checkButton = screen.getByText('상태 체크');
        fireEvent.click(checkButton);
        
        expect(mockProps.onStatusCheck).toHaveBeenCalledTimes(1);
    });
});
```

### **컴포넌트 문서화**

#### **1. 컴포넌트 주석**
```javascript
/**
 * 시스템 상태 표시 컴포넌트
 * 
 * @param {Object} systemStatus - 시스템 상태 정보
 * @param {string} systemStatus.server - 서버 상태 (healthy/error/unknown)
 * @param {string} systemStatus.database - 데이터베이스 상태 (healthy/error/unknown)
 * @param {string} systemStatus.lastChecked - 마지막 확인 시간
 * @param {Function} onStatusCheck - 상태 체크 버튼 클릭 핸들러
 * @param {boolean} loading - 로딩 상태
 * 
 * @example
 * <SystemStatus 
 *   systemStatus={status}
 *   onStatusCheck={handleStatusCheck}
 *   loading={isLoading}
 * />
 */
const SystemStatus = ({ systemStatus, onStatusCheck, loading }) => {
    // 컴포넌트 구현
};
```

### **상수화 체크리스트** ⚠️ **필수**

#### **✅ 상수화 완료 체크리스트**
- [ ] **JavaScript 변수**: 모든 스크립트 변수가 상수 파일에 정의됨
- [ ] **CSS 변수**: 모든 CSS 값이 CSS 변수나 상수로 정의됨
- [ ] **Java 변수**: 모든 자바 변수가 상수 클래스에 정의됨
- [ ] **API 엔드포인트**: 모든 API URL이 상수로 정의됨
- [ ] **하드코딩 제거**: 코드에 직접 값이 하드코딩되지 않음
- [ ] **일관성 유지**: 동일한 값은 하나의 상수로 통일됨
- [ ] **유지보수성**: 값 변경 시 상수 파일만 수정하면 됨
- [ ] **가독성**: 상수명이 의미를 명확히 표현함

### **컴포넌트 재사용성 체크리스트**

#### **✅ 컴포넌트화 완료 체크리스트**
- [ ] **단일 책임**: 컴포넌트가 하나의 명확한 역할을 가짐
- [ ] **Props 기반**: 모든 데이터와 이벤트가 Props로 전달됨
- [ ] **하드코딩 없음**: 모든 값이 상수로 정의됨
- [ ] **독립적 CSS**: 컴포넌트별 CSS 파일 분리
- [ ] **재사용 가능**: 다른 페이지에서도 사용 가능
- [ ] **테스트 가능**: 단위 테스트 작성 가능
- [ ] **문서화**: Props와 사용법이 명확히 문서화됨
- [ ] **타입 안전**: TypeScript 사용 시 타입 정의 완료

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

## 최근 업데이트 (2024-12-19)

### ✅ 전화번호 암호화 시스템 구축 완료

#### **구현된 기능:**
1. **전화번호 암호화 마이그레이션 서비스**
   - `PhoneMigrationService.java`: 기존 평문 전화번호를 암호화하는 마이그레이션 서비스
   - `PhoneMigrationController.java`: 마이그레이션 실행을 위한 REST API 엔드포인트
   - `MigrationScript.java`: 애플리케이션 시작 시 자동 마이그레이션 실행

2. **자동 암호화 로직 추가**
   - `UserServiceImpl.save()`: 새 사용자 등록 시 전화번호 자동 암호화
   - `AdminServiceImpl.registerClient()`: 관리자 내담자 등록 시 전화번호 암호화
   - `AdminServiceImpl.registerConsultant()`: 관리자 상담사 등록 시 전화번호 암호화

3. **보안 강화**
   - 개인정보보호법 준수: 전화번호를 민감정보로 분류하여 암호화 저장
   - 데이터 유출 방지: 데이터베이스 직접 접근 시에도 전화번호가 암호화된 상태로 보호
   - 자동화된 보안: 새로운 사용자 등록 시 자동으로 전화번호가 암호화되어 실수 방지

#### **마이그레이션 결과:**
- **총 사용자 수**: 17명
- **마이그레이션된 사용자**: 0명 (이미 모두 암호화되어 있었음)
- **이미 암호화된 사용자**: 16명
- **오류**: 0건

#### **API 엔드포인트:**
- `GET /api/admin/migration/phone/status`: 전화번호 암호화 상태 확인
- `POST /api/admin/migration/phone/encrypt`: 전화번호 암호화 마이그레이션 실행

#### **사용법:**
```java
// 마이그레이션 서비스 사용
@Autowired
private PhoneMigrationService phoneMigrationService;

// 전화번호 암호화 상태 확인
Map<String, Object> status = phoneMigrationService.checkPhoneEncryptionStatus();

// 마이그레이션 실행
phoneMigrationService.migratePhones();
```

#### **보안 특징:**
- **이름은 평문 유지**: 이름은 암호화하지 않고 평문으로 유지
- **전화번호만 암호화**: 개인정보보호법에 따라 전화번호만 암호화
- **안전한 마이그레이션**: 이미 암호화된 데이터는 건드리지 않음
- **상세한 로깅**: 각 단계별로 상세한 로그 출력
- **트랜잭션 보장**: 오류 발생 시 롤백

---

## 최근 업데이트 (2025-09-12)

### 사용자 역할 시스템 개선 및 권한 체계 통일

#### 1. 역할 명시화 및 권한 체계 개선
- **파일**: `UserRole.java`
- **변경사항**:
  - `SUPER_ADMIN`을 `HQ_SUPER_ADMIN`으로 명시적 변경
  - `SUPER_HQ_ADMIN`의 표시명을 "본사최고관리자"로 명확화
  - 권한 체크 로직을 `UserRole.isAdmin()` 메서드로 통일
  - 기존 호환성 유지를 위한 `fromString()` 메서드 개선

#### 2. 컨트롤러 권한 체크 로직 개선
- **파일**: `AdminController.java`, `ScheduleController.java`
- **변경사항**:
  - 복잡한 개별 역할 비교 로직을 `UserRole.isAdmin()` 메서드로 단순화
  - `BRANCH_SUPER_ADMIN`, `ADMIN`, `HQ_ADMIN`, `SUPER_HQ_ADMIN`, `BRANCH_MANAGER` 등 모든 관리자 역할을 포함
  - 디버깅 로그 간소화 및 명확화

#### 3. 권한 체계 문서화
- **파일**: `docs/USER_ROLE_SYSTEM.md` (신규 생성)
- **내용**:
  - 역할별 권한 정의 및 접근 제어 가이드
  - API 권한 체크 방법 및 예시
  - 데이터베이스 호환성 및 마이그레이션 가이드
  - 사용 예시 및 주의사항

#### 4. 권한 체크 메서드 통일
```java
// 기존 복잡한 로직
boolean hasPermission = userRole == UserRole.ADMIN || 
                      userRole == UserRole.BRANCH_SUPER_ADMIN || 
                      userRole == UserRole.HQ_ADMIN || 
                      userRole == UserRole.SUPER_HQ_ADMIN || 
                      userRole == UserRole.BRANCH_MANAGER;

// 개선된 간단한 로직
boolean hasPermission = userRole.isAdmin();
```

#### 5. 역할별 접근 권한 명확화
- **지점 관리자** (`ADMIN`, `BRANCH_MANAGER`, `BRANCH_SUPER_ADMIN`):
  - ✅ 지점 내 상담사/내담자 목록 조회
  - ✅ 지점 내 매핑 및 스케줄 관리
  - ❌ 다른 지점 데이터 접근
- **본사 관리자** (`HQ_ADMIN`, `SUPER_HQ_ADMIN`, `HQ_SUPER_ADMIN`):
  - ✅ 모든 지점 데이터 접근
  - ✅ 지점 생성/삭제/관리
  - ✅ 시스템 전체 통계 조회

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

## 📊 통계 및 차트 컴포넌트 개발 가이드 (신규 추가: 2025년 9월)

### 1. Chart.js 기반 차트 컴포넌트 개발

#### **Chart 컴포넌트 사용법**
```jsx
import Chart from '../components/common/Chart';

// 기본 사용법
<Chart 
  type="bar"
  data={chartData}
  options={chartOptions}
  width={400}
  height={300}
/>

// Pie/Doughnut 차트 (자동 중앙 정렬)
<Chart 
  type="pie"
  data={pieChartData}
  options={pieChartOptions}
/>
```

#### **차트 데이터 구조**
```javascript
// constants/charts.js에서 정의
const chartData = {
  labels: ['예약됨', '완료', '취소', '확정'],
  datasets: [{
    data: [8, 17, 5, 0],
    backgroundColor: ['#ffc107', '#28a745', '#dc3545', '#17a2b8']
  }]
};
```

#### **차트 옵션 설정**
```javascript
// constants/charts.js에서 정의
const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
};

// Pie/Doughnut 차트 전용 옵션
const PIE_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'bottom',
      align: 'center'
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((context.parsed / total) * 100).toFixed(1);
          return `${context.label}: ${context.parsed} (${percentage}%)`;
        }
      }
    }
  }
};
```

### 2. 통계 카드 컴포넌트 개발

#### **StatsCard 컴포넌트 사용법**
```jsx
import StatsCard from '../components/common/StatsCard';

<StatsCard 
  icon="bi bi-calendar-check"
  title="완료된 상담"
  value={45}
  label="건"
  change={5}
  changeType="positive"
  changeLabel="전주 대비"
  color="success"
/>
```

#### **DetailedStatsCard 컴포넌트 사용법**
```jsx
import DetailedStatsCard from '../components/common/DetailedStatsCard';

<DetailedStatsCard 
  icon="bi bi-people"
  title="내담자 증감"
  mainValue={150}
  mainLabel="총 내담자"
  subValue={25}
  subLabel="신규 내담자"
  changeValue={12}
  changeType="positive"
  changeLabel="전월 대비"
  rateValue={8.7}
  rateLabel="증가율"
/>
```

#### **통계 카드 그리드 사용법**
```jsx
import StatsCardGrid from '../components/common/StatsCardGrid';
import DetailedStatsGrid from '../components/common/DetailedStatsGrid';

// 기본 통계 카드 그리드
<StatsCardGrid statistics={basicStatsData} />

// 상세 통계 카드 그리드
<DetailedStatsGrid statistics={detailedStatsData} />
```

### 3. CSS 상수 사용 가이드

#### **카드 컴포넌트 CSS 변수**
```css
/* frontend/src/styles/common/variables.css */
:root {
  /* 카드 컴포넌트 변수 */
  --card-bg: #ffffff;
  --card-border: #e9ecef;
  --card-radius: 12px;
  --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --card-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  --card-transition: all 0.3s ease;
  
  /* 카드 색상 변수 */
  --card-color-primary: #007bff;
  --card-color-primary-light: #e3f2fd;
  --card-color-success: #28a745;
  --card-color-warning: #ffc107;
  --card-color-danger: #dc3545;
  --card-color-info: #17a2b8;
  --card-color-secondary: #6c757d;
}
```

#### **CSS 클래스 상수 사용**
```javascript
// constants/css.js에서 정의
export const STATS_CARD_CSS = {
  container: 'stats-card',
  header: 'stats-card-header',
  icon: 'stats-card-icon',
  title: 'stats-card-title',
  content: 'stats-card-content',
  value: 'stats-card-value',
  label: 'stats-card-label',
  changeContainer: 'stats-card-change-container',
  change: 'stats-card-change',
  positive: 'positive',
  negative: 'negative'
};
```

### 4. API 응답 형식 통일

#### **일관된 응답 구조**
```javascript
// 모든 API 응답은 다음 구조를 따름
{
  "success": true,
  "data": {}, // 실제 데이터
  "message": "성공 메시지",
  "totalCount": 30 // 데이터 개수 (선택적)
}
```

#### **API 호출 예시**
```javascript
// utils/ajax.js 사용
import { apiGet } from '../utils/ajax';

const loadStatistics = async () => {
  try {
    const response = await apiGet('/api/schedules/admin/statistics', {
      userRole: 'ADMIN',
      startDate: '2025-09-01',
      endDate: '2025-09-30'
    });
    
    if (response.success) {
      setStatistics(response.data);
    }
  } catch (error) {
    console.error('통계 로드 실패:', error);
  }
};
```

### 5. 컴포넌트 개발 원칙

#### **재사용 가능한 컴포넌트 설계**
```jsx
// ✅ 좋은 예: Props 기반 설계
const StatsCard = ({ 
  icon, 
  title, 
  value, 
  label, 
  change, 
  changeType, 
  color = 'primary',
  loading = false,
  error = false 
}) => {
  // 컴포넌트 로직
};

// ❌ 나쁜 예: 하드코딩된 값
const StatsCard = () => {
  return (
    <div className="stats-card">
      <h3>완료된 상담</h3> {/* 하드코딩된 제목 */}
      <span>45건</span> {/* 하드코딩된 값 */}
    </div>
  );
};
```

#### **상수 사용 원칙**
```javascript
// ✅ 좋은 예: 상수 사용
import { STATS_CARD_CSS } from '../constants/css';
import { CHART_TYPES } from '../constants/charts';

const StatsCard = ({ title, value }) => {
  return (
    <div className={STATS_CARD_CSS.container}>
      <h3 className={STATS_CARD_CSS.title}>{title}</h3>
      <span className={STATS_CARD_CSS.value}>{value}</span>
    </div>
  );
};

// ❌ 나쁜 예: 하드코딩된 클래스명
const StatsCard = ({ title, value }) => {
  return (
    <div className="stats-card">
      <h3 className="stats-card-title">{title}</h3>
      <span className="stats-card-value">{value}</span>
    </div>
  );
};
```

### 6. 반응형 디자인 가이드

#### **그리드 레이아웃 설정**
```css
/* 반응형 그리드 */
.stats-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

/* 태블릿 최적화 */
@media (min-width: 768px) and (max-width: 1024px) {
  .stats-card-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

/* 모바일 최적화 */
@media (max-width: 767px) {
  .stats-card-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}
```

#### **차트 반응형 설정**
```javascript
// Chart.js 반응형 옵션
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 12,
        padding: 20
      }
    }
  }
};
```

### 7. 성능 최적화 가이드

#### **컴포넌트 메모이제이션**
```jsx
import React, { memo } from 'react';

const StatsCard = memo(({ icon, title, value, label, change, changeType, color }) => {
  return (
    <div className={`${STATS_CARD_CSS.container} ${color}`}>
      {/* 컴포넌트 내용 */}
    </div>
  );
});

export default StatsCard;
```

#### **차트 데이터 최적화**
```javascript
// 차트 데이터 메모이제이션
const chartData = useMemo(() => ({
  labels: statistics.labels,
  datasets: [{
    data: statistics.data,
    backgroundColor: CHART_COLORS
  }]
}), [statistics]);
```

### 8. 테스트 가이드

#### **컴포넌트 테스트**
```jsx
import { render, screen } from '@testing-library/react';
import StatsCard from '../StatsCard';

test('통계 카드가 올바르게 렌더링된다', () => {
  render(
    <StatsCard 
      icon="bi bi-calendar-check"
      title="완료된 상담"
      value={45}
      label="건"
      color="success"
    />
  );
  
  expect(screen.getByText('완료된 상담')).toBeInTheDocument();
  expect(screen.getByText('45')).toBeInTheDocument();
  expect(screen.getByText('건')).toBeInTheDocument();
});
```

#### **API 테스트**
```javascript
// API 응답 테스트
test('통계 API가 올바른 형식으로 응답한다', async () => {
  const response = await apiGet('/api/schedules/admin/statistics', {
    userRole: 'ADMIN'
  });
  
  expect(response.success).toBe(true);
  expect(response.data).toHaveProperty('basicStats');
  expect(response.data).toHaveProperty('detailedStats');
  expect(response.data).toHaveProperty('chartData');
});
```

## 공통 로딩바 컴포넌트 통일 가이드 (2025-09-13 업데이트)

### 1. 현재 로딩바 컴포넌트 현황

#### **기존 로딩바 컴포넌트들**
- `LoadingSpinner.js` (공통 로딩바) - **메인 컴포넌트** ✅
- `ErpLoading.js` (ERP 전용) - **통합 대상** ❌
- 각종 인라인 로딩 스피너들 - **통합 대상** ❌

#### **통일 원칙** ⚠️ **필수**
- **모든 로딩 UI는 `LoadingSpinner` 컴포넌트 사용**
- **개별 로딩바 구현 절대 금지**
- **일관된 로딩 경험 제공**

### 2. LoadingSpinner 컴포넌트 사용법

#### **기본 사용**
```jsx
import LoadingSpinner from '../components/common/LoadingSpinner';

// 기본 로딩바
<LoadingSpinner text="로딩 중..." size="medium" />
```

#### **다양한 스타일 옵션**
```jsx
// 도트 스타일
<LoadingSpinner variant="dots" text="도트 로딩" size="medium" />

// 펄스 스타일
<LoadingSpinner variant="pulse" text="펄스 로딩" size="large" />

// 바 스타일
<LoadingSpinner variant="bars" text="바 로딩" size="small" />
```

#### **크기 옵션**
- `small`: 32px
- `medium`: 48px (기본값)
- `large`: 64px

#### **특수 스타일 클래스**
```jsx
// 전체 화면 로딩
<LoadingSpinner 
    text="전체 화면 로딩 중..." 
    size="large" 
    className="loading-spinner-fullscreen"
/>

// 인라인 로딩 (카드 형태)
<LoadingSpinner 
    text="인라인 로딩" 
    size="medium" 
    className="loading-spinner-inline"
/>

// 텍스트 없음
<LoadingSpinner size="medium" showText={false} />
```

### 3. 기존 로딩바 통합 방법

#### **ErpLoading → LoadingSpinner 교체**
```jsx
// ❌ 기존 방식 (ErpLoading 사용)
import ErpLoading from '../components/erp/common/ErpLoading';

<ErpLoading message="로딩중..." size="medium" />

// ✅ 개선된 방식 (LoadingSpinner 사용)
import LoadingSpinner from '../components/common/LoadingSpinner';

<LoadingSpinner text="로딩 중..." size="medium" />
```

#### **인라인 로딩 스피너 교체**
```jsx
// ❌ 기존 방식 (인라인 스타일)
<div style={{textAlign: 'center', padding: '20px'}}>
  <div className="spinner-border text-primary" role="status">
    <span className="sr-only">로딩중...</span>
  </div>
  <p>사용자 정보 불러오는 중...</p>
</div>

// ✅ 개선된 방식 (LoadingSpinner 사용)
import LoadingSpinner from '../components/common/LoadingSpinner';

<LoadingSpinner 
  text="사용자 정보 불러오는 중..." 
  size="medium"
  className="loading-spinner-inline"
/>
```

### 4. Props 상세 가이드

#### **LoadingSpinner Props**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | string | "로딩 중..." | 표시할 텍스트 |
| `size` | string | "medium" | 크기 (small, medium, large) |
| `variant` | string | "default" | 스타일 (default, dots, pulse, bars) |
| `showText` | boolean | true | 텍스트 표시 여부 |
| `className` | string | "" | 추가 CSS 클래스 |

#### **사용 예시**
```jsx
// 다양한 상황별 사용법
const LoadingExamples = () => {
  return (
    <div>
      {/* 페이지 로딩 */}
      <LoadingSpinner 
        text="페이지를 불러오는 중..." 
        size="large"
        className="loading-spinner-fullscreen"
      />
      
      {/* 데이터 로딩 */}
      <LoadingSpinner 
        text="데이터를 불러오는 중..." 
        size="medium"
        variant="dots"
      />
      
      {/* 버튼 로딩 */}
      <LoadingSpinner 
        text="저장 중..." 
        size="small"
        showText={false}
      />
      
      {/* 차트 로딩 */}
      <LoadingSpinner 
        text="차트를 생성하는 중..." 
        size="medium"
        variant="pulse"
        className="loading-spinner-inline"
      />
    </div>
  );
};
```

### 5. CSS 스타일 클래스

#### **기본 클래스**
- `.loading-spinner-container`: 컨테이너
- `.loading-spinner-icon`: 기본 스피너 아이콘
- `.loading-spinner-text`: 텍스트

#### **바리언트별 클래스**
- `.loading-dots`: 도트 스타일
- `.loading-pulse`: 펄스 스타일
- `.loading-bars`: 바 스타일

#### **특수 클래스**
- `.loading-spinner-fullscreen`: 전체 화면 로딩
- `.loading-spinner-inline`: 인라인 로딩 (카드 형태)

### 6. 마이그레이션 체크리스트

#### **✅ 통합 완료 체크리스트**
- [ ] **ErpLoading 컴포넌트 제거**: `ErpLoading.js` 사용 중단
- [ ] **인라인 로딩 스피너 교체**: 모든 인라인 스피너를 LoadingSpinner로 교체
- [ ] **일관된 텍스트 사용**: "로딩 중...", "불러오는 중..." 등 통일
- [ ] **크기 표준화**: small/medium/large 크기 일관성 유지
- [ ] **스타일 통일**: 기본(default) 스타일 우선 사용
- [ ] **CSS 클래스 정리**: 불필요한 로딩 관련 CSS 제거

#### **마이그레이션 단계**
1. **1단계**: 기존 ErpLoading 사용 부분 식별
2. **2단계**: LoadingSpinner로 교체
3. **3단계**: 인라인 로딩 스피너 교체
4. **4단계**: 테스트 및 검증
5. **5단계**: 불필요한 컴포넌트 제거

### 7. 성능 최적화

#### **로딩 상태 관리**
```jsx
const [loading, setLoading] = useState(false);

const handleDataLoad = async () => {
  setLoading(true);
  try {
    const data = await fetchData();
    setData(data);
  } finally {
    setLoading(false);
  }
};

return (
  <div>
    {loading ? (
      <LoadingSpinner text="데이터를 불러오는 중..." size="medium" />
    ) : (
      <DataComponent data={data} />
    )}
  </div>
);
```

#### **조건부 렌더링**
```jsx
// ✅ 좋은 예: 조건부 렌더링
{isLoading ? (
  <LoadingSpinner text="로딩 중..." size="medium" />
) : (
  <ContentComponent />
)}

// ❌ 나쁜 예: 항상 렌더링
<div style={{opacity: isLoading ? 0.5 : 1}}>
  <LoadingSpinner text="로딩 중..." size="medium" />
  <ContentComponent />
</div>
```

## 프로필 이미지 처리 가이드라인 (2025-09-05 업데이트)

### 1. 프로필 이미지 저장 시스템

#### **데이터베이스 스키마**
```sql
-- User 테이블의 profile_image_url 컬럼을 TEXT 타입으로 변경
ALTER TABLE users MODIFY COLUMN profile_image_url TEXT;
```

#### **엔티티 설정**
```java
// User.java
@Column(name = "profile_image_url", columnDefinition = "TEXT")
private String profileImageUrl;
```

### 2. 프로필 이미지 우선순위 시스템

#### **백엔드 우선순위 로직**
```java
// AuthController.java - getCurrentUser 메서드
// 1. 세션 사용자 ID로 최신 정보 조회
User user = userRepository.findById(sessionUser.getId()).orElse(sessionUser);

// 2. 프로필 이미지 우선순위 적용
String profileImageUrl = null;
String socialProfileImage = null;
String socialProvider = null;

if (user.getProfileImageUrl() != null && !user.getProfileImageUrl().trim().isEmpty()) {
    // 사용자 업로드 이미지 (최우선)
    profileImageUrl = user.getProfileImageUrl();
} else if (!socialAccounts.isEmpty()) {
    // 소셜 이미지 (2순위)
    socialProfileImage = primarySocialAccount.getProviderProfileImage();
    socialProvider = primarySocialAccount.getProvider();
}
```

#### **프론트엔드 우선순위 로직**
```javascript
// SimpleHeader.js - getProfileImageUrl 함수
const getProfileImageUrl = () => {
  if (user?.profileImageUrl && !imageLoadError) {
    return user.profileImageUrl; // 사용자 업로드 이미지
  }
  if (user?.socialProfileImage && !imageLoadError) {
    return user.socialProfileImage; // 소셜 이미지
  }
  return null; // 기본 아이콘 사용
};
```

### 3. 이미지 크롭 및 저장 시스템

#### **프론트엔드 크롭 처리**
```javascript
// ProfileImageUpload.js - Canvas API를 사용한 이미지 크롭
const handleCropComplete = (croppedArea, croppedAreaPixels) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;
  
  ctx.drawImage(
    imageRef.current,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0, 0,
    croppedAreaPixels.width,
    croppedAreaPixels.height
  );
  
  const croppedImageData = canvas.toDataURL('image/jpeg', 0.8);
  setProfileImage(croppedImageData);
  setProfileImageType('USER_PROFILE');
};
```

#### **즉시 적용 시스템**
```javascript
// ProfileSection.js - 이미지 변경 시 즉시 적용
const handleImageChange = (imageData, imageType) => {
  setProfileImage(imageData);
  setProfileImageType(imageType);
  
  // 100ms 후 자동 저장
  setTimeout(() => {
    if (onSave) {
      onSave({ profileImage: imageData, profileImageType: imageType });
    }
  }, 100);
};
```

### 4. API 응답 형식 처리

#### **일관된 API 응답 구조**
```javascript
// 모든 API 응답은 다음 구조를 따름
{
  "success": true,
  "data": {}, // 실제 데이터
  "message": "성공 메시지",
  "totalCount": 30 // 데이터 개수 (선택적)
}
```

#### **API 호출 예시**
```javascript
// TodayStats.js - API 응답 처리 수정
const response = await apiGet(`/api/schedules?userId=0&userRole=ADMIN`);

if (response && response.success && Array.isArray(response.data)) {
  // response.data에서 실제 데이터 추출
  const todaySchedules = response.data.filter(schedule => 
    schedule.date === today
  );
}
```

### 5. 에러 처리 및 폴백

#### **이미지 로드 에러 처리**
```javascript
// SimpleHeader.js - 이미지 로드 실패 시 폴백
const handleImageError = () => {
  console.log('프로필 이미지 로드 실패, 기본 아이콘으로 대체');
  setImageLoadError(true);
};

const handleImageLoad = () => {
  console.log('프로필 이미지 로드 성공');
};
```

#### **기본 아바타 처리**
```javascript
// ProfileImageUpload.js - 기본 아바타 인라인 SVG
const DEFAULT_AVATAR_SVG = `data:image/svg+xml;base64,${btoa(`
  <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="60" fill="#f0f0f0"/>
    <g fill="#999999">
      <circle cx="60" cy="45" r="18"/>
      <path d="M30 100 C30 80, 45 70, 60 70 C75 70, 90 80, 90 100 L90 110 L30 110 Z"/>
    </g>
    <circle cx="60" cy="60" r="60" fill="none" stroke="#e0e0e0" stroke-width="2"/>
  </svg>
`)}`;
```

### 6. 성능 최적화

#### **이미지 크기 제한**
```javascript
// 이미지 크롭 시 품질 조정
const croppedImageData = canvas.toDataURL('image/jpeg', 0.8); // 80% 품질
```

#### **메모리 관리**
```javascript
// 컴포넌트 언마운트 시 이미지 정리
useEffect(() => {
  return () => {
    if (imageRef.current) {
      imageRef.current = null;
    }
  };
}, []);
```

## 최근 업데이트 (2025-09-13)

### OAuth2 소셜 로그인 간편 회원가입 시스템 완성

#### 1. 간편 회원가입 플로우 구현
- **파일**: `OAuth2Controller.java`, `AbstractOAuth2Service.java`, `SocialAuthServiceImpl.java`
- **변경사항**:
  - 카카오/네이버 OAuth2 로그인 시 계정이 없으면 간편 회원가입 모달 표시
  - URL 인코딩 처리로 한글 이름/닉네임 안전하게 전달
  - 소셜 사용자 정보를 프론트엔드로 전달하여 자동 입력

#### 2. 간편 회원가입 모달 시스템
- **파일**: `SocialSignupModal.js`, `TabletLogin.js`
- **변경사항**:
  - 소셜 계정 정보 자동 입력 (이메일, 이름, 닉네임)
  - 지점 선택 드롭다운 (한글명과 코드 함께 표시)
  - 프론트엔드 비밀번호 검증 (길이, 복잡도, 일치 확인)
  - 소셜 계정 프로필 이미지 자동 설정

#### 3. 백엔드 사용자 생성 로직
- **파일**: `SocialAuthServiceImpl.java`
- **변경사항**:
  - User 엔티티와 Client 엔티티 순차 생성으로 외래키 제약 해결
  - 사용자 입력 비밀번호 암호화 저장
  - 지점 코드를 통한 Branch 엔티티 자동 연결
  - 소셜 계정 정보와 User 엔티티 연결

#### 4. 소셜 계정 연동/해제 시스템
- **파일**: `ClientSocialAccountController.java`, `MyPage.js`
- **변경사항**:
  - 소셜 계정 연동 해제 API 구현 (소프트 삭제)
  - 소셜 계정 재연동 시 올바른 OAuth2 URL 생성
  - 연동 시 프로필 이미지 자동 업데이트

#### 5. 프로필 이미지 자동 업데이트
- **파일**: `AbstractOAuth2Service.java`
- **변경사항**:
  - 소셜 계정 연동 시 사용자 프로필 이미지 자동 업데이트
  - 기존 이미지 상태와 관계없이 소셜 이미지로 교체
  - 연동 의도가 명확한 경우 최신 프로필 이미지 보장

### 기술적 구현 세부사항

#### 간편 회원가입 플로우
```java
// 1. 소셜 로그인 시 계정 없음 감지
if (existingUserId == null) {
    return SocialLoginResponse.builder()
        .requiresSignup(true)
        .socialUserInfo(socialUserInfo)
        .build();
}

// 2. URL 인코딩으로 한글 정보 안전 전달
String signupUrl = frontendBaseUrl + "/login?" +
    "signup=required" +
    "&provider=kakao" +
    "&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8) +
    "&name=" + URLEncoder.encode(name, StandardCharsets.UTF_8) +
    "&nickname=" + URLEncoder.encode(nickname, StandardCharsets.UTF_8);
```

#### 사용자 생성 순서
```java
// 1. User 엔티티 먼저 생성
User user = User.builder()
    .username(username)
    .password(passwordEncoder.encode(request.getPassword()))
    .name(request.getName())
    .email(request.getEmail())
    .phone(phone)
    .role(UserRole.CLIENT)
    .branchCode(request.getBranchCode())
    .branch(branch)
    .profileImageUrl(request.getProviderProfileImage())
    .build();

user = userRepository.save(user); // ID 생성됨

// 2. Client 엔티티 생성 (User ID 사용)
Client client = Client.builder()
    .id(user.getId()) // User의 ID 사용
    .user(user)
    .build();

clientRepository.save(client);
```

#### 프론트엔드 비밀번호 검증
```javascript
// 비밀번호 검증 로직
const validatePassword = (password) => {
  if (!password) return '비밀번호를 입력해주세요.';
  if (password.length < 8) return '비밀번호는 8자 이상 입력해주세요.';
  if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) {
    return '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.';
  }
  return null;
};
```

### 해결된 주요 문제들

1. **URL 인코딩 오류**: 한글 이름/닉네임을 `URLEncoder.encode()`로 안전하게 처리
2. **외래키 제약 위반**: User → Client 순서로 엔티티 생성하여 해결
3. **프로필 이미지 미업데이트**: 소셜 계정 연동 시 `shouldUpdateUserProfileImage()` 항상 true 반환
4. **소셜 계정 연동 실패**: OAuth2 URL 생성 및 응답 파싱 로직 개선
5. **비밀번호 검증**: 프론트엔드에서 즉시 피드백 제공

### API 엔드포인트 추가
- `POST /api/auth/social/signup`: 간편 회원가입 처리
- `POST /api/client/social-account`: 소셜 계정 연동/해제 관리
- `GET /api/auth/test/signup-required`: 테스트용 간편 회원가입 시뮬레이션

## 다음 단계

1. **공통 로딩바 컴포넌트 통일**: 현재 여러 로딩바가 혼재되어 있음
2. **소셜 로그인 테스트 완료**: 카카오/네이버 간편 회원가입 전체 플로우 검증
3. **프로필 이미지 시스템 테스트**: 업로드/연동/해제 전체 플로우 확인
4. **햄버거 메뉴 동작 확인**: 모든 메뉴 항목 정상 동작 검증
5. **전체 UI/UX 검증**: 사용자 경험 일관성 확인
6. **통계 대시보드 성능 최적화**
7. **차트 컴포넌트 확장성 개선**
8. **반응형 디자인 완성도 향상**
