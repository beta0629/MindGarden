package com.mindgarden.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * ERP 아이템 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    
    /**
     * 활성화된 아이템 목록 조회
     */
    @Query("SELECT i FROM Item i WHERE i.isActive = true AND i.isDeleted = false ORDER BY i.name")
    List<Item> findAllActive();
    
    /**
     * 카테고리별 활성화된 아이템 목록 조회
     */
    @Query("SELECT i FROM Item i WHERE i.isActive = true AND i.isDeleted = false AND i.category = :category ORDER BY i.name")
    List<Item> findByCategoryAndActive(@Param("category") String category);
    
    /**
     * 이름으로 아이템 검색 (활성화된 것만)
     */
    @Query("SELECT i FROM Item i WHERE i.isActive = true AND i.isDeleted = false AND i.name LIKE %:name% ORDER BY i.name")
    List<Item> findByNameContainingAndActive(@Param("name") String name);
    
    /**
     * 재고 부족 아이템 목록 조회
     */
    @Query("SELECT i FROM Item i WHERE i.isActive = true AND i.isDeleted = false AND i.stockQuantity <= :threshold ORDER BY i.stockQuantity")
    List<Item> findLowStockItems(@Param("threshold") Integer threshold);
    
    /**
     * 공급업체별 아이템 목록 조회
     */
    @Query("SELECT i FROM Item i WHERE i.isActive = true AND i.isDeleted = false AND i.supplier = :supplier ORDER BY i.name")
    List<Item> findBySupplierAndActive(@Param("supplier") String supplier);
    
    /**
     * ID로 활성화된 아이템 조회
     */
    @Query("SELECT i FROM Item i WHERE i.id = :id AND i.isActive = true AND i.isDeleted = false")
    Optional<Item> findActiveById(@Param("id") Long id);
    
    /**
     * 카테고리 목록 조회 (중복 제거)
     */
    @Query("SELECT DISTINCT i.category FROM Item i WHERE i.isActive = true AND i.isDeleted = false AND i.category IS NOT NULL ORDER BY i.category")
    List<String> findDistinctCategories();
    
    /**
     * 공급업체 목록 조회 (중복 제거)
     */
    @Query("SELECT DISTINCT i.supplier FROM Item i WHERE i.isActive = true AND i.isDeleted = false AND i.supplier IS NOT NULL ORDER BY i.supplier")
    List<String> findDistinctSuppliers();
}
