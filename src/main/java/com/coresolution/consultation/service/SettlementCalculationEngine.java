package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.SettlementRule;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.math.BigDecimal;
import java.util.Map;

/**
 * 정산 계산 엔진 인터페이스
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 */
public interface SettlementCalculationEngine {
    
    /**
     * 정산 금액 계산
     * @param rule 정산 규칙
     * @param baseAmount 기준 금액 (매출 등)
     * @return 계산된 정산 금액
     */
    BigDecimal calculate(SettlementRule rule, BigDecimal baseAmount);
}

