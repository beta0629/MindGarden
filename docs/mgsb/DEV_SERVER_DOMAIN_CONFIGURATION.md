# 개발 서버 도메인 설정 가이드

**작성일**: 2025-11-18  
**목적**: 개발 서버 도메인 설정 및 회사 도메인/솔루션 도메인 구분

## 서버 IP 주소

- **개발 서버**: `114.202.247.246`
- **운영 서버**: `211.37.179.204`

## 1. 도메인 구조

### 1.1 도메인 역할 분리

| 구분 | 도메인 | 목적 | 비고 |
|------|--------|------|------|
| **회사 도메인** | `e-trinity.co.kr` | Trinity 회사 홈페이지 (운영) | 회사 소개, 제품 소개 |
| | `dev.e-trinity.co.kr` | Trinity 회사 홈페이지 (개발) | 개발 환경 회사 홈페이지 |
| | `apply.e-trinity.co.kr` | 온보딩 신청 (운영) | 입점사 신청, 결제 수단 등록 |
| | `apply.dev.e-trinity.co.kr` | 온보딩 신청 (개발) | 개발 환경 온보딩 |
| | `ops.e-trinity.co.kr` | 운영 포털 (운영) | HQ 운영, 승인/관제/배포 제어 |
| | `ops.dev.e-trinity.co.kr` | 운영 포털 (개발) | 개발 환경 HQ 운영 포털 |
| **솔루션 도메인 (신규)** | `dev.core-solution.co.kr` | 개발 서버 | Core-Solution 개발 환경 |
| | `api.dev.core-solution.co.kr` | 개발 API 서버 | 개발 환경 API/웹훅 |
| | `app.core-solution.co.kr` | 운영 서버 | Core-Solution 서비스 |
| | `api.core-solution.co.kr` | 운영 API 서버 | 운영 환경 API/웹훅 |
| | `staging.core-solution.co.kr` | 스테이징 서버 | QA/테스트 환경 |
| **기존 도메인 (유지)** | `dev.m-garden.co.kr` | 개발 서버 (기존) | MindGarden 하위 호환성 |
| | `m-garden.co.kr` | 운영 서버 (기존) | MindGarden 하위 호환성 |
| | `app.m-garden.co.kr` | 운영 서버 (기존) | MindGarden 하위 호환성 |

### 1.2 도메인 유지 전략

**기존 `m-garden.co.kr` 도메인은 완전히 유지**하며, 신규 도메인과 **병행 운영**합니다.

- **신규 도메인**: `core-solution.co.kr` (Core-Solution 브랜드)
- **기존 도메인**: `m-garden.co.kr` (MindGarden 브랜드, 하위 호환성)
- **회사 도메인**: `e-trinity.co.kr` (Trinity 회사)

**도메인 선택 전략:**
- 환경 변수 `SERVER_BASE_URL`로 사용할 도메인 선택 가능
- 기본값: `dev.core-solution.co.kr` (신규 도메인)
- 기존 도메인 사용: `SERVER_BASE_URL=https://dev.m-garden.co.kr` 설정

## 2. 개발 서버 환경 변수 설정

### 2.1 필수 환경 변수

```bash
# ============================================
# 서버 기본 URL (솔루션 도메인 또는 기존 도메인)
# ============================================
# 신규 도메인 사용: https://dev.core-solution.co.kr
# 기존 도메인 사용: https://dev.m-garden.co.kr
SERVER_BASE_URL=${SERVER_BASE_URL:https://dev.core-solution.co.kr}

# ============================================
# WebAuthn/Passkey 설정 (서버 도메인과 동일하게 설정)
# ============================================
# 신규 도메인: dev.core-solution.co.kr
# 기존 도메인: dev.m-garden.co.kr
WEBAUTHN_RP_ID=${WEBAUTHN_RP_ID:dev.core-solution.co.kr}

# ============================================
# 프론트엔드 URL (솔루션 도메인 또는 기존 도메인)
# ============================================
# 신규 도메인: https://dev.core-solution.co.kr
# 기존 도메인: https://dev.m-garden.co.kr
FRONTEND_BASE_URL=${FRONTEND_BASE_URL:https://dev.core-solution.co.kr}

# ============================================
# 회사 도메인 URL
# ============================================
COMPANY_URL=https://e-trinity.co.kr
ONBOARDING_URL=https://apply.e-trinity.co.kr
OPS_URL=https://ops.e-trinity.co.kr

# ============================================
# CORS 설정 (회사 도메인 + 솔루션 도메인 + 기존 도메인)
# ============================================
CORS_ALLOWED_ORIGINS=https://dev.core-solution.co.kr,https://www.dev.core-solution.co.kr,https://dev.m-garden.co.kr,https://www.dev.m-garden.co.kr,https://e-trinity.co.kr,https://www.e-trinity.co.kr,https://apply.e-trinity.co.kr

# ============================================
# OAuth2 콜백 URL (서버 도메인과 동일하게 설정)
# ============================================
# 신규 도메인 사용 시:
# KAKAO_REDIRECT_URI=https://dev.core-solution.co.kr/api/auth/kakao/callback
# 기존 도메인 사용 시:
# KAKAO_REDIRECT_URI=https://dev.m-garden.co.kr/api/auth/kakao/callback
KAKAO_REDIRECT_URI=${KAKAO_REDIRECT_URI:${SERVER_BASE_URL}/api/auth/kakao/callback}
NAVER_REDIRECT_URI=${NAVER_REDIRECT_URI:${SERVER_BASE_URL}/api/auth/naver/callback}
GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI:${SERVER_BASE_URL}/api/auth/google/callback}
APPLE_REDIRECT_URI=${APPLE_REDIRECT_URI:${SERVER_BASE_URL}/api/auth/apple/callback}

# ============================================
# 데이터베이스 설정
# ============================================
DB_HOST=your-dev-db-host
DB_PORT=3306
DB_NAME=core_solution
DB_USERNAME=mindgarden_dev
DB_PASSWORD=your-dev-db-password

# ============================================
# JWT 설정
# ============================================
JWT_SECRET=your-dev-jwt-secret-key

# ============================================
# 암호화 설정
# ============================================
PERSONAL_DATA_ENCRYPTION_KEY=your-32-char-encryption-key
PERSONAL_DATA_ENCRYPTION_IV=your-16-char-iv

# ============================================
# OAuth2 설정
# ============================================
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_CLIENT_SECRET=your-apple-client-secret
```

## 3. application-dev.yml 설정

### 3.1 도메인 설정 구조

```yaml
# 서버 도메인 (솔루션 도메인 또는 기존 도메인)
server:
  base-url: ${SERVER_BASE_URL:https://dev.core-solution.co.kr}

# 프론트엔드 설정
frontend:
  # 솔루션 도메인 또는 기존 도메인
  base-url: ${FRONTEND_BASE_URL:https://dev.core-solution.co.kr}
  # 회사 도메인 (Trinity 회사)
  company-url: ${COMPANY_URL:https://e-trinity.co.kr}
  onboarding-url: ${ONBOARDING_URL:https://apply.e-trinity.co.kr}
  # 기존 MindGarden 도메인 (하위 호환성)
  legacy-url: ${LEGACY_URL:https://dev.m-garden.co.kr}

# WebAuthn/Passkey (서버 도메인과 동일하게 설정)
webauthn:
  rp:
    name: Core-Solution
    id: ${WEBAUTHN_RP_ID:dev.core-solution.co.kr}

# CORS (회사 도메인 + 솔루션 도메인 + 기존 도메인 모두 허용)
cors:
  allowed-origins: ${CORS_ALLOWED_ORIGINS:https://dev.core-solution.co.kr,https://dev.m-garden.co.kr,https://e-trinity.co.kr,https://apply.e-trinity.co.kr}
```

### 3.2 OAuth2 콜백 URL

OAuth2 콜백은 **솔루션 도메인(core-solution.co.kr)**을 사용합니다:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          kakao:
            redirect-uri: ${KAKAO_REDIRECT_URI:${server.base-url}/api/auth/kakao/callback}
          naver:
            redirect-uri: ${NAVER_REDIRECT_URI:${server.base-url}/api/auth/naver/callback}
          google:
            redirect-uri: ${GOOGLE_REDIRECT_URI:${server.base-url}/api/auth/google/callback}
          apple:
            redirect-uri: ${APPLE_REDIRECT_URI:${server.base-url}/api/auth/apple/callback}
```

## 4. OAuth2 개발자 센터 설정

### 4.1 콜백 URL 등록

각 OAuth2 제공자 개발자 센터에서 다음 콜백 URL을 등록해야 합니다:

**개발 서버 (신규 도메인):**
- 카카오: `https://dev.core-solution.co.kr/api/auth/kakao/callback`
- 네이버: `https://dev.core-solution.co.kr/api/auth/naver/callback`
- Google: `https://dev.core-solution.co.kr/api/auth/google/callback`
- Apple: `https://dev.core-solution.co.kr/api/auth/apple/callback`

**개발 서버 (기존 도메인):**
- 카카오: `https://dev.m-garden.co.kr/api/auth/kakao/callback`
- 네이버: `https://dev.m-garden.co.kr/api/auth/naver/callback`
- Google: `https://dev.m-garden.co.kr/api/auth/google/callback`
- Apple: `https://dev.m-garden.co.kr/api/auth/apple/callback`

**운영 서버 (신규 도메인):**
- 카카오: `https://app.core-solution.co.kr/api/auth/kakao/callback`
- 네이버: `https://app.core-solution.co.kr/api/auth/naver/callback`
- Google: `https://app.core-solution.co.kr/api/auth/google/callback`
- Apple: `https://app.core-solution.co.kr/api/auth/apple/callback`

**운영 서버 (기존 도메인):**
- 카카오: `https://m-garden.co.kr/api/auth/kakao/callback`
- 네이버: `https://m-garden.co.kr/api/auth/naver/callback`
- Google: `https://m-garden.co.kr/api/auth/google/callback`
- Apple: `https://m-garden.co.kr/api/auth/apple/callback`

⚠️ **중요**: 사용하는 도메인에 따라 OAuth2 개발자 센터에 해당 콜백 URL을 모두 등록해야 합니다.

## 5. 도메인 전환 전략

### 5.1 도메인 병행 운영 전략

**기존 도메인(m-garden.co.kr)과 신규 도메인(core-solution.co.kr)을 모두 유지**하며 병행 운영합니다.

1. **도메인 선택 방식**
   - 환경 변수 `SERVER_BASE_URL`로 사용할 도메인 선택
   - 기본값: `dev.core-solution.co.kr` (신규 도메인)
   - 기존 도메인 사용: `SERVER_BASE_URL=https://dev.m-garden.co.kr` 설정

2. **CORS 설정**
   - 두 도메인 모두 CORS 허용 목록에 포함
   - 회사 도메인(e-trinity.co.kr)도 함께 허용

3. **OAuth2 콜백 URL**
   - 사용하는 도메인에 따라 OAuth2 개발자 센터에 등록
   - 두 도메인 모두 등록 가능 (환경에 따라 선택)

4. **리디렉션 (선택적)**
   - 필요 시 기존 도메인에서 신규 도메인으로 리디렉션 설정 가능
   - 또는 두 도메인 모두 독립적으로 운영

### 5.2 리디렉션 설정

**Nginx 리디렉션 예시:**

```nginx
# 기존 도메인 → 신규 도메인 리디렉션
server {
    listen 80;
    listen 443 ssl;
    server_name dev.m-garden.co.kr;
    
    ssl_certificate /etc/letsencrypt/live/dev.m-garden.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.m-garden.co.kr/privkey.pem;
    
    # 영구 리디렉션 (301)
    return 301 https://dev.core-solution.co.kr$request_uri;
}
```

## 6. 체크리스트

### 6.1 개발 서버 배포 전

- [ ] `dev.core-solution.co.kr` DNS 설정 완료 (신규 도메인)
- [ ] `dev.m-garden.co.kr` DNS 설정 확인 (기존 도메인 유지)
- [ ] SSL 인증서 발급 완료 (두 도메인 모두)
- [ ] 환경 변수 파일 생성 및 설정 완료
- [ ] `application-dev.yml` 프로파일 확인
- [ ] OAuth2 콜백 URL 등록 (사용할 도메인에 따라 카카오, 네이버, Google, Apple)
- [ ] CORS 설정 확인 (회사 도메인 + 솔루션 도메인 + 기존 도메인)
- [ ] WebAuthn RP ID 설정 확인 (서버 도메인과 일치)

### 6.2 배포 후 검증

**신규 도메인:**
- [ ] `https://dev.core-solution.co.kr` 접근 정상
- [ ] OAuth2 로그인 정상 동작
- [ ] Passkey 인증 정상 동작

**기존 도메인:**
- [ ] `https://dev.m-garden.co.kr` 접근 정상
- [ ] OAuth2 로그인 정상 동작
- [ ] Passkey 인증 정상 동작

**회사 도메인:**
- [ ] `https://e-trinity.co.kr` 접근 정상 (회사 홈페이지)
- [ ] `https://apply.e-trinity.co.kr` 접근 정상 (온보딩)

**통합 검증:**
- [ ] CORS 정상 동작 (모든 도메인에서 API 호출)
- [ ] 세션 관리 정상 (도메인별 독립 세션)

## 7. 참조 문서

- `docs/mgsb/DOMAIN_MIGRATION_PLAN.md` - 도메인 마이그레이션 계획
- `docs/mgsb/ARCHITECTURE_OVERVIEW.md` - 아키텍처 개요 및 도메인 전략
- `docs/mgsb/26년도사업계획서.md` - 브랜드 및 도메인 전략

## 8. 중요 사항

⚠️ **도메인 구분 원칙:**

1. **회사 도메인 (e-trinity.co.kr)**: Trinity 회사 홈페이지, 온보딩, 운영 포털
2. **솔루션 도메인 (core-solution.co.kr)**: Core-Solution 서비스, API, OAuth2 콜백
3. **기존 도메인 (m-garden.co.kr)**: MindGarden 서비스, 하위 호환성 유지, 병행 운영

✅ **모든 설정은 환경 변수로 관리**하여 하드코딩을 방지합니다.

✅ **도메인 선택**: 환경 변수 `SERVER_BASE_URL`로 사용할 도메인을 선택할 수 있습니다.
   - 신규 도메인: `SERVER_BASE_URL=https://dev.core-solution.co.kr`
   - 기존 도메인: `SERVER_BASE_URL=https://dev.m-garden.co.kr`

