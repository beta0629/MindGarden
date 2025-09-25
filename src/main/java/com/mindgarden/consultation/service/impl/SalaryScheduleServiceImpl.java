package com.mindgarden.consultation.service.impl;

import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.service.CommonCodeService;
import com.mindgarden.consultation.service.SalaryScheduleService;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 급여 스케줄 관리 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-25
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SalaryScheduleServiceImpl implements SalaryScheduleService {
    
    private final CommonCodeService commonCodeService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    public LocalDate getCurrentMonthBaseDate() {
        LocalDate now = LocalDate.now();
        return getBaseDate(now.getYear(), now.getMonthValue());
    }
    
    @Override
    public LocalDate getBaseDate(int year, int month) {
        try {
            CommonCode baseDateCode = commonCodeService.getCode("SALARY_BASE_DATE", "MONTHLY_BASE_DAY");
            if (baseDateCode != null && baseDateCode.getExtraData() != null) {
                JsonNode extraData = objectMapper.readTree(baseDateCode.getExtraData());
                String defaultDay = extraData.get("default_day").asText();
                
                if ("LAST_DAY".equals(defaultDay)) {
                    // 매월 말일
                    return LocalDate.of(year, month, 1).with(TemporalAdjusters.lastDayOfMonth());
                } else {
                    // 특정일 (숫자)
                    int day = Integer.parseInt(defaultDay);
                    LocalDate targetDate = LocalDate.of(year, month, 1);
                    int lastDay = targetDate.lengthOfMonth();
                    
                    // 해당 월의 마지막 날보다 큰 경우 마지막 날로 설정
                    return LocalDate.of(year, month, Math.min(day, lastDay));
                }
            }
        } catch (Exception e) {
            log.error("급여 기산일 조회 오류", e);
        }
        
        // 기본값: 매월 말일
        return LocalDate.of(year, month, 1).with(TemporalAdjusters.lastDayOfMonth());
    }
    
    @Override
    public LocalDate getCurrentMonthPaymentDate() {
        LocalDate now = LocalDate.now();
        return getPaymentDate(now.getYear(), now.getMonthValue());
    }
    
    @Override
    public LocalDate getPaymentDate(int year, int month) {
        try {
            CommonCode paymentDateCode = commonCodeService.getCode("SALARY_BASE_DATE", "PAYMENT_DAY");
            if (paymentDateCode != null && paymentDateCode.getExtraData() != null) {
                JsonNode extraData = objectMapper.readTree(paymentDateCode.getExtraData());
                int paymentDay = extraData.get("default_day").asInt();
                
                // 익월로 설정 (급여는 다음 달에 지급)
                LocalDate nextMonth = LocalDate.of(year, month, 1).plusMonths(1);
                int lastDay = nextMonth.lengthOfMonth();
                
                return LocalDate.of(nextMonth.getYear(), nextMonth.getMonthValue(), 
                                  Math.min(paymentDay, lastDay));
            }
        } catch (Exception e) {
            log.error("급여 지급일 조회 오류", e);
        }
        
        // 기본값: 익월 5일
        LocalDate nextMonth = LocalDate.of(year, month, 1).plusMonths(1);
        return LocalDate.of(nextMonth.getYear(), nextMonth.getMonthValue(), 5);
    }
    
    @Override
    public LocalDate getCurrentMonthCutoffDate() {
        LocalDate now = LocalDate.now();
        return getCutoffDate(now.getYear(), now.getMonthValue());
    }
    
    @Override
    public LocalDate getCutoffDate(int year, int month) {
        try {
            CommonCode cutoffDateCode = commonCodeService.getCode("SALARY_BASE_DATE", "CUTOFF_DAY");
            if (cutoffDateCode != null && cutoffDateCode.getExtraData() != null) {
                JsonNode extraData = objectMapper.readTree(cutoffDateCode.getExtraData());
                String defaultDay = extraData.get("default_day").asText();
                
                if ("LAST_DAY".equals(defaultDay)) {
                    // 매월 말일
                    return LocalDate.of(year, month, 1).with(TemporalAdjusters.lastDayOfMonth());
                } else {
                    // 특정일 (숫자)
                    int day = Integer.parseInt(defaultDay);
                    LocalDate targetDate = LocalDate.of(year, month, 1);
                    int lastDay = targetDate.lengthOfMonth();
                    
                    return LocalDate.of(year, month, Math.min(day, lastDay));
                }
            }
        } catch (Exception e) {
            log.error("급여 마감일 조회 오류", e);
        }
        
        // 기본값: 매월 말일
        return LocalDate.of(year, month, 1).with(TemporalAdjusters.lastDayOfMonth());
    }
    
    @Override
    public boolean isBatchExecutionTime() {
        LocalDate now = LocalDate.now();
        LocalDate cutoffDate = getCurrentMonthCutoffDate();
        
        // 마감일 이후에만 배치 실행 가능
        return now.isAfter(cutoffDate) || now.isEqual(cutoffDate);
    }
    
    @Override
    public LocalDate[] getCalculationPeriod(int year, int month) {
        LocalDate startDate;
        LocalDate endDate = getBaseDate(year, month);
        
        if (month == 1) {
            // 1월인 경우 전년 12월의 기산일부터
            startDate = getBaseDate(year - 1, 12).plusDays(1);
        } else {
            // 전월 기산일 다음날부터
            startDate = getBaseDate(year, month - 1).plusDays(1);
        }
        
        return new LocalDate[]{startDate, endDate};
    }
    
    /**
     * 공통 코드에서 급여 계산 요율 조회
     */
    public int getConsultationRate() {
        try {
            CommonCode rateCode = commonCodeService.getCode("SALARY_CALCULATION_METHOD", "CONSULTATION_COUNT");
            if (rateCode != null && rateCode.getExtraData() != null) {
                JsonNode extraData = objectMapper.readTree(rateCode.getExtraData());
                return extraData.get("rate_per_consultation").asInt();
            }
        } catch (Exception e) {
            log.error("상담 요율 조회 오류", e);
        }
        
        // 기본값: 30,000원
        return 30000;
    }
    
    /**
     * 공통 코드에서 시간당 기본 요율 조회
     */
    public int getDefaultHourlyRate() {
        try {
            CommonCode rateCode = commonCodeService.getCode("SALARY_CALCULATION_METHOD", "HOURLY_RATE");
            if (rateCode != null && rateCode.getExtraData() != null) {
                JsonNode extraData = objectMapper.readTree(rateCode.getExtraData());
                return extraData.get("default_hourly_rate").asInt();
            }
        } catch (Exception e) {
            log.error("시간당 기본 요율 조회 오류", e);
        }
        
        // 기본값: 25,000원
        return 25000;
    }
}
