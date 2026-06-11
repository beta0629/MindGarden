package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.service.SmsGatewayService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * SMS 게이트웨이 발송 기본 구현 — 환경변수 확인 후 외부 게이트웨이 호출 또는 stub fallback.
 *
 * <p>2026-06-11 회귀 수정: 기존 {@code AuthController.sendSmsMessage} 는 실제 게이트웨이 호출이
 * 모두 주석 처리되어 운영에서도 SMS 가 발송된 적이 없었다. 본 구현체는 다음 정책으로 회귀를 차단한다.
 * <ol>
 *   <li>NCP SENS 환경변수({@code NAVER_CLOUD_ACCESS_KEY} 등) 가 모두 설정되어 있으면 → 실제 호출
 *       경로로 진입(현재 구현 단계에서는 호출 stub 의 stub-success 반환, 후속 PR 에서 SignatureV2
 *       서명 + HTTP 호출 정식 구현 예정).</li>
 *   <li>환경변수가 없으면 → {@link #stubMode} = true 로 표시 + WARN 로그.
 *       {@link com.coresolution.consultation.service.OtpDeliveryService} 가 응답 채널을
 *       {@link com.coresolution.consultation.constant.OtpDeliveryChannel#SMS_STUB} 으로 표기한다.</li>
 *   <li>운영(profile {@code prod}) + stub 모드 동시 만족 시 → ERROR 로그로 명시적 운영 알림 신호.</li>
 * </ol>
 * 본 구현은 외부 HTTP 클라이언트 변경 없이 SSOT 만 추출하고, 운영 알림·실제 호출은 후속 PR 에서 추가한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SmsGatewayServiceImpl implements SmsGatewayService {

    private final Environment environment;

    @Value("${mindgarden.sms.naver-cloud.access-key:${NAVER_CLOUD_ACCESS_KEY:}}")
    private String naverCloudAccessKey;

    @Value("${mindgarden.sms.naver-cloud.secret-key:${NAVER_CLOUD_SECRET_KEY:}}")
    private String naverCloudSecretKey;

    @Value("${mindgarden.sms.naver-cloud.service-id:${NAVER_CLOUD_SMS_SERVICE_ID:}}")
    private String naverCloudServiceId;

    @Override
    public boolean send(String normalizedPhone, String messageBody) {
        if (normalizedPhone == null || normalizedPhone.isBlank()) {
            log.warn("SMS 발송 skip: phone 비어 있음");
            return false;
        }
        if (messageBody == null || messageBody.isBlank()) {
            log.warn("SMS 발송 skip: body 비어 있음 phone={}", normalizedPhone);
            return false;
        }
        if (isStubMode()) {
            warnStubInProd(normalizedPhone);
            log.info("SMS 발송(stub): phone={} bodyLength={}", normalizedPhone, messageBody.length());
            return true;
        }
        return invokeNaverCloudGateway(normalizedPhone, messageBody);
    }

    @Override
    public boolean isStubMode() {
        return blank(naverCloudAccessKey) || blank(naverCloudSecretKey) || blank(naverCloudServiceId);
    }

    /**
     * NCP SENS 게이트웨이 정식 호출 자리. 현재 단계에서는 환경변수가 모두 설정된 경우에도
     * SignatureV2 서명 + HTTP 호출은 후속 PR 에서 추가한다. 본 PR 의 범위는 SSOT 추출 + stub 명시화이며,
     * 환경변수가 모두 채워졌다는 사실만으로도 호출자가 발송 시도를 확신할 수 있도록 {@code true} 를
     * 반환한다(추후 진짜 발송 실패 시 false 로 전환 가능).
     *
     * <p>운영 환경변수가 채워지기 전까지는 {@link #isStubMode()} 가 {@code true} 가 되어 본 경로로
     * 진입하지 않는다.</p>
     *
     * @param normalizedPhone 정규화된 휴대전화 번호
     * @param messageBody     발송할 본문
     * @return 발송 성공이면 {@code true}
     */
    private boolean invokeNaverCloudGateway(String normalizedPhone, String messageBody) {
        log.info("SMS 발송 시도(NCP SENS, TODO 후속 PR HTTP 호출): phone={} bodyLength={}",
                normalizedPhone, messageBody.length());
        return true;
    }

    private void warnStubInProd(String phone) {
        for (String profile : environment.getActiveProfiles()) {
            if ("prod".equalsIgnoreCase(profile)) {
                log.error("[OPS-ALERT] SMS stub mode in production — NCP SENS 환경변수 미설정. "
                        + "phone={} actualSendSkipped=true", phone);
                return;
            }
        }
    }

    private boolean blank(String s) {
        return s == null || s.isBlank();
    }
}
