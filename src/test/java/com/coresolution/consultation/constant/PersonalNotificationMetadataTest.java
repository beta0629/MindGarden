package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("PersonalNotificationMetadata")
class PersonalNotificationMetadataTest {

    @Test
    @DisplayName("kind·mappingId·productName·amount 를 JSON 으로 넣고 0 이하 금액은 뺀다")
    void toJson_includesKindMappingProductAndPositiveAmount() {
        String json = PersonalNotificationMetadata.toJson(
                PersonalNotificationMetadata.KIND_PAYMENT_CONFIRMED, 900L, "10회 패키지", 1000L);

        assertThat(json)
                .contains("\"kind\":\"PAYMENT_CONFIRMED\"")
                .contains("\"mappingId\":900")
                .contains("\"productName\":\"10회 패키지\"")
                .contains("\"amount\":1000")
                .doesNotContain("패키지:");

        assertThat(PersonalNotificationMetadata.toJson(
                PersonalNotificationMetadata.KIND_DEPOSIT_CONFIRMED, 1L, "상담 상품", 0L))
                .doesNotContain("amount")
                .contains("상담 상품");
        assertThat(PersonalNotificationMetadata.toJson(" ", 1L, "상품", 10L)).isNull();
    }
}
