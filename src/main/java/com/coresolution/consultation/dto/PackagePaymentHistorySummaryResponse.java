package com.coresolution.consultation.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 내담자 패키지 결제 이력 합산 요약.
 *
 * @author MindGarden
 * @since 2026-07-28
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PackagePaymentHistorySummaryResponse {

    /** 내담자 ID */
    private Long clientId;

    /** 내담자명(복호화) */
    private String clientName;

    /** ACTIVE 기준 표시용 상담사명(복수면 첫 ACTIVE) */
    private String consultantName;

    /** ACTIVE 매핑 총 회기 합 */
    private Integer totalSessions;

    /** ACTIVE 매핑 잔여 회기 합 */
    private Integer remainingSessions;

    /** 타임라인 금액 합(없으면 0) */
    private BigDecimal totalAmount;

    /** 타임라인 건수 */
    private Integer itemCount;
}
