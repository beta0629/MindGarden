package com.coresolution.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Base64;
import java.util.List;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 변경 전 계정의 Access·Refresh 에만 제한 클레임이 실린다.
 *
 * @author MindGarden
 * @since 2026-10-14
 */
@DisplayName("JwtService 비밀번호 변경 클레임")
class JwtServicePasswordChangeClaimTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey",
                Base64.getEncoder().encodeToString(new byte[32]));
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 3_600_000L);
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", 604_800_000L);
    }

    @Test
    @DisplayName("isPasswordChanged=false 이면 Access 와 Refresh 모두 제한 클레임")
    void unchangedPasswordCarriesClaimOnBothTokens() {
        User user = user(false);
        String access = jwtService.generateToken(user, List.of("CLIENT"));
        String refresh = jwtService.generateRefreshToken(user);

        assertThat(jwtService.isPasswordChangeRequired(access)).isTrue();
        assertThat(jwtService.isPasswordChangeRequired(refresh)).isTrue();
    }

    @Test
    @DisplayName("변경 완료·null 은 클레임이 없다")
    void changedOrUnknownPasswordOmitsClaim() {
        String changed = jwtService.generateToken(user(true), List.of("CLIENT"));
        String unknown = jwtService.generateToken(user(null), List.of("CLIENT"));
        String changedRefresh = jwtService.generateRefreshToken(user(true));

        assertThat(jwtService.isPasswordChangeRequired(changed)).isFalse();
        assertThat(jwtService.isPasswordChangeRequired(unknown)).isFalse();
        assertThat(jwtService.isPasswordChangeRequired(changedRefresh)).isFalse();
    }

    @Test
    @DisplayName("OAuth 발급은 isPasswordChanged=false 여도 클레임이 없다")
    void oauthTokensOmitClaimEvenWhenPasswordUnchanged() {
        User unchanged = user(false);
        String access = jwtService.generateTokenForOAuth(unchanged, List.of("CLIENT"));
        String refresh = jwtService.generateRefreshTokenForOAuth(unchanged);

        assertThat(jwtService.isPasswordChangeRequired(access)).isFalse();
        assertThat(jwtService.isPasswordChangeRequired(refresh)).isFalse();
    }

    @Test
    @DisplayName("skipPasswordChangeClaim=true 이면 Access·Refresh 모두 클레임 생략")
    void skipFlagOmitsClaimOnBothTokens() {
        User unchanged = user(false);
        String access = jwtService.generateToken(unchanged, List.of("CLIENT"), true);
        String refresh = jwtService.generateRefreshToken(unchanged, null, true);

        assertThat(jwtService.isPasswordChangeRequired(access)).isFalse();
        assertThat(jwtService.isPasswordChangeRequired(refresh)).isFalse();
    }

    private static User user(Boolean changed) {
        User user = User.builder()
                .email("client@example.com")
                .role(UserRole.CLIENT)
                .isPasswordChanged(changed)
                .build();
        user.setId(7L);
        user.setUserId("user-7");
        user.setTenantId("tenant-claim");
        return user;
    }
}
