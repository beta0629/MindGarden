package com.coresolution.consultation.constant.consultation;

/**
 * 상담일지 열람 감사 로그 상수 (행위·결과·대상 종류).
 *
 * <p>DB 컬럼 길이(20·40) 안에서만 사용한다. 값은 운영 쿼리·대시보드의 SSOT 이므로 임의로 바꾸지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public final class ConsultationRecordAccessAudit {

    /** 단건 열람 (본문 포함 — 작성 상담사·같은 테넌트 관리자 계열 허용). */
    public static final String ACTION_VIEW = "VIEW";

    /** 목록 조회. */
    public static final String ACTION_LIST = "LIST";

    /** 외부 AI 생성 호출 (SOAP·DAP·진단 초안 등). */
    public static final String ACTION_AI_GENERATE = "AI_GENERATE";

    /** 내보내기 (파일·리포트 반출). */
    public static final String ACTION_EXPORT = "EXPORT";

    /** 허용됨. */
    public static final String RESULT_ALLOWED = "ALLOWED";

    /** 거부됨. */
    public static final String RESULT_DENIED = "DENIED";

    /** 회기권 상담일지. */
    public static final String KIND_CONSULTATION_RECORD = "CONSULTATION_RECORD";

    /** 타기관 연계 상담일지. */
    public static final String KIND_INSTITUTION_LINK_LOG = "INSTITUTION_LINK_LOG";

    /** 임상 리포트(SOAP·DAP·진단 초안). */
    public static final String KIND_CLINICAL_REPORT = "CLINICAL_REPORT";

    private ConsultationRecordAccessAudit() {
    }
}
