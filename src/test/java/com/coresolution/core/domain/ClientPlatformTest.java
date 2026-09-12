package com.coresolution.core.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@link ClientPlatform} 헤더 파싱 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-12
 */
@DisplayName("ClientPlatform.fromHeader")
class ClientPlatformTest {

    @Test
    @DisplayName("ios/android/web 및 미지정 파싱")
    void fromHeader_parsesKnownAndDefaultsToWeb() {
        assertThat(ClientPlatform.fromHeader("ios")).isEqualTo(ClientPlatform.IOS);
        assertThat(ClientPlatform.fromHeader("Android")).isEqualTo(ClientPlatform.ANDROID);
        assertThat(ClientPlatform.fromHeader("aos")).isEqualTo(ClientPlatform.ANDROID);
        assertThat(ClientPlatform.fromHeader("web")).isEqualTo(ClientPlatform.WEB);
        assertThat(ClientPlatform.fromHeader(null)).isEqualTo(ClientPlatform.WEB);
        assertThat(ClientPlatform.fromHeader("")).isEqualTo(ClientPlatform.WEB);
        assertThat(ClientPlatform.fromHeader("unknown")).isEqualTo(ClientPlatform.WEB);
    }
}
