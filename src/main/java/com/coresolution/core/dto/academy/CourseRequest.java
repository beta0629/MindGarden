package com.coresolution.core.dto.academy;

import com.coresolution.core.domain.academy.Course;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 강좌 생성/수정 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseRequest {
    
    /**
     * 지점 ID (NULL이면 전체 지점 공통)
     */
    private Long branchId;
    
    /**
     * 강좌명
     */
    @NotBlank(message = "강좌명은 필수입니다")
    @Size(max = 255, message = "강좌명은 255자 이하여야 합니다")
    private String name;
    
    /**
     * 강좌명 (한글)
     */
    @Size(max = 255, message = "강좌명(한글)은 255자 이하여야 합니다")
    private String nameKo;
    
    /**
     * 강좌명 (영문)
     */
    @Size(max = 255, message = "강좌명(영문)은 255자 이하여야 합니다")
    private String nameEn;
    
    /**
     * 강좌 설명
     */
    private String description;
    
    /**
     * 강좌 설명 (한글)
     */
    private String descriptionKo;
    
    /**
     * 강좌 설명 (영문)
     */
    private String descriptionEn;
    
    /**
     * 카테고리 코드
     */
    @Size(max = 50, message = "카테고리는 50자 이하여야 합니다")
    private String category;
    
    /**
     * 레벨
     */
    @Size(max = 50, message = "레벨은 50자 이하여야 합니다")
    private String level;
    
    /**
     * 과목
     */
    @Size(max = 100, message = "과목은 100자 이하여야 합니다")
    private String subject;
    
    /**
     * 가격 정책
     */
    @NotNull(message = "가격 정책은 필수입니다")
    private Course.PricingPolicy pricingPolicy;
    
    /**
     * 기본 가격
     */
    private BigDecimal basePrice;
    
    /**
     * 통화
     */
    @Size(max = 10, message = "통화는 10자 이하여야 합니다")
    private String currency;
    
    /**
     * 가격 상세 정보 (JSON)
     */
    private String pricingDetailsJson;
    
    /**
     * 수강 기간 (월)
     */
    private Integer durationMonths;
    
    /**
     * 총 수업 횟수
     */
    private Integer totalSessions;
    
    /**
     * 수업 시간 (분)
     */
    private Integer sessionDurationMinutes;
    
    /**
     * 활성화 여부
     */
    private Boolean isActive;
    
    /**
     * 표시 순서
     */
    private Integer displayOrder;
    
    /**
     * 추가 메타데이터 (JSON)
     */
    private String metadataJson;
    
    /**
     * 강좌별 설정 (JSON)
     */
    private String settingsJson;
}

