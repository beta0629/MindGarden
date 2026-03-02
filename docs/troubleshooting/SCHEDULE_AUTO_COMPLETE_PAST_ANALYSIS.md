# 지난 예약(BOOKED/CONFIRMED) COMPLETED 미전환 원인 분석

## 증상

- 캘린더에서 이미 지난 예약(BOOKED/CONFIRMED)이 COMPLETED로 자동 전환되지 않음.
- 지난 건은 상담일지를 작성해야 하나, 완료 처리되지 않아 일지 작성 유도가 어려움.

---

## 호출 경로

1. **ScheduleAutoCompleteService.autoCompleteExpiredSchedules()**  
   - `@Scheduled(cron = "0 */10 * * * *")` — 10분마다 실행.  
   - 활성 테넌트 루프 → `TenantContextHolder.setTenantId(tenantId)` 설정 후 처리.  
   - **오늘 만료**: `scheduleRepository.findExpiredConfirmedSchedules(tenantId, today, currentTime)` → 각 건마다 `plSqlScheduleValidationService.processScheduleAutoCompletion(..., false)`.  
   - **지난 날짜**: `findByDateBeforeAndStatus(BOOKED)` + `findByDateBeforeAndStatus(CONFIRMED)` → 동일하게 `processScheduleAutoCompletion(..., false)` 호출.  
   - `result.get("completed") == true`일 때만 COMPLETED 처리 + 통계 업데이트; 아니면 리마인더만 생성.

2. **PlSqlScheduleValidationServiceImpl.processScheduleAutoCompletion()**  
   - DB 프로시저 `ProcessScheduleAutoCompletion` 호출.  
   - 프로시저 내부: `ValidateConsultationRecordBeforeCompletion`로 상담일지 유무 확인 → **상담일지 있거나 forceComplete=1일 때만** `schedules.status = 'COMPLETED'` 업데이트. 없으면 `CreateConsultationRecordReminder` 호출 후 완료 처리 안 함.

3. **cleanupDailySchedules()** (매일 자정)  
   - `scheduleService.autoCompleteExpiredSchedules()` 한 번만 호출.  
   - **ScheduleServiceImpl.autoCompleteExpiredSchedules()**는 `TenantContextHolder.getTenantId()`가 null이면 즉시 return.  
   - 스케줄러 컨텍스트에는 테넌트가 설정되어 있지 않으므로 **매일 자정 정리는 사실상 동작하지 않음**.

---

## 원인 정리

| 구분 | 내용 | 근거 |
|------|------|------|
| **(1) 정책** | 상담일지 없으면 완료 처리 안 함 | `ProcessScheduleAutoCompletion` 표준화본: `v_has_record = 1 OR p_force_complete = 1`일 때만 UPDATE COMPLETED. 그 외에는 리마인더만 생성하고 완료 처리 생략. |
| **(2) 프로시저 미배포/예외** | 프로시저가 MySQL 등에 없거나 예외 시 completed=false 반환 | `PlSqlScheduleValidationServiceImpl` 149–155행: 예외 시 `errorResponse.put("completed", false)` 반환. 프로시저 미배포/실패 시 해당 건은 완료 처리되지 않음. |
| **(3) OUT 파라미터 불일치** | 표준화 프로시저는 `p_success` 반환, Java는 `p_completed` 참조 | `ProcessScheduleAutoCompletion_standardized.sql` / deploy: OUT `p_success`, `p_message`. Java 141행: `response.put("completed", result.get("p_completed"))` → 표준화본 배포 시 `p_completed`는 null → 완료 여부가 항상 false로 해석될 수 있음. (레거시 `consultation_record_validation_procedures.sql`는 OUT `p_completed` 사용.) |
| **(4) 일일 정리 테넌트 미설정** | cleanupDailySchedules에서 테넌트 루프 없음 | `ScheduleAutoCompleteService.cleanupDailySchedules()`가 `scheduleService.autoCompleteExpiredSchedules()`만 호출. ScheduleServiceImpl에서는 tenantId가 null이면 early return. |

**요약**: 지난 예약이 COMPLETED로 안 바뀌는 주된 이유는 **(1) 현재 정책(상담일지 없으면 완료 안 함)** 이고, 프로시저 미배포/표준화본 배포 시 **(2)(3)** 이 겹치면 더 불안정해짐. **(4)** 는 일일 정리가 아예 돌지 않는 문제.

---

## 수정 방향 (core-coder 적용용)

1. **지난 날짜(date < today) 스케줄**  
   - 상담일지 여부와 관계없이 **Java에서 status=COMPLETED로 변경**.  
   - 변경 후 consultation_record 유무 조회(ConsultationRecordRepository 등). 없으면 `PlSqlScheduleValidationService.createConsultationRecordReminder` 호출로 리마인더만 생성.

2. **구현 위치**  
   - **ScheduleAutoCompleteService**: 지난 스케줄(pastBookedSchedules, pastConfirmedSchedules) 처리 시 `processScheduleAutoCompletion` 호출 대신,  
     - Schedule 엔티티 status=COMPLETED로 저장(ScheduleRepository.save 또는 ScheduleService에 완료 전용 메서드),  
     - ConsultationRecordRepository.findByTenantIdAndConsultantIdAndSessionDateAndIsDeletedFalse(tenantId, consultantId, schedule.getDate()) 로 유무 확인,  
     - 없으면 `createConsultationRecordReminder(schedule.getId(), ...)` 호출.  
   - 프로시저 호출 실패 시 지난 스케줄만 이 Java fallback 경로를 타도록 할지, 또는 지난 건은 항상 이 경로만 사용할지 정책 결정 후 적용.

3. **cleanupDailySchedules**  
   - 테넌트 컨텍스트가 없어 early return하지 않도록, **테넌트 루프**를 넣어 각 tenantId에 대해 `TenantContextHolder.setTenantId(tenantId)` 설정 후 `scheduleService.autoCompleteExpiredSchedules()` 호출(또는 ScheduleAutoCompleteService와 동일한 로직 한 번 더 실행). finally에서 TenantContextHolder.clear().

4. **프로시저 OUT 파라미터**  
   - 표준화 프로시저를 사용 중이면 Java에서 `p_success`를 사용하도록 수정(`response.put("completed", result.get("p_success"))` 등). 또는 프로시저를 `p_completed`를 반환하도록 통일.

---

## 수정 제안 요약 (파일·라인·방향)

| 파일 | 수정 요약 |
|------|-----------|
| `ScheduleAutoCompleteService.java` | 지난 스케줄 루프에서 processScheduleAutoCompletion 대신: (1) schedule 상태를 COMPLETED로 저장, (2) ConsultationRecordRepository로 해당 consultantId+sessionDate 상담일지 존재 여부 조회, (3) 없으면 createConsultationRecordReminder 호출. 통계는 realTimeStatisticsService.updateStatisticsOnScheduleCompletion 호출 유지. |
| `ScheduleAutoCompleteService.java` (cleanupDailySchedules) | tenantService.getAllActiveTenantIds() 루프로 각 tenantId에 대해 TenantContextHolder.setTenantId(tenantId) 후 scheduleService.autoCompleteExpiredSchedules() 호출; finally에서 clear. |
| `ScheduleService` / `ScheduleServiceImpl` | (선택) 지난 스케줄만 COMPLETED로 바꾸는 public 메서드 추가해 ScheduleAutoCompleteService에서 재사용 가능하게 할 수 있음. |
| `PlSqlScheduleValidationServiceImpl.java` | 표준화 프로시저 배포 환경이면 result.get("p_completed") → result.get("p_success") 등으로 completed 의미 매핑 통일. |

---

## 체크리스트 (수정 후 확인)

- [ ] 지난 날짜 BOOKED/CONFIRMED 스케줄이 10분 스케줄러 한 번 돌고 나서 COMPLETED로 변경되는지.
- [ ] 상담일지가 없는 지난 스케줄에 대해 리마인더(알림)가 생성되는지.
- [ ] 매일 자정 cleanupDailySchedules 실행 시 테넌트별로 autoCompleteExpiredSchedules가 호출되는지(로그 또는 DB로 확인).
- [ ] 오늘 날짜·시간 지난 스케줄은 기존 정책(상담일지 검증 후 완료) 유지할지, 지난 날짜와 동일 정책으로 통일할지 결정 후 일관되게 동작하는지.

---

*문서 작성: core-debugger. 구현은 core-coder에게 위임.*
