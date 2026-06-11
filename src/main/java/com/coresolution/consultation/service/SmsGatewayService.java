package com.coresolution.consultation.service;

/**
 * SMS 게이트웨이 발송 SSOT.
 *
 * <p>기존 {@code AuthController.sendSmsMessage} 인라인 호출(시뮬레이션 모드 고정)을
 * Spring Bean 으로 추출하여 {@link OtpDeliveryService} 및 향후 다른 SMS 발송 경로가 동일 SSOT 를
 * 사용하도록 한다. 운영 게이트웨이(NCP SENS · Aligo · Gabia 등) 정식 연동 시 본 인터페이스의
 * 구현체만 교체하면 된다.</p>
 *
 * <p>2026-06-11 회귀 진단:
 * <ul>
 *   <li>기존 {@code AuthController.sendSmsMessage} 는 실제 게이트웨이 호출이 모두 주석 처리되어
 *       있어 운영 환경에서도 단 한 건의 실제 SMS 가 발송된 적이 없다(stub 성공만 반환).</li>
 *   <li>본 인터페이스의 기본 구현은 동일하게 stub 이지만,
 *       <strong>운영 profile 에서 명시적 WARN 로그</strong> + {@link #isStubMode()}
 *       플래그 노출로 호출자가 응답 채널을 정확히 표기할 수 있도록 한다.</li>
 *   <li>회귀 방어: {@link OtpDeliveryService} 가 push-first 분기를 우선 시도하므로 expo-app 사용자는
 *       SMS stub 의 영향을 받지 않으며, 데스크탑 사용자만 stub 채널을 통과한다.</li>
 * </ul></p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
public interface SmsGatewayService {

    /**
     * 단일 수신자에게 SMS 본문 발송 시도.
     *
     * @param normalizedPhone 정규화된 한국 휴대전화 숫자열 (예: {@code 01012345678})
     * @param messageBody     발송할 본문 (운영자가 보낸 사람 prefix 를 별도 부착)
     * @return 게이트웨이 또는 stub 발송 성공이면 {@code true}, 실패면 {@code false}
     */
    boolean send(String normalizedPhone, String messageBody);

    /**
     * 본 구현체가 실제 외부 게이트웨이를 호출하지 않고 시뮬레이션만 수행 중인지 여부.
     *
     * <p>{@link OtpDeliveryService} 가 응답 {@code deliveryChannel} 을 {@code SMS_STUB} 으로
     * 표기할지 결정할 때 참조한다. 운영 profile 에서 {@code true} 면 운영 알림이 필요한 상태.</p>
     *
     * @return stub 모드면 {@code true}
     */
    boolean isStubMode();
}
