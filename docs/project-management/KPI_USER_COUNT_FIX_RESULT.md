# KPI "총 사용자" 갱신·증감률 표시 수정 결과

**작성일**: 2025-03-16  
**참조**: docs/debug/KPI_USER_COUNT_NO_CHANGE_ANALYSIS.md

## 수정 요약

1. **백엔드**: `ScheduleServiceImpl`에서 총 사용자(상담사+내담자) 수를 조회하고, 전일 0시 시점 대비 증감률을 계산해 `totalUsersGrowthRate`로 반환.
2. **프론트**: 상담사/내담자 등록 성공 시 `admin-dashboard-refresh-stats` CustomEvent 발행, AdminDashboardV2에서 구독해 `loadStats()` 호출로 KPI 즉시 갱신.

---

## 변경 파일·내용

### 백엔드

| 파일 | 변경 내용 |
|------|-----------|
| `ConsultantRepository.java` | `countByTenantIdAndIsDeletedFalseAndCreatedAtBefore(tenantId, before)` 추가 — 비교 시점 이전 생성 상담사 수 |
| `ClientRepository.java` | 동일 시그니처 메서드 추가 — 비교 시점 이전 생성 내담자 수 |
| `ScheduleServiceImpl.java` | `ConsultantRepository`, `ClientRepository` 주입; `getTodayScheduleStatistics()`, `getTodayScheduleStatisticsByTenant()` 내에서 `computeTotalUsersGrowthRate(tenantId)` 호출 후 `statistics.put("totalUsersGrowthRate", ...)`; private 메서드 `computeTotalUsersGrowthRate(String tenantId)` 추가 — 전일 0시 이전 생성 건수와 현재 건수로 증감률 계산, 비교 불가 시 0.0 반환 |

- **비교 기준**: 전일 0시(`LocalDate.now().atStartOfDay()`). 해당 시점 이전에 생성된 상담사·내담자 합계와 현재 합계로 증감률 계산.
- **멀티테넌트**: 모든 count/비교에 `tenantId` 사용.
- **ScheduleController**: 기존대로 키 없을 때만 0.0 설정 유지(변경 없음).

### 프론트엔드

| 파일 | 변경 내용 |
|------|-----------|
| `ConsultantComprehensiveManagement.js` | 상담사 등록 성공 시 `window.dispatchEvent(new CustomEvent('admin-dashboard-refresh-stats'))` 추가 |
| `ClientComprehensiveManagement.js` | 내담자 등록 성공 시 동일 이벤트 발행 추가 |
| `AdminDashboardV2.js` | `admin-dashboard-refresh-stats` 리스너 등록 → 수신 시 `loadStats()` 호출; 탭 포커스 복귀 시(`visibilitychange` → `visible`) `loadStats()` 한 번 호출 추가 |

- `loadStats()` 내부에서 이미 `loadTodayStats()` 호출하므로 별도 호출 없음.

---

## 검증 방법

1. **등록 후 즉시 갱신**: 상담사 또는 내담자 1명 등록 후 대시보드에서 "총 사용자" 숫자·subtitle(상담사 N · 내담자 M)이 즉시 갱신되는지 확인.
2. **증감률 표시**: 백엔드가 `totalUsersGrowthRate`를 0이 아닌 값으로 반환할 수 있는 경우(당일 신규 등록이 있을 때) "변동 없음" 대신 "+N%" 등이 표시되는지 확인.
3. **다른 페이지·탭 후 복귀**: 다른 페이지에서 등록 후 대시보드로 돌아오거나, 다른 탭에서 등록 후 대시보드 탭으로 전환했을 때 KPI가 최신으로 갱신되는지 확인.
