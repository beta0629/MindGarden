# "레거시로 로그인" 및 대시보드/로그인 반복 원인 분석

## 증상

- 화면에 **"김선희 legacy::3NNRmST/..."** 처럼 `legacy::` 접두사가 붙은 문자열이 표시됨
- 대시보드와 로그인 페이지가 **반복**됨

---

## 1. "legacy::" 표시 원인

### 1.1 `legacy::` 형식의 의미

- `legacy::`는 **개인정보 암호화 키 버전 ID**입니다.
- 형식: `{keyId}::{Base64암호문}` (예: `legacy::3NNRmST/...`)
- `PersonalDataEncryptionKeyProvider`에서 `DEFAULT_LEGACY_KEY_ID = "legacy"`로 정의됨

### 1.2 복호화 실패 시 원문 그대로 반환

`PersonalDataEncryptionUtil.decrypt()` (64~81라인):

```java
} catch (Exception e) {
    log.debug("복호화 실패, 평문 데이터로 처리: {}", encryptedText);
    return encryptedText;  // ← 실패 시 "legacy::..." 그대로 반환
}
```

복호화가 실패하면 `encryptedText`(예: `legacy::3NNRmST/...`)를 그대로 반환합니다.

### 1.3 복호화가 실패하는 경우

| 원인 | 설명 |
|------|------|
| **키/IV 불일치** | DB 암호화 시 사용한 키/IV와 현재 `encryption.personal-data.key`, `iv`가 다름 |
| **legacy 키 미등록** | `key-versions`에 `legacy`가 없고, `encryption.personal-data.key`도 비어 있음 |
| **암호문 손상** | DB 저장/마이그레이션 과정에서 Base64 문자열이 깨짐 |

### 1.4 `isEncrypted()` 판별 문제

`PersonalDataEncryptionUtil.isEncrypted()` (142~159라인):

```java
if (text.contains(VERSION_DELIMITER)) {
    String version = extractKeyVersion(text);  // "legacy"
    return StringUtils.hasText(version) && keyProvider.hasKey(version);
}
```

- `keyProvider.hasKey("legacy")`가 **false**이면 `isEncrypted()` = false
- 이 경우 `safeDecrypt()`는 복호화를 시도하지 않고 **원문 그대로** 반환
- 결과적으로 `legacy::...` 문자열이 그대로 노출됨

### 1.5 프론트엔드 표시 로직

`SessionUserProfile.js` (66~77라인):

```javascript
const getUserDisplayName = () => {
  if (sessionUser?.name && !sessionUser.name.includes('==')) {
    return sessionUser.name;
  }
  if (sessionUser?.nickname && !sessionUser.nickname.includes('==')) {
    return sessionUser.nickname;  // ← "legacy::..." 에는 "==" 없음 → 통과
  }
  // ...
};
```

- `includes('==')`는 Base64 패딩(`==`)을 가진 암호문을 걸러내기 위한 용도
- `legacy::3NNRmST/...`에는 `==`가 없어서 이 조건을 통과
- 따라서 복호화되지 않은 `legacy::...` 문자열이 그대로 화면에 표시됨

---

## 2. 대시보드/로그인 반복과의 관계

### 2.1 직접적인 코드 경로는 없음

- `legacy::` 표시 자체가 세션 체크나 401을 유발하는 코드 경로는 없음
- `AuthController.getCurrentUser()`는 복호화 실패 시에도 200 OK를 반환함 (catch에서 raw 값 사용)

### 2.2 가능한 간접 원인

1. **세션 체크 타이밍**
   - 로그인 직후 세션이 아직 안정화되기 전에 `checkSession`이 호출되면 401이 발생할 수 있음
   - `justLoggedIn` 플래그로 일부 완화되어 있으나, 타이밍에 따라 여전히 발생 가능

2. **테넌트/도메인 불일치**
   - `getDefaultApiHeaders()`의 `tenantId`와 실제 세션 테넌트가 다르면 401 가능성

3. **쿠키/도메인 설정**
   - `credentials: 'include'` 사용 시, 서브도메인/경로 설정이 맞지 않으면 세션 쿠키가 전달되지 않아 401 발생 가능

---

## 3. 해결 방안

### 3.1 백엔드: legacy 키 설정 확인

**application-local.yml / application-dev.yml** 등에서 다음을 확인:

```yaml
encryption:
  personal-data:
    key: ${PERSONAL_DATA_ENCRYPTION_KEY:mindgarden_encryption_key_2025_local_dev}
    iv: ${PERSONAL_DATA_ENCRYPTION_IV:mindgarden_iv_2025_local}
    # 또는 key-versions에 legacy 포함
    key-versions: ${PERSONAL_DATA_ENCRYPTION_KEYS:legacy:mindgarden_encryption_key_2025_local_dev}
    iv-versions: ${PERSONAL_DATA_ENCRYPTION_IVS:legacy:mindgarden_iv_2025_local}
```

- DB에 저장된 데이터를 암호화할 때 사용한 키/IV와 **동일한 값**이어야 함
- 운영 환경에서는 `PERSONAL_DATA_ENCRYPTION_KEY`, `PERSONAL_DATA_ENCRYPTION_IV` 환경 변수 확인

### 3.2 백엔드: `isEncrypted()` 개선 (선택)

`legacy::` 형식이면 `keyProvider.hasKey("legacy")`와 무관하게 암호화된 데이터로 간주:

```java
// PersonalDataEncryptionUtil.isEncrypted()
if (text.contains(VERSION_DELIMITER)) {
    String version = extractKeyVersion(text);
    // legacy 형식이면 복호화 시도 (키가 없어도 fallback 시도)
    if ("legacy".equals(version)) {
        return true;
    }
    return StringUtils.hasText(version) && keyProvider.hasKey(version);
}
```

### 3.3 프론트엔드: 암호화 문자열 표시 방지

`SessionUserProfile.js` 등에서 `legacy::` 접두사 필터링:

```javascript
const getUserDisplayName = () => {
  const rawName = sessionUser?.name && !sessionUser.name.includes('==') ? sessionUser.name : null;
  const rawNickname = sessionUser?.nickname && !sessionUser.nickname.includes('==') ? sessionUser.nickname : null;
  // legacy:: 접두사는 복호화 실패로 간주, 표시하지 않음
  if (rawName && !rawName.startsWith('legacy::')) return rawName;
  if (rawNickname && !rawNickname.startsWith('legacy::')) return rawNickname;
  if (sessionUser?.userId) return sessionUser.userId;
  return '사용자';
};
```

### 3.4 DB 데이터 점검

해당 사용자(agisunny@hanmail.net)의 `users` 테이블:

```sql
SELECT id, email, name, nickname FROM users WHERE email LIKE '%agisunny%' OR email LIKE '%legacy%';
```

- `nickname`, `name` 컬럼이 `legacy::`로 시작하는지 확인
- 복호화에 사용할 키/IV가 해당 데이터 암호화 시점과 일치하는지 확인

---

## 4. 요약

| 항목 | 내용 |
|------|------|
| **"legacy::" 표시** | DB에 `legacy::Base64...` 형태로 저장된 닉네임/이름이 복호화 실패로 그대로 반환됨 |
| **복호화 실패 원인** | 키/IV 불일치, legacy 키 미설정, `isEncrypted()` 판별 오류 |
| **프론트 표시** | `includes('==')` 체크를 통과해 암호문이 그대로 노출됨 |
| **루프와의 관계** | 직접적인 코드 경로는 없으나, 세션/테넌트/쿠키 설정 문제와 겹칠 수 있음 |

**우선 조치**: `encryption.personal-data.key` / `iv` 및 `PERSONAL_DATA_ENCRYPTION_KEY` / `IV` 환경 변수가 DB 암호화 시 사용한 값과 일치하는지 확인하고, 프론트엔드에서 `legacy::` 접두사 필터링을 적용하는 것을 권장합니다.
