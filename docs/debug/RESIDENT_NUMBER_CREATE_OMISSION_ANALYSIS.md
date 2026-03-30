# 내담자 등록(create) 시 주민번호 미저장 원인 분석

**작성일**: 2025-03-16  
**담당**: core-debugger (분석·문서만 수행, 코드 수정 없음)

---

## 1. 증상 요약

- **증상**: 내담자(client) **등록(create)** 시 주민번호(앞 6자리 + 뒤 1자리)가 저장되지 않음. **수정(edit)** 시에는 저장됨.
- **결과**: 등록은 성공하나 카드에서 성별을 불러오지 못함(뒷자리 1자리 미저장으로 성별 미계산).

---

## 2. 내담자 등록(create) 경로 추적

### 2.1 프론트엔드

- **진입점**: `ClientComprehensiveManagement.js` → `ClientModal` (type=`create`) → 저장 시 `onSave(formData)` 호출.
- **폼 필드**: `ClientModal.js`에서 `rrnFirst6`, `rrnLast1` 입력 필드 존재. `formData`에 `rrnFirst6`, `rrnLast1` 포함되어 상위로 전달됨.
- **payload 구성 위치**: `ClientComprehensiveManagement.js` 내부 `onSave` 콜백 (대략 602~622라인).

**payload 구성 로직 (요약)**:

```javascript
const payload = {
    name: data.name,
    email: data.email,
    phone: data.phone ?? '',
    status: data.status,
    grade: data.grade,
    notes: data.notes ?? ''
};
if (modalType === 'create') {
    payload.password = data.password ?? '';
}
if (data.profileImageUrl && ...) {
    payload.profileImageUrl = data.profileImageUrl;
}
// ★ 여기서 rrn·주소는 'edit'일 때만 추가됨
if (modalType === 'edit') {
    if (data.address != null) payload.address = ...;
    if (data.addressDetail != null) payload.addressDetail = ...;
    if (data.postalCode != null) payload.postalCode = ...;
    if (data.rrnFirst6?.trim()) payload.rrnFirst6 = data.rrnFirst6.trim();
    if (data.rrnLast1?.trim()) payload.rrnLast1 = data.rrnLast1.trim();
}
```

- **결론(프론트)**: **create 시에는 `payload`에 `rrnFirst6`, `rrnLast1`을 넣는 코드가 없음.** `modalType === 'edit'`일 때만 위 필드들이 payload에 포함됨.
- **API 호출**: create 시 `apiPost('/api/v1/admin/clients', payload)` 사용. 필드명은 백엔드 DTO와 일치(`rrnFirst6`, `rrnLast1`)하나, create payload에 포함되지 않아 요청 body에 빠짐.

### 2.2 백엔드

- **엔드포인트**: `AdminController.java` — `POST /api/v1/admin/clients`, `@RequestBody ClientRegistrationRequest request`.
- **DTO**: `ClientRegistrationRequest.java`에 `rrnFirst6`, `rrnLast1` 필드 존재. 매핑 문제 없음.
- **서비스**: `AdminServiceImpl.registerClient(ClientRegistrationRequest request)`에서 다음 호출로 주민번호·주소 반영:
  - `applyRrnAndAddressToUser(clientUser, request.getRrnFirst6(), request.getRrnLast1(), request.getAddress(), request.getAddressDetail(), request.getPostalCode());`
- **저장**: `applyRrnAndAddressToUser` 내부에서 `rrnFirst6`/`rrnLast1`이 있으면 검증 후 암호화·나이/성별 계산해 User 엔티티에 설정하고, `userRepository.save(clientUser)`로 저장.

**결론(백엔드)**: 백엔드는 create 시에도 `ClientRegistrationRequest`의 `rrnFirst6`/`rrnLast1`을 받아 저장하는 로직이 있음. **create에서 주민번호가 안 들어오는 이유는 요청 body에 필드가 없기 때문**이며, 원인은 프론트엔드 payload 구성.

---

## 3. 내담자 수정(edit) 경로와의 차이

- **동일 컴포넌트**: 같은 `ClientModal` + `ClientComprehensiveManagement.js`의 `onSave` 콜백.
- **차이점**: 위 코드에서 `if (modalType === 'edit')` 블록 안에서만 `payload.rrnFirst6`, `payload.rrnLast1`(및 주소)를 설정하고 있음.
- **수정 API**: `apiPut(\`/api/v1/admin/clients/${editingClient.id}\`, payload)` — 이때는 payload에 주민번호가 포함되므로 백엔드에서 정상 저장됨.

즉, **create와 edit이 서로 다른 DTO/API를 쓰는 것이 아니라, 같은 API 스펙을 쓰지만 프론트에서 create용 payload를 만들 때만 주민번호(및 주소) 필드를 빠뜨리고 있음.**

---

## 4. 상담사(consultant) 등록

- **상담사 등록(create)**: `ConsultantComprehensiveManagement.js`의 `createConsultant`에서 `requestData = { ...data, userId, profileImageUrl, ... }` 형태로 **폼 데이터 전체를 스프레드**하여 전송. 폼에 `rrnFirst6`/`rrnLast1`이 있으면 요청 body에 포함됨.
- **결론**: 상담사 등록은 create 시에도 주민번호 필드가 payload에 포함되는 구조라, **내담자와 동일한 “create 시 payload에서만 누락” 이슈는 없음.** (내담자만 payload를 create/edit 분기로 나누어 수동 구성하면서 edit에만 rrn을 넣고 있음.)

---

## 5. 원인 결론

| 구분 | 내용 |
|------|------|
| **근본 원인** | **프론트엔드**: 내담자 **등록(create)** 시 API 요청 body를 만들 때 `rrnFirst6`, `rrnLast1`을 payload에 포함하지 않음. |
| **위치** | `frontend/src/components/admin/ClientComprehensiveManagement.js` — `onSave` 콜백 내 payload 구성부. |
| **상세** | `rrnFirst6`/`rrnLast1`(및 주소 필드)를 `modalType === 'edit'`일 때만 payload에 넣고 있어, `modalType === 'create'`일 때는 서버로 전송되지 않음. |
| **백엔드** | DTO·서비스·엔티티 매핑은 create에서도 주민번호를 받아 저장할 수 있게 되어 있음. 수정 불필요. |

---

## 6. 수정 제안 (core-coder 적용용)

- **수정 파일**: `frontend/src/components/admin/ClientComprehensiveManagement.js`
- **수정 위치**: 내담자 모달 `onSave` 콜백 내부, payload 구성하는 부분 (대략 602~622라인 근처).

**변경 방향**:

1. **create 시에도** 주민번호·주소를 payload에 포함하도록 변경.
   - 현재: `if (modalType === 'edit') { ... payload.rrnFirst6, payload.rrnLast1, address, addressDetail, postalCode ... }`
   - 제안: 주민번호(`rrnFirst6`, `rrnLast1`)와 주소(`address`, `addressDetail`, `postalCode`)는 **create/edit 공통**으로, `modalType` 분기 없이 값이 있으면 payload에 넣도록 수정.
2. (선택) create일 때도 edit과 동일한 조건(값이 있으면 trim 후 포함)으로 통일하면, 주소도 등록 시 함께 저장되어 동작이 일관됨.

**구체적 수정 예시 (로직만)**:

- `if (modalType === 'edit') { ... }` 블록에서 주민번호·주소 할당 부분을 블록 밖으로 빼거나,
- 동일 조건을 create일 때도 적용하도록 분기 수정.  
  예: `if (data.rrnFirst6?.trim()) payload.rrnFirst6 = data.rrnFirst6.trim();` / `if (data.rrnLast1?.trim()) payload.rrnLast1 = data.rrnLast1.trim();` 를 `modalType === 'edit'` 조건 밖에서도 실행.

(실제 코드 패치·라인 단위 수정은 core-coder가 수행.)

---

## 7. 체크리스트 (수정 후 확인)

- [ ] 내담자 **등록(create)** 시 주민번호 앞 6자리·뒤 1자리 입력 후 저장하면, 해당 내담자 카드/상세에서 **성별**이 표시되는지 확인.
- [ ] 내담자 **수정(edit)** 시 주민번호 입력·저장 동작이 기존처럼 동작하는지 확인.
- [ ] API 요청: create 시 `POST /api/v1/admin/clients` 요청 body에 `rrnFirst6`, `rrnLast1` 필드가 포함되는지 (Network 탭 또는 로그) 확인.

---

## 8. 참고 코드 위치

| 구분 | 파일 | 비고 |
|------|------|------|
| payload 구성 (수정 대상) | `frontend/src/components/admin/ClientComprehensiveManagement.js` | onSave 내부, 대략 602~622라인 |
| 폼 필드/ formData | `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.js` | rrnFirst6, rrnLast1 입력·safeFormData |
| create API | `src/main/java/.../controller/AdminController.java` | POST /clients, ClientRegistrationRequest |
| create 서비스 | `src/main/java/.../service/impl/AdminServiceImpl.java` | registerClient(), applyRrnAndAddressToUser() |
| DTO | `src/main/java/.../dto/ClientRegistrationRequest.java` | rrnFirst6, rrnLast1 필드 정의 |
