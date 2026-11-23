package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.coresolution.consultation.sct.util.SctTokenHasher;
import org.junit.jupiter.api.Test;

/**
 * opaque 토큰·해시 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
class SctTokenHasherTest {

    @Test
    void generatesOpaqueTokenAndSha256HexOnly() {
        String token = SctTokenHasher.generateOpaqueToken();
        assertNotNull(token);
        assertFalse(token.isBlank());
        String hash = SctTokenHasher.sha256Hex(token);
        assertEquals(64, hash.length());
        assertNotEquals(token, hash);
        assertEquals(hash, SctTokenHasher.sha256Hex(token));
    }
}
