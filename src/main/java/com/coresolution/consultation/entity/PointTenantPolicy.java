package com.coresolution.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 테넌트별 포인트·리워드 정책 행.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Entity
@Table(name = "point_tenant_policies", uniqueConstraints = {
    @UniqueConstraint(name = "uk_point_policy_tenant_key", columnNames = {"tenant_id", "policy_key"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointTenantPolicy extends BaseEntity {

    @Column(name = "policy_key", nullable = false, length = 64)
    private String policyKey;

    @Column(name = "value_json", nullable = false, columnDefinition = "JSON")
    private String valueJson;
}
