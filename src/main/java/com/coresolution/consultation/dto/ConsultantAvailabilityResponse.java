package com.coresolution.consultation.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사 상담 가능 시간 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-11-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantAvailabilityResponse {
    
    private Long id;
    private Long consultantId;
    private DayOfWeek dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer durationMinutes;
    private Boolean isActive;
    private String notes;
    
    /**
     * ConsultantAvailabilityDto로부터 변환 (하위 호환성)
     * 
     * <p><b>주의:</b> 이 메서드는 deprecated된 ConsultantAvailabilityDto를 사용하므로 
     * 컴파일 경고가 발생할 수 있습니다. 하위 호환성을 위해 제공되며, 
     * 새로운 코드에서는 사용하지 마세요.</p>
     * 
     * @param dto ConsultantAvailabilityDto (deprecated)
     * @return ConsultantAvailabilityResponse
     * @deprecated 하위 호환성을 위해 제공되며, 새로운 코드에서는 사용하지 마세요.
     */
    @Deprecated
    public static ConsultantAvailabilityResponse fromDto(ConsultantAvailabilityDto dto) {
        if (dto == null) {
            return null;
        }
        
        return ConsultantAvailabilityResponse.builder()
            .id(dto.getId())
            .consultantId(dto.getConsultantId())
            .dayOfWeek(dto.getDayOfWeek())
            .startTime(dto.getStartTime())
            .endTime(dto.getEndTime())
            .durationMinutes(dto.getDurationMinutes())
            .isActive(dto.getIsActive())
            .notes(dto.getNotes())
            .build();
    }
}

