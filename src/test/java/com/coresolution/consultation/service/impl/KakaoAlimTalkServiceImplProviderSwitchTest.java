package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.entity.TenantKakaoAlimtalkSettings;
import com.coresolution.consultation.integration.solapi.KakaoSolapiCredentialResolver;
import com.coresolution.consultation.integration.solapi.SolapiAlimTalkClient;
import com.coresolution.consultation.integration.solapi.SolapiAlimTalkRequest;
import com.coresolution.consultation.integration.solapi.SolapiAlimTalkResponse;
import com.coresolution.consultation.integration.solapi.SolapiCredentials;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.TenantKakaoAlimtalkSettingsRepository;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * {@link KakaoAlimTalkServiceImpl} provider 스위치 동작 검증.
 *
 * <ul>
 *   <li>{@code provider=bizmsg}(기본): 기존 bizmsg 경로 — 시뮬레이션 모드는 솔라피 클라이언트 호출 없음</li>
 *   <li>{@code provider=solapi} + 시뮬레이션: 솔라피 클라이언트 호출 없이 true 반환</li>
 *   <li>{@code provider=solapi} + 실제 모드: 솔라피 클라이언트 호출 + 자격 증명/pfId resolve</li>
 *   <li>{@code provider=solapi} + 자격 증명 누락: false 반환</li>
 *   <li>{@code alimtalk.enabled=false}: provider 무관하게 false</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-05-20
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("KakaoAlimTalkServiceImpl provider 스위치")
class KakaoAlimTalkServiceImplProviderSwitchTest {

    private static final String TENANT_ID = "tenant-abc";
    private static final String PHONE = "01012345678";
    private static final String API_TEMPLATE = "TPL_RESERVATION_CONFIRMED_V1";

    @Mock
    private CommonCodeRepository commonCodeRepository;
    @Mock
    private SolapiAlimTalkClient solapiAlimTalkClient;
    @Mock
    private KakaoSolapiCredentialResolver solapiCredentialResolver;
    @Mock
    private TenantKakaoAlimtalkSettingsRepository tenantKakaoAlimtalkSettingsRepository;

    private KakaoAlimTalkServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new KakaoAlimTalkServiceImpl(
            commonCodeRepository,
            solapiAlimTalkClient,
            solapiCredentialResolver,
            tenantKakaoAlimtalkSettingsRepository);

        ReflectionTestUtils.setField(service, "alimTalkEnabled", true);
        ReflectionTestUtils.setField(service, "simulationMode", true);
        ReflectionTestUtils.setField(service, "provider", KakaoAlimTalkServiceImpl.PROVIDER_BIZMSG);
        ReflectionTestUtils.setField(service, "apiKey", "");
        ReflectionTestUtils.setField(service, "senderKey", "");
        ReflectionTestUtils.setField(service, "apiUrl", "https://alimtalk-api.bizmsg.kr");
        ReflectionTestUtils.setField(service, "solapiSenderNumber", "");
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("provider=bizmsg + simulation: 솔라피 클라이언트 미호출, true 반환")
    void bizmsgSimulationDoesNotInvokeSolapi() {
        boolean result = service.sendAlimTalk(PHONE, API_TEMPLATE, null, new HashMap<>());

        assertThat(result).isTrue();
        verify(solapiAlimTalkClient, never()).send(any());
        verify(solapiCredentialResolver, never()).resolveCredentials(any());
    }

    @Test
    @DisplayName("provider=solapi + simulation: 솔라피 클라이언트 미호출, true 반환")
    void solapiSimulationShortCircuits() {
        ReflectionTestUtils.setField(service, "provider", KakaoAlimTalkServiceImpl.PROVIDER_SOLAPI);

        boolean result = service.sendAlimTalk(PHONE, API_TEMPLATE, "CONSULTATION_CONFIRMED", new HashMap<>());

        assertThat(result).isTrue();
        verify(solapiAlimTalkClient, never()).send(any());
        verify(solapiCredentialResolver, never()).resolveCredentials(any());
    }

    @Test
    @DisplayName("provider=solapi + real + 정상 자격 증명: 솔라피 클라이언트 호출, ATA 요청 본문 검증")
    void solapiRealCallsClientWithResolvedCredentials() {
        ReflectionTestUtils.setField(service, "provider", KakaoAlimTalkServiceImpl.PROVIDER_SOLAPI);
        ReflectionTestUtils.setField(service, "simulationMode", false);
        TenantContextHolder.setTenantId(TENANT_ID);

        TenantKakaoAlimtalkSettings settings = new TenantKakaoAlimtalkSettings();
        settings.setKakaoApiKeyRef("TENANT_ABC_KAKAO");
        settings.setKakaoSenderKeyRef("PF01_TENANT_ABC");
        when(tenantKakaoAlimtalkSettingsRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
            .thenReturn(Optional.of(settings));

        SolapiCredentials credentials = new SolapiCredentials("NCSKEY", "NCSSECRETVALUEVALUEVALUE1234");
        when(solapiCredentialResolver.resolveCredentials("TENANT_ABC_KAKAO")).thenReturn(credentials);
        when(solapiCredentialResolver.resolvePfId("PF01_TENANT_ABC")).thenReturn("PF01TENANTABC");

        when(solapiAlimTalkClient.send(any(SolapiAlimTalkRequest.class)))
            .thenReturn(SolapiAlimTalkResponse.success("G123"));

        Map<String, String> params = new HashMap<>();
        params.put("#{name}", "홍길동");

        boolean result = service.sendAlimTalk(PHONE, API_TEMPLATE, null, params);

        assertThat(result).isTrue();

        ArgumentCaptor<SolapiAlimTalkRequest> captor = ArgumentCaptor.forClass(SolapiAlimTalkRequest.class);
        verify(solapiAlimTalkClient, times(1)).send(captor.capture());
        SolapiAlimTalkRequest captured = captor.getValue();
        assertThat(captured.pfId()).isEqualTo("PF01TENANTABC");
        assertThat(captured.templateId()).isEqualTo(API_TEMPLATE);
        assertThat(captured.toNumber()).isEqualTo(PHONE);
        assertThat(captured.credentials().apiKey()).isEqualTo("NCSKEY");
        assertThat(captured.credentials().apiSecret()).isEqualTo("NCSSECRETVALUEVALUEVALUE1234");
        assertThat(captured.variables()).containsEntry("#{name}", "홍길동");
    }

    @Test
    @DisplayName("provider=solapi + real + 알림톡 전용 키 비고 SMS 키 fallback 시 발송 진행")
    void solapiRealFallsBackToSmsKeysWhenAlimtalkKeysEmpty() {
        ReflectionTestUtils.setField(service, "provider", KakaoAlimTalkServiceImpl.PROVIDER_SOLAPI);
        ReflectionTestUtils.setField(service, "simulationMode", false);
        TenantContextHolder.setTenantId(TENANT_ID);

        TenantKakaoAlimtalkSettings settings = new TenantKakaoAlimtalkSettings();
        settings.setKakaoApiKeyRef(null);
        settings.setKakaoSenderKeyRef("PF01_TENANT_ABC");
        when(tenantKakaoAlimtalkSettingsRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
            .thenReturn(Optional.of(settings));

        SolapiCredentials smsFallback = new SolapiCredentials("SMSKEY", "SMSSECRETVALUEVALUEVALUE1234");
        when(solapiCredentialResolver.resolveCredentials(any())).thenReturn(smsFallback);
        when(solapiCredentialResolver.resolvePfId("PF01_TENANT_ABC")).thenReturn("PF01TENANTABC");

        when(solapiAlimTalkClient.send(any(SolapiAlimTalkRequest.class)))
            .thenReturn(SolapiAlimTalkResponse.success("G-SMS-FB-1"));

        boolean result = service.sendAlimTalk(PHONE, API_TEMPLATE, null, new HashMap<>());

        assertThat(result).isTrue();
        ArgumentCaptor<SolapiAlimTalkRequest> captor = ArgumentCaptor.forClass(SolapiAlimTalkRequest.class);
        verify(solapiAlimTalkClient, times(1)).send(captor.capture());
        SolapiAlimTalkRequest captured = captor.getValue();
        assertThat(captured.credentials().apiKey()).isEqualTo("SMSKEY");
        assertThat(captured.credentials().apiSecret()).isEqualTo("SMSSECRETVALUEVALUEVALUE1234");
        assertThat(captured.pfId()).isEqualTo("PF01TENANTABC");
    }

    @Test
    @DisplayName("provider=solapi + real + 자격 증명 누락: false 반환, 클라이언트 미호출")
    void solapiRealMissingCredentialsReturnsFalse() {
        ReflectionTestUtils.setField(service, "provider", KakaoAlimTalkServiceImpl.PROVIDER_SOLAPI);
        ReflectionTestUtils.setField(service, "simulationMode", false);

        when(solapiCredentialResolver.resolveCredentials(any()))
            .thenReturn(new SolapiCredentials("", ""));

        boolean result = service.sendAlimTalk(PHONE, API_TEMPLATE, null, new HashMap<>());

        assertThat(result).isFalse();
        verify(solapiAlimTalkClient, never()).send(any());
    }

    @Test
    @DisplayName("provider=solapi + real + pfId 누락: false 반환, 클라이언트 미호출")
    void solapiRealMissingPfIdReturnsFalse() {
        ReflectionTestUtils.setField(service, "provider", KakaoAlimTalkServiceImpl.PROVIDER_SOLAPI);
        ReflectionTestUtils.setField(service, "simulationMode", false);

        when(solapiCredentialResolver.resolveCredentials(any()))
            .thenReturn(new SolapiCredentials("k", "s"));
        when(solapiCredentialResolver.resolvePfId(any())).thenReturn("");

        boolean result = service.sendAlimTalk(PHONE, API_TEMPLATE, null, new HashMap<>());

        assertThat(result).isFalse();
        verify(solapiAlimTalkClient, never()).send(any());
    }

    @Test
    @DisplayName("alimtalk.enabled=false: provider 무관하게 false")
    void disabledShortCircuits() {
        ReflectionTestUtils.setField(service, "alimTalkEnabled", false);
        ReflectionTestUtils.setField(service, "provider", KakaoAlimTalkServiceImpl.PROVIDER_SOLAPI);

        boolean result = service.sendAlimTalk(PHONE, API_TEMPLATE, null, new HashMap<>());

        assertThat(result).isFalse();
        verify(solapiAlimTalkClient, never()).send(any());
    }

    @Test
    @DisplayName("isServiceAvailable(): provider=solapi + real + default 자격 증명 없음 → false")
    void isServiceAvailableSolapiWithoutDefaultsReturnsFalse() {
        ReflectionTestUtils.setField(service, "provider", KakaoAlimTalkServiceImpl.PROVIDER_SOLAPI);
        ReflectionTestUtils.setField(service, "simulationMode", false);
        when(solapiCredentialResolver.hasDefaultCredentials()).thenReturn(false);

        assertThat(service.isServiceAvailable()).isFalse();
    }

    @Test
    @DisplayName("isServiceAvailable(): provider=solapi + real + default 자격 증명 + pfId → true")
    void isServiceAvailableSolapiReady() {
        ReflectionTestUtils.setField(service, "provider", KakaoAlimTalkServiceImpl.PROVIDER_SOLAPI);
        ReflectionTestUtils.setField(service, "simulationMode", false);
        when(solapiCredentialResolver.hasDefaultCredentials()).thenReturn(true);
        when(solapiCredentialResolver.hasDefaultPfId()).thenReturn(true);

        assertThat(service.isServiceAvailable()).isTrue();
    }
}
