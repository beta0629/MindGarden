package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link ClientRegistrationConstants} 합성 이메일·테넌트 정제 순수 함수 테스트.
 */
@DisplayName("ClientRegistrationConstants")
class ClientRegistrationConstantsTest {

    @Test
    @DisplayName("sanitizeTenantIdForSyntheticEmailDomain: null·빈 문자열이면 t")
    void sanitize_nullOrBlank_returnsT() {
        assertThat(ClientRegistrationConstants.sanitizeTenantIdForSyntheticEmailDomain(null)).isEqualTo("t");
        assertThat(ClientRegistrationConstants.sanitizeTenantIdForSyntheticEmailDomain("   ")).isEqualTo("t");
    }

    @Test
    @DisplayName("sanitizeTenantIdForSyntheticEmailDomain: @·공백 제거 및 특수문자 치환")
    void sanitize_specialChars_replaced() {
        assertThat(ClientRegistrationConstants.sanitizeTenantIdForSyntheticEmailDomain("a@b c"))
                .isEqualTo("abc");
    }

    @Test
    @DisplayName("buildSyntheticEmail: collisionIndex 0은 접미사 없음, 1 이상은 u 접미사")
    void buildSyntheticEmail_collisionSuffix() {
        String tenant = "tenant-x";
        String digits = "01011112222";
        assertThat(ClientRegistrationConstants.buildSyntheticEmail(digits, tenant, 0))
                .isEqualTo("phone-01011112222@tenant-x.clients.noreply");
        assertThat(ClientRegistrationConstants.buildSyntheticEmail(digits, tenant, 1))
                .isEqualTo("phone-01011112222u1@tenant-x.clients.noreply");
    }

    @Test
    @DisplayName("buildSyntheticEmail: 동적 테넌트 ID로도 RFC 형태 문자열 생성")
    void buildSyntheticEmail_dynamicTenant() {
        String tid = "t-" + UUID.randomUUID().toString().substring(0, 8);
        String sanitized = ClientRegistrationConstants.sanitizeTenantIdForSyntheticEmailDomain(tid);
        String email = ClientRegistrationConstants.buildSyntheticEmail("01099998888", sanitized, 0);
        assertThat(email).contains("@");
        assertThat(email).startsWith(ClientRegistrationConstants.SYNTHETIC_EMAIL_LOCAL_PREFIX);
        assertThat(email).endsWith("." + ClientRegistrationConstants.SYNTHETIC_EMAIL_DOMAIN_SUFFIX);
    }
}
