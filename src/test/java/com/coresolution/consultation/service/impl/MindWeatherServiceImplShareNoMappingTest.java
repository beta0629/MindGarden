package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.dto.mindweather.MindWeatherShareRequest;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.MindWeatherCard;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.NoActiveConsultantMappingException;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.MindWeatherCardRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.mindweather.MindWeatherHeuristicAnalyzer;
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

/**
 * 마음 날씨 — 내담자가 활성 매핑 없이 카드를 공유 시도할 때 비즈니스 예외 발생 회귀 테스트.
 *
 * <p>매핑 0건 → {@link NoActiveConsultantMappingException} 즉시 발생.
 * ACTIVE 또는 SESSIONS_EXHAUSTED 매핑 1건 이상 → 정상 공유.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MindWeatherServiceImpl — 미매핑 내담자 공유 가드")
class MindWeatherServiceImplShareNoMappingTest {

    private static final String TENANT = "tenant-mw-share-guard";
    private static final long CARD_ID = 7777L;
    private static final long CLIENT_ID = 111L;
    private static final long CONSULTANT_ID = 222L;

    @Mock
    private MindWeatherCardRepository mindWeatherCardRepository;

    @Mock
    private MindWeatherHeuristicAnalyzer heuristicAnalyzer;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ConsultantClientMappingRepository consultantClientMappingRepository;

    @Mock
    private UserPersonalDataCacheService userPersonalDataCacheService;

    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;

    @Mock
    private MobilePushDispatchService mobilePushDispatchService;

    @InjectMocks
    private MindWeatherServiceImpl service;

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId(TENANT);
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("매핑 0건 — NoActiveConsultantMappingException 발생")
    void noMapping_throwsBusinessException() {
        User client = clientUser(CLIENT_ID);
        MindWeatherCard card = card(CARD_ID, client);
        MindWeatherShareRequest request = shareRequest(true, false, null);

        when(mindWeatherCardRepository.findByTenantIdAndIdAndClientId(TENANT, CARD_ID, CLIENT_ID))
            .thenReturn(Optional.of(card));
        when(consultantClientMappingRepository.findByClientIdAndStatusNot(
            TENANT, CLIENT_ID, ConsultantClientMapping.MappingStatus.INACTIVE))
            .thenReturn(List.of());

        assertThatExceptionOfType(NoActiveConsultantMappingException.class)
            .isThrownBy(() -> service.share(String.valueOf(CARD_ID), request, client))
            .withMessageContaining("매칭된 담당 상담사가 없습니다");
    }

    @Test
    @DisplayName("ACTIVE 매핑 1건 — 정상 공유 (예외 없음)")
    void activeMapping_shareSucceeds() {
        User client = clientUser(CLIENT_ID);
        User consultant = consultantUser(CONSULTANT_ID);
        MindWeatherCard card = card(CARD_ID, client);
        MindWeatherShareRequest request = shareRequest(true, false, null);

        ConsultantClientMapping mapping = mapping(consultant, client,
            ConsultantClientMapping.MappingStatus.ACTIVE);

        when(mindWeatherCardRepository.findByTenantIdAndIdAndClientId(TENANT, CARD_ID, CLIENT_ID))
            .thenReturn(Optional.of(card));
        when(consultantClientMappingRepository.findByClientIdAndStatusNot(
            TENANT, CLIENT_ID, ConsultantClientMapping.MappingStatus.INACTIVE))
            .thenReturn(List.of(mapping));
        when(consultantClientMappingRepository.findByTenantIdAndConsultantAndClient(
            TENANT, consultant, client)).thenReturn(List.of(mapping));

        assertThatNoException().isThrownBy(() ->
            service.share(String.valueOf(CARD_ID), request, client));
    }

    @Test
    @DisplayName("SESSIONS_EXHAUSTED 매핑만 — 정상 공유 (재계약 안내 흐름)")
    void sessionsExhaustedMapping_shareSucceeds() {
        User client = clientUser(CLIENT_ID);
        User consultant = consultantUser(CONSULTANT_ID);
        MindWeatherCard card = card(CARD_ID, client);
        MindWeatherShareRequest request = shareRequest(true, false, null);

        ConsultantClientMapping mapping = mapping(consultant, client,
            ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED);

        when(mindWeatherCardRepository.findByTenantIdAndIdAndClientId(TENANT, CARD_ID, CLIENT_ID))
            .thenReturn(Optional.of(card));
        when(consultantClientMappingRepository.findByClientIdAndStatusNot(
            TENANT, CLIENT_ID, ConsultantClientMapping.MappingStatus.INACTIVE))
            .thenReturn(List.of(mapping));
        when(consultantClientMappingRepository.findByTenantIdAndConsultantAndClient(
            TENANT, consultant, client)).thenReturn(List.of(mapping));

        assertThatNoException().isThrownBy(() ->
            service.share(String.valueOf(CARD_ID), request, client));
    }

    private static User clientUser(long id) {
        User u = new User();
        u.setId(id);
        u.setTenantId(TENANT);
        return u;
    }

    private static User consultantUser(long id) {
        User u = new User();
        u.setId(id);
        u.setTenantId(TENANT);
        return u;
    }

    private static MindWeatherCard card(long id, User client) {
        MindWeatherCard card = MindWeatherCard.builder()
            .client(client)
            .source("memo")
            .bodyText("body")
            .summary("summary")
            .tone("calm")
            .keywords(List.of())
            .shareSummary(false)
            .shareOriginal(false)
            .build();
        card.setId(id);
        card.setTenantId(TENANT);
        return card;
    }

    private static ConsultantClientMapping mapping(
            User consultant,
            User client,
            ConsultantClientMapping.MappingStatus status) {
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setTenantId(TENANT);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setStatus(status);
        return m;
    }

    private static MindWeatherShareRequest shareRequest(
            boolean shareSummary,
            boolean shareOriginal,
            Long consultantId) {
        MindWeatherShareRequest req = new MindWeatherShareRequest();
        req.setShareSummary(shareSummary);
        req.setShareOriginal(shareOriginal);
        req.setConsultantId(consultantId);
        return req;
    }
}
