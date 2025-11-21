package com.coresolution.core.domain.academy;

import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.coresolution.consultation.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * 강좌 엔티티
 * 학원 시스템의 강좌 정보를 관리하는 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Entity
@Table(name = "courses", indexes = {
    @Index(name = "idx_course_id", columnList = "course_id"),
    @Index(name = "idx_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_branch_id", columnList = "branch_id"),
    @Index(name = "idx_tenant_branch", columnList = "tenant_id,branch_id"),
    @Index(name = "idx_category", columnList = "category"),
    @Index(name = "idx_subject", columnList = "subject"),
    @Index(name = "idx_is_active", columnList = "is_active"),
    @Index(name = "idx_is_deleted", columnList = "is_deleted")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Course extends BaseEntity {
    
    /**
     * 가격 정책 열거형
     */
    public enum PricingPolicy {
        FIXED("고정 가격"),
        PER_SESSION("회차별 가격"),
        PACKAGE("패키지 가격");
        
        private final String description;
        
        PricingPolicy(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    // === 기본 정보 ===
    
    /**
     * 강좌 UUID (고유 식별자)
     */
    @NotBlank(message = "강좌 ID는 필수입니다")
    @Size(max = 36, message = "강좌 ID는 36자 이하여야 합니다")
    @Column(name = "course_id", nullable = false, unique = true, length = 36, updatable = false)
    private String courseId;
    
    /**
     * 지점 ID (NULL이면 전체 지점 공통)
     */
    @Column(name = "branch_id")
    private Long branchId;
    
    /**
     * 강좌명
     */
    @NotBlank(message = "강좌명은 필수입니다")
    @Size(max = 255, message = "강좌명은 255자 이하여야 합니다")
    @Column(name = "name", nullable = false, length = 255)
    private String name;
    
    /**
     * 강좌명 (한글)
     */
    @Size(max = 255, message = "강좌명(한글)은 255자 이하여야 합니다")
    @Column(name = "name_ko", length = 255)
    private String nameKo;
    
    /**
     * 강좌명 (영문)
     */
    @Size(max = 255, message = "강좌명(영문)은 255자 이하여야 합니다")
    @Column(name = "name_en", length = 255)
    private String nameEn;
    
    /**
     * 강좌 설명
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    /**
     * 강좌 설명 (한글)
     */
    @Column(name = "description_ko", columnDefinition = "TEXT")
    private String descriptionKo;
    
    /**
     * 강좌 설명 (영문)
     */
    @Column(name = "description_en", columnDefinition = "TEXT")
    private String descriptionEn;
    
    // === 카테고리 및 분류 ===
    
    /**
     * 카테고리 코드
     */
    @Size(max = 50, message = "카테고리는 50자 이하여야 합니다")
    @Column(name = "category", length = 50)
    private String category;
    
    /**
     * 레벨 (초급, 중급, 고급 등)
     */
    @Size(max = 50, message = "레벨은 50자 이하여야 합니다")
    @Column(name = "level", length = 50)
    private String level;
    
    /**
     * 과목 (수학, 영어, 과학 등)
     */
    @Size(max = 100, message = "과목은 100자 이하여야 합니다")
    @Column(name = "subject", length = 100)
    private String subject;
    
    // === 가격 정책 ===
    
    /**
     * 가격 정책
     */
    @NotNull(message = "가격 정책은 필수입니다")
    @Enumerated(EnumType.STRING)
    @Column(name = "pricing_policy", nullable = false, length = 50)
    @Builder.Default
    private PricingPolicy pricingPolicy = PricingPolicy.FIXED;
    
    /**
     * 기본 가격
     */
    @Column(name = "base_price", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal basePrice = BigDecimal.ZERO;
    
    /**
     * 통화
     */
    @Size(max = 10, message = "통화는 10자 이하여야 합니다")
    @Column(name = "currency", length = 10)
    @Builder.Default
    private String currency = "KRW";
    
    /**
     * 가격 상세 정보 (JSON)
     */
    @Column(name = "pricing_details_json", columnDefinition = "JSON")
    private String pricingDetailsJson;
    
    // === 수강 정보 ===
    
    /**
     * 수강 기간 (월)
     */
    @Column(name = "duration_months")
    private Integer durationMonths;
    
    /**
     * 총 수업 횟수
     */
    @Column(name = "total_sessions")
    private Integer totalSessions;
    
    /**
     * 수업 시간 (분)
     */
    @Column(name = "session_duration_minutes")
    private Integer sessionDurationMinutes;
    
    // === 상태 정보 ===
    
    /**
     * 활성화 여부
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    /**
     * 표시 순서
     */
    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;
    
    // === 메타데이터 ===
    
    /**
     * 추가 메타데이터 (JSON)
     */
    @Column(name = "metadata_json", columnDefinition = "JSON")
    private String metadataJson;
    
    /**
     * 강좌별 설정 (JSON)
     */
    @Column(name = "settings_json", columnDefinition = "JSON")
    private String settingsJson;
    
    /**
     * 생성자
     */
    @Column(name = "created_by", length = 100)
    private String createdBy;
    
    /**
     * 수정자
     */
    @Column(name = "updated_by", length = 100)
    private String updatedBy;
    
    // === 비즈니스 메서드 ===
    
    /**
     * 강좌가 활성 상태인지 확인
     */
    public boolean isActiveCourse() {
        return isActive != null && isActive && !isDeleted();
    }
    
    /**
     * 전체 지점 공통 강좌인지 확인
     */
    public boolean isCommonCourse() {
        return branchId == null;
    }
}

