# 서브도메인 테스트 가이드

**작성일**: 2025-12-12  
**목적**: 서브도메인 기능 테스트 방법 안내

---

## 📋 테스트 환경별 비교

### 1. 로컬 환경 테스트

#### ✅ 가능한 테스트
- **서브도메인 중복 체크 API**: 로컬에서 완전히 테스트 가능
  - `GET /api/v1/onboarding/subdomain-check?subdomain={subdomain}`
  - 백엔드 로직만 테스트 (데이터베이스 조회)
- **서브도메인 입력 필드**: 로컬에서 완전히 테스트 가능
  - 프론트엔드 UI/UX 테스트
  - 중복 체크 버튼 동작 확인
  - 도메인 미리보기 표시 확인

#### ⚠️ 제한적인 테스트
- **실제 서브도메인 라우팅**: 로컬에서 부분적으로만 테스트 가능
  - `/etc/hosts` 파일 수정 필요
  - Nginx 설정 필요 (또는 Spring Boot 직접 실행)
  - SSL 인증서 없이 HTTP로만 테스트 가능

#### ❌ 불가능한 테스트
- **와일드카드 도메인 DNS**: 로컬에서는 불가능 (DNS 서버 설정 필요)
- **와일드카드 SSL 인증서**: 로컬에서는 불가능 (Let's Encrypt 발급 필요)
- **실제 서브도메인 접근**: 로컬에서는 불가능 (외부 접근 불가)

---

### 2. 개발 서버 테스트

#### ✅ 완전히 가능한 테스트
- **서브도메인 중복 체크 API**: 완전히 테스트 가능
- **서브도메인 입력 필드**: 완전히 테스트 가능
- **실제 서브도메인 라우팅**: 완전히 테스트 가능
  - `*.dev.core-solution.co.kr` 와일드카드 도메인 설정 완료
  - 와일드카드 SSL 인증서 발급 완료
  - Nginx 설정 완료
- **테넌트별 서브도메인 접근**: 완전히 테스트 가능
  - 예: `mycompany.dev.core-solution.co.kr`
  - `TenantContextFilter`가 서브도메인에서 tenantId 추출

---

## 🔧 로컬 환경 테스트 방법

### 방법 1: `/etc/hosts` 파일 수정 (간단한 테스트)

**목적**: 로컬에서 서브도메인 라우팅 테스트

**단계**:
1. `/etc/hosts` 파일 수정:
```bash
sudo nano /etc/hosts
```

2. 다음 라인 추가:
```
127.0.0.1 mycompany.dev.core-solution.co.kr
127.0.0.1 test1.dev.core-solution.co.kr
127.0.0.1 test2.dev.core-solution.co.kr
```

3. 브라우저에서 접근:
   - `http://mycompany.dev.core-solution.co.kr:8080` (Spring Boot 직접 실행 시)
   - 또는 로컬 Nginx 설정 후 `http://mycompany.dev.core-solution.co.kr`

**제한사항**:
- SSL 인증서 없이 HTTP로만 테스트
- 실제 DNS 설정과는 다름
- 외부 접근 불가

---

### 방법 2: 로컬 Nginx 설정 (더 완전한 테스트)

**목적**: 로컬에서 Nginx를 통한 서브도메인 라우팅 테스트

**단계**:
1. 로컬 Nginx 설정 파일 생성:
```nginx
# /usr/local/etc/nginx/servers/subdomain-test.conf
server {
    listen 80;
    server_name ~^[^.]+\.dev\.core-solution\.co\.kr$;
    
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

2. `/etc/hosts` 파일 수정 (위와 동일)

3. Nginx 재시작:
```bash
sudo nginx -t
sudo nginx -s reload
```

**제한사항**:
- SSL 인증서 없이 HTTP로만 테스트
- 실제 DNS 설정과는 다름

---

## 🚀 개발 서버 테스트 방법

### 현재 설정 상태

**Nginx 설정**: `config/nginx/core-solution-dev.conf`
```nginx
# 테넌트 서브도메인 (Wildcard): *.dev.core-solution.co.kr
server {
    listen 443 ssl http2;
    server_name ~^[^.]+\.dev\.core-solution\.co\.kr$;
    
    ssl_certificate /etc/letsencrypt/live/dev.core-solution.co.kr-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.core-solution.co.kr-0001/privkey.pem;
    
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        # ...
    }
}
```

**상태**: ✅ 설정 완료

---

### 테스트 시나리오

#### 시나리오 1: 서브도메인 중복 체크 API 테스트

**로컬에서 테스트 가능**:
```bash
# 백엔드 실행 후
curl "http://localhost:8080/api/v1/onboarding/subdomain-check?subdomain=mycompany"
```

**개발 서버에서 테스트**:
```bash
curl "https://api.dev.core-solution.co.kr/api/v1/onboarding/subdomain-check?subdomain=mycompany"
```

---

#### 시나리오 2: 실제 서브도메인 접근 테스트

**로컬에서 테스트** (제한적):
1. `/etc/hosts` 파일 수정
2. `http://mycompany.dev.core-solution.co.kr:8080` 접근
3. `TenantContextFilter`가 서브도메인에서 tenantId 추출 확인

**개발 서버에서 테스트** (완전):
1. 온보딩에서 서브도메인 입력 (예: `mycompany`)
2. 온보딩 승인 후 `tenants.subdomain` 확인
3. `https://mycompany.dev.core-solution.co.kr` 접근
4. `TenantContextFilter`가 서브도메인에서 tenantId 추출 확인
5. 해당 테넌트의 데이터가 표시되는지 확인

---

#### 시나리오 3: 온보딩 플로우 전체 테스트

**로컬에서 테스트 가능**:
- 서브도메인 입력 필드 UI/UX
- 중복 체크 버튼 동작
- 도메인 미리보기 표시
- 데이터베이스 저장 확인

**개발 서버에서 테스트 필요**:
- 실제 서브도메인 접근
- 와일드카드 도메인 라우팅
- SSL 인증서 동작
- 테넌트별 데이터 분리

---

## 📝 권장 테스트 순서

### 1단계: 로컬 테스트 (빠른 개발/디버깅)
1. ✅ 서브도메인 중복 체크 API 테스트
2. ✅ 서브도메인 입력 필드 UI/UX 테스트
3. ✅ 데이터베이스 저장 로직 테스트
4. ⚠️ 서브도메인 라우팅 테스트 (제한적)

### 2단계: 개발 서버 테스트 (완전한 검증)
1. ✅ 실제 서브도메인 접근 테스트
2. ✅ 와일드카드 도메인 라우팅 테스트
3. ✅ SSL 인증서 동작 확인
4. ✅ 테넌트별 데이터 분리 확인
5. ✅ 온보딩 플로우 전체 테스트

---

## 🔍 확인 사항

### 로컬 테스트 시 확인
- [ ] 서브도메인 중복 체크 API 정상 동작
- [ ] 서브도메인 입력 필드 정상 동작
- [ ] 데이터베이스 저장 정상 동작
- [ ] `/etc/hosts` 파일 수정 후 로컬 라우팅 동작 (선택사항)

### 개발 서버 테스트 시 확인
- [ ] 와일드카드 DNS 설정 확인
- [ ] 와일드카드 SSL 인증서 발급 확인
- [ ] Nginx 설정 확인
- [ ] 실제 서브도메인 접근 확인
- [ ] `TenantContextFilter` 서브도메인 추출 확인
- [ ] 테넌트별 데이터 분리 확인

---

## 📌 결론

**로컬 테스트**:
- ✅ **API 로직**: 완전히 테스트 가능
- ✅ **프론트엔드**: 완전히 테스트 가능
- ⚠️ **서브도메인 라우팅**: 제한적으로만 테스트 가능 (HTTP만, `/etc/hosts` 필요)

**개발 서버 테스트**:
- ✅ **모든 기능**: 완전히 테스트 가능
- ✅ **실제 와일드카드 도메인**: 완전히 테스트 가능
- ✅ **SSL 인증서**: 완전히 테스트 가능

**권장사항**:
1. **로컬**: API 로직 및 프론트엔드 개발/디버깅
2. **개발 서버**: 실제 서브도메인 라우팅 및 통합 테스트

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-12

