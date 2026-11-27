package com.coresolution.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.Map;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ScheduleListUserFieldsResolver} 표시명·연락처 폴백 순서 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-04-30
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleListUserFieldsResolver")
class ScheduleListUserFieldsResolverTest {

    @Mock
    private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;

    @InjectMocks
    private ScheduleListUserFieldsResolver resolver;

    @Test
    @DisplayName("표시명: 캐시 name이 비어 있지 않으면 trim 후 사용")
    void resolveDisplayName_usesTrimmedCacheName() {
        User user = User.builder()
                .userId("u1")
                .email("e")
                .password("p")
                .name("enc")
                .role(UserRole.CLIENT)
                .isActive(true)
                .isPasswordChanged(true)
                .build();
        Map<String, String> decrypted = new HashMap<>();
        decrypted.put("name", "  홍길동  ");
        when(userPersonalDataCacheService.getDecryptedUserData(user)).thenReturn(decrypted);

        assertThat(resolver.resolveDisplayNameForScheduleList(user)).isEqualTo("홍길동");
        verify(encryptionUtil, never()).safeDecrypt(any());
    }

    @Test
    @DisplayName("표시명: 캐시 name 공백이면 safeDecrypt(user.name) 폴백")
    void resolveDisplayName_fallsBackToSafeDecrypt() {
        User user = User.builder()
                .userId("u2")
                .email("e")
                .password("p")
                .name("cipherblob")
                .role(UserRole.CONSULTANT)
                .isActive(true)
                .isPasswordChanged(true)
                .build();
        when(userPersonalDataCacheService.getDecryptedUserData(user)).thenReturn(Map.of("name", "   "));
        when(encryptionUtil.safeDecrypt("cipherblob")).thenReturn("김상담");

        assertThat(resolver.resolveDisplayNameForScheduleList(user)).isEqualTo("김상담");
    }

    @Test
    @DisplayName("표시명: 캐시 name이 legacy:: 형태면 무시하고 safeDecrypt 폴백")
    void resolveDisplayName_ignoresLegacyLikeCacheName() {
        User user = User.builder()
                .userId("u3")
                .email("e")
                .password("p")
                .name("encNameField")
                .role(UserRole.CONSULTANT)
                .isActive(true)
                .isPasswordChanged(true)
                .build();
        Map<String, String> decrypted = new HashMap<>();
        decrypted.put("name", "legacy::YmFk");
        when(userPersonalDataCacheService.getDecryptedUserData(user)).thenReturn(decrypted);
        when(encryptionUtil.safeDecrypt("encNameField")).thenReturn("평문이름");

        assertThat(resolver.resolveDisplayNameForScheduleList(user)).isEqualTo("평문이름");
        verify(encryptionUtil).safeDecrypt("encNameField");
    }

    @Test
    @DisplayName("표시명: user null이면 DISPLAY_NAME_UNKNOWN")
    void resolveDisplayName_nullUser_returnsUnknown() {
        assertThat(resolver.resolveDisplayNameForScheduleList(null))
                .isEqualTo(AdminServiceUserFacingMessages.DISPLAY_NAME_UNKNOWN);
    }
}
