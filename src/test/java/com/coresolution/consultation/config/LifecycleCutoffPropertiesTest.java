package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.lifecycle.BusinessMode;
import com.coresolution.consultation.lifecycle.LifecycleDataCategory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * 라이프사이클 cutoff 설정 — businessMode 분기 + 카테고리별 보존 연수 검증.
 *
 * <p>본 합의서 v1.2 §0.1 Q9·Q10 결재 결과 default 검증.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@DisplayName("LifecycleCutoffProperties — 정책 default + 분기 로직")
class LifecycleCutoffPropertiesTest {

    @Test
    @DisplayName("default businessMode 는 NON_MEDICAL")
    void defaultBusinessModeIsNonMedical() {
        LifecycleCutoffProperties props = new LifecycleCutoffProperties();
        assertThat(props.getBusinessMode()).isEqualTo(BusinessMode.NON_MEDICAL);
    }

    @Test
    @DisplayName("default 보존 연수 — 정책서 v1.2 결재 결과")
    void defaultRetentionYearsMatchPolicyV12() {
        LifecycleCutoffProperties props = new LifecycleCutoffProperties();
        assertThat(props.getUserDataYears()).isEqualTo(1);
        assertThat(props.getConsultationRecordsYears()).isEqualTo(3);
        assertThat(props.getMedicalConsultationRecordsYears()).isEqualTo(10);
        assertThat(props.getPaymentsYears()).isEqualTo(5);
        assertThat(props.getSalaryDataYears()).isEqualTo(3);
        assertThat(props.getAccessLogsYears()).isEqualTo(1);
        assertThat(props.getAuditLogsYears()).isEqualTo(3);
        assertThat(props.getConsentLogsYears()).isEqualTo(3);
    }

    @Nested
    @DisplayName("getEffectiveConsultationRecordsYears 분기")
    class EffectiveConsultationRecordsYears {

        @Test
        @DisplayName("NON_MEDICAL → consultationRecordsYears 반환")
        void nonMedicalReturnsNonMedicalYears() {
            LifecycleCutoffProperties props = new LifecycleCutoffProperties();
            props.setBusinessMode(BusinessMode.NON_MEDICAL);
            props.setConsultationRecordsYears(3);
            props.setMedicalConsultationRecordsYears(10);
            assertThat(props.getEffectiveConsultationRecordsYears()).isEqualTo(3);
        }

        @Test
        @DisplayName("MEDICAL → medicalConsultationRecordsYears 반환")
        void medicalReturnsMedicalYears() {
            LifecycleCutoffProperties props = new LifecycleCutoffProperties();
            props.setBusinessMode(BusinessMode.MEDICAL);
            props.setConsultationRecordsYears(3);
            props.setMedicalConsultationRecordsYears(10);
            assertThat(props.getEffectiveConsultationRecordsYears()).isEqualTo(10);
        }
    }

    @Test
    @DisplayName("getRetentionYears 카테고리별 분기 — 모든 카테고리 매핑")
    void getRetentionYearsCoversAllCategories() {
        LifecycleCutoffProperties props = new LifecycleCutoffProperties();
        assertThat(props.getRetentionYears(LifecycleDataCategory.USER_DATA))
            .isEqualTo(props.getUserDataYears());
        assertThat(props.getRetentionYears(LifecycleDataCategory.CONSULTATION_RECORDS))
            .isEqualTo(props.getEffectiveConsultationRecordsYears());
        assertThat(props.getRetentionYears(LifecycleDataCategory.PAYMENTS))
            .isEqualTo(props.getPaymentsYears());
        assertThat(props.getRetentionYears(LifecycleDataCategory.SALARY_DATA))
            .isEqualTo(props.getSalaryDataYears());
        assertThat(props.getRetentionYears(LifecycleDataCategory.ACCESS_LOGS))
            .isEqualTo(props.getAccessLogsYears());
        assertThat(props.getRetentionYears(LifecycleDataCategory.AUDIT_LOGS))
            .isEqualTo(props.getAuditLogsYears());
        assertThat(props.getRetentionYears(LifecycleDataCategory.CONSENT_LOGS))
            .isEqualTo(props.getConsentLogsYears());
    }
}
