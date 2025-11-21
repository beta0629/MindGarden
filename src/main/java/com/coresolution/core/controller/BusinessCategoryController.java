package com.coresolution.core.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.core.domain.BusinessCategory;
import com.coresolution.core.domain.BusinessCategoryItem;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.BusinessCategoryService;
import com.coresolution.consultation.exception.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 업종 카테고리 컨트롤러
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/business-categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BusinessCategoryController extends BaseApiController {
    
    private final BusinessCategoryService businessCategoryService;
    
    /**
     * 활성화된 모든 카테고리 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<BusinessCategory>>> getAllCategories(
            @RequestParam(required = false) Integer level,
            @RequestParam(required = false) String parentCategoryId) {
        log.debug("카테고리 조회 요청: level={}, parentCategoryId={}", level, parentCategoryId);
        
        List<BusinessCategory> categories;
        if (level != null) {
            categories = businessCategoryService.getCategoriesByLevel(level);
        } else if (parentCategoryId != null) {
            categories = businessCategoryService.getChildCategories(parentCategoryId);
        } else {
            categories = businessCategoryService.getAllActiveCategories();
        }
        
        log.debug("✅ 카테고리 조회 완료: count={}", categories.size());
        return success(categories);
    }
    
    /**
     * 루트 카테고리 조회
     */
    @GetMapping("/root")
    public ResponseEntity<ApiResponse<List<BusinessCategory>>> getRootCategories() {
        log.debug("루트 카테고리 조회 요청");
        List<BusinessCategory> categories = businessCategoryService.getRootCategories();
        log.debug("✅ 루트 카테고리 조회 완료: count={}", categories.size());
        return success(categories);
    }
    
    /**
     * 카테고리 ID로 조회
     */
    @GetMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<BusinessCategory>> getCategoryById(@PathVariable String categoryId) {
        log.debug("카테고리 조회 요청: categoryId={}", categoryId);
        BusinessCategory category = businessCategoryService.getCategoryById(categoryId)
            .orElseThrow(() -> new EntityNotFoundException("카테고리를 찾을 수 없습니다: " + categoryId));
        return success(category);
    }
    
    /**
     * 활성화된 모든 카테고리 아이템 조회
     */
    @GetMapping("/items")
    public ResponseEntity<ApiResponse<List<BusinessCategoryItem>>> getAllCategoryItems(
            @RequestParam(required = false) String categoryId) {
        log.debug("카테고리 아이템 조회 요청: categoryId={}", categoryId);
        
        List<BusinessCategoryItem> items;
        if (categoryId != null) {
            items = businessCategoryService.getCategoryItemsByCategoryId(categoryId);
        } else {
            items = businessCategoryService.getAllActiveCategoryItems();
        }
        
        log.debug("✅ 카테고리 아이템 조회 완료: count={}", items.size());
        return success(items);
    }
    
    /**
     * business_type으로 카테고리 아이템 조회
     */
    @GetMapping("/items/by-business-type/{businessType}")
    public ResponseEntity<ApiResponse<BusinessCategoryItem>> getCategoryItemByBusinessType(
            @PathVariable String businessType) {
        log.debug("카테고리 아이템 조회 요청: businessType={}", businessType);
        BusinessCategoryItem item = businessCategoryService.getCategoryItemByBusinessType(businessType)
            .orElseThrow(() -> new EntityNotFoundException("카테고리 아이템을 찾을 수 없습니다: " + businessType));
        return success(item);
    }
    
    /**
     * business_type 유효성 검증
     */
    @GetMapping("/validate/{businessType}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateBusinessType(
            @PathVariable String businessType) {
        log.debug("business_type 유효성 검증 요청: businessType={}", businessType);
        boolean isValid = businessCategoryService.isValidBusinessType(businessType);
        Map<String, Object> result = Map.of(
            "valid", isValid,
            "businessType", businessType
        );
        return success(result);
    }
    
    /**
     * 카테고리 트리 구조 조회 (계층 구조)
     */
    @GetMapping("/tree")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCategoryTree() {
        log.debug("카테고리 트리 조회 요청");
        List<BusinessCategory> rootCategories = businessCategoryService.getRootCategories();
        
        List<Map<String, Object>> tree = rootCategories.stream()
            .map(category -> {
                Map<String, Object> node = new HashMap<>();
                node.put("categoryId", category.getCategoryId());
                node.put("categoryCode", category.getCategoryCode());
                node.put("nameKo", category.getNameKo());
                node.put("nameEn", category.getNameEn());
                node.put("iconUrl", category.getIconUrl());
                node.put("displayOrder", category.getDisplayOrder());
                
                // 하위 카테고리 조회
                List<BusinessCategory> children = businessCategoryService.getChildCategories(category.getCategoryId());
                if (!children.isEmpty()) {
                    List<Map<String, Object>> childNodes = children.stream()
                        .map(child -> {
                            Map<String, Object> childNode = new HashMap<>();
                            childNode.put("categoryId", child.getCategoryId());
                            childNode.put("categoryCode", child.getCategoryCode());
                            childNode.put("nameKo", child.getNameKo());
                            childNode.put("nameEn", child.getNameEn());
                            childNode.put("iconUrl", child.getIconUrl());
                            childNode.put("displayOrder", child.getDisplayOrder());
                            
                            // 카테고리 아이템 조회
                            List<BusinessCategoryItem> items = businessCategoryService.getCategoryItemsByCategoryId(child.getCategoryId());
                            if (!items.isEmpty()) {
                                childNode.put("items", items);
                            }
                            
                            return childNode;
                        })
                        .collect(Collectors.toList());
                    node.put("children", childNodes);
                }
                
                // 카테고리 아이템 조회 (루트 레벨)
                List<BusinessCategoryItem> items = businessCategoryService.getCategoryItemsByCategoryId(category.getCategoryId());
                if (!items.isEmpty()) {
                    node.put("items", items);
                }
                
                return node;
            })
            .collect(Collectors.toList());
        
        log.debug("✅ 카테고리 트리 조회 완료: count={}", tree.size());
        return success(tree);
    }
}

