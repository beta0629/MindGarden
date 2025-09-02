package com.mindgarden.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * 코드 값 엔티티
 * 코드 그룹에 속하는 개별 코드 값들을 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "code_values", indexes = {
    @Index(name = "idx_code_values_group_code", columnList = "code_group_id, code"),
    @Index(name = "idx_code_values_is_deleted", columnList = "is_deleted")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class CodeValue extends BaseEntity {
    
    @NotNull(message = "코드 그룹은 필수입니다.")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "code_group_id", nullable = false)
    private CodeGroup codeGroup;
    
    @NotBlank(message = "코드 값은 필수입니다.")
    @Size(max = 50, message = "코드 값은 50자 이하여야 합니다.")
    @Column(name = "code", nullable = false, length = 50)
    private String code;
    
    @NotBlank(message = "코드명은 필수입니다.")
    @Size(max = 100, message = "코드명은 100자 이하여야 합니다.")
    @Column(name = "name", nullable = false, length = 100)
    private String name;
    
    @Size(max = 200, message = "설명은 200자 이하여야 합니다.")
    @Column(name = "description", length = 200)
    private String description;
    
    @Column(name = "sort_order")
    private Integer sortOrder;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    // 추가 속성들 (색상, 아이콘 등)
    @Size(max = 20, message = "색상 코드는 20자 이하여야 합니다.")
    @Column(name = "color_code", length = 20)
    private String colorCode;
    
    @Size(max = 50, message = "아이콘은 50자 이하여야 합니다.")
    @Column(name = "icon", length = 50)
    private String icon;
    
    @Column(name = "duration_minutes")
    private Integer durationMinutes; // 상담 유형의 경우 상담 시간
}
