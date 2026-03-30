package com.coresolution.core.service.statistics;

import com.coresolution.core.domain.statistics.StatisticsDefinition;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.entity.ConsultantRating;

/**
 * 통계 계산 엔진
 * 메타데이터 기반으로 통계를 계산
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-25
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StatisticsCalculationEngine {
    
    private final ScheduleRepository scheduleRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final UserRepository userRepository;
    private final ConsultantRatingRepository ratingRepository;
    private final ObjectMapper objectMapper;
    
    /**
     * 통계 계산
     */
    public BigDecimal calculate(StatisticsDefinition definition, LocalDate date, Map<String, Object> params) {
        try {
            JsonNode rule = objectMapper.readTree(definition.getCalculationRule());
            String type = rule.get("type").asText();
            
            log.debug("통계 계산 시작: code={}, type={}, date={}", 
                definition.getStatisticCode(), type, date);
            
            switch (type) {
                case "COUNT":
                    return calculateCount(rule, date, params);
                case "COUNT_DISTINCT":
                    return calculateCountDistinct(rule, date, params);
                case "SUM":
                    return calculateSum(rule, date, params);
                case "AVG":
                    return calculateAverage(rule, date, params);
                case "MIN":
                    return calculateMin(rule, date, params);
                case "MAX":
                    return calculateMax(rule, date, params);
                case "CUSTOM":
                    return calculateCustom(rule, date, params);
                default:
                    throw new IllegalArgumentException("Unknown calculation type: " + type);
            }
        } catch (Exception e) {
            log.error("통계 계산 실패: code={}", definition.getStatisticCode(), e);
            throw new RuntimeException("통계 계산 실패: " + e.getMessage(), e);
        }
    }
    
    /**
     * COUNT 계산
     */
    private BigDecimal calculateCount(JsonNode rule, LocalDate date, Map<String, Object> params) {
        List<?> data = fetchData(rule, date, params);
        return BigDecimal.valueOf(data.size());
    }
    
    /**
     * COUNT_DISTINCT 계산
     */
    private BigDecimal calculateCountDistinct(JsonNode rule, LocalDate date, Map<String, Object> params) {
        List<?> data = fetchData(rule, date, params);
        String field = rule.has("field") ? rule.get("field").asText() : null;
        
        if (field == null) {
            return BigDecimal.valueOf(data.size());
        }
        
        Set<Object> distinctValues = data.stream()
            .map(item -> extractFieldValue(item, field, null, params))
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
        
        return BigDecimal.valueOf(distinctValues.size());
    }
    
    /**
     * SUM 계산
     */
    private BigDecimal calculateSum(JsonNode rule, LocalDate date, Map<String, Object> params) {
        List<?> data = fetchData(rule, date, params);
        String field = rule.has("field") ? rule.get("field").asText() : null;
        JsonNode fallback = rule.has("fallback") ? rule.get("fallback") : null;
        
        return data.stream()
            .map(item -> extractFieldValue(item, field, fallback, params))
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    /**
     * AVG 계산
     */
    private BigDecimal calculateAverage(JsonNode rule, LocalDate date, Map<String, Object> params) {
        List<?> data = fetchData(rule, date, params);
        
        if (data.isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        String field = rule.has("field") ? rule.get("field").asText() : null;
        JsonNode fallback = rule.has("fallback") ? rule.get("fallback") : null;
        
        BigDecimal sum = data.stream()
            .map(item -> extractFieldValue(item, field, fallback, params))
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return sum.divide(BigDecimal.valueOf(data.size()), 2, RoundingMode.HALF_UP);
    }
    
    /**
     * MIN 계산
     */
    private BigDecimal calculateMin(JsonNode rule, LocalDate date, Map<String, Object> params) {
        List<?> data = fetchData(rule, date, params);
        
        if (data.isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        String field = rule.has("field") ? rule.get("field").asText() : null;
        JsonNode fallback = rule.has("fallback") ? rule.get("fallback") : null;
        
        return data.stream()
            .map(item -> extractFieldValue(item, field, fallback, params))
            .filter(Objects::nonNull)
            .min(BigDecimal::compareTo)
            .orElse(BigDecimal.ZERO);
    }
    
    /**
     * MAX 계산
     */
    private BigDecimal calculateMax(JsonNode rule, LocalDate date, Map<String, Object> params) {
        List<?> data = fetchData(rule, date, params);
        
        if (data.isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        String field = rule.has("field") ? rule.get("field").asText() : null;
        JsonNode fallback = rule.has("fallback") ? rule.get("fallback") : null;
        
        return data.stream()
            .map(item -> extractFieldValue(item, field, fallback, params))
            .filter(Objects::nonNull)
            .max(BigDecimal::compareTo)
            .orElse(BigDecimal.ZERO);
    }
    
    /**
     * CUSTOM 계산 (수식 기반)
     */
    private BigDecimal calculateCustom(JsonNode rule, LocalDate date, Map<String, Object> params) {
        // 변수 계산
        Map<String, BigDecimal> variables = new HashMap<>();
        if (rule.has("variables")) {
            JsonNode variablesNode = rule.get("variables");
            variablesNode.fields().forEachRemaining(entry -> {
                String varName = entry.getKey();
                JsonNode varDef = entry.getValue();
                variables.put(varName, calculateVariable(varDef, date, params));
            });
        }
        
        // 수식 평가 (간단한 구현)
        if (rule.has("formula")) {
            String formula = rule.get("formula").asText();
            return evaluateFormula(formula, variables);
        }
        
        return BigDecimal.ZERO;
    }
    
    /**
     * 데이터 조회
     */
    private List<?> fetchData(JsonNode rule, LocalDate date, Map<String, Object> params) {
        String sourceType = rule.get("source").asText();
        JsonNode filter = rule.has("filter") ? rule.get("filter") : null;
        
        String tenantId = (String) params.get("tenantId");
        
        switch (sourceType) {
            case "SCHEDULE":
                return fetchScheduleData(filter, date, tenantId, params);
            case "MAPPING":
                return fetchMappingData(filter, tenantId, params);
            case "USER":
                return fetchUserData(filter, tenantId, params);
            case "CONSULTATION":
                return fetchConsultationData(filter, date, tenantId, params);
            case "RATING":
                return fetchRatingData(filter, date, tenantId, params);
            default:
                throw new IllegalArgumentException("Unknown source type: " + sourceType);
        }
    }
    
    /**
     * 스케줄 데이터 조회
     */
    private List<Schedule> fetchScheduleData(JsonNode filter, LocalDate date, String tenantId, Map<String, Object> params) {
        if (filter == null) {
            return scheduleRepository.findAllByTenantId(tenantId);
        }
        
        LocalDate startDate = date;
        LocalDate endDate = date;
        
        // 날짜 필터 처리
        if (filter.has("date")) {
            String dateFilter = filter.get("date").asText();
            if ("TODAY".equals(dateFilter)) {
                startDate = LocalDate.now();
                endDate = LocalDate.now();
            } else if ("YESTERDAY".equals(dateFilter)) {
                startDate = LocalDate.now().minusDays(1);
                endDate = LocalDate.now().minusDays(1);
            }
        }
        
        if (filter.has("dateRange")) {
            String dateRange = filter.get("dateRange").asText();
            if ("THIS_MONTH".equals(dateRange)) {
                startDate = LocalDate.now().withDayOfMonth(1);
                endDate = LocalDate.now();
            } else if ("LAST_30_DAYS".equals(dateRange)) {
                startDate = LocalDate.now().minusDays(30);
                endDate = LocalDate.now();
            }
        }
        
        // 테넌트 ID와 날짜 범위로 스케줄 조회
        List<Schedule> schedules = scheduleRepository.findByDateBetween(startDate, endDate);
        // 테넌트 필터링
        if (tenantId != null) {
            schedules = schedules.stream()
                .filter(s -> tenantId.equals(s.getTenantId()))
                .collect(Collectors.toList());
        }
        
        // 상태 필터 처리
        if (filter.has("status")) {
            JsonNode statusNode = filter.get("status");
            if (statusNode.isArray()) {
                List<String> statusList = new ArrayList<>();
                statusNode.forEach(s -> statusList.add(s.asText()));
                schedules = schedules.stream()
                    .filter(s -> statusList.contains(s.getStatus() != null ? s.getStatus().toString() : null))
                    .collect(Collectors.toList());
            } else {
                String status = statusNode.asText();
                schedules = schedules.stream()
                    .filter(s -> status.equals(s.getStatus() != null ? s.getStatus().toString() : null))
                    .collect(Collectors.toList());
            }
        }
        
        return schedules;
    }
    
    /**
     * 매핑 데이터 조회
     */
    private List<ConsultantClientMapping> fetchMappingData(JsonNode filter, String tenantId, Map<String, Object> params) {
        // 모든 매칭 조회 후 테넌트 필터링
        List<ConsultantClientMapping> allMappings = mappingRepository.findAll();
        
        // 테넌트 필터링
        if (tenantId != null) {
            allMappings = allMappings.stream()
                .filter(m -> tenantId.equals(m.getTenantId()))
                .collect(Collectors.toList());
        }
        
        // 상태 필터링
        if (filter != null && filter.has("status")) {
            String status = filter.get("status").asText();
            allMappings = allMappings.stream()
                .filter(m -> status.equals(m.getStatus() != null ? m.getStatus().toString() : null))
                .collect(Collectors.toList());
        }
        
        return allMappings;
    }
    
    /**
     * 사용자 데이터 조회
     */
    private List<User> fetchUserData(JsonNode filter, String tenantId, Map<String, Object> params) {
        // BaseRepository의 findAllByTenantId 사용
        List<User> users = userRepository.findAllByTenantId(tenantId);
        
        if (filter != null) {
            if (filter.has("role")) {
                String role = filter.get("role").asText();
                users = users.stream()
                    .filter(u -> role.equals(u.getRole() != null ? u.getRole().toString() : null))
                    .collect(Collectors.toList());
            }
            
            if (filter.has("isActive")) {
                boolean isActive = filter.get("isActive").asBoolean();
                users = users.stream()
                    .filter(u -> isActive == (u.getIsActive() != null && u.getIsActive()))
                    .collect(Collectors.toList());
            }
        }
        
        return users;
    }
    
    /**
     * 상담 데이터 조회 (향후 구현)
     */
    private List<?> fetchConsultationData(JsonNode filter, LocalDate date, String tenantId, Map<String, Object> params) {
        // TODO: ConsultationRepository 구현 후 추가
        return Collections.emptyList();
    }
    
    /**
     * 평점 데이터 조회
     */
    private List<ConsultantRating> fetchRatingData(JsonNode filter, LocalDate date, String tenantId, Map<String, Object> params) {
        List<ConsultantRating> allRatings = ratingRepository.findAll();
        
        // 테넌트 필터링
        if (tenantId != null) {
            allRatings = allRatings.stream()
                .filter(r -> tenantId.equals(r.getTenantId()))
                .collect(Collectors.toList());
        }
        
        // 상태 필터링
        if (filter != null && filter.has("status")) {
            String status = filter.get("status").asText();
            allRatings = allRatings.stream()
                .filter(r -> status.equals(r.getStatus() != null ? r.getStatus().toString() : null))
                .collect(Collectors.toList());
        }
        
        return allRatings;
    }
    
    /**
     * 필드 값 추출
     */
    private BigDecimal extractFieldValue(Object item, String field, JsonNode fallback, Map<String, Object> params) {
        if (item == null) {
            return handleFallback(fallback, params);
        }
        
        try {
            Object value = null;
            
            if (item instanceof Schedule) {
                Schedule schedule = (Schedule) item;
                value = getScheduleFieldValue(schedule, field);
            } else if (item instanceof ConsultantClientMapping) {
                ConsultantClientMapping mapping = (ConsultantClientMapping) item;
                value = getMappingFieldValue(mapping, field);
            } else if (item instanceof User) {
                User user = (User) item;
                value = getUserFieldValue(user, field);
            } else if (item instanceof ConsultantRating) {
                ConsultantRating rating = (ConsultantRating) item;
                value = getRatingFieldValue(rating, field);
            }
            
            if (value == null) {
                return handleFallback(fallback, params);
            }
            
            if (value instanceof BigDecimal) {
                return (BigDecimal) value;
            } else if (value instanceof Number) {
                return BigDecimal.valueOf(((Number) value).doubleValue());
            } else if (value instanceof String) {
                try {
                    return new BigDecimal((String) value);
                } catch (NumberFormatException e) {
                    return handleFallback(fallback, params);
                }
            }
            
            return handleFallback(fallback, params);
        } catch (Exception e) {
            log.warn("필드 값 추출 실패: field={}", field, e);
            return handleFallback(fallback, params);
        }
    }
    
    /**
     * 평점 필드 값 추출
     */
    private Object getRatingFieldValue(ConsultantRating rating, String field) {
        switch (field) {
            case "heartScore":
                return rating.getHeartScore();
            default:
                return null;
        }
    }
    
    /**
     * 스케줄 필드 값 추출
     */
    private Object getScheduleFieldValue(Schedule schedule, String field) {
        switch (field) {
            case "revenue":
                // 매핑에서 가격 조회 (fallback 처리)
                return null; // fallback에서 처리
            case "durationMinutes":
                if (schedule.getStartTime() != null && schedule.getEndTime() != null) {
                    return (int) java.time.Duration.between(
                        schedule.getStartTime(), 
                        schedule.getEndTime()
                    ).toMinutes();
                }
                return null;
            default:
                return null;
        }
    }
    
    /**
     * 매핑 필드 값 추출
     */
    private Object getMappingFieldValue(ConsultantClientMapping mapping, String field) {
        switch (field) {
            case "packagePrice":
                return mapping.getPackagePrice() != null 
                    ? BigDecimal.valueOf(mapping.getPackagePrice()) 
                    : null;
            case "totalSessions":
                return mapping.getTotalSessions() != null 
                    ? BigDecimal.valueOf(mapping.getTotalSessions()) 
                    : null;
            case "remainingSessions":
                return mapping.getRemainingSessions() != null 
                    ? BigDecimal.valueOf(mapping.getRemainingSessions()) 
                    : null;
            default:
                return null;
        }
    }
    
    /**
     * 사용자 필드 값 추출
     */
    private Object getUserFieldValue(User user, String field) {
        // 사용자 필드는 주로 COUNT에 사용되므로 null 반환
        return null;
    }
    
    /**
     * Fallback 처리
     */
    private BigDecimal handleFallback(JsonNode fallback, Map<String, Object> params) {
        if (fallback == null) {
            return BigDecimal.ZERO;
        }
        
        String fallbackType = fallback.get("type").asText();
        
        switch (fallbackType) {
            case "LOOKUP":
                return handleLookupFallback(fallback, params);
            case "CONSTANT":
                return BigDecimal.valueOf(fallback.get("value").asDouble());
            default:
                return BigDecimal.ZERO;
        }
    }
    
    /**
     * LOOKUP Fallback 처리
     */
    private BigDecimal handleLookupFallback(JsonNode fallback, Map<String, Object> params) {
        // TODO: 복잡한 JOIN 로직 구현
        // 예: schedule.mappingId -> mapping.id -> mapping.packagePrice
        String source = fallback.get("source").asText();
        String field = fallback.get("field").asText();
        
        if ("MAPPING".equals(source) && "packagePrice".equals(field)) {
            // 간단한 구현: 매핑에서 평균 가격 조회
            String tenantId = (String) params.get("tenantId");
            List<ConsultantClientMapping> allMappings = mappingRepository.findAll();
            
            // 테넌트 필터링
            List<ConsultantClientMapping> mappings = allMappings.stream()
                .filter(m -> tenantId == null || tenantId.equals(m.getTenantId()))
                .collect(Collectors.toList());
            
            if (mappings.isEmpty()) {
                return BigDecimal.ZERO;
            }
            
            BigDecimal avgPrice = mappings.stream()
                .filter(m -> m.getPackagePrice() != null)
                .map(m -> BigDecimal.valueOf(m.getPackagePrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(mappings.size()), 2, RoundingMode.HALF_UP);
            
            return avgPrice;
        }
        
        return BigDecimal.ZERO;
    }
    
    /**
     * 변수 계산
     */
    private BigDecimal calculateVariable(JsonNode varDef, LocalDate date, Map<String, Object> params) {
        String type = varDef.get("type").asText();
        
        switch (type) {
            case "COUNT":
                return BigDecimal.valueOf(fetchData(varDef, date, params).size());
            case "SUM":
                String field = varDef.has("field") ? varDef.get("field").asText() : null;
                JsonNode fallback = varDef.has("fallback") ? varDef.get("fallback") : null;
                List<?> data = fetchData(varDef, date, params);
                return data.stream()
                    .map(item -> extractFieldValue(item, field, fallback, params))
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            case "AVG":
                field = varDef.has("field") ? varDef.get("field").asText() : null;
                fallback = varDef.has("fallback") ? varDef.get("fallback") : null;
                data = fetchData(varDef, date, params);
                if (data.isEmpty()) {
                    return BigDecimal.ZERO;
                }
                BigDecimal sum = data.stream()
                    .map(item -> extractFieldValue(item, field, fallback, params))
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                return sum.divide(BigDecimal.valueOf(data.size()), 2, RoundingMode.HALF_UP);
            case "CONSTANT":
                return BigDecimal.valueOf(varDef.get("value").asDouble());
            default:
                return BigDecimal.ZERO;
        }
    }
    
    /**
     * 수식 평가 (간단한 구현)
     */
    private BigDecimal evaluateFormula(String formula, Map<String, BigDecimal> variables) {
        // 간단한 수식 평가 (예: "totalConsultations * averagePrice * (1 - discountRate)")
        // TODO: 더 복잡한 수식 파서 구현 (예: JEP 라이브러리 사용)
        
        String result = formula;
        for (Map.Entry<String, BigDecimal> entry : variables.entrySet()) {
            result = result.replace(entry.getKey(), entry.getValue().toString());
        }
        
        // 간단한 계산 (예: JavaScript eval 대신 안전한 계산)
        try {
            // TODO: 안전한 수식 평가 라이브러리 사용
            return BigDecimal.ZERO; // 임시 구현
        } catch (Exception e) {
            log.error("수식 평가 실패: formula={}", formula, e);
            return BigDecimal.ZERO;
        }
    }
}

