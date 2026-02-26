# 비밀번호 BCrypt 저장·검증 경로 비교 분석

## 1. 요약

- **저장**: 세 경로 모두 **한 번만** BCrypt 인코딩 후 DB `users.password`에 저장됨.
- **검증**: 로그인은 Spring Security `AuthenticationManager` → `DaoAuthenticationProvider`가 **동일한 `PasswordEncoder` 빈(PasswordPolicyConfig BCrypt)**으로 `matches(raw, encoded)` 수행.
- **불일치**: 저장/검증 흐름은 동일. **`UserServiceImpl.isPasswordEncoded()` 연산자 우선순위 버그**로 `$2a$`/`$2b$` 접두어일 때 길이 검사가 누락됨.

---

## 2. 세 경로별 비밀번호 저장 흐름

### 2.1 온보딩 (정상)

| 단계 | 위치 | 동작 |
|------|------|------|
| 1 | `OnboardingServiceImpl` | checklist `adminPassword`(평문) → `passwordEncoder.encode(adminPassword)` → `adminPasswordHash` |
| 2 | `OnboardingApprovalServiceImpl.createAdminAccountDirectly` | `adminPasswordHash`를 그대로 INSERT `users.password` |
| 인코딩 횟수 | | **1회** (BCrypt) |
| 비고 | | core 모듈이 주입받는 `PasswordEncoder`는 consultation `PasswordPolicyConfig`의 동일 빈 |

- 로그인: 동일 빈으로 `matches(입력비밀번호, DB password)` → 정상 동작.

---

### 2.2 관리자 비밀번호 초기화

| 단계 | 위치 | 동작 |
|------|------|------|
| 1 | `AdminUserController` | `AdminPasswordResetRequest.getNewPassword()` |
| 2 | `UserServiceImpl.changePassword(userId, newPassword)` | `passwordEncoder.encode(newPassword)` → `hashedPassword` |
| 3 | 동일 메서드 | `u.setPassword(hashedPassword)`, `userRepository.saveAll(allUsers)` |
| 인코딩 횟수 | | **1회** (BCrypt) |
| 비고 | | `saveAll`은 `UserServiceImpl.saveAll`이 아니라 `UserRepository.saveAll` 호출. saveAll 내부는 신규(id==null)일 때만 isPasswordEncoded 체크하며, 여기선 이미 해시된 값이 설정되어 있음. |

- 로그인: 동일 `PasswordEncoder`로 검증 → 정상.

---

### 2.3 내담자/상담사 등록

| 경로 | 저장 시 인코딩 | 비고 |
|------|----------------|------|
| **AdminServiceImpl** (registerClient / consultant 등록) | `passwordEncoder.encode(password)` 1회 후 `userRepository.save(entity)` | Service에서 1회 인코딩, Repository 직접 저장. **이중 인코딩 없음.** |
| **AuthController 회원가입** | `user.setPassword(request.getPassword())`(평문) → `userService.registerUser(user)` → `save(user)` | `UserServiceImpl.save()`에서 `id==null`이고 `!isPasswordEncoded(plain)`이면 `passwordEncoder.encode(user.getPassword())` 1회 적용. **1회만 인코딩.** |

- 로그인: 동일 `PasswordEncoder`로 검증 → 정상.

---

## 3. 로그인 검증 흐름

- `AuthController.login` → `authService.authenticateWithSession(email, password, ...)`  
  → `authenticationManager.authenticate(UsernamePasswordAuthenticationToken(email, password))`  
  → Spring Security `DaoAuthenticationProvider`: `UserDetailsService.loadUserByUsername(email)`로 DB 비밀번호 조회, **주입된 `PasswordEncoder`로 `matches(요청 비밀번호, DB password)`** 수행.
- `PasswordEncoder` 빈: **consultation `PasswordPolicyConfig.passwordEncoder()`** (BCrypt, strength 12) 단일 빈.
- core 모듈(OnboardingServiceImpl 등)도 동일 애플리케이션 컨텍스트에서 해당 빈을 주입받음 → **모든 경로가 동일 BCrypt로 저장·검증**.

---

## 4. `isPasswordEncoded()` 연산자 우선순위 버그

**파일**: `src/main/java/com/coresolution/consultation/service/impl/UserServiceImpl.java`  
**메서드**: `isPasswordEncoded(String password)` (약 1059–1066라인)

**현재 코드**:

```java
return password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$")
       && password.length() == 60;
```

**의도**: BCrypt 해시만 허용 (`$2a$`/`$2b$`/`$2y$`이고 길이 60).

**실제 동작**: `&&`가 `||`보다 우선순위가 높아 다음처럼 해석됨.

- `password.startsWith("$2a$")` **또는**
- `password.startsWith("$2b$")` **또는**
- `(password.startsWith("$2y$") && password.length() == 60)`

따라서 **`$2a$`, `$2b$`인 경우 `length() == 60` 검사가 수행되지 않음.**

**위험**:

- `"$2a$"`처럼 길이 4인 문자열이 “이미 인코딩됨”으로 판단되어 그대로 DB에 저장될 수 있음.
- 로그인 시 `matches(입력, "$2a$")`는 실패 → 해당 계정은 로그인 불가.

**수정 제안**: 접두어 조건과 길이 조건을 하나의 논리식으로 묶기.

```java
return (password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$"))
       && password.length() == 60;
```

---

## 5. 수정 제안 목록

| # | 파일 | 메서드/위치 | 변경 내용 |
|---|------|-------------|-----------|
| 1 | `src/main/java/com/coresolution/consultation/service/impl/UserServiceImpl.java` | `isPasswordEncoded(String password)` (1059–1066라인 부근) | 반환식을 `(password.startsWith("$2a$") \|\| password.startsWith("$2b$") \|\| password.startsWith("$2y$")) && password.length() == 60` 로 변경하여, 모든 BCrypt 접두어에 대해 길이 60 검사 적용. |

---

## 6. 이중 인코딩·빈 불일치 정리

- **이중 인코딩**: 없음. 온보딩/관리자 초기화/내담자·상담사 등록/회원가입 모두 1회만 `passwordEncoder.encode()` 적용.
- **PasswordEncoder 빈**: consultation `PasswordPolicyConfig`의 BCrypt 단일 빈 사용. core는 별도 빈 정의 없이 동일 빈 주입.

---

## 7. 체크리스트 (수정 후 확인)

- [ ] `UserServiceImpl.isPasswordEncoded()`에 `"$2a$"`, `"$2b$"` (길이 4) 입력 시 `false` 반환하는지 단위 테스트 또는 수동 확인.
- [ ] `"$2a$10$...` 형태의 정상 BCrypt 60자 입력 시 `true` 반환하는지 확인.
- [ ] 회원가입(AuthController) → 로그인 정상 동작 확인.
- [ ] 관리자 비밀번호 초기화 후 해당 계정으로 로그인 확인.
- [ ] 온보딩 관리자 계정 로그인 확인.

---

## 8. core-coder용 태스크 설명 (선택)

- **작업**: `UserServiceImpl.isPasswordEncoded()` 연산자 우선순위 버그 수정.
- **조건**: BCrypt 해시 판별 시 `$2a$`/`$2b$`/`$2y$` 접두어 **및** `password.length() == 60`을 모두 만족할 때만 `true` 반환하도록 수정.
- **파일**: `src/main/java/com/coresolution/consultation/service/impl/UserServiceImpl.java`, `isPasswordEncoded` 메서드.
- **검증**: 위 체크리스트 1–2항 확인.
