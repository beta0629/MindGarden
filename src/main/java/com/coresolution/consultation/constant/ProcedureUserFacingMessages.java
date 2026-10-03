package com.coresolution.consultation.constant;

/**
 * 저장 프로시저 실패 시 사용자에게 보여 줄 한글 문구와 로그용 프로시저 이름.
 * 프로시저·SQL 원문은 응답에 넣지 않고 {@link com.coresolution.consultation.util.ProcedureResults} 가 로그로만 남긴다.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
public final class ProcedureUserFacingMessages {

    public static final String PROC_GET_INTEGRATED_SALARY_STATISTICS = "GetIntegratedSalaryStatistics";
    public static final String PROC_APPLY_DISCOUNT_ACCOUNTING = "ApplyDiscountAccounting";
    public static final String PROC_PROCESS_DISCOUNT_REFUND = "ProcessDiscountRefund";
    public static final String PROC_UPDATE_DISCOUNT_STATUS = "UpdateDiscountStatus";
    public static final String PROC_GET_DISCOUNT_STATISTICS = "GetDiscountStatistics";
    public static final String PROC_VALIDATE_DISCOUNT_INTEGRITY = "ValidateDiscountIntegrity";
    public static final String PROC_UPDATE_ALL_BRANCH_DAILY_STATISTICS = "UpdateAllBranchDailyStatistics";
    public static final String PROC_UPDATE_CONSULTANT_PERFORMANCE = "UpdateConsultantPerformance";
    public static final String PROC_UPDATE_ALL_CONSULTANT_PERFORMANCE = "UpdateAllConsultantPerformance";
    public static final String PROC_DAILY_PERFORMANCE_MONITORING = "DailyPerformanceMonitoring";
    public static final String PROC_GENERATE_QUARTERLY_FINANCIAL_REPORT = "GenerateQuarterlyFinancialReport";
    public static final String QUERY_CONSOLIDATED_FINANCIAL_DATA = "ConsolidatedFinancialData";
    public static final String QUERY_FINANCIAL_REPORT = "FinancialReport";

    public static final String SALARY_STATISTICS_FAILED =
            "급여 통계를 불러오지 못했습니다. 잠시 후 다시 시도하고, 계속되면 관리자에게 문의해 주세요.";
    public static final String DISCOUNT_APPLY_FAILED =
            "할인 적용을 처리하지 못했습니다. 잠시 후 다시 시도하고, 계속되면 관리자에게 문의해 주세요.";
    public static final String DISCOUNT_REFUND_FAILED =
            "할인 환불을 처리하지 못했습니다. 잠시 후 다시 시도하고, 계속되면 관리자에게 문의해 주세요.";
    public static final String DISCOUNT_STATUS_FAILED =
            "할인 상태를 바꾸지 못했습니다. 잠시 후 다시 시도하고, 계속되면 관리자에게 문의해 주세요.";
    public static final String DISCOUNT_STATISTICS_FAILED =
            "할인 통계를 불러오지 못했습니다. 잠시 후 다시 시도하고, 계속되면 관리자에게 문의해 주세요.";
    public static final String DISCOUNT_INTEGRITY_FAILED =
            "할인 무결성 검증을 하지 못했습니다. 잠시 후 다시 시도하고, 계속되면 관리자에게 문의해 주세요.";
    public static final String DAILY_STATISTICS_FAILED =
            "일별 통계를 갱신하지 못했습니다. 잠시 후 다시 시도하고, 계속되면 관리자에게 문의해 주세요.";
    public static final String CONSULTANT_PERFORMANCE_FAILED =
            "상담사 성과를 갱신하지 못했습니다. 잠시 후 다시 시도하고, 계속되면 관리자에게 문의해 주세요.";
    public static final String PERFORMANCE_MONITORING_FAILED =
            "성과 모니터링을 실행하지 못했습니다. 잠시 후 다시 시도하고, 계속되면 관리자에게 문의해 주세요.";
    public static final String CONSOLIDATED_FINANCIAL_FAILED =
            "전사 통합 재무 현황을 불러오지 못했습니다. 잠시 후 다시 시도하고, 계속되면 관리자에게 문의해 주세요.";
    public static final String FINANCIAL_REPORT_FAILED =
            "재무 보고서를 불러오지 못했습니다. 잠시 후 다시 시도하고, 계속되면 관리자에게 문의해 주세요.";

    private ProcedureUserFacingMessages() {
    }
}
