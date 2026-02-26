# 비밀번호 초기화·내담자 등록 후 로그인 실패 원인 분석

**작성일**: 2025-02-26  
**역할**: core-debugger (분석·수정 제안만, 코드 수정은 core-coder 위임)

---

## 1. 증상 요약

| 현상 | 설명 |
|------|------|
| 1 | 관리자가 사용자 비밀번호 초기화(reset-password) 후, 해당 사용자가 새 비밀번호로 로그인하면 "비밀번호가 틀립니다"로 실패 |
| 2 | 내담자 등록 시 비밀번호를 입력해도, 해당 내담자로 로그인하면 "비밀번호가 틀립니다"로 실패 |

---

## 2. 데이터 흐름 추적

### 2.1 관리자 비밀번호 초기화

- **프론트**: `ConsultantComprehensiveManagement.js` / `ClientComprehensiveManagement.js`  
  - `handlePasswordResetConfirm(newPassword)`  
  - `endpoint = /api/v1/admin/user-management/${id}/reset-password?newPassword=${encodeURIComponent(newPassword)}`  
  - `StandardizedApi.put(endpoint, {})` → **비밀번호가 쿼리 파라미터로만 전달되고, body는 빈 객체 `{}`**
- **백엔드**: `AdminUserController.java`  
  - `PUT /{userId}/reset-password`  
  - `@RequestParam String newPassword` → 서블릿이 쿼리 스트링을 디코딩한 값 수신
- **백엔드**: `UserServiceImpl.changePassword(Long userId, String newPassword)`  
  - `passwordEncoder.encode(newPassword)` 후 동일 이메일의 모든 테넌트 User에 동일 해시 저장

### 2.2 내담자 등록

- **프론트**: `ClientComprehensiveManagement.js`  
  - `payload = { ..., password: data.password ?? '' }` (create 시만)  
  - `apiPost('/api/v1/admin/clients', payload)` → JSON body로 전송
- **백엔드**: `AdminController.registerClient(@RequestBody ClientRegistrationRequest request)`  
  - `AdminServiceImpl.registerClient(request)`  
  - `password = request.getPassword().trim()` 후 `passwordEncoder.encode(password)` 로 User 생성

### 2.3 로그인 검증

- **Spring Security**: `CustomUserDetailsService.loadUserByUsername(email)`  
  - `userService.findByEmail(email)` → (테넌트 없으면) `userRepository.findAllByEmail(email)` 의 첫 번째 결과
  - 반환 `UserDetails` 의 `password` = DB 의 해시
- **인증**: `DaoAuthenticationProvider` 가 `passwordEncoder.matches(입력 비밀번호, DB 해시)` 로 비교
- **PasswordEncoder**: `PasswordPolicyConfig` 에서 단일 `BCryptPasswordEncoder` 빈 사용 (저장·로그인 동일)

---

## 3. 가능한 원인 (우선순위)

### 원인 1: 비밀번호 초기화 시 쿼리 파라미터 디코딩으로 값 변형 (가능성 높음)

- **내용**: `newPassword` 가 **쿼리 스트링**으로만 전달됨.  
  - 서블릿/Spring 은 `application/x-www-form-urlencoded` 규칙에 따라 쿼리 파라미터를 디코딩할 때 **`+` 를 공백으로** 해석함.  
  - 프론트에서 `encodeURIComponent(newPassword)` 를 쓰면 `+` → `%2B` 로 인코딩되므로, 단일 디코딩 시에는 `+` 가 보존됨.  
  - 다만 프록시·리버스 프록시·일부 클라이언트에서 한 번 더 디코딩하거나, 인코딩이 빠진 경로가 있으면 `+` 가 공백으로 바뀌어 **저장되는 비밀번호와 로그인 시 입력 비밀번호가 달라질 수 있음.**
- **확인 방법**:  
  - 비밀번호에 `+`, `&`, `=`, 공백 등 특수문자를 넣고 초기화 → 로그인 시 동일 문자열로 시도.  
  - 백엔드에 `log.info("newPassword 수신값: [{}], length={}", newPassword, newPassword != null ? newPassword.length() : 0);` 추가 후, 프론트에서 입력한 값과 비교.
- **결론**: **비밀번호는 쿼리 파라미터가 아니라 요청 body(JSON)로 보내는 것이 안전함.**

### 원인 2: 내담자 등록 시 password 미전달 또는 빈 값으로 처리 (가능성 중간)

- **내용**:  
  - create 시 `payload.password = data.password ?? ''` 로 설정하고 `apiPost(..., payload)` 호출.  
  - `ClientModal` 은 `formData.password` 를 그대로 `onSave(formData)` 로 넘기므로, 폼에서 비밀번호를 비우면 `''` 가 전달됨.  
  - 백엔드 `registerClient` 는 `request.getPassword() != null && !request.getPassword().trim().isEmpty()` 일 때만 사용자 입력 비밀번호를 쓰고, 그렇지 않으면 **임시 비밀번호**를 생성함.  
  - 따라서 **비밀번호 필드가 폼에서 비어 있거나, 키 이름이 다르거나, 직렬화 과정에서 빠지면** 임시 비밀번호가 저장되고, 사용자가 입력한 비밀번호로는 로그인할 수 없음.
- **확인 방법**:  
  - 내담자 등록 시 Network 탭에서 `POST /api/v1/admin/clients` 요청 body 에 `password` 필드가 실제로 들어가는지 확인.  
  - 백엔드에 `log.info("registerClient password present: {}, length: {}", request.getPassword() != null, request.getPassword() != null ? request.getPassword().length() : 0);` 추가하여 수신 값 확인.
- **결론**: 프론트에서 create 시 반드시 `password` 를 payload 에 포함하고, 백엔드에서 null/빈 문자열이면 임시 비밀번호를 쓰는 현재 로직과 일치하는지 확인 필요.

### 원인 3: 로그인 시 사용자 조회와 저장 시 사용자 불일치 (가능성 낮음)

- **내용**:  
  - 로그인 시 `TenantContext` 가 없으면 `findByEmail(email)` → `findAllByEmail(email)` 의 **첫 번째** 행을 사용.  
  - 같은 이메일로 여러 테넌트에 User 가 있으면, “저장한 User”와 “로그인 시 선택된 User”가 다를 수 있음.  
  - 다만 `changePassword` 는 해당 이메일의 **모든** User 의 비밀번호를 동일 해시로 갱신하므로, 멀티 테넌트 사용자라도 해시는 맞음.  
  - 내담자 등록은 한 테넌트에 한 명만 생성하므로, 동일 이메일이 여러 테넌트에 없는 한 이 불일치는 드묾.
- **확인 방법**:  
  - 동일 이메일로 여러 테넌트에 User 가 있는지 DB 에서 확인.  
  - 로그인 실패 시점 로그에서 `loadUserByUsername` / `findByEmail` 으로 조회된 `userId` / `tenantId` 가, 비밀번호를 설정한 그 User 와 같은지 확인.
- **결론**: 일반적인 단일 테넌트 내담자/상담사 시나리오에서는 우선순위 낮음. 다만 “비밀번호가 틀립니다”가 나오는 것은 **사용자는 찾았지만 matches 실패**라는 의미이므로, **저장된 해시와 입력 비밀번호가 다르다**는 점과 연결됨.

### 원인 4: 이메일 암호화와 로그인 조회 (참고)

- **내용**: `AdminServiceImpl.registerClient` 는 이메일을 `encryptionUtil.safeEncrypt(email)` 로 암호화해 User 엔티티에 저장함.  
  - 로그인은 **평문 이메일**로 `findByEmail(email)` / `findAllByEmail(email)` 를 호출함.  
  - DB 의 `email` 컬럼이 암호화되어 있으면, 평문 이메일로는 조회가 되지 않고 **“사용자를 찾을 수 없습니다”** 계열 메시지가 나와야 함.  
  - 현재 증상이 **“비밀번호가 틀립니다”**이므로, **해당 요청에서는 사용자 조회는 성공한 것으로 보는 것이 맞음.**  
  - 즉, 실제 운영 환경에서는 이메일이 평문으로 저장되었거나, 로그인 전에 이메일을 암호화해 조회하는 별도 경로가 있을 수 있음.  
- **결론**: 이번 두 가지 증상의 직접 원인으로 보기는 어렵지만, 향후 “사용자를 찾을 수 없습니다”가 나오면 이메일 암호화/조회 방식 점검 대상.

---

## 4. 수정 제안

### 4.1 관리자 비밀번호 초기화: newPassword 를 body 로 전달 (권장)

**목적**: 쿼리 파라미터 디코딩(`+` → 공백 등)으로 인한 비밀번호 변형 제거.

| 구분 | 파일 | 수정 방향 |
|------|------|-----------|
| **백엔드** | `AdminUserController.java` | `PUT /{userId}/reset-password` 에서 `@RequestParam String newPassword` 제거. `@RequestBody` DTO(예: `{ "newPassword": "..." }`) 또는 `Map<String, String>` 로 `newPassword` 수신. 기존 비밀번호 정책 검증 및 `userService.changePassword(userId, newPassword)` 호출 유지. |
| **프론트** | `ConsultantComprehensiveManagement.js` | `handlePasswordResetConfirm` 에서 endpoint 를 **쿼리 없이** ` /api/v1/admin/user-management/${id}/reset-password` 로 하고, `StandardizedApi.put(endpoint, { newPassword })` 처럼 **body 에만** `newPassword` 전달. |
| **프론트** | `ClientComprehensiveManagement.js` | 위와 동일하게 endpoint 에서 `?newPassword=...` 제거하고, `StandardizedApi.put(endpoint, { newPassword })` 로 body 로만 전달. |

- DTO 사용 시 예시: `ResetPasswordRequest` 같은 DTO 에 `@NotBlank String newPassword` 필드 하나 두고, Controller 에서 `@RequestBody ResetPasswordRequest request` 로 받으면 됨.

### 4.2 내담자 등록: password 전달 및 백엔드 로깅 확인

| 구분 | 파일 | 수정 방향 |
|------|------|-----------|
| **프론트** | `ClientComprehensiveManagement.js` | create 시 `payload.password = data.password ?? ''` 가 항상 설정되는지 확인. 비밀번호 필드가 비어 있으면 사용자에게 “비밀번호를 입력하세요” 검증을 넣어, 빈 값으로 등록되지 않게 할 수 있음 (선택). |
| **백엔드** | `AdminServiceImpl.java` (registerClient) | (선택) `request.getPassword()` 수신 여부 디버깅용 로그 추가. 예: `log.debug("registerClient password received: {}", request.getPassword() != null && !request.getPassword().isEmpty());` (실제 값은 로그에 넣지 말 것). |
| **백엔드** | `ClientRegistrationRequest` | 이미 `password` 필드 존재. JSON 키가 `password` 인지와 직렬화 시 누락이 없는지 확인 (프론트 payload 키와 일치). |

- 내담자 등록 후 로그인 실패가 계속되면, **원인 2** 확인을 위해 Network 탭에서 `POST /api/v1/admin/clients` body 에 `password` 포함 여부와 백엔드 로그를 반드시 확인하는 것이 좋음.

### 4.3 (선택) 비밀번호 초기화 API 요청 body DTO

- 새 DTO 예: `AdminPasswordResetRequest`  
  - 필드: `private String newPassword;`  
  - Controller: `@RequestBody AdminPasswordResetRequest request` → `request.getNewPassword()` 로 검증 및 `changePassword` 호출.  
- 이렇게 하면 향후 확장(예: 강제 변경 플래그)도 쉽고, 쿼리 파라미터 인코딩 이슈를 완전히 제거할 수 있음.

---

## 5. 수정 후 검증용 체크리스트

- [ ] **관리자 비밀번호 초기화**  
  - [ ] 상담사/내담자 중 한 명 선택 후, 새 비밀번호 설정(특수문자 포함, 예: `Test+Pass1!`) → 초기화 API 성공 응답 확인.  
  - [ ] 해당 사용자로 로그인 화면에서 **동일한 비밀번호**로 로그인 시도 → 성공.  
  - [ ] (선택) 초기화 API 로그에서 수신 `newPassword` 길이/마스킹 로그가 기대와 일치하는지 확인.

- [ ] **내담자 등록**  
  - [ ] 내담자 등록 시 비밀번호 필드에 값 입력(예: `ClientPass1!`) 후 저장.  
  - [ ] Network 탭에서 `POST /api/v1/admin/clients` 요청 body 에 `password` 필드가 포함되어 있는지 확인.  
  - [ ] 등록 직후 해당 이메일·위에서 입력한 비밀번호로 로그인 → 성공.  
  - [ ] (선택) 백엔드 로그에서 “사용자 입력 비밀번호 사용” 등 기대 메시지 출력 여부 확인.

- [ ] **기존 동작 회귀**  
  - [ ] 임시 비밀번호 자동 생성 경로: 비밀번호 없이 내담자 등록 → 해당 계정으로는 “임시 비밀번호로는 로그인할 수 없습니다” 등 기대 메시지 확인.  
  - [ ] 비밀번호 정책 검증: 초기화 시 짧은/약한 비밀번호로 API 호출 → 400 및 정책 오류 메시지 확인.

---

## 6. core-coder 에게 전달할 때 (선택)

다음과 같이 요청하면 구현이 명확해집니다.

- “관리자 비밀번호 초기화 시 **newPassword 를 쿼리 파라미터가 아니라 request body(JSON)로만** 받도록 변경해 주세요.  
  - 백엔드: `AdminUserController` 의 `PUT /{userId}/reset-password` 에서 `@RequestParam` 제거하고, `@RequestBody` DTO 또는 Map 으로 `newPassword` 를 받도록 수정.  
  - 프론트: `ConsultantComprehensiveManagement.js`, `ClientComprehensiveManagement.js` 의 `handlePasswordResetConfirm` 에서 URL 에 쿼리 붙이지 말고, `StandardizedApi.put(endpoint, { newPassword })` 로 body 에만 넣어 주세요.  
  - 문서 `docs/debug/PASSWORD_RESET_AND_CLIENT_LOGIN_ANALYSIS.md` 의 수정 제안·체크리스트대로 적용 후 위 체크리스트로 검증해 주세요.”

---

*이 문서는 디버깅 분석 결과이며, 실제 코드 수정은 core-coder 서브에이전트에 위임합니다.*
