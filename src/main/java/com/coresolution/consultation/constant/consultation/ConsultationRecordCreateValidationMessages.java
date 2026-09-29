package com.coresolution.consultation.constant.consultation;

/**
 * 상담일지 작성(POST) 서버 필수값 검증 문구·한도.
 * 프론트 {@code validateConsultationLogForm} 과 같은 규칙·문구를 쓴다.
 *
 * @author CoreSolution
 * @since 2026-09-29
 */
public final class ConsultationRecordCreateValidationMessages {

    /** 프론트 {@code CONSULTATION_LOG_TEXTAREA_MAX_LENGTH} 및 엔티티 {@code @Size(max = 4000)} 와 동일 */
    public static final int CLIENT_CONDITION_MAX_LENGTH = 4000;

    public static final int SESSION_DURATION_MINUTES_MIN = 1;

    public static final String FIELD_SESSION_DURATION_MINUTES = "sessionDurationMinutes";
    public static final String FIELD_CLIENT_CONDITION = "clientCondition";
    public static final String FIELD_MAIN_ISSUES = "mainIssues";
    public static final String FIELD_INTERVENTION_METHODS = "interventionMethods";
    public static final String FIELD_CLIENT_RESPONSE = "clientResponse";
    public static final String FIELD_RISK_ASSESSMENT = "riskAssessment";
    public static final String FIELD_PROGRESS_EVALUATION = "progressEvaluation";

    public static final String MSG_SUMMARY = "필수 항목을 모두 입력해주세요.";
    public static final String MSG_SESSION_DURATION_MINUTES = "세션 시간을 입력해주세요 (최소 1분)";
    public static final String MSG_CLIENT_CONDITION = "내담자 상태를 입력해주세요";
    public static final String MSG_CLIENT_CONDITION_MAX_LENGTH = "내담자 상태는 4000자 이하로 입력해주세요";
    public static final String MSG_MAIN_ISSUES = "주요 이슈를 입력해주세요";
    public static final String MSG_INTERVENTION_METHODS = "개입 방법을 입력해주세요";
    public static final String MSG_CLIENT_RESPONSE = "내담자 반응을 입력해주세요";
    public static final String MSG_RISK_ASSESSMENT = "위험도 평가를 선택해주세요";
    public static final String MSG_PROGRESS_EVALUATION = "진행 평가를 입력해주세요";

    private ConsultationRecordCreateValidationMessages() {
    }
}
