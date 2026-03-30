# Week 15-16: Passkey 인증 설계 및 준비

## 개요

Passkey는 비밀번호를 대체하는 안전하고 간편한 인증 방식으로, WebAuthn 표준을 기반으로 합니다. 생체 인식(지문, 얼굴 인식) 또는 화면 잠금을 통해 로그인할 수 있으며, 피싱 공격에 강하고 사용자 경험을 향상시킵니다.

## 1. Passkey 개요

### 1.1 Passkey란?

- **정의**: 공개 키 암호화 기술을 활용한 비밀번호 없는 인증 방식
- **표준**: WebAuthn (Web Authentication API)
- **장점**:
  - 비밀번호 불필요 (기억할 필요 없음)
  - 피싱 공격에 강함
  - 생체 인식 기반 (지문, 얼굴 인식)
  - 크로스 플랫폼 지원 (동기화 가능)

### 1.2 작동 원리

1. **등록 (Registration)**:
   - 사용자가 서비스에 등록할 때, 기기에서 공개 키와 개인 키 쌍 생성
   - 공개 키는 서버에 저장
   - 개인 키는 기기에 안전하게 보관 (절대 서버로 전송되지 않음)

2. **인증 (Authentication)**:
   - 사용자가 로그인 시도
   - 서버가 챌린지(랜덤 값) 전송
   - 사용자가 생체 인식으로 개인 키로 챌린지 서명
   - 서버가 공개 키로 서명 검증
   - 검증 성공 시 로그인 완료

### 1.3 지원 플랫폼

- **데스크탑**: Windows Hello, macOS Touch ID/Face ID
- **모바일**: Android (Google Passkey), iOS (Apple Passkey)
- **웹 브라우저**: Chrome, Edge, Safari, Firefox (WebAuthn API)

## 2. 기술 조사 및 요구사항 분석

### 2.1 WebAuthn 표준

- **W3C 표준**: Web Authentication API (WebAuthn)
- **RFC 8705**: FIDO2/WebAuthn 표준
- **지원 라이브러리**:
  - Java: `webauthn4j` (추천)
  - Spring Boot: `spring-security-webauthn` (향후 지원 예정)

### 2.2 요구사항

#### 기능 요구사항

1. **Passkey 등록**
   - 사용자가 Passkey 등록 가능
   - 여러 기기에서 Passkey 등록 가능
   - Passkey 이름 지정 (예: "내 iPhone", "내 노트북")

2. **Passkey 인증**
   - Passkey로 로그인 가능
   - 기존 비밀번호 인증과 병행 가능
   - Passkey 인증 실패 시 비밀번호 인증으로 폴백

3. **Passkey 관리**
   - 등록된 Passkey 목록 조회
   - Passkey 삭제
   - Passkey 이름 변경

#### 비기능 요구사항

1. **보안**
   - 개인 키는 절대 서버로 전송되지 않음
   - 공개 키만 서버에 저장
   - 챌린지-응답 방식으로 리플레이 공격 방지

2. **사용자 경험**
   - 간편한 등록 프로세스
   - 빠른 인증 (생체 인식)
   - 크로스 플랫폼 동기화

3. **호환성**
   - 다양한 브라우저 지원
   - 다양한 기기 지원 (데스크탑, 모바일)

## 3. 아키텍처 설계

### 3.1 시스템 아키텍처

```
┌─────────────┐
│   Client    │ (브라우저/모바일 앱)
│  (WebAuthn) │
└──────┬──────┘
       │
       │ 1. Registration Request
       │ 2. Challenge
       │ 3. Credential (Public Key)
       │
       ▼
┌─────────────┐
│   Backend   │
│  (Spring)   │
└──────┬──────┘
       │
       │ 4. Store Public Key
       │
       ▼
┌─────────────┐
│  Database   │
│ (user_passkey)│
└─────────────┘
```

### 3.2 데이터베이스 설계

#### user_passkey 테이블

```sql
CREATE TABLE user_passkey (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    credential_id VARCHAR(255) NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter BIGINT DEFAULT 0,
    device_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES user(id),
    INDEX idx_user_id (user_id),
    INDEX idx_credential_id (credential_id)
);
```

**필드 설명**:
- `credential_id`: WebAuthn Credential ID (고유 식별자)
- `public_key`: 공개 키 (Base64 인코딩)
- `counter`: 리플레이 공격 방지를 위한 카운터
- `device_name`: 사용자가 지정한 기기 이름
- `last_used_at`: 마지막 사용 시간

### 3.3 API 설계

#### 3.3.1 Passkey 등록

**POST** `/api/auth/passkey/register/start`

요청:
```json
{
  "userId": 123,
  "deviceName": "내 iPhone"
}
```

응답:
```json
{
  "challenge": "base64-encoded-challenge",
  "rp": {
    "name": "MindGarden",
    "id": "m-garden.co.kr"
  },
  "user": {
    "id": "base64-encoded-user-id",
    "name": "user@example.com",
    "displayName": "홍길동"
  },
  "pubKeyCredParams": [
    {
      "type": "public-key",
      "alg": -7
    }
  ],
  "timeout": 60000,
  "authenticatorSelection": {
    "authenticatorAttachment": "platform",
    "userVerification": "required"
  }
}
```

**POST** `/api/auth/passkey/register/finish`

요청:
```json
{
  "credential": {
    "id": "base64-encoded-credential-id",
    "rawId": "base64-encoded-raw-id",
    "response": {
      "clientDataJSON": "base64-encoded-client-data",
      "attestationObject": "base64-encoded-attestation-object"
    },
    "type": "public-key"
  },
  "challenge": "base64-encoded-challenge",
  "deviceName": "내 iPhone"
}
```

응답:
```json
{
  "success": true,
  "message": "Passkey 등록이 완료되었습니다.",
  "passkeyId": 1
}
```

#### 3.3.2 Passkey 인증

**POST** `/api/auth/passkey/authenticate/start`

요청:
```json
{
  "email": "user@example.com"
}
```

응답:
```json
{
  "challenge": "base64-encoded-challenge",
  "allowCredentials": [
    {
      "id": "base64-encoded-credential-id",
      "type": "public-key"
    }
  ],
  "timeout": 60000,
  "userVerification": "required"
}
```

**POST** `/api/auth/passkey/authenticate/finish`

요청:
```json
{
  "credential": {
    "id": "base64-encoded-credential-id",
    "rawId": "base64-encoded-raw-id",
    "response": {
      "clientDataJSON": "base64-encoded-client-data",
      "authenticatorData": "base64-encoded-authenticator-data",
      "signature": "base64-encoded-signature",
      "userHandle": "base64-encoded-user-handle"
    },
    "type": "public-key"
  },
  "challenge": "base64-encoded-challenge"
}
```

응답:
```json
{
  "success": true,
  "message": "Passkey 인증 성공",
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "userInfo": {
    "id": 123,
    "email": "user@example.com",
    "name": "홍길동"
  }
}
```

#### 3.3.3 Passkey 관리

**GET** `/api/auth/passkey/list`

응답:
```json
{
  "success": true,
  "passkeys": [
    {
      "id": 1,
      "deviceName": "내 iPhone",
      "createdAt": "2025-01-01T00:00:00",
      "lastUsedAt": "2025-01-15T12:00:00"
    },
    {
      "id": 2,
      "deviceName": "내 노트북",
      "createdAt": "2025-01-05T00:00:00",
      "lastUsedAt": "2025-01-14T10:00:00"
    }
  ]
}
```

**DELETE** `/api/auth/passkey/{passkeyId}`

응답:
```json
{
  "success": true,
  "message": "Passkey가 삭제되었습니다."
}
```

## 4. 구현 준비

### 4.1 의존성 추가

**pom.xml**:
```xml
<dependency>
    <groupId>com.webauthn4j</groupId>
    <artifactId>webauthn4j-core</artifactId>
    <version>0.28.0.RELEASE</version>
</dependency>
<dependency>
    <groupId>com.webauthn4j</groupId>
    <artifactId>webauthn4j-spring-security</artifactId>
    <version>0.28.0.RELEASE</version>
</dependency>
```

### 4.2 설정

**application.yml**:
```yaml
webauthn:
  rp:
    name: MindGarden
    id: m-garden.co.kr
  challenge:
    timeout: 60000 # 60초
  attestation:
    trust-anchor:
      - type: NONE # 개발 환경
```

### 4.3 엔티티 생성

**UserPasskey.java**:
```java
@Entity
@Table(name = "user_passkey")
public class UserPasskey {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(name = "credential_id", unique = true, nullable = false)
    private String credentialId;
    
    @Column(name = "public_key", columnDefinition = "TEXT", nullable = false)
    private String publicKey;
    
    @Column(name = "counter", nullable = false)
    private Long counter = 0L;
    
    @Column(name = "device_name")
    private String deviceName;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    // Getters and Setters
}
```

## 5. 보안 고려사항

### 5.1 챌린지 관리

- 챌린지는 랜덤하고 예측 불가능해야 함
- 챌린지는 일회용 (한 번 사용 후 무효화)
- 챌린지는 타임아웃 설정 (60초 권장)

### 5.2 카운터 관리

- 각 Passkey마다 카운터 유지
- 인증 시 카운터 증가
- 이전 카운터보다 작거나 같은 값이 오면 리플레이 공격으로 간주

### 5.3 공개 키 검증

- 등록 시 Attestation 검증
- 인증 시 서명 검증
- 신뢰할 수 있는 인증기만 허용

## 6. 사용자 경험 (UX)

### 6.1 등록 플로우

1. 사용자가 "Passkey 등록" 클릭
2. 브라우저가 WebAuthn API 호출
3. 사용자가 생체 인식 수행
4. 등록 완료 메시지 표시

### 6.2 인증 플로우

1. 사용자가 "Passkey로 로그인" 클릭
2. 브라우저가 WebAuthn API 호출
3. 사용자가 생체 인식 수행
4. 로그인 완료

### 6.3 폴백 전략

- Passkey 인증 실패 시 비밀번호 인증으로 폴백
- Passkey 미등록 사용자는 기존 인증 방식 사용

## 7. 테스트 계획

### 7.1 단위 테스트

- Passkey 등록 로직 테스트
- Passkey 인증 로직 테스트
- 챌린지 생성 및 검증 테스트
- 공개 키 검증 테스트

### 7.2 통합 테스트

- 전체 등록 플로우 테스트
- 전체 인증 플로우 테스트
- 여러 기기 등록 테스트
- Passkey 삭제 테스트

### 7.3 브라우저 호환성 테스트

- Chrome/Edge (Windows, macOS, Android)
- Safari (macOS, iOS)
- Firefox (Windows, macOS, Android)

## 8. 향후 구현 계획

### Phase 1: 기본 구현 (Week 17-18 예정)
- Passkey 등록 기능
- Passkey 인증 기능
- 기본 관리 기능

### Phase 2: 고급 기능 (Week 19-20 예정)
- 크로스 플랫폼 동기화
- Passkey 백업 및 복구
- 다중 Passkey 관리

### Phase 3: 최적화 (Week 21-22 예정)
- 성능 최적화
- 사용자 경험 개선
- 보안 강화

## 9. 참고 자료

- [WebAuthn 표준](https://www.w3.org/TR/webauthn-2/)
- [webauthn4j 문서](https://github.com/webauthn4j/webauthn4j)
- [Google Passkey 가이드](https://developers.google.com/identity/passkeys)
- [Apple Passkey 가이드](https://developer.apple.com/passkeys/)

## 10. Week 15-16 완료 체크리스트

- [x] Passkey 인증 설계 문서 작성
- [x] WebAuthn/Passkey 기술 조사
- [x] Passkey 인증 아키텍처 설계
- [x] 데이터베이스 설계
- [x] API 설계
- [x] 보안 고려사항 분석
- [ ] Passkey 인증 구현 준비 (의존성, 설정) - Week 16
- [ ] 문서화 완료 - Week 16

## 다음 단계

Week 17-18에서 실제 Passkey 인증 구현을 진행합니다.

