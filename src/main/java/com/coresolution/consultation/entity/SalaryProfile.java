package com.coresolution.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "salary_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryProfile extends BaseEntity {
    
    
    @Column(name = "profile_name", nullable = false, length = 100)
    private String profileName;
    
    @Column(name = "description", length = 500)
    private String description;
    
    @Column(name = "base_salary", precision = 15, scale = 2)
    private BigDecimal baseSalary;
    
    @Column(name = "hourly_rate", precision = 10, scale = 2)
    private BigDecimal hourlyRate;
    
    @Column(name = "commission_rate", precision = 5, scale = 4)
    private BigDecimal commissionRate;
    
    @Column(name = "bonus_rate", precision = 5, scale = 4)
    private BigDecimal bonusRate;
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    /**
     * @Deprecated - 🚨 레거시 호환: 브랜치 코드 기반 필터링 사용 금지
     * 레거시 데이터 호환을 위해 필드 유지 (NULL 허용)
     * 새로운 코드에서는 사용하지 마세요. 테넌트 ID만 사용하세요.
      * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
  * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
  * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
  * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
 */
    @Column(name = "branch_code", length = 20)
    private String branchCode;
    
    // @Column(name = "created_by", length = 50)
    private String createdBy;
    
    // @Column(name = "updated_by", length = 50)
    private String updatedBy;
    
    
}
