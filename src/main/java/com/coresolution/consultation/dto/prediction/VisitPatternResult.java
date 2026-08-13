package com.coresolution.consultation.dto.prediction;

import java.time.DayOfWeek;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

/**
 * 내담자 방문 패턴 분석 결과 DTO
 *
 * <p>COMPLETED 일정 간격을 기반으로 산출한 방문 주기·선호 요일·신뢰도를 담는다.</p>
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-08-13
 */
@Data
@Builder
public class VisitPatternResult {

    /** 방문 간격 중앙값 (일) */
    private int intervalDays;

    /** 선호 요일 (최빈값) */
    private DayOfWeek preferredDayOfWeek;

    /** 신뢰도 (0.0 ~ 1.0, 1-std/mean 클램프) */
    private double confidence;

    /** COMPLETED 회기 수 */
    private int completedCount;

    /** 마지막 COMPLETED 일정 일자 */
    private LocalDate lastCompletedDate;

    /**
     * 신뢰도 등급 문자열 반환
     */
    public String getConfidenceLevel() {
        if (confidence >= com.coresolution.consultation.constant.VisitPredictionConstants.CONFIDENCE_HIGH_THRESHOLD) {
            return "HIGH";
        } else if (confidence >= com.coresolution.consultation.constant.VisitPredictionConstants.CONFIDENCE_MEDIUM_THRESHOLD) {
            return "MEDIUM";
        }
        return "LOW";
    }
}
