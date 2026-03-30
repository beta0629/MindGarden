# 관리자 대시보드 V2 "예약 vs 완료" 시계열 API 확장 기획

## 1. 목표·배경

- **목표**: `GET /api/v1/admin/statistics/consultation-completion` 의 월별/주간 추이에 **예약(booked) 건수**를 추가하고, 프론트 "예약 vs 완료" 카드에서 **예약·완료 2선**으로 표시한다.
- **배경**: 현재는 `monthlyData`/`weeklyData`에 `period`, `completedCount`만 있어 완료 1선만 표시됨. 프론트에는 이미 `bookedCount`/`scheduledCount`가 있으면 2선을 그리는 로직이 있으므로, **API 확장만 반영**하면 2선 표시가 동작한다.

## 2. 범위

| 포함 | 제외 |
|------|------|
| AdminServiceImpl `getConsultationMonthlyTrend` / `getConsultationWeeklyTrend`에 예약 건수 집계 추가 | 다른 통계 API·화면 변경 |
| API 응답 `monthlyData`/`weeklyData` 각 항목에 `bookedCount` 필드 추가 | 월/주 기간 계산 로직 변경(기존 유지) |
| 프론트 AdminDashboardV2.js 차트 데이터 바인딩·라벨 확인(필요 시) | 신규 API·엔드포인트 추가 없음 |

## 3. 예약 건수 정의

- **예약** = 스케줄 상태 **BOOKED** + **CONFIRMED** (코드베이스 정책: `ScheduleStatus`, WorkflowAutomationServiceImpl 등과 동일).
- **집계 단위**: 기간별(월/주) **테넌트 전체** 건수. (완료는 상담사별 합산이지만, 예약은 tenantId + 기간만으로 집계.)

## 4. API 스펙 (응답 확장)

- **엔드포인트**: `GET /api/v1/admin/statistics/consultation-completion` (변경 없음).
- **응답 구조**: 기존 `data.monthlyData`, `data.weeklyData` 유지.
- **각 항목 확장**:
  - `period`: 기존 유지 (월별 `yyyy-MM`, 주별 `MM/dd`).
  - `completedCount`: 기존 유지.
  - **추가** `bookedCount`: 해당 기간(월 또는 주) 내 **BOOKED + CONFIRMED** 스케줄 건수.

프론트는 `bookedCount ?? scheduledCount` 순으로 사용 중이므로, **`bookedCount` 하나만 추가**해도 2선 차트가 동작한다.

## 5. 백엔드 수정 요약

| 파일 | 내용 |
|------|------|
| **AdminServiceImpl** | `getConsultationMonthlyTrend`: 각 월(monthStart~monthEnd)에 대해 `scheduleRepository.countByStatusAndDateBetween(tenantId, BOOKED, start, end) + countByStatusAndDateBetween(tenantId, CONFIRMED, start, end)`로 예약 건수 구해 `row.put("bookedCount", sum)` 추가. |
| **AdminServiceImpl** | `getConsultationWeeklyTrend`: 각 주(weekStart~weekEnd)에 대해 동일하게 예약 건수 집계 후 `row.put("bookedCount", sum)` 추가. |
| **ScheduleRepository** | 기존 `countByStatusAndDateBetween(tenantId, String status, start, end)` 사용. (필요 시 `countByStatusInAndDateBetween` 등으로 한 번에 구하는 메서드 추가는 선택.) |

- **기간·테넌트**: 기존 로직과 동일한 `tenantId`, 월별은 `yearStart`~`now` 월 순회, 주별은 `lastWeeks` 기준 `weekEnd`/`weekStart` 사용. 기간 계산 방식은 변경하지 않는다.

## 6. 프론트 수정

- **AdminDashboardV2.js**: 이미 `bookedCount`/`scheduledCount` 있으면 2선을 그리므로, **API 확장만 되면 2선 표시됨**. 부제/라벨에서 "예약 시계열 API 확장 후 2선 표시" 문구를 "예약·완료 추이" 등으로 정리하고, 2선일 때 범례·색상이 구분되도록 확인. (필요 시 라벨/색상만 조정.)

## 7. 완료 기준·체크리스트

- [ ] `monthlyData`/`weeklyData` 각 항목에 `bookedCount` 포함되어 응답됨.
- [ ] 예약 = BOOKED + CONFIRMED, 동일 기간·동일 tenantId로 집계됨.
- [ ] AdminController 응답 구조·키 변경 없이 data 내 필드만 추가됨.
- [ ] 대시보드 V2 "예약 vs 완료" 카드에서 월간/주간 전환 시 예약·완료 2선이 표시됨.
- [ ] (선택) 부제·범례 문구 정리.

## 8. 분배실행 — core-coder 호출

**Phase**: 구현 1회 (백엔드 + 프론트 확인)

**서브에이전트**: **core-coder**

**전달할 태스크 설명**:

- 본 기획서 `docs/project-management/ADMIN_DASHBOARD_V2_BOOKED_VS_COMPLETED_CHART_PLAN.md`를 참조하여 구현한다.
- **백엔드**: `AdminServiceImpl.getConsultationMonthlyTrend(int lastMonths)`와 `getConsultationWeeklyTrend(int lastWeeks)`에서, 기존 period·completedCount 로직은 유지한 채, 각 period별로 해당 기간(월이면 monthStart~monthEnd, 주면 weekStart~weekEnd)에 대해 **예약 건수**를 구해 각 row에 `bookedCount`로 넣는다. 예약 = `ScheduleStatus.BOOKED` + `CONFIRMED` 건수 합산. `ScheduleRepository.countByStatusAndDateBetween(tenantId, status, start, end)`를 BOOKED·CONFIRMED에 각각 호출해 합산하면 된다. Controller 응답 구조는 변경하지 않고, `monthlyData`/`weeklyData` 항목에 필드만 추가한다.
- **프론트**: `AdminDashboardV2.js`의 "예약 vs 완료" 차트는 이미 `bookedCount`/`scheduledCount`가 있으면 2선을 그리므로, API만 확장하면 동작한다. 2선이 표시되는지 확인하고, 부제("예약 시계열 API 확장 후 2선 표시")를 "예약·완료 추이" 등으로 바꾸고, 범례/라벨이 예약/완료 구분되도록 필요 시만 수정한다.
- **참조**: `/core-solution-backend`, `/core-solution-frontend`, `ScheduleStatus`(BOOKED, CONFIRMED), `ScheduleRepository` 기존 count 메서드.
