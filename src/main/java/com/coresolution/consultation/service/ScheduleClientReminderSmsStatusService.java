package com.coresolution.consultation.service;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Map;
import com.coresolution.consultation.dto.ClientReminderSmsStatusDto;

/**
 * 스케줄 단위 내담자 예약 문자 상태 enrich (읽기 전용).
 *
 * <p>pending ∪ send_log 를 병합해 SENT/PENDING/FAILED 만 반환한다.
 * N/A·SKIPPED 는 null.</p>
 *
 * @author MindGarden
 * @since 2026-08-01
 */
public interface ScheduleClientReminderSmsStatusService {

    /**
     * scheduleId → 표시용 SMS 상태. 숨김 대상은 맵에 없거나 value null.
     *
     * @param tenantId    테넌트 ID (필수)
     * @param scheduleIds 대상 스케줄 ID
     * @return scheduleId → DTO
     */
    Map<Long, ClientReminderSmsStatusDto> resolveByScheduleIds(
            String tenantId,
            Collection<Long> scheduleIds);

    /**
     * 매핑별 다음 상담 스케줄 기준 SMS 상태.
     * 다음 일정이 없거나 숨김이면 맵에 없거나 null.
     *
     * @param tenantId  테넌트 ID (필수)
     * @param fromDate  다음 상담일 하한(포함)
     * @param mappingIds 대상 매핑 ID
     * @return mappingId → DTO
     */
    Map<Long, ClientReminderSmsStatusDto> resolveForNextConsultationByMappingIds(
            String tenantId,
            LocalDate fromDate,
            Collection<Long> mappingIds);
}
