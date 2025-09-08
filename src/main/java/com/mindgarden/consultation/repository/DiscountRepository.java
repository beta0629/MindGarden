package com.mindgarden.consultation.repository;

import com.mindgarden.consultation.entity.Discount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 할인 리포지토리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Repository
public interface DiscountRepository extends JpaRepository<Discount, Long> {
    
    List<Discount> findByConsultationIdAndIsDeletedFalse(Long consultationId);
    
    List<Discount> findByDiscountTypeAndIsDeletedFalse(String discountType);
    
    List<Discount> findByIsActiveAndIsDeletedFalse(Boolean isActive);
    
    @Query("SELECT d FROM Discount d WHERE d.consultationId = :consultationId AND d.isActive = true AND d.isDeleted = false AND (d.expiresAt IS NULL OR d.expiresAt > :now)")
    List<Discount> findActiveDiscountsByConsultationId(@Param("consultationId") Long consultationId, @Param("now") LocalDateTime now);
    
    @Query("SELECT SUM(d.discountAmount) FROM Discount d WHERE d.consultationId = :consultationId AND d.isActive = true AND d.isDeleted = false AND (d.expiresAt IS NULL OR d.expiresAt > :now)")
    Double getTotalDiscountAmountByConsultationId(@Param("consultationId") Long consultationId, @Param("now") LocalDateTime now);
    
    @Query("SELECT d FROM Discount d WHERE d.expiresAt < :now AND d.isActive = true AND d.isDeleted = false")
    List<Discount> findExpiredActiveDiscounts(@Param("now") LocalDateTime now);
}
