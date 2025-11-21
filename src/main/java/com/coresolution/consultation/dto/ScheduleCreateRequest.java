package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 스케줄 생성 요청 DTO
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleCreateRequest {
    
    @NotNull(message = "상담사 ID는 필수입니다")
    private Long consultantId;
    
    private Long clientId;
    
    @NotBlank(message = "날짜는 필수입니다")
    private String date;
    
    @NotBlank(message = "시작 시간은 필수입니다")
    private String startTime;
    
    @NotBlank(message = "종료 시간은 필수입니다")
    private String endTime;
    
    private String title;
    
    private String description;
    
    @Builder.Default
    private String scheduleType = "CONSULTATION";
    
    @Builder.Default
    private String consultationType = "INDIVIDUAL";
    
    /**
     * ScheduleCreateDto에서 ScheduleCreateRequest로 변환 (하위 호환성)
     * @deprecated Use ScheduleCreateRequest directly
     */
    @Deprecated
    public static ScheduleCreateRequest fromDto(ScheduleCreateDto dto) {
        if (dto == null) {
            return null;
        }
        
        return ScheduleCreateRequest.builder()
                .consultantId(dto.getConsultantId())
                .clientId(dto.getClientId())
                .date(dto.getDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .scheduleType(dto.getScheduleType())
                .consultationType(dto.getConsultationType())
                .build();
    }
}

