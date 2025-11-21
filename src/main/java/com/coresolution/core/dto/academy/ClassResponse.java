package com.coresolution.core.dto.academy;

import com.coresolution.core.domain.academy.Class;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 반 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassResponse {
    
    private String classId;
    private String tenantId;
    private Long branchId;
    private String courseId;
    private String name;
    private String nameKo;
    private String nameEn;
    private String description;
    private Long teacherId;
    private String teacherName;
    private Integer capacity;
    private Integer currentEnrollment;
    private LocalDate startDate;
    private LocalDate endDate;
    private String room;
    private Class.ClassStatus status;
    private Boolean isActive;
    private String optionsJson;
    private String settingsJson;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

