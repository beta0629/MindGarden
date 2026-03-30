package com.coresolution.core.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.core.domain.BusinessCategoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 업종 카테고리 아이템 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Repository
public interface BusinessCategoryItemRepository extends JpaRepository<BusinessCategoryItem, Long> {
    
    /**
     * 아이템 ID로 조회
     */
    Optional<BusinessCategoryItem> findByItemId(String itemId);
    
    /**
     * 아이템 코드로 조회
     */
    Optional<BusinessCategoryItem> findByItemCode(String itemCode);
    
    /**
     * business_type으로 조회
     */
    Optional<BusinessCategoryItem> findByBusinessType(String businessType);
    
    /**
     * 카테고리 ID로 활성화된 아이템 조회
     */
    @Query("SELECT i FROM BusinessCategoryItem i WHERE i.categoryId = :categoryId AND i.isActive = true AND i.isDeleted = false ORDER BY i.displayOrder ASC, i.nameKo ASC")
    List<BusinessCategoryItem> findByCategoryIdAndActive(@Param("categoryId") String categoryId);
    
    /**
     * 활성화된 모든 아이템 조회
     */
    @Query("SELECT i FROM BusinessCategoryItem i WHERE i.isActive = true AND i.isDeleted = false ORDER BY i.displayOrder ASC, i.nameKo ASC")
    List<BusinessCategoryItem> findAllActiveOrderByDisplayOrder();
    
    /**
     * business_type으로 활성화된 아이템 조회
     */
    @Query("SELECT i FROM BusinessCategoryItem i WHERE i.businessType = :businessType AND i.isActive = true AND i.isDeleted = false")
    Optional<BusinessCategoryItem> findByBusinessTypeAndActive(@Param("businessType") String businessType);
}

