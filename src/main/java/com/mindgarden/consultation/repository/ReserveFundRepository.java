package com.mindgarden.consultation.repository;

import java.util.List;
import com.mindgarden.consultation.entity.ReserveFund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

/**
 * 적립금 리포지토리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Repository
public interface ReserveFundRepository extends JpaRepository<ReserveFund, Long> {
    
    /**
     * 활성화된 모든 적립금 조회
     */
    List<ReserveFund> findByIsActiveTrue();
    
    /**
     * 적립금 유형별 활성 적립금 조회
     */
    List<ReserveFund> findByFundTypeAndIsActiveTrue(String fundType);
    
    /**
     * 자동 적립이 활성화된 적립금 조회
     */
    List<ReserveFund> findByAutoDeductTrueAndIsActiveTrue();
    
    /**
     * 목표 금액이 설정된 활성 적립금 조회
     */
    List<ReserveFund> findByTargetAmountNotNullAndIsActiveTrue();
    
    /**
     * 적립금 이름으로 조회
     */
    List<ReserveFund> findByFundNameContainingAndIsActiveTrue(String fundName);
    
    /**
     * 적립금 유형별 통계
     */
    @Query("SELECT rf.fundType, COUNT(rf), SUM(rf.currentAmount) " +
           "FROM ReserveFund rf " +
           "WHERE rf.isActive = true " +
           "GROUP BY rf.fundType")
    List<Object[]> getStatisticsByFundType();
    
    /**
     * 총 적립금 금액 조회
     */
    @Query("SELECT SUM(rf.currentAmount) FROM ReserveFund rf WHERE rf.isActive = true")
    Double getTotalReserveAmount();
    
    /**
     * 적립금 사용률 조회 (목표 대비 현재)
     */
    @Query("SELECT rf.fundName, rf.currentAmount, rf.targetAmount, " +
           "CASE WHEN rf.targetAmount > 0 THEN (rf.currentAmount / rf.targetAmount * 100) ELSE 0 END " +
           "FROM ReserveFund rf " +
           "WHERE rf.isActive = true AND rf.targetAmount IS NOT NULL")
    List<Object[]> getAchievementRates();
}
