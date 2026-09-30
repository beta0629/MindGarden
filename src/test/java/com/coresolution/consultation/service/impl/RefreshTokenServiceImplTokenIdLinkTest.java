package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import com.coresolution.consultation.entity.RefreshToken;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.RefreshTokenRepository;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.core.security.PasswordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * {@link RefreshTokenServiceImpl#createRefreshToken} — {@code token_id} 를 Refresh JWT tokenId 클레임과 일치시켜
 * 현재 세션(sid) 단위 폐기가 가능하도록 한다.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("RefreshTokenServiceImpl — token_id = JWT tokenId 클레임")
class RefreshTokenServiceImplTokenIdLinkTest {

    private static final String REFRESH = "refresh.jwt.with.token-id";
    private static final String CLAIM_TOKEN_ID = "0f8fad5b-d9cb-469f-a165-70867728950e";

    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordService passwordService;
    @Mock private JwtService jwtService;

    private RefreshTokenServiceImpl refreshTokenService;
    private User user;

    @BeforeEach
    void setUp() {
        refreshTokenService = new RefreshTokenServiceImpl(refreshTokenRepository, passwordService, jwtService);
        when(passwordService.encodeSecret(REFRESH)).thenReturn("hash");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));
        user = User.builder().userId("u-link").email("l@example.com").build();
        user.setId(8L);
        user.setTenantId("tenant-link");
    }

    @Test
    @DisplayName("클레임 tokenId 가 있으면 그대로 token_id 로 저장")
    void storesClaimTokenId() {
        when(jwtService.extractTokenId(REFRESH)).thenReturn(CLAIM_TOKEN_ID);
        when(refreshTokenRepository.findByTokenId(CLAIM_TOKEN_ID)).thenReturn(Optional.empty());

        refreshTokenService.createRefreshToken(user, REFRESH, null);

        assertThat(savedTokenId()).isEqualTo(CLAIM_TOKEN_ID);
    }

    @Test
    @DisplayName("클레임 없음(구 토큰) 또는 이미 저장된 tokenId 면 새 UUID")
    void fallsBackToRandomUuid() {
        when(jwtService.extractTokenId(REFRESH)).thenReturn(CLAIM_TOKEN_ID);
        when(refreshTokenRepository.findByTokenId(CLAIM_TOKEN_ID))
            .thenReturn(Optional.of(RefreshToken.builder().tokenId(CLAIM_TOKEN_ID).build()));

        refreshTokenService.createRefreshToken(user, REFRESH, null);

        assertThat(savedTokenId()).isNotEqualTo(CLAIM_TOKEN_ID).hasSize(CLAIM_TOKEN_ID.length());
    }

    private String savedTokenId() {
        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        return captor.getValue().getTokenId();
    }
}
