package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.coresolution.consultation.constant.MindWeatherConstants;
import com.coresolution.consultation.dto.mindweather.MindWeatherCardResponse;
import com.coresolution.consultation.entity.MindWeatherCard;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.MindWeatherCardRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.mindweather.MindWeatherHeuristicAnalyzer;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;

/**
 * {@link MindWeatherServiceImpl#toResponse} 테넌트 경계·수신함 표기 폴백 검증.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
@ExtendWith(MockitoExtension.class)
@SuppressWarnings("unchecked")
class MindWeatherServiceImplToResponseTest {

    private static final String TENANT = "tenant-mw-toresponse-1";

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

    @InjectMocks
    private MindWeatherServiceImpl mindWeatherService;

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId(TENANT);
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("toResponse: client·clientUserId FK 없으면 clientName은 공유 카드#카드PK")
    void toResponse_fallsBackToSharedCardHeadlineWhenClientUnknown() throws Exception {
        MindWeatherCard card = mock(MindWeatherCard.class);
        when(card.getClient()).thenReturn(null);
        when(card.getClientUserId()).thenReturn(null);
        when(card.getId()).thenReturn(77L);
        when(card.getSource()).thenReturn("memo");
        when(card.getSummary()).thenReturn("요약");
        when(card.getTone()).thenReturn("positive");
        when(card.getKeywords()).thenReturn(List.of());
        when(card.getCreatedAt()).thenReturn(LocalDateTime.of(2026, 5, 16, 10, 0));

        Class<? extends Enum<?>> modeEnum =
            (Class<? extends Enum<?>>) Class.forName(
                "com.coresolution.consultation.service.impl.MindWeatherServiceImpl$CardViewMode");
        @SuppressWarnings("rawtypes")
        Class rawMode = modeEnum;
        Object consultantInbox = Enum.valueOf(rawMode, "CONSULTANT_INBOX");

        MindWeatherCardResponse out =
            (MindWeatherCardResponse) ReflectionTestUtils.invokeMethod(
                mindWeatherService, "toResponse", card, consultantInbox);

        assertThat(out.getClientName()).isEqualTo(MindWeatherConstants.SHARED_CARD_HEADLINE_PREFIX + "77");
        assertThat(out.getClientId()).isNull();
    }
}
