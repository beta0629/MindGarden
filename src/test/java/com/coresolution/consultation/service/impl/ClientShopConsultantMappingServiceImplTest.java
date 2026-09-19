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

    @Test
    @DisplayName("listActiveMappingOptions — PENDING_PAYMENT 포함, TERMINATED·INACTIVE 제외")
    void listActiveMappingOptions_includesPendingPaymentExcludesTerminated() {
        User consultant = consultantUser(11L, "enc-name");
        ConsultantClientMapping pending = mapping(401L, consultant,
                ConsultantClientMapping.MappingStatus.PENDING_PAYMENT, "결제대기 패키지");
        ConsultantClientMapping confirmed = mapping(402L, consultant,
                ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED, null);
        ConsultantClientMapping terminated = mapping(403L, consultant,
                ConsultantClientMapping.MappingStatus.TERMINATED, null);
        ConsultantClientMapping inactive = mapping(404L, consultant,
                ConsultantClientMapping.MappingStatus.INACTIVE, null);

        when(consultantClientMappingRepository.findByClientIdAndStatusNot(
                eq(TENANT), eq(CLIENT_ID), eq(ConsultantClientMapping.MappingStatus.INACTIVE)))
                .thenReturn(new ArrayList<>(List.of(pending, confirmed, terminated, inactive)));
        when(userPersonalDataCacheService.getDecryptedUserData(consultant))
                .thenReturn(Map.of("name", "이상담"));

        List<ShopConsultantMappingOption> options =
                service.listActiveMappingOptions(TENANT, CLIENT_ID);

        assertThat(options).extracting(ShopConsultantMappingOption::getMappingId)
                .containsExactlyInAnyOrder(401L, 402L);
        assertThat(options).extracting(ShopConsultantMappingOption::getConsultantDisplayName)
                .containsOnly("이상담");
    }

    @Test
    @DisplayName("listActiveMappingOptions — SESSIONS_EXHAUSTED+REFUNDED 포함 (환불 후 재결제)")
    void listActiveMappingOptions_includesSessionsExhaustedRefunded() {
        User consultant = consultantUser(13L, "enc-name");
        ConsultantClientMapping exhausted = mapping(601L, consultant,
                ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED, "소진 패키지");
        exhausted.setPaymentStatus(ConsultantClientMapping.PaymentStatus.REFUNDED);

        when(consultantClientMappingRepository.findByClientIdAndStatusNot(
                eq(TENANT), eq(CLIENT_ID), eq(ConsultantClientMapping.MappingStatus.INACTIVE)))
                .thenReturn(new ArrayList<>(List.of(exhausted)));
        when(userPersonalDataCacheService.getDecryptedUserData(consultant))
                .thenReturn(Map.of("name", "박상담"));

        List<ShopConsultantMappingOption> options =
                service.listActiveMappingOptions(TENANT, CLIENT_ID);

        assertThat(options).hasSize(1);
        assertThat(options.get(0).getMappingId()).isEqualTo(601L);
        assertThat(options.get(0).getConsultantDisplayName()).isEqualTo("박상담");
    }

    @Test
    @DisplayName("listActiveMappingOptions — ACTIVE+REFUNDED 포함")
    void listActiveMappingOptions_includesActiveRefunded() {
        User consultant = consultantUser(14L, "enc-name");
        ConsultantClientMapping activeRefunded = mapping(701L, consultant,
                ConsultantClientMapping.MappingStatus.ACTIVE, "부분환불 패키지");
        activeRefunded.setPaymentStatus(ConsultantClientMapping.PaymentStatus.REFUNDED);

        when(consultantClientMappingRepository.findByClientIdAndStatusNot(
                eq(TENANT), eq(CLIENT_ID), eq(ConsultantClientMapping.MappingStatus.INACTIVE)))
                .thenReturn(new ArrayList<>(List.of(activeRefunded)));
        when(userPersonalDataCacheService.getDecryptedUserData(consultant))
                .thenReturn(Map.of("name", "최상담"));

        List<ShopConsultantMappingOption> options =
                service.listActiveMappingOptions(TENANT, CLIENT_ID);

        assertThat(options).extracting(ShopConsultantMappingOption::getMappingId)
                .containsExactly(701L);
    }

    @Test
    @DisplayName("listActiveMappingOptions — TERMINATED·CANCELLED 제외")
    void listActiveMappingOptions_excludesTerminatedAndCancelled() {
        User consultant = consultantUser(15L, "enc-name");
        ConsultantClientMapping terminated = mapping(801L, consultant,
                ConsultantClientMapping.MappingStatus.TERMINATED, null);
        ConsultantClientMapping cancelled = mapping(802L, consultant,
                ConsultantClientMapping.MappingStatus.CANCELLED, null);
        terminated.setPaymentStatus(ConsultantClientMapping.PaymentStatus.REFUNDED);
        cancelled.setPaymentStatus(ConsultantClientMapping.PaymentStatus.REFUNDED);

        when(consultantClientMappingRepository.findByClientIdAndStatusNot(
                eq(TENANT), eq(CLIENT_ID), eq(ConsultantClientMapping.MappingStatus.INACTIVE)))
                .thenReturn(new ArrayList<>(List.of(terminated, cancelled)));

        assertThat(service.listActiveMappingOptions(TENANT, CLIENT_ID)).isEmpty();
    }

    @Test
    @DisplayName("listActiveMappingIds — 배정 매핑 없으면 빈 목록(NO_MAPPING 회귀)")
    void listActiveMappingIds_whenNoAssigned_returnsEmpty() {
        ConsultantClientMapping terminated = mapping(501L, consultantUser(12L, "x"),
                ConsultantClientMapping.MappingStatus.TERMINATED, null);

        when(consultantClientMappingRepository.findByClientIdAndStatusNot(
                eq(TENANT), eq(CLIENT_ID), eq(ConsultantClientMapping.MappingStatus.INACTIVE)))
                .thenReturn(new ArrayList<>(List.of(terminated)));

        assertThat(service.listActiveMappingIds(TENANT, CLIENT_ID)).isEmpty();
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
