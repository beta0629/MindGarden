# KPI "총 사용자" 변동 없음 / 갱신 안 됨 원인 분석

**대상**: 어드민 대시보드 v2 — `mg-v2-content-kpi-row` 내 "총 사용자" KPI 카드  
**증상**: 상담사·내담자 추가 등록 후에도 "변동 없음"으로만 표시되고, 숫자·변동이 갱신되지 않음  
**분석일**: 2025-03-16  
**담당**: core-debugger (분석·문서만, 코드 수정 없음)

---

## 1. 관련 코드 위치 (파일·라인·요약)

| 구분 | 파일 | 라인 | 요약 |
|------|------|------|------|
| KPI 카드 렌더링 | `frontend/src/components/dashboard-v2/content/ContentKpiRow.js` | 14–74 | `items` prop으로 카드 목록 렌더, `item.badge` / `item.subtitleBadge`에 변동 문구 표시 |
| KPI 데이터·변동 문구 | `frontend/src/components/dashboard-v2/AdminDashboardV2.js` | 734–748 | `kpiItems` 구성: 총 사용자 value=`stats.totalConsultants + stats.totalClients`, subtitle=`상담사 N · 내담자 M`, badge/subtitleBadge=`todayStats.totalUsersGrowthRate === 0 ? '변동 없음' : ...%` |
| todayStats 상태 | `AdminDashboardV2.js` | 258–265 | `todayStats` 초기값에 `totalUsersGrowthRate: null` |
| loadTodayStats | `AdminDashboardV2.js` | 298–321 | `GET /api/v1/schedules/today/statistics?userRole=...` 호출 후 `payload.totalUsersGrowthRate`로 setTodayStats |
| loadStats | `AdminDashboardV2.js` | 369–501 | 상담사/내담자 수 등 통계 병렬 조회, setStats 후 `loadTodayStats()` 호출 |
| 오늘 통계 API (관리자) | `src/main/java/.../controller/ScheduleController.java` | 531–605 | `GET /schedules/today/statistics` → Service 호출 후 `totalUsersGrowthRate` 없으면 **0.0** 설정 |
| 오늘 스케줄 통계 서비스 | `src/main/java/.../service/impl/ScheduleServiceImpl.java` | 1049–1091, 1096–1137 | `getTodayScheduleStatistics()`, `getTodayScheduleStatisticsByTenant()` — **totalUsersGrowthRate 미포함** (bookedGrowthRate만 계산) |
| AdminController today 통계 | `src/main/java/.../controller/AdminController.java` | 757–782 | 다른 경로용: `lastWeekUsers = currentWeekUsers` 주석으로 "실제 데이터 없음", `totalUsersGrowthRate` 항상 0 |

---

## 2. KPI 데이터 소스·캐시·재조회 트리거 요약

### 2.1 데이터 소스

- **총 사용자 숫자(값·subtitle)**  
  - `stats.totalConsultants`, `stats.totalClients`  
  - **소스**: `loadStats()`  
  - **API**:  
    - `GET /api/v1/admin/consultants/with-vacation?date=...` → count  
    - `GET /api/v1/admin/clients/with-mapping-info` → count  

- **변동 배지(변동 없음 / N%)**  
  - `todayStats.totalUsersGrowthRate`  
  - **소스**: `loadTodayStats()`  
  - **API**: `GET /api/v1/schedules/today/statistics?userRole=...`  
  - **응답**: 백엔드에서 `totalUsersGrowthRate`를 넣지 않으면 Controller가 **0.0** 설정 → 프론트는 항상 `0` 수신 가능

### 2.2 캐시

- 프론트: `todayStats` / `stats`는 React state만 사용, 명시적 캐시(키·TTL) 없음.  
- 백엔드: 분석 범위 내에서 해당 통계 API의 응답 캐시는 확인하지 않음. (필요 시 별도 확인)

### 2.3 재조회 트리거

- **loadStats()** 호출 시점:  
  - 마운트 시 `useEffect` (678–695행, 의존성: loadStats, sessionUser, propUser 등)  
  - 매칭 생성 성공 후(585–588), 스케줄 자동 완료 후(606), 자동 완료+알림 후(628), 중복 매칭 통합 후(665), 기타 내부 핸들러  
- **loadTodayStats()** 호출 시점:  
  - 위와 동일한 `useEffect` 내에서 `sessionUser` 등 있을 때  
  - **loadStats() 내부** 마지막(494–495행)에서 `user?.role` 있을 때 `loadTodayStats()` 호출  
- **상담사/내담자 등록 후**:  
  - `ConsultantComprehensiveManagement` / `ClientComprehensiveManagement`에서는 등록 성공 시 **loadConsultants()**(해당 페이지 목록)만 호출.  
  - **대시보드 쪽 loadStats() / loadTodayStats()를 호출하는 콜백·이벤트는 없음.**  
  - 따라서 등록 후 대시보드로 다시 들어오면(라우트 전환으로 컴포넌트 재마운트) 그때 useEffect로 재조회되지만, **같은 세션에서 대시보드에 머문 채 다른 페이지에서만 등록한 경우**에는 KPI 재조회가 트리거되지 않음.

---

## 3. "변동" 계산 로직 요약

### 3.1 프론트

- `AdminDashboardV2.js` 741–745:  
  - `todayStats.totalUsersGrowthRate != null`이면  
    - `=== 0` → **"변동 없음"**  
    - 그 외 → `+N%` / `-N%`  
  - 비교 기준 시점은 프론트에 없고, **백엔드에서 내려준 값 그대로 표시**.

### 3.2 백엔드 (실제 사용 경로)

- **ScheduleController** (`/api/v1/schedules/today/statistics`):  
  - `scheduleService.getTodayScheduleStatistics()` 또는 `getTodayScheduleStatisticsByTenant(tenantId)` 호출.  
  - 반환 Map에 **totalUsersGrowthRate 키가 없음** → Controller에서 **0.0** 넣음 (586–588행).  

- **ScheduleServiceImpl**:  
  - `getTodayScheduleStatistics()` / `getTodayScheduleStatisticsByTenant()`:  
    - totalToday, completedToday, bookedToday, **bookedGrowthRate**(전주 동일 요일 대비) 등만 계산.  
    - **총 사용자 수(상담사+내담자) 또는 전일/전주 대비 증감(totalUsersGrowthRate) 계산 없음.**  

- **AdminController** (다른 today 통계 API):  
  - 757–762행: `currentWeekUsers` = 상담사+내담자 수, `lastWeekUsers = currentWeekUsers` 로 "실제 지난 주 데이터 없음" 주석, `totalUsersGrowthRate = 0.0` → 실질적으로 항상 0.

**결론**: 현재 **사용 중인** `/api/v1/schedules/today/statistics` 경로에서는 총 사용자 증감을 계산하지 않고, 키가 없어 0.0이 내려가므로 화면에는 항상 "변동 없음"으로 보일 수 있음.

---

## 4. 원인 후보 및 권장 수정 방향

### 4.1 변동이 항상 "변동 없음"인 이유

| 후보 | 설명 | 권장 수정 방향 |
|------|------|----------------|
| **1) 백엔드 totalUsersGrowthRate 미구현** | ScheduleService의 오늘 통계에 총 사용자 증감 로직이 없고, Controller가 없으면 0.0 설정 | **ScheduleServiceImpl** (및 ByTenant)에서 현재 테넌트(또는 전체) 상담사+내담자 수 조회, 이전 시점(전일/전주)과 비교해 증가율 계산 후 `totalUsersGrowthRate`로 Map에 넣기. 이전 시점 데이터는 스냅샷 테이블·캐시·또는 전일 집계 등으로 확보 |
| 2) 다른 API와 혼동 | AdminController의 today 통계에는 totalUsersGrowthRate 식이 있으나 lastWeekUsers=currentWeekUsers로 0 고정 | 프론트가 호출하는 것은 ScheduleController 경로이므로, 위 1)을 ScheduleService 쪽에 구현하는 것이 맞음 |

### 4.2 등록 후 숫자·변동이 갱신되지 않는 이유

| 후보 | 설명 | 권장 수정 방향 |
|------|------|----------------|
| **1) 등록 후 대시보드 KPI 재조회 없음** | 상담사/내담자 등록 화면에서는 목록만 loadConsultants() 등으로 갱신하고, 대시보드의 loadStats/loadTodayStats를 호출하지 않음 | 등록 성공 시 **전역 이벤트**(예: CustomEvent) 발행 후 AdminDashboardV2에서 구독해 loadStats()(및 필요 시 loadTodayStats()) 호출. 또는 라우트/상태 기반으로 "등록 완료" 플래그를 두고 대시보드 마운트/포커스 시 한 번 더 재조회 |
| 2) 대시보드에 머문 채 다른 탭에서만 등록 | 같은 탭에서 대시보드로 돌아오지 않으면 useEffect가 다시 돌지 않음 | 1)과 동일: 이벤트 또는 "돌아왔을 때 한 번 갱신" 정책으로 보완 |
| 3) 백엔드 count API 캐시 | 상담사/내담자 count API에 캐시가 있으면 갱신 지연 가능 | 필요 시 해당 Admin API 응답 캐시·TTL·무효화 시점 확인 (이번 분석에서는 미확인) |

### 4.3 수정 시 참고 (우선순위)

1. **백엔드**: `ScheduleServiceImpl.getTodayScheduleStatistics()` / `getTodayScheduleStatisticsByTenant()` 에서  
   - 현재(또는 해당 tenant) 상담사 수 + 내담자 수 조회  
   - 비교 기준(전일 0시 또는 전주 동일 요일 등) 사용자 수 확보  
   - 증가율 계산 후 `statistics.put("totalUsersGrowthRate", ...)`  
   - ScheduleController에서는 "없으면 0.0"만 유지해도 됨(서비스에서 채우면 0 미설정으로 전달 가능).

2. **프론트**:  
   - 상담사/내담자 등록 성공 시 대시보드 KPI 갱신을 위한 트리거 추가(이벤트 구독 또는 공통 콜백).  
   - 필요 시 대시보드 포커스/라우트 재진입 시 loadStats() 한 번 더 호출하는 정책 검토.

---

## 5. 체크리스트 형태의 수정 포인트

- [ ] **백엔드**  
  - [ ] ScheduleServiceImpl에 "현재 상담사+내담자 수" 조회 (tenantId 반영)  
  - [ ] 비교 기준 시점(전일/전주 등) 사용자 수 조회 또는 스냅샷 도입  
  - [ ] totalUsersGrowthRate 계산 후 Map에 포함  
  - [ ] ScheduleController는 서비스에서 넣은 값 그대로 반환(또는 없을 때만 0.0 유지)

- [ ] **프론트**  
  - [ ] 상담사/내담자 등록 성공 시 loadStats()(및 필요 시 loadTodayStats()) 트리거(이벤트 또는 콜백)  
  - [ ] AdminDashboardV2에서 해당 이벤트 구독 또는 라우트/포커스 시 재조회  
  - [ ] (선택) 대시보드 포커스/재진입 시 한 번 더 loadStats() 호출 여부 검토

- [ ] **검증**  
  - [ ] 상담사 또는 내담자 1명 등록 후 대시보드에서 총 사용자 숫자·subtitle(상담사 N · 내담자 M) 즉시 갱신되는지  
  - [ ] totalUsersGrowthRate가 0이 아닐 때 "변동 없음" 대신 "+N%" 등이 표시되는지  
  - [ ] 다른 페이지에서 등록 후 대시보드로 돌아왔을 때도 KPI가 최신으로 갱신되는지

---

**문서 끝.** 실제 코드 수정은 core-coder에게 위임.
