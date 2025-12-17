package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.Settlement;
import com.coresolution.consultation.entity.SettlementRule;

import java.util.List;

/**
 * 정산 Service 인터페이스
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 */
public interface SettlementService {
    
    /**
     * 정산 규칙 생성
     */
    SettlementRule createRule(String tenantId, SettlementRule rule);
    
    /**
     * 정산 규칙 목록 조회
     */
    List<SettlementRule> getRules(String tenantId);
    
    /**
     * 정산 계산 실행 (기간별)
     */
    Settlement calculateSettlement(String tenantId, String period);
    
    /**
     * 정산 결과 목록 조회
     */
    List<Settlement> getSettlements(String tenantId);
    
    /**
     * 정산 승인
     */
    Settlement approveSettlement(String tenantId, Long settlementId, Long approverId);
}

