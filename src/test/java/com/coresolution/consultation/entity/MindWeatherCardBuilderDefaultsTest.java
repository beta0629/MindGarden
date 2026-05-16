package com.coresolution.consultation.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link MindWeatherCard} SuperBuilder 시 감사·소프트삭제 기본값이 null이 되지 않는지 검증.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
@DisplayName("MindWeatherCard SuperBuilder 기본값")
class MindWeatherCardBuilderDefaultsTest {

    @Test
    void builder_leavesIsDeletedAndVersionNonNull() {
        User client = new User();
        client.setId(1L);

        MindWeatherCard card = MindWeatherCard.builder()
            .client(client)
            .source("memo")
            .bodyText("피곤해요")
            .summary("요약")
            .tone("negative")
            .keywords(new ArrayList<>())
            .shareSummary(false)
            .shareOriginal(false)
            .build();

        assertThat(card.getIsDeleted()).isNotNull().isFalse();
        assertThat(card.getVersion()).isNotNull().isZero();
    }
}
