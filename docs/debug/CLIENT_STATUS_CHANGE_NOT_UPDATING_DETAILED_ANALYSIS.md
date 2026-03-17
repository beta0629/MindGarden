# 내담자 상태 변경 미반영 — 상세 원인 분석

## 개요

- **증상**: "내담자 상태 변경이 안 되고 있다" (수정 저장 후 목록/재진입 시 상태가 바뀌지 않음).
- **전제**: 기존 분석(`CLIENT_EDIT_STATUS_NOT_UPDATING_ANALYSIS.md`)의 수정안이 **이미 코드에 반영된 상태**로 가정함.  
  (ClientRegistrationRequest.status, updateClient 내 status→isActive 반영, ClientStatsServiceImpl의 findByRole·convertClientToMap에서 DB 값 반영, evictAllClientStatsCache 호출)
- **목적**: 그럼에도 사용자 체감상 "상태 변경이 안 된다"고 할 때, **수정이 적용되지 않는 이유** 또는 **추가로 막고 있는 요인**을 전체 경로(프론트 → API → 서비스 → DB → 목록 API → 화면) 기준으로 정리하고, 가능한 원인별 확인 방법·수정 제안을 문서화함. **코드 수정은 하지 않고 분석·체크리스트·제안만 수행.**

---

## 1. 전체 데이터 흐름 정리

### 1.1 수정 저장 경로 (PUT)

| 단계 | 위치 | 동작 |
|------|------|------|
| 1 | **프론트** `ClientComprehensiveManagement.js` | 사용자가 "저장" 클릭 → `ClientModal`의 `onSave(formData)` 호출. `formData`에는 `status` 포함(`handleEditClient` 시 `status: client.status \|\| 'ACTIVE'`, 모달 내 BadgeSelect에서 `setFormData(..., status: val)`). |
| 2 | **프론트** `ClientComprehensiveManagement.js` (handleSave) | `payload = { name, email, phone, **status**, grade, notes, ... }` 구성 후 `apiPut(\`/api/v1/admin/clients/${editingClient.id}\`, payload)` 호출. `editingClient.id`는 목록의 `clientEntity.id`(User/Client id). |
| 3 | **네트워크** | PUT `/api/v1/admin/clients/{id}`, Body: JSON `{ ..., "status": "ACTIVE" \| "INACTIVE" \| ... }`, Content-Type: application/json. |
| 4 | **백엔드** `AdminController.updateClient` | `@RequestBody @Valid ClientRegistrationRequest request`로 바인딩. DTO에 `private String status` 있음 → Jackson이 `request.setStatus(...)` 호출. |
| 5 | **백엔드** `AdminServiceImpl.updateClient` | `request.getStatus() != null && !request.getStatus().trim().isEmpty()` 일 때 `clientUser.setIsActive("ACTIVE".equalsIgnoreCase(request.getStatus().trim()))` 실행. `userRepository.save(clientUser)`로 User 저장. |
| 6 | **백엔드** 동일 메서드 | `clientRepository.findById(id).ifPresent(client -> { ... clientRepository.save(client); })`로 Client 주소 등 동기화. 이후 `clientStatsService.evictAllClientStatsCache()` 호출. |
| 7 | **응답** | `ApiResponse`에 `{ id: client.getId() }` 등 반환. 프론트는 성공 시 `loadClients()` 호출. |

**정리**: 코드 상으로는 PUT 요청 시 `status` 전달 → DTO 바인딩 → User.isActive 반영 → save → 캐시 전부 무효화까지 이어짐.

### 1.2 목록 새로고침 경로 (GET)

| 단계 | 위치 | 동작 |
|------|------|------|
| 1 | **프론트** | 수정 성공 후 `await loadClients()` 또는 사용자가 목록 새로고침. `getAllClientsWithStats()` 호출. |
| 2 | **프론트** `consultantHelper.js` | `apiGet('/api/v1/admin/clients/with-stats')` 호출. `apiGet`은 응답에서 `jsonData.data`만 반환. |
| 3 | **백엔드** `AdminController.getAllClientsWithStats` | `SessionUtils.getTenantId(session)` 후 `clientStatsService.getAllClientsWithStatsByTenant(tenantId)` 호출. |
| 4 | **백엔드** `ClientStatsServiceImpl.getAllClientsWithStatsByTenant` | `@Cacheable(value = "clientsWithStats", key = "'tenant:' + #tenantId")`. 캐시 미스 시 `userRepository.findByRole(tenantId, UserRole.CLIENT)`로 **isActive 조건 없이** 전체 내담자 조회. |
| 5 | **백엔드** `buildClientStatsList` | 각 User에 대해 `clientMap.put("status", Boolean.TRUE.equals(user.getIsActive()) ? "ACTIVE" : "INACTIVE")`, `clientMap.put("isActive", user.getIsActive() != null ? user.getIsActive() : true)` 로 **DB 값 반영**. |
| 6 | **응답** | `{ clients: [ { client: clientMap, currentConsultants, statistics }, ... ], count }`. Controller가 `success(data)`로 감싸 반환 → apiGet이 `data`만 넘김. |
| 7 | **프론트** `loadClients` | `clientsList.map(item => ({ ... clientEntity.status, clientEntity.isActive, ... }))` 로 `item.client` 기준으로 상태를 넣어 `setClients(clientsData)`. |

**정리**: 목록 API는 **findByRole**(isActive 미필터)로 조회하고, **clientMap의 status/isActive는 User.getIsActive() 기반**으로 채우며, 캐시는 `evictAllClientStatsCache()`로 전부 지워짐. 따라서 코드 상으로는 PUT 직후 GET 시 DB에 반영된 is_active가 목록에 나와야 함.

---

## 2. “상태 변경이 안 된다”가 나올 수 있는 원인 후보 (우선순위)

아래는 **수정이 이미 코드에 있다는 전제 하에**, 여전히 증상이 나올 수 있는 경우만 골라 우선순위를 매긴 것임.

### 2.1 [우선순위 1] 배포 미반영

- **가능한 원인**: 최신 코드(ClientRegistrationRequest.status, updateClient의 status→isActive, ClientStatsServiceImpl의 findByRole·DB 기반 status/isActive, evictAllClientStatsCache)가 서버에 반영되지 않음. 이전 JAR/이미지가 실행 중이면 PUT에서 status를 쓰지 않거나, 목록이 여전히 활성만 조회·하드코딩일 수 있음.
- **확인 방법**:
  - 서버에 배포된 JAR/이미지 빌드 시점·Git 커밋 해시와, 현재 소스(위 수정 포함)의 커밋이 일치하는지 확인.
  - 서버 프로세스 재시작 이력: 수정 배포 후 재시작이 없으면 이전 코드가 동작 중일 수 있음.
- **수정/대응 제안**: 최신 브랜치로 빌드 후 재배포·재시작. 배포 체크리스트에 “내담자 상태 수정 반영 여부” 확인 추가.

### 2.2 [우선순위 2] 캐시가 실제로 비워지지 않음

- **가능한 원인**:  
  - `evictAllClientStatsCache()`가 호출되지 않는 경로로 처리되거나(예외로 인한 조기 return 등),  
  - Spring 캐시 추상화와 실제 캐시 구현(Redis 등) 간 key/namespace 불일치로 evict가 다른 캐시에 적용되거나,  
  - 리버스 프록시/브라우저/중간 계층에서 GET `/clients/with-stats` 응답이 캐시되어 오래된 목록이 반환됨.
- **확인 방법**:
  - PUT 처리 직후 서버 로그에 `"🗑️ 전체 내담자 캐시 무효화"`(ClientStatsServiceImpl.evictAllClientStatsCache) 출력 여부 확인.
  - 캐시 미사용(캐시 비활성화) 또는 evict 직후에만 GET을 호출해 보았을 때 해당 내담자 `client.status`/`client.isActive`가 바뀌는지 확인.
  - Redis 등 사용 시: `clientsWithStats` 관련 key가 evict 후 사라지는지 확인.
- **수정/대응 제안**:  
  - updateClient 내 evict 호출 직전·직후에 로그 추가해 호출 여부 확인.  
  - evict 실패/미호출 가능성이 있으면 예외 처리·트랜잭션 경계 검토(evict는 save 이후에 실행되도록 유지).  
  - HTTP 캐시: `/api/v1/admin/clients/with-stats`에 Cache-Control no-store 등 적용 검토.

### 2.3 [우선순위 3] 요청 바인딩으로 request.getStatus()가 null

- **가능한 원인**:  
  - Content-Type이 application/json이 아니거나,  
  - JSON 필드명이 `status`가 아님(대소문자·오타),  
  - 프론트가 payload를 보낼 때 `status`를 빼거나, 다른 키 이름으로 보냄.
- **확인 방법**:
  - 브라우저 Network 탭에서 PUT `/api/v1/admin/clients/{id}` 요청의 Request payload에 `"status": "INACTIVE"`(또는 변경한 값)가 포함되는지 확인.
  - Controller 또는 Service 진입 시 `request.getStatus()` 값을 로그로 출력해 보기(디버그 로그 또는 일시적 info 로그).
- **수정/대응 제안**:  
  - 프론트: payload 구성 시 `status: data.status`가 항상 포함되도록 확인(undefined여도 `"INACTIVE"` 등 명시적 문자열 전송 권장).  
  - 백엔드: updateClient 시작 시 `log.debug("updateClient request.status={}", request.getStatus())` 등으로 바인딩 값 확인용 로그 추가(core-coder에게 위임).

### 2.4 [우선순위 4] 트랜잭션·예외로 인한 롤백 또는 후속 실패

- **가능한 원인**:  
  - `updateClient`에 `@Transactional`이 걸려 있고, `userRepository.save(clientUser)` 이후 `clientRepository.save(client)` 등에서 예외가 나면 **전체가 롤백**되어 User의 is_active도 원래대로 돌아갈 수 있음.  
  - 반대로 `@Transactional`이 없으면 save마다 별도 트랜잭션으로 커밋되므로, User는 저장된 뒤 Client 동기화에서 예외가 나도 User는 이미 반영된 상태임(이 경우 “상태가 안 바뀐다”의 직접 원인은 아님).
- **확인 방법**:
  - AdminServiceImpl.updateClient에 `@Transactional` 존재 여부 확인.  
  - PUT 직후 DB에서 해당 사용자 `users.is_active` 컬럼 값을 직접 조회해 변경되었는지 확인.  
  - 서버 로그에 updateClient 관련 예외/스택트레이스가 없는지 확인.
- **수정/대응 제안**:  
  - DB에 is_active가 반영되지 않는다면: Client 동기화 블록에서 예외가 나는지 확인하고, 필요 시 try/catch로 User 저장은 유지한 채 Client만 부분 실패 처리하거나, 트랜잭션 전파 조정(core-coder 위임).  
  - DB에는 반영되는데 목록에만 안 나온다면: 이 항목보다는 캐시·목록 API·프론트 참조 구조를 의심.

### 2.5 [우선순위 5] 목록 응답 구조와 프론트 참조 불일치

- **가능한 원인**:  
  - GET 응답이 `{ data: { clients: [ { client: { ..., status, isActive }, ... } ], count } }` 형태인데, `apiGet`이 `data`만 주므로 `response = { clients, count }`.  
  - `getAllClientsWithStats`는 `response.clients || response`로 배열을 취하고, `loadClients`는 `item.client`에서 `status`/`isActive`를 읽음.  
  - 만약 다른 경로(예: 다른 페이지/위젯)에서 목록을 쓰거나, `response`를 그대로 배열로 가정하는 코드가 있으면 구조 불일치로 상태를 못 읽을 수 있음.
- **확인 방법**:
  - GET `/api/v1/admin/clients/with-stats` 응답 JSON에서 해당 내담자 항목의 `client.status`, `client.isActive`가 DB와 일치하는지 확인.  
  - 프론트에서 실제로 `loadClients` 결과를 사용하는 테이블/카드가 `clientsData[].status` / `clientsData[].isActive`를 표시하는지, 다른 상태 필드(예: 매핑 상태)를 잘못 쓰고 있지 않은지 확인.
- **수정/대응 제안**:  
  - 목록을 쓰는 모든 곳에서 “내담자 활성/비활성” 표시는 `item.client.status` 또는 `item.client.isActive`(또는 loadClients 후 `clientsData[].status`)를 사용하도록 통일.  
  - 필요 시 GET 응답 스키마를 문서화해 두고, apiGet 추출 방식과 맞는지 검증.

### 2.6 [우선순위 6] 권한·필터·다른 API 사용

- **가능한 원인**:  
  - PUT은 성공했지만, 목록을 불러올 때 다른 tenantId/권한으로 호출되어 다른 테넌트 목록이 보이거나,  
  - 목록 화면이 `/clients/with-stats`가 아닌 다른 API(예: 매핑 기반 목록)를 쓰고 있어, 그 API는 status/isActive를 안 주거나 다르게 줌.
- **확인 방법**:
  - 목록 로딩 시 Network에서 실제로 GET `/api/v1/admin/clients/with-stats`가 호출되는지, 그리고 응답에 수정한 내담자가 포함되는지 확인.  
  - 세션/테넌트가 PUT과 GET에서 동일한지(동일 사용자·동일 tenantId) 확인.
- **수정/대응 제안**:  
  - 내담자 종합관리 목록은 반드시 `getAllClientsWithStats` → GET `/api/v1/admin/clients/with-stats`를 사용하도록 하고, 다른 API로 목록을 채우는 부분이 있다면 통일.

---

## 3. 검증용 체크리스트

수정이 적용된 환경에서 “상태 변경이 안 된다”를 재현·원인 좁히기 위해 아래를 순서대로 확인하는 것을 권장함.

- [ ] **PUT 요청 body**: 내담자 상태를 "비활성" 등으로 바꾼 뒤 저장 시, Network 탭에서 PUT `/api/v1/admin/clients/{id}`의 Request payload에 `"status"` 필드가 포함되어 있는지, 값이 의도한 문자열(예: "INACTIVE")인지 확인.
- [ ] **서버 로그**: 동일 PUT 요청 시 서버 로그에 `updateClient` 호출 여부, 가능하면 `request.getStatus()` 값·`savedUser.getIsActive()` 값 출력(또는 해당 로깅 추가 후 재현).
- [ ] **캐시 무효화 로그**: PUT 직후 `"🗑️ 전체 내담자 캐시 무효화"` 로그가 한 번이라도 출력되는지 확인.
- [ ] **DB 반영**: PUT 성공 직후 DB에서 해당 사용자(users.id = editingClient.id)의 `is_active` 컬럼이 변경되었는지 확인. (예: `SELECT id, is_active FROM users WHERE id = ?`)
- [ ] **GET 응답**: 브라우저 또는 도구로 GET `/api/v1/admin/clients/with-stats`를 호출했을 때, 해당 내담자 항목의 `client.status`, `client.isActive`가 DB의 `is_active`와 일치하는지 확인.
- [ ] **캐시 영향**: 캐시를 끄거나, evict 직후에만 GET을 호출했을 때도 위와 동일한지 확인. (캐시 hit 시 오래된 값이 나오면 캐시/evict 이슈 의심)
- [ ] **배포 버전**: 현재 서버에서 실행 중인 애플리케이션 빌드가, ClientRegistrationRequest.status·updateClient status→isActive·ClientStatsServiceImpl 변경·evictAllClientStatsCache를 포함한 커밋인지 확인.

---

## 4. 요약 및 core-coder 전달 시 참고

- **전체 흐름**: 수정 버튼 → payload(status 포함) → PUT → Controller 바인딩(ClientRegistrationRequest.status) → updateClient에서 status→User.isActive 반영 → userRepository.save → Client 동기화 → evictAllClientStatsCache → 응답. 목록은 GET /clients/with-stats → 캐시 미스 시 findByRole(전체) → buildClientStatsList에서 user.getIsActive() 기반으로 client.status/client.isActive 설정 → 프론트는 item.client.status/isActive로 표시.
- **가능한 원인 우선순위**: (1) 배포 미반영, (2) 캐시 미 evict 또는 다른 계층 캐시, (3) 요청 바인딩으로 getStatus()가 null, (4) 트랜잭션/예외로 롤백, (5) 목록 응답 구조와 프론트 참조 불일치, (6) 다른 API/권한·테넌트 사용.
- **코드 수정은 하지 않음**: 로깅 추가·캐시 설정·payload 점검·트랜잭션 조정 등은 **core-coder**에게 “체크리스트 결과 + 위 원인 후보”를 전달한 뒤, 수정 방향만 제안한 상태로 위임하는 것이 좋음.

---

## 5. 참고 — 코드 위치 (현재 코드 기준)

| 구분 | 파일 | 참고 위치 |
|------|------|-----------|
| 프론트 payload | `frontend/src/components/admin/ClientComprehensiveManagement.js` | payload에 `status: data.status`, `apiPut(..., payload)` (약 620–652라인) |
| 프론트 목록 로드 | `frontend/src/components/admin/ClientComprehensiveManagement.js` | `loadClients` → `getAllClientsWithStats()` → `item.client.status` / `item.client.isActive` (약 125–175라인) |
| 프론트 헬퍼 | `frontend/src/utils/consultantHelper.js` | `getAllClientsWithStats`: `apiGet('/api/v1/admin/clients/with-stats')`, `response.clients \|\| response` (약 303–320라인) |
| 프론트 모달 | `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.js` | BadgeSelect `value={safeFormData.status}`, `onChange` → `setFormData(..., status: val)`, `onSave(formData)` (약 347–350, 98, 422라인) |
| DTO | `src/main/java/.../dto/ClientRegistrationRequest.java` | `private String status` (약 66라인) |
| Controller PUT | `src/main/java/.../controller/AdminController.java` | `@PutMapping("/clients/{id}")`, `updateClient(id, request)` (약 1828–1852라인) |
| Controller GET | `src/main/java/.../controller/AdminController.java` | `getAllClientsWithStats` → `getAllClientsWithStatsByTenant(tenantId)` (약 189–223라인) |
| updateClient | `src/main/java/.../service/impl/AdminServiceImpl.java` | status→isActive 반영(약 2200–2204라인), `userRepository.save`, `evictAllClientStatsCache()` (약 2205–2226라인) |
| 목록 조회 | `src/main/java/.../service/impl/ClientStatsServiceImpl.java` | `getAllClientsWithStatsByTenant`: `findByRole(tenantId, CLIENT)` (약 100–101라인), `buildClientStatsList`에서 `user.getIsActive()` 기반 status/isActive (약 121–122라인) |
| 캐시 무효화 | `src/main/java/.../service/impl/ClientStatsServiceImpl.java` | `@CacheEvict(..., allEntries = true)` `evictAllClientStatsCache()` (약 279–282라인) |
| User 엔티티 | `src/main/java/.../entity/User.java` | `@Column(name = "is_active")` `private Boolean isActive` (약 111–113라인) |

이 문서는 디버깅·검증용이며, 실제 코드 변경은 core-coder에게 위임한다.
