package com.coresolution.consultation.entity;

import com.coresolution.consultation.constant.PointLedgerEntryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 포인트 원장 (append-only, 멱등 키).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Entity
@Table(name = "client_point_ledger_entries", uniqueConstraints = {
    @UniqueConstraint(name = "uk_client_point_ledger_idem", columnNames = {"tenant_id", "idempotency_key"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientPointLedgerEntry extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "order_public_id", length = 36)
    private String orderPublicId;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 32)
    private PointLedgerEntryType entryType;

    @Column(name = "amount_minor", nullable = false)
    private Long amountMinor;

    @Column(name = "idempotency_key", nullable = false, length = 160)
    private String idempotencyKey;
}
