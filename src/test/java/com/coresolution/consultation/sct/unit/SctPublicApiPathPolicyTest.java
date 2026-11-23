package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertTrue;

import com.coresolution.core.constant.PublicApiPathPolicy;
import org.junit.jupiter.api.Test;

/**
 * PublicApiPathPolicy 에 SCT 공개 접두어 등록 검증.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
class SctPublicApiPathPolicyTest {

    @Test
    void publicSctPathsArePermitAllPublicApi() {
        assertTrue(PublicApiPathPolicy.isPublicApi("/api/v1/public/sct"));
        assertTrue(PublicApiPathPolicy.isPublicApi("/api/v1/public/sct/token/meta"));
        assertTrue(PublicApiPathPolicy.isPublicApi("/api/v1/public/sct/abc/verify"));
    }
}
