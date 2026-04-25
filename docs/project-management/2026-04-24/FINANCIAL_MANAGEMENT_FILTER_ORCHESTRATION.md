# 재무 관리(거래 목록) 필터 오케스트레이션

**기준일**: 2026-04-17  
**목표(한 줄)**: `FinancialManagement`의 필터·쿼리스트링·`/api/v1/admin/financial-transactions` 호출과 백엔드 `AdminController#getFinancialTransactions`의 파라미터 적용 범위를 맞추고, 화면 스펙·회귀 검증까지 **core-planner** 주관 단계 배치로 마무리한다.

## 목차

1. [시나리오 S1~S7 (core-planner 요약)](#시나리오-s1s7-core-planner-요약)
2. [가설 H1~H6 (core-planner 요약)](#가설-h1h6-core-planner-요약)
3. [Phase 분배 (A~E)](#phase-분배-ae)
4. [관련 링크](#관련-링크)
5. [위임 순서 인용](#위임-순서-인용)
6. [§인벤토리](#인벤토리)

---

## 시나리오 S1~S7 (core-planner 요약)

| ID | 시나리오 요약 | 기대 결과(요약) |
| --- | --- | --- |
| **S1** | 관리자가 `/erp/financial` 진입, 필터 기본값(유형·카테고리 ALL, 날짜 프리셋 기본)으로 첫 로드 | 목록·대시보드 집계가 API 응답과 일치하고 로딩·에러 UI가 스펙대로 동작 |
| **S2** | 날짜 프리셋(오늘 / 최근 N일 / 이번 달 등)만 변경 후 조회 | `startDate`·`endDate`가 프리셋에 맞게 전달되고, 백엔드가 기간 필터를 적용한 페이지가 반환 |
| **S3** | 사용자 지정 기간(시작·종료일) 입력 후 조회 | 유효한 기간만 API에 전달; 빈 값·역전 시 UX·검증이 스펙과 일치 |
| **S4** | 거래 유형(INCOME/EXPENSE 등)만 `ALL`이 아닌 값으로 변경 | 화면 목록이 의도한 유형만 보이며, **서버 필터 적용 여부**가 스펙·가설 H1과 정합 |
| **S5** | 카테고리만 `ALL`이 아닌 값으로 변경 | S4와 동일하게 서버·클라이언트 경계가 정의된 대로 동작 |
| **S6** | 설명/매핑 등 검색어 입력 후 조회(프론트에서 추가 필터하는 경로 포함) | 검색 결과가 스펙대로이고, API `search` 지원 여부(H4)와 문서화된 동작이 일치 |
| **S7** | URL 쿼리(`dateRange`, `month` 등)로 딥링크 진입·공유 | 초기 `filters`·내비게이션 동기화가 한 번에 일관되게 적용 |

---

## 가설 H1~H6 (core-planner 요약)

| ID | 가설 요약 | 검증 방향(요약) |
| --- | --- | --- |
| **H1** | 컨트롤러는 `transactionType`·`category`를 받지만, 서비스 호출에 넘기지 않을 수 있어 **프론트만 필터**인 구간이 있을 수 있다 | explore로 호출 체인 확인 → 필요 시 백엔드 필터 추가 또는 API 계약·문서 정리 |
| **H2** | `page`·`size`와 필터 조합 시 총건수·페이지 이동이 사용자 기대와 다를 수 있다 | 페이지네이션 E2E·단위 테스트로 총건수·현재 페이지 표시 정합 |
| **H3** | 프론트가 보내는 `branchCode` 등 추가 파라미터는 백엔드에서 무시되거나 별도 경로로만 처리될 수 있다 | 파라미터 화이트리스트·무시 목록을 스펙에 명시 |
| **H4** | `search` 쿼리는 API에서 처리되지 않고 클라이언트에서만 걸러질 수 있다 | H1과 함께 API 계약서·스크린 스펙에 “서버/클라” 경계 고정 |
| **H5** | 캘린더 탭·목록 탭 전환 시 동일 `filters` 상태가 어긋날 수 있다 | 탭 전환 시나리오 스모크·상태 단일 소스 여부 점검 |
| **H6** | 세션 만료·401 시 필터 유지·재시도 문구가 다른 ERP 화면과 불일치할 수 있다 | `MGButton`·`SafeErrorDisplay` 패턴과 ONGOING 체크리스트 정합 |

---

## Phase 분배 (A~E)

| Phase | 담당(역할) | 작업 초점 | 상태 |
| --- | --- | --- | --- |
| **A** | **explore** | `FinancialManagement.js` 필터 상태·`StandardizedApi.get` 파라미터, `AdminController` `GET /financial-transactions` 시그니처·서비스 호출 인벤토리 | [x] 완료 |
| **B** | **core-debugger** | H1~H6 중 High/Medium 이슈 분류, 재현 절차·로그 포인트 — **core-debugger 산출 대기** | [ ] |
| **C** | **core-designer** | 필터 툴바·날짜·모바일 대응 등 [화면 스펙](#관련-링크) 기준 UI/문구 | [ ] |
| **D** | **core-coder** | 스펙·디버거 산출에 따른 API/프론트 수정(위임 문서에만 명시된 범위) | [ ] |
| **E** | **core-tester** | S1~S7 스모크·회귀, 콘솔 오류 0건 등 프로젝트 테스트 표준 | [ ] |

---

## 관련 링크

| 구분 | 경로(저장소 루트 기준 상대) |
| --- | --- |
| 프론트(웹) 재무 화면 | [`../../../frontend/src/components/erp/FinancialManagement.js`](../../../frontend/src/components/erp/FinancialManagement.js) |
| 백엔드 재무 거래 목록 API | [`../../../src/main/java/com/coresolution/consultation/controller/AdminController.java`](../../../src/main/java/com/coresolution/consultation/controller/AdminController.java) — `@GetMapping("/financial-transactions")` |
| 화면 스펙 v1 | [`../../design-system/SCREEN_SPEC_ERP_FINANCIAL_TRANSACTIONS_FILTERS_v1.md`](../../design-system/SCREEN_SPEC_ERP_FINANCIAL_TRANSACTIONS_FILTERS_v1.md) |

---

## 위임 순서 인용

[`CORE_PLANNER_DELEGATION_ORDER.md`](../CORE_PLANNER_DELEGATION_ORDER.md) 「사용자 강제 규칙」표 **직접 수정 금지** 행 한 줄: 일반 대화형 어시스턴트는 **소스 코드를 직접 수정하지 않는다.** 구현은 **`core-planner` → `core-coder`(또는 명시된 서브에이전트)** 에만 위임한다.

---

## §인벤토리

explore 요약(프론트 `FinancialManagement.js`·`AdminController#getFinancialTransactions`·`FinancialTransactionServiceImpl` 기준).

### (a) 프론트 → 백 쿼리 vs 실제 반영

| 전달·의도(프론트 `params`) | 컨트롤러 `@RequestParam` | 서비스/저장소까지 반영 |
| --- | --- | --- |
| `page`, `size` | 수신 | `Pageable`로 페이징 적용 |
| `startDate`, `endDate` (둘 다 유효할 때) | 수신 | `getTransactionsByDateRange`로 기간 필터 적용 |
| `startDate`/`endDate` 없음(예: 날짜 프리셋 `ALL` 등) | — | `getTransactions(pageable)` — 기간 외 필터 없음 |
| `transactionType` | 시그니처상 수신·로그만 | **미연결** — 서비스에 인자로 전달되지 않음(유형별 조회 메서드 미호출) |
| `category` | 시그니처상 수신·로그만 | **미연결** — 서비스에 인자로 전달되지 않음(카테고리별 조회 메서드 미호출) |
| `search` | **없음** | 서버 측 검색 없음 |
| `branchCode` (프론트에서 부가) | **없음** | 무시(바인딩 대상 아님) |

### (b) `search` / 유형 / 카테고리 미연결

- **`search`**: 목록 API 시그니처에 검색 파라미터가 없고, 프론트 주석대로 **클라이언트 필터** 경로에 의존(아래 (c)와 결합).
- **`transactionType`·`category`**: 요청에는 실릴 수 있으나 컨트롤러가 이후 호출에서 사용하지 않아 **서버 필터로는 동작하지 않음** — 화면에서 “걸린 것처럼” 보이려면 전부 클라이언트에서 걸러야 하는 상태와 정합(H1·H4).

### (c) `apiGet` 언랩으로 메타 손실

- `StandardizedApi.get`이 래퍼를 풀어 **`data` 배열만** 반환하는 경우, 목록 처리 분기에서 **서버가 준 `totalPages`·`totalCount` 등 페이지 메타를 읽을 수 없음**.
- 그 분기에서는 `totalPages: 1`, `totalElements: 클라이언트 필터 후 길이`로 덮어써 **서버 페이징·총건수와 UI가 어긋날 수 있음**(검색어 클라 필터 시 특히).

### (d) 이중 `useEffect` 레이스 요지

- **효과 1**: `sessionLoading`·로그인·`user`·`activeTab`·`pagination.currentPage` 변화 시 `loadData()` 즉시 호출.
- **효과 2**: `filters` 변화 시 300ms 디바운스 후 **`currentPage`를 0으로 리셋**하고 `loadData({ silent: true })` 호출.
- 필터 변경 직후 페이지 이동 등으로 두 효과가 겹치면 **요청 순서·의존 상태(`pagination` 스냅샷 vs 리셋 후 값)가 엇갈려** 마지막 응답이 최신 의도와 다를 수 있는 전형적인 패턴(H2·H5 점검 대상).

---

## Phase E 실행 기록

| 항목 | 내용 |
| --- | --- |
| **일시** | 2026-04-25 10:50–10:51 (로컬, Maven 로그 기준) |
| **(1) 단일 클래스** | `mvn -q -Dtest=FinancialTransactionServiceImplGetTransactionsFilteredTest test` → **exit 0** (통과, 약 5.1s) |
| **(2) 확장 실행** | `src/test` 기준 `*FinancialTransaction*Test.java`는 **1개**뿐이라 `-Dtest=*FinancialTransaction*Test` 단독은 (1)과 동일 범위. 대신 `Financial`/`financial` 문자열 grep으로 재무 연관 단위 테스트 **`ErpFinancialDataRetrofitServiceImplTest`**, **`AccountingServiceImplTest`**를 더해 3클래스 일괄(`-Dtest=FinancialTransactionServiceImplGetTransactionsFilteredTest,ErpFinancialDataRetrofitServiceImplTest,AccountingServiceImplTest`) 실행 → **exit 0** (약 6.6s). **3분 초과 중단 없음.** |
| **스킵·비고** | macOS 기본 환경에 `timeout` 명령이 없어 **180초 하드 캡은 적용하지 않음**(실행 시간은 3분 미만). |
