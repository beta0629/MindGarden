package com.coresolution.consultation.dto;

import lombok.Builder;
import lombok.Value;

/**
 * SMS 게이트웨이 발송 결과 — 솔라피(Solapi) 단일 SSOT 의 응답 코드/메시지를
 * 호출자({@link com.coresolution.consultation.service.OtpDeliveryService}) 에 노출하는 DTO.
 *
 * <p>호출자는 본 결과의 {@code gatewayStatusCode} 를 {@link com.coresolution.consultation.entity.AuditLog}
 * metadata 의 {@code gateway_response_code} 키로 적재해 운영 진단·BI 통계에서 동일 SSOT 값을 사용한다.</p>
 *
 * <p>채널 표기는 {@link com.coresolution.consultation.constant.OtpDeliveryChannel} 가 담당하며,
 * 본 결과는 게이트웨이 호출 자체의 성공/실패와 코드만 표현한다(stub 모드 여부는
 * {@link com.coresolution.consultation.service.SmsGatewayService#isStubMode()} 가 별도 신호).</p>
 *
 * <p>2026-06-12 SSOT 통합: 이전 NCP SENS HTTP statusCode("202") 매핑을 솔라피 단일 게이트웨이 응답으로
 * 대체했다. 새 매핑 — 성공: {@code "ok"}, 실패: {@code "failure"}, stub: {@code "stub"},
 * 입력 오류: {@code "invalid_input"}.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@Value
@Builder
public class SmsGatewaySendResult {

    /** 게이트웨이가 발송 시도를 성공 응답으로 받았으면 {@code true}. stub 모드도 true 로 표기. */
    boolean ok;

    /**
     * 게이트웨이가 반환한 상태 코드 문자열 — 솔라피의 경우 정상은 {@code "ok"}, 실패는 {@code "failure"},
     * stub 모드는 {@code "stub"}, 입력 검증 실패는 {@code "invalid_input"} 으로 표기한다.
     * AuditLog metadata 의 {@code gateway_response_code} 키에 적재된다.
     */
    String gatewayStatusCode;

    /**
     * 게이트웨이가 반환한 statusMessage 또는 운영 진단용 사유. null 가능.
     * 사용자에게는 직접 노출하지 않는다(운영 로그·AuditLog metadata 한정).
     */
    String gatewayMessage;

    /**
     * 성공 결과 헬퍼.
     *
     * @param statusCode 게이트웨이 status 코드 (예: "ok")
     * @param message    statusMessage (null 가능)
     * @return ok=true 결과
     */
    public static SmsGatewaySendResult success(String statusCode, String message) {
        return SmsGatewaySendResult.builder()
                .ok(true)
                .gatewayStatusCode(statusCode)
                .gatewayMessage(message)
                .build();
    }

    /**
     * 실패 결과 헬퍼.
     *
     * @param statusCode 게이트웨이 status 코드 (예: "failure", "invalid_input")
     * @param message    실패 사유
     * @return ok=false 결과
     */
    public static SmsGatewaySendResult failure(String statusCode, String message) {
        return SmsGatewaySendResult.builder()
                .ok(false)
                .gatewayStatusCode(statusCode)
                .gatewayMessage(message)
                .build();
    }

    /** stub 모드 응답 헬퍼. */
    public static SmsGatewaySendResult stub() {
        return SmsGatewaySendResult.builder()
                .ok(true)
                .gatewayStatusCode("stub")
                .gatewayMessage("Solapi credentials not configured")
                .build();
    }
}
