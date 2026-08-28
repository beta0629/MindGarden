package com.coresolution.consultation.repository.erp.financial;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.erp.financial.CardMerchantFeeIssuerRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 카드사별 가맹점 수수료 요율 Repository.
 *
 * @author CoreSolution
 * @since 2026-08-28
 */
@Repository
public interface CardMerchantFeeIssuerRateRepository extends JpaRepository<CardMerchantFeeIssuerRate, Long> {

    List<CardMerchantFeeIssuerRate> findByTenantIdAndSettingsIdAndIsDeletedFalseOrderBySortOrderAsc(
            String tenantId, Long settingsId);

    Optional<CardMerchantFeeIssuerRate> findByTenantIdAndSettingsIdAndIssuerLabelAndIsDeletedFalse(
            String tenantId, Long settingsId, String issuerLabel);
}
