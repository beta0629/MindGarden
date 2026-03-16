# KPI "예약된 상담" 0·변동 없음 원인 분석

**대상**: AdminDashboardV2 예약된 상담 KPI 카드 (`div.mg-v2-content-kpi-card.mg-v2-content-kpi-card--accent-orange`)  
**증상**: value "0", badge "변동 없음"으로 표시됨. 사용자는 예약 확인까지 완료한 스케줄이 있음.  
**범위**: 코드 기준 데이터 소스·범위·변동 계산 로직 검증 및 원인 후보 정리. 코드 수정 없음.

---

## 1. 데이터 소스 및 범위

| 항목 | 코드 기준 내용 |
|------|----------------|
| **API 경로** | `GET /api/v1/schedules/today/statistics` (ScheduleController.getTodayScheduleStatistics) |
| **쿼리 파라미터** | `userRole` (필수). `tenantId` (선택, AdminDashboardV2에서는 **미전달**) |
| **Controller 분기** | `userRole === CONSULTANT` → getTodayScheduleStatisticsByConsultant(currentUser.getId()); 그 외(ADMIN 등) → `tenantId` 있으면 getTodayScheduleStatisticsByTenant(tenantId), 없으면 **getTodayScheduleStatistics()** (TenantContextHolder 사용) |
| **응답 필드명** | totalToday, completedToday, inProgressToday, cancelledToday, bookedToday, confirmedToday, bookedGrowthRate, totalUsersGrowthRate |
| **KPI 표시값(value)** | `todayStats.totalToday` (프론트: AdminDashboardV2.js KPI 설정 배열 `value: todayStats.totalToday`) |
| **KPI 배지(badge)** | `todayStats.bookedGrowthRate` (0이면 "변동 없음", 아니면 "+/- N%") |
| **집계 범위** | **오늘(today)만**. 서버 기준 `LocalDate today = LocalDate.now()` 한 날짜의 스케줄만 집계. 당일+미래/전체 아님. |
| **totalToday 산출** | `scheduleRepository.countByDate(tenantId, today)` — 해당 날짜·해당 tenantId·isDeleted=false인 **전체 스케줄 건수**(상태 무관). |
| **tenantId 결정(Admin)** | 프론트가 tenantId를 넘기지 않으므로 Controller에서 `getTodayScheduleStatistics()` 호출 → Service는 `TenantContextHolder.getTenantId()` 사용. Controller 진입 시 `ensureTenantContextFromSession(session)`으로 세션/DB에서 tenantId 보완. |

---

## 2. 변동(bookedGrowthRate) 계산 로직

- **비교 대상**
  - **분자·분모**: **오늘** 해당 tenantId·해당 날짜의 **BOOKED** 건수(`bookedToday`) vs **전주 동일 요일** 해당 tenantId의 **BOOKED** 건수(`lastWeekBooked`).
- **계산식**  
  - `lastWeekSameDay = today.minusWeeks(1)`  
  - `lastWeekBooked = countByDateAndStatus(tenantId, lastWeekSameDay, ScheduleStatus.BOOKED)`  
  - `bookedToday = countByDateAndStatus(tenantId, today, ScheduleStatus.BOOKED)`  
  - `bookedGrowthRate = lastWeekBooked > 0 ? (bookedToday - lastWeekBooked) / lastWeekBooked * 100 (소수점 1자리) : (bookedToday > 0 ? 100.0 : 0.0)`
- **CONFIRMED 포함 여부**: **변동 계산에는 포함되지 않음.** bookedGrowthRate는 **BOOKED** 상태만 사용. 오늘/전주 모두 BOOKED 건수만 비교. (confirmedToday는 API 응답에만 포함되며 KPI 배지 계산에는 미사용.)

---

## 3. "0"·"변동 없음" 원인 후보

아래는 가능한 원인 후보이며, 결론이 아닌 검증 대상 목록이다.

1. **tenantId 미전달/미설정**  
   - AdminDashboardV2는 `tenantId` 쿼리 파라미터를 보내지 않음. Controller는 `ensureTenantContextFromSession(session)` 후 `getTodayScheduleStatistics()` 호출.  
   - 세션 사용자(또는 DB 보완)에 tenantId가 없으면 `TenantContextHolder.getTenantId()`가 null.  
   - Service는 tenantId null 검사 없이 `countByDate(tenantId, today)` 호출. JPQL `WHERE s.tenantId = :tenantId`에서 tenantId=null이면 매칭되는 행이 없어 0건으로 나올 수 있음.  
   - **확인**: 로그 `tenantContext=` 값, 세션/DB 사용자 tenantId 존재 여부.

2. **오늘만 집계 + 스케줄 날짜가 서버 기준 "오늘"이 아님**  
   - 집계는 `LocalDate.now()` 기준 **당일**만.  
   - 타임존: 서버가 UTC 등이면 사용자 기준 "오늘"과 다를 수 있음.  
   - 스케줄의 `date`가 서버의 "오늘"이 아니면(예: 내일로 저장됨) 당일 집계에 포함되지 않음.  
   - **확인**: 서버 타임존, 스케줄 테이블의 `date` 값.

3. **예약 확인(BOOKED→CONFIRMED) 후 대시보드 미재조회**  
   - value는 **totalToday**(전체 오늘 건수)이므로 BOOKED→CONFIRMED만으로는 숫자가 안 바뀌어도 됨.  
   - 다만 초기 로딩 시점에 loadTodayStats가 호출되지 않았거나, 세션/tenant 보완 전에 호출되어 0으로 세팅된 뒤 재호출이 없으면 "0"이 유지될 수 있음.  
   - **확인**: loadTodayStats 호출 시점(세션 준비 후 호출 여부), visibilitychange 등 재조회 트리거.

4. **totalToday vs "예약된 상담" 요구 정의 불일치**  
   - 현재: KPI value = **totalToday** = 오늘 날짜의 **전체** 스케줄 건수(모든 상태).  
   - 기획상 "예약된 상담"이 **BOOKED+CONFIRMED**만 의미한다면, totalToday를 쓰면 완료/취소까지 포함되어 수치와 라벨이 어긋날 수 있음.  
   - 반대로 "예약된 상담"을 "오늘 예정된 상담 전체"로 정의했다면 totalToday가 맞을 수 있음.  
   - **확인**: 기획 정의. 필요 시 value를 `bookedToday + confirmedToday`로 바꾸는지 여부.

5. **기타**  
   - Repository 메서드 시그니처/쿼리: `countByDate`, `countByDateAndStatus`는 tenantId·date·status 조건만 사용. 트랜잭션 격리로 인한 비일관성 가능성은 낮으나, 다른 API/배치와의 동시 수정은 필요 시 로그로 확인.  
   - loadTodayStats 실패 시 setTodayStats가 호출되지 않아 초기값 0 유지. (프론트는 `response.ok`일 때만 setTodayStats 호출.)

---

## 4. 수정 제안·체크리스트 초안

- [ ] **tenantId 보장**: Admin 대시보드에서 tenantId가 비어 있으면 400 등으로 명시적 실패 처리하거나, getTodayScheduleStatistics() 진입 전에 TenantContextHolder.getTenantId() null/empty 검사 후 로그·에러 응답 추가. (코드 수정은 core-coder 위임.)  
- [ ] **로그 확인**: `/today/statistics` 호출 시점 백엔드 로그에서 `tenantContext=`, `총 N개, 예약 N개, 확인 N개, 예약증감 N%` 값 확인. 0건이면 tenantId·날짜·타임존 점검.  
- [ ] **프론트 재조회**: 세션 준비 완료 후 loadTodayStats 호출 보장 여부 재확인. 필요 시 관리자 진입 시 한 번 더 호출하거나, visibilitychange 시 재호출 유지.  
- [ ] **KPI 정의 정합성**: "예약된 상담"이 BOOKED+CONFIRMED만 의미하는지 확인. 맞다면 value를 `bookedToday + confirmedToday`로 변경 검토(백엔드 응답에 이미 있음).  
- [ ] **변동률 정의**: 배지는 현재 "전주 동일 요일 BOOKED 대비 오늘 BOOKED 증감"만 반영. CONFIRMED를 변동에 포함할지 기획 확인 후 필요 시 계산 로직 확장 검토.

---

**문서 작성**: 원인 분석·수정 제안·체크리스트만 정리. 코드 수정은 수행하지 않음. 적용은 core-coder에 위임.
