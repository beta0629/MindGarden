package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import com.coresolution.consultation.entity.Schedule;
import lombok.Builder;
import lombok.Getter;

/**
 * 내담자 직접 예약(가예약 신청) 결과.
 *
 * <p>상태는 센터 확정 전 가예약({@code TENTATIVE_PENDING_PAYMENT})이다. 회기 차감·결제 정보는 담지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@Getter
@Builder
public class ClientDirectBookingResponse {

    private final Long scheduleId;
    private final String status;
    private final Long consultantId;
    private final LocalDate date;
    private final LocalTime startTime;
    private final LocalTime endTime;
    private final String consultationType;

    /**
     * @param schedule 생성된 일정
     * @return 응답 DTO
     */
    public static ClientDirectBookingResponse fromEntity(Schedule schedule) {
        return ClientDirectBookingResponse.builder()
                .scheduleId(schedule.getId())
                .status(schedule.getStatus() != null ? schedule.getStatus().name() : null)
                .consultantId(schedule.getConsultantId())
                .date(schedule.getDate())
                .startTime(schedule.getStartTime())
                .endTime(schedule.getEndTime())
                .consultationType(schedule.getConsultationType())
                .build();
    }
}
