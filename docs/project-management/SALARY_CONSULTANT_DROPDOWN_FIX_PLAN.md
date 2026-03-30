# 급여관리 상담사 드롭다운 비어 있음 — 기획·분배

## 1. 제목·목표

- **제목**: 급여·세금 관리 화면 상담사 선택 드롭다운에 항목이 나오지 않는 문제 해결
- **목표**: 상담사 목록이 드롭다운에 정상 노출되도록 원인 검증 후 수정 적용

## 2. 범위

| 구분 | 내용 |
|------|------|
| 포함 | 급여관리(`SalaryManagement.js`) 상담사 드롭다운, `consultantHelper.getAllConsultantsWithStats`, API `GET /api/v1/admin/consultants/with-stats` 연동 |
| 제외 | 다른 화면의 상담사 목록, API 스펙 변경(필요 시 협의) |

## 3. 탐색으로 확인한 사실 (기획 정리용)

- **로드 경로**: 급여관리 화면은 `getAllConsultantsWithStats()`(공통 모듈 `consultantHelper.js`)로 상담사 목록을 로드하며, 내부적으로 `StandardizedApi.get('/api/v1/admin/consultants/with-stats')` 호출.
- **백엔드 응답 구조**: `AdminController.getAllConsultantsWithStats` → `ConsultantStatsServiceImpl.getAllConsultantsWithStatsByTenant` → 각 항목이 `{ consultant: { id, name, ... }, currentClients, totalClients, statistics }` 형태. 즉 **배열 요소가 `consultant` 중첩 객체**를 가짐.
- **급여관리 사용 방식**: `loadConsultants`에서 반환 배열을 그대로 `setConsultants(list)` 하고, 드롭다운에서는 `consultants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)` 로 **최상위 `c.id`, `c.name`** 을 기대함.
- **다른 화면과 비교**: `ConsultantManagement.js`, `VacationManagementModal.js` 등은 동일 API 결과를 **`item.consultant` 기준으로 매핑해 `{ id, name, ... }` 평탄화**한 뒤 state에 넣음. 급여관리는 해당 매핑 없이 원본 배열을 그대로 사용함.

**가설**: API 응답은 `[{ consultant: { id, name }, ... }]` 인데, 급여관리는 `c.id`, `c.name`으로 접근해 둘 다 `undefined`가 되어 옵션이 비어 보일 가능성이 큼. (검증·수정 제안은 core-debugger, 구현은 core-coder에 위임.)

## 4. 의존성·순서

1. **Phase 1**: core-debugger가 위 사실을 바탕으로 원인 검증 및 수정 제안(체크리스트) 작성.
2. **Phase 2**: core-coder가 Phase 1 산출물을 반영해 수정 구현(급여관리 또는 공통 모듈 정규화).

## 5. 분배실행 표

| Phase | 담당 서브에이전트 | 목표 | 호출 시 전달할 태스크 설명 초안 |
|-------|-------------------|------|--------------------------------|
| 1 | **core-debugger** | 원인 검증 및 수정 제안 | 아래 "Phase 1 위임문" 참조 |
| 2 | **core-coder** | 수정 구현 | 아래 "Phase 2 위임문" 참조 |

- Phase 2는 Phase 1 결과를 받은 후 진행(순차).

---

### Phase 1 위임문 (core-debugger 호출 시 전달)

```
급여관리(급여·세금 관리) 화면에서 상담사 선택 드롭다운에 항목이 전혀 나오지 않는 문제의 원인 검증과 수정 제안을 요청합니다.

참고 사항(기획 탐색 결과):
- 상담사 목록은 consultantHelper.getAllConsultantsWithStats() → GET /api/v1/admin/consultants/with-stats 사용.
- 백엔드 응답의 각 항목은 { consultant: { id, name, ... }, currentClients, totalClients, ... } 형태입니다.
- SalaryManagement.js는 해당 배열을 그대로 setConsultants 하고, 드롭다운에서 consultants.map(c => <option key={c.id} value={c.id}>{c.name}</option>) 로 렌더링합니다. 즉 c.id, c.name을 기대하지만, 실제 c는 { consultant, currentClients, ... } 이므로 c.id/c.name이 undefined일 가능성이 있습니다.
- ConsultantManagement.js, VacationManagementModal.js는 동일 API 결과를 item.consultant 기준으로 평탄화({ id, name, ... })한 뒤 state에 넣고 있습니다.

요청:
1) 위 가설이 맞는지(응답 형식과 UI 기대 형식 불일치) 검증해 주세요. 필요 시 브라우저 네트워크/콘솔로 실제 응답과 consultants state를 확인하는 방법을 제시해 주세요.
2) 그 외 가능 원인(API 미호출, tenantId/권한, 초기 로딩 시점, StandardizedApi 응답 래핑 등)이 있으면 함께 점검해 주세요.
3) 수정 방안을 짧게 제안하고, core-coder가 적용할 수 있도록 체크리스트 형태로 정리해 주세요. (예: SalaryManagement에서 getAllConsultantsWithStats 결과를 ConsultantManagement와 동일하게 consultant 중첩 구조를 평탄화한 뒤 setConsultants 할 것 등)

문서: docs/project-management/SALARY_CONSULTANT_DROPDOWN_FIX_PLAN.md
```

---

### Phase 2 위임문 (core-coder 호출 시 전달)

```
급여관리 화면 상담사 드롭다운이 비어 있는 문제를 수정해 주세요.

전제: core-debugger의 원인 검증·수정 제안(체크리스트)를 반영하여 구현합니다. 해당 문서/스레드에서 제안한 방안이 있으면 우선 따르고, 없으면 아래 방안으로 진행합니다.

권장 방안(기획 탐색 기준): SalaryManagement.js의 loadConsultants에서 getAllConsultantsWithStats() 반환값을 ConsultantManagement.js / VacationManagementModal.js와 동일하게 처리합니다. 즉, 배열 각 항목이 { consultant: { id, name, ... }, ... } 형태이므로, item.consultant를 꺼내어 { id, name, email, ... } 평탄화한 배열을 만들어 setConsultants 하세요. 드롭다운은 이미 c.id, c.name을 사용하므로 state만 평탄화하면 됩니다.

적용 표준: core-solution-frontend, core-solution-api. 기존 ConsultantManagement 등과 동일한 데이터 형식으로 맞추면 됩니다.

문서: docs/project-management/SALARY_CONSULTANT_DROPDOWN_FIX_PLAN.md
```

---

## 6. 리스크·제약

- tenantId 없음 시 consultantHelper에서 에러를 던지거나 빈 배열을 반환할 수 있음. 이 경우에도 드롭다운은 비어 보이므로, core-debugger 검증 시 "실제 API 호출 여부·응답 본문" 확인 권장.
- 공통 모듈(consultantHelper) 반환 형식을 바꾸면 다른 소비자(ConsultantManagement, VacationManagementModal 등)에 영향 가능. 수정은 **급여관리 쪽에서 응답을 평탄화**하는 방식 권장(공통 모듈 변경 최소화).

## 7. 완료 기준·체크리스트

- [ ] core-debugger: 원인 검증 결과 및 수정 제안(체크리스트) 보고 완료.
- [ ] core-coder: 급여관리 상담사 드롭다운에 목록이 정상 노출되고, 상담사 선택 시 기존처럼 계산/프로필 연동이 동작함.
- [ ] (선택) 동일 세션·테넌트에서 다른 어드민 화면(예: 상담사 관리)의 상담사 목록은 그대로 정상 동작하는지 확인.

---

## 8. 실행 요청문

다음 순서로 서브에이전트를 호출해 주세요.

1. **Phase 1**: **core-debugger**를 호출하고, 위 "Phase 1 위임문" 전체를 전달하세요. 결과(원인 검증 요약 + 수정 제안·체크리스트)를 기획에게 보고받으세요.
2. **Phase 2**: Phase 1 결과를 반영하여 **core-coder**를 호출하고, "Phase 2 위임문" 및 debugger 산출물을 전달하세요. 수정 적용 후 급여관리 화면에서 상담사 드롭다운이 채워지는지 확인하고 기획에게 보고하세요.

기획은 위 분배대로 실행만 지시하며, 실제 원인 분석·코드 수정은 각 서브에이전트가 수행합니다.

---

## 9. Phase 1 결과: 원인 검증 및 수정 제안 (core-debugger)

### 9.1 검증 요약

- **가설 결론**: **맞음.** 응답 형식(`{ consultant, currentClients, ... }`)과 UI 기대 형식(`c.id`, `c.name`) 불일치가 근본 원인입니다.

| 확인 항목 | 결과 |
|-----------|------|
| 백엔드 응답 구조 | `ConsultantStatsServiceImpl.buildConsultantStatsList()` → 각 항목 `{ consultant: Map, currentClients, totalClients, statistics }`. `consultant` 안에 `id`, `name` 등 존재. |
| API 응답 래핑 | `AdminController`는 `success(data)` 반환, `data = { consultants: filteredStats, count }`. `ajax.apiGet`은 `{ success, data }`일 때 `data`만 반환 → `{ consultants: [...], count }`. |
| consultantHelper 반환 | `response?.consultants \|\| response?.data?.consultants \|\| response?.data \|\| []` → **배열 그대로** 반환. 요소 형태는 `{ consultant: {...}, currentClients, ... }`. |
| SalaryManagement 사용 | `setConsultants(Array.isArray(list) ? list : [])` → **평탄화 없음.** 드롭다운은 `consultants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)` → `c.id`, `c.name` 접근. |
| 실제 c의 형태 | `c` = `{ consultant, currentClients, ... }` 이므로 `c.id`, `c.name` = **undefined**. 옵션은 `key={undefined} value={undefined}` + 빈 텍스트로 렌더되어 목록이 비어 보이거나 빈 줄만 보임. |

- **다른 화면과 비교**: `ConsultantManagement.js`(32–54라인), `VacationManagementModal.js`(136–156라인)는 `item.consultant`를 꺼내 `{ id, name, email, ... }` 형태로 **평탄화**한 뒤 state에 넣음. 급여관리만 동일 API를 **평탄화 없이** 사용함.

### 9.2 브라우저로 확인하는 방법

1. **Network 탭**
   - 급여·세금 관리 화면 로드 후 `with-stats` 요청 검색.
   - 상태 코드 200이면 응답 본문에서 `data.consultants` 또는 `consultants` 배열 확인.
   - 배열 첫 항목이 `{ consultant: { id, name, ... }, currentClients, ... }` 형태인지 확인.

2. **Console**
   - `consultantHelper`에 이미 `console.log('✅ getAllConsultantsWithStats: 상담사 목록 조회 성공, count:', consultantsList.length)` 있음. count > 0 인데 드롭다운이 비어 있으면, 형태 불일치가 원인임을 강하게 시사.
   - 임시로 `loadConsultants` 내부에서 `console.log('list[0]', list[0], 'list[0].id', list[0]?.id, 'list[0].consultant?.id', list[0]?.consultant?.id)` 추가 시, `list[0].id`는 undefined, `list[0].consultant?.id`는 값 있음으로 확인 가능.

### 9.3 그 외 가능 원인 점검

| 원인 | 점검 결과 |
|------|-----------|
| API 미호출 | `useEffect(() => { loadConsultants(); ... }, []);` 로 마운트 시 1회 호출됨. 호출 자체는 이루어짐. |
| tenantId/권한 | tenantId 없으면 consultantHelper에서 에러 throw 또는 빈 배열 반환. 이 경우에도 드롭다운은 비어 보이지만, 콘솔에 `❌ getAllConsultantsWithStats` 또는 400 로그가 남음. 네트워크에서 200 + 배열이 오는데 드롭이 비어 있으면 형태 불일치가 주원인. |
| 초기 로딩 시점 | 상담사 목록은 마운트 시 로드되며, 로딩 중에는 `UnifiedLoading` 표시. 로딩이 끝났는데 드롭만 비어 있으면 데이터 shape 문제. |
| StandardizedApi 응답 래핑 | `StandardizedApi.get` → `apiGet` → `{ success, data }`일 때 `data`만 반환. `getAllConsultantsWithStats`는 `response.consultants \|\| response?.data?.consultants \|\| response?.data`로 배열 추출. 백엔드가 `data: { consultants, count }`를 주므로 `response.consultants`로 배열을 정상 취득. 래핑 자체는 원인 아님. |

### 9.4 수정 방안 (요약)

- **권장**: `SalaryManagement.js`의 `loadConsultants`에서 `getAllConsultantsWithStats()` 반환 배열을 **ConsultantManagement / VacationManagementModal과 동일하게** `item.consultant` 기준으로 평탄화한 뒤 `setConsultants`에 넣기.
- **수정 위치**: `frontend/src/components/erp/SalaryManagement.js`, `loadConsultants` 함수 내부.
- **공통 모듈(consultantHelper) 반환 형식 변경은 하지 않음** (다른 소비자 영향 최소화).

### 9.5 core-coder 적용용 체크리스트

- [ ] **파일**: `frontend/src/components/erp/SalaryManagement.js`
- [ ] **함수**: `loadConsultants` (약 113–125라인)
- [ ] `getAllConsultantsWithStats()` 호출 후 반환값을 그대로 `setConsultants` 하지 말고, **배열을 map으로 순회**하여:
  - 각 `item`에 대해 `item.consultant || {}` 취한 뒤,
  - `{ id, name, email, phone, ... }` 등 드롭다운 및 기존 로직에서 쓰는 필드를 평탄화한 객체로 만들고,
  - 그 배열을 `setConsultants(평탄화된 배열)` 로 설정.
- [ ] 참조 구현: `ConsultantManagement.js` 32–54라인 또는 `VacationManagementModal.js` 136–156라인과 동일한 매핑 방식 적용 (급여관리에서 불필요한 통계 필드는 생략 가능, 최소한 `id`, `name`은 필수).
- [ ] 수정 후 확인:
  - [ ] 급여·세금 관리 화면 진입 시 상담사 드롭다운에 항목이 노출되는지.
  - [ ] 상담사 선택 시 급여 계산 목록/프로필 등 기존 연동이 그대로 동작하는지.
  - [ ] (선택) 동일 세션에서 상담사 관리 등 다른 화면의 상담사 목록이 여전히 정상인지.
