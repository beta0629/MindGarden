package com.coresolution.consultation.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 변동 금액 반복 지출(카드대금 등) 월별 수동 기록 요청.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecurringExpenseRecordMonthRequest {

    /** 기록 대상 연월 (예: 2026-08) */
    private String yearMonth;

    /** 부가세 포함 지급액 */
    private BigDecimal amount;
}
