package com.coresolution.core.dto.academy;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * 시간표 생성/수정 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassScheduleRequest {
    
    /**
     * 지점 ID
     */
    @NotNull(message = "지점 ID는 필수입니다")
    /**
     * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
     */
    @Deprecated    private Long branchId;
    
    /**
     * 반 ID
     */
    @NotBlank(message = "반 ID는 필수입니다")
    @Size(max = 36, message = "반 ID는 36자 이하여야 합니다")
    private String classId;
    
    /**
     * 요일 (0=일요일, 1=월요일, ..., 6=토요일)
     */
    @NotNull(message = "요일은 필수입니다")
    private Integer dayOfWeek;
    
    /**
     * 시작 시간
     */
    @NotNull(message = "시작 시간은 필수입니다")
    private LocalTime startTime;
    
    /**
     * 종료 시간
     */
    @NotNull(message = "종료 시간은 필수입니다")
    private LocalTime endTime;
    
    /**
     * 강의실
     */
    @Size(max = 100, message = "강의실은 100자 이하여야 합니다")
    private String room;
    
    /**
     * 회차 번호
     */
    private Integer sessionNumber;
    
    /**
     * 특정 날짜 (정기 수업이 아닌 경우)
     */
    private LocalDate sessionDate;
    
    /**
     * 정기 수업 여부
     */
    private Boolean isRegular;
    
    /**
     * 활성화 여부
     */
    private Boolean isActive;
}

