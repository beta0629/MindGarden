package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.dto.SmsGatewaySendResult;
import com.coresolution.consultation.service.sms.impl.SolapiSmsProvider;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.env.MockEnvironment;

/**
 * {@link SmsGatewayServiceImpl} 단위 테스트.
 *
 * <p>2026-06-12 SSOT 통합 (PR #227 NCP SENS 폐기 + NHN Provider 제거):
 * <ol>
 *   <li>{@link SolapiSmsProvider} 단일 직접 호출 — 다중 어댑터 라우팅 제거.</li>
 *   <li>{@code isStubMode} = !{@code SolapiSmsProvider.isConfigured()} 단순 매핑.</li>
 *   <li>입력 검증(빈 phone/body) 즉시 실패 — provider 호출 없음.</li>
 *   <li>solapi 실패 시 {@code consumeLastErrorDetail()} 로 진단 메시지 노출.</li>
 *   <li>provider 예외 시 게이트웨이 실패로 안전하게 매핑.</li>
 * </ol></p>
 *
 * @author MindGarden
 * @since 2026-06-12
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SmsGatewayServiceImpl — Solapi 단일 SSOT")
class SmsGatewayServiceImplTest {

    private static final String PHONE = "01012345678";
    private static final String MESSAGE = "[MindGarden] 인증번호: 123456";

    @Mock
    private SolapiSmsProvider solapiSmsProvider;

    private MockEnvironment environment;
    private SmsGatewayServiceImpl sut;

    @BeforeEach
    void setUp() {
        this.environment = new MockEnvironment();
        this.sut = new SmsGatewayServiceImpl(solapiSmsProvider, environment);
    }

    @Nested
    @DisplayName("isStubMode")
    class StubModeTests {

        @Test
        @DisplayName("Solapi.isConfigured()=false 면 isStubMode=true")
        void stubMode_whenSolapiNotConfigured_true() {
            when(solapiSmsProvider.isConfigured()).thenReturn(false);

            assertThat(sut.isStubMode()).isTrue();
        }

        @Test
        @DisplayName("Solapi.isConfigured()=true 면 isStubMode=false")
        void stubMode_whenSolapiConfigured_false() {
            when(solapiSmsProvider.isConfigured()).thenReturn(true);

            assertThat(sut.isStubMode()).isFalse();
        }

        @Test
        @DisplayName("Solapi.isConfigured() 호출 중 예외가 나면 안전하게 stub 모드로 처리")
        void stubMode_whenSolapiThrows_treatedAsStub() {
            when(solapiSmsProvider.isConfigured()).thenThrow(new IllegalStateException("tenant not ready"));

            assertThat(sut.isStubMode()).isTrue();
        }
    }

    @Nested
    @DisplayName("sendDetailed — Solapi 단일 라우팅")
    class SendDetailedTests {

        @Test
        @DisplayName("stub 모드면 Solapi 호출 없이 stub 결과를 반환한다")
        void sendDetailed_whenStub_returnsStubWithoutCallingSolapi() {
            when(solapiSmsProvider.isConfigured()).thenReturn(false);

            SmsGatewaySendResult result = sut.sendDetailed(PHONE, MESSAGE);

            assertThat(result.isOk()).isTrue();
            assertThat(result.getGatewayStatusCode()).isEqualTo("stub");
            verify(solapiSmsProvider, never()).sendSms(eq(PHONE), eq(MESSAGE));
        }

        @Test
        @DisplayName("Solapi 발송 성공 시 ok=true / gatewayStatusCode=ok")
        void sendDetailed_whenSolapiReturnsTrue_success() {
            when(solapiSmsProvider.isConfigured()).thenReturn(true);
            when(solapiSmsProvider.sendSms(PHONE, MESSAGE)).thenReturn(true);

            SmsGatewaySendResult result = sut.sendDetailed(PHONE, MESSAGE);

            assertThat(result.isOk()).isTrue();
            assertThat(result.getGatewayStatusCode()).isEqualTo("ok");
            verify(solapiSmsProvider).sendSms(eq(PHONE), eq(MESSAGE));
        }

        @Test
        @DisplayName("Solapi 발송 실패 시 ok=false 이고 consumeLastErrorDetail() 메시지가 노출된다")
        void sendDetailed_whenSolapiReturnsFalse_failureWithDetail() {
            when(solapiSmsProvider.isConfigured()).thenReturn(true);
            when(solapiSmsProvider.sendSms(PHONE, MESSAGE)).thenReturn(false);
            when(solapiSmsProvider.consumeLastErrorDetail()).thenReturn("Solapi 403 FORBIDDEN: invalid api key");

            SmsGatewaySendResult result = sut.sendDetailed(PHONE, MESSAGE);

            assertThat(result.isOk()).isFalse();
            assertThat(result.getGatewayStatusCode()).isEqualTo("failure");
            assertThat(result.getGatewayMessage()).contains("Solapi 403 FORBIDDEN");
        }

        @Test
        @DisplayName("Solapi.sendSms 가 RuntimeException 을 던지면 ok=false 이고 안전 매핑")
        void sendDetailed_whenSolapiThrows_failure() {
            when(solapiSmsProvider.isConfigured()).thenReturn(true);
            when(solapiSmsProvider.sendSms(PHONE, MESSAGE))
                    .thenThrow(new IllegalStateException("connection reset"));

            SmsGatewaySendResult result = sut.sendDetailed(PHONE, MESSAGE);

            assertThat(result.isOk()).isFalse();
            assertThat(result.getGatewayStatusCode()).isEqualTo("failure");
            assertThat(result.getGatewayMessage()).contains("IllegalStateException");
            assertThat(result.getGatewayMessage()).contains("connection reset");
        }

        @Test
        @DisplayName("빈 phone 은 invalid_input 즉시 실패 — Solapi 호출 없음")
        void sendDetailed_whenBlankPhone_invalidInput() {
            SmsGatewaySendResult result = sut.sendDetailed("", MESSAGE);

            assertThat(result.isOk()).isFalse();
            assertThat(result.getGatewayStatusCode()).isEqualTo("invalid_input");
            verify(solapiSmsProvider, never()).sendSms(org.mockito.ArgumentMatchers.any(),
                    org.mockito.ArgumentMatchers.any());
        }

        @Test
        @DisplayName("null phone 은 invalid_input 즉시 실패")
        void sendDetailed_whenNullPhone_invalidInput() {
            SmsGatewaySendResult result = sut.sendDetailed(null, MESSAGE);

            assertThat(result.isOk()).isFalse();
            assertThat(result.getGatewayStatusCode()).isEqualTo("invalid_input");
        }

        @Test
        @DisplayName("빈 body 는 invalid_input 즉시 실패 — Solapi 호출 없음")
        void sendDetailed_whenBlankBody_invalidInput() {
            SmsGatewaySendResult result = sut.sendDetailed(PHONE, "");

            assertThat(result.isOk()).isFalse();
            assertThat(result.getGatewayStatusCode()).isEqualTo("invalid_input");
            verify(solapiSmsProvider, never()).sendSms(org.mockito.ArgumentMatchers.any(),
                    org.mockito.ArgumentMatchers.any());
        }
    }

    @Nested
    @DisplayName("send (boolean wrapper)")
    class SendBooleanWrapperTests {

        @Test
        @DisplayName("send 는 sendDetailed.isOk() 를 그대로 노출한다")
        void send_delegatesToSendDetailed() {
            when(solapiSmsProvider.isConfigured()).thenReturn(true);
            when(solapiSmsProvider.sendSms(PHONE, MESSAGE)).thenReturn(true);

            assertThat(sut.send(PHONE, MESSAGE)).isTrue();
        }
    }
}
