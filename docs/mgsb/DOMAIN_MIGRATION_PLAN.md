# 도메인 변경 및 회사 홈페이지 연동 계획

> **작성일:** 2025-01-XX  
> **목적:** m-garden.co.kr → core-solution.co.kr 도메인 변경 및 e-trinity.co.kr 회사 홈페이지 연동  
> **범위:** 개발 서버, 운영 서버, DNS, SSL, OAuth2 콜백, 환경 변수, 프론트엔드 설정

## 1. 현재 도메인 구조

### 1.1 현재 도메인
- **운영 서버**: `m-garden.co.kr` (또는 `beta74.cafe24.com`)
- **개발 서버**: `dev.m-garden.co.kr` (또는 `beta0629.cafe24.com`)
- **회사 홈페이지**: 없음 (신규 구축 필요)

### 1.2 변경 후 도메인 구조
- **운영 서버**: `app.core-solution.co.kr` (또는 `core-solution.co.kr`)
- **개발 서버**: `dev.core-solution.co.kr`
- **회사 홈페이지**: `e-trinity.co.kr`
- **온보딩**: `apply.e-trinity.co.kr` 또는 `e-trinity.co.kr/onboarding`
- **운영 포털**: `ops.e-trinity.co.kr` (내부)
- **API Gateway**: `api.core-solution.co.kr`

## 2. 도메인 전략 (ARCHITECTURE_OVERVIEW.md 기준)

### 2.1 도메인 역할 분리

| 구분 | 목적 | 도메인 예시 | 비고 |
| --- | --- | --- | --- |
| 코퍼레이트 홈페이지 | Trinity 브랜드 소개, 제품·문서 허브 | `https://e-trinity.co.kr` | 회사 소개, 제품 소개 |
| 온보딩 신청 | 입점사 신청, 결제 수단 등록 | `https://apply.e-trinity.co.kr` 또는 `https://e-trinity.co.kr/onboarding` | 온보딩 플로우 |
| 테넌트/소비자 웹앱 | 실제 서비스 이용(예약, 정산, 대시보드) | `https://app.core-solution.co.kr` 또는 `https://core-solution.co.kr` | Core-Solution 서비스 |
| 운영 포털(내부) | HQ 운영, 승인/관제/배포 제어 | `https://ops.e-trinity.co.kr` | VPN 또는 IP ACL + MFA 필수 |
| API Gateway | 외부 공개 API/웹훅 | `https://api.core-solution.co.kr` | Rate Limiting, WAF |
| 모바일 백엔드 | 앱 전용 엔드포인트 | `https://mobile-api.core-solution.co.kr` | 앱 스토어 심사 대비 |
| 스테이징/Dev | QA/개발 테스트 | `https://staging.core-solution.co.kr`, `https://dev.core-solution.co.kr` | 테스트 데이터 |

### 2.2 TLS/보안 정책
- 모든 서브도메인은 TLS 1.2 이상, HSTS, WAF 적용
- 내부 도메인(`ops`)은 사설 CA + VPN 조합 또는 Public TLS + 인증 게이트웨이

### 2.3 DNS/IaC 관리
- Route53/Cloud DNS 등 IaC(Terraform)로 레코드 일괄 관리
- 새 테넌트 커스텀 도메인은 Self-Service + 검증(CNAME) 방식 제공

## 3. 단계별 마이그레이션 계획

### Phase 1: DNS 및 SSL 인증서 준비 (1주)

#### 3.1 도메인 등록 및 DNS 설정
- [ ] `core-solution.co.kr` 도메인 등록 확인
- [ ] `e-trinity.co.kr` 도메인 등록 확인
- [ ] DNS 레코드 설정:
  ```
  # Core-Solution 서비스
  app.core-solution.co.kr        A    → 운영 서버 IP
  dev.core-solution.co.kr        A    → 개발 서버 IP
  api.core-solution.co.kr        A    → API 서버 IP
  mobile-api.core-solution.co.kr A    → 모바일 API 서버 IP
  staging.core-solution.co.kr    A    → 스테이징 서버 IP
  
  # Trinity 회사 홈페이지
  e-trinity.co.kr                 A    → 회사 홈페이지 서버 IP
  www.e-trinity.co.kr             CNAME → e-trinity.co.kr
  apply.e-trinity.co.kr           A    → 온보딩 서버 IP (또는 e-trinity.co.kr)
  ops.e-trinity.co.kr             A    → 운영 포털 서버 IP (VPN 필수)
  ```

#### 3.2 SSL 인증서 발급
- [ ] Let's Encrypt 또는 상용 SSL 인증서 발급
- [ ] Wildcard 인증서 고려: `*.core-solution.co.kr`, `*.e-trinity.co.kr`
- [ ] 개발 서버 SSL 인증서 발급
- [ ] 운영 서버 SSL 인증서 발급

**Certbot 명령어 예시:**
```bash
# 개발 서버
certbot certonly --nginx -d dev.core-solution.co.kr

# 운영 서버
certbot certonly --nginx -d app.core-solution.co.kr -d api.core-solution.co.kr

# 회사 홈페이지
certbot certonly --nginx -d e-trinity.co.kr -d www.e-trinity.co.kr -d apply.e-trinity.co.kr
```

### Phase 2: 백엔드 설정 변경 (1주)

#### 3.3 환경 변수 업데이트

**개발 서버 (`/etc/mindgarden/dev.env`):**
```bash
# 기존
SERVER_BASE_URL=https://dev.m-garden.co.kr
FRONTEND_BASE_URL=https://dev.m-garden.co.kr
CORS_ALLOWED_ORIGINS=https://dev.m-garden.co.kr

# 변경 후
SERVER_BASE_URL=https://dev.core-solution.co.kr
FRONTEND_BASE_URL=https://dev.core-solution.co.kr
CORS_ALLOWED_ORIGINS=https://dev.core-solution.co.kr,https://e-trinity.co.kr,https://apply.e-trinity.co.kr

# OAuth2 콜백 URL 변경
KAKAO_REDIRECT_URI=https://dev.core-solution.co.kr/api/auth/kakao/callback
NAVER_REDIRECT_URI=https://dev.core-solution.co.kr/api/auth/naver/callback
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_NAVER_REDIRECT_URI=https://dev.core-solution.co.kr/api/auth/naver/callback
```

**운영 서버 (`/etc/mindgarden/prod.env`):**
```bash
# 기존
SERVER_BASE_URL=https://m-garden.co.kr
FRONTEND_BASE_URL=https://m-garden.co.kr
CORS_ALLOWED_ORIGINS=https://m-garden.co.kr

# 변경 후
SERVER_BASE_URL=https://app.core-solution.co.kr
FRONTEND_BASE_URL=https://app.core-solution.co.kr
CORS_ALLOWED_ORIGINS=https://app.core-solution.co.kr,https://e-trinity.co.kr,https://apply.e-trinity.co.kr

# OAuth2 콜백 URL 변경
KAKAO_REDIRECT_URI=https://app.core-solution.co.kr/api/auth/kakao/callback
NAVER_REDIRECT_URI=https://app.core-solution.co.kr/api/auth/naver/callback
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_NAVER_REDIRECT_URI=https://app.core-solution.co.kr/api/auth/naver/callback
```

#### 3.4 application.yml 설정 변경

**application-dev.yml:**
```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          kakao:
            redirect-uri: ${KAKAO_REDIRECT_URI:https://dev.core-solution.co.kr/api/auth/kakao/callback}
          naver:
            redirect-uri: ${NAVER_REDIRECT_URI:https://dev.core-solution.co.kr/api/auth/naver/callback}

frontend:
  base-url: ${FRONTEND_BASE_URL:https://dev.core-solution.co.kr}

server:
  base-url: ${SERVER_BASE_URL:https://dev.core-solution.co.kr}
```

**application-prod.yml:**
```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          kakao:
            redirect-uri: ${KAKAO_REDIRECT_URI:https://app.core-solution.co.kr/api/auth/kakao/callback}
          naver:
            redirect-uri: ${NAVER_REDIRECT_URI:https://app.core-solution.co.kr/api/auth/naver/callback}

frontend:
  base-url: ${FRONTEND_BASE_URL:https://app.core-solution.co.kr}

server:
  base-url: ${SERVER_BASE_URL:https://app.core-solution.co.kr}
```

#### 3.5 OAuth2 Provider 설정 변경

**작업 체크리스트:**
- [ ] 카카오 개발자 센터: Redirect URI 변경
  - 기존: `https://dev.m-garden.co.kr/api/auth/kakao/callback`
  - 변경: `https://dev.core-solution.co.kr/api/auth/kakao/callback`
  - 운영: `https://app.core-solution.co.kr/api/auth/kakao/callback`
- [ ] 네이버 개발자 센터: Redirect URI 변경
  - 기존: `https://dev.m-garden.co.kr/api/auth/naver/callback`
  - 변경: `https://dev.core-solution.co.kr/api/auth/naver/callback`
  - 운영: `https://app.core-solution.co.kr/api/auth/naver/callback`

### Phase 3: Nginx 설정 변경 (1주)

#### 3.6 개발 서버 Nginx 설정

**`/etc/nginx/sites-available/dev.core-solution.co.kr`:**
```nginx
server {
    listen 80;
    server_name dev.core-solution.co.kr;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dev.core-solution.co.kr;

    ssl_certificate /etc/letsencrypt/live/dev.core-solution.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.core-solution.co.kr/privkey.pem;
    
    # SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 프록시 헤더
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;

    # 프론트엔드
    location / {
        root /var/www/mindgarden-dev/frontend;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # 백엔드 API
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### 3.7 운영 서버 Nginx 설정

**`/etc/nginx/sites-available/app.core-solution.co.kr`:**
```nginx
server {
    listen 80;
    server_name app.core-solution.co.kr;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.core-solution.co.kr;

    ssl_certificate /etc/letsencrypt/live/app.core-solution.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.core-solution.co.kr/privkey.pem;
    
    # SSL 설정 (운영은 더 엄격)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # 프록시 헤더
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;

    # 프론트엔드
    location / {
        root /var/www/mindgarden/frontend;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # 백엔드 API
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Phase 4: 프론트엔드 설정 변경 (1주)

#### 3.8 환경 변수 파일 업데이트

**프론트엔드 `.env.development`:**
```bash
# 기존
REACT_APP_API_BASE_URL=https://dev.m-garden.co.kr/api
REACT_APP_FRONTEND_URL=https://dev.m-garden.co.kr

# 변경 후
REACT_APP_API_BASE_URL=https://dev.core-solution.co.kr/api
REACT_APP_FRONTEND_URL=https://dev.core-solution.co.kr
REACT_APP_COMPANY_URL=https://e-trinity.co.kr
REACT_APP_ONBOARDING_URL=https://apply.e-trinity.co.kr
```

**프론트엔드 `.env.production`:**
```bash
# 기존
REACT_APP_API_BASE_URL=https://m-garden.co.kr/api
REACT_APP_FRONTEND_URL=https://m-garden.co.kr

# 변경 후
REACT_APP_API_BASE_URL=https://app.core-solution.co.kr/api
REACT_APP_FRONTEND_URL=https://app.core-solution.co.kr
REACT_APP_COMPANY_URL=https://e-trinity.co.kr
REACT_APP_ONBOARDING_URL=https://apply.e-trinity.co.kr
```

#### 3.9 API 클라이언트 설정 변경

**`frontend/src/utils/api.js` 또는 `frontend/src/constants/api.js`:**
```javascript
// 기존
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://m-garden.co.kr/api';

// 변경 후
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://app.core-solution.co.kr/api';
const COMPANY_URL = process.env.REACT_APP_COMPANY_URL || 'https://e-trinity.co.kr';
const ONBOARDING_URL = process.env.REACT_APP_ONBOARDING_URL || 'https://apply.e-trinity.co.kr';
```

#### 3.10 OAuth2 콜백 URL 변경

**OAuth2 관련 컴포넌트:**
- [ ] `frontend/src/utils/socialLogin.js` - OAuth2 URL 생성 로직
- [ ] `frontend/src/components/auth/OAuth2Callback.js` - 콜백 처리
- [ ] 모든 소셜 로그인 관련 컴포넌트 확인

### Phase 5: 회사 홈페이지 구축 및 온보딩 연동 (2주)

#### 3.11 e-trinity.co.kr 회사 홈페이지 구조

**기본 구조:**
```
e-trinity.co.kr/
├── / (홈페이지)
│   ├── 회사 소개
│   ├── 제품 소개 (Core-Solution)
│   ├── 가격 정책
│   ├── 고객 사례
│   └── 문의하기
├── /onboarding (온보딩)
│   ├── /step1 (업종 선택)
│   ├── /step2 (기본 정보 입력)
│   ├── /step3 (요금제 선택)
│   ├── /step4 (결제)
│   └── /complete (완료)
└── /docs (문서)
    ├── API 문서
    ├── 가이드
    └── FAQ
```

#### 3.12 온보딩 플로우 설계

**플로우:**
```
1. e-trinity.co.kr 방문
   ↓
2. "시작하기" 버튼 클릭
   ↓
3. apply.e-trinity.co.kr/onboarding 이동
   ↓
4. 업종 선택 (학원, 요식업, 미용 등)
   ↓
5. 기본 정보 입력 (사업자명, 연락처 등)
   ↓
6. 요금제 선택 (Starter, Standard, Premium)
   ↓
7. 컴포넌트 선택 (기본 + 애드온)
   ↓
8. 결제 진행
   ↓
9. 결제 완료 → Core-Solution 자동 프로비저닝
   ↓
10. app.core-solution.co.kr 로그인 페이지로 리디렉션
```

#### 3.13 온보딩 API 연동

**온보딩 서버 → Core-Solution API:**
```javascript
// 온보딩 완료 후 Core-Solution에 테넌트 생성
POST https://api.core-solution.co.kr/api/admin/tenants/onboard
Headers: {
  Authorization: Bearer {onboarding-service-token},
  Content-Type: application/json
}
Body: {
  tenantName: "마인드가든 학원",
  businessType: "ACADEMY",
  subscriptionPlanId: "plan-standard",
  selectedComponents: ["CONSULTATION", "SCHEDULING", "PAYMENT"],
  paymentInfo: {
    paymentId: "payment-xxx",
    amount: 99000,
    currency: "KRW"
  }
}
```

**Core-Solution → 온보딩 서버 콜백:**
```javascript
// 테넌트 생성 완료 후 온보딩 서버에 알림
POST https://apply.e-trinity.co.kr/api/onboarding/callback
Headers: {
  Authorization: Bearer {callback-secret},
  Content-Type: application/json
}
Body: {
  onboardingId: "onboarding-xxx",
  tenantId: "tenant-uuid",
  status: "COMPLETED",
  loginUrl: "https://app.core-solution.co.kr/login?tenant={tenantId}"
}
```

### Phase 6: 기존 도메인 리디렉션 설정 (1주)

#### 3.14 기존 도메인 → 신규 도메인 리디렉션

**Nginx 리디렉션 설정:**
```nginx
# m-garden.co.kr → app.core-solution.co.kr
server {
    listen 80;
    listen 443 ssl;
    server_name m-garden.co.kr www.m-garden.co.kr;
    
    ssl_certificate /etc/letsencrypt/live/m-garden.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/m-garden.co.kr/privkey.pem;
    
    # 영구 리디렉션 (301)
    return 301 https://app.core-solution.co.kr$request_uri;
}

# dev.m-garden.co.kr → dev.core-solution.co.kr
server {
    listen 80;
    listen 443 ssl;
    server_name dev.m-garden.co.kr;
    
    ssl_certificate /etc/letsencrypt/live/dev.m-garden.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.m-garden.co.kr/privkey.pem;
    
    return 301 https://dev.core-solution.co.kr$request_uri;
}
```

#### 3.15 프론트엔드 리디렉션 처리

**React Router 리디렉션:**
```javascript
// 기존 도메인 접근 시 자동 리디렉션
if (window.location.hostname === 'm-garden.co.kr' || 
    window.location.hostname === 'dev.m-garden.co.kr') {
  window.location.href = window.location.href.replace(
    window.location.hostname,
    window.location.hostname.replace('m-garden.co.kr', 'core-solution.co.kr')
  );
}
```

### Phase 7: 테스트 및 검증 (1주)

#### 3.16 기능 테스트 체크리스트

**개발 서버 테스트:**
- [ ] HTTPS 접근 정상 동작
- [ ] 프론트엔드 로드 정상
- [ ] API 호출 정상
- [ ] 카카오 로그인 정상 (콜백 URL 확인)
- [ ] 네이버 로그인 정상 (콜백 URL 확인)
- [ ] 세션 관리 정상
- [ ] CORS 설정 정상

**운영 서버 테스트:**
- [ ] HTTPS 접근 정상 동작
- [ ] 프론트엔드 로드 정상
- [ ] API 호출 정상
- [ ] 카카오 로그인 정상
- [ ] 네이버 로그인 정상
- [ ] 기존 사용자 세션 유지
- [ ] 데이터 마이그레이션 확인

**회사 홈페이지 테스트:**
- [ ] e-trinity.co.kr 접근 정상
- [ ] 온보딩 플로우 정상 동작
- [ ] Core-Solution 연동 정상
- [ ] 결제 연동 정상

#### 3.17 성능 테스트
- [ ] SSL 핸드셰이크 시간 측정
- [ ] 페이지 로드 시간 측정
- [ ] API 응답 시간 측정
- [ ] 리디렉션 오버헤드 측정

## 4. 작업 우선순위 및 일정

### 4.1 전체 일정 (7주)

| Phase | 작업 내용 | 기간 | 우선순위 |
|-------|----------|------|---------|
| Phase 1 | DNS 및 SSL 인증서 준비 | 1주 | P0 |
| Phase 2 | 백엔드 설정 변경 | 1주 | P0 |
| Phase 3 | Nginx 설정 변경 | 1주 | P0 |
| Phase 4 | 프론트엔드 설정 변경 | 1주 | P0 |
| Phase 5 | 회사 홈페이지 구축 및 온보딩 연동 | 2주 | P1 |
| Phase 6 | 기존 도메인 리디렉션 설정 | 1주 | P1 |
| Phase 7 | 테스트 및 검증 | 1주 | P0 |

### 4.2 MVP 범위 (즉시 필요)

**Phase 1-4 (4주):**
- DNS 및 SSL 설정
- 백엔드/프론트엔드 도메인 변경
- OAuth2 콜백 URL 변경
- 기존 도메인 리디렉션

**Phase 5-7 (4주):**
- 회사 홈페이지 기본 구축
- 온보딩 플로우 기본 구현
- 통합 테스트

## 5. 리스크 관리

### 5.1 기술적 리스크

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| DNS 전파 지연 | 높음 | TTL 값 낮춰서 빠른 전파, 여러 DNS 서버 확인 |
| SSL 인증서 발급 실패 | 높음 | Let's Encrypt 자동 갱신 설정, 백업 인증서 준비 |
| OAuth2 콜백 실패 | 높음 | 카카오/네이버 개발자 센터에서 미리 테스트, 롤백 계획 |
| 세션 유지 실패 | 중간 | 쿠키 도메인 설정 확인, 세션 마이그레이션 스크립트 |
| CORS 오류 | 중간 | CORS 설정 사전 검증, 테스트 환경에서 확인 |

### 5.2 운영 리스크

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| 서비스 중단 | 높음 | Blue/Green 배포, 점진적 전환, 롤백 계획 |
| 사용자 혼란 | 중간 | 공지사항 발송, 리디렉션 안내, 고객 지원 준비 |
| 검색 엔진 인덱싱 | 중간 | Google Search Console에 도메인 변경 신고, sitemap 업데이트 |

## 6. 체크리스트

### 6.1 DNS 및 SSL
- [ ] `core-solution.co.kr` 도메인 등록 확인
- [ ] `e-trinity.co.kr` 도메인 등록 확인
- [ ] DNS A 레코드 설정
- [ ] DNS CNAME 레코드 설정
- [ ] SSL 인증서 발급 (개발 서버)
- [ ] SSL 인증서 발급 (운영 서버)
- [ ] SSL 인증서 발급 (회사 홈페이지)
- [ ] SSL 자동 갱신 설정

### 6.2 백엔드 설정
- [ ] 개발 서버 환경 변수 업데이트
- [ ] 운영 서버 환경 변수 업데이트
- [ ] application-dev.yml 업데이트
- [ ] application-prod.yml 업데이트
- [ ] 카카오 개발자 센터 Redirect URI 변경
- [ ] 네이버 개발자 센터 Redirect URI 변경

### 6.3 Nginx 설정
- [ ] 개발 서버 Nginx 설정 파일 생성
- [ ] 운영 서버 Nginx 설정 파일 생성
- [ ] SSL 설정 적용
- [ ] 리디렉션 규칙 설정
- [ ] Nginx 설정 테스트 (`nginx -t`)
- [ ] Nginx 재시작

### 6.4 프론트엔드 설정
- [ ] .env.development 업데이트
- [ ] .env.production 업데이트
- [ ] API 클라이언트 설정 변경
- [ ] OAuth2 콜백 URL 변경
- [ ] 프론트엔드 빌드 및 배포

### 6.5 회사 홈페이지
- [ ] e-trinity.co.kr 기본 구조 구축
- [ ] 온보딩 플로우 구현
- [ ] Core-Solution API 연동
- [ ] 결제 연동
- [ ] 테스트 완료

### 6.6 테스트
- [ ] 개발 서버 기능 테스트
- [ ] 운영 서버 기능 테스트
- [ ] OAuth2 로그인 테스트
- [ ] 온보딩 플로우 테스트
- [ ] 리디렉션 테스트
- [ ] 성능 테스트

## 7. 다음 단계

### 7.1 즉시 시작 가능 항목
1. **도메인 등록 확인**
   - [ ] `core-solution.co.kr` 도메인 소유권 확인
   - [ ] `e-trinity.co.kr` 도메인 소유권 확인
   - [ ] DNS 관리 권한 확인

2. **SSL 인증서 발급 준비**
   - [ ] Certbot 설치 확인
   - [ ] Nginx 설정 확인
   - [ ] 포트 80, 443 오픈 확인

3. **환경 변수 파일 백업**
   - [ ] 기존 환경 변수 파일 백업
   - [ ] 변경 계획 문서화

### 7.2 협의 필요 항목
- [ ] 도메인 변경 일정 확정
- [ ] 서비스 중단 시간 협의 (최소화 목표)
- [ ] 사용자 공지 계획
- [ ] 롤백 계획 수립

---

**결론:** 도메인 변경은 **7주 내 완료 가능**하며, **Phase 1-4 (4주)는 필수**, **Phase 5-7 (4주)는 확장 기능**입니다. 기존 도메인 리디렉션을 통해 서비스 중단 없이 전환할 수 있습니다.

