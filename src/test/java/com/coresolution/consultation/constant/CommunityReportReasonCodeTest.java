package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Apple G1.2 UGC (P2-C) — {@link CommunityReportReasonCode} 5종 매핑 회귀 테스트.
 *
 * <p>레거시 8종 enum 값이 5종으로 매핑되는지(`toApprovedReasonCode`) + 신규 5종이 모두
 * `isApprovedForIntake() == true` 인지 검증한다. 디자이너 시안 §B 정합.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@DisplayName("CommunityReportReasonCode — P2-C 5종 매핑")
class CommunityReportReasonCodeTest {

    @Test
    @DisplayName("ABUSIVE_LANGUAGE → HARASSMENT 매핑")
    void abusiveLanguageMapsToHarassment() {
        assertThat(CommunityReportReasonCode.ABUSIVE_LANGUAGE.toApprovedReasonCode())
                .isEqualTo(CommunityReportReasonCode.HARASSMENT);
    }

    @Test
    @DisplayName("VIOLENCE → HARASSMENT 매핑")
    void violenceMapsToHarassment() {
        assertThat(CommunityReportReasonCode.VIOLENCE.toApprovedReasonCode())
                .isEqualTo(CommunityReportReasonCode.HARASSMENT);
    }

    @Test
    @DisplayName("MISINFORMATION → OTHER 매핑")
    void misinformationMapsToOther() {
        assertThat(CommunityReportReasonCode.MISINFORMATION.toApprovedReasonCode())
                .isEqualTo(CommunityReportReasonCode.OTHER);
    }

    @Test
    @DisplayName("COPYRIGHT → OTHER 매핑")
    void copyrightMapsToOther() {
        assertThat(CommunityReportReasonCode.COPYRIGHT.toApprovedReasonCode())
                .isEqualTo(CommunityReportReasonCode.OTHER);
    }

    @Test
    @DisplayName("신규 5종은 자기 자신으로 매핑 — OBSCENE/HARASSMENT/SPAM/SELF_HARM/OTHER")
    void newFiveStayAsThemselves() {
        assertThat(CommunityReportReasonCode.OBSCENE.toApprovedReasonCode())
                .isEqualTo(CommunityReportReasonCode.OBSCENE);
        assertThat(CommunityReportReasonCode.HARASSMENT.toApprovedReasonCode())
                .isEqualTo(CommunityReportReasonCode.HARASSMENT);
        assertThat(CommunityReportReasonCode.SPAM.toApprovedReasonCode())
                .isEqualTo(CommunityReportReasonCode.SPAM);
        assertThat(CommunityReportReasonCode.SELF_HARM.toApprovedReasonCode())
                .isEqualTo(CommunityReportReasonCode.SELF_HARM);
        assertThat(CommunityReportReasonCode.OTHER.toApprovedReasonCode())
                .isEqualTo(CommunityReportReasonCode.OTHER);
    }

    @Test
    @DisplayName("isApprovedForIntake — 신규 5종 true, 레거시 4종 false")
    void approvedForIntake_onlyFive() {
        assertThat(CommunityReportReasonCode.OBSCENE.isApprovedForIntake()).isTrue();
        assertThat(CommunityReportReasonCode.HARASSMENT.isApprovedForIntake()).isTrue();
        assertThat(CommunityReportReasonCode.SPAM.isApprovedForIntake()).isTrue();
        assertThat(CommunityReportReasonCode.SELF_HARM.isApprovedForIntake()).isTrue();
        assertThat(CommunityReportReasonCode.OTHER.isApprovedForIntake()).isTrue();

        assertThat(CommunityReportReasonCode.ABUSIVE_LANGUAGE.isApprovedForIntake()).isFalse();
        assertThat(CommunityReportReasonCode.VIOLENCE.isApprovedForIntake()).isFalse();
        assertThat(CommunityReportReasonCode.MISINFORMATION.isApprovedForIntake()).isFalse();
        assertThat(CommunityReportReasonCode.COPYRIGHT.isApprovedForIntake()).isFalse();
    }
}
