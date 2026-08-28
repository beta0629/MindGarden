package com.coresolution.consultation.entity.erp.financial;

import java.math.BigDecimal;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import com.coresolution.consultation.entity.BaseEntity;

/**
 * 카드사별 가맹점 수수료 요율 (선택적 override).
 *
 * @author CoreSolution
 * @since 2026-08-28
 */
@Entity
@Table(name = "card_merchant_fee_issuer_rates", indexes = {
        @Index(name = "idx_cmfir_tenant_settings", columnList = "tenant_id, settings_id"),
        @Index(name = "idx_cmfir_settings_sort", columnList = "settings_id, sort_order")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class CardMerchantFeeIssuerRate extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "settings_id", nullable = false)
    private CardMerchantFeeSettings settings;

    @Column(name = "issuer_label", nullable = false, length = 50)
    private String issuerLabel;

    @Column(name = "rate_percent", precision = 5, scale = 2)
    private BigDecimal ratePercent;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
}
