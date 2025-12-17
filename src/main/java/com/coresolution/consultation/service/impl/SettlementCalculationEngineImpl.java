package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.SettlementRule;
import com.coresolution.consultation.service.SettlementCalculationEngine;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 정산 계산 엔진 구현체
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 * 
 * 계산 방법:
 * - PERCENTAGE: 비율 계산 (baseAmount * percentage / 100)
 * - FIXED: 고정 금액
 * - TIERED: 단계별 계산
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SettlementCalculationEngineImpl implements SettlementCalculationEngine {
    
    private final ObjectMapper objectMapper;
    
    @Override
    public BigDecimal calculate(SettlementRule rule, BigDecimal baseAmount) {
        if (baseAmount == null || baseAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        
        try {
            switch (rule.getCalculationMethod()) {
                case PERCENTAGE:
                    return calculatePercentage(rule, baseAmount);
                case FIXED:
                    return calculateFixed(rule, baseAmount);
                case TIERED:
                    return calculateTiered(rule, baseAmount);
                default:
                    log.warn("알 수 없는 계산 방법: {}", rule.getCalculationMethod());
                    return BigDecimal.ZERO;
            }
        } catch (Exception e) {
            log.error("정산 계산 실패: ruleId={}, method={}, error={}", 
                rule.getId(), rule.getCalculationMethod(), e.getMessage(), e);
            return BigDecimal.ZERO;
        }
    }
    
    /**
     * 비율 계산: baseAmount * percentage / 100
     */
    private BigDecimal calculatePercentage(SettlementRule rule, BigDecimal baseAmount) {
        JsonNode params = parseParams(rule.getCalculationParams());
        if (params == null || !params.has("percentage")) {
            log.warn("PERCENTAGE 계산 파라미터 없음: ruleId={}", rule.getId());
            return BigDecimal.ZERO;
        }
        
        BigDecimal percentage = params.get("percentage").decimalValue();
        return baseAmount.multiply(percentage)
            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }
    
    /**
     * 고정 금액 계산
     */
    private BigDecimal calculateFixed(SettlementRule rule, BigDecimal baseAmount) {
        JsonNode params = parseParams(rule.getCalculationParams());
        if (params == null || !params.has("amount")) {
            log.warn("FIXED 계산 파라미터 없음: ruleId={}", rule.getId());
            return BigDecimal.ZERO;
        }
        
        return params.get("amount").decimalValue();
    }
    
    /**
     * 단계별 계산
     * tiers: [{"min": 0, "max": 1000000, "percentage": 5}, ...]
     */
    private BigDecimal calculateTiered(SettlementRule rule, BigDecimal baseAmount) {
        JsonNode params = parseParams(rule.getCalculationParams());
        if (params == null || !params.has("tiers") || !params.get("tiers").isArray()) {
            log.warn("TIERED 계산 파라미터 없음: ruleId={}", rule.getId());
            return BigDecimal.ZERO;
        }
        
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal remaining = baseAmount;
        
        for (JsonNode tier : params.get("tiers")) {
            BigDecimal min = tier.get("min").decimalValue();
            BigDecimal max = tier.has("max") && !tier.get("max").isNull() 
                ? tier.get("max").decimalValue() 
                : null;
            BigDecimal percentage = tier.get("percentage").decimalValue();
            
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }
            
            BigDecimal tierAmount;
            if (max == null) {
                // 최대값 없음 (마지막 단계)
                tierAmount = remaining;
            } else {
                BigDecimal tierRange = max.subtract(min);
                tierAmount = remaining.min(tierRange);
            }
            
            if (tierAmount.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal tierCalculation = tierAmount.multiply(percentage)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                total = total.add(tierCalculation);
                remaining = remaining.subtract(tierAmount);
            }
        }
        
        return total;
    }
    
    /**
     * JSON 파라미터 파싱
     */
    private JsonNode parseParams(String paramsJson) {
        if (paramsJson == null || paramsJson.trim().isEmpty()) {
            return null;
        }
        
        try {
            return objectMapper.readTree(paramsJson);
        } catch (Exception e) {
            log.error("JSON 파라미터 파싱 실패: {}", paramsJson, e);
            return null;
        }
    }
}

