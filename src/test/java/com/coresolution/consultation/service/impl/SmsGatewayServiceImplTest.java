package com.coresolution.consultation.service.impl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;

/**
 * {@link SmsGatewayServiceImpl} 단위 테스트.
 *
 * <p>2026-06-11 회귀 가드 — 운영 SMS 미발송 회귀(기존 sendSmsMessage 시뮬레이션 고정) 차단:
 * <ul>
 *   <li>NCP SENS 환경변수 미설정 시 {@link SmsGatewayServiceImpl#isStubMode()} = true 로
 *       호출자(OtpDeliveryService) 가 응답 채널을 SMS_STUB 으로 정확히 표기할 수 있어야 한다.</li>
 *   <li>환경변수가 모두 채워지면 stub mode = false 로 전환되어 정식 발송 경로로 진입한다.</li>
 *   <li>빈 phone/body 입력은 false 반환(NPE 방지).</li>
 * </ul></p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@ExtendWith(MockitoExtension.class)
class SmsGatewayServiceImplTest {

    @Mock
    private Environment environment;

    @InjectMocks
    private SmsGatewayServiceImpl sut;

    @Test
    @DisplayName("NCP SENS 환경변수 미설정 → isStubMode=true, send() 는 true 반환(시뮬레이션)")
    void isStubMode_whenEnvAbsent_true() {
        ReflectionTestUtils.setField(sut, "naverCloudAccessKey", "");
        ReflectionTestUtils.setField(sut, "naverCloudSecretKey", "");
        ReflectionTestUtils.setField(sut, "naverCloudServiceId", "");
        lenient().when(environment.getActiveProfiles()).thenReturn(new String[]{"dev"});

        assertThat(sut.isStubMode()).isTrue();
        assertThat(sut.send("01012345678", "[MindGarden] 인증번호: 123456 (5분 내 입력)")).isTrue();
    }

    @Test
    @DisplayName("NCP SENS 환경변수 모두 채워짐 → isStubMode=false, send() 는 게이트웨이 경로(true 반환)")
    void isStubMode_whenEnvAllPresent_false() {
        ReflectionTestUtils.setField(sut, "naverCloudAccessKey", "AKIAACCESS");
        ReflectionTestUtils.setField(sut, "naverCloudSecretKey", "secret-xxx");
        ReflectionTestUtils.setField(sut, "naverCloudServiceId", "service-1");

        assertThat(sut.isStubMode()).isFalse();
        assertThat(sut.send("01012345678", "[MindGarden] 인증번호: 654321 (5분 내 입력)")).isTrue();
    }

    @Test
    @DisplayName("빈 phone 또는 빈 body → send() 는 false (NPE 방지 + 호출 가드)")
    void send_whenBlankInputs_returnsFalse() {
        ReflectionTestUtils.setField(sut, "naverCloudAccessKey", "AKIA");
        ReflectionTestUtils.setField(sut, "naverCloudSecretKey", "S");
        ReflectionTestUtils.setField(sut, "naverCloudServiceId", "I");

        assertThat(sut.send("", "body")).isFalse();
        assertThat(sut.send("01012345678", "")).isFalse();
        assertThat(sut.send(null, null)).isFalse();
    }
}
