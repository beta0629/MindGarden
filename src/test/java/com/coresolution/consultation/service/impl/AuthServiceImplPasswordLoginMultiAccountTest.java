package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.AuthResponse;
import com.coresolution.consultation.dto.PasswordLoginAccountSelectionClaims;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 일반 로그인(전화 + 비밀번호) 다중 매치 분기 — P1 silent first 차단 단위 테스트.
 *
 * <p>{@code authenticateWithSession} preflight + {@code selectAccount} 분기에 대해 8 시나리오 검증.</p>
 *
 * <ol>
 *   <li>단일 매치(1명) — Spring Security 표준 흐름으로 위임되어 정상 응답</li>
 *   <li>다중 후보 + 비밀번호 1개 일치 — 단일 사용자로 로그인 (silent first 차단)</li>
 *   <li>다중 후보 + 비밀번호 2개 일치 — multipleAccounts 응답 + selectionToken</li>
 *   <li>다중 후보 + 비밀번호 모두 불일치 — 자격 증명 실패(후보 노출 차단)</li>
 *   <li>selectAccount 정상 — 토큰의 allowedUserIds 안 userId → 로그인 성공</li>
 *   <li>selectAccount 만료 — 401 (실패 응답)</li>
 *   <li>selectAccount 후보 외 userId — 403 (실패 응답: "허용되지 않")</li>
 *   <li>selectAccount 토큰 재사용 — 401 (이미 사용된 선택 정보)</li>
 * </ol>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthServiceImpl 다중 매치 분기 + select-account flow")
class AuthServiceImplPasswordLoginMultiAccountTest {

    private static final String TENANT = "tenant-mma";
    private static final String PHONE_DIGITS = "01099991111";
    private static final String CORRECT_PW = "good-password";
    private static final String OTHER_PW = "other-password";
    private static final String ENCODED_CORRECT = "$2a$10$encoded.correct";
    private static final String ENCODED_OTHER = "$2a$10$encoded.other";

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private UserService userService;

    @Mock
    private UserSessionService userSessionService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;

    @InjectMocks
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "duplicateLoginCheckEnabled", false);
        ReflectionTestUtils.setField(authService, "askUserConfirmation", false);
        TenantContextHolder.setTenantId(TENANT);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("[1] 단일 매치 — Spring Security 표준 흐름으로 위임되어 정상 응답")
    void singleCandidate_delegatesToSpringSecurity() {
        User user = userOf(101L, UserRole.CONSULTANT, ENCODED_CORRECT);
        when(userService.findAllByLoginPrincipal(PHONE_DIGITS))
            .thenReturn(Collections.singletonList(user));
        Authentication auth = new UsernamePasswordAuthenticationToken("p", "c",
            Collections.emptyList());
        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(userService.findByLoginPrincipal(PHONE_DIGITS)).thenReturn(Optional.of(user));

        AuthResponse response = authService.authenticateWithSession(PHONE_DIGITS, CORRECT_PW,
            "sess-1", "127.0.0.1", "ua-test");

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.isMultipleAccounts()).isFalse();
        assertThat(response.getSelectionToken()).isNull();
        verify(authenticationManager).authenticate(any());
    }

    @Test
    @DisplayName("[2] 다중 후보 + 비밀번호 1개 일치 — 단일 사용자로 로그인 (silent first 차단)")
    void multiCandidate_singlePasswordMatch_logsInWithCorrectUser() {
        User goodUser = userOf(201L, UserRole.CONSULTANT, ENCODED_CORRECT);
        User otherUser = userOf(202L, UserRole.CLIENT, ENCODED_OTHER);
        when(userService.findAllByLoginPrincipal(PHONE_DIGITS))
            .thenReturn(Arrays.asList(otherUser, goodUser));
        when(passwordEncoder.matches(CORRECT_PW, ENCODED_CORRECT)).thenReturn(true);
        when(passwordEncoder.matches(CORRECT_PW, ENCODED_OTHER)).thenReturn(false);

        AuthResponse response = authService.authenticateWithSession(PHONE_DIGITS, CORRECT_PW,
            "sess-2", "127.0.0.1", "ua-test");

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.isMultipleAccounts()).isFalse();
        assertThat(response.getUserResponse().getId()).isEqualTo(201L);
        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    @DisplayName("[3] 다중 후보 + 비밀번호 2개 일치 — multipleAccounts 응답 + selectionToken")
    void multiCandidate_multiplePasswordMatch_returnsSelectionToken() {
        User a = userOf(301L, UserRole.CONSULTANT, ENCODED_CORRECT);
        User b = userOf(302L, UserRole.ADMIN, ENCODED_CORRECT);
        when(userService.findAllByLoginPrincipal(PHONE_DIGITS))
            .thenReturn(Arrays.asList(a, b));
        when(passwordEncoder.matches(CORRECT_PW, ENCODED_CORRECT)).thenReturn(true);
        when(jwtService.generatePasswordLoginAccountSelectionToken(eq(TENANT), any()))
            .thenReturn("sel-jwt");

        AuthResponse response = authService.authenticateWithSession(PHONE_DIGITS, CORRECT_PW,
            "sess-3", "127.0.0.1", "ua-test");

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.isMultipleAccounts()).isTrue();
        assertThat(response.getSelectionToken()).isEqualTo("sel-jwt");
        assertThat(response.getCandidates()).hasSize(2);
        assertThat(response.getCandidates().get(0).getUserId()).isEqualTo(301L);
        assertThat(response.getResponseType())
            .isEqualTo(AuthServiceImpl.MULTIPLE_ACCOUNTS_RESPONSE_TYPE);
        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    @DisplayName("[4] 다중 후보 + 비밀번호 모두 불일치 — 자격 증명 실패(후보 노출 차단)")
    void multiCandidate_noPasswordMatch_returnsBadCredentials() {
        User a = userOf(401L, UserRole.CONSULTANT, ENCODED_CORRECT);
        User b = userOf(402L, UserRole.CLIENT, ENCODED_OTHER);
        when(userService.findAllByLoginPrincipal(PHONE_DIGITS))
            .thenReturn(Arrays.asList(a, b));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        AuthResponse response = authService.authenticateWithSession(PHONE_DIGITS, "wrong",
            "sess-4", "127.0.0.1", "ua-test");

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.isMultipleAccounts()).isFalse();
        assertThat(response.getMessage()).contains("아이디 또는 비밀번호");
        assertThat(response.getCandidates()).isNull();
        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    @DisplayName("[5] selectAccount 정상 — 토큰의 allowedUserIds 안 userId → 로그인 성공")
    void selectAccount_validAllowed_logsIn() {
        User user = userOf(501L, UserRole.CONSULTANT, ENCODED_CORRECT);
        PasswordLoginAccountSelectionClaims claims = PasswordLoginAccountSelectionClaims.builder()
            .tenantId(TENANT)
            .allowedUserIds(Arrays.asList(501L, 502L))
            .build();
        when(jwtService.parsePasswordLoginAccountSelectionToken("tok-ok")).thenReturn(claims);
        when(userService.findById(501L)).thenReturn(Optional.of(user));

        AuthResponse response = authService.selectAccount("tok-ok", 501L,
            "sess-5", "127.0.0.1", "ua-test");

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getUserResponse().getId()).isEqualTo(501L);
    }

    @Test
    @DisplayName("[6] selectAccount 만료 — 401 (실패 응답)")
    void selectAccount_expired_returnsFailure() {
        when(jwtService.parsePasswordLoginAccountSelectionToken("tok-exp"))
            .thenThrow(new io.jsonwebtoken.ExpiredJwtException(null, null, "expired"));

        AuthResponse response = authService.selectAccount("tok-exp", 1L,
            "sess-6", "127.0.0.1", "ua-test");

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("만료");
    }

    @Test
    @DisplayName("[7] selectAccount 후보 외 userId — '허용되지 않' 메시지(403)")
    void selectAccount_userIdNotAllowed_returnsForbidden() {
        PasswordLoginAccountSelectionClaims claims = PasswordLoginAccountSelectionClaims.builder()
            .tenantId(TENANT)
            .allowedUserIds(Arrays.asList(701L, 702L))
            .build();
        when(jwtService.parsePasswordLoginAccountSelectionToken("tok-7")).thenReturn(claims);

        AuthResponse response = authService.selectAccount("tok-7", 999L,
            "sess-7", "127.0.0.1", "ua-test");

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("허용되지 않");
        verify(userService, never()).findById(anyLong());
    }

    @Test
    @DisplayName("[8] selectAccount 토큰 재사용 — 401 (이미 사용된 선택 정보)")
    void selectAccount_replay_returnsFailure() {
        User user = userOf(801L, UserRole.CONSULTANT, ENCODED_CORRECT);
        PasswordLoginAccountSelectionClaims claims = PasswordLoginAccountSelectionClaims.builder()
            .tenantId(TENANT)
            .allowedUserIds(Collections.singletonList(801L))
            .build();
        when(jwtService.parsePasswordLoginAccountSelectionToken("tok-8")).thenReturn(claims);
        when(userService.findById(801L)).thenReturn(Optional.of(user));

        AuthResponse first = authService.selectAccount("tok-8", 801L,
            "sess-8a", "127.0.0.1", "ua");
        AuthResponse second = authService.selectAccount("tok-8", 801L,
            "sess-8b", "127.0.0.1", "ua");

        assertThat(first.isSuccess()).isTrue();
        assertThat(second.isSuccess()).isFalse();
        assertThat(second.getMessage()).contains("이미 사용된");
        verify(userService, times(1)).findById(801L);
    }

    private User userOf(Long id, UserRole role, String encodedPassword) {
        User u = User.builder()
            .userId("u-" + id)
            .role(role)
            .password(encodedPassword)
            .isPasswordChanged(true)
            .name("name-" + id)
            .email("enc-email-" + id)
            .build();
        u.setId(id);
        u.setTenantId(TENANT);
        return u;
    }
}
