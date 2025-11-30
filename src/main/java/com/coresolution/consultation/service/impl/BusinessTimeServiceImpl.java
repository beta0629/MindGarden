package com.coresolution.consultation.service.impl;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.service.BusinessTimeService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 업무 시간 및 정책 관리 서비스 구현
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-27
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BusinessTimeServiceImpl implements BusinessTimeService {
    
    private final CommonCodeRepository commonCodeRepository;
    
    // 캐시된 설정값들
    private final Map<String, Object> settingsCache = new ConcurrentHashMap<>();
    private final DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
    
    @Override
    @Cacheable(value = "businessTime", key = "'startTime'")
    public LocalTime getBusinessStartTime() {
        return getTimeFromCode("BUSINESS_HOURS", "START_TIME", LocalTime.of(10, 0));
    }
    
    @Override
    @Cacheable(value = "businessTime", key = "'endTime'")
    public LocalTime getBusinessEndTime() {
        return getTimeFromCode("BUSINESS_HOURS", "END_TIME", LocalTime.of(20, 0));
    }
    
    @Override
    @Cacheable(value = "businessTime", key = "'lunchStartTime'")
    public LocalTime getLunchStartTime() {
        return getTimeFromCode("BUSINESS_HOURS", "LUNCH_START", LocalTime.of(12, 0));
    }
    
    @Override
    @Cacheable(value = "businessTime", key = "'lunchEndTime'")
    public LocalTime getLunchEndTime() {
        return getTimeFromCode("BUSINESS_HOURS", "LUNCH_END", LocalTime.of(13, 0));
    }
    
    @Override
    @Cacheable(value = "businessTime", key = "'slotInterval'")
    public int getSlotIntervalMinutes() {
        return getIntFromCode("BUSINESS_HOURS", "SLOT_INTERVAL", 30);
    }
    
    @Override
    @Cacheable(value = "cancellationPolicy", key = "'minNoticeHours'")
    public int getMinNoticeHours() {
        return getIntFromCode("CANCELLATION_POLICY", "MIN_NOTICE_HOURS", 24);
    }
    
    @Override
    @Cacheable(value = "cancellationPolicy", key = "'maxAdvanceDays'")
    public int getMaxAdvanceBookingDays() {
        return getIntFromCode("CANCELLATION_POLICY", "MAX_ADVANCE_DAYS", 30);
    }
    
    @Override
    @Cacheable(value = "cancellationPolicy", key = "'breakTimeMinutes'")
    public int getBreakTimeMinutes() {
        return getIntFromCode("CANCELLATION_POLICY", "BREAK_TIME_MINUTES", 10);
    }
    
    @Override
    public Map<String, Object> getAllBusinessTimeSettings() {
        Map<String, Object> settings = new HashMap<>();
        
        settings.put("businessStartTime", getBusinessStartTime().format(timeFormatter));
        settings.put("businessEndTime", getBusinessEndTime().format(timeFormatter));
        settings.put("lunchStartTime", getLunchStartTime().format(timeFormatter));
        settings.put("lunchEndTime", getLunchEndTime().format(timeFormatter));
        settings.put("slotIntervalMinutes", getSlotIntervalMinutes());
        settings.put("minNoticeHours", getMinNoticeHours());
        settings.put("maxAdvanceBookingDays", getMaxAdvanceBookingDays());
        settings.put("breakTimeMinutes", getBreakTimeMinutes());
        
        return settings;
    }
    
    @Override
    public void updateBusinessTimeSettings(Map<String, Object> settings) {
        log.info("🕐 업무 시간 설정 업데이트: {}", settings);
        
        // 공통 코드 업데이트
        updateCommonCode("BUSINESS_HOURS", "START_TIME", settings.get("businessStartTime"));
        updateCommonCode("BUSINESS_HOURS", "END_TIME", settings.get("businessEndTime"));
        updateCommonCode("BUSINESS_HOURS", "LUNCH_START", settings.get("lunchStartTime"));
        updateCommonCode("BUSINESS_HOURS", "LUNCH_END", settings.get("lunchEndTime"));
        updateCommonCode("BUSINESS_HOURS", "SLOT_INTERVAL", settings.get("slotIntervalMinutes"));
        
        updateCommonCode("CANCELLATION_POLICY", "MIN_NOTICE_HOURS", settings.get("minNoticeHours"));
        updateCommonCode("CANCELLATION_POLICY", "MAX_ADVANCE_DAYS", settings.get("maxAdvanceBookingDays"));
        updateCommonCode("CANCELLATION_POLICY", "BREAK_TIME_MINUTES", settings.get("breakTimeMinutes"));
        
        // 캐시 초기화
        clearCache();
        
        log.info("✅ 업무 시간 설정 업데이트 완료");
    }
    
    @Override
    public boolean isBusinessTime(LocalTime time) {
        LocalTime startTime = getBusinessStartTime();
        LocalTime endTime = getBusinessEndTime();
        
        return !time.isBefore(startTime) && time.isBefore(endTime) && !isLunchTime(time);
    }
    
    @Override
    public boolean isLunchTime(LocalTime time) {
        LocalTime lunchStart = getLunchStartTime();
        LocalTime lunchEnd = getLunchEndTime();
        
        return !time.isBefore(lunchStart) && time.isBefore(lunchEnd);
    }
    
    /**
     * 공통 코드에서 시간값 조회
     */
    private LocalTime getTimeFromCode(String groupCode, String codeValue, LocalTime defaultValue) {
        try {
            return commonCodeRepository.findByCodeGroupAndCodeValue(groupCode, codeValue)
                .map(code -> {
                    String timeStr = code.getCodeLabel();
                    // "업무 시작시간 (10:00)" -> "10:00" 추출
                    if (timeStr.contains("(") && timeStr.contains(")")) {
                        timeStr = timeStr.substring(timeStr.indexOf("(") + 1, timeStr.indexOf(")"));
                    }
                    return LocalTime.parse(timeStr, timeFormatter);
                })
                .orElse(defaultValue);
        } catch (Exception e) {
            log.warn("시간 코드 조회 실패: {}.{}, 기본값 사용: {}", groupCode, codeValue, defaultValue, e);
            return defaultValue;
        }
    }
    
    /**
     * 공통 코드에서 정수값 조회
     */
    private int getIntFromCode(String groupCode, String codeValue, int defaultValue) {
        try {
            return commonCodeRepository.findByCodeGroupAndCodeValue(groupCode, codeValue)
                .map(code -> {
                    String intStr = code.getCodeLabel();
                    // "시간 슬롯 간격 (30분)" -> "30" 추출
                    if (intStr.contains("(") && intStr.contains(")")) {
                        intStr = intStr.substring(intStr.indexOf("(") + 1, intStr.indexOf(")"));
                        // "30분" -> "30" 추출
                        intStr = intStr.replaceAll("[^0-9]", "");
                    }
                    return Integer.parseInt(intStr);
                })
                .orElse(defaultValue);
        } catch (Exception e) {
            log.warn("정수 코드 조회 실패: {}.{}, 기본값 사용: {}", groupCode, codeValue, defaultValue, e);
            return defaultValue;
        }
    }
    
    /**
     * 공통 코드 업데이트
     */
    private void updateCommonCode(String groupCode, String codeValue, Object newValue) {
        try {
            commonCodeRepository.findByCodeGroupAndCodeValue(groupCode, codeValue)
                .ifPresent(code -> {
                    String newLabel = code.getCodeLabel();
                    
                    // 시간 형식인 경우
                    if (newValue instanceof String && ((String) newValue).matches("\\d{2}:\\d{2}")) {
                        newLabel = newLabel.replaceAll("\\(.*\\)", "(" + newValue + ")");
                    } else {
                        // 숫자인 경우
                        newLabel = newLabel.replaceAll("\\(.*\\)", "(" + newValue + (codeValue.contains("HOURS") ? "시간" : 
                                                                                 codeValue.contains("DAYS") ? "일" : "분") + ")");
                    }
                    
                    code.setCodeLabel(newLabel);
                    code.setKoreanName(newLabel);
                    commonCodeRepository.save(code);
                    
                    log.info("✅ 공통 코드 업데이트: {}.{} = {}", groupCode, codeValue, newLabel);
                });
        } catch (Exception e) {
            log.error("공통 코드 업데이트 실패: {}.{}", groupCode, codeValue, e);
        }
    }
    
    /**
     * 캐시 초기화
     */
    private void clearCache() {
        settingsCache.clear();
        log.info("🔄 업무 시간 설정 캐시 초기화 완료");
    }
}
