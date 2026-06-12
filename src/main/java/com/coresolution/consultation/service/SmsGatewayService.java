package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.SmsGatewaySendResult;

/**
 * SMS 게이트웨이 발송 SSOT.
 *
 * <p>기존 {@code AuthController.sendSmsMessage} 인라인 호출(시뮬레이션 모드 고정)을
 * Spring Bean 으로 추출하여 {@link OtpDeliveryService} 및 향후 다른 SMS 발송 경로가 동일 SSOT 를
 * 사용하도록 한다. 본 서비스는 {@link com.coresolution.consultation.service.sms.impl.SolapiSmsProvider}
 * 를 단일 진입점으로 삼아 외부 SMS 게이트웨이를 호출한다.</p>
 *
 * <p>2026-06-12 SSOT 통합 (PR #227 NCP SENS 폐기 + NHN Provider 제거):
 * <ul>
 *   <li>이전 NCP SENS 직접 구현 제거 — 운영 통합된 솔라피 인프라 단일화.</li>
 *   <li>다중 어댑터(SmsProvider 우회 라우팅) 제거 — 솔라피 단일 호출 경로.</li>
 *   <li>{@link #sendDetailed(String, String)} — 솔라피 응답 코드/메시지를 포함한 정식 결과.</li>
 *   <li>{@link #send(String, String)} — 호환용 boolean wrapper(기존 호출자 회귀 차단).</li>
 *   <li>솔라피 자격 증명 미설정 시 stub 모드 유지(운영 profile 에서는 ERROR 로그).</li>
 * </ul></p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
public interface SmsGatewayService {

    /**
     * 단일 수신자에게 SMS 본문 발송 시도(호환 boolean wrapper).
     *
     * @param normalizedPhone 정규화된 한국 휴대전화 숫자열 (예: {@code 01012345678})
     * @param messageBody     발송할 본문 (운영자가 보낸 사람 prefix 를 별도 부착)
     * @return 게이트웨이 또는 stub 발송 성공이면 {@code true}, 실패면 {@code false}
     */
    default boolean send(String normalizedPhone, String messageBody) {
        return sendDetailed(normalizedPhone, messageBody).isOk();
    }

    /**
     * 단일 수신자에게 SMS 본문 발송 시도(정식 결과 반환).
     *
     * <p>호출자(예: {@link OtpDeliveryService}) 는 본 결과의 {@code gatewayStatusCode} 를
     * {@link com.coresolution.consultation.entity.AuditLog} metadata 의 {@code gateway_response_code}
     * 키에 적재해 운영 진단·BI 통계 SSOT 로 활용한다.</p>
     *
     * @param normalizedPhone 정규화된 한국 휴대전화 숫자열 (예: {@code 01012345678})
     * @param messageBody     발송할 본문 (운영자가 보낸 사람 prefix 를 별도 부착)
     * @return 정식 결과 — ok/statusCode/message
     */
    SmsGatewaySendResult sendDetailed(String normalizedPhone, String messageBody);

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
