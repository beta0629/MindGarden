package com.coresolution.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * 모바일 푸시 카테고리 설정 (사용자·테넌트당 1행).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Entity
@Table(
        name = "mobile_push_settings",
        uniqueConstraints = {
            @UniqueConstraint(name = "uk_mps_tenant_user", columnNames = {"tenant_id", "user_id"})
        },
        indexes = {
            @Index(name = "idx_mps_tenant_user", columnList = "tenant_id,user_id")
        }
)
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class MobilePushSettings extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "schedule_enabled", nullable = false)
    private boolean scheduleEnabled = true;

    @Column(name = "payment_enabled", nullable = false)
    private boolean paymentEnabled = true;

    @Column(name = "message_enabled", nullable = false)
    private boolean messageEnabled = true;

    @Column(name = "wellness_enabled", nullable = false)
    private boolean wellnessEnabled = true;

    @Column(name = "system_enabled", nullable = false)
    private boolean systemEnabled = true;
}
