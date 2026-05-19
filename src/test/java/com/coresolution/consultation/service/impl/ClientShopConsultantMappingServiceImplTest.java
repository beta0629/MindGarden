package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.consultation.ConsultationServiceUserFacingMessages;
import com.coresolution.consultation.dto.shop.ShopConsultantMappingOption;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ClientShopConsultantMappingServiceImpl} 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-05-20
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientShopConsultantMappingServiceImpl")
class ClientShopConsultantMappingServiceImplTest {

    private static final String TENANT = "tenant-shop-mapping";
    private static final Long CLIENT_ID = 42L;

    @Mock
    private ConsultantClientMappingRepository consultantClientMappingRepository;

    @Mock
    private UserPersonalDataCacheService userPersonalDataCacheService;

    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;

    @InjectMocks
    private ClientShopConsultantMappingServiceImpl service;

    @Test
    @DisplayName("listActiveMappingOptions — ACTIVE 매핑·캐시 표시명·패키지 라벨")
    void listActiveMappingOptions_returnsCachedConsultantNameAndLabel() {
        User consultant = consultantUser(7L, "enc-name");
        ConsultantClientMapping active = mapping(101L, consultant, ConsultantClientMapping.MappingStatus.ACTIVE,
                "10회기 패키지");
        ConsultantClientMapping inactive = mapping(102L, consultantUser(8L, "x"),
                ConsultantClientMapping.MappingStatus.INACTIVE, null);

        when(consultantClientMappingRepository.findByClientIdAndStatusNot(
                eq(TENANT), eq(CLIENT_ID), eq(ConsultantClientMapping.MappingStatus.INACTIVE)))
                .thenReturn(new ArrayList<>(List.of(active, inactive)));
        when(userPersonalDataCacheService.getDecryptedUserData(consultant))
                .thenReturn(Map.of("name", "김상담"));

        List<ShopConsultantMappingOption> options =
                service.listActiveMappingOptions(TENANT, CLIENT_ID);

        assertThat(options).hasSize(1);
        assertThat(options.get(0).getMappingId()).isEqualTo(101L);
        assertThat(options.get(0).getConsultantDisplayName()).isEqualTo("김상담");
        assertThat(options.get(0).getLabel()).isEqualTo("10회기 패키지");
        verify(encryptionUtil, never()).safeDecrypt(any());
    }

    @Test
    @DisplayName("listActiveMappingOptions — 캐시 name 없으면 safeDecrypt 폴백")
    void listActiveMappingOptions_fallsBackToSafeDecrypt() {
        User consultant = consultantUser(9L, "cipherblob");
        ConsultantClientMapping active = mapping(201L, consultant, ConsultantClientMapping.MappingStatus.ACTIVE, null);

        when(consultantClientMappingRepository.findByClientIdAndStatusNot(
                eq(TENANT), eq(CLIENT_ID), eq(ConsultantClientMapping.MappingStatus.INACTIVE)))
                .thenReturn(new ArrayList<>(List.of(active)));
        when(userPersonalDataCacheService.getDecryptedUserData(consultant)).thenReturn(Map.of());
        when(encryptionUtil.safeDecrypt("cipherblob")).thenReturn("복호화상담");

        List<ShopConsultantMappingOption> options =
                service.listActiveMappingOptions(TENANT, CLIENT_ID);

        assertThat(options).hasSize(1);
        assertThat(options.get(0).getConsultantDisplayName()).isEqualTo("복호화상담");
        assertThat(options.get(0).getLabel()).isNull();
        verify(encryptionUtil).safeDecrypt("cipherblob");
    }

    @Test
    @DisplayName("listActiveMappingOptions — 상담사 없으면 기본 표시명")
    void listActiveMappingOptions_whenConsultantNull_usesDefaultDisplayName() {
        ConsultantClientMapping active = mapping(301L, null, ConsultantClientMapping.MappingStatus.ACTIVE, null);

        when(consultantClientMappingRepository.findByClientIdAndStatusNot(
                eq(TENANT), eq(CLIENT_ID), eq(ConsultantClientMapping.MappingStatus.INACTIVE)))
                .thenReturn(new ArrayList<>(List.of(active)));

        List<ShopConsultantMappingOption> options =
                service.listActiveMappingOptions(TENANT, CLIENT_ID);

        assertThat(options).hasSize(1);
        assertThat(options.get(0).getConsultantDisplayName())
                .isEqualTo(ConsultationServiceUserFacingMessages.DEFAULT_CONSULTANT_DISPLAY_NAME);
    }

    private static User consultantUser(long id, String encryptedName) {
        User user = User.builder()
                .userId("consultant-" + id)
                .email("c" + id + "@example.com")
                .password("p")
                .name(encryptedName)
                .role(UserRole.CONSULTANT)
                .isActive(true)
                .isPasswordChanged(true)
                .build();
        user.setId(id);
        return user;
    }

    private static ConsultantClientMapping mapping(
            long id,
            User consultant,
            ConsultantClientMapping.MappingStatus status,
            String packageName) {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .consultant(consultant)
                .status(status)
                .packageName(packageName)
                .startDate(LocalDateTime.of(2026, 5, 1, 10, 0))
                .build();
        mapping.setId(id);
        return mapping;
    }
}
