package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.dto.SmsGatewaySendResult;
import com.coresolution.consultation.service.SmsGatewayService;
import com.coresolution.consultation.service.sms.impl.SolapiSmsProvider;

import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

/**
 * SMS 게이트웨이 발송 — 솔라피(Solapi) 단일 SSOT 구현체.
 *
 * <p>2026-06-12 SSOT 통합 (PR #227 NCP SENS 폐기 + NHN Provider 제거):
 * <ol>
 *   <li>이전 NCP SENS 직접 호출 코드(SignatureV2 / HmacSHA256 / Base64) 전면 제거.</li>
 *   <li>다중 어댑터 라우팅 제거 — {@link SolapiSmsProvider} 단일 직접 호출.</li>
 *   <li>{@link OtpDeliveryServiceImpl} 등 호출자는 본 서비스를 통해서만 외부 SMS 게이트웨이로 진입한다.</li>
 *   <li>솔라피 자격 증명 미설정({@link SolapiSmsProvider#isConfigured()}=false) 시 stub 모드로 동작하며,
 *       운영 profile 에서는 명시적 ERROR 로그.</li>
 *   <li>카카오 알림톡 경로(SolapiAlimTalkClient 등) 는 SMS 와 별개 — 본 SSOT 에 포함하지 않는다.</li>
 * </ol></p>
 *
 * <p>호출 흐름:
 * <pre>
 *   {@link OtpDeliveryServiceImpl} → {@link SmsGatewayService#sendDetailed}
 *       → {@link SolapiSmsProvider#sendSms} → Solapi REST API
 * </pre></p>
 *
 * @author MindGarden
 * @since 2026-06-12
 */
@Slf4j
@Service
public class SmsGatewayServiceImpl implements SmsGatewayService {

    /** 게이트웨이 응답 코드 — 솔라피 정상 발송. */
    static final String GATEWAY_STATUS_OK = "ok";
    /** 게이트웨이 응답 코드 — 솔라피 자격 증명 미설정(stub 모드). */
    static final String GATEWAY_STATUS_STUB = "stub";
    /** 게이트웨이 응답 코드 — 솔라피 발송 실패(상세는 message). */
    static final String GATEWAY_STATUS_FAILURE = "failure";
    /** 게이트웨이 응답 코드 — 입력 검증 실패. */
    static final String GATEWAY_STATUS_INVALID_INPUT = "invalid_input";

    private final SolapiSmsProvider solapiSmsProvider;
    private final Environment environment;

    /**
     * 운영용 생성자.
     *
     * @param solapiSmsProvider 솔라피 SMS Provider 단일 진입점
     * @param environment       Spring Environment (운영 profile WARN 로그 분기용)
     */
    public SmsGatewayServiceImpl(SolapiSmsProvider solapiSmsProvider, Environment environment) {
        this.solapiSmsProvider = solapiSmsProvider;
        this.environment = environment;
    }

    @Override
    public SmsGatewaySendResult sendDetailed(String normalizedPhone, String messageBody) {
        if (normalizedPhone == null || normalizedPhone.isBlank()) {
            log.warn("SMS 발송 skip: phone 비어 있음");
            return SmsGatewaySendResult.failure(GATEWAY_STATUS_INVALID_INPUT, "phone is blank");
        }
        if (messageBody == null || messageBody.isBlank()) {
            log.warn("SMS 발송 skip: body 비어 있음 phone={}", normalizedPhone);
            return SmsGatewaySendResult.failure(GATEWAY_STATUS_INVALID_INPUT, "body is blank");
        }
        if (isStubMode()) {
            warnStubInProd(normalizedPhone);
            log.info("SMS 발송(stub): phone={} bodyLength={}", normalizedPhone, messageBody.length());
            return SmsGatewaySendResult.stub();
        }

        boolean success;
        try {
            success = solapiSmsProvider.sendSms(normalizedPhone, messageBody);
        } catch (RuntimeException ex) {
            log.error("[OPS-ALERT] Solapi SMS 발송 예외: phone={} message={}",
                    normalizedPhone, ex.getMessage(), ex);
            return SmsGatewaySendResult.failure(GATEWAY_STATUS_FAILURE,
                    ex.getClass().getSimpleName() + ": " + ex.getMessage());
        }

        if (success) {
            log.info("Solapi SMS 발송 성공: phone={}", normalizedPhone);
            return SmsGatewaySendResult.success(GATEWAY_STATUS_OK, "solapi accepted");
        }

        String detail = solapiSmsProvider.consumeLastErrorDetail();
        log.error("[OPS-ALERT] Solapi SMS 발송 실패: phone={} detail={}", normalizedPhone, detail);
        return SmsGatewaySendResult.failure(GATEWAY_STATUS_FAILURE,
                detail != null && !detail.isBlank() ? detail : "solapi sendSms returned false");
    }

    @Override
    public boolean isStubMode() {
        try {
            return !solapiSmsProvider.isConfigured();
        } catch (RuntimeException ex) {
            log.warn("Solapi isConfigured 조회 실패 — stub 모드로 처리 message={}", ex.getMessage());
            return true;
        }
    }

    private void warnStubInProd(String phone) {
        for (String profile : environment.getActiveProfiles()) {
            if ("prod".equalsIgnoreCase(profile)) {
                log.error("[OPS-ALERT] SMS stub mode in production — Solapi 자격 증명 미설정. "
                        + "phone={} actualSendSkipped=true", phone);
                return;
            }
        }
    }
}
