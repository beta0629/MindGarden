package com.coresolution.consultation.controller;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * OAuth2 state 복합 문자열(base64url 테넌트 접두 + nonce) 파싱·디코딩 회귀 방지.
 *
 * @author CoreSolution
 * @since 2026-04-09
 */
class OAuth2ControllerOAuthStateTest {

    @Test
    void parseComposite_roundTripUrlSafeBase64() {
        String tenant = "tenant-abc-9";
        String enc = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(tenant.getBytes(StandardCharsets.UTF_8));
        String nonce = UUID.randomUUID().toString();
        String state = enc + "." + nonce;
        OAuth2Controller.OAuthCompositeState p = OAuth2Controller.parseCompositeOAuthState(state);
        Assertions.assertEquals(tenant, p.tenantId);
        Assertions.assertEquals(nonce, p.nonceOrFull);
    }

    @Test
    void parseComposite_standardBase64Segment_decodesViaFallback() {
        String tenant = "tenant-x";
        String enc = Base64.getEncoder().withoutPadding()
                .encodeToString(tenant.getBytes(StandardCharsets.UTF_8));
        String nonce = UUID.randomUUID().toString();
        String state = enc + "." + nonce;
        OAuth2Controller.OAuthCompositeState p = OAuth2Controller.parseCompositeOAuthState(state);
        Assertions.assertEquals(tenant, p.tenantId);
        Assertions.assertEquals(nonce, p.nonceOrFull);
    }

    @Test
    void parseComposite_trimAndNormalize() {
        String tenant = "t1";
        String enc = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(tenant.getBytes(StandardCharsets.UTF_8));
        String state = " " + enc + "." + UUID.randomUUID() + " ";
        OAuth2Controller.OAuthCompositeState p = OAuth2Controller.parseCompositeOAuthState(state);
        Assertions.assertEquals(tenant, p.tenantId);
    }

    @Test
    void parseComposite_noDot_returnsNullTenant() {
        String onlyNonce = UUID.randomUUID().toString();
        OAuth2Controller.OAuthCompositeState p =
                OAuth2Controller.parseCompositeOAuthState(onlyNonce);
        Assertions.assertNull(p.tenantId);
        Assertions.assertEquals(onlyNonce, p.nonceOrFull);
    }

    @Test
    void decodeOAuthStateTenantSegment_rejectsEmpty() {
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> OAuth2Controller.decodeOAuthStateTenantSegment(""));
    }
}
