# ERP 대시보드 데이터 전부 0/비어 있음 — 원인·수정·검증 기획

## 1. 제목·목표

- **제목**: ERP 대시보드 터넌트별 데이터 미노출(전부 0/비어 있음) 원인 확인 및 수정 기획
- **목표**: (1) 데이터 로드 경로와 API 헤더(X-Tenant-Id) 전달 여부를 정리하고, (2) loadDashboardData 등 fetch 호출을 표준(StandardizedApi 또는 공통 헤더)으로 통일한 뒤, (3) 터넌트별 수치 노출 검증 방법을 정리한다.

## 2. 범위

| 구분 | 내용 |
|------|------|
| **포함** | `frontend/src/components/erp/ErpDashboard.js` 내 `loadDashboardData`, `loadIncomeExpenseSummary` 호출 시점·조건, 동일 파일 내 모든 `fetch()` 및 `StandardizedApi` 사용처, `apiHeaders.js`·`standardizedApi.js` 연동 방식 |
| **제외** | ERP 이외 대시보드, 백엔드 API 로직 변경(필요 시 별도 Phase) |
| **영향** | ERP 대시보드 KPI(총 아이템 수, 승인 대기, 주문 수, 예산/사용액), 수입·지출 요약, 테넌트 `tenant-incheon-consultation-006` 등 터넌트별 데이터 노출 |

## 3. 의존성·순서

- **선행**: 이미 파악된 내용 — `loadDashboardData()`는 `fetch()` 직접 사용·헤더 없음, `loadIncomeExpenseSummary()`는 `StandardizedApi.get()` 사용·`getDefaultApiHeadersAsync`로 X-Tenant-Id 포함. 멀티테넌트 백엔드는 X-Tenant-Id 없으면 400/403 또는 빈 데이터 가능.
- **순서**: Phase 1(탐색) → Phase 2(원인·수정 방향) → Phase 3(구현). **Phase 1과 Phase 2는 병렬 호출 가능**(동일 파일·유틸 참조만으로 각자 수행 가능).

## 4. Phase 목록 및 분배실행

### Phase 1 — 원인 확인(탐색): 데이터 로드 경로·헤더 사용 여부 정리

| 항목 | 내용 |
|------|------|
| **담당** | **explore** |
| **목표** | ERP 대시보드 데이터 로드 경로(loadDashboardData, loadIncomeExpenseSummary 호출 시점·조건)와 API 호출 시 헤더/터넌트 전달 여부를 코드 기준으로 정리한다. |
| **전달할 태스크 설명(프롬프트)** | 아래 "Phase 1 전달 프롬프트" 참조 |

**Phase 1 전달 프롬프트**

```
frontend/src/components/erp/ErpDashboard.js 를 기준으로 다음을 정리해 주세요.

1) 데이터 로드 경로
   - loadDashboardData()가 호출되는 시점·조건(useEffect, 버튼 등)을 나열하고,
   - loadIncomeExpenseSummary()가 호출되는 시점·조건을 나열하세요.

2) API 호출 방식·헤더 여부
   - loadDashboardData 내부의 4개 fetch(/api/v1/erp/items, ...) 각각에 대해: URL, credentials 외에 헤더(X-Tenant-Id, Authorization 등)가 붙는지 여부를 명시하세요.
   - loadIncomeExpenseSummary는 StandardizedApi.get을 사용하는데, 이때 X-Tenant-Id가 어떻게 붙는지(standardizedApi.js·apiHeaders.js 참조) 한 줄로 요약하세요.
   - 같은 파일 내 handleInitTenantErp, handleBackfillJournalEntries의 fetch 호출에도 헤더(X-Tenant-Id)가 붙는지 여부를 명시하세요.

3) 산출물
   - "데이터 로드 경로 요약"과 "API별 헤더 사용 여부 표(함수명, URL, 헤더 있음/없음)" 형태로 보고해 주세요. 코드 수정은 하지 마세요.
```

---

### Phase 2 — 원인 확인·수정 방향 제안: 근본 원인 및 수정안

| 항목 | 내용 |
|------|------|
| **담당** | **core-debugger** |
| **목표** | ERP 대시보드 데이터가 전부 0/비어 있는 현상의 근본 원인을 "X-Tenant-Id 미전달" 관점에서 확인하고, loadDashboardData의 4개 fetch에 공통 헤더를 붙일지 StandardizedApi 등 기존 유틸로 통일할지 수정 방향을 제안한다. |
| **적용 스킬** | `/core-solution-debug` |
| **전달할 태스크 설명(프롬프트)** | 아래 "Phase 2 전달 프롬프트" 참조 |

**Phase 2 전달 프롬프트**

```
상황: ERP 대시보드 화면은 나오지만 데이터가 전부 0/비어 있음(수입·지출 ₩0, 총 아이템 수 0, 승인 대기 0 등). 터넌트 tenant-incheon-consultation-006 등.

이미 파악된 내용:
- ErpDashboard.js의 loadDashboardData()는 fetch()를 직접 사용하며 X-Tenant-Id 등 기본 API 헤더를 붙이지 않음.
- loadIncomeExpenseSummary()는 StandardizedApi.get()을 사용해 getDefaultApiHeadersAsync로 X-Tenant-Id가 붙음.
- 멀티테넌트 백엔드에서는 X-Tenant-Id가 없으면 400/403 또는 빈 데이터를 반환할 수 있음.

요청:
1) 원인 정리: loadDashboardData 내 4개 fetch에 X-Tenant-Id가 없어 터넌트 격리된 데이터를 받지 못하는 것이 근본 원인인지, 코드·표준(/core-solution-api, /core-solution-multi-tenant) 기준으로 짧게 정리해 주세요.
2) 수정 방향 제안: (A) 4개 fetch에 getDefaultApiHeadersAsync()로 공통 헤더(X-Tenant-Id 등)를 붙이는 방안, (B) 4개를 StandardizedApi.get()으로 통일하는 방안 중, 프로젝트 표준과 유지보수성을 고려해 하나를 권장하고, handleInitTenantErp / handleBackfillJournalEntries의 fetch도 동일한 방식으로 통일할지 여부를 제안해 주세요.
3) 산출물: "원인 요약(1~2문장)" + "권장 수정 방향(방안 A/B 선택 및 이유)" + "core-coder에게 전달할 구체 지시 요약(파일·함수·수정 내용)"을 보고해 주세요. 코드 작성은 하지 마세요.
```

---

### Phase 3 — 수정 구현: fetch → 표준 방식 통일

| 항목 | 내용 |
|------|------|
| **담당** | **core-coder** |
| **목표** | Phase 1·2 결과를 반영하여, loadDashboardData의 4개 fetch 및 (권장 시) handleInitTenantErp·handleBackfillJournalEntries의 fetch를 프로젝트 표준(StandardizedApi 또는 getDefaultApiHeadersAsync 적용 fetch)으로 수정한다. |
| **적용 스킬** | `/core-solution-frontend`, `/core-solution-api` |
| **전달할 태스크 설명(프롬프트)** | 아래 "Phase 3 전달 프롬프트" 참조 |

**Phase 3 전달 프롬프트**

```
ERP 대시보드 데이터가 터넌트별로 0으로 나오는 문제 수정입니다. core-debugger의 "권장 수정 방향"과 "core-coder에게 전달할 구체 지시"를 반드시 따르세요. 해당 지시가 없으면 아래 기본 지시를 따르세요.

기본 지시(debugger 산출물이 없을 때):
- 파일: frontend/src/components/erp/ErpDashboard.js
- loadDashboardData 내 4개 fetch(/api/v1/erp/items, /api/v1/erp/purchase-requests/pending-admin, /api/v1/erp/purchase-orders, /api/v1/erp/budgets)를 StandardizedApi.get() 호출로 교체하여 X-Tenant-Id 등 공통 헤더가 붙도록 하세요. (프로젝트 표준: /core-solution-api — StandardizedApi 사용, tenantId 필수.)
- handleInitTenantErp, handleBackfillJournalEntries의 fetch는 StandardizedApi.post()로 교체하거나, fetch 사용 시 getDefaultApiHeadersAsync()로 헤더를 붙여 동일하게 X-Tenant-Id가 전달되도록 하세요.
- ERP_API 상수는 frontend/src/constants/api.js 등 기존 상수에 있으면 사용하고, 없으면 URL 문자열로 작성하세요.
- 수정 후 loadDashboardData·loadIncomeExpenseSummary 호출 시점/로직은 변경하지 마세요. 에러 처리( setStats, setFinanceError 등)는 기존 동작을 유지하세요.

참조: frontend/src/utils/standardizedApi.js, frontend/src/utils/apiHeaders.js, .cursor/skills/core-solution-api/SKILL.md
```

---

### Phase 4 — 검증 요약(기획 정리)

| 항목 | 내용 |
|------|------|
| **담당** | **core-planner**(본 문서) |
| **목표** | 수정 후 ERP 대시보드에서 터넌트별로 수치가 노출되는지 확인할 수 있도록 체크 포인트·예상 결과를 정리한다. |

**검증 체크 포인트·예상 결과**

- **체크 포인트**
  1. 터넌트 `tenant-incheon-consultation-006`(또는 DOM/aria-label 기준 해당 터넌트)로 로그인한 상태에서 ERP 대시보드 접근.
  2. 브라우저 개발자 도구 네트워크 탭에서 다음 요청 확인:  
     `GET /api/v1/erp/items`, `GET /api/v1/erp/purchase-requests/pending-admin`, `GET /api/v1/erp/purchase-orders`, `GET /api/v1/erp/budgets`,  
     (권한 있을 때) `GET .../erp/finance/dashboard`  
     → 각 요청 Request Headers에 **X-Tenant-Id: tenant-incheon-consultation-006** (또는 해당 터넌트 ID) 존재 여부.
  3. 대시보드 UI에서 다음 값 확인: 총 아이템 수, 승인 대기 건수, 주문 수, 예산/사용액, (권한 있을 때) 수입·지출 요약.

- **예상 결과**
  - X-Tenant-Id가 모든 ERP API 요청에 포함되고, 해당 터넌트에 데이터가 있으면 수치가 0이 아닌 값으로 표시됨.
  - 해당 터넌트에 데이터가 없으면 0이어도 정상이며, 다른 터넌트로 로그인 시 해당 터넌트 데이터만 노출되는지 추가로 확인하면 좋음.

---

## 5. 리스크·제약

- 백엔드가 이미 X-Tenant-Id 없을 때 빈 배열/0을 반환하는 경우, 프론트만 수정해도 동일 터넌트 데이터가 노출됨.
- ERP_API 상수에 items, pending-admin, purchase-orders, budgets 경로가 없으면 코더가 상수 추가 또는 인라인 URL 사용 시 프로젝트 표준(엔드포인트 `/api/v1/` 유지) 준수.

## 6. 단계별 완료 기준·체크리스트

| Phase | 완료 기준 | 체크리스트 |
|-------|-----------|------------|
| 1 (explore) | 데이터 로드 경로와 API별 헤더 사용 여부가 표로 정리되어 기획에게 보고됨 | loadDashboardData·loadIncomeExpenseSummary 호출 시점 나열됨; 4개 fetch + init/backfill fetch 헤더 유무 명시됨 |
| 2 (core-debugger) | 원인 요약 + 권장 수정 방향 + core-coder 전달 지시 요약이 기획에게 보고됨 | 원인 1~2문장; 방안 A/B 선택 및 이유; 파일·함수·수정 내용 요약 포함 |
| 3 (core-coder) | ErpDashboard.js 수정 반영, 표준(StandardizedApi 또는 공통 헤더)으로 통일됨 | 4개 fetch가 표준 방식으로 변경됨; init/backfill도 권장대로 반영됨; 린트 에러 없음 |
| 4 (검증) | 검증 체크 포인트·예상 결과가 문서화됨 | 본 문서 §4 Phase 4 및 아래 "최종 보고" 검증 섹션으로 확인 가능 |

---

## 7. 실행 요청문(호출 순서)

1. **Phase 1과 Phase 2를 병렬로** 호출하세요.  
   - **Phase 1**: subagent_type=`explore`, prompt=위 "Phase 1 전달 프롬프트" 전문.  
   - **Phase 2**: subagent_type=`core-debugger`, prompt=위 "Phase 2 전달 프롬프트" 전문.

2. Phase 1·2 결과를 기획에게 보고받은 뒤, **Phase 3**을 호출하세요.  
   - **Phase 3**: subagent_type=`core-coder`, prompt=위 "Phase 3 전달 프롬프트"에, core-debugger가 제안한 "core-coder에게 전달할 구체 지시"를 앞에 붙여서 전달.

3. Phase 3 완료 후, **검증**은 위 §4 Phase 4 체크 포인트·예상 결과대로 사용자 또는 테스터가 수행하고, 결과를 기획에게 보고하면 기획이 **최종 보고**를 작성합니다.

---

## 8. 최종 보고(취합 결과)

- **원인**: `ErpDashboard.js`의 `loadDashboardData()`는 `fetch()`만 사용하고 `X-Tenant-Id`를 포함한 공통 API 헤더를 붙이지 않았음. 멀티테넌트 백엔드는 `X-Tenant-Id`가 없으면 tenantId를 알 수 없어 빈 리스트·0 또는 400/403을 반환하므로, 터넌트별 격리된 데이터를 받지 못한 것이 근본 원인. `loadIncomeExpenseSummary()`는 `StandardizedApi.get()`으로 X-Tenant-Id가 붙어 수입·지출만 정상 노출되던 상황과 일치.
- **수정 내용**: ① `loadDashboardData` 내 4개 `fetch()`를 `StandardizedApi.get(endpoint)`로 교체(엔드포인트: items, purchase-requests/pending-admin, purchase-orders, budgets). ② `handleInitTenantErp`·`handleBackfillJournalEntries`를 `StandardizedApi.post()`로 교체. 응답 파싱·에러 처리·setStats 등 기존 로직 유지.
- **검증 방법**: §4 Phase 4 참조. 터넌트(예: tenant-incheon-consultation-006) 로그인 후 ERP 대시보드 접속 → 네트워크 탭에서 위 API 요청에 `X-Tenant-Id` 존재 확인 → 대시보드 UI에서 총 아이템 수·승인 대기·주문 수·예산/수입·지출이 해당 터넌트 데이터로 표시되는지 확인.
