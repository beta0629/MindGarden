# 운영환경 환경변수 설정 가이드

## ⚠️ 중요: 설정 파일 백업

**운영환경 설정이 손실될 경우를 대비해 백업본을 제공합니다:**

- **원본**: `src/main/resources/application-prod.yml`
- **백업본**: `src/main/resources/application-prod.yml.backup` (수동 생성 필요)

**백업본 생성:**
```bash
# 운영환경 설정 백업
cp src/main/resources/application-prod.yml src/main/resources/application-prod.yml.backup
```

**설정 파일이 손실된 경우:**
```bash
# 백업본에서 복원
cp src/main/resources/application-prod.yml.backup src/main/resources/application-prod.yml
```

## 필수 환경변수

### 데이터베이스 설정
```bash
# MySQL 데이터베이스 연결 정보
DB_HOST=your-mysql-host.com
DB_PORT=3306
DB_NAME=mindgarden_consultation
DB_USERNAME=mindgarden_user
DB_PASSWORD=your-secure-database-password
```

### OAuth2 설정

#### 카카오 OAuth2
```bash
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
KAKAO_REDIRECT_URI=https://yourdomain.com/api/auth/kakao/callback
```

#### 네이버 OAuth2
```bash
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
NAVER_REDIRECT_URI=https://yourdomain.com/api/auth/naver/callback
```

### 보안 설정
```bash
# JWT 시크릿 키 (최소 256비트 권장)
JWT_SECRET=your-very-secure-jwt-secret-key-at-least-32-characters-long

# 개인정보 암호화 키 (32자리)
PERSONAL_DATA_ENCRYPTION_KEY=your-32-character-encryption-key
PERSONAL_DATA_ENCRYPTION_IV=your-16-character-iv

# 관리자 계정
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password
```

### 이메일 설정
```bash
# SMTP 서버 설정
SMTP_HOST=smtp.your-email-provider.com
SMTP_PORT=587
SMTP_USERNAME=your-email@yourdomain.com
SMTP_PASSWORD=your-email-password
```

### CORS 설정
```bash
# 허용된 도메인 (쉼표로 구분)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## 환경변수 설정 방법

### 1. Docker 환경
```bash
# docker-compose.yml
environment:
  - DB_HOST=mysql
  - DB_NAME=mindgarden_consultation
  - JWT_SECRET=your-jwt-secret
  # ... 기타 환경변수
```

### 2. Kubernetes 환경
```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mindgarden-config
data:
  DB_HOST: "mysql-service"
  DB_NAME: "mindgarden_consultation"
  # ... 기타 설정
---
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: mindgarden-secrets
type: Opaque
data:
  DB_PASSWORD: <base64-encoded-password>
  JWT_SECRET: <base64-encoded-jwt-secret>
  # ... 기타 시크릿
```

### 3. 서버 환경
```bash
# /etc/environment 또는 ~/.bashrc
export DB_HOST=your-mysql-host.com
export DB_PASSWORD=your-secure-password
export JWT_SECRET=your-jwt-secret
# ... 기타 환경변수
```

## 보안 체크리스트

- [ ] 모든 패스워드는 강력한 복잡성을 가져야 함
- [ ] JWT 시크릿은 최소 32자리 이상
- [ ] 암호화 키는 안전하게 생성하고 보관
- [ ] 데이터베이스 연결은 SSL/TLS 사용
- [ ] CORS 설정은 실제 도메인으로만 제한
- [ ] 환경변수 파일은 적절한 권한(600)으로 설정

## 키 생성 방법

### JWT 시크릿 키 생성
```bash
# OpenSSL 사용
openssl rand -base64 32

# 또는 Java 코드로 생성
String jwtSecret = java.util.UUID.randomUUID().toString().replace("-", "") + 
                   java.util.UUID.randomUUID().toString().replace("-", "");
```

### 암호화 키 생성
```bash
# 32자리 키 생성
openssl rand -hex 16

# 16자리 IV 생성
openssl rand -hex 8
```

## 모니터링 설정

### 헬스체크 엔드포인트
- `GET /actuator/health` - 애플리케이션 상태
- `GET /actuator/info` - 애플리케이션 정보

### 로그 레벨
- 운영환경에서는 WARN 레벨 이상만 로깅
- 민감한 정보는 로그에 포함하지 않음
