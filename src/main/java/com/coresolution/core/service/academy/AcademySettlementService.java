package com.coresolution.core.service.academy;

import com.coresolution.core.dto.academy.*;

import java.util.List;

/**
 * 학원 정산 서비스 인터페이스
 * 학원 시스템의 수강료/강사/본사 정산 관리 비즈니스 로직
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
public interface AcademySettlementService {
    
    // ==================== 정산 관리 ====================
    
    /**
     * 정산 목록 조회
     */
    List<SettlementResponse> getSettlements(String tenantId, Long branchId, String settlementPeriod, SettlementResponse.SettlementStatus status);
    
    /**
     * 정산 상세 조회
     */
    SettlementResponse getSettlement(String tenantId, String settlementId);
    
    /**
     * 정산 계산 및 생성
     */
    SettlementResponse calculateSettlement(String tenantId, SettlementCalculateRequest request, String calculatedBy);
    
    /**
     * 정산 승인
     */
    SettlementResponse approveSettlement(String tenantId, String settlementId, String approvedBy);
    
    /**
     * 정산 지급 완료 처리
     */
    SettlementResponse markSettlementAsPaid(String tenantId, String settlementId, String paidBy);
    
    /**
     * 정산 취소
     */
    SettlementResponse cancelSettlement(String tenantId, String settlementId, String cancelledBy);
    
    // ==================== 정산 항목 관리 ====================
    
    /**
     * 정산 항목 목록 조회
     */
    List<SettlementItemResponse> getSettlementItems(String tenantId, String settlementId);
    
    /**
     * 정산 항목 상세 조회
     */
    SettlementItemResponse getSettlementItem(String tenantId, String settlementItemId);
    
    // ==================== 배치 작업 ====================
    
    /**
     * 월별 정산 자동 계산 (배치)
     */
    int calculateMonthlySettlements(String tenantId, String settlementPeriod);
}

