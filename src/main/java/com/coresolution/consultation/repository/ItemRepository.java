package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * ERP 아이템 Repository
 * 
 * 표준화 2025-12-07: 테넌트 필터링 추가 (보안 강화)
 * - 모든 조회 메서드에 tenantId 필터링 적용
 * - 테넌트 격리 원칙 준수
 * 
 * @author MindGarden
 * @version 1.1.0
 * @since 2024-12-19
 */
@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    
    /**
     * 테넌트별 활성화된 아이템 목록 조회
     * 표준화 2025-12-07: 테넌트 필터링 추가
     * 
     * @param tenantId 테넌트 UUID
     * @return 활성화된 아이템 목록
     */
    @Query("SELECT i FROM Item i WHERE i.tenantId = :tenantId AND i.isActive = true AND i.isDeleted = false ORDER BY i.name")
    List<Item> findAllActiveByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * @deprecated 테넌트 필터링 없음 (보안 위험) - findAllActiveByTenantId 사용 권장
     * 표준화 2025-12-07: 레거시 호환용으로 유지, 새로운 코드에서는 사용 금지
     */
    @Deprecated
    @Query("SELECT i FROM Item i WHERE i.isActive = true AND i.isDeleted = false ORDER BY i.name")
    List<Item> findAllActive();
    
    /**
     * 테넌트별 카테고리별 활성화된 아이템 목록 조회
     * 표준화 2025-12-07: 테넌트 필터링 추가
     * 
     * @param tenantId 테넌트 UUID
     * @param category 카테고리
     * @return 활성화된 아이템 목록
     */
    @Query("SELECT i FROM Item i WHERE i.tenantId = :tenantId AND i.isActive = true AND i.isDeleted = false AND i.category = :category ORDER BY i.name")
    List<Item> findByTenantIdAndCategoryAndActive(@Param("tenantId") String tenantId, @Param("category") String category);
    
    /**
     * @deprecated 테넌트 필터링 없음 - findByTenantIdAndCategoryAndActive 사용 권장
     */
    @Deprecated
    @Query("SELECT i FROM Item i WHERE i.isActive = true AND i.isDeleted = false AND i.category = :category ORDER BY i.name")
    List<Item> findByCategoryAndActive(@Param("category") String category);
    
    /**
     * 테넌트별 이름으로 아이템 검색 (활성화된 것만)
     * 표준화 2025-12-07: 테넌트 필터링 추가
     * 
     * @param tenantId 테넌트 UUID
     * @param name 검색어
     * @return 활성화된 아이템 목록
     */
    @Query("SELECT i FROM Item i WHERE i.tenantId = :tenantId AND i.isActive = true AND i.isDeleted = false AND i.name LIKE %:name% ORDER BY i.name")
    List<Item> findByTenantIdAndNameContainingAndActive(@Param("tenantId") String tenantId, @Param("name") String name);
    
    /**
     * @deprecated 테넌트 필터링 없음 - findByTenantIdAndNameContainingAndActive 사용 권장
     */
    @Deprecated
    @Query("SELECT i FROM Item i WHERE i.isActive = true AND i.isDeleted = false AND i.name LIKE %:name% ORDER BY i.name")
    List<Item> findByNameContainingAndActive(@Param("name") String name);
    
    /**
     * 테넌트별 재고 부족 아이템 목록 조회
     * 표준화 2025-12-07: 테넌트 필터링 추가
     * 
     * @param tenantId 테넌트 UUID
     * @param threshold 재고 임계값
     * @return 재고 부족 아이템 목록
     */
    @Query("SELECT i FROM Item i WHERE i.tenantId = :tenantId AND i.isActive = true AND i.isDeleted = false AND i.stockQuantity <= :threshold ORDER BY i.stockQuantity")
    List<Item> findLowStockItemsByTenantId(@Param("tenantId") String tenantId, @Param("threshold") Integer threshold);
    
    /**
     * @deprecated 테넌트 필터링 없음 - findLowStockItemsByTenantId 사용 권장
     */
    @Deprecated
    @Query("SELECT i FROM Item i WHERE i.isActive = true AND i.isDeleted = false AND i.stockQuantity <= :threshold ORDER BY i.stockQuantity")
    List<Item> findLowStockItems(@Param("threshold") Integer threshold);
    
    /**
     * 테넌트별 공급업체별 아이템 목록 조회
     * 표준화 2025-12-07: 테넌트 필터링 추가
     * 
     * @param tenantId 테넌트 UUID
     * @param supplier 공급업체
     * @return 활성화된 아이템 목록
     */
    @Query("SELECT i FROM Item i WHERE i.tenantId = :tenantId AND i.isActive = true AND i.isDeleted = false AND i.supplier = :supplier ORDER BY i.name")
    List<Item> findByTenantIdAndSupplierAndActive(@Param("tenantId") String tenantId, @Param("supplier") String supplier);
    
    /**
     * @deprecated 테넌트 필터링 없음 - findByTenantIdAndSupplierAndActive 사용 권장
     */
    @Deprecated
    @Query("SELECT i FROM Item i WHERE i.isActive = true AND i.isDeleted = false AND i.supplier = :supplier ORDER BY i.name")
    List<Item> findBySupplierAndActive(@Param("supplier") String supplier);
    
    /**
     * 테넌트별 ID로 활성화된 아이템 조회
     * 표준화 2025-12-07: 테넌트 필터링 추가
     * 
     * @param tenantId 테넌트 UUID
     * @param id 아이템 ID
     * @return 아이템 Optional
     */
    @Query("SELECT i FROM Item i WHERE i.tenantId = :tenantId AND i.id = :id AND i.isActive = true AND i.isDeleted = false")
    Optional<Item> findByTenantIdAndIdAndActive(@Param("tenantId") String tenantId, @Param("id") Long id);
    
    /**
     * @deprecated 테넌트 필터링 없음 - findByTenantIdAndIdAndActive 사용 권장
     */
    @Deprecated
    @Query("SELECT i FROM Item i WHERE i.id = :id AND i.isActive = true AND i.isDeleted = false")
    Optional<Item> findActiveById(@Param("id") Long id);
    
    /**
     * 테넌트별 카테고리 목록 조회 (중복 제거)
     * 표준화 2025-12-07: 테넌트 필터링 추가
     * 
     * @param tenantId 테넌트 UUID
     * @return 카테고리 목록
     */
    @Query("SELECT DISTINCT i.category FROM Item i WHERE i.tenantId = :tenantId AND i.isActive = true AND i.isDeleted = false AND i.category IS NOT NULL ORDER BY i.category")
    List<String> findDistinctCategoriesByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * @deprecated 테넌트 필터링 없음 - findDistinctCategoriesByTenantId 사용 권장
     */
    @Deprecated
    @Query("SELECT DISTINCT i.category FROM Item i WHERE i.isActive = true AND i.isDeleted = false AND i.category IS NOT NULL ORDER BY i.category")
    List<String> findDistinctCategories();
    
    /**
     * 테넌트별 공급업체 목록 조회 (중복 제거)
     * 표준화 2025-12-07: 테넌트 필터링 추가
     * 
     * @param tenantId 테넌트 UUID
     * @return 공급업체 목록
     */
    @Query("SELECT DISTINCT i.supplier FROM Item i WHERE i.tenantId = :tenantId AND i.isActive = true AND i.isDeleted = false AND i.supplier IS NOT NULL ORDER BY i.supplier")
    List<String> findDistinctSuppliersByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * @deprecated 테넌트 필터링 없음 - findDistinctSuppliersByTenantId 사용 권장
     */
    @Deprecated
    @Query("SELECT DISTINCT i.supplier FROM Item i WHERE i.isActive = true AND i.isDeleted = false AND i.supplier IS NOT NULL ORDER BY i.supplier")
    List<String> findDistinctSuppliers();
}
