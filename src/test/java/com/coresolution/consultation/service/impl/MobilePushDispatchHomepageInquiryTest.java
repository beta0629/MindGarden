package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.config.ExpoPushProperties;
import com.coresolution.consultation.constant.MobilePushCanonicalTypes;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.MobilePushSettings;
import com.coresolution.consultation.entity.MobilePushToken;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.MobilePushSettingsRepository;
import com.coresolution.consultation.repository.MobilePushTokenRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.MobilePushDispatchDedupService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.ScheduleNotificationEligibility;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

/**
 * {@link MobilePushDispatchServiceImpl#dispatchHomepageInquiry} ADMIN 팬아웃 단위 검증.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MobilePushDispatchServiceImpl homepage inquiry fanout")
class MobilePushDispatchHomepageInquiryTest {

    private static final String TENANT_ID = "tenant-hp-push";
    private static final String EXPO_URL = "https://exp.test/--/api/v2/push/send";

    @Mock private RestTemplate restTemplate;
    @Spy private ObjectMapper objectMapper = new ObjectMapper();
    @Mock private ExpoPushProperties expoPushProperties;
    @Mock private MobilePushTokenRepository mobilePushTokenRepository;
    @Mock private MobilePushSettingsRepository mobilePushSettingsRepository;
    @Mock private MobilePushDispatchDedupService mobilePushDispatchDedupService;
    @Mock private UserRepository userRepository;
    @Mock private ScheduleRepository scheduleRepository;
    @Mock private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock private MobilePushInboxPersister mobilePushInboxPersister;
    @Mock private ScheduleNotificationEligibility scheduleNotificationEligibility;

    @InjectMocks
    private MobilePushDispatchServiceImpl mobilePushDispatchService;

    @Test
    @DisplayName("dispatchHomepageInquiry — findByTenantIdAndRole(ADMIN) 만 대상, CONSULTANT 토큰 조회 없음")
    void dispatchHomepageInquiry_targetsAdminRoleOnly() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn(EXPO_URL);

        User admin = user(11L, UserRole.ADMIN, true);
        User consultant = user(22L, UserRole.CONSULTANT, true);
        // 저장소는 ADMIN 조회만 호출되므로 CONSULTANT 는 목록에 넣지 않는다(실제 구현과 동일).
        when(userRepository.findByTenantIdAndRole(TENANT_ID, UserRole.ADMIN))
                .thenReturn(List.of(admin));

        MobilePushSettings settings = new MobilePushSettings();
        settings.setSystemEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(TENANT_ID, 11L))
                .thenReturn(Optional.of(settings));

        MobilePushToken adminToken = new MobilePushToken();
        adminToken.setUserId(11L);
        adminToken.setPushToken("ExponentPushToken[admin]");
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq(TENANT_ID), eq(List.of(11L)))).thenReturn(List.of(adminToken));

        when(mobilePushDispatchDedupService.tryClaim(
                eq(TENANT_ID), eq(MobilePushCanonicalTypes.HOMEPAGE_INQUIRY),
                eq("11"), eq("inquiry-55"))).thenReturn(true);
        when(restTemplate.postForObject(eq(EXPO_URL), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\",\"id\":\"t-admin\"}]}");

        mobilePushDispatchService.dispatchHomepageInquiry(TENANT_ID, 55L, "개인상담");

        verify(userRepository).findByTenantIdAndRole(TENANT_ID, UserRole.ADMIN);
        verify(userRepository, never()).findByTenantIdAndRole(TENANT_ID, UserRole.CONSULTANT);
        verify(mobilePushTokenRepository).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                TENANT_ID, List.of(11L));
        verify(mobilePushTokenRepository, never()).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                TENANT_ID, List.of(22L));
        verify(mobilePushDispatchDedupService).tryClaim(
                TENANT_ID, MobilePushCanonicalTypes.HOMEPAGE_INQUIRY, "11", "inquiry-55");
        verify(restTemplate).postForObject(eq(EXPO_URL), any(), eq(String.class));
        verify(mobilePushInboxPersister).persistForRecipient(
                eq(TENANT_ID), eq(11L),
                eq(MobilePushCanonicalTypes.HOMEPAGE_INQUIRY),
                anyString(), anyString());
        // consultant 는 조회 대상이 아니므로 설정/토큰/디듑 모두 미호출
        verify(mobilePushSettingsRepository, never())
                .findByTenantIdAndUserIdAndIsDeletedFalse(TENANT_ID, consultant.getId());
    }

    private static User user(long id, UserRole role, boolean active) {
        User u = new User();
        u.setId(id);
        u.setRole(role);
        u.setIsActive(active);
        u.setTenantId(TENANT_ID);
        return u;
    }
}
