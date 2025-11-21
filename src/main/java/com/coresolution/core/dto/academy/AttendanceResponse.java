package com.coresolution.core.dto.academy;

import com.coresolution.core.domain.academy.Attendance;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * 출결 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponse {
    
    private String attendanceId;
    private String tenantId;
    private Long branchId;
    private String enrollmentId;
    private String scheduleId;
    private LocalDate attendanceDate;
    private LocalTime attendanceTime;
    private Attendance.AttendanceStatus status;
    private LocalDateTime recordedAt;
    private String recordedBy;
    private Attendance.RecordingMethod recordingMethod;
    private String notes;
    private String excuseReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

