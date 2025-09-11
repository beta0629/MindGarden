package com.mindgarden.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사 급여 옵션 엔티티
 * 상담사별 추가 급여 옵션을 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Entity
@Table(name = "consultant_salary_options", indexes = {
    @Index(name = "idx_consultant_salary_option_profile_id", columnList = "salary_profile_id"),
    @Index(name = "idx_consultant_salary_option_type", columnList = "option_type"),
    @Index(name = "idx_consultant_salary_option_is_active", columnList = "is_active")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantSalaryOption {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull(message = "급여 프로필 ID는 필수입니다.")
    @Column(name = "salary_profile_id", nullable = false)
    private Long salaryProfileId;
    
    @NotNull(message = "옵션 타입은 필수입니다.")
    @Size(max = 50, message = "옵션 타입은 50자 이하여야 합니다.")
    @Column(name = "option_type", length = 50, nullable = false)
    private String optionType; // FAMILY_CONSULTATION, INITIAL_CONSULTATION, etc.
    
    @DecimalMin(value = "0.0", message = "옵션 금액은 0 이상이어야 합니다.")
    @Column(name = "option_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal optionAmount; // 추가 급여 금액
    
    @Size(max = 500, message = "옵션 설명은 500자 이하여야 합니다.")
    @Column(name = "option_description", length = 500)
    private String optionDescription; // 옵션 설명
    
    @Column(name = "is_active")
    private Boolean isActive = true; // 활성화 여부
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // 비즈니스 메서드
    /**
     * 옵션이 활성화되어 있는지 확인
     */
    public boolean isOptionActive() {
        return isActive != null && isActive;
    }
    
    /**
     * 옵션 금액이 설정되어 있는지 확인
     */
    public boolean hasAmount() {
        return optionAmount != null && optionAmount.compareTo(BigDecimal.ZERO) > 0;
    }
}
