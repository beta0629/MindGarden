package com.mindgarden.consultation.repository;

import java.util.List;
import com.mindgarden.consultation.entity.PackageDiscount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 패키지 상품 할인 리포지토리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Repository
public interface PackageDiscountRepository extends JpaRepository<PackageDiscount, Long> {
    
    // 할인 코드로 조회
    PackageDiscount findByCodeAndIsActive(String code, Boolean isActive);
    
    // 활성화된 할인 조회
    List<PackageDiscount> findByIsActive(Boolean isActive);
    
    // 자동 적용 가능한 할인 조회
    List<PackageDiscount> findByIsActiveAndIsAutoApplicable(Boolean isActive, Boolean isAutoApplicable);
}
