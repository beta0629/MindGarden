package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * ERP 구매 주문 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    
    /**
     * 주문 번호로 구매 주문 조회
     */
    @Query("SELECT po FROM PurchaseOrder po WHERE po.orderNumber = :orderNumber")
    Optional<PurchaseOrder> findByOrderNumber(@Param("orderNumber") String orderNumber);
    
    /**
     * 상태별 구매 주문 목록 조회 (tenantId 필터링 필수)
     */
    @Query("SELECT po FROM PurchaseOrder po WHERE po.tenantId = :tenantId AND po.status = :status ORDER BY po.createdAt DESC")
    List<PurchaseOrder> findByTenantIdAndStatus(@Param("tenantId") String tenantId, @Param("status") PurchaseOrder.PurchaseOrderStatus status);
    
    /**
     * @Deprecated - 🚨 보안 위험: 모든 테넌트 주문 정보 노출!
     */
    @Deprecated
    @Query("SELECT po FROM PurchaseOrder po WHERE po.status = :status ORDER BY po.createdAt DESC")
    List<PurchaseOrder> findByStatus(@Param("status") PurchaseOrder.PurchaseOrderStatus status);
    
    /**
     * 테넌트별 구매자별 구매 주문 목록 조회 (테넌트 필터링)
     */
    @Query("SELECT po FROM PurchaseOrder po WHERE po.tenantId = :tenantId AND po.purchaser.id = :purchaserId ORDER BY po.createdAt DESC")
    List<PurchaseOrder> findByTenantIdAndPurchaserId(@Param("tenantId") String tenantId, @Param("purchaserId") Long purchaserId);
    
    /**
     * 구매자별 구매 주문 목록 조회
     * @Deprecated 테넌트 필터링 없음! findByTenantIdAndPurchaserId() 사용 권장
     */
    @Deprecated
    @Query("SELECT po FROM PurchaseOrder po WHERE po.purchaser.id = :purchaserId ORDER BY po.createdAt DESC")
    List<PurchaseOrder> findByPurchaserId(@Param("purchaserId") Long purchaserId);
    
    /**
     * 테넌트별 주문 번호로 구매 주문 조회 (테넌트 필터링)
     */
    @Query("SELECT po FROM PurchaseOrder po WHERE po.tenantId = :tenantId AND po.orderNumber = :orderNumber")
    Optional<PurchaseOrder> findByTenantIdAndOrderNumber(@Param("tenantId") String tenantId, @Param("orderNumber") String orderNumber);
    
    /**
     * 공급업체별 구매 주문 목록 조회
     */
    @Query("SELECT po FROM PurchaseOrder po WHERE po.supplier = :supplier ORDER BY po.createdAt DESC")
    List<PurchaseOrder> findBySupplier(@Param("supplier") String supplier);
    
    /**
     * 기간별 구매 주문 목록 조회
     */
    @Query("SELECT po FROM PurchaseOrder po WHERE po.createdAt BETWEEN :startDate AND :endDate ORDER BY po.createdAt DESC")
    List<PurchaseOrder> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * 배송 예정일별 구매 주문 목록 조회
     */
    @Query("SELECT po FROM PurchaseOrder po WHERE po.expectedDeliveryDate BETWEEN :startDate AND :endDate ORDER BY po.expectedDeliveryDate ASC")
    List<PurchaseOrder> findByExpectedDeliveryDateBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * 월별 구매 주문 통계
     */
    @Query("SELECT COUNT(po), SUM(po.totalAmount) FROM PurchaseOrder po WHERE YEAR(po.createdAt) = :year AND MONTH(po.createdAt) = :month")
    Object[] getMonthlyStats(@Param("year") int year, @Param("month") int month);
    
    /**
     * 상태별 구매 주문 통계
     */
    @Query("SELECT po.status, COUNT(po), SUM(po.totalAmount) FROM PurchaseOrder po GROUP BY po.status")
    List<Object[]> getStatsByStatus();
    
    /**
     * 공급업체별 구매 주문 통계
     */
    @Query("SELECT po.supplier, COUNT(po), SUM(po.totalAmount) FROM PurchaseOrder po GROUP BY po.supplier ORDER BY SUM(po.totalAmount) DESC")
    List<Object[]> getStatsBySupplier();
    
    /**
     * 테넌트별 ID로 구매 주문 조회 (연관 엔티티 포함, 테넌트 필터링)
     */
    @Query("SELECT po FROM PurchaseOrder po LEFT JOIN FETCH po.purchaseRequest pr LEFT JOIN FETCH pr.requester LEFT JOIN FETCH pr.item LEFT JOIN FETCH po.purchaser WHERE po.tenantId = :tenantId AND po.id = :id")
    Optional<PurchaseOrder> findByTenantIdAndIdWithDetails(@Param("tenantId") String tenantId, @Param("id") Long id);
    
    /**
     * ID로 구매 주문 조회 (연관 엔티티 포함)
     * @Deprecated 테넌트 필터링 없음! findByTenantIdAndIdWithDetails() 사용 권장
     */
    @Deprecated
    @Query("SELECT po FROM PurchaseOrder po LEFT JOIN FETCH po.purchaseRequest pr LEFT JOIN FETCH pr.requester LEFT JOIN FETCH pr.item LEFT JOIN FETCH po.purchaser WHERE po.id = :id")
    Optional<PurchaseOrder> findByIdWithDetails(@Param("id") Long id);
    
    /**
     * 최근 주문 번호 조회 (중복 방지용)
     */
    @Query("SELECT po.orderNumber FROM PurchaseOrder po WHERE po.orderNumber LIKE :prefix ORDER BY po.orderNumber DESC")
    List<String> findOrderNumbersByPrefix(@Param("prefix") String prefix);
    
    /**
     * 테넌트별 활성화된 구매 주문 조회 (테넌트 필터링)
     */
    @Query("SELECT po FROM PurchaseOrder po WHERE po.tenantId = :tenantId AND po.isActive = true ORDER BY po.createdAt DESC")
    List<PurchaseOrder> findAllActiveByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 모든 활성화된 구매 주문 조회
     * @Deprecated 테넌트 필터링 없음! findAllActiveByTenantId() 사용 권장
     */
    @Deprecated
    @Query("SELECT po FROM PurchaseOrder po WHERE po.isActive = true ORDER BY po.createdAt DESC")
    List<PurchaseOrder> findAllActive();
}
