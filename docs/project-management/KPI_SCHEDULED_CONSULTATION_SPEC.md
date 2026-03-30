# KPI "예약된 상담" 범위·갱신 스펙

**관련 분석**: [docs/debug/KPI_SCHEDULED_CONSULTATION_ANALYSIS.md](../debug/KPI_SCHEDULED_CONSULTATION_ANALYSIS.md)

---

## 1. 현재 동작 요약

| 항목 | 현재 구현 |
|------|-----------|
| **표시 범위** | 서버 기준 **오늘(today)** 날짜의 스케줄만. 당일+미래/전체 아님. |
| **KPI 숫자(value)** | `totalToday` = 해당 날짜·tenantId의 **전체** 스케줄 건수(상태 무관: BOOKED, CONFIRMED, COMPLETED, CANCELLED 등 모두 포함). |
| **KPI 배지(변동)** | `bookedGrowthRate` = **전주 동일 요일 BOOKED** vs **오늘 BOOKED** 증감률. CONFIRMED는 변동 계산에 미포함. |
| **API** | `GET /api/v1/schedules/today/statistics?userRole=...` (Admin 시 tenantId 미전달 → TenantContextHolder 사용) |

---

## 2. 스펙 제안 (기획)

### 2.1 "예약된 상담"이 의미하는 범위

- **옵션 A — 오늘 예정된 상담 전체(현행 유지)**  
  - value = `totalToday` (오늘 날짜의 모든 스케줄).  
  - 완료/취소 포함이므로 "예약된"이라는 라벨과 다소 어긋날 수 있음.
- **옵션 B — 오늘 중 예약·확정만(권장)**  
  - value = `bookedToday + confirmedToday`.  
  - "예약된 상담"을 BOOKED+CONFIRMED로 정의하면 라벨과 일치. API에 이미 두 필드 있음.
- **옵션 C — 당일+미래 예약**  
  - 범위를 오늘 이후 전체로 넓히면 API·집계 로직 추가 필요.

**제안**: 사용자 보고("예약 확인까지 완료한 스케줄이 있는데 0으로 나온다")를 반영하면, **숫자가 0인 원인**은 (1) tenantId 미설정으로 0건 조회, (2) 로딩 시점/재조회 미실행 등이 유력. **범위 정의**는 **옵션 B**(BOOKED+CONFIRMED만 value로 사용)를 권장하여 라벨과 일치시키고, 변동률은 현행(전주 동일 요일 BOOKED 대비) 유지 또는 별도 기획 후 CONFIRMED 포함 여부 결정.

### 2.2 갱신 트리거

- **현재**: 대시보드 초기 로드 시 `loadTodayStats()` 1회. 예약 확인(PUT confirm) 후 **자동 재조회 없음**.
- **권장**: 예약 확정 완료 시(같은 페이지/모달에서 확인 후) **loadTodayStats() 재호출**하여 KPI 즉시 갱신. 필요 시 visibilitychange 등으로 포커스 복귀 시 재조회 유지.

---

## 3. 수정 시 참고 체크리스트

아래는 [KPI_SCHEDULED_CONSULTATION_ANALYSIS.md §4](../debug/KPI_SCHEDULED_CONSULTATION_ANALYSIS.md#4-수정-제안체크리스트-초안)와 동일·요약. 적용 시 **core-coder** 위임.

- [ ] **tenantId 보장**: Admin 대시보드에서 tenantId가 비어 있으면 getTodayScheduleStatistics() 진입 전 TenantContextHolder.getTenantId() null/empty 검사 후 로그·에러 응답 추가.
- [ ] **로그 확인**: `/today/statistics` 호출 시 tenantContext, 총/예약/확인 건수, 예약증감% 확인. 0건이면 tenantId·날짜·타임존 점검.
- [ ] **프론트 재조회**: 세션 준비 완료 후 loadTodayStats 호출 보장. 예약 확정 완료 시 loadTodayStats() 재호출.
- [ ] **KPI value 정의**: "예약된 상담"을 BOOKED+CONFIRMED만 쓰기로 하면 value를 `bookedToday + confirmedToday`로 변경(백엔드 응답에 이미 있음).
- [ ] **변동률**: 현행(전주 동일 요일 BOOKED 대비) 유지. CONFIRMED 포함 여부는 기획 결정 후 필요 시 계산 로직 확장.

---

## 4. 관련 파일

| 구분 | 파일 |
|------|------|
| 프론트 KPI 표시 | frontend/src/components/dashboard-v2/AdminDashboardV2.js (kpiItems, loadTodayStats) |
| API | src/main/java/.../controller/ScheduleController.java (GET /today/statistics) |
| 집계 로직 | src/main/java/.../service/impl/ScheduleServiceImpl.java (getTodayScheduleStatistics, getTodayScheduleStatisticsByTenant) |
