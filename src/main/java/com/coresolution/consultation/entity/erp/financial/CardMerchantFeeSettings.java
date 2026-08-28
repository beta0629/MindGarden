package com.coresolution.consultation.entity.erp.financial;

import java.math.BigDecimal;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import com.coresolution.consultation.entity.BaseEntity;

/**
 * 카드 가맹점 수수료 설정 (테넌트당 1건).
 *
 * @author CoreSolution
 * @since 2026-08-28
 */
@Entity
@Table(name = "card_merchant_fee_settings", indexes = {
        @Index(name = "idx_cmfs_tenant_id", columnList = "tenant_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class CardMerchantFeeSettings extends BaseEntity {

    /**
     * 평균 요율(%). 카드사 미지정·미매칭 시 사용.
     */
    @Column(name = "average_rate_percent", precision = 5, scale = 2)
    private BigDecimal averageRatePercent;
}
