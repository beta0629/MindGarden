# 와일드카드 도메인 테스트 계획

**작성일**: 2025-12-11  
**목적**: `*.dev.core-solution.co.kr` 와일드카드 도메인 테스트  
**대상**: 개발 서버 (114.202.247.246)

---

## 📋 테스트 목표

1. 와일드카드 도메인 DNS 설정 확인
2. 와일드카드 SSL 인증서 발급 및 동작 확인
3. 서브도메인별 라우팅 테스트
4. 테넌트별 서브도메인 접근 테스트

---

## 🔍 현재 상태 확인

### 1. Nginx 설정 확인

**위치**: `config/nginx/core-solution-dev.conf`

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

### 2. SSL 인증서 확인 필요

**확인 사항**:
- [ ] 와일드카드 SSL 인증서 발급 여부
- [ ] 인증서 경로 확인
- [ ] 인증서 만료일 확인

**확인 명령**:
```bash
ssh root@beta0629.cafe24.com
sudo certbot certificates
ls -la /etc/letsencrypt/live/
```

---

## 🧪 테스트 시나리오

### 시나리오 1: 기본 와일드카드 도메인 접근 테스트

**목적**: 임의의 서브도메인으로 접근 가능한지 확인

**테스트 도메인**:
- `test1.dev.core-solution.co.kr`
- `test2.dev.core-solution.co.kr`
- `tenant-001.dev.core-solution.co.kr`

**테스트 스크립트**:
```bash
./scripts/development/testing/test-wildcard-domain.sh test1
./scripts/development/testing/test-wildcard-domain.sh test2
./scripts/development/testing/test-wildcard-domain.sh tenant-001
```

**확인 사항**:
- [ ] DNS 해석 성공
- [ ] SSL 인증서 정상 동작
- [ ] HTTP/HTTPS 접근 성공
- [ ] 백엔드 프록시 정상 동작

---

### 시나리오 2: SSL 인증서 검증

**목적**: 와일드카드 SSL 인증서가 모든 서브도메인에서 동작하는지 확인

**테스트 방법**:
```bash
# SSL 인증서 정보 확인
openssl s_client -connect test1.dev.core-solution.co.kr:443 -servername test1.dev.core-solution.co.kr

# 인증서 CN 확인
echo | openssl s_client -connect test1.dev.core-solution.co.kr:443 -servername test1.dev.core-solution.co.kr 2>&1 | openssl x509 -noout -subject
```

**확인 사항**:
- [ ] 인증서 CN이 `*.dev.core-solution.co.kr` 또는 와일드카드 포함
- [ ] 브라우저에서 SSL 경고 없음
- [ ] 모든 서브도메인에서 동일한 인증서 사용

---

### 시나리오 3: 테넌트 라우팅 테스트

**목적**: 서브도메인에서 테넌트 ID 추출 및 라우팅 확인

**테스트 도메인**: `tenant-001.dev.core-solution.co.kr`

**테스트 방법**:
1. 서브도메인으로 접근
2. 백엔드 로그에서 Host 헤더 확인
3. 테넌트 컨텍스트 설정 확인

**확인 사항**:
- [ ] Host 헤더에서 서브도메인 추출 성공
- [ ] 테넌트 ID 매핑 정상
- [ ] 테넌트별 데이터 분리 정상

---

### 시나리오 4: API 엔드포인트 테스트

**목적**: 와일드카드 도메인을 통한 API 접근 확인

**테스트 엔드포인트**:
- `https://test1.dev.core-solution.co.kr/api/v1/health`
- `https://test1.dev.core-solution.co.kr/api/v1/tenants`

**테스트 방법**:
```bash
curl -k https://test1.dev.core-solution.co.kr/api/v1/health
curl -k https://test1.dev.core-solution.co.kr/api/v1/tenants
```

**확인 사항**:
- [ ] API 응답 정상
- [ ] CORS 헤더 정상
- [ ] 인증/인가 정상 동작

---

## 📝 체크리스트

### 사전 준비
- [ ] DNS A 레코드 설정 (와일드카드 또는 개별 서브도메인)
- [ ] 와일드카드 SSL 인증서 발급
- [ ] Nginx 설정 배포
- [ ] 백엔드 서비스 실행 중

### 테스트 실행
- [ ] 기본 와일드카드 도메인 접근 테스트
- [ ] SSL 인증서 검증
- [ ] 테넌트 라우팅 테스트
- [ ] API 엔드포인트 테스트
- [ ] 여러 서브도메인 동시 테스트

### 결과 확인
- [ ] 모든 테스트 통과
- [ ] 로그 확인 (Nginx, 백엔드)
- [ ] 성능 확인 (응답 시간)
- [ ] 에러 없음 확인

---

## 🚨 문제 해결

### 문제 1: DNS 해석 실패

**증상**: `nslookup test1.dev.core-solution.co.kr` 실패

**해결 방법**:
1. DNS A 레코드 확인
2. 와일드카드 DNS 설정 확인 (`*.dev.core-solution.co.kr`)
3. DNS 전파 대기 (1-5분)

### 문제 2: SSL 인증서 오류

**증상**: 브라우저에서 SSL 경고

**해결 방법**:
1. 와일드카드 SSL 인증서 발급 확인
2. 인증서 경로 확인
3. Nginx 설정에서 인증서 경로 확인

### 문제 3: 502 Bad Gateway

**증상**: 접근 시 502 에러

**해결 방법**:
1. 백엔드 서비스 실행 확인
2. Nginx 프록시 설정 확인
3. 백엔드 로그 확인

---

## 📊 테스트 결과 기록

### 테스트 환경
- **날짜**: 2025-12-11
- **서버**: 개발 서버 (114.202.247.246)
- **도메인**: `*.dev.core-solution.co.kr`

### 테스트 결과

| 테스트 항목 | 결과 | 비고 |
|------------|------|------|
| DNS 해석 | ⬜ | |
| SSL 인증서 | ⬜ | |
| HTTP 접근 | ⬜ | |
| HTTPS 접근 | ⬜ | |
| API 엔드포인트 | ⬜ | |
| 테넌트 라우팅 | ⬜ | |

---

## 🔗 관련 문서

- [와일드카드 SSL 인증서 DNS 설정 가이드](../archive/WILDCARD_SSL_DNS_SETUP.md)
- [Nginx 다중 도메인 설정](../archive/NGINX_MULTI_DOMAIN_CONFIG.md)
- [테넌트 테스트 가이드](../archive/2025-11-23/TENANT_TESTING_WITHOUT_WILDCARD_DOMAIN.md)

---

## 📞 문의

문제 발생 시:
1. 서버 로그 확인
2. Nginx 설정 확인
3. SSL 인증서 상태 확인
4. DNS 설정 확인

