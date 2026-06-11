package com.coresolution.consultation.service;

import java.util.Base64;
import java.util.List;
import com.coresolution.consultation.dto.PasswordLoginAccountSelectionClaims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 일반 로그인(전화 + 비밀번호) 다중 매치 계정 선택용 단기 JWT 발급·파싱 단위 테스트.
 *
 * <p>P1 silent first 차단 정책에 대한 토큰 핵심 동작:</p>
 * <ul>
 *   <li>tenantId · allowedUserIds 가 round-trip 으로 보존된다.</li>
 *   <li>다른 purpose JWT 는 파싱 시 즉시 거절된다(타입 혼동 차단).</li>
 *   <li>tenantId 빈 값/allowedUserIds 누락 시 발급 자체가 실패한다.</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@DisplayName("JwtService password-login account selection token")
class JwtServicePasswordLoginAccountSelectionTokenTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey",
            Base64.getEncoder().encodeToString(new byte[32]));
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 86_400_000L);
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", 604_800_000L);
        ReflectionTestUtils.setField(jwtService, "passwordLoginAccountSelectionTtlMs", 300_000L);
    }

    @Test
    @DisplayName("generate 후 parse 시 tenantId · allowedUserIds 가 복원된다")
    void roundTrip_ok() {
        String jwt = jwtService.generatePasswordLoginAccountSelectionToken("tenant-a",
            List.of(10L, 20L));
        PasswordLoginAccountSelectionClaims claims =
            jwtService.parsePasswordLoginAccountSelectionToken(jwt);
        assertThat(claims.getTenantId()).isEqualTo("tenant-a");
        assertThat(claims.getAllowedUserIds()).containsExactly(10L, 20L);
    }

    @Test
    @DisplayName("OAuth 계정 선택 JWT 는 password-login 파서가 거절한다(타입 혼동 차단)")
    void parse_rejectsWrongPurpose() {
        ReflectionTestUtils.setField(jwtService, "oauthPhoneAccountSelectionTtlMs", 600_000L);
        String oauthJwt = jwtService.generateOAuthPhoneAccountSelectionToken("tenant-a",
            "KAKAO", "pid-9", List.of(10L), null);
        assertThatThrownBy(() -> jwtService.parsePasswordLoginAccountSelectionToken(oauthJwt))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("tenantId 빈 값이면 발급이 거절된다")
    void generate_rejectsBlankTenant() {
        assertThatThrownBy(() -> jwtService.generatePasswordLoginAccountSelectionToken("",
            List.of(1L)))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("allowedUserIds 누락이면 발급이 거절된다")
    void generate_rejectsEmptyAllowed() {
        assertThatThrownBy(() -> jwtService.generatePasswordLoginAccountSelectionToken("t-a",
            List.of()))
            .isInstanceOf(IllegalArgumentException.class);
    }
}
