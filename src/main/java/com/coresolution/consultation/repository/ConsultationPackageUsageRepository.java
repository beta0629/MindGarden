package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.ShopClientOrderLine;
import java.util.Collection;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

/**
 * 상담 패키지(공통코드 CONSULTATION_PACKAGE) 사용 이력 조회 — 삭제 가능 여부 판단용 (읽기 전용).
 *
 * @author CoreSolution
 * @since 2026-10-12
 */
public interface ConsultationPackageUsageRepository extends Repository<ShopClientOrderLine, Long> {

    /** 주문·결제 이력: 해당 패키지에서 나온 SKU 로 만들어진 주문 줄 수 */
    @Query("SELECT COUNT(l) FROM ShopClientOrderLine l WHERE l.tenantId = :tenantId "
            + "AND l.isDeleted = false AND l.skuCodeSnapshot IN :skuCodes")
    long countOrderLinesBySkuCodes(@Param("tenantId") String tenantId, @Param("skuCodes") Collection<String> skuCodes);

    /** 회기 이력: 해당 패키지명·SKU 로 만들어진 상담 매칭 수 */
    @Query("SELECT COUNT(m) FROM ConsultantClientMapping m WHERE m.tenantId = :tenantId "
            + "AND m.isDeleted = false AND m.packageName IN :packageNames")
    long countMappingsByPackageNames(
            @Param("tenantId") String tenantId, @Param("packageNames") Collection<String> packageNames);
}
