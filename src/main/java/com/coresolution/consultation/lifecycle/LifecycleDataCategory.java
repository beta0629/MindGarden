package com.coresolution.consultation.lifecycle;

/**
 * 라이프사이클 cutoff 정책이 적용되는 데이터 카테고리.
 *
 * <p>{@link com.coresolution.consultation.service.PersonalDataDestructionService} 가 만료 데이터를
 * 파기할 때, 각 카테고리별 보존 기간을 {@link com.coresolution.consultation.config.LifecycleCutoffProperties}
 * 에서 조회하여 분기한다. 본 합의서 {@code docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md} v1.2 참조.
 *
 * <p>각 카테고리의 디폴트 보존 연수(NON_MEDICAL 기준):
 * <ul>
 *   <li>{@link #USER_DATA} — 1년 (탈퇴 후 1년 경과 사용자)</li>
 *   <li>{@link #CONSULTATION_RECORDS} — 3년(NON_MEDICAL) / 10년(MEDICAL)</li>
 *   <li>{@link #PAYMENTS} — 5년 (전자상거래법 §6 + 국세기본법 §85의3 + 전금법 §22)</li>
 *   <li>{@link #SALARY_DATA} — 3년</li>
 *   <li>{@link #ACCESS_LOGS} — 1년</li>
 *   <li>{@link #AUDIT_LOGS} — 3년 (개인정보보호법 §29 + 정보보호 표준)</li>
 *   <li>{@link #CONSENT_LOGS} — 3년</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-28
 */
public enum LifecycleDataCategory {

    /** 탈퇴 사용자(`users`) 행 — 1년. */
    USER_DATA,

    /** 상담 기록(`consultation_records`) — NON_MEDICAL 3년 / MEDICAL 10년. */
    CONSULTATION_RECORDS,

    /** 결제 데이터(`payments`) — 5년. */
    PAYMENTS,

    /** 급여 데이터(`salary_calculations`) — 3년. */
    SALARY_DATA,

    /** 개인정보 접근 로그(`personal_data_access_logs`) — 1년. */
    ACCESS_LOGS,

    /** 감사 로그(`audit_logs`) — 3년. */
    AUDIT_LOGS,

    /** 동의 로그(`consent_logs`) — 3년. */
    CONSENT_LOGS
}
