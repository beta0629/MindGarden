package com.mindgarden.consultation.service.impl;

import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import com.mindgarden.consultation.service.CommonCodeService;
import com.mindgarden.consultation.service.StatisticsConfigService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 통계 설정 서비스 구현체
 * 공통 코드 기반 통계 설정 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatisticsConfigServiceImpl implements StatisticsConfigService {

    private final CommonCodeService commonCodeService;
    
    // 설정 캐시 (성능 최적화)
    private final Map<String, Object> configCache = new ConcurrentHashMap<>();
    private final Map<String, Long> cacheTimestamp = new ConcurrentHashMap<>();
    
    // 캐시 유효 시간 (5분)
    private static final long CACHE_VALIDITY_MS = 5 * 60 * 1000;

    // ==================== 성과 평가 기준 ====================

    @Override
    public BigDecimal getCompletionRateThreshold(String level) {
        String cacheKey = "PERFORMANCE_COMPLETION_RATE_" + level + "_THRESHOLD";
        return getCachedBigDecimal(cacheKey, () -> {
            String value = commonCodeService.getCodeValue("PERFORMANCE_COMPLETION_RATE", level + "_THRESHOLD");
            return value != null ? new BigDecimal(value) : getDefaultCompletionRateThreshold(level);
        });
    }

    @Override
    public BigDecimal getCancellationRateThreshold(String level) {
        String cacheKey = "PERFORMANCE_CANCELLATION_RATE_" + level + "_THRESHOLD";
        return getCachedBigDecimal(cacheKey, () -> {
            String value = commonCodeService.getCodeValue("PERFORMANCE_CANCELLATION_RATE", level + "_THRESHOLD");
            return value != null ? new BigDecimal(value) : getDefaultCancellationRateThreshold(level);
        });
    }

    @Override
    public BigDecimal getNoShowRateThreshold(String level) {
        String cacheKey = "PERFORMANCE_NOSHOW_RATE_" + level + "_THRESHOLD";
        return getCachedBigDecimal(cacheKey, () -> {
            String value = commonCodeService.getCodeValue("PERFORMANCE_NOSHOW_RATE", level + "_THRESHOLD");
            return value != null ? new BigDecimal(value) : getDefaultNoShowRateThreshold(level);
        });
    }

    // ==================== 성과 점수 가중치 ====================

    @Override
    public BigDecimal getPerformanceWeight(String type) {
        String cacheKey = "PERFORMANCE_SCORE_WEIGHT_" + type;
        return getCachedBigDecimal(cacheKey, () -> {
            String value = commonCodeService.getCodeValue("PERFORMANCE_SCORE_WEIGHT", type);
            return value != null ? new BigDecimal(value) : getDefaultPerformanceWeight(type);
        });
    }

    @Override
    public BigDecimal getBonusScore(String type) {
        String cacheKey = "PERFORMANCE_BONUS_" + type;
        return getCachedBigDecimal(cacheKey, () -> {
            String value = commonCodeService.getCodeValue("PERFORMANCE_SCORE_WEIGHT", type);
            return value != null ? new BigDecimal(value) : getDefaultBonusScore(type);
        });
    }

    // ==================== 등급 기준 ====================

    @Override
    public BigDecimal getGradeThreshold(String grade) {
        String cacheKey = "PERFORMANCE_GRADE_" + grade + "_THRESHOLD";
        return getCachedBigDecimal(cacheKey, () -> {
            String value = commonCodeService.getCodeValue("PERFORMANCE_GRADE", grade + "_GRADE_THRESHOLD");
            return value != null ? new BigDecimal(value) : getDefaultGradeThreshold(grade);
        });
    }

    @Override
    public String getGradeName(BigDecimal score) {
        if (score.compareTo(getGradeThreshold("S")) >= 0) return "S급";
        if (score.compareTo(getGradeThreshold("A")) >= 0) return "A급";
        if (score.compareTo(getGradeThreshold("B")) >= 0) return "B급";
        if (score.compareTo(getGradeThreshold("C")) >= 0) return "C급";
        return "D급";
    }

    @Override
    public String getGradeKoreanName(String grade) {
        String cacheKey = "PERFORMANCE_GRADE_NAME_" + grade;
        return getCachedString(cacheKey, () -> {
            String value = commonCodeService.getCodeValue("PERFORMANCE_GRADE_NAME", grade);
            return value != null ? value : grade + "급";
        });
    }

    // ==================== 알림 설정 ====================

    @Override
    public Integer getAlertConfig(String configType) {
        String cacheKey = "PERFORMANCE_ALERT_" + configType;
        return getCachedInteger(cacheKey, () -> {
            String value = commonCodeService.getCodeValue("PERFORMANCE_ALERT", configType);
            return value != null ? Integer.parseInt(value) : getDefaultAlertConfig(configType);
        });
    }

    @Override
    public String getAlertMessageTemplate(String templateType) {
        String cacheKey = "ALERT_MESSAGE_TEMPLATE_" + templateType;
        return getCachedString(cacheKey, () -> {
            String value = commonCodeService.getCodeValue("ALERT_MESSAGE_TEMPLATE", templateType);
            return value != null ? value : getDefaultAlertTemplate(templateType);
        });
    }

    @Override
    public String generateAlertMessage(String templateType, Object... params) {
        String template = getAlertMessageTemplate(templateType);
        
        // 템플릿 파라미터 치환
        String message = template;
        if (params.length >= 1) message = message.replace("{consultantName}", String.valueOf(params[0]));
        if (params.length >= 2) message = message.replace("{date}", String.valueOf(params[1]));
        if (params.length >= 3) message = message.replace("{rate}", String.valueOf(params[2]));
        if (params.length >= 4) message = message.replace("{threshold}", String.valueOf(params[3]));
        if (params.length >= 5) message = message.replace("{score}", String.valueOf(params[4]));
        
        return message;
    }

    // ==================== 통계 업데이트 설정 ====================

    @Override
    public Integer getUpdateSchedule(String updateType) {
        String cacheKey = "STATISTICS_UPDATE_" + updateType;
        return getCachedInteger(cacheKey, () -> {
            String value = commonCodeService.getCodeValue("STATISTICS_UPDATE", updateType);
            return value != null ? Integer.parseInt(value) : getDefaultUpdateSchedule(updateType);
        });
    }

    // ==================== 대시보드 설정 ====================

    @Override
    public Integer getDashboardConfig(String configType) {
        String cacheKey = "DASHBOARD_CONFIG_" + configType;
        return getCachedInteger(cacheKey, () -> {
            String value = commonCodeService.getCodeValue("DASHBOARD_CONFIG", configType);
            return value != null ? Integer.parseInt(value) : getDefaultDashboardConfig(configType);
        });
    }

    // ==================== ERP 동기화 설정 ====================

    @Override
    public Integer getErpSyncConfig(String configType) {
        String cacheKey = "ERP_SYNC_CONFIG_" + configType;
        return getCachedInteger(cacheKey, () -> {
            String value = commonCodeService.getCodeValue("ERP_SYNC_CONFIG", configType);
            return value != null ? Integer.parseInt(value) : getDefaultErpSyncConfig(configType);
        });
    }

    // ==================== 캐시 관리 ====================

    @Override
    public void clearConfigCache() {
        configCache.clear();
        cacheTimestamp.clear();
        log.info("📝 통계 설정 캐시 전체 초기화 완료");
    }

    @Override
    public void clearConfigCache(String codeGroup) {
        configCache.entrySet().removeIf(entry -> entry.getKey().startsWith(codeGroup));
        cacheTimestamp.entrySet().removeIf(entry -> entry.getKey().startsWith(codeGroup));
        log.info("📝 통계 설정 캐시 초기화 완료: codeGroup={}", codeGroup);
    }

    // ==================== 캐시 유틸리티 메서드 ====================

    private BigDecimal getCachedBigDecimal(String cacheKey, ValueSupplier<BigDecimal> supplier) {
        return getCachedValue(cacheKey, supplier, BigDecimal.class);
    }

    private String getCachedString(String cacheKey, ValueSupplier<String> supplier) {
        return getCachedValue(cacheKey, supplier, String.class);
    }

    private Integer getCachedInteger(String cacheKey, ValueSupplier<Integer> supplier) {
        return getCachedValue(cacheKey, supplier, Integer.class);
    }

    @SuppressWarnings("unchecked")
    private <T> T getCachedValue(String cacheKey, ValueSupplier<T> supplier, Class<T> clazz) {
        Long timestamp = cacheTimestamp.get(cacheKey);
        long currentTime = System.currentTimeMillis();
        
        // 캐시가 유효한 경우
        if (timestamp != null && (currentTime - timestamp) < CACHE_VALIDITY_MS) {
            Object cachedValue = configCache.get(cacheKey);
            if (cachedValue != null && clazz.isInstance(cachedValue)) {
                return (T) cachedValue;
            }
        }
        
        // 캐시 갱신
        try {
            T value = supplier.get();
            configCache.put(cacheKey, value);
            cacheTimestamp.put(cacheKey, currentTime);
            return value;
        } catch (Exception e) {
            log.error("❌ 설정값 조회 실패: cacheKey={}", cacheKey, e);
            return getDefaultValue(cacheKey, clazz);
        }
    }

    @FunctionalInterface
    private interface ValueSupplier<T> {
        T get() throws Exception;
    }

    // ==================== 기본값 제공 메서드 ====================

    private BigDecimal getDefaultCompletionRateThreshold(String level) {
        Map<String, BigDecimal> defaults = Map.of(
            "EXCELLENT", BigDecimal.valueOf(90),
            "GOOD", BigDecimal.valueOf(80),
            "WARNING", BigDecimal.valueOf(70),
            "CRITICAL", BigDecimal.valueOf(50)
        );
        return defaults.getOrDefault(level, BigDecimal.valueOf(70));
    }

    private BigDecimal getDefaultCancellationRateThreshold(String level) {
        Map<String, BigDecimal> defaults = Map.of(
            "ACCEPTABLE", BigDecimal.valueOf(10),
            "WARNING", BigDecimal.valueOf(15),
            "CRITICAL", BigDecimal.valueOf(25)
        );
        return defaults.getOrDefault(level, BigDecimal.valueOf(10));
    }

    private BigDecimal getDefaultNoShowRateThreshold(String level) {
        Map<String, BigDecimal> defaults = Map.of(
            "ACCEPTABLE", BigDecimal.valueOf(5),
            "WARNING", BigDecimal.valueOf(10),
            "CRITICAL", BigDecimal.valueOf(20)
        );
        return defaults.getOrDefault(level, BigDecimal.valueOf(5));
    }

    private BigDecimal getDefaultPerformanceWeight(String type) {
        Map<String, BigDecimal> defaults = Map.of(
            "COMPLETION_RATE", BigDecimal.valueOf(30),
            "AVERAGE_RATING", BigDecimal.valueOf(20),
            "CLIENT_RETENTION", BigDecimal.valueOf(20),
            "CANCELLATION_BONUS", BigDecimal.valueOf(15),
            "NOSHOW_BONUS", BigDecimal.valueOf(15)
        );
        return defaults.getOrDefault(type, BigDecimal.valueOf(10));
    }

    private BigDecimal getDefaultBonusScore(String type) {
        Map<String, BigDecimal> defaults = Map.of(
            "CANCELLATION_BONUS", BigDecimal.valueOf(15),
            "NOSHOW_BONUS", BigDecimal.valueOf(15)
        );
        return defaults.getOrDefault(type, BigDecimal.valueOf(10));
    }

    private BigDecimal getDefaultGradeThreshold(String grade) {
        Map<String, BigDecimal> defaults = Map.of(
            "S", BigDecimal.valueOf(90),
            "A", BigDecimal.valueOf(80),
            "B", BigDecimal.valueOf(70),
            "C", BigDecimal.valueOf(60)
        );
        return defaults.getOrDefault(grade, BigDecimal.valueOf(50));
    }

    private Integer getDefaultAlertConfig(String configType) {
        Map<String, Integer> defaults = Map.of(
            "DUPLICATE_PREVENTION_HOURS", 1,
            "CRITICAL_THRESHOLD_DAYS", 3,
            "WARNING_THRESHOLD_DAYS", 7
        );
        return defaults.getOrDefault(configType, 1);
    }

    private String getDefaultAlertTemplate(String templateType) {
        Map<String, String> defaults = Map.of(
            "COMPLETION_RATE_WARNING", "상담사 {consultantName}의 {date} 완료율이 {rate}%로 기준({threshold}%) 미달입니다.",
            "COMPLETION_RATE_CRITICAL", "상담사 {consultantName}의 {date} 완료율이 {rate}%로 위험 수준입니다. 즉시 조치가 필요합니다.",
            "CANCELLATION_RATE_HIGH", "상담사 {consultantName}의 취소율이 {rate}%로 높습니다. 원인 분석이 필요합니다.",
            "PERFORMANCE_IMPROVEMENT", "상담사 {consultantName}의 성과 점수가 {score}점으로 개선되었습니다."
        );
        return defaults.getOrDefault(templateType, "알림: {consultantName} 성과 관련 안내");
    }

    private Integer getDefaultUpdateSchedule(String updateType) {
        Map<String, Integer> defaults = Map.of(
            "DAILY_UPDATE_HOUR", 1,
            "PERFORMANCE_UPDATE_HOUR", 2,
            "ALERT_CHECK_HOUR", 9
        );
        return defaults.getOrDefault(updateType, 1);
    }

    private Integer getDefaultDashboardConfig(String configType) {
        Map<String, Integer> defaults = Map.of(
            "TOP_PERFORMERS_COUNT", 5,
            "RECENT_DAYS_COUNT", 7,
            "TREND_ANALYSIS_DAYS", 30
        );
        return defaults.getOrDefault(configType, 5);
    }

    private Integer getDefaultErpSyncConfig(String configType) {
        Map<String, Integer> defaults = Map.of(
            "FINANCIAL_SYNC_INTERVAL_HOURS", 6,
            "SALARY_SYNC_INTERVAL_HOURS", 24,
            "INVENTORY_SYNC_INTERVAL_HOURS", 12,
            "RETRY_ATTEMPTS", 3,
            "TIMEOUT_MINUTES", 30
        );
        return defaults.getOrDefault(configType, 6);
    }

    @SuppressWarnings("unchecked")
    private <T> T getDefaultValue(String cacheKey, Class<T> clazz) {
        if (clazz == BigDecimal.class) {
            return (T) BigDecimal.valueOf(10);
        } else if (clazz == Integer.class) {
            return (T) Integer.valueOf(1);
        } else if (clazz == String.class) {
            return (T) "기본값";
        }
        return null;
    }
    
    // ==================== 헬퍼 메서드 ====================
    
    /**
     * 설정값 조회 헬퍼 메서드
     */
    private String getConfigValue(String codeGroup, String codeValue, String defaultValue) {
        try {
            String value = commonCodeService.getCodeValue(codeGroup, codeValue);
            return value != null ? value : defaultValue;
        } catch (Exception e) {
            log.warn("공통코드 조회 실패, 기본값 사용: group={}, value={}", codeGroup, codeValue, e);
            return defaultValue;
        }
    }
    
    // 등급별 점수 조회 메서드들
    private BigDecimal getGradeSScore() {
        return getGradeThreshold("S");
    }
    
    private BigDecimal getGradeAScore() {
        return getGradeThreshold("A");
    }
    
    private BigDecimal getGradeBScore() {
        return getGradeThreshold("B");
    }
    
    private BigDecimal getGradeCScore() {
        return getGradeThreshold("C");
    }
}
