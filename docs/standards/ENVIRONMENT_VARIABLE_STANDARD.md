# 환경 변수 관리 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 환경 변수 관리 표준입니다.  
환경 변수 네이밍, 보안 관리, 문서화 규칙을 정의합니다.

### 참조 문서
- [시스템 명칭 통일 표준](./SYSTEM_NAMING_STANDARD.md)
- [보안 표준](./SECURITY_STANDARD.md)
- [암호화 처리 표준](./ENCRYPTION_STANDARD.md)

### 구현 위치
- **환경 변수 파일**: `.env.local`, `.env.example`
- **설정 파일**: `application.yml`, `application-local.yml`, `application-prod.yml`

---

## 🎯 환경 변수 관리 원칙

### 1. 보안 우선
```
민감한 정보는 절대 코드에 포함하지 않음
```

**원칙**:
- ✅ 모든 민감한 정보는 환경 변수로 관리
- ✅ 환경 변수 파일은 Git에 커밋 금지
- ✅ 예시 파일(.env.example)만 Git에 포함
- ❌ 비밀번호, API 키 코드에 직접 작성 금지

### 2. 환경별 분리
```
개발, 스테이징, 운영 환경 완전 분리
```

**원칙**:
- ✅ 환경별 설정 파일 분리
- ✅ 환경 변수 값 분리
- ✅ 환경 간 변수 공유 금지
- ❌ 운영 환경 변수를 개발 환경에 사용 금지

### 3. 문서화 필수
```
모든 환경 변수는 문서화되어야 함
```

**원칙**:
- ✅ 환경 변수 목록 및 설명 문서화
- ✅ 필수 변수와 선택 변수 구분
- ✅ 기본값 및 예시 값 제공
- ❌ 문서화되지 않은 환경 변수 사용 금지

---

## 📋 환경 변수 네이밍 규칙

### 1. 네이밍 형식

```
{시스템}_<{카테고리}>_{설명}
```

**구성 요소**:
- **{시스템}**: 시스템 식별자 (CS, OPS 등)
- **{카테고리}**: 카테고리 (선택 사항)
- **{설명}**: 설명 (UPPER_SNAKE_CASE)

### 2. 시스템 식별자

#### Core System
```
CS_{카테고리}_{설명}
```

#### Ops System
```
OPS_{카테고리}_{설명}
```

#### 공통 (시스템 구분 불필요)
```
{카테고리}_{설명}
```

### 3. 카테고리

#### 데이터베이스
```
DB_{설명}
CS_DB_{설명}
```

#### 인증 및 보안
```
AUTH_{설명}
JWT_{설명}
SECRET_{설명}
```

#### 외부 서비스
```
{서비스명}_{설명}
```

#### 서버 설정
```
SERVER_{설명}
PORT
HOST
```

### 4. 네이밍 예시

#### 데이터베이스
```bash
# Core System
CS_DB_URL=jdbc:mysql://localhost:3306/core_solution
CS_DB_USERNAME=coresolution_user
CS_DB_PASSWORD=***

# Ops System
OPS_DB_URL=jdbc:postgresql://localhost:5432/coresolution_ops
OPS_DB_USERNAME=ops_user
OPS_DB_PASSWORD=***

# 공통
DB_HOST=localhost
DB_PORT=3306
```

#### 인증 및 보안
```bash
# JWT
CS_JWT_SECRET=***
CS_JWT_ISSUER=https://auth.coresolution.com
CS_JWT_EXPIRATION=3600

# 암호화
CS_ENCRYPTION_KEY=***
CS_ENCRYPTION_IV=***
```

#### 외부 서비스
```bash
# OpenAI
OPENAI_API_KEY=sk-***

# OAuth2
KAKAO_CLIENT_ID=***
KAKAO_CLIENT_SECRET=***
KAKAO_REDIRECT_URI=https://...

NAVER_CLIENT_ID=***
NAVER_CLIENT_SECRET=***
NAVER_REDIRECT_URI=https://...

# 이메일
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=***
SMTP_PASSWORD=***
```

#### 서버 설정
```bash
SERVER_PORT=8080
SERVER_HOST=localhost
ALLOWED_ORIGINS=https://...
```

---

## 🔒 보안 관리

### 1. 민감한 정보 분류

#### 높음 (High)
- 비밀번호 (DB, SMTP 등)
- API 키 (OpenAI, OAuth2 등)
- JWT 시크릿 키
- 암호화 키

#### 중간 (Medium)
- 데이터베이스 호스트
- 서버 포트
- 외부 서비스 URL

#### 낮음 (Low)
- 기능 플래그
- 로그 레벨
- 기본값 설정

### 2. 보안 규칙

#### Git 커밋 금지
```bash
# ❌ 금지: 민감한 정보 포함 파일 커밋
.env
.env.local
.env.production
application-prod.yml
application-local.yml

# ✅ 허용: 예시 파일만 커밋
.env.example
application-local.yml.example
```

#### .gitignore 설정
```gitignore
# 환경 변수 파일
.env
.env.*
!.env.example
.env.local
.env.production

# 설정 파일 (민감한 정보 포함)
application-prod.yml
application-local.yml
application-*.yml
!application.yml
!application-*.example.yml
```

### 3. 환경 변수 암호화

#### 운영 환경
- 환경 변수는 서버 환경 변수로 관리
- 시스템 환경 변수 사용 권장
- 비밀번호 관리 도구 사용 권장 (Vault, AWS Secrets Manager 등)

#### 개발 환경
- `.env.local` 파일 사용 (Git 커밋 금지)
- 각 개발자가 로컬에서 관리
- 예시 파일 (`.env.example`) 제공

---

## 📝 환경 변수 문서화

### 1. .env.example 파일

#### 구조
```bash
# ============================================
# 데이터베이스 설정
# ============================================
DB_HOST=localhost
DB_PORT=3306
DB_NAME=core_solution
DB_USERNAME=your_username
DB_PASSWORD=your_password

# ============================================
# JWT 설정
# ============================================
CS_JWT_SECRET=your-jwt-secret-key-at-least-32-characters-long
CS_JWT_EXPIRATION=3600

# ============================================
# 암호화 설정
# ============================================
CS_ENCRYPTION_KEY=your-32-character-encryption-key
CS_ENCRYPTION_IV=your-16-character-iv

# ============================================
# 외부 서비스 API 키
# ============================================
OPENAI_API_KEY=sk-your-openai-api-key

# ============================================
# OAuth2 설정
# ============================================
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
KAKAO_REDIRECT_URI=http://localhost:8080/api/auth/kakao/callback

# ============================================
# 이메일 설정
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-email-password

# ============================================
# 서버 설정
# ============================================
SERVER_PORT=8080
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

#### 규칙
- 모든 환경 변수 포함
- 실제 값 대신 예시 값 사용
- 설명 주석 추가
- 필수 변수와 선택 변수 구분

### 2. 환경 변수 목록 문서

#### 구조
```markdown
## 환경 변수 목록

### 데이터베이스 설정

| 변수명 | 설명 | 필수 | 기본값 | 예시 |
|--------|------|------|--------|------|
| DB_HOST | 데이터베이스 호스트 | ✅ | localhost | localhost |
| DB_PORT | 데이터베이스 포트 | ✅ | 3306 | 3306 |
| DB_NAME | 데이터베이스 이름 | ✅ | - | core_solution |
| DB_USERNAME | 데이터베이스 사용자명 | ✅ | - | coresolution_user |
| DB_PASSWORD | 데이터베이스 비밀번호 | ✅ | - | *** |

### JWT 설정

| 변수명 | 설명 | 필수 | 기본값 | 예시 |
|--------|------|------|--------|------|
| CS_JWT_SECRET | JWT 시크릿 키 | ✅ | - | your-secret-key |
| CS_JWT_EXPIRATION | JWT 만료 시간 (초) | ❌ | 3600 | 3600 |
```

### 3. 설정 파일 주석

#### application.yml
```yaml
spring:
  datasource:
    # 데이터베이스 연결 설정
    # 환경 변수에서 읽어옴: DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD
    url: jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:core_solution}
    username: ${DB_USERNAME:coresolution_user}
    password: ${DB_PASSWORD:}
```

---

## 🔧 환경별 설정 관리

### 1. 환경 구분

#### 개발 환경 (Development)
- **파일**: `application-local.yml`, `.env.local`
- **용도**: 로컬 개발
- **DB**: 개발 데이터베이스
- **보안**: 낮은 수준 (개발용)

#### 스테이징 환경 (Staging)
- **파일**: `application-staging.yml`
- **용도**: 배포 전 테스트
- **DB**: 스테이징 데이터베이스
- **보안**: 중간 수준

#### 운영 환경 (Production)
- **파일**: 환경 변수로 관리 (파일 커밋 금지)
- **용도**: 실제 서비스
- **DB**: 운영 데이터베이스
- **보안**: 최고 수준

### 2. 환경 변수 우선순위

```
환경 변수 > application-{profile}.yml > application.yml
```

### 3. 프로파일 설정

#### application.yml
```yaml
spring:
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:local}
```

#### 환경 변수로 프로파일 지정
```bash
SPRING_PROFILES_ACTIVE=prod
```

---

## ✅ 환경 변수 관리 체크리스트

### 환경 변수 추가 시

- [ ] 네이밍 규칙 준수
- [ ] `.env.example` 파일 업데이트
- [ ] 환경 변수 목록 문서 업데이트
- [ ] 보안 분류 확인
- [ ] 기본값 설정 (선택 변수인 경우)
- [ ] 주석 추가 (설정 파일)

### 환경 변수 사용 시

- [ ] 환경 변수 존재 확인
- [ ] 기본값 설정 (필요 시)
- [ ] 타입 변환 확인
- [ ] 유효성 검증 (필요 시)

### 배포 시

- [ ] 운영 환경 변수 설정 확인
- [ ] 민감한 정보 Git 커밋 확인
- [ ] 환경 변수 값 검증
- [ ] 문서화 확인

---

## 🚫 금지 사항

### 1. 하드코딩 금지

```java
// ❌ 금지: 하드코딩
String dbPassword = "myPassword123";
String apiKey = "sk-1234567890";

// ✅ 권장: 환경 변수 사용
@Value("${DB_PASSWORD}")
private String dbPassword;

@Value("${OPENAI_API_KEY}")
private String apiKey;
```

### 2. Git 커밋 금지

```bash
# ❌ 금지: 민감한 정보 포함 파일 커밋
git add .env.local
git add application-prod.yml

# ✅ 권장: 예시 파일만 커밋
git add .env.example
git add application-local.yml.example
```

### 3. 환경 간 공유 금지

```bash
# ❌ 금지: 운영 환경 변수를 개발 환경에 사용
# 개발 환경 .env.local
DB_PASSWORD=production_password  # 운영 비밀번호 사용

# ✅ 권장: 환경별 분리
# 개발 환경 .env.local
DB_PASSWORD=dev_password

# 운영 환경 (환경 변수)
DB_PASSWORD=production_password
```

### 4. 문서화 누락 금지

```bash
# ❌ 금지: 문서화 없이 환경 변수 추가
NEW_API_KEY=sk-1234567890  # 문서에 설명 없음

# ✅ 권장: 문서화 후 사용
# .env.example에 추가
# 환경 변수 목록 문서에 추가
NEW_API_KEY=your-api-key-here
```

---

## 📖 예시

### 예시 1: 데이터베이스 설정

#### .env.example
```bash
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_NAME=core_solution
DB_USERNAME=coresolution_user
DB_PASSWORD=your_password_here
```

#### application-local.yml
```yaml
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:core_solution}?useSSL=false&serverTimezone=Asia/Seoul
    username: ${DB_USERNAME:coresolution_user}
    password: ${DB_PASSWORD:}
    driver-class-name: com.mysql.cj.jdbc.Driver
```

#### Java 코드
```java
@Value("${DB_HOST:localhost}")
private String dbHost;

@Value("${DB_PORT:3306}")
private int dbPort;
```

### 예시 2: JWT 설정

#### .env.example
```bash
# JWT 설정
CS_JWT_SECRET=your-jwt-secret-key-at-least-32-characters-long
CS_JWT_EXPIRATION=3600
CS_JWT_ISSUER=https://auth.coresolution.com
```

#### application.yml
```yaml
jwt:
  secret: ${CS_JWT_SECRET:default-secret-key}
  expiration: ${CS_JWT_EXPIRATION:3600}
  issuer: ${CS_JWT_ISSUER:https://auth.coresolution.com}
```

### 예시 3: 외부 서비스 API 키

#### .env.example
```bash
# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key

# 카카오 OAuth2
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
KAKAO_REDIRECT_URI=http://localhost:8080/api/auth/kakao/callback
```

#### Java 코드
```java
@Value("${OPENAI_API_KEY:}")
private String openaiApiKey;

@Value("${KAKAO_CLIENT_ID:}")
private String kakaoClientId;

@Value("${KAKAO_CLIENT_SECRET:}")
private String kakaoClientSecret;
```

---

## 📞 문의

환경 변수 관리 표준 관련 문의:
- DevOps 팀
- 보안 팀

**최종 업데이트**: 2025-12-03

