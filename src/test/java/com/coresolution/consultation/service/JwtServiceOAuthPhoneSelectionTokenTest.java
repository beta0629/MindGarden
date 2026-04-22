package com.coresolution.consultation.service;

import java.util.Base64;
import java.util.List;
import com.coresolution.consultation.dto.OAuthPhoneAccountSelectionClaims;
import com.coresolution.consultation.dto.SocialUserInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * OAuth 전화 계정 선택용 단기 JWT 발급·파싱.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */
@DisplayName("JwtService OAuth phone account selection token")
class JwtServiceOAuthPhoneSelectionTokenTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey",
            Base64.getEncoder().encodeToString(new byte[32]));
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 86_400_000L);
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", 604_800_000L);
        ReflectionTestUtils.setField(jwtService, "oauthPhoneAccountSelectionTtlMs", 600_000L);
    }

    @Test
    @DisplayName("generate 후 parse 시 tenant·provider·허용 목록·SNS 토큰이 복원된다")
    void roundTrip_ok() {
        SocialUserInfo social = SocialUserInfo.builder()
            .accessToken("sns-access")
            .email("sns@example.com")
            .name("N")
            .nickname("Nick")
            .phone("01011112222")
            .profileImageUrl("https://img")
            .build();
        String jwt = jwtService.generateOAuthPhoneAccountSelectionToken("tenant-a", "KAKAO", "pid-9",
            List.of(10L, 20L), social);
        OAuthPhoneAccountSelectionClaims claims = jwtService.parseOAuthPhoneAccountSelectionToken(jwt);
        assertThat(claims.getTenantId()).isEqualTo("tenant-a");
        assertThat(claims.getProvider()).isEqualTo("KAKAO");
        assertThat(claims.getProviderUserId()).isEqualTo("pid-9");
        assertThat(claims.getAllowedUserIds()).containsExactly(10L, 20L);
        assertThat(claims.getSnsAccessToken()).isEqualTo("sns-access");
        SocialUserInfo rebuilt = claims.toSocialUserInfo();
        assertThat(rebuilt.getAccessToken()).isEqualTo("sns-access");
        assertThat(rebuilt.getProvider()).isEqualTo("KAKAO");
    }

    @Test
    @DisplayName("purpose가 다른 JWT는 파싱 시 거절된다")
    void parse_rejectsWrongPurpose() {
        String other = jwtService.generateToken(java.util.Map.of("purpose", "OTHER"), "subj");
        assertThatThrownBy(() -> jwtService.parseOAuthPhoneAccountSelectionToken(other))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("허용 목록 밖 userId는 클레임 단계에서는 검증하지 않음(완료 API에서 검증)")
    void allowedList_preserved() {
        String jwt = jwtService.generateOAuthPhoneAccountSelectionToken("t", "NAVER", "n1",
            List.of(5L), SocialUserInfo.builder().build());
        OAuthPhoneAccountSelectionClaims c = jwtService.parseOAuthPhoneAccountSelectionToken(jwt);
        assertThat(c.getAllowedUserIds()).containsExactly(5L);
    }
}
