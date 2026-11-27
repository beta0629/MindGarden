package com.coresolution.consultation.sct.entity;

import java.time.LocalDateTime;
import com.coresolution.consultation.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * SCT 단축 링크(SMS/QR). short_code 전역 유일.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@Entity
@Table(name = "sct_short_links", uniqueConstraints = {
    @UniqueConstraint(name = "uk_sct_short_code", columnNames = "short_code")
}, indexes = {
    @Index(name = "idx_sct_short_tenant_inv", columnList = "tenant_id,invitation_id"),
    @Index(name = "idx_sct_short_tenant_active", columnList = "tenant_id,is_active,expires_at")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class SctShortLink extends BaseEntity {

    @Column(name = "invitation_id", nullable = false)
    private Long invitationId;

    @Column(name = "short_code", nullable = false, length = 8)
    private String shortCode;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
