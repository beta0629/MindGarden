# 내담자·상담사 상태값 수정 반영 기획서

## 1. 목표

- **내담자 정보 수정** 시 상태(ACTIVE/INACTIVE 등) 값을 저장·반영되도록 수정한다.
- **상담사 정보 수정** 시 상태값 저장·반영이 필요하면, 내담자와 동일한 방식으로 적용한다.
- 실제 코드 수정은 기획이 하지 않으며, **계획서·체크리스트·분배실행 표**만 작성하고 **core-coder** 등에게 위임한다.

---

## 2. 적용 범위

| 구분 | 포함 | 비고 |
|------|------|------|
| **내담자** | 정보 수정 시 상태값 저장·반영, 목록/상세 API의 status·isActive 실제 값 반영, 목록 조회 범위(비활성 포함 여부·필터) | 필수 적용 |
| **상담사** | 정보 수정 시 상태값 저장·반영(요구사항 확정 시), 목록/상세 API의 status·isActive 반영 방식 확인 후 필요 시 동일 패턴 적용 | 기획 확정 후 적용 |

**제외**: 프론트엔드 UI 변경(이미 status 전송 중)·다른 역할(STAFF 등) 상태 수정.

---

## 3. 디버거 분석 요약

`docs/debug/CLIENT_EDIT_STATUS_NOT_UPDATING_ANALYSIS.md` 기준:

- **원인**: (1) `ClientRegistrationRequest`에 `status` 필드가 없어 프론트에서 보낸 값이 바인딩되지 않음. (2) `AdminServiceImpl.updateClient`에서 `request.getStatus()`를 읽어 `User.isActive`에 반영하는 로직이 없음. (3) `ClientStatsServiceImpl.getAllClientsWithStatsByTenant`는 `findByRoleAndIsActiveTrue`로 **활성 내담자만** 조회하고, `convertClientToMap`에서 `status`/`isActive`를 **하드코딩(ACTIVE, true)** 으로 넣어 DB 값을 사용하지 않음. 따라서 저장이 안 되고, 저장되더라도 비활성자는 목록에서 제외되며, 목록 응답은 항상 ACTIVE로 고정된다.
- **상담사**: `ConsultantRegistrationRequest`에 status 없음, `AdminServiceImpl.updateConsultant`에서 status/isActive 미반영. 상담사 목록 API(`ConsultantStatsServiceImpl.getAllConsultantsWithStatsByTenant`)는 `Consultant`(extends User)의 `getIsActive()`를 사용해 Map에 넣지만, 조회 시 `isActive == true`만 필터링해 비활성 상담자는 목록에서 제외된다. 따라서 “상태 변경” 기능이 필요하면 내담자와 동일하게 DTO·update·목록 조회 범위를 정리해야 한다.

---

## 4. 태스크 목록 (우선순위·순서)

### 4.1 내담자 (Client)

| 순서 | 태스크 | 내용 | 참조 |
|------|--------|------|------|
| C1 | DTO에 status 추가 | `ClientRegistrationRequest`에 `private String status;` 추가 (ACTIVE, INACTIVE, PENDING 등). | 디버그 문서 §4.1 |
| C2 | updateClient에서 status → User.isActive 반영 | `AdminServiceImpl.updateClient`: `request.getStatus()`가 null/empty가 아니면, ACTIVE(또는 활성 코드)이면 `clientUser.setIsActive(true)`, 그 외 `setIsActive(false)` 등으로 매핑 후 저장. (선택) 공통코드 매핑 한곳으로 통일. | 디버그 문서 §4.2 |
| C3 | 목록 API — 조회 범위 및 convertClientToMap | **조회 범위**: (A) role=CLIENT 기준 전체 조회 후 API/프론트에서 상태 필터, 또는 (B) 쿼리 파라미터로 isActive/status 필터 적용. **convertClientToMap**: `User.isActive`(및 필요 시 status 공통코드)로 `status` 문자열·`isActive` Boolean을 실제 DB 값으로 채우고, 하드코딩 "ACTIVE"/true 제거. | 디버그 문서 §4.3 |
| C4 | 내담자 등록(create) 시 status 처리 | `AdminServiceImpl.registerClient`(또는 내담자 등록 담당 메서드)에서 `request.getStatus()`를 C2와 동일 규칙으로 `User.isActive`에 반영. | 디버그 문서 §4.4 |

### 4.2 상담사 (Consultant)

| 순서 | 태스크 | 내용 | 참조 |
|------|--------|------|------|
| S1 | 요구사항 확정 | 상담사 정보 수정 화면에서 상태(활성/비활성) 변경 허용 여부, 목록에 비활성 포함·필터 제공 여부 기획 확정. | 디버그 문서 §5 |
| S2 | DTO에 status 추가 | `ConsultantRegistrationRequest`에 `private String status;` 추가. | 내담자 C1과 동일 패턴 |
| S3 | updateConsultant에서 status → User.isActive 반영 | `AdminServiceImpl.updateConsultant`: request.getStatus() → User.isActive 매핑 (내담자 C2와 동일 규칙). | AdminServiceImpl 약 2040–2117라인 |
| S4 | 목록 API 조회 범위·반환값 | `ConsultantStatsServiceImpl.getAllConsultantsWithStatsByTenant`: 현재 `isActive == true`만 조회. 비활성 포함 여부·필터 파라미터 결정 후, 필요 시 내담자 C3과 동일하게 조회 범위·반환값 정리. convertConsultantToMap은 이미 `consultant.getIsActive()` 사용 중. | ConsultantStatsServiceImpl 102–112, 266–308라인 |

---

## 5. 분배실행 표

호출 주체는 아래 순서대로 서브에이전트를 호출하고, **결과를 기획에게 보고**한다. 의존성 없이 동시에 진행 가능한 Phase는 병렬 호출 가능하다.

| Phase | 담당 서브에이전트 | 전달할 태스크 설명(체크리스트 요약) | 참조 문서 |
|-------|-------------------|-------------------------------------|-----------|
| **1** | **core-coder** | **내담자 상태 반영 구현.** (1) `ClientRegistrationRequest`에 `status` 필드 추가. (2) `AdminServiceImpl.updateClient`에서 `request.getStatus()` → `User.isActive` 매핑(ACTIVE→true, 그 외→false). (3) `ClientStatsServiceImpl`: 조회 시 `findByRoleAndIsActiveTrue` 대신 기획 결정에 따라 전체 조회 또는 쿼리 파라미터 필터 적용; `convertClientToMap`에서 `status`/`isActive`를 `User` 실제 값으로 설정(하드코딩 제거). (4) `AdminServiceImpl.registerClient`에서 등록 시에도 `request.getStatus()` → `User.isActive` 동일 규칙 반영. (5) 아래 [내담자 체크리스트] 전부 확인. | `docs/debug/CLIENT_EDIT_STATUS_NOT_UPDATING_ANALYSIS.md` §4, 본 문서 §4.1 |
| **2** | **core-coder** | **상담사 상태 반영 구현**(기획에서 “상담사 상태 변경” 확정 시). (1) `ConsultantRegistrationRequest`에 `status` 추가. (2) `AdminServiceImpl.updateConsultant`에서 `request.getStatus()` → `User.isActive` 매핑. (3) 상담사 목록 조회 범위·필터(비활성 포함 여부) 기획 확정안에 따라 `ConsultantStatsServiceImpl` 조회 조건 조정. (4) 아래 [상담사 체크리스트] 확인. | 본 문서 §4.2, 디버그 문서 §5 |
| (선택) | **explore** | 상담사 목록/상세 API에서 status·isActive가 어디서 채워지는지, 추가로 하드코딩/필터 위치가 있는지 코드 검색으로 정리. Phase 2 전에 필요 시 호출. | ConsultantStatsServiceImpl, AdminController 상담사 API |

---

## 6. core-coder 전달용 체크리스트

### 6.1 내담자 (Phase 1 완료 후 확인)

- [ ] 내담자 정보 수정에서 상태를 "비활성"으로 변경 후 저장 → DB `users.is_active`가 false로 변경되는지 확인.
- [ ] 목록 API 응답에서 해당 내담자의 `status`/`isActive`가 변경된 값으로 오는지 확인.
- [ ] 목록 조회 범위: 비활성 포함 시 목록에 노출되는지, 필터(활성/비활성)가 있다면 정상 동작하는지 확인.
- [ ] 내담자 등록 시 상태 지정 시 DB에 반영되는지 확인.

### 6.2 상담사 (Phase 2 완료 후 확인)

- [ ] 상담사 정보 수정에서 상태 변경 후 저장 → DB `users.is_active` 반영 확인.
- [ ] 상담사 목록/상세 API에서 `status`/`isActive`가 실제 DB 값으로 반환되는지 확인.
- [ ] 목록에서 비활성 포함·필터 정책이 기획과 일치하는지 확인.

---

## 7. 검증 방법 (선택)

- **수동**: 어드민 → 내담자 종합관리 → 내담자 선택 → 정보 수정 → 상태 "비활성" 저장 → 목록/재진입 시 비활성으로 표시되는지, 목록 조회 범위/필터가 기획과 맞는지 확인.
- **DB**: `users` 테이블에서 해당 사용자 `is_active` 값 변경 여부 확인.
- **API**: 내담자/상담사 목록 API 응답의 `status`·`isActive` 필드가 DB와 일치하는지 확인.

---

## 8. 참고 — 코드 위치 요약

| 구분 | 파일 | 참고 위치 |
|------|------|-----------|
| 내담자 DTO | `ClientRegistrationRequest.java` | status 필드 없음 → 추가 |
| 내담자 수정 | `AdminServiceImpl.java` | `updateClient` (약 2140–2226라인) |
| 내담자 목록 | `ClientStatsServiceImpl.java` | `getAllClientsWithStatsByTenant`, `convertClientToMap` (252–253라인 하드코딩) |
| 내담자 등록 | `AdminServiceImpl.java` | `registerClient` |
| 상담사 DTO | `ConsultantRegistrationRequest.java` | status 필드 없음 → 추가 |
| 상담사 수정 | `AdminServiceImpl.java` | `updateConsultant` (약 2040–2117라인) |
| 상담사 목록 | `ConsultantStatsServiceImpl.java` | `getAllConsultantsWithStatsByTenant` (102–112), `convertConsultantToMap` (266–308, isActive는 이미 Consultant에서 조회) |
| 엔티티 | `User.java` | `isActive` (Boolean) |

---

## 9. 실행 요청문

다음 순서로 서브에이전트를 호출해 주세요.

1. **Phase 1**: **core-coder**를 호출하고, 위 **§5 Phase 1**의 "전달할 태스크 설명"과 **§6.1 내담자 체크리스트**, 참조 문서 `docs/debug/CLIENT_EDIT_STATUS_NOT_UPDATING_ANALYSIS.md`를 전달한 뒤, 내담자 상태값 수정 반영 구현을 의뢰한다. 완료 후 결과를 기획에게 보고한다.
2. **(선택)** 상담사 API 전역에서 status/isActive 사용처를 정리할 필요가 있으면 **explore**로 검색 태스크를 먼저 호출한다.
3. **Phase 2**: 상담사 상태 변경을 기획에서 확정한 경우, **core-coder**를 호출하고 **§5 Phase 2**의 태스크 설명과 **§6.2 상담사 체크리스트**를 전달한 뒤, 상담사 상태값 수정 반영 구현을 의뢰한다. 완료 후 결과를 기획에게 보고한다.
