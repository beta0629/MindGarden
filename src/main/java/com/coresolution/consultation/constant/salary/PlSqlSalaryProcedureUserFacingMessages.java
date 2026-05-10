package com.coresolution.consultation.constant.salary;

/**
 * PL/SQL 급여 프로시저 호출 실패 시 사용자에게 노출할 문구.
 * 서비스·컨트롤러에서 동일 문자열을 참조해 메시지 불일치를 방지한다.
 *
 * @author MindGarden
 * @since 2026-05-11
 */
public final class PlSqlSalaryProcedureUserFacingMessages {

    private PlSqlSalaryProcedureUserFacingMessages() {
    }

    /**
     * 통합 급여 확정(ProcessIntegratedSalaryCalculation) 실패 시 DB가 사유를 비운 경우 안내.
     */
    public static final String INTEGRATED_CALC_FAILURE_WHEN_DB_SILENT =
            "급여 계산 확정에 실패했습니다. 자세한 사유가 없으면 같은 기간 중복 확정 여부를 확인해 주세요.";
}
