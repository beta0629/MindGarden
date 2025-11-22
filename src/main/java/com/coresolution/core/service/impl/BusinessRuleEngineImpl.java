package com.coresolution.core.service.impl;

import com.coresolution.core.domain.BusinessRuleMapping;
import com.coresolution.core.repository.BusinessRuleMappingRepository;
import com.coresolution.core.service.BusinessRuleEngine;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;

/**
 * 비즈니스 규칙 엔진 구현체
 * 메타 시스템: DB에 저장된 규칙을 평가하여 실행
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */
@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class BusinessRuleEngineImpl implements BusinessRuleEngine {
    
    private final BusinessRuleMappingRepository ruleMappingRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    public Object evaluate(String ruleCode, Map<String, Object> context) {
        return evaluate(ruleCode, null, context);
    }
    
    @Override
    public Object evaluate(String ruleCode, String tenantId, Map<String, Object> context) {
        log.debug("규칙 평가 시작: ruleCode={}, tenantId={}", ruleCode, tenantId);
        
        // 규칙 조회 (테넌트별 우선, 없으면 글로벌)
        Optional<BusinessRuleMapping> ruleOpt = findRule(ruleCode, tenantId);
        
        if (ruleOpt.isEmpty()) {
            log.warn("규칙을 찾을 수 없음: ruleCode={}, tenantId={}", ruleCode, tenantId);
            throw new IllegalArgumentException("규칙을 찾을 수 없습니다: " + ruleCode);
        }
        
        BusinessRuleMapping rule = ruleOpt.get();
        
        if (!rule.getIsActive()) {
            log.warn("비활성화된 규칙: ruleCode={}", ruleCode);
            throw new IllegalStateException("비활성화된 규칙입니다: " + ruleCode);
        }
        
        // 조건 평가
        if (!evaluateConditions(rule.getConditionJson(), context)) {
            log.debug("조건 미충족: ruleCode={}", ruleCode);
            return null; // 조건 미충족 시 null 반환
        }
        
        // 액션 실행
        return executeAction(rule.getActionJson(), context);
    }
    
    @Override
    public boolean ruleExists(String ruleCode) {
        return ruleExists(ruleCode, null);
    }
    
    @Override
    public boolean ruleExists(String ruleCode, String tenantId) {
        return findRule(ruleCode, tenantId).isPresent();
    }
    
    /**
     * 규칙 조회 (테넌트별 우선, 없으면 글로벌)
     */
    private Optional<BusinessRuleMapping> findRule(String ruleCode, String tenantId) {
        // 1. 테넌트별 규칙 조회
        if (tenantId != null) {
            Optional<BusinessRuleMapping> tenantRule = ruleMappingRepository
                .findByRuleCodeAndTenantIdAndIsActiveTrueAndIsDeletedFalse(ruleCode, tenantId);
            if (tenantRule.isPresent()) {
                return tenantRule;
            }
        }
        
        // 2. 글로벌 규칙 조회
        Optional<BusinessRuleMapping> globalRule = ruleMappingRepository
            .findByRuleCodeAndTenantIdIsNullAndIsActiveTrueAndIsDeletedFalse(ruleCode);
        
        return globalRule;
    }
    
    /**
     * 조건 평가
     */
    private boolean evaluateConditions(String conditionJson, Map<String, Object> context) {
        if (conditionJson == null || conditionJson.trim().isEmpty()) {
            return true; // 조건이 없으면 항상 true
        }
        
        try {
            JsonNode conditions = objectMapper.readTree(conditionJson);
            
            // 단일 조건
            if (conditions.isObject()) {
                return evaluateCondition(conditions, context);
            }
            
            // 조건 배열 (AND 연산)
            if (conditions.isArray()) {
                for (JsonNode condition : conditions) {
                    if (!evaluateCondition(condition, context)) {
                        return false;
                    }
                }
                return true;
            }
            
            return true;
            
        } catch (JsonProcessingException e) {
            log.error("조건 JSON 파싱 실패: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * 단일 조건 평가
     */
    private boolean evaluateCondition(JsonNode condition, Map<String, Object> context) {
        if (!condition.has("field") || !condition.has("operator")) {
            return true; // 필수 필드가 없으면 true
        }
        
        String field = condition.get("field").asText();
        String operator = condition.get("operator").asText();
        
        // 필드 값 추출 (점 표기법 지원: user.role)
        Object fieldValue = getFieldValue(field, context);
        
        // 연산자별 평가
        switch (operator.toLowerCase()) {
            case "equals":
            case "==":
                return equals(fieldValue, condition.get("value"));
            
            case "notequals":
            case "!=":
                return !equals(fieldValue, condition.get("value"));
            
            case "in":
                return in(fieldValue, condition.get("values"));
            
            case "notin":
                return !in(fieldValue, condition.get("values"));
            
            case "contains":
                return contains(fieldValue, condition.get("value"));
            
            case "greaterthan":
            case ">":
                return compare(fieldValue, condition.get("value")) > 0;
            
            case "lessthan":
            case "<":
                return compare(fieldValue, condition.get("value")) < 0;
            
            case "greaterthanorequal":
            case ">=":
                return compare(fieldValue, condition.get("value")) >= 0;
            
            case "lessthanorequal":
            case "<=":
                return compare(fieldValue, condition.get("value")) <= 0;
            
            case "isnull":
                return fieldValue == null;
            
            case "isnotnull":
                return fieldValue != null;
            
            default:
                log.warn("지원되지 않는 연산자: {}", operator);
                return false;
        }
    }
    
    /**
     * 필드 값 추출 (점 표기법 지원)
     */
    private Object getFieldValue(String field, Map<String, Object> context) {
        if (field == null || context == null) {
            return null;
        }
        
        String[] parts = field.split("\\.");
        Object value = context;
        
        for (String part : parts) {
            if (value == null) {
                return null;
            }
            
            if (value instanceof Map) {
                value = ((Map<String, Object>) value).get(part);
            } else {
                // 리플렉션으로 필드 접근 (향후 구현)
                return null;
            }
        }
        
        return value;
    }
    
    /**
     * equals 연산
     */
    private boolean equals(Object fieldValue, JsonNode expectedValue) {
        if (fieldValue == null && expectedValue.isNull()) {
            return true;
        }
        if (fieldValue == null) {
            return false;
        }
        
        if (expectedValue.isTextual()) {
            return fieldValue.toString().equals(expectedValue.asText());
        } else if (expectedValue.isNumber()) {
            return fieldValue.toString().equals(expectedValue.asText());
        } else if (expectedValue.isBoolean()) {
            return Boolean.parseBoolean(fieldValue.toString()) == expectedValue.asBoolean();
        }
        
        return false;
    }
    
    /**
     * in 연산
     */
    private boolean in(Object fieldValue, JsonNode values) {
        if (fieldValue == null || !values.isArray()) {
            return false;
        }
        
        String fieldValueStr = fieldValue.toString();
        for (JsonNode value : values) {
            if (fieldValueStr.equals(value.asText())) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * contains 연산
     */
    private boolean contains(Object fieldValue, JsonNode expectedValue) {
        if (fieldValue == null) {
            return false;
        }
        
        String fieldValueStr = fieldValue.toString();
        String expectedStr = expectedValue.asText();
        return fieldValueStr.contains(expectedStr);
    }
    
    /**
     * 비교 연산
     */
    private int compare(Object fieldValue, JsonNode expectedValue) {
        if (fieldValue == null) {
            return -1;
        }
        
        try {
            if (fieldValue instanceof Number && expectedValue.isNumber()) {
                double field = ((Number) fieldValue).doubleValue();
                double expected = expectedValue.asDouble();
                return Double.compare(field, expected);
            } else {
                String fieldStr = fieldValue.toString();
                String expectedStr = expectedValue.asText();
                return fieldStr.compareTo(expectedStr);
            }
        } catch (Exception e) {
            log.warn("비교 연산 실패: {}", e.getMessage());
            return 0;
        }
    }
    
    /**
     * 액션 실행
     */
    private Object executeAction(String actionJson, Map<String, Object> context) {
        if (actionJson == null || actionJson.trim().isEmpty()) {
            return null;
        }
        
        try {
            JsonNode action = objectMapper.readTree(actionJson);
            
            // 액션 타입에 따라 실행
            if (action.has("type")) {
                String actionType = action.get("type").asText();
                
                switch (actionType.toLowerCase()) {
                    case "return":
                        return action.has("value") ? action.get("value").asText() : null;
                    
                    case "throw":
                        String message = action.has("message") ? action.get("message").asText() : "규칙 위반";
                        throw new IllegalStateException(message);
                    
                    case "set":
                        // 컨텍스트에 값 설정
                        if (action.has("field") && action.has("value")) {
                            String field = action.get("field").asText();
                            String value = action.get("value").asText();
                            if (context != null) {
                                context.put(field, value);
                            }
                        }
                        return null;
                    
                    default:
                        log.warn("지원되지 않는 액션 타입: {}", actionType);
                        return null;
                }
            }
            
            // 기본: JSON 전체 반환
            return action;
            
        } catch (JsonProcessingException e) {
            log.error("액션 JSON 파싱 실패: {}", e.getMessage());
            return null;
        }
    }
}

