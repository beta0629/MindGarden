package com.coresolution.core.service.impl;

import java.util.List;
import java.util.Optional;
import com.coresolution.core.domain.BusinessCategory;
import com.coresolution.core.domain.BusinessCategoryItem;
import com.coresolution.core.repository.BusinessCategoryRepository;
import com.coresolution.core.repository.BusinessCategoryItemRepository;
import com.coresolution.core.service.BusinessCategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 업종 카테고리 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BusinessCategoryServiceImpl implements BusinessCategoryService {
    
    private final BusinessCategoryRepository categoryRepository;
    private final BusinessCategoryItemRepository categoryItemRepository;
    
    @Override
    @Cacheable(value = "businessCategories", key = "'allActive'")
    public List<BusinessCategory> getAllActiveCategories() {
        log.debug("활성화된 모든 카테고리 조회");
        return categoryRepository.findAllActiveOrderByDisplayOrder();
    }
    
    @Override
    @Cacheable(value = "businessCategories", key = "#categoryId")
    public Optional<BusinessCategory> getCategoryById(String categoryId) {
        log.debug("카테고리 ID로 조회: {}", categoryId);
        return categoryRepository.findByCategoryId(categoryId);
    }
    
    @Override
    @Cacheable(value = "businessCategories", key = "'code:' + #categoryCode")
    public Optional<BusinessCategory> getCategoryByCode(String categoryCode) {
        log.debug("카테고리 코드로 조회: {}", categoryCode);
        return categoryRepository.findByCategoryCode(categoryCode);
    }
    
    @Override
    @Cacheable(value = "businessCategories", key = "'level:' + #level")
    public List<BusinessCategory> getCategoriesByLevel(Integer level) {
        log.debug("레벨별 카테고리 조회: level={}", level);
        return categoryRepository.findByLevelAndActive(level);
    }
    
    @Override
    @Cacheable(value = "businessCategories", key = "'root'")
    public List<BusinessCategory> getRootCategories() {
        log.debug("루트 카테고리 조회");
        return categoryRepository.findRootCategories();
    }
    
    @Override
    @Cacheable(value = "businessCategories", key = "'parent:' + #parentCategoryId")
    public List<BusinessCategory> getChildCategories(String parentCategoryId) {
        log.debug("하위 카테고리 조회: parentCategoryId={}", parentCategoryId);
        return categoryRepository.findByParentCategoryIdAndActive(parentCategoryId);
    }
    
    @Override
    @Cacheable(value = "businessCategoryItems", key = "'allActive'")
    public List<BusinessCategoryItem> getAllActiveCategoryItems() {
        log.debug("활성화된 모든 카테고리 아이템 조회");
        return categoryItemRepository.findAllActiveOrderByDisplayOrder();
    }
    
    @Override
    @Cacheable(value = "businessCategoryItems", key = "'category:' + #categoryId")
    public List<BusinessCategoryItem> getCategoryItemsByCategoryId(String categoryId) {
        log.debug("카테고리 ID로 아이템 조회: categoryId={}", categoryId);
        return categoryItemRepository.findByCategoryIdAndActive(categoryId);
    }
    
    @Override
    @Cacheable(value = "businessCategoryItems", key = "'businessType:' + #businessType")
    public Optional<BusinessCategoryItem> getCategoryItemByBusinessType(String businessType) {
        log.debug("business_type으로 아이템 조회: businessType={}", businessType);
        return categoryItemRepository.findByBusinessTypeAndActive(businessType);
    }
    
    @Override
    public boolean isValidBusinessType(String businessType) {
        log.debug("business_type 유효성 검증: businessType={}", businessType);
        return categoryItemRepository.findByBusinessTypeAndActive(businessType).isPresent();
    }
    
    @Override
    public Optional<BusinessCategoryItem> getCategoryInfoByBusinessType(String businessType) {
        log.debug("business_type으로 카테고리 정보 조회: businessType={}", businessType);
        return getCategoryItemByBusinessType(businessType);
    }
}

