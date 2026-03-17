# 내담자 정보 수정 — 상태 값 미반영 원인 분석

## 1. 증상

- **현상**: "내담자 정보 수정" 모달에서 내담자 **상태**(ACTIVE / INACTIVE / PENDING 등)를 변경하고 저장해도, 저장 후 목록·상세에서 **상태 값이 변경되지 않음**.
- **재현**: 내담자 종합관리 → 내담자 선택 → "내담자 정보 수정" → 상태를 "비활성" 등으로 변경 후 저장 → 목록/재진입 시 여전히 "활성"으로 보이거나, 비활성으로 바꾼 경우 목록에서 **사라질 수 있음**.

---

## 2. 원인 분석

### 2.1 프론트엔드 (전송 측)

| 확인 항목 | 결과 |
|----------|------|
| **ClientModal.js** | 상태 필드는 `BadgeSelect`로 `formData.status` 사용. `onChange` 시 `setFormData(prev => ({ ...prev, status: val }))` 호출. 폼 기본값 `status: formData.status \|\| 'ACTIVE'`. |
| **ClientComprehensiveManagement.js** | `handleEditClient` 시 `setFormData`에 `status: client.status \|\| 'ACTIVE'` 설정. **handleSave** 시 `payload`에 **`status: data.status`** 포함 후 `apiPut(\`/api/v1/admin/clients/${editingClient.id}\`, payload)` 호출. |

**결론**: 프론트는 **payload에 `status`를 포함해 전송**하고 있음. 원인은 프론트가 아님.

---

### 2.2 백엔드 — DTO에 status 없음

| 파일 | 내용 |
|------|------|
| **ClientRegistrationRequest.java** | `name`, `email`, `phone`, `grade`, `notes`, `profileImageUrl`, `rrnFirst6`, `rrnLast1`, `address`, `addressDetail`, `postalCode` 등만 존재. **`status` 필드 없음.** |

프론트에서 보낸 `status`는 DTO에 바인딩되지 않아 **무시**됨.

---

### 2.3 백엔드 — updateClient에서 status 미반영

| 파일 | 내용 |
|------|------|
| **AdminServiceImpl.updateClient(Long id, ClientRegistrationRequest request)** | `request`에서 `name`, `email`, `phone`, `profileImageUrl`, `notes`, `grade`, 주민번호, 주소만 읽어 `User` 엔티티에 반영. **`request.getStatus()` 호출 및 `User`에 반영하는 로직 없음.** |
| **User 엔티티** | 활성 여부는 **`isActive` (Boolean)** 로만 존재. 문자열 `status`(ACTIVE/INACTIVE 등) 필드는 없음. |

따라서 DTO에 status를 추가하더라도, **updateClient에서 `status` → `User.isActive` 매핑이 없으면 DB에 반영되지 않음**.

---

### 2.4 목록 API — 비활성 제외 + status 하드코딩

| 파일 | 내용 |
|------|------|
| **ClientStatsServiceImpl.getAllClientsWithStatsByTenant** | 내담자 조회에 **`userRepository.findByRoleAndIsActiveTrue(tenantId, UserRole.CLIENT)`** 사용. **`isActive == true`인 사용자만 목록에 포함**됨. |
| **ClientStatsServiceImpl.convertClientToMap** | 반환 맵에 **`status`를 `"ACTIVE"`, `isActive`를 `true`로 하드코딩**하여 넣음. DB의 `User.isActive` 값을 사용하지 않음. |

결과:

1. **비활성(isActive=false) 내담자는 목록 API 결과에서 아예 제외**됨.
2. 목록에 나오는 내담자는 항상 **status "ACTIVE", isActive true**로만 노출됨.

즉, “상태 변경이 안 보인다”는 현상은  
- (a) **저장 자체가 안 됨**(DTO/updateClient 미반영)  
- (b) **저장되더라도 목록이 비활성자를 제외**하고  
- (c) **목록 응답이 항상 ACTIVE로 고정**되어 있기 때문에 발생함.

---

## 3. 영향

| 구분 | 내용 |
|------|------|
| **기능** | 내담자 상태(활성/비활성 등)를 **변경할 수 없음**. UI에서 바꿔도 DB에 반영되지 않음. |
| **목록** | 현재 목록은 **활성 내담자만** 조회. 추후 백엔드에서 status를 반영하더라도, 목록 조회를 `isActive=true`로만 하면 **비활성으로 바꾼 내담자는 목록에서 사라짐**. |
| **일관성** | 목록/상세의 `status`·`isActive`가 실제 DB와 다를 수 있어, 다른 기능(필터, KPI 등)에 혼란을 줄 수 있음. |

---

## 4. 수정 제안 (core-coder 위임용)

코드 수정은 하지 않고, 적용 시 참고할 수 있도록 제안만 정리함.

### 4.1 ClientRegistrationRequest에 status 추가

- **파일**: `src/main/java/com/coresolution/consultation/dto/ClientRegistrationRequest.java`
- **내용**: `private String status;` 필드 추가 (예: ACTIVE, INACTIVE, PENDING 등 공통코드와 매핑 가능하도록).

### 4.2 updateClient에서 status → User.isActive 반영

- **파일**: `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java`
- **메서드**: `updateClient(Long id, ClientRegistrationRequest request)`
- **내용**:
  - `request.getStatus()`가 null이 아니고 비어 있지 않을 때,
  - `"ACTIVE"`(또는 공통코드 상 활성 코드)이면 `clientUser.setIsActive(true)`, 그 외면 `clientUser.setIsActive(false)` 등으로 매핑하여 저장.
  - (선택) 공통코드와 매핑 규칙을 한곳에 두어 확장 가능하게 처리.

### 4.3 목록 API — status 반영 및 조회 범위

- **파일**: `src/main/java/com/coresolution/consultation/service/impl/ClientStatsServiceImpl.java`
- **내용**:
  1. **조회 범위**:  
     - 옵션 A: 내담자 목록을 **전체 조회**(role=CLIENT 기준, isActive 조건 제거)한 뒤, 프론트 또는 API 레벨에서 상태 필터 적용.  
     - 옵션 B: 쿼리 파라미터로 `isActive`(또는 status) 필터를 받아, 해당 조건으로만 조회.  
     - 기획에 따라 “비활성 내담자도 목록에 보이게 할지” 결정 필요.
  2. **convertClientToMap**:  
     - `User.isActive`(및 필요 시 status 공통코드)를 사용해  
       - `status`: `"ACTIVE"` / `"INACTIVE"` 등 문자열,  
       - `isActive`: `Boolean`  
     - 를 실제 DB 값으로 채워 반환.  
     - 하드코딩 `"ACTIVE"`, `true` 제거.

### 4.4 내담자 등록(create) 시 status 처리

- **파일**: `AdminServiceImpl.registerClient(ClientRegistrationRequest request)` (또는 내담자 등록 담당 메서드)
- **내용**: 등록 시에도 `request.getStatus()`를 위와 동일한 규칙으로 `User.isActive`에 반영하면, 등록·수정 동작이 일치함.

### 4.5 체크리스트 (수정 후 확인)

- [ ] 내담자 정보 수정에서 상태를 "비활성"으로 바꾼 뒤 저장 → DB `users.is_active`가 false로 변경되는지 확인.
- [ ] 목록 API 응답에서 해당 내담자의 `status`/`isActive`가 변경된 값으로 오는지 확인.
- [ ] 목록 조회 범위: 비활성 포함 시 목록에 노출되는지, 필터(활성/비활성)가 있다면 정상 동작하는지 확인.
- [ ] 내담자 등록 시 상태 지정 시 DB에 반영되는지 확인.

---

## 5. 상담사 상태값 변경 필요 사항 (기획 위임)

상담사(consultant) 정보 수정 흐름을 동일한 관점에서 확인한 결과는 다음과 같다.

- **ConsultantRegistrationRequest**: **status 필드 없음.**
- **AdminServiceImpl.updateConsultant(Long id, ConsultantRegistrationRequest request)**: name, email, phone, specialization, profileImageUrl, password, 주소, 자격·경력, grade 등만 반영. **status 또는 isActive를 읽어서 반영하는 로직 없음.**
- 상담사 목록/상세 API에서 status·isActive를 어떻게 채우는지는 별도 확인이 필요하나, 내담자와 유사하게 **하드코딩되거나 isActive 필터만 사용**할 가능성이 있음.

따라서 **상담사에 대해서도 “상태(활성/비활성 등) 변경” 기능이 필요하다면**, 기획에서 요구사항으로 명시한 뒤, 내담자와 동일한 방식으로 진행하는 것이 좋다.

- **기획서에 포함 권장 내용**  
  - 상담사 정보 수정 화면에서 **상태(활성/비활성 등) 변경**을 허용할지 여부.  
  - 허용 시, DTO에 `status` 추가, `updateConsultant`에서 `status` → `User.isActive` 매핑, 상담사 목록/상세 API에서 `status`/`isActive`를 실제 DB 값으로 반환하도록 정리.  
  - 목록에서 비활성 상담사를 제외할지, 포함할지(및 필터 제공 여부).

이 항목은 **기획 확정 후** 개발 범위에 포함하는 것을 권장한다.

---

## 6. 참고 — 코드 위치 요약

| 구분 | 파일 | 참고 위치 |
|------|------|------------|
| 프론트 payload | `frontend/src/components/admin/ClientComprehensiveManagement.js` | `handleSave` 내 `payload.status = data.status`, `apiPut(..., payload)` (약 620–652라인) |
| 프론트 폼 | `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.js` | BadgeSelect `value={safeFormData.status}`, `onChange` → `setFormData(..., status: val)` (약 348–364라인) |
| DTO | `src/main/java/.../dto/ClientRegistrationRequest.java` | status 필드 없음 (전체 필드 목록) |
| updateClient | `src/main/java/.../service/impl/AdminServiceImpl.java` | `updateClient` (약 2140–2226라인), status 미사용 |
| 목록 조회 | `src/main/java/.../service/impl/ClientStatsServiceImpl.java` | `getAllClientsWithStatsByTenant` → `findByRoleAndIsActiveTrue`, `buildClientStatsList` → `convertClientToMap` (status/isActive 하드코딩 252–253라인) |
| User 엔티티 | `src/main/java/.../entity/User.java` | `isActive` (Boolean) 필드 존재 |
| 상담사 DTO | `src/main/java/.../dto/ConsultantRegistrationRequest.java` | status 필드 없음 |
| 상담사 수정 | `src/main/java/.../service/impl/AdminServiceImpl.java` | `updateConsultant` (약 2039–2117라인), status/isActive 미반영 |
