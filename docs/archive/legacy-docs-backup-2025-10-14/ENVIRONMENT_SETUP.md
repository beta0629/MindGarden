# 🌍 환경별 설정 가이드

## 📋 개요

MindGarden 통합 상담관리 시스템은 **로컬(Local)**과 **운영(Production)** 2개 환경 모드를 지원합니다.

## ⚠️ 중요: 설정 파일 백업

**로컬 개발 환경 설정이 손실될 경우를 대비해 백업본을 제공합니다:**

- **원본**: `src/main/resources/application-local.yml`
- **백업본**: `src/main/resources/application-local.yml.backup`

**설정 파일이 손실된 경우:**
```bash
# 백업본에서 복원
cp src/main/resources/application-local.yml.backup src/main/resources/application-local.yml
```

**백업본 업데이트 시점:**
- OAuth2 클라이언트 ID/시크릿 키 변경 후
- 데이터베이스 연결 정보 변경 후
- 중요한 설정 변경 후

## 🏠 로컬 환경 (Local)

### **용도**
- 개발자 개인 개발 환경
- 단위 테스트 및 통합 테스트
- 기능 개발 및 디버깅

### **특징**
- **데이터베이스**: MySQL 로컬 인스턴스
- **Hibernate**: `ddl-auto: create-drop` (개발용 테이블 재생성)
- **로깅**: DEBUG 레벨, 상세한 SQL 로그
- **캐시**: 비활성화
- **보안**: 개발용으로 완화 (isDev 프로퍼티 기반)
- **CORS**: 모든 도메인 허용

### **설정 파일**
```yaml
# application-local.yml
spring:
  profiles:
    active: local
  
  # 개발 환경 전용 설정
  main:
    allow-circular-references: true  # 순환 참조 허용 (개발용)
  
  datasource:
    url: jdbc:mysql://localhost:3306/mind_garden?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8&allowPublicKeyRetrieval=true
    username: mindgarden
    password: <REDACTED-pre-B8-rotation>
    driver-class-name: com.mysql.cj.jdbc.Driver
  
  jpa:
    hibernate:
      ddl-auto: update  # 개발용으로 스키마 업데이트 ✅
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQL8Dialect
        format_sql: true
        use_sql_comments: true
        # 개발 환경 전용 설정
        jdbc:
          batch_size: 20
        cache:
          use_second_level_cache: false
          use_query_cache: false

# 개발 환경 전용 프로퍼티
isDev: true
isLocal: true
isDevelopment: true

  # 개발 환경 전용 설정
  development:
    # 데이터베이스 초기화
    database:
      initialize: true
      seed-data: true
    
    # 보안 설정
    security:
      # 개발용으로 보안 완화
      oauth2:
        enabled: true  # OAuth2 활성화 ✅
        kakao:
          client-id: "cbb457cfb5f9351fd495be4af2b11a34"
          client-secret: "LH53SXuqZk7iEVeDkKfQuKxW0sdxYmEG"
          redirect-uri: "http://localhost:8080/api/auth/kakao/callback"
        naver:
          client-id: "vTKNlxYKIfo1uCCXaDfk"
          client-secret: "V_b3omW5pu"
          redirect-uri: "http://localhost:8080/api/auth/naver/callback"
      jwt:
        secret: "dev-secret-key-for-local-testing-only"
        expiration: 86400000  # 24시간
    
    # 암호화 설정
    encryption:
      personal-data:
        key: "dev-encryption-key-32-chars-long"
        iv: "dev-iv-16-chars"
  
  # API 설정
  api:
    # 개발용으로 CORS 허용
    cors:
      allowed-origins: "*"
      allowed-methods: "*"
      allowed-headers: "*"
```

### **실행 방법**
```bash
# 방법 1: Maven 프로파일 사용 (권장)
mvn spring-boot:run -Dspring-boot.run.profiles=local

# 방법 2: 환경 변수 설정
export SPRING_PROFILES_ACTIVE=local
mvn spring-boot:run

# 방법 3: JAR 실행
java -jar target/consultation-management-system-1.0.0.jar --spring.profiles.active=local
```

### **OAuth2 설정**

#### **카카오 개발자 콘솔 설정**
1. **애플리케이션 등록**: https://developers.kakao.com/
2. **플랫폼 설정**: Web 플랫폼 추가
3. **도메인 설정**: `http://localhost:8080`
4. **리다이렉트 URI**: `http://localhost:8080/api/auth/kakao/callback`
5. **동의항목**: 닉네임, 프로필 사진, 이메일 주소

#### **네이버 개발자 콘솔 설정**
1. **애플리케이션 등록**: https://developers.naver.com/
2. **서비스 환경**: Web 서비스
3. **도메인 설정**: `http://localhost:8080`
4. **리다이렉트 URI**: `http://localhost:8080/api/auth/naver/callback`
5. **동의항목**: 이름, 이메일, 성별, 생년월일

### **데이터베이스 설정**
```sql
-- 로컬 데이터베이스 생성
CREATE DATABASE mind_garden 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 보안을 위한 전용 사용자 생성 (권장)
CREATE USER IF NOT EXISTS 'mindgarden'@'localhost' IDENTIFIED BY '<REDACTED-pre-B8-rotation>';
GRANT ALL PRIVILEGES ON mind_garden.* TO 'mindgarden'@'localhost';
FLUSH PRIVILEGES;

-- 또는 root 사용자 사용 (개발용, 보안상 권장하지 않음)
-- CREATE USER IF NOT EXISTS 'root'@'localhost' IDENTIFIED BY 'root';
-- GRANT ALL PRIVILEGES ON mind_garden.* TO 'root'@'localhost';
-- FLUSH PRIVILEGES;
```

### **개발 환경 전용 설정 클래스**
```java
// DevelopmentConfig.java
@Configuration
@Profile("local")
public class DevelopmentConfig implements WebMvcConfigurer {
    
    @Value("${isDev:false}")
    private boolean isDev;
    
    @Value("${isLocal:false}")
    private boolean isLocal;
    
    @Value("${isDevelopment:false}")
    private boolean isDevelopment;
    
    // 개발 환경에서 CORS 설정 완전 허용
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        if (isDev || isLocal || isDevelopment) {
            registry.addMapping("/**")
                    .allowedOriginPatterns("*")
                    .allowedMethods("*")
                    .allowedHeaders("*")
                    .allowCredentials(false)
                    .maxAge(3600);
        }
    }
}
```

## 🚀 운영 환경 (Production)

### **용도**
- 실제 서비스 운영
- 고객 사용 환경
- 성능 최적화 및 보안 강화

### **특징**
- **데이터베이스**: 운영용 MySQL 서버
- **Hibernate**: `ddl-auto: validate` (스키마 검증만)
- **로깅**: INFO 레벨, 최소한의 로그
- **캐시**: 활성화 (EhCache)
- **보안**: SSL 필수, 세션 타임아웃

### **설정 파일**
```yaml
# application-prod.yml
spring:
  profiles:
    active: prod
  
  datasource:
    url: jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  
  jpa:
    hibernate:
      ddl-auto: validate  # 스키마 검증만
    show-sql: false       # SQL 로그 비활성화
```

### **실행 방법**
```bash
# 방법 1: Maven 프로파일 사용
mvn spring-boot:run -Dspring-boot.run.profiles=prod

# 방법 2: 환경 변수 설정
export SPRING_PROFILES_ACTIVE=prod
mvn spring-boot:run

# 방법 3: JAR 실행
java -jar target/consultation-management-system-1.0.0.jar --spring.profiles.active=prod
```

### **환경 변수 설정**
```bash
# 운영 환경 필수 환경 변수
export SPRING_PROFILES_ACTIVE=prod
export DB_HOST=your-db-host
export DB_PORT=3306
export DB_NAME=mindgarden_consultation
export DB_USERNAME=your-db-username
export DB_PASSWORD=your-secure-password
export JWT_SECRET=your-super-secure-jwt-secret
export PERSONAL_INFO_ENCRYPTION_KEY=your-super-secure-encryption-key
export UPLOAD_DIR=/var/uploads/prod

# SNS OAuth2 설정
export KAKAO_CLIENT_ID=your-kakao-client-id
export KAKAO_CLIENT_SECRET=your-kakao-client-secret
export NAVER_CLIENT_ID=your-naver-client-id
export NAVER_CLIENT_SECRET=your-naver-client-secret
export FACEBOOK_CLIENT_ID=your-facebook-client-id
export FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
export INSTAGRAM_CLIENT_ID=your-instagram-client-id
export INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret
```

## 🔄 환경 전환

### **로컬 → 운영 전환**
```bash
# 1. 환경 변수 설정
export SPRING_PROFILES_ACTIVE=prod

# 2. 애플리케이션 재시작
mvn spring-boot:run

# 또는 JAR 재시작
java -jar target/consultation-management-system-1.0.0.jar --spring.profiles.active=prod
```

### **운영 → 로컬 전환**
```bash
# 1. 환경 변수 설정
export SPRING_PROFILES_ACTIVE=local

# 2. 애플리케이션 재시작
mvn spring-boot:run

# 또는 JAR 재시작
java -jar target/consultation-management-system-1.0.0.jar --spring.profiles.active=local
```

## 📊 환경별 설정 비교

| 설정 항목 | 로컬 (Local) | 운영 (Production) |
|-----------|---------------|-------------------|
| **프로파일** | `local` | `prod` |
| **데이터베이스** | `mind_garden` | `${DB_NAME}` |
| **Hibernate ddl-auto** | `create-drop` | `validate` |
| **SQL 로그** | `true` (DEBUG) | `false` (WARN) |
| **캐시** | 비활성화 | EhCache 활성화 |
| **연결 풀 크기** | 10 | 50 |
| **Thymeleaf 캐시** | `false` | `true` |
| **로그 레벨** | DEBUG | INFO |
| **샘플 데이터** | 자동 생성 | 비활성화 |
| **SSL** | 선택사항 | 필수 |
| **암호화 키** | `dev-secret-key-for-local-testing-only` | 환경변수로 설정 |
| **CORS** | 모든 도메인 허용 | 제한적 허용 |
| **순환 참조** | 허용 (`allow-circular-references: true`) | 금지 |
| **isDev 프로퍼티** | `true` | `false` |

## 🛠 환경별 개발 도구

### **로컬 환경 도구**
- **데이터베이스**: MySQL Workbench, phpMyAdmin
- **API 테스트**: Postman, Insomnia
- **로그 확인**: IDE 콘솔, 로그 파일
- **데이터 확인**: H2 Console (테스트용)

### **운영 환경 도구**
- **모니터링**: Spring Boot Actuator
- **메트릭**: Prometheus + Grafana
- **로그 분석**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **성능 모니터링**: Micrometer

## 🚨 주의사항

### **로컬 환경**
- ✅ 개발 중 자유로운 데이터베이스 스키마 변경
- ✅ 상세한 로그로 디버깅 용이
- ✅ 샘플 데이터 자동 생성
- ✅ CORS 완전 허용으로 프론트엔드 개발 용이
- ✅ 순환 참조 허용으로 개발 편의성 증대
- ⚠️ 실제 운영 데이터와 분리 필수
- ⚠️ 보안 설정 완화 (isDev 프로퍼티 기반)

### **운영 환경**
- ✅ 안정적인 서비스 운영
- ✅ 보안 강화 및 성능 최적화
- ✅ 데이터 무결성 보장
- ⚠️ 스키마 변경 시 별도 마이그레이션 필요
- ⚠️ CORS 및 보안 설정 엄격하게 적용

## 📝 환경별 설정 파일 구조

```
src/main/resources/
├── application.yml          # 공통 설정
├── application-local.yml    # 로컬 환경 설정 (isDev: true)
└── application-prod.yml    # 운영 환경 설정 (isDev: false)

src/main/java/com/mindgarden/consultation/config/
├── DevelopmentConfig.java   # 로컬 환경 전용 설정 클래스
└── SecurityConfig.java     # 보안 설정
```

## 🔍 환경 확인

### **현재 활성 프로파일 확인**
```bash
# 애플리케이션 실행 중
curl http://localhost:8080/actuator/env | grep activeProfiles

# 또는 로그에서 확인
tail -f logs/mindgarden.log | grep "The following profiles are active"
```

### **환경별 설정 값 확인**
```bash
# 로컬 환경
curl http://localhost:8080/actuator/configprops | grep "spring.datasource"

# 운영 환경
curl http://localhost:8080/actuator/configprops | grep "spring.datasource"
```

### **isDev 프로퍼티 확인**
```bash
# 로컬 환경에서 isDev 프로퍼티 확인
curl http://localhost:8080/actuator/env | grep "isDev"

# 개발 환경 로그 확인
tail -f logs/mindgarden.log | grep "🚀 개발 환경이 활성화되었습니다"
```

## 🚀 로컬 개발 환경 시작 가이드

### **1단계: 데이터베이스 준비**
```bash
# MySQL 서비스 시작
brew services start mysql

# 데이터베이스 및 사용자 생성
mysql -u root -p
CREATE DATABASE mind_garden CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mindgarden'@'localhost' IDENTIFIED BY '<REDACTED-pre-B8-rotation>';
GRANT ALL PRIVILEGES ON mind_garden.* TO 'mindgarden'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### **2단계: 애플리케이션 실행**
```bash
# 프로젝트 디렉토리로 이동
cd /Users/mind/mindGarden

# 로컬 프로파일로 실행
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### **3단계: 환경 확인**
```bash
# 서버 상태 확인
curl http://localhost:8080/api/v1/auth/health

# 데이터베이스 테이블 생성 확인
mysql -u mindgarden -p'<REDACTED-pre-B8-rotation>' -e "USE mind_garden; SHOW TABLES;"
```

### **4단계: 회원가입/로그인 테스트**
```bash
# 회원가입 테스트
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "테스트 사용자",
    "phone": "010-1234-5678",
    "role": "CLIENT"
  }'

# 로그인 테스트
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

**📌 참고**: 
1. 환경 전환 시 반드시 애플리케이션을 재시작해야 합니다. 런타임 중 프로파일 변경은 지원되지 않습니다.
2. 로컬 환경에서는 `isDev: true` 프로퍼티로 인해 보안이 완화되므로 실제 운영에는 사용하지 마세요.
3. 개발 환경에서는 `ddl-auto: create-drop`으로 테이블이 매번 재생성되므로 중요한 데이터는 백업하세요.
