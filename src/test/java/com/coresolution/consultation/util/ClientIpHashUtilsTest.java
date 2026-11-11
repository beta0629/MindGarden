package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/**
 * {@link ClientIpHashUtils} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
class ClientIpHashUtilsTest {

    @Test
    void sha256Hex_isStableAndNotPlaintext() {
        String hash = ClientIpHashUtils.sha256Hex("192.0.2.10");
        assertThat(hash).isNotNull();
        assertThat(hash).doesNotContain("192.0.2");
        assertThat(hash).hasSize(64);
        assertThat(ClientIpHashUtils.sha256Hex("192.0.2.10")).isEqualTo(hash);
    }
}
