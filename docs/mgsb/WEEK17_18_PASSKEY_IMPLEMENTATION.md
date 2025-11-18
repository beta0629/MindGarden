# Week 17-18: Passkey 인증 구현

## 개요

Week 17-18에서는 Week 15-16에서 설계한 Passkey 인증 시스템을 실제로 구현했습니다.

## 구현 내용

### 1. 의존성 추가

**파일**: `pom.xml`

```xml
<!-- WebAuthn/Passkey -->
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

### 2. 서비스 구현

#### 2.1 PasskeyService 인터페이스

**파일**: `src/main/java/com/mindgarden/consultation/service/PasskeyService.java`

**주요 메서드**:
- `startRegistration`: Passkey 등록 시작
- `finishRegistration`: Passkey 등록 완료
- `startAuthentication`: Passkey 인증 시작
- `finishAuthentication`: Passkey 인증 완료
- `listPasskeys`: Passkey 목록 조회
- `deletePasskey`: Passkey 삭제

#### 2.2 PasskeyServiceImpl 구현체

**파일**: `src/main/java/com/mindgarden/consultation/service/impl/PasskeyServiceImpl.java`

**구현 내용**:
- 챌린지 생성 및 관리 (메모리 기반, 향후 Redis로 전환 권장)
- PublicKeyCredentialCreationOptions 생성
- PublicKeyCredentialRequestOptions 생성
- 기본적인 Passkey 등록/인증 로직

**참고**: 현재는 기본 구조만 구현되어 있으며, webauthn4j를 사용한 실제 검증 로직은 향후 개선 예정입니다.

### 3. 컨트롤러 구현

**파일**: `src/main/java/com/mindgarden/consultation/controller/PasskeyController.java`

**API 엔드포인트**:

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/passkey/register/start` | Passkey 등록 시작 |
| POST | `/api/auth/passkey/register/finish` | Passkey 등록 완료 |
| POST | `/api/auth/passkey/authenticate/start` | Passkey 인증 시작 |
| POST | `/api/auth/passkey/authenticate/finish` | Passkey 인증 완료 |
| GET | `/api/auth/passkey/list` | Passkey 목록 조회 |
| DELETE | `/api/auth/passkey/{passkeyId}` | Passkey 삭제 |

### 4. 설정

**파일**: `src/main/resources/application-local.yml`

```yaml
# WebAuthn/Passkey 설정
webauthn:
  rp:
    name: MindGarden
    id: localhost  # 로컬 환경에서는 localhost 사용
  challenge:
    timeout: 60000  # 60초
```

## 사용 방법

### 1. Passkey 등록

#### 1.1 등록 시작

```bash
POST /api/auth/passkey/register/start
Content-Type: application/json

{
  "userId": 1,
  "deviceName": "내 iPhone"
}
```

**응답**:
```json
{
  "success": true,
  "options": {
    "challenge": "base64-encoded-challenge",
    "rp": {
      "name": "MindGarden",
      "id": "localhost"
    },
    "user": {
      "id": "base64-encoded-user-id",
      "name": "user@example.com",
      "displayName": "홍길동"
    },
    "pubKeyCredParams": [...],
    "timeout": 60000,
    "authenticatorSelection": {...},
    "challengeKey": "uuid-for-challenge"
  }
}
```

#### 1.2 등록 완료

```bash
POST /api/auth/passkey/register/finish
Content-Type: application/json

{
  "userId": 1,
  "credential": {
    "id": "base64-encoded-credential-id",
    "rawId": "base64-encoded-raw-id",
    "response": {
      "clientDataJSON": "base64-encoded-client-data",
      "attestationObject": "base64-encoded-attestation-object"
    },
    "type": "public-key"
  },
  "challengeKey": "uuid-from-start",
  "deviceName": "내 iPhone"
}
```

### 2. Passkey 인증

#### 2.1 인증 시작

```bash
POST /api/auth/passkey/authenticate/start
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**응답**:
```json
{
  "success": true,
  "options": {
    "challenge": "base64-encoded-challenge",
    "allowCredentials": [
      {
        "id": "base64-encoded-credential-id",
        "type": "public-key"
      }
    ],
    "timeout": 60000,
    "userVerification": "required",
    "challengeKey": "uuid-for-challenge"
  }
}
```

#### 2.2 인증 완료

```bash
POST /api/auth/passkey/authenticate/finish
Content-Type: application/json

{
  "email": "user@example.com",
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
  "challengeKey": "uuid-from-start"
}
```

**응답**:
```json
{
  "success": true,
  "message": "Passkey 인증 성공",
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "userInfo": {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동"
  }
}
```

### 3. Passkey 관리

#### 3.1 목록 조회

```bash
GET /api/auth/passkey/list?userId=1
```

**응답**:
```json
{
  "success": true,
  "passkeys": [
    {
      "id": 1,
      "deviceName": "내 iPhone",
      "createdAt": "2025-01-01T00:00:00",
      "lastUsedAt": "2025-01-15T12:00:00"
    }
  ]
}
```

#### 3.2 삭제

```bash
DELETE /api/auth/passkey/1?userId=1
```

**응답**:
```json
{
  "success": true,
  "message": "Passkey가 삭제되었습니다."
}
```

## 프론트엔드 연동

### WebAuthn API 사용 예시

```javascript
// Passkey 등록
async function registerPasskey(userId, deviceName) {
  // 1. 등록 시작
  const startResponse = await fetch('/api/auth/passkey/register/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, deviceName })
  });
  const { options } = await startResponse.json();
  
  // 2. WebAuthn API 호출
  const credential = await navigator.credentials.create({
    publicKey: options.options
  });
  
  // 3. 등록 완료
  const finishResponse = await fetch('/api/auth/passkey/register/finish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      credential: {
        id: credential.id,
        rawId: arrayBufferToBase64(credential.rawId),
        response: {
          clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
          attestationObject: arrayBufferToBase64(credential.response.attestationObject)
        },
        type: credential.type
      },
      challengeKey: options.options.challengeKey,
      deviceName
    })
  });
  
  return await finishResponse.json();
}

// Passkey 인증
async function authenticateWithPasskey(email) {
  // 1. 인증 시작
  const startResponse = await fetch('/api/auth/passkey/authenticate/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const { options } = await startResponse.json();
  
  // 2. WebAuthn API 호출
  const credential = await navigator.credentials.get({
    publicKey: options.options
  });
  
  // 3. 인증 완료
  const finishResponse = await fetch('/api/auth/passkey/authenticate/finish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      credential: {
        id: credential.id,
        rawId: arrayBufferToBase64(credential.rawId),
        response: {
          clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
          authenticatorData: arrayBufferToBase64(credential.response.authenticatorData),
          signature: arrayBufferToBase64(credential.response.signature),
          userHandle: arrayBufferToBase64(credential.response.userHandle)
        },
        type: credential.type
      },
      challengeKey: options.options.challengeKey
    })
  });
  
  return await finishResponse.json();
}
```

## 향후 개선 사항

### 1. webauthn4j 실제 검증 로직 구현

현재는 기본 구조만 구현되어 있으며, webauthn4j를 사용한 실제 검증 로직이 필요합니다:

- Attestation 검증
- Assertion 검증
- 공개 키 추출 및 저장
- 서명 검증

### 2. 챌린지 관리 개선

현재는 메모리 기반 챌린지 저장소를 사용하고 있습니다. 향후 Redis로 전환하여:
- 분산 환경 지원
- 챌린지 만료 자동 관리
- 확장성 향상

### 3. 에러 처리 개선

- 상세한 에러 메시지
- 에러 코드 정의
- 사용자 친화적인 메시지

### 4. 보안 강화

- 챌린지 재사용 방지
- 카운터 검증 강화
- 리플레이 공격 방지

## 테스트

### 단위 테스트

**파일**: `src/test/java/com/mindgarden/consultation/service/impl/PasskeyServiceTest.java`

```bash
mvn test -Dtest=PasskeyServiceTest
```

### 통합 테스트

향후 실제 WebAuthn API를 사용한 통합 테스트 구현 예정.

## 문제 해결

### 1. "유효하지 않거나 만료된 챌린지입니다"

- 챌린지가 만료되었거나 이미 사용되었을 수 있습니다
- 등록/인증 시작 후 60초 이내에 완료해야 합니다

### 2. "등록되지 않은 Passkey입니다"

- Passkey가 삭제되었거나 비활성화되었을 수 있습니다
- Passkey 목록을 확인하세요

### 3. WebAuthn API 오류

- 브라우저가 WebAuthn을 지원하는지 확인
- HTTPS 또는 localhost에서만 동작합니다
- 브라우저 콘솔에서 상세 오류 확인

## Week 17-18 완료 체크리스트

- [x] webauthn4j 의존성 추가
- [x] Passkey 서비스 구현
- [x] Passkey 컨트롤러 구현
- [x] WebAuthn 설정 추가
- [x] 단위 테스트 작성
- [x] 문서화
- [ ] webauthn4j 실제 검증 로직 구현 (향후 개선)
- [ ] 통합 테스트 (향후 개선)

## 다음 단계

Week 19-20에서는 Passkey 인증의 고급 기능을 구현합니다:
- 크로스 플랫폼 동기화
- Passkey 백업 및 복구
- 다중 Passkey 관리 개선

