package com.coresolution.core.service;

import java.util.List;
import java.util.Optional;
import com.coresolution.core.domain.BusinessCategory;
import com.coresolution.core.domain.BusinessCategoryItem;

/**
 * 업종 카테고리 서비스 인터페이스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface BusinessCategoryService {
    
    /**
     * 활성화된 모든 카테고리 조회
     */
    List<BusinessCategory> getAllActiveCategories();
    
    /**
     * 카테고리 ID로 조회
     */
    Optional<BusinessCategory> getCategoryById(String categoryId);
    
    /**
     * 카테고리 코드로 조회
     */
    Optional<BusinessCategory> getCategoryByCode(String categoryCode);
    
    /**
     * 레벨별 카테고리 조회
     */
    List<BusinessCategory> getCategoriesByLevel(Integer level);
    
    /**
     * 루트 카테고리 조회 (상위 카테고리가 없는 카테고리)
     */
    List<BusinessCategory> getRootCategories();
    
    /**
     * 상위 카테고리 ID로 하위 카테고리 조회
     */
    List<BusinessCategory> getChildCategories(String parentCategoryId);
    
    /**
     * 활성화된 모든 카테고리 아이템 조회
     */
    List<BusinessCategoryItem> getAllActiveCategoryItems();
    
    /**
     * 카테고리 ID로 활성화된 아이템 조회
     */
    List<BusinessCategoryItem> getCategoryItemsByCategoryId(String categoryId);
    
    /**
     * business_type으로 카테고리 아이템 조회
     */
    Optional<BusinessCategoryItem> getCategoryItemByBusinessType(String businessType);
    
    /**
     * business_type 유효성 검증
     */
    boolean isValidBusinessType(String businessType);
    
    /**
     * business_type으로 카테고리 정보 조회 (카테고리 + 아이템)
     */
    Optional<BusinessCategoryItem> getCategoryInfoByBusinessType(String businessType);
}

