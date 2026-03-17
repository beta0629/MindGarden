# 관리자 대시보드 차트 미표시 원인 분석

**작성일**: 2025-03-17  
**상태**: 원인 분석·확인 방법 정리 (코드 수정 없음)  
**관련**: Admin Dashboard V2 — 상담 현황 추이, 예약 vs 완료, 단계별 현황

---

## 1. 증상 요약

- **위치**: 관리자 대시보드 → `mg-v2-content-visualization-group__grid` 내부
- **영향 차트**: 「상담 현황 추이」, 「예약 vs 완료」, (참고) 「단계별 현황」
- **사용자 노출 메시지**:
  - "기간 내 완료된 상담이 없습니다." (상담 현황 추이)
  - "기간 내 데이터가 없습니다." (예약 vs 완료)
- **해석**: 두 차트 모두 **데이터 없음**으로 처리된 상태로 렌더됨.

---

## 2. 데이터 소스·API 확인

### 2.1 사용 API (단일 소스)

| 항목 | 내용 |
|------|------|
| **엔드포인트** | `GET /api/v1/admin/statistics/consultation-completion` |
| **호출 위치** | `frontend/src/components/dashboard-v2/AdminDashboardV2.js` — `loadStats()` 내부 |
| **호출 방식** | `fetch('/api/v1/admin/statistics/consultation-completion', { headers, credentials: 'include' })` (쿼리 파라미터 없음) |
| **동시 호출** | `Promise.all`로 consultants, clients, mappings, rating, vacation, **consultation-completion**, schedule statistics 등 7개 API 병렬 호출 |

상담 현황 추이·예약 vs 완료 모두 **동일 API 한 번 호출**의 응답만 사용함. 별도 기간/파라미터는 이 차트용으로 전달하지 않음.

### 2.2 기대 응답 구조 (백엔드 기준)

- **Controller**: `AdminController.getConsultationCompletionStatistics(period, session)`  
  - `src/main/java/com/coresolution/consultation/controller/AdminController.java` (약 2342~2416행)
- **응답 래퍼**: `ApiResponse<Map<String, Object>>` → JSON 예: `{ "success": true, "data": { ... } }`
- **`data` 내부 필드** (차트에 사용):

| 필드 | 타입 | 용도 |
|------|------|------|
| `monthlyData` | `List<Map>` | 월간 차트: `period`(YYYY-MM), `completedCount`, `bookedCount` |
| `weeklyData` | `List<Map>` | 주간 차트: `period`(MM/dd), `completedCount`, `bookedCount` |
| `statistics` | `List<Map>` | 상담사별 통계 (단계별 현황 등에서 사용) |
| `totalCompleted`, `completionRate`, `completionRateChange` | number | KPI 카드용 (차트 빈 데이터 판단과는 무관) |

- **백엔드 데이터 생성**:
  - `monthlyData`: `AdminServiceImpl.getConsultationMonthlyTrend(6)` — **참고**: 인자 `lastMonths`는 현재 미사용, “당해 1월~현재”까지 월 단위로 집계.
  - `weeklyData`: `AdminServiceImpl.getConsultationWeeklyTrend(6)` — 최근 6주, `period`(MM/dd), `completedCount`, `bookedCount`.

### 2.3 프론트엔드 파싱 (AdminDashboardV2.js)

- **파일**: `frontend/src/components/dashboard-v2/AdminDashboardV2.js`
- **로직**: `consultationRes.ok`일 때만 `consultationStats` 갱신.
  - `const payload = d?.data != null ? d.data : d;`
  - `monthlyData: Array.isArray(payload.monthlyData) ? payload.monthlyData : []`
  - `weeklyData: Array.isArray(payload.weeklyData) ? payload.weeklyData : []`
- **에러/비정상 시**: `consultationRes.ok === false`이거나 `payload == null`이면 기존 state 유지. 초기 state는 `monthlyData: [], weeklyData: []` 이므로 **빈 배열**이 됨.

---

## 3. 표시 조건 확인 (“기간 내 …” 메시지가 나오는 조건)

### 3.1 “기간 내 완료된 상담이 없습니다.” (상담 현황 추이)

- **위치**: 동일 파일, 상담 현황 추이 차트 블록 (약 972~985행).
- **데이터**: `chartPeriod === 'weekly'`이면 `weeklyData`, 아니면 `monthlyData`. 없으면 `getEmptyWeeklyChartData(6)` / `getEmptyMonthlyChartData(6)` 사용 (전부 `completedCount: 0`).
- **조건**:  
  `rawData.map(d => d.completedCount || 0)` 로 만든 `values`에 대해  
  **`values.length > 0 && values.every(v => v === 0)`** 이면 위 문구 렌더.
- **정리**:  
  - API가 빈 배열을 주거나,  
  - API 실패로 `monthlyData`/`weeklyData`가 빈 배열이어서 빈 데이터 6개로 채워지거나,  
  - 배열은 있지만 모든 구간의 `completedCount`가 0인 경우  
  → 이 메시지가 표시됨.

### 3.2 “기간 내 데이터가 없습니다.” (예약 vs 완료)

- **위치**: 예약 vs 완료 라인 차트 블록 (약 1062~1087행).
- **데이터**: 동일하게 `weeklyData` / `monthlyData` 또는 빈 6구간 폴백.
- **조건**:  
  - `completedValues = rawData.map(d => d.completedCount ?? 0)`  
  - `bookedValues`: `rawData` 중 `bookedCount` 또는 `scheduledCount`가 하나라도 있으면 사용, 없으면 null.  
  - **`allZero`**: `completedValues.every(v => v === 0) && (!bookedValues || bookedValues.every(v => v === 0))`  
  → `allZero === true`일 때 위 문구 렌더.
- **정리**: 완료·예약 값이 모두 0이면 (데이터가 비었거나, 실제로 0이거나) 이 메시지가 표시됨.

### 3.3 공통점

- 두 차트 모두 **같은 API**의 `monthlyData`/`weeklyData`만 사용.
- **API 실패(4xx/5xx)** 또는 **응답에 monthlyData/weeklyData 없음/빈 배열** → 빈 구간 6개로 폴백 → **전부 0** → 두 메시지 모두 노출 가능.
- **실제 DB에 해당 기간 완료/예약이 하나도 없어도** 동일 메시지.

---

## 4. 가능한 원인 (우선순위)

| 순위 | 원인 | 설명 | 확인 방법 |
|------|------|------|-----------|
| **(마)** | **API 실패 후 빈 데이터로 유지** | `consultation-completion`이 401/403/500 등으로 실패하면 `consultationRes.ok === false`. 프론트는 에러를 토스트만 띄우고(loadStats catch), consultationStats는 초기값(monthlyData/weeklyData 빈 배열) 유지 → 두 차트 모두 “데이터 없음” 메시지. | Network에서 해당 요청 상태 코드·응답 본문 확인. |
| **(라)** | **권한·tenantId로 차단 또는 빈 결과** | Controller에서 `SessionUtils.getTenantId(session)`이 null이면 `IllegalArgumentException` 발생 → 4xx. 또는 서비스 내부에서 tenantId 없으면 `getConsultationMonthlyTrend`/`getConsultationWeeklyTrend`가 빈 리스트 반환. | 동일 API 응답 + 백엔드 로그(tenantId, 예외 메시지) 확인. |
| **(가)** | **API 응답 형식·필드명 변경** | `data`가 다른 키에 있거나, `monthlyData`/`weeklyData` 이름/구조가 바뀌면 프론트가 `[]`로 폴백. | 응답 JSON에서 `data.monthlyData`, `data.weeklyData` 존재·배열 여부 확인. |
| **(나)** | **백엔드에서 해당 기간 데이터 미반환** | DB에 해당 tenantId로 완료/예약 스케줄이 없거나, 예외로 인해 서비스가 빈 리스트 반환(`getConsultationMonthlyTrend`/`getConsultationWeeklyTrend` 내부 catch에서 `return new ArrayList<>()`). | API 200인데 `monthlyData`/`weeklyData`가 `[]` 또는 전부 0인지 확인. 백엔드 로그 “월별/주간 상담 완료 추이 조회 완료/실패” 확인. |
| **(다)** | **프론트에서 기간/파라미터 잘못 전달** | 현재 loadStats()는 **쿼리 파라미터 없이** consultation-completion을 호출. 기간은 백엔드에서 “당해 1월~현재”(월간), “최근 6주”(주간)로 고정. 따라서 “잘못 전달”보다는 **API 미호출/실패**가 우선. | 동일. (기간 파라미터는 이 차트에서 사용하지 않음) |

**종합**: 가장 먼저 확인할 것은 **(마) API 실패 여부**와 **(라) 세션/tenantId로 인한 4xx 또는 빈 배열 반환**이다. 그다음 **(가) 응답 구조**, **(나) 실제 DB/집계 결과** 순으로 보는 것이 좋다.

---

## 5. 재현·확인 방법 (개발자 도구 Network)

1. **관리자 대시보드 접속**  
   - 해당 테넌트·관리자 계정으로 로그인 후 대시보드 V2 화면으로 이동.

2. **Network 탭 준비**  
   - 개발자 도구(F12) → Network.  
   - 가능하면 "Preserve log" 체크.  
   - 필터를 "Fetch/XHR" 또는 "All"로 두고, 페이지 새로고침 또는 대시보드 진입 시점부터 캡처.

3. **요청 찾기**  
   - URL에 `consultation-completion` 이 포함된 요청 선택.  
   - 예: `GET .../api/v1/admin/statistics/consultation-completion`

4. **확인할 항목**  
   - **Status**: 200이면 정상 호출 성공. 401/403/500 등이면 **(마)** 또는 **(라)** 가능성 높음.  
   - **Response (Payload/Preview)**  
     - 최상위에 `success`, `data` 있는지.  
     - `data.monthlyData`, `data.weeklyData` 존재 여부.  
     - 각각 배열인지, 길이 0인지, 요소에 `period`, `completedCount`, `bookedCount`(또는 `scheduledCount`) 있는지.  
   - **Request Headers**: 쿠키/세션 유지 여부(로그인 유지로 401/403 원인 구분).

5. **해석**  
   - 200 + `monthlyData`/`weeklyData`가 비어 있거나 전부 0 → **(나)** 또는 **(라)**(tenantId로 조회 결과 없음).  
   - 200 + 필드 없음/다른 구조 → **(가)**.  
   - 4xx/5xx → **(마)** 또는 **(라)**. 백엔드 로그(스택트레이스, tenantId 로그)와 함께 확인.

6. **백엔드 로그 (선택)**  
   - `AdminController`: “상담사별 상담 완료 건수 통계 조회”, “tenantId”, “userId”.  
   - `AdminServiceImpl`: “월별 상담 완료 추이 조회 완료/실패”, “주간 상담 완료 추이 조회 완료/실패”, “getConsultationMonthlyTrend: tenantId 없음” 등.  
   - shell 서브에이전트로 `tail -n 300 build/logs/application.log` 또는 해당 환경 로그 경로 확인 요청 가능.

---

## 6. 조치 제안 (기획·수정 위임)

- **즉시 확인**:  
  - 브라우저 Network에서 `GET /api/v1/admin/statistics/consultation-completion` 상태 코드와 응답 본문(`data.monthlyData`, `data.weeklyData`) 확인.  
  - 4xx/5xx이면 백엔드 로그에서 tenantId·예외 원인 확인.

- **core-planner 위임 시**:  
  - 이 문서 경로(`docs/debug/ADMIN_DASHBOARD_CHARTS_EMPTY_ANALYSIS.md`)와 요약(위 1~5절) 전달.  
  - “consultation-completion API 실패 또는 빈 배열 반환 시, 상담 현황 추이·예약 vs 완료 차트가 데이터 없음 메시지로 표시됨. 원인 확인 후 백엔드 수정 또는 프론트 에러/빈 데이터 처리 개선을 core-coder에 태스크로 배정” 정도로 정리 가능.

- **core-coder 수정 시 (참고용, 코드 수정은 별도 지시 시)**  
  - API 실패 시: consultation-completion만 실패해도 토스트 후 빈 차트가 되므로, 필요하면 “차트용 데이터 로드 실패” 등 구체 메시지 표시 또는 재시도/부분 로딩 검토.  
  - 백엔드: tenantId null 시 빈 리스트 반환 구간·예외 로그 재확인; `getConsultationMonthlyTrend`의 `lastMonths` 미사용으로 “최근 6개월”이 아닌 “당해 1월~현재”인 점은 별도 이슈로 정리 가능.

---

## 7. loadStats 흐름·예약 API 연관성 (2025-03-17 보강)

### 7.1 호출 API 목록·순서

`loadStats()` (AdminDashboardV2.js 362~506행)는 **한 번의 `Promise.all`**로 아래 **7개 API**를 **동시에** 호출한다.

| 순서 | 변수명 | URL | 용도 |
|------|--------|-----|------|
| 1 | consultantsRes | `GET /api/v1/admin/consultants/with-vacation?date=...` | 상담사 수 |
| 2 | clientsRes | `GET /api/v1/admin/clients/with-mapping-info` | 내담자 수 |
| 3 | mappingsRes | `GET /api/v1/admin/mappings` | 매칭·활성 매칭 수 |
| 4 | ratingRes | `GET /api/v1/admin/consultant-rating-stats` | 상담사 평점 |
| 5 | vacationRes | `GET /api/v1/admin/vacation-statistics?period=month` | 휴가 통계 |
| 6 | **consultationRes** | **`GET /api/v1/admin/statistics/consultation-completion`** | **상담 현황 추이·예약 vs 완료·단계별 현황** (monthlyData, weeklyData, statistics) |
| 7 | **scheduleStatsRes** | **`GET /api/v1/admin/schedules/statistics`** (SCHEDULE_API.STATISTICS) | **스케줄 등록 대기 건수** (schedulePendingCount) |

- **(가)** consultation-completion, **(나)** 예약·스케줄 관련 API(schedules/statistics)는 **같은 Promise.all 안에서 병렬 호출**된다.
- **setStats**는 7개 응답을 모두 처리한 뒤 **한 번만** 호출되며, 인자: totalConsultants, totalClients, totalMappings, activeMappings, **schedulePendingCount**, consultantRatingStats, vacationStats, **consultationStats**.

### 7.2 예약 API와 consultation-completion의 state 관계

- **consultationStats** (monthlyData, weeklyData, consultantStatistics): **consultationRes**만 사용하여 로컬 변수로 채운 뒤 setStats에 전달.
- **schedulePendingCount**: **scheduleStatsRes**만 사용하여 로컬 변수로 채운 뒤 setStats에 전달.
- 두 API는 **같은 setStats 한 번 호출**에 함께 넘어가지만, **서로 다른 응답 소스**를 사용하며, **consultation-completion 결과를 예약 API가 덮어쓰거나 초기화하는 코드 경로는 없음**.

### 7.3 에러 처리 동작

| 상황 | 결과 |
|------|------|
| **consultation-completion** 4xx/5xx 또는 응답에 monthlyData/weeklyData 없음 | `consultationRes.ok === false` 또는 payload null → consultationStats는 **로컬 초기값**(monthlyData: [], weeklyData: []) 유지 → setStats에 그대로 전달 → 차트는 "데이터 없음" 메시지. |
| **schedules/statistics** 4xx/5xx | `scheduleStatsRes.ok === false` → schedulePendingCount만 null 유지. **consultationStats는 consultationRes 기준으로 그대로 setStats에 반영됨.** |
| **schedules/statistics** 200이지만 JSON 파싱 예외 | 460~475행 try/catch에서 catch 시 `console.error`만 하고 schedulePendingCount = null. **setStats는 정상 호출**되며 consultationStats는 영향 없음. |
| **7개 중 하나라도 fetch() 단계에서 예외** (네트워크 오류, CORS, 연결 거부 등) | **Promise.all 전체가 reject** → 491행 catch로 이동 → `setStats()` **미호출** → stats state는 **이전 값 유지**(초기 로드 시에는 monthlyData/weeklyData 빈 배열). → **상담 현황 추이·예약 vs 완료 모두 갱신되지 않아 빈 데이터처럼 보일 수 있음.** |

정리하면, **예약(schedules/statistics) API가 4xx/5xx를 반환하거나 JSON이 깨져도** consultation-completion 데이터는 별도로 파싱·설정되며, **한 API 실패가 다른 API 결과를 state에서 “초기화”하거나 덮어쓰지는 않는다.**  
단, **예약 API를 포함한 7개 중 하나라도 fetch 단계에서 예외를 발생시키면** Promise.all 실패로 **전체 setStats가 호출되지 않아** consultation 데이터까지 갱신되지 않는다.

### 7.4 예약 API 추가로 인한 오류 가능성 결론

- **가능한 경우**:  
  - **schedules/statistics** (또는 동일 Promise.all 내 다른 요청)가 **fetch 단계에서 예외**를 발생시키는 경우(네트워크 오류, CORS, 타임아웃 등).  
  → 이때만 전체 통계 로드가 실패하고, consultation-completion 응답이 성공했더라도 **setStats가 호출되지 않아** 상담 현황 추이·예약 vs 완료 차트가 갱신되지 않음(초기 빈 상태 유지).
- **해당되지 않는 경우**:  
  - 예약 API가 200이 아닌 **4xx/5xx만 반환**하는 경우: consultation-completion은 정상 파싱·반영되며, 예약 API는 **schedulePendingCount**만 null로 두고 차트 데이터와 무관.
- **추가 확인 권장**:  
  - 브라우저 Network에서 **7개 요청 모두** 상태 코드 확인.  
  - `consultation-completion`이 200인데도 차트가 비어 있다면, **(가) 응답 본문에 monthlyData/weeklyData 없음/빈 배열**, **(나) 7개 중 다른 요청 하나가 fetch 예외로 Promise.all 실패** 가능성을 나눠 확인하는 것이 좋다.  
  - 콘솔에 "통계 데이터 로드에 실패했습니다." 토스트가 뜨는지 확인하면, Promise.all 실패(위 fetch 예외) 여부를 추론할 수 있다.

---

## 8. 참조

- **프론트**: `frontend/src/components/dashboard-v2/AdminDashboardV2.js` (loadStats 362~506행, 상담 현황 추이 942~1032행, 예약 vs 완료 1034~1145행)
- **상수**: `frontend/src/constants/api.js` — SCHEDULE_API.STATISTICS = `/api/v1/admin/schedules/statistics`
- **백엔드**:  
  - `AdminController.getConsultationCompletionStatistics` (2342~2416행)  
  - `AdminController.getScheduleStatistics` (2489~2521행) — 스케줄 상태별 통계  
  - `AdminServiceImpl.getConsultationMonthlyTrend` (4410~4448행), `getConsultationWeeklyTrend` (4449~4484행)
- **스킬**: `.cursor/skills/core-solution-debug/SKILL.md`, `docs/standards/ERROR_HANDLING_STANDARD.md`, `docs/standards/LOGGING_STANDARD.md`
