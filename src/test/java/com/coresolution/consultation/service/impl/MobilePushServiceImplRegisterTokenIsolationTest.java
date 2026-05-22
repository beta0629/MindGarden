package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.MobilePushPlatform;
import com.coresolution.consultation.entity.MobilePushToken;
import com.coresolution.consultation.repository.MobilePushSettingsRepository;
import com.coresolution.consultation.repository.MobilePushTokenRepository;
import com.coresolution.consultation.util.MobilePushTokenHasher;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * D-1: 디바이스 1대당 마지막 로그인 사용자 격리 단위 검증.
 *
 * <p>{@link MobilePushServiceImpl#registerToken}이 동일 token_sha256를 가진 다른 사용자(active=true) 행을
 * 비활성화한 뒤(현재 사용자 행은 보존) 토큰을 등록·갱신하는지 확인한다.</p>
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MobilePushServiceImpl D-1 디바이스 사용자 격리")
class MobilePushServiceImplRegisterTokenIsolationTest {

    private static final String TENANT_ID = "tenant-d1";
    private static final Long CURRENT_USER_ID = 200L;
    private static final String RAW_TOKEN = "ExponentPushToken[device-shared]";

    @Mock
    private MobilePushTokenRepository mobilePushTokenRepository;
    @Mock
    private MobilePushSettingsRepository mobilePushSettingsRepository;

    @InjectMocks
    private MobilePushServiceImpl mobilePushService;

    @Test
    @DisplayName("registerToken_whenDifferentUserHasSameTokenHash_deactivatesPreviousUser: deactivate 호출 + 현재 사용자 행 갱신")
    void registerToken_whenDifferentUserHasSameTokenHash_deactivatesPreviousUser() {
        String hash = MobilePushTokenHasher.sha256Hex(RAW_TOKEN);

        when(mobilePushTokenRepository.deactivateOtherUsersWithSameTokenHash(
                eq(TENANT_ID), eq(hash), eq(CURRENT_USER_ID), any(LocalDateTime.class)))
                .thenReturn(1);

        MobilePushToken existing = MobilePushToken.builder()
                .tenantId(TENANT_ID)
                .userId(CURRENT_USER_ID)
                .tokenSha256(hash)
                .pushToken(RAW_TOKEN)
                .platform(MobilePushPlatform.ANDROID.getCode())
                .active(false)
                .isDeleted(false)
                .build();
        when(mobilePushTokenRepository.findByTenantIdAndUserIdAndTokenSha256AndIsDeletedFalse(
                eq(TENANT_ID), eq(CURRENT_USER_ID), eq(hash)))
                .thenReturn(Optional.of(existing));

        mobilePushService.registerToken(TENANT_ID, CURRENT_USER_ID, RAW_TOKEN, MobilePushPlatform.ANDROID, null);

        // D-1: 격리 메서드가 정확히 1회, 현재 사용자 PK를 보존 인자로 호출됨을 확인
        verify(mobilePushTokenRepository, times(1)).deactivateOtherUsersWithSameTokenHash(
                eq(TENANT_ID), eq(hash), eq(CURRENT_USER_ID), any(LocalDateTime.class));

        // 격리 이후 현재 사용자 행을 INSERT/UPDATE 했음을 확인
        ArgumentCaptor<MobilePushToken> savedCaptor = ArgumentCaptor.forClass(MobilePushToken.class);
        verify(mobilePushTokenRepository).save(savedCaptor.capture());
        MobilePushToken saved = savedCaptor.getValue();
        org.assertj.core.api.Assertions.assertThat(saved.getUserId()).isEqualTo(CURRENT_USER_ID);
        org.assertj.core.api.Assertions.assertThat(saved.isActive()).isTrue();
    }

    @Test
    @DisplayName("registerToken: 동일 해시의 다른 사용자 행이 없으면 deactivate 결과 0이어도 정상 등록")
    void registerToken_whenNoConflictingUser_savesNewRow() {
        String hash = MobilePushTokenHasher.sha256Hex(RAW_TOKEN);
        when(mobilePushTokenRepository.deactivateOtherUsersWithSameTokenHash(
                eq(TENANT_ID), eq(hash), eq(CURRENT_USER_ID), any(LocalDateTime.class)))
                .thenReturn(0);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdAndTokenSha256AndIsDeletedFalse(
                eq(TENANT_ID), eq(CURRENT_USER_ID), eq(hash)))
                .thenReturn(Optional.empty());

        mobilePushService.registerToken(TENANT_ID, CURRENT_USER_ID, RAW_TOKEN, MobilePushPlatform.IOS, null);

        verify(mobilePushTokenRepository).deactivateOtherUsersWithSameTokenHash(
                eq(TENANT_ID), eq(hash), anyLong(), any(LocalDateTime.class));
        verify(mobilePushTokenRepository).save(any(MobilePushToken.class));
    }
}
