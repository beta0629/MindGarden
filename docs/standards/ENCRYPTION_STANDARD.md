# 암호화 처리 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 암호화 처리 표준입니다.  
개인정보 보호법 및 정보보안 정책에 따라 민감한 데이터의 암호화 방식을 정의합니다.

### 참조 문서
- [보안 인증 표준](./SECURITY_AUTHENTICATION_STANDARD.md)
- [백엔드 코딩 표준](./BACKEND_CODING_STANDARD.md)
- [데이터베이스 스키마 표준](./DATABASE_SCHEMA_STANDARD.md)

### 구현 위치
- **개인정보 암호화**: `src/main/java/com/coresolution/consultation/util/PersonalDataEncryptionUtil.java`
- **일반 암호화**: `src/main/java/com/coresolution/consultation/util/EncryptionUtil.java`
- **암호화 키 관리**: `src/main/java/com/coresolution/consultation/util/PersonalDataEncryptionKeyProvider.java`

---

## 🎯 암호화 원칙

### 1. 개인정보 암호화 필수
```
개인정보 보호법에 따라 다음 정보는 반드시 암호화하여 저장
```

**암호화 필수 항목**:
- 이름 (name)
- 전화번호 (phone)
- 이메일 (email)
- 주소 (address)
- 주민등록번호 (ssn) - 사용 금지
- 계좌번호 (bankAccount)
- 신용카드번호 (creditCard)

### 2. 키 관리 정책
```
암호화 키는 환경변수로 관리하며, 키 로테이션 지원
```

**원칙**:
- ✅ 환경변수로 키 관리 (코드 내 하드코딩 금지)
- ✅ 다중 키 지원 (키 로테이션)
- ✅ 활성 키 자동 교체
- ✅ 레거시 키로 복호화 지원

### 3. 암호화 알고리즘
```
AES-256 CBC 모드 사용
```

**알고리즘 상세**:
- **암호화 방식**: AES (Advanced Encryption Standard)
- **키 길이**: 256비트 (32바이트)
- **모드**: CBC (Cipher Block Chaining)
- **패딩**: PKCS5Padding
- **IV (초기화 벡터)**: 16바이트

---

## 🔐 개인정보 암호화

### 1. PersonalDataEncryptionUtil 사용

#### 기본 사용법
```java
@RequiredArgsConstructor
public class UserService {
    
    private final PersonalDataEncryptionUtil encryptionUtil;
    
    /**
     * 사용자 생성 시 암호화
     */
    public User createUser(UserCreateRequest request) {
        User user = User.builder()
            .name(encryptionUtil.encrypt(request.getName()))
            .phone(encryptionUtil.encrypt(request.getPhone()))
            .email(encryptionUtil.encrypt(request.getEmail()))
            .build();
        
        return userRepository.save(user);
    }
    
    /**
     * 사용자 조회 시 복호화
     */
    public UserResponse getUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("User", id));
        
        // 복호화
        String decryptedName = encryptionUtil.safeDecrypt(user.getName());
        String decryptedPhone = encryptionUtil.safeDecrypt(user.getPhone());
        
        return UserResponse.builder()
            .name(decryptedName)
            .phone(decryptedPhone)
            .build();
    }
}
```

#### 안전한 암호화/복호화
```java
/**
 * 안전한 암호화 (이미 암호화된 경우 활성 키로 재암호화)
 */
String encrypted = encryptionUtil.safeEncrypt(plainText);

/**
 * 안전한 복호화 (암호화되지 않은 경우 그대로 반환)
 */
String decrypted = encryptionUtil.safeDecrypt(encryptedText);
```

### 2. 암호화 키 관리

#### 환경변수 설정
```bash
# 활성 키 ID
PERSONAL_DATA_ENCRYPTION_ACTIVE_KEY_ID=v2

# 암호화 키 목록 (keyId:key 형식, 쉼표로 구분)
PERSONAL_DATA_ENCRYPTION_KEYS=v2:Q29vbFNlY3JldEtleTIzIT8=,v1:QmFja3VwS2V5MTIzIT8=

# IV 목록 (keyId:iv 형식, 쉼표로 구분)
PERSONAL_DATA_ENCRYPTION_IVS=v2:Q29vbElWMjMxMjM=,v1:QmFja3VwSXYxMjM=
```

#### 키 로테이션
```java
/**
 * 활성 키로 재암호화 (필요 시)
 */
String reencrypted = encryptionUtil.ensureActiveKeyEncryption(encryptedText);

/**
 * 활성 키로 암호화되었는지 확인
 */
boolean isActive = encryptionUtil.isEncryptedWithActiveKey(encryptedText);
```

### 3. 암호화 형식

#### 암호화된 데이터 형식
```
{keyId}::{cipherText}
```

**예시**:
```
v2::U2FsdGVkX1+xyz123...
```

- **keyId**: 암호화에 사용된 키 버전 (예: v1, v2)
- **cipherText**: Base64로 인코딩된 암호화 데이터

---

## 🔒 일반 암호화 (시스템 설정)

### 1. EncryptionUtil 사용

#### 사용 용도
- 시스템 설정값 암호화 (API 키, 비밀번호 등)
- 민감한 설정값 저장

#### 기본 사용법
```java
// 암호화
String encrypted = EncryptionUtil.encrypt(plainText);

// 복호화
String decrypted = EncryptionUtil.decrypt(encryptedText);
```

#### 주의사항
- ⚠️ 개인정보는 `PersonalDataEncryptionUtil` 사용
- ✅ 시스템 설정값만 사용
- ✅ 키 로테이션 불가

---

## 🎭 데이터 마스킹

### 1. 이름 마스킹
```java
String maskedName = encryptionUtil.maskName("홍길동");
// 결과: "홍*동"

String maskedName2 = encryptionUtil.maskName("김철수");
// 결과: "김*수"
```

**규칙**:
- 1글자: 그대로 표시
- 2글자: 첫 글자 + `*`
- 3글자 이상: 첫 글자 + `*` (중간) + 마지막 글자

### 2. 이메일 마스킹
```java
String maskedEmail = encryptionUtil.maskEmail("hong@example.com");
// 결과: "h**g@example.com"
```

**규칙**:
- 로컬 부분만 마스킹
- 도메인 부분은 그대로 표시

---

## 📊 암호화 대상 데이터

### 1. 필수 암호화 대상

| 데이터 타입 | 필드명 | 암호화 유틸리티 | 설명 |
|-----------|--------|----------------|------|
| 이름 | name | PersonalDataEncryptionUtil | 개인정보 |
| 전화번호 | phone | PersonalDataEncryptionUtil | 개인정보 |
| 이메일 | email | PersonalDataEncryptionUtil | 개인정보 |
| 주소 | address | PersonalDataEncryptionUtil | 개인정보 |
| 계좌번호 | bankAccount | PersonalDataEncryptionUtil | 금융정보 |
| API 키 | apiKey | PersonalDataEncryptionService | 시스템 설정 |
| 비밀키 | secretKey | PersonalDataEncryptionService | 시스템 설정 |

### 2. 암호화 불필요

| 데이터 타입 | 필드명 | 설명 |
|-----------|--------|------|
| 사용자 ID | userId | 암호화 불필요 |
| 역할 | role | 암호화 불필요 |
| 상태 | status | 암호화 불필요 |
| 생성일시 | createdAt | 암호화 불필요 |

---

## 💻 코드 예시

### 1. Entity에 암호화 필드 저장
```java
@Entity
@Table(name = "users")
public class User extends BaseEntity {
    
    @Column(name = "name", length = 100)
    private String name;  // 암호화되어 저장
    
    @Column(name = "phone", length = 20)
    private String phone;  // 암호화되어 저장
    
    @Column(name = "email", length = 100)
    private String email;  // 암호화되어 저장
}
```

### 2. Service에서 암호화 처리
```java
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    private final PersonalDataEncryptionUtil encryptionUtil;
    
    @Override
    public UserResponse create(UserCreateRequest request) {
        User user = User.builder()
            .name(encryptionUtil.safeEncrypt(request.getName()))
            .phone(encryptionUtil.safeEncrypt(request.getPhone()))
            .email(encryptionUtil.safeEncrypt(request.getEmail()))
            .build();
        
        User saved = userRepository.save(user);
        
        // 응답 시 복호화
        return UserResponse.builder()
            .id(saved.getId())
            .name(encryptionUtil.safeDecrypt(saved.getName()))
            .phone(encryptionUtil.safeDecrypt(saved.getPhone()))
            .email(encryptionUtil.safeDecrypt(saved.getEmail()))
            .build();
    }
    
    @Override
    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("User", id));
        
        return UserResponse.builder()
            .id(user.getId())
            .name(encryptionUtil.safeDecrypt(user.getName()))
            .phone(encryptionUtil.safeDecrypt(user.getPhone()))
            .email(encryptionUtil.safeDecrypt(user.getEmail()))
            .build();
    }
}
```

### 3. 목록 조회 시 복호화
```java
@Override
@Transactional(readOnly = true)
public List<UserResponse> findAll() {
    List<User> users = userRepository.findAll();
    
    return users.stream()
        .map(user -> UserResponse.builder()
            .id(user.getId())
            .name(encryptionUtil.safeDecrypt(user.getName()))
            .phone(encryptionUtil.safeDecrypt(user.getPhone()))
            .email(encryptionUtil.safeDecrypt(user.getEmail()))
            .build())
        .collect(Collectors.toList());
}
```

---

## 🔑 키 관리 및 로테이션

### 1. 키 생성 방법

#### 새 키 생성
```bash
# Base64로 인코딩된 32바이트 키 생성
openssl rand -base64 32

# Base64로 인코딩된 16바이트 IV 생성
openssl rand -base64 16
```

#### 환경변수 설정
```bash
# .env 파일
PERSONAL_DATA_ENCRYPTION_ACTIVE_KEY_ID=v3
PERSONAL_DATA_ENCRYPTION_KEYS=v3:새로운키Base64인코딩값,v2:기존키Base64인코딩값,v1:레거시키Base64인코딩값
PERSONAL_DATA_ENCRYPTION_IVS=v3:새로운IVBase64인코딩값,v2:기존IVBase64인코딩값,v1:레거시IVBase64인코딩값
```

### 2. 키 로테이션 절차

#### 1단계: 새 키 추가
```bash
# 환경변수에 새 키 추가 (기존 키는 유지)
PERSONAL_DATA_ENCRYPTION_KEYS=v3:새키,v2:기존키,v1:레거시키
```

#### 2단계: 활성 키 변경
```bash
# 활성 키를 새 키로 변경
PERSONAL_DATA_ENCRYPTION_ACTIVE_KEY_ID=v3
```

#### 3단계: 점진적 재암호화
```java
/**
 * 키 로테이션 서비스
 */
@Service
@RequiredArgsConstructor
public class EncryptionKeyRotationService {
    
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final UserRepository userRepository;
    
    /**
     * 모든 사용자 데이터를 활성 키로 재암호화
     */
    @Transactional
    public void rotateAllUserData() {
        List<User> users = userRepository.findAll();
        
        for (User user : users) {
            // 활성 키로 재암호화
            if (encryptionUtil.isEncrypted(user.getName())) {
                String reencrypted = encryptionUtil.ensureActiveKeyEncryption(user.getName());
                user.setName(reencrypted);
            }
            
            if (encryptionUtil.isEncrypted(user.getPhone())) {
                String reencrypted = encryptionUtil.ensureActiveKeyEncryption(user.getPhone());
                user.setPhone(reencrypted);
            }
            
            userRepository.save(user);
        }
    }
}
```

---

## 🚫 금지 사항

### 1. 평문 저장 금지
```java
// ❌ 금지: 개인정보 평문 저장
user.setPhone("010-1234-5678");

// ✅ 권장: 암호화 후 저장
user.setPhone(encryptionUtil.safeEncrypt("010-1234-5678"));
```

### 2. 키 하드코딩 금지
```java
// ❌ 금지: 키를 코드에 하드코딩
private static final String SECRET_KEY = "MySecretKey123";

// ✅ 권장: 환경변수에서 조회
@Value("${encryption.key}")
private String secretKey;
```

### 3. 암호화 없이 전송 금지
```java
// ❌ 금지: 평문으로 API 응답
return ResponseEntity.ok(user.getName());

// ✅ 권장: 복호화 후 응답 (필요한 경우만)
String decryptedName = encryptionUtil.safeDecrypt(user.getName());
return ResponseEntity.ok(decryptedName);
```

---

## ✅ 체크리스트

### 개인정보 저장 시
- [ ] `PersonalDataEncryptionUtil` 사용
- [ ] `safeEncrypt()` 메서드 사용 (이미 암호화된 경우 처리)
- [ ] 암호화 키는 환경변수로 관리
- [ ] 테스트 코드에서도 암호화 적용

### 개인정보 조회 시
- [ ] `safeDecrypt()` 메서드 사용
- [ ] 복호화 실패 시 처리 (평문으로 저장된 레거시 데이터)
- [ ] 로그에 평문 출력 금지

### 키 관리 시
- [ ] 환경변수로 키 관리
- [ ] 키 로테이션 계획 수립
- [ ] 레거시 키 보관 (복호화 지원)
- [ ] 키 백업 및 보안 관리

---

## 💡 베스트 프랙티스

### 1. 일괄 재암호화 배치 작업
```java
/**
 * 배치 작업: 활성 키로 재암호화
 */
@Scheduled(cron = "0 2 * * *")  // 매일 새벽 2시
public void rotateEncryptionKeys() {
    log.info("암호화 키 로테이션 시작");
    
    List<User> users = userRepository.findAll();
    int count = 0;
    
    for (User user : users) {
        boolean updated = false;
        
        if (encryptionUtil.isEncrypted(user.getName()) && 
            !encryptionUtil.isEncryptedWithActiveKey(user.getName())) {
            user.setName(encryptionUtil.ensureActiveKeyEncryption(user.getName()));
            updated = true;
        }
        
        if (updated) {
            userRepository.save(user);
            count++;
        }
    }
    
    log.info("암호화 키 로테이션 완료: {}건 처리", count);
}
```

### 2. 암호화 상태 확인
```java
/**
 * 암호화 상태 확인
 */
public boolean isDataEncrypted(User user) {
    return encryptionUtil.isEncrypted(user.getName()) &&
           encryptionUtil.isEncrypted(user.getPhone()) &&
           encryptionUtil.isEncrypted(user.getEmail());
}
```

### 3. 로그에서 개인정보 마스킹
```java
/**
 * 로그 출력 시 마스킹
 */
log.info("사용자 조회: name={}, phone={}", 
    encryptionUtil.maskName(user.getName()),
    maskPhone(user.getPhone()));  // 마스킹 유틸리티 사용
```

---

## 📞 문의

암호화 처리 표준 관련 문의:
- 보안 팀
- 백엔드 팀
- 아키텍처 팀

**최종 업데이트**: 2025-12-03

