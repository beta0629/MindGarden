package com.coresolution.consultation.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.ReserveFund;

/**
 * 적립금 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
public interface ReserveFundService {
    
    // ==================== 적립금 관리 ====================
    
    /**
     * 적립금 생성
     */
    ReserveFund createReserveFund(ReserveFund reserveFund);
    
    /**
     * 적립금 수정
     */
    ReserveFund updateReserveFund(Long id, ReserveFund reserveFund);
    
    /**
     * 적립금 삭제 (비활성화)
     */
    boolean deleteReserveFund(Long id);
    
    /**
     * 적립금 조회
     */
    ReserveFund getReserveFundById(Long id);
    
    /**
     * 모든 활성 적립금 조회
     */
    List<ReserveFund> getAllActiveReserveFunds();
    
    /**
     * 적립금 유형별 조회
     */
    List<ReserveFund> getReserveFundsByType(String fundType);
    
    // ==================== 적립금 운영 ====================
    
    /**
     * 수입에서 자동 적립
     */
    void autoReserveFromIncome(BigDecimal incomeAmount, String description);
    
    /**
     * 수동 적립
     */
    void manualReserve(Long reserveFundId, BigDecimal amount, String description);
    
    /**
     * 적립금 사용
     */
    void useReserveFund(Long reserveFundId, BigDecimal amount, String purpose);
    
    /**
     * 적립금 이체
     */
    void transferReserveFund(Long fromFundId, Long toFundId, BigDecimal amount, String reason);
    
    // ==================== 통계 및 분석 ====================
    
    /**
     * 적립금 현황 조회
     */
    Map<String, Object> getReserveFundStatus();
    
    /**
     * 적립금 유형별 통계
     */
    Map<String, Object> getReserveFundStatistics();
    
    /**
     * 적립금 사용 내역 조회
     */
    Map<String, Object> getReserveFundUsageHistory(String startDate, String endDate);
    
    /**
     * 목표 달성률 계산
     */
    Map<String, Object> getTargetAchievementRate();
}
