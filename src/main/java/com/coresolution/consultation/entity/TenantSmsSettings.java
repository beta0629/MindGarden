package com.coresolution.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 테넌트별 SMS 비시크릿 설정(프로바이더·발신번호·시크릿 참조 ID만).
 *
 * @author CoreSolution
 * @since 2026-04-25
 */
@Entity
@Table(
    name = "tenant_sms_settings",
    uniqueConstraints = @UniqueConstraint(name = "uk_tenant_sms_settings_tenant", columnNames = "tenant_id"),
    indexes = {
        @Index(name = "idx_tss_tenant_deleted", columnList = "tenant_id,is_deleted")
    }
)
@Data
public class TenantSmsSettings extends BaseEntity {

    @NotNull
    @Column(name = "sms_enabled", nullable = false)
    private Boolean smsEnabled = Boolean.TRUE;

    @Size(max = 120)
    @Column(name = "provider", length = 120)
    private String provider;

    @Size(max = 32)
    @Column(name = "sender_number", length = 32)
    private String senderNumber;

    @Size(max = 200)
    @Column(name = "api_key_ref", length = 200)
    private String apiKeyRef;

    @Size(max = 200)
    @Column(name = "api_secret_ref", length = 200)
    private String apiSecretRef;
}
