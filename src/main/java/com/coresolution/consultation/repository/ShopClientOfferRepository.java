package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.ShopClientOffer;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 내담자별 지정 상품 조회.
 *
 * @author MindGarden
 * @since 2026-10-12
 */
public interface ShopClientOfferRepository extends JpaRepository<ShopClientOffer, Long> {

    /**
     * 같은 내담자의 동시 지정을 직렬화한다 (users 행 잠금). 트랜잭션의 첫 조회로 호출해야
     * 이후 중복 검사가 먼저 커밋된 지정을 본다.
     *
     * @param tenantId 테넌트 ID
     * @param clientId 내담자 users.id
     * @return 잠근 행 id (없으면 빈 목록)
     */
    @Query(value = "SELECT u.id FROM users u WHERE u.tenant_id = :tenantId AND u.id = :clientId FOR UPDATE",
            nativeQuery = true)
    List<Long> lockClientRow(@Param("tenantId") String tenantId, @Param("clientId") Long clientId);

    List<ShopClientOffer> findByTenantIdAndClientIdAndSourceSkuCodeAndStatusAndIsDeletedFalse(
            String tenantId, Long clientId, String sourceSkuCode, String status);

    List<ShopClientOffer> findByTenantIdAndClientIdAndIsDeletedFalseOrderByIdDesc(String tenantId, Long clientId);

    List<ShopClientOffer> findByTenantIdAndClientIdAndStatusAndIsDeletedFalseOrderByIdDesc(
            String tenantId, Long clientId, String status);

    Optional<ShopClientOffer> findByTenantIdAndIdAndIsDeletedFalse(String tenantId, Long id);
}
