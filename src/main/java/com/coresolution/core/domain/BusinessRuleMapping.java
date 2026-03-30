package com.coresolution.core.domain;

import com.coresolution.consultation.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * 비즈니스 규칙 매핑 엔티티
 * 메타 시스템: 하드코딩된 비즈니스 로직을 DB로 전환
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */
@Entity
@Table(name = "business_rule_mappings",
       indexes = {
           @Index(name = "idx_rule_code", columnList = "rule_code"),
           @Index(name = "idx_rule_type", columnList = "rule_type"),
           @Index(name = "idx_tenant_id", columnList = "tenant_id"),
           @Index(name = "idx_business_type", columnList = "business_type"),
           @Index(name = "idx_is_active", columnList = "is_active"),
           @Index(name = "idx_priority", columnList = "priority"),
           @Index(name = "idx_is_deleted", columnList = "is_deleted")
       },
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_rule_code_tenant", columnNames = {"rule_code", "tenant_id"})
       })
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class BusinessRuleMapping extends BaseEntity {
    
    /**
     * 규칙 코드 (예: ROLE_CHECK_ADMIN, STATUS_TRANSITION_ORDER)
     */
    @Column(name = "rule_code", length = 50, nullable = false)
    private String ruleCode;
    
    /**
     * 규칙 타입 (ROLE_CHECK, STATUS_TRANSITION, CALCULATION, VALIDATION 등)
     */
    @Column(name = "rule_type", length = 50, nullable = false)
    private String ruleType;
    
    /**
     * 테넌트 ID (NULL이면 글로벌 규칙)
     */
    @Column(name = "tenant_id", length = 36)
    private String tenantId;
    
    /**
     * 업종 타입 (NULL이면 모든 업종)
     */
    @Column(name = "business_type", length = 50)
    private String businessType;
    
    /**
     * 조건 정의 (JSON)
     */
    @Column(name = "condition_json", columnDefinition = "JSON")
    private String conditionJson;
    
    /**
     * 실행할 액션 (JSON)
     */
    @Column(name = "action_json", columnDefinition = "JSON")
    private String actionJson;
    
    /**
     * 우선순위 (높을수록 우선)
     */
    @Column(name = "priority", nullable = false)
    private Integer priority = 0;
    
    /**
     * 활성화 여부
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    /**
     * 규칙 설명
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}

