package com.coresolution.consultation.dto.prediction;

import java.time.DayOfWeek;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

/**
 * 미예약 예상 방문 내담자 응답 DTO
 *
 * <p>예상 방문일에 예약이 없는 내담자의 정보를 담는다.</p>
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-08-13
 */
@Data
@Builder
public class UnbookedExpectedClientResponse {

    /** 내담자 사용자 ID */
    private Long clientId;

    /** 내담자명 (safeDisplay 적용) */
    private String clientName;

    /** 담당 상담사 ID */
    private Long consultantId;

    /** 담당 상담사명 */
    private String consultantName;

    /** 매핑 ID (consultant_client_mappings.id) */
    private Long mappingId;

    /** 예상 방문일 */
    private LocalDate expectedDate;

    /** 방문 간격 (일) */
    private int intervalDays;

    /** 선호 요일 */
    private DayOfWeek preferredDayOfWeek;

    /** 방문 패턴 요약 (예: "주1회 화요일") */
    private String patternSummary;

    /** 신뢰도 (0.0 ~ 1.0) */
    private double confidence;

    /** 신뢰도 등급 (HIGH / MEDIUM / LOW) */
    private String confidenceLevel;

    /** 마지막 방문(COMPLETED)일 */
    private LocalDate lastVisitDate;
}
