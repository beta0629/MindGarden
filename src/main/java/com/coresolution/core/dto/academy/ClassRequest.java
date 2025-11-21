package com.coresolution.core.dto.academy;

import com.coresolution.core.domain.academy.Class;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 반 생성/수정 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassRequest {
    
    /**
     * 지점 ID
     */
    @NotNull(message = "지점 ID는 필수입니다")
    private Long branchId;
    
    /**
     * 강좌 ID
     */
    @NotBlank(message = "강좌 ID는 필수입니다")
    @Size(max = 36, message = "강좌 ID는 36자 이하여야 합니다")
    private String courseId;
    
    /**
     * 반명
     */
    @NotBlank(message = "반명은 필수입니다")
    @Size(max = 255, message = "반명은 255자 이하여야 합니다")
    private String name;
    
    /**
     * 반명 (한글)
     */
    @Size(max = 255, message = "반명(한글)은 255자 이하여야 합니다")
    private String nameKo;
    
    /**
     * 반명 (영문)
     */
    @Size(max = 255, message = "반명(영문)은 255자 이하여야 합니다")
    private String nameEn;
    
    /**
     * 반 설명
     */
    private String description;
    
    /**
     * 담당 강사 ID
     */
    private Long teacherId;
    
    /**
     * 담당 강사명
     */
    @Size(max = 100, message = "강사명은 100자 이하여야 합니다")
    private String teacherName;
    
    /**
     * 정원
     */
    @NotNull(message = "정원은 필수입니다")
    private Integer capacity;
    
    /**
     * 수업 시작일
     */
    private LocalDate startDate;
    
    /**
     * 수업 종료일
     */
    private LocalDate endDate;
    
    /**
     * 강의실
     */
    @Size(max = 100, message = "강의실은 100자 이하여야 합니다")
    private String room;
    
    /**
     * 반 상태
     */
    private Class.ClassStatus status;
    
    /**
     * 활성화 여부
     */
    private Boolean isActive;
    
    /**
     * 반별 옵션 설정 (JSON)
     */
    private String optionsJson;
    
    /**
     * 반별 설정 (JSON)
     */
    private String settingsJson;
}

