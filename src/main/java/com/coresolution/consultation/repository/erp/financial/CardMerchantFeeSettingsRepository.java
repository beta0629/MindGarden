package com.coresolution.consultation.repository.erp.financial;

import java.util.Optional;
import com.coresolution.consultation.entity.erp.financial.CardMerchantFeeSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 카드 가맹점 수수료 설정 Repository.
 *
 * @author CoreSolution
 * @since 2026-08-28
 */
@Repository
public interface CardMerchantFeeSettingsRepository extends JpaRepository<CardMerchantFeeSettings, Long> {

    Optional<CardMerchantFeeSettings> findByTenantIdAndIsDeletedFalse(String tenantId);
}
