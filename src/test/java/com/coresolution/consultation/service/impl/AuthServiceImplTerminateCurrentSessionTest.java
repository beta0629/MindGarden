package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Date;
import java.util.Optional;

import com.coresolution.consultation.config.DuplicateLoginAccessBlockRegistry;
import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.auth.CurrentSessionCredentials;
import com.coresolution.consultation.entity.RefreshToken;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AuthTokenRevocationService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.RefreshTokenService;
import com.coresolution.consultation.service.UserSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * {@link AuthServiceImpl#terminateCurrentSession} — 현재 세션 1개만 폐기, 계정 전체 폐기로 대체 금지.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthServiceImpl.terminateCurrentSession — 현재 세션만 종료")
class AuthServiceImplTerminateCurrentSessionTest {

    private static final Long USER_PK = 5L;
    private static final String USER_ID = "user-current-5";
    private static final String TENANT = "tenant-current";
    private static final String SESSION_ID = "http-session-current";
    private static final String ACCESS = "current.access.jwt";
    private static final String REFRESH = "current.refresh.jwt";
    private static final String SID = "sid-current-1";
    private static final long REFRESH_TTL_MS = 604_800_000L;

    @Mock private JwtService jwtService;
    @Mock private UserSessionService userSessionService;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private UserRepository userRepository;
    @Mock private AuthTokenRevocationService authTokenRevocationService;
    @Mock private DuplicateLoginAccessBlockRegistry duplicateLoginAccessBlockRegistry;

    @InjectMocks
    private AuthServiceImpl authService;

    private User user;
    private Date accessExpiry;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "refreshExpirationMs", REFRESH_TTL_MS);
        user = User.builder().userId(USER_ID).email("c@example.com").role(UserRole.CLIENT).build();
        user.setId(USER_PK);
        user.setTenantId(TENANT);
        accessExpiry = new Date(System.currentTimeMillis() + 3_600_000L);
        stubSignedToken(ACCESS, USER_ID, TENANT, accessExpiry);
    }

    @Test
    @DisplayName("sid 있는 Access — Access 거부 + 연결 Refresh(tokenId=sid) 폐기 + 현재 user_sessions 행만 비활성화")
    void revokesAccessAndLinkedRefreshOnly() {
        when(jwtService.extractSessionId(ACCESS)).thenReturn(SID);
        RefreshToken row = RefreshToken.builder().tokenId(SID).userId(USER_PK).tenantId(TENANT).build();
        when(refreshTokenService.findByTokenId(SID)).thenReturn(Optional.of(row));

        authService.terminateCurrentSession(user, credentials(SESSION_ID, ACCESS, null),
            SessionManagementConstants.END_REASON_LOGOUT);

        verify(userSessionService).deactivateSessionForTenant(TENANT, SESSION_ID,
            SessionManagementConstants.END_REASON_LOGOUT);
        verify(authTokenRevocationService).revokeAccessToken(ACCESS, accessExpiry.getTime());
        verify(authTokenRevocationService).revokeRefreshTokenId(eq(SID), anyLong());
        verify(refreshTokenService).revokeRefreshToken(SID);
        assertNoAccountWideTermination();
    }

    @Test
    @DisplayName("sid 없는 구 Access + Refresh 미제출 — Access 만 거부, Refresh 전체 폐기로 대체하지 않음")
    void legacyAccessWithoutSid_revokesOnlyAccess() {
        when(jwtService.extractSessionId(ACCESS)).thenReturn(null);

        authService.terminateCurrentSession(user, credentials(SESSION_ID, ACCESS, null),
            SessionManagementConstants.END_REASON_LOGOUT);

        verify(authTokenRevocationService).revokeAccessToken(ACCESS, accessExpiry.getTime());
        verify(authTokenRevocationService, never()).revokeRefreshTokenId(anyString(), anyLong());
        verify(refreshTokenService, never()).revokeRefreshToken(anyString());
        assertNoAccountWideTermination();
    }

    @Test
    @DisplayName("구 Refresh 제출 — 제출된 토큰(해시)만 폐기")
    void legacyPresentedRefresh_revokesOnlyThatToken() {
        Date refreshExpiry = new Date(System.currentTimeMillis() + REFRESH_TTL_MS);
        stubSignedToken(REFRESH, USER_ID, TENANT, refreshExpiry);
        when(jwtService.extractTokenId(REFRESH)).thenReturn(null);

        authService.terminateCurrentSession(user, credentials(null, null, REFRESH),
            SessionManagementConstants.END_REASON_LOGOUT);

        verify(authTokenRevocationService).revokeRefreshToken(REFRESH, refreshExpiry.getTime());
        verify(authTokenRevocationService, never()).revokeAccessToken(anyString(), anyLong());
        verify(userSessionService, never()).deactivateSessionForTenant(anyString(), anyString(), anyString());
        assertNoAccountWideTermination();
    }

    @Test
    @DisplayName("다른 사용자·테넌트 토큰 — 아무것도 폐기하지 않음")
    void foreignToken_isIgnored() {
        stubSignedToken(ACCESS, "someone-else", TENANT, accessExpiry);
        when(jwtService.extractSessionId(ACCESS)).thenReturn(SID);

        authService.terminateCurrentSession(user, credentials(null, ACCESS, null),
            SessionManagementConstants.END_REASON_LOGOUT);

        verifyNoInteractions(authTokenRevocationService);
        verify(refreshTokenService, never()).revokeRefreshToken(anyString());
        assertNoAccountWideTermination();
    }

    @Test
    @DisplayName("sid 로 찾은 refresh 행이 다른 사용자 소유면 DB 폐기 생략")
    void linkedRefreshRowOfOtherUser_notRevokedInDb() {
        when(jwtService.extractSessionId(ACCESS)).thenReturn(SID);
        RefreshToken row = RefreshToken.builder().tokenId(SID).userId(999L).tenantId(TENANT).build();
        when(refreshTokenService.findByTokenId(SID)).thenReturn(Optional.of(row));

        authService.terminateCurrentSession(user, credentials(null, ACCESS, null),
            SessionManagementConstants.END_REASON_LOGOUT);

        verify(refreshTokenService, never()).revokeRefreshToken(anyString());
    }

    private void assertNoAccountWideTermination() {
        verify(refreshTokenService, never()).revokeAllUserTokens(anyLong());
        verify(userSessionService, never()).deactivateAllSessionsForTenantUser(anyString(), anyLong(), anyString());
        verify(userSessionService, never()).deactivateAllUserSessions(any(User.class), anyString());
        verify(userRepository, never()).updateTokensInvalidatedAt(anyLong(), anyString(), any());
        verify(duplicateLoginAccessBlockRegistry, never()).blockUser(anyLong());
    }

    private void stubSignedToken(String token, String subject, String tenantId, Date expiry) {
        when(jwtService.isTokenValid(token)).thenReturn(true);
        when(jwtService.extractUsername(token)).thenReturn(subject);
        when(jwtService.extractTenantId(token)).thenReturn(tenantId);
        when(jwtService.extractExpiration(token)).thenReturn(expiry);
    }

    private static CurrentSessionCredentials credentials(String sessionId, String access, String refresh) {
        return CurrentSessionCredentials.builder()
            .sessionId(sessionId)
            .accessToken(access)
            .refreshToken(refresh)
            .build();
    }
}
