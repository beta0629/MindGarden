package com.mindgarden.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * 코드 그룹 엔티티
 * 상담 유형, 상태값 등의 코드 그룹을 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "code_groups", indexes = {
    @Index(name = "idx_code_groups_code", columnList = "code"),
    @Index(name = "idx_code_groups_is_deleted", columnList = "is_deleted")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class CodeGroup extends BaseEntity {
    
    @NotBlank(message = "코드 그룹 코드는 필수입니다.")
    @Size(max = 50, message = "코드 그룹 코드는 50자 이하여야 합니다.")
    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;
    
    @NotBlank(message = "코드 그룹명은 필수입니다.")
    @Size(max = 100, message = "코드 그룹명은 100자 이하여야 합니다.")
    @Column(name = "name", nullable = false, length = 100)
    private String name;
    
    @Size(max = 500, message = "설명은 500자 이하여야 합니다.")
    @Column(name = "description", length = 500)
    private String description;
    
    @Column(name = "sort_order")
    private Integer sortOrder;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
