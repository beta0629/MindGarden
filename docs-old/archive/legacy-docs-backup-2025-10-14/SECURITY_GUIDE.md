# 🔒 MindGarden 보안 가이드

## 개요
MindGarden 프로젝트에 적용된 보안 조치들과 설정 방법을 설명합니다.

## 🛡️ 적용된 보안 조치

### 1. JWT 토큰 보안 강화
- **기본 시크릿 키 제거**: 하드코딩된 기본값 제거
- **환경변수 필수**: JWT_SECRET 환경변수 필수 설정
- **토큰 만료시간 단축**: 24시간 → 1시간

```yaml
# application.yml
jwt:
  secret: ${JWT_SECRET:}  # 환경변수 필수
  expiration: 3600000     # 1시간
```

### 2. 보안 헤더 추가
- **X-Frame-Options**: Clickjacking 방지
- **X-Content-Type-Options**: MIME 타입 스니핑 방지
- **X-XSS-Protection**: XSS 필터 활성화
- **Content-Security-Policy**: XSS 및 데이터 인젝션 방지
- **Referrer-Policy**: 리퍼러 정보 제한

### 3. XSS 방지 필터
- **HTML 태그 제거**: `<script>`, `<iframe>` 등 위험한 태그 제거
- **이벤트 핸들러 제거**: `onclick`, `onload` 등 제거
- **HTML 엔티티 이스케이프**: 특수문자 자동 변환

### 4. 세션 보안 강화
- **HttpOnly**: JavaScript 접근 차단
- **SameSite**: CSRF 방지
- **Secure**: HTTPS에서만 전송 (프로덕션)

```yaml
session:
  cookie:
    http-only: true
    secure: false  # 로컬: false, 프로덕션: true
    same-site: strict
    max-age: 3600
```

### 5. Rate Limiting
- **요청 제한**: 초당 100 요청 제한
- **클라이언트별 관리**: IP + User-Agent 기반 식별
- **자동 정리**: 사용하지 않는 Rate Limiter 자동 제거

### 6. 암호화 키 관리
- **환경변수 분리**: 모든 암호화 키를 환경변수로 관리
- **기본값 제거**: 보안상 위험한 기본값 제거

## 🔧 환경 설정

### 1. 환경변수 설정
```bash
# .env 파일 생성
cp env.example .env

# 필수 환경변수 설정
export JWT_SECRET="your-super-secure-jwt-secret-key-2025"
export PERSONAL_DATA_ENCRYPTION_KEY="your-32-char-encryption-key"
export PERSONAL_DATA_ENCRYPTION_IV="your-16-char-iv"
```

### 2. 프로덕션 환경 설정
```yaml
# application-prod.yml
server:
  servlet:
    session:
      cookie:
        secure: true  # HTTPS 환경에서만 전송
```

## 🧪 보안 테스트

### 1. 자동 테스트 실행
```bash
# 보안 테스트 스크립트 실행
./security-test.sh
```

### 2. 수동 테스트 방법

#### 보안 헤더 확인
```bash
curl -I http://localhost:8080/api/auth/me
```

#### XSS 방지 테스트
```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(\"XSS\")</script>","email":"test@example.com"}'
```

#### Rate Limiting 테스트
```bash
for i in {1..150}; do
  curl -X GET http://localhost:8080/api/auth/me
done
```

## 📋 보안 체크리스트

### 개발 환경
- [ ] JWT_SECRET 환경변수 설정
- [ ] 암호화 키 환경변수 설정
- [ ] 보안 헤더 필터 활성화
- [ ] XSS 방지 필터 활성화
- [ ] Rate Limiting 활성화

### 프로덕션 환경
- [ ] HTTPS 인증서 설정
- [ ] 보안 헤더 설정
- [ ] 세션 쿠키 Secure 플래그 활성화
- [ ] CORS 도메인 제한
- [ ] 로그 모니터링 설정

## 🚨 보안 주의사항

### 1. 환경변수 보안
- `.env` 파일을 `.gitignore`에 추가
- 프로덕션에서는 환경변수로만 관리
- 정기적인 키 로테이션

### 2. 로그 보안
- 민감한 정보 로깅 금지
- 개인정보 마스킹 처리
- 보안 이벤트 로깅

### 3. 의존성 보안
- 정기적인 보안 업데이트
- 취약점 스캔
- 라이선스 확인

## 🔍 보안 모니터링

### 1. 로그 모니터링
```bash
# 보안 관련 로그 확인
tail -f logs/mindgarden.log | grep -E "(SECURITY|AUTH|XSS|SQL)"
```

### 2. 네트워크 모니터링
```bash
# 네트워크 트래픽 모니터링
tcpdump -i lo0 -A port 8080 | grep -E "(POST|GET|PUT|DELETE)"
```

## 📞 보안 문제 신고

보안 취약점을 발견한 경우:
1. 즉시 시스템 관리자에게 보고
2. 상세한 재현 단계 제공
3. 영향 범위 분석
4. 수정 후 재테스트

## 🔄 정기 보안 점검

### 주간 점검
- [ ] 보안 로그 검토
- [ ] Rate Limiting 통계 확인
- [ ] 인증 실패 로그 분석

### 월간 점검
- [ ] 의존성 보안 업데이트
- [ ] 암호화 키 로테이션
- [ ] 보안 테스트 실행

### 분기별 점검
- [ ] 전체 보안 아키텍처 검토
- [ ] 침투 테스트 수행
- [ ] 보안 정책 업데이트

## 📱 카카오 알림톡 보안 (NEW!)

### 1. API 키 보안
- **환경 변수 관리**: API 키를 환경 변수로 관리
```yaml
# application-prod.yml
kakao:
  alimtalk:
    api-key: ${KAKAO_ALIMTALK_API_KEY:}  # 환경 변수 필수
    sender-key: ${KAKAO_ALIMTALK_SENDER_KEY:}  # 환경 변수 필수
```

- **로그 보안**: API 키 노출 방지
```java
// API 키는 로그에 기록하지 않음
log.info("카카오 알림톡 발송 시작: 수신자={}", maskPhoneNumber(phoneNumber));
```

### 2. 개인정보 보호
- **전화번호 마스킹**: 로그에서 전화번호 마스킹 처리
```java
// 010-1234-5678 → 010****5678
private String maskPhoneNumber(String phoneNumber)
```

- **암호화 연동**: 기존 개인정보 암호화 시스템 활용
```java
// 복호화된 전화번호는 메모리에 최소 시간만 보관
String phoneNumber = encryptionUtil.decrypt(user.getPhone());
```

### 3. 템플릿 보안
- **공통 코드 기반**: SQL 인젝션 방지
- **파라미터 검증**: 템플릿 파라미터 유효성 검사
- **길이 제한**: 메시지 내용 길이 제한

### 4. 테스트 API 보안
- **개발 환경 전용**: 프로덕션에서 비활성화 권장
```yaml
# application-prod.yml에서 테스트 API 비활성화
management:
  endpoints:
    web:
      exposure:
        exclude: "*test*"
```

### 5. 시뮬레이션 모드 보안
- **환경별 분리**: 로컬(시뮬레이션), 운영(실제)
- **실수 방지**: 시뮬레이션 모드에서 실제 발송 불가
- **로그 구분**: 시뮬레이션/실제 모드 명확히 구분

### 6. 알림 발송 제한
- **Rate Limiting**: 과도한 알림 발송 방지
- **사용자 동의**: 알림 수신 동의 확인
- **스팸 방지**: 동일 내용 중복 발송 방지

---

**⚠️ 중요**: 이 가이드는 기본적인 보안 조치를 다룹니다. 실제 프로덕션 환경에서는 추가적인 보안 조치가 필요할 수 있습니다.
