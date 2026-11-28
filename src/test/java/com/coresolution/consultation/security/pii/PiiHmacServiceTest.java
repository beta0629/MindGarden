package com.coresolution.consultation.security.pii;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link PiiHmacService} — HMAC 쓰기·dual-verify.
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
@DisplayName("PiiHmacService")
class PiiHmacServiceTest {

    private static final String RAW = "01012345678";

    @Test
    @DisplayName("HMAC hex 64자·결정적")
    void hmacHex_deterministic() {
        PiiHmacService svc = PiiTestSecrets.hmacService();
        String first = svc.hmacHex(RAW);
        String second = svc.hmacHex(RAW);
        assertThat(first).hasSize(64).isEqualTo(second);
        assertThat(first).isNotEqualTo(svc.legacySha256Hex(RAW));
    }

    @Test
    @DisplayName("dual-verify — HMAC 또는 레거시 SHA")
    void matches_dualVerify() {
        PiiHmacService svc = PiiTestSecrets.hmacService();
        assertThat(svc.matches(RAW, svc.hmacHex(RAW))).isTrue();
        assertThat(svc.matches(RAW, svc.legacySha256Hex(RAW))).isTrue();
        assertThat(svc.matches(RAW, "deadbeef")).isFalse();
    }

    @Test
    @DisplayName("쓰기 fail-closed — 시크릿 없음")
    void hmacHex_failClosedWithoutSecret() {
        PiiHmacService empty = new PiiHmacService("");
        assertThat(empty.hasSecret()).isFalse();
        assertThatThrownBy(() -> empty.hmacHex(RAW))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("PERSONAL_DATA_HMAC_SECRET");
    }

    @Test
    @DisplayName("lookupCandidates — HMAC 우선·SHA 보조")
    void lookupCandidates_order() {
        PiiHmacService svc = PiiTestSecrets.hmacService();
        String[] candidates = svc.lookupCandidates(RAW);
        assertThat(candidates).containsExactly(svc.hmacHex(RAW), svc.legacySha256Hex(RAW));
    }
}
