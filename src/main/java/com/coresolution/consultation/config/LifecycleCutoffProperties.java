package com.coresolution.consultation.config;

import com.coresolution.consultation.lifecycle.BusinessMode;
import com.coresolution.consultation.lifecycle.LifecycleDataCategory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import lombok.Getter;
import lombok.Setter;

/**
 * 사용자 라이프사이클 cutoff(만료 데이터 파기) 정책 설정.
 *
 * <p>{@code mindgarden.lifecycle.cutoff.*} 키로 바인딩. 본 합의서
 * {@code docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md} v1.2 §0.1 Q9~Q11 결재 결과
 * (NON_MEDICAL 3년 default + 사업자 자율 정책 + Strategy 기반 PII 스크러빙)를 정형화한다.
 *
 * <p>모든 보존 기간은 외부화되어 있고 코드 내 하드코딩이 없다. 의료기관 연계(MEDICAL) 로 전환 시
 * {@link #getBusinessMode()} 만 변경하면 {@code consultation_records} cutoff 가 자동으로
 * {@link #getMedicalConsultationRecordsYears()} 로 분기된다.
 *
 * <p><b>정책 버전 추적</b>: {@link #getPolicyVersion()} 은 destruction 로그({@code metadata})에
 * stamp 되어 정책 변경 이력을 추적한다.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@ConfigurationProperties(prefix = "mindgarden.lifecycle.cutoff")
@Getter
@Setter
public class LifecycleCutoffProperties {

    /**
     * 비즈니스 정체성 모드.
     *
     * <p>{@link BusinessMode#NON_MEDICAL} default — 학회 윤리강령 + 동의서 명시로
     * {@code consultation_records} 3년 cutoff.
     * {@link BusinessMode#MEDICAL} 로 전환 시 의료법 §22 적용으로 10년.
     */
    private BusinessMode businessMode = BusinessMode.NON_MEDICAL;

    /** 정책 버전 라벨. destruction 로그 metadata 에 stamp. */
    private String policyVersion = "v1.2-2026-05-28";

    /** 탈퇴 사용자 보존 연수. */
    private int userDataYears = 1;

    /** {@code consultation_records} 보존 연수 — NON_MEDICAL 기본 3년 (학회 윤리강령). */
    private int consultationRecordsYears = 3;

    /** {@code consultation_records} 보존 연수 — MEDICAL 모드 시 10년 (의료법 §22). */
    private int medicalConsultationRecordsYears = 10;

    /** {@code payments} 보존 연수 — 전자상거래법 §6 + 국세기본법 §85의3 + 전금법 §22 기준 5년. */
    private int paymentsYears = 5;

    /** {@code salary_calculations} 보존 연수. */
    private int salaryDataYears = 3;

    /** {@code personal_data_access_logs} 보존 연수. */
    private int accessLogsYears = 1;

    /** {@code audit_logs} 보존 연수 — 개인정보보호법 §29 + 정보보호 표준. */
    private int auditLogsYears = 3;

    /** {@code consent_logs} 보존 연수. */
    private int consentLogsYears = 3;

    /**
     * 현재 {@link #businessMode} 에 따른 {@code consultation_records} 보존 연수.
     *
     * @return {@link BusinessMode#MEDICAL} 일 때 {@link #medicalConsultationRecordsYears},
     *         아니면 {@link #consultationRecordsYears}.
     */
    public int getEffectiveConsultationRecordsYears() {
        return businessMode == BusinessMode.MEDICAL
            ? medicalConsultationRecordsYears
            : consultationRecordsYears;
    }

    /**
     * 카테고리별 보존 연수 조회 (분기 단일 진입점).
     *
     * @param category 데이터 카테고리
     * @return 보존 연수
     */
    public int getRetentionYears(LifecycleDataCategory category) {
        switch (category) {
            case USER_DATA:
                return userDataYears;
            case CONSULTATION_RECORDS:
                return getEffectiveConsultationRecordsYears();
            case PAYMENTS:
                return paymentsYears;
            case SALARY_DATA:
                return salaryDataYears;
            case ACCESS_LOGS:
                return accessLogsYears;
            case AUDIT_LOGS:
                return auditLogsYears;
            case CONSENT_LOGS:
                return consentLogsYears;
            default:
                throw new IllegalArgumentException("지원하지 않는 라이프사이클 카테고리: " + category);
        }
    }
}
