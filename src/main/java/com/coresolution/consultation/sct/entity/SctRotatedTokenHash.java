package com.coresolution.consultation.sct.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * SCT 공개 토큰 회전 이력(해시만 저장).
 *
 * @author MindGarden
 * @since 2026-11-24
 */
@Entity
@Table(name = "sct_rotated_token_hashes", uniqueConstraints = {
    @UniqueConstraint(name = "uk_sct_rotated_token_hash", columnNames = "token_hash")
}, indexes = {
    @Index(name = "idx_sct_rotated_tenant_inv", columnList = "tenant_id,invitation_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctRotatedTokenHash {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "invitation_id", nullable = false)
    private Long invitationId;

    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    @Column(name = "rotated_at", nullable = false)
    private LocalDateTime rotatedAt;

    @PrePersist
    void prePersist() {
        if (rotatedAt == null) {
            rotatedAt = LocalDateTime.now();
        }
    }
}
