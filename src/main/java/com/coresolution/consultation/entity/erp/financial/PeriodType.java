package com.coresolution.consultation.entity.erp.financial;

/**
 * 재무 마감 기간 단위.
 *
 * <p>합의서 §2 Q1: DAY/MONTH 자동 마감, WEEK 은 시그니처/스케줄러만 유지(별도 결재 시 활성화).</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
public enum PeriodType {

    /** 일 단위 마감 */
    DAY,

    /** 주 단위 마감 (현재 dry-run only, Q1 default) */
    WEEK,

    /** 월 단위 마감 */
    MONTH
}
