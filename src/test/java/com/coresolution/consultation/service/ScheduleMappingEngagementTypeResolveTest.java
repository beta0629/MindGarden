package com.coresolution.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.ClientEngagementTypeConstants;
import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.service.ScheduleMappingContextResolver.ScheduleMappingResponseContext;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 일정 응답 engagementType/paymentTiming 공용 해석 — N+1 없이 컨텍스트에 실림.
 *
 * @author CoreSolution
 * @since 2026-10-08
 */
@DisplayName("ScheduleMappingContextResolver engagementType")
class ScheduleMappingEngagementTypeResolveTest {

    @Test
    @DisplayName("내담자 engagementType=INSTITUTION_LINK 우선")
    void clientEngagementTypePreferred() {
        Client client = new Client();
        client.setEngagementType(ClientEngagementTypeConstants.INSTITUTION_LINK);
        String resolved = ScheduleMappingContextResolver.resolveEngagementType(
                client, PaymentTimingConstants.ADVANCE);
        assertThat(resolved).isEqualTo(ClientEngagementTypeConstants.INSTITUTION_LINK);
    }

    @Test
    @DisplayName("내담자 없으면 paymentTiming=INSTITUTION_LINK 파생")
    void paymentTimingDerivesInstitution() {
        String resolved = ScheduleMappingContextResolver.resolveEngagementType(
                null, PaymentTimingConstants.INSTITUTION_LINK);
        assertThat(resolved).isEqualTo(ClientEngagementTypeConstants.INSTITUTION_LINK);
    }

    @Test
    @DisplayName("컨텍스트에 paymentTiming·engagementType 필드 포함")
    void contextCarriesEngagementFields() {
        ScheduleMappingResponseContext ctx = new ScheduleMappingResponseContext(
                11L, 10, 5, PaymentTimingConstants.INSTITUTION_LINK,
                ClientEngagementTypeConstants.INSTITUTION_LINK);
        assertThat(ctx.getMappingId()).isEqualTo(11L);
        assertThat(ctx.getPaymentTiming()).isEqualTo(PaymentTimingConstants.INSTITUTION_LINK);
        assertThat(ctx.getEngagementType()).isEqualTo(ClientEngagementTypeConstants.INSTITUTION_LINK);
    }

    @Test
    @DisplayName("empty 컨텍스트는 engagement/paymentTiming null")
    void emptyContextNullEngagement() {
        ScheduleMappingResponseContext empty = ScheduleMappingResponseContext.empty();
        assertThat(empty.getEngagementType()).isNull();
        assertThat(empty.getPaymentTiming()).isNull();
        assertThat(empty.getMappingId()).isNull();
    }
}
