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
 * 포인트 지갑 (가용·예약).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Entity
@Table(name = "client_point_wallets", uniqueConstraints = {
    @UniqueConstraint(name = "uk_client_point_wallet", columnNames = {"tenant_id", "user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientPointWallet extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "available_minor", nullable = false)
    @Builder.Default
    private Long availableMinor = 0L;

    @Column(name = "held_minor", nullable = false)
    @Builder.Default
    private Long heldMinor = 0L;
}
