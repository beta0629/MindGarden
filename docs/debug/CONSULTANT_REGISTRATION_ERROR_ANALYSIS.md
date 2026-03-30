# 상담사 등록 오류 분석 (코드 기반)

**작성일**: 2025-03-16  
**분석 범위**: 프론트엔드(ConsultantComprehensiveManagement.js) · 백엔드(AdminController, ConsultantRegistrationRequest, AdminServiceImpl)  
**참조 스킬**: core-solution-debug  
**코드 수정**: 없음 — 원인·수정 제안만 정리, 적용은 core-coder 위임

---

## 1. 증상 및 추적 경로

- **증상**: 상담사 등록 시 오류 발생 (SSH 로그 미확인으로 코드만으로 가능한 원인 정리).
- **추적 경로**  
  - **프론트**: 등록 버튼 클릭 → `handleModalSubmit` → `createConsultant(formData)` → `apiPost('/api/v1/admin/consultants', requestData, options)`  
  - **백엔드**: `AdminController.registerConsultant()` (POST `/api/v1/admin/consultants`) → `SessionUtils.getTenantId(session)` · 권한 체크 → `adminService.registerConsultant(request)` → `AdminServiceImpl.registerConsultant()` (이메일/tenantId 검증, User/Consultant 저장).

---

## 2. 프론트엔드 분석

### 2.1 formData → requestData 변환

- **위치**: `ConsultantComprehensiveManagement.js` `createConsultant` (대략 467–469, 478–486라인).
- **로직 요약**  
  - `requestData = { ...data, userId, profileImageUrl: data.profileImageUrl || undefined }`  
  - `userId`: `data.userId`가 없거나 2자 미만이면 `data.name.trim().toLowerCase().replace(/\s+/g, '')`로 생성.  
  - `specialization`: `data.specialty`가 배열이고 길이 > 0이면 `data.specialty.join(',')`, 아니면 `data.specialization` 그대로.
- **전송 payload**: `requestData`에 `name`, `email`, `password`, `phone`, `status`, `specialty`(배열), `specialization`(문자열), `profileImageUrl`, `rrnFirst6`, `rrnLast1`, `address`, `addressDetail`, `postalCode`, `qualifications`, `workHistory` 등이 포함됨. (`...data` 때문에 `specialty` 배열도 그대로 포함.)

### 2.2 필드명 매핑 (프론트 → 백엔드 DTO)

| 프론트 formData/requestData | 백엔드 ConsultantRegistrationRequest | 비고 |
|-----------------------------|--------------------------------------|------|
| `name` | `name` | 일치 |
| `email` | `email` | 일치. DTO `@NotBlank` `@Email` (단, Controller에 `@Valid` 없음 → 아래 참고) |
| `password` | `password` | 일치 |
| `phone` | `phone` | 일치 |
| `specialty` (배열) | — | DTO에는 없음. 무시됨 |
| `specialization` (문자열) | `specialization` | 프론트에서 `specialty.join(',')`로 설정 → 일치 |
| `qualifications` | `qualifications` | 일치. Service에서 `certification`으로 매핑 |
| `workHistory` | `workHistory` | 일치 |
| `profileImageUrl` | `profileImageUrl` | 일치 |
| `address`, `addressDetail`, `postalCode` | 동일 필드명 | 일치 |
| `rrnFirst6`, `rrnLast1` | 동일 필드명 | 일치 |
| `status` | — | DTO에 없음. 백엔드에서 무시 (오류 원인 아님) |

**결론**: `specialty` → `specialization` 변환은 정상이며, DTO 필드명과의 불일치는 없음.

### 2.3 MgEmailFieldWithAutocomplete와 email 바인딩

- **위치**: `ConsultantComprehensiveManagement.js` 1018–1028라인.  
  - `value={formData.email || ''}`, `onChange={handleFormChange}`, `name="email"`.
- **MgEmailFieldWithAutocomplete.js**  
  - 일반 입력: `<input name={name} ... onChange={handleInputChange} />` → `onChange(e)` 그대로 전달 → `handleFormChange`에서 `e.target.name`, `e.target.value`로 `setFormData` 갱신.  
  - 자동완성 선택: `selectSuggestion(fullEmail)`에서 `onChange({ target: { name, value: fullEmail } })` 호출 → 동일하게 `formData.email` 갱신.
- **결론**: 정상 사용 시 `email`은 `formData`에 반영되고, `createConsultant(formData)` 시 `requestData`에 포함됨.  
- **가능한 리스크**: 특수한 상황(예: 제출 직전에만 값을 넣는 서드파티/스크립트 등)에서 `formData`와 실제 input 값 불일치가 있으면, 이메일 빈값이 전달될 수 있음.

### 2.4 필수 필드 포함 여부

- **이름**: `createConsultant` 내부에서 `!data.name || !data.name.trim()`이면 알림 후 `return { success: false }` — API 호출 전에 차단.  
- **이메일**: HTML `required`만 있고, `createConsultant` 안에서는 빈값 검사 없음. 빈 문자열이 그대로 전달되면 백엔드에서 오류 유발.  
- **비밀번호**: 선택. 백엔드에서 없으면 임시 비밀번호 생성.  
- **전화번호·주소 등**: 선택.  
- **결론**: 프론트에서 **이메일 빈값에 대한 명시적 검증이 없음** — 4xx/5xx 가능 원인 1.

---

## 3. 백엔드 분석

### 3.1 AdminController — POST `/api/v1/admin/consultants`

- **위치**: `AdminController.java` 1583–1623라인.  
- **시그니처**: `@PostMapping("/consultants")`, `@RequestBody ConsultantRegistrationRequest request` (HttpSession 사용).  
- **주의**: `@Valid` 없음 → **Bean Validation 미적용**. `@NotBlank`, `@Email`이 컨트롤러 레벨에서 실행되지 않음.  
- **흐름**:  
  1. 권한: `PermissionCheckUtils.checkPermission(session, "CONSULTANT_MANAGE", ...)`  
  2. 로그인: `SessionUtils.getCurrentUser(session)` null이면 `AccessDeniedException`  
  3. **tenantId**: `SessionUtils.getTenantId(session)`이 null/empty면 `IllegalArgumentException` (테넌트 정보 없음)  
  4. `TenantContextHolder.setTenantId(tenantId)`  
  5. `adminService.registerConsultant(request)` 호출  

### 3.2 ConsultantRegistrationRequest

- **위치**: `dto/ConsultantRegistrationRequest.java`  
- **필드 요약**:  
  - `email`: `@NotBlank(message = "이메일은 필수입니다.")`, `@Email(message = "올바른 이메일 형식이 아닙니다.")` — **Controller에 `@Valid` 없어서 미적용**.  
  - `userId`, `password`, `name`, `phone`, `address`, `addressDetail`, `postalCode`, `rrnFirst6`, `rrnLast1`, `role`, `specialization`, `qualifications`, `workHistory`, `notes`, `profileImageUrl`, `branchCode`(deprecated).  
- **실제 검증**: Service 레이어에서만 이메일 null/empty 체크.

### 3.3 AdminServiceImpl.registerConsultant()

- **위치**: `AdminServiceImpl.java` 115–316라인.  
- **예외 가능 지점**  
  1. **이메일**: `request.getEmail()`이 null 또는 trim 후 빈 문자열 → `IllegalArgumentException("이메일은 필수입니다.")` → GlobalExceptionHandler에서 **400**  
  2. **tenantId**: `getTenantIdOrNull()`이 null → `IllegalStateException("테넌트 정보가 없습니다. 관리자에게 문의하세요.")` → **401 또는 4xx** (메시지에 따라)  
  3. **userId 생성**: `userIdGenerator.generateUniqueUserId(email, tenantId)` 내부 예외 → **500 가능**  
  4. **저장**: `userRepository.save(consultant)` — DB 제약 위반 시  
     - `UK_users_email_tenant` (동일 tenant 내 동일 email)  
     - `UK_users_user_id` (user_id 중복)  
     → DataIntegrityViolationException 등 → **500** (별도 핸들링 없으면)  
  5. **암호화/캐시**: `encryptionUtil.safeEncrypt`, `userPersonalDataCacheService.decryptAndCacheUserPersonalData` 등에서 예외 시 로그 후 계속 진행 또는 **500** 가능성  

- **필드 매핑**:  
  - `request.getSpecialization()` → Consultant 엔티티 `setSpecialty()`  
  - `request.getQualifications()` → Consultant `setCertification()`  
  - 이름: null/empty면 이메일 로컬 파트로 자동 생성.

---

## 4. 가능한 오류 원인 정리

| 구분 | 가능한 원인 | 유발 가능 상태 코드 | 확인 방법 |
|------|-------------|----------------------|-----------|
| **1** | **이메일 빈값/미포함** | 400 | 프론트: 제출 직전 `formData.email`·실제 payload 로그. 백엔드: Service 진입 시 `request.getEmail()` 로그. |
| **2** | **Bean Validation 미적용** | — | 이메일 형식 오류가 Controller에서 걸리지 않고 Service까지 전달될 수 있음. 형식 오류 시 다운스트림(이메일 발송 등)에서 예외 가능. |
| **3** | **tenantId 없음(세션)** | 400/401 | 세션 만료, 비로그인, 또는 세션에 tenantId 미저장. Controller/Service 로그에서 "tenantId가 필수", "테넌트 정보가 없습니다" 확인. |
| **4** | **권한/로그인** | 403/401 | CONSULTANT_MANAGE 권한 없음 또는 `getCurrentUser(session)` null. |
| **5** | **이메일 중복(같은 tenant)** | 500 | DB unique `UK_users_email_tenant` 위반. 프론트는 중복 확인 버튼만 제공하고 제출 차단은 안 함. |
| **6** | **userId 생성 실패** | 500 | `userIdGenerator.generateUniqueUserId` 예외. 로그 확인. |
| **7** | **기타 DB/저장 예외** | 500 | 제약조건·트랜잭션·암호화 등. 스택트레이스·DB 에러 메시지 확인. |

---

## 5. 재현 절차 (참고)

1. 관리자 로그인 후 상담사 관리 화면 이동  
2. "새 상담사 등록" 클릭  
3. (오류 유형별)  
   - **이메일 빈값**: 이름만 입력하고 이메일 비운 채 등록 시도  
   - **tenantId/세션**: 세션 만료 후 또는 tenantId가 세션에 없는 상태에서 등록 시도  
   - **이메일 중복**: 이미 존재하는 이메일로 등록(중복 확인 없이) 시도  

---

## 6. 수정 제안 (core-coder 적용용)

- **6.1 프론트 — 이메일 필수 검증**  
  - **파일**: `frontend/src/components/admin/ConsultantComprehensiveManagement.js`  
  - **위치**: `createConsultant` 내부, 이름 검증 직후(대략 466라인 근처)  
  - **내용**: `data.email`이 없거나 trim 후 빈 문자열이면 알림 후 `return { success: false }` 추가.  
  - **이유**: 백엔드 400을 줄이고, 사용자에게 즉시 안내.

- **6.2 백엔드 — Controller Bean Validation 적용**  
  - **파일**: `src/main/java/com/coresolution/consultation/controller/AdminController.java`  
  - **위치**: `registerConsultant` 메서드의 `@RequestBody` 파라미터  
  - **내용**: `@RequestBody @Valid ConsultantRegistrationRequest request` 로 변경.  
  - **이유**: 이메일 필수·형식 검증을 컨트롤러에서 수행해 400 + 메시지로 일관 처리.

- **6.3 (선택) 이메일 중복 시 400 처리**  
  - **파일**: `AdminServiceImpl` 또는 전역 예외 처리  
  - **내용**: `userRepository.save`에서 DataIntegrityViolationException(UK_users_email_tenant) 발생 시, "이미 등록된 이메일입니다" 등 메시지로 400 응답으로 변환.  
  - **이유**: 500 대신 400으로 명확한 안내.

- **6.4 (선택) 프론트 — 등록 제출 전 이메일 중복 확인 강제**  
  - **파일**: `ConsultantComprehensiveManagement.js`  
  - **내용**: `modalType === 'create'`일 때, `emailCheckStatus === 'available'`이 아니면 등록 버튼 비활성화 또는 제출 시 "이메일 중복 확인을 해주세요" 안내.  
  - **이유**: 중복 이메일로 인한 500 방지.

---

## 7. 체크리스트 (수정 후 확인)

- [ ] 상담사 등록 시 이메일 빈값이면 프론트에서 알림 후 API 미호출  
- [ ] 이메일 형식 오류 시 Controller에서 400 + "올바른 이메일 형식이 아닙니다." 반환  
- [ ] tenantId 없을 때 응답 메시지로 "테넌트 정보가 없습니다" 등 확인 가능  
- [ ] 동일 tenant 내 동일 이메일로 등록 시 400 또는 명시적 중복 메시지 (500 아님)  
- [ ] 정상 케이스: 이름·이메일 입력 후 등록 시 201 및 상담사 목록 반영  

---

## 8. 참조

- `docs/standards/ERROR_HANDLING_STANDARD.md`  
- `docs/standards/API_CALL_STANDARD.md`, `API_INTEGRATION_STANDARD.md`  
- `frontend/src/utils/ajax.js` (apiPost), `frontend/src/utils/csrfTokenManager.js` (post → JSON body, Content-Type: application/json)  
- `src/main/java/com/coresolution/consultation/exception/GlobalExceptionHandler.java` (IllegalArgumentException → 400, IllegalStateException 처리)
