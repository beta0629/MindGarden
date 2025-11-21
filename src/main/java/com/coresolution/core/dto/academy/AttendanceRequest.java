package com.coresolution.core.dto.academy;

import com.coresolution.core.domain.academy.Attendance;
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
 * 출결 기록 생성/수정 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRequest {
    
    /**
     * 지점 ID
     */
    @NotNull(message = "지점 ID는 필수입니다")
    private Long branchId;
    
    /**
     * 수강 등록 ID
     */
    @NotBlank(message = "수강 등록 ID는 필수입니다")
    @Size(max = 36, message = "수강 등록 ID는 36자 이하여야 합니다")
    private String enrollmentId;
    
    /**
     * 시간표 ID (정기 수업인 경우)
     */
    @Size(max = 36, message = "시간표 ID는 36자 이하여야 합니다")
    private String scheduleId;
    
    /**
     * 출결 날짜
     */
    @NotNull(message = "출결 날짜는 필수입니다")
    private LocalDate attendanceDate;
    
    /**
     * 출결 시간
     */
    private LocalTime attendanceTime;
    
    /**
     * 출결 상태
     */
    @NotNull(message = "출결 상태는 필수입니다")
    private Attendance.AttendanceStatus status;
    
    /**
     * 기록 방법
     */
    private Attendance.RecordingMethod recordingMethod;
    
    /**
     * 비고
     */
    private String notes;
    
    /**
     * 사유 (결석/지각/조퇴인 경우)
     */
    private String excuseReason;
}

