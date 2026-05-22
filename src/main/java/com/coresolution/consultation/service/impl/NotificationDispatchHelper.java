package com.coresolution.consultation.service.impl;

import java.util.Map;
import com.coresolution.consultation.integration.solapi.SolapiSendIds;
import com.coresolution.consultation.service.KakaoAlimTalkService;
import com.coresolution.consultation.service.SmsAuthService;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 어드민 발송 도구 공용 단일-수신자 디스패치 헬퍼.
 *
 * <p>역할: {@link SmsAuthService#sendNotificationMessage(String, String)} 와
 * {@link KakaoAlimTalkService#sendAlimTalk(String, String, java.util.Map)} 를 try-catch 로 감싸고,
 * ThreadLocal 에 보존된 detail / Solapi 식별자(groupId/messageId) 를 한 번에 수확하여
 * {@link DispatchResult} 로 반환한다.
 *
 * <p>운영 호출부({@code KakaoAlimTalkServiceImpl}, {@code NotificationServiceImpl},
 * {@code SmsAuthService}) 는 변경하지 않는다 — 어드민 도구 두 곳
 * ({@code AdminTestNotificationServiceImpl} 단일·{@code AdminManualNotificationServiceImpl} 다중)
 * 에서 공통으로 사용해 발송·예외·식별자 보존 로직 중복을 제거한다.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationDispatchHelper {

    /** 발송 실패 표준 에러코드 (단일·다중 공통). */
    public static final String ERROR_CODE_SEND_FAILED = "SEND_FAILED";

    /**
     * {@code admin_test_notification_logs.error_message} VARCHAR(1000) — 안전하게 900자에서 절단.
     */
    private static final int ERROR_MESSAGE_LOG_LIMIT = 900;

    private final SmsAuthService smsAuthService;
    private final KakaoAlimTalkService kakaoAlimTalkService;

    /**
     * 단일 수신자 SMS 발송. 호출부는 호출 전 수신자 검증·복호화를 마쳐야 한다.
     *
     * @param phone   원본 전화번호(평문) — 호출 컨텍스트(메모리)에서만 사용한다
     * @param content 발송 본문
     * @return 결과(성공·errorCode·errorMessage). solapi IDs 는 SMS 경로에서 비어 있다
     */
    public DispatchResult dispatchSms(String phone, String content) {
        boolean success;
        String errorCode = null;
        String errorMessage = null;
        try {
            success = smsAuthService.sendNotificationMessage(phone, content);
            if (!success) {
                errorCode = ERROR_CODE_SEND_FAILED;
                String detail = consumeSmsDetailSafely();
                errorMessage = truncate(detail != null && !detail.isBlank()
                    ? detail
                    : "SmsAuthService.sendNotificationMessage returned false");
            }
        } catch (Exception e) {
            success = false;
            errorCode = ERROR_CODE_SEND_FAILED;
            String detail = consumeSmsDetailSafely();
            String base = detail != null && !detail.isBlank()
                ? detail
                : e.getClass().getSimpleName() + ": " + e.getMessage();
            errorMessage = truncate(base);
            log.warn("SMS dispatch 예외", e);
        }
        return new DispatchResult(success, errorCode, errorMessage, null, null);
    }

    /**
     * 단일 수신자 알림톡 발송. {@code apiTemplateCode} 는 Solapi 가 발급한 실 templateId 또는
     * 호환되는 식별자여야 한다. 변수 매핑은 호출부에서 wrap 후 전달한다.
     *
     * @param phone           원본 전화번호(평문)
     * @param apiTemplateCode {@code KakaoAlimTalkService#sendAlimTalk} 에 그대로 전달할 템플릿 식별자
     * @param params          {@code #{name}} → 값 매핑(불변·null 허용)
     * @return 결과(성공·errorCode·errorMessage·solapiGroupId·solapiMessageId)
     */
    public DispatchResult dispatchAlimtalk(String phone, String apiTemplateCode,
            Map<String, String> params) {
        boolean success;
        String errorCode = null;
        String errorMessage = null;
        String solapiGroupId = null;
        String solapiMessageId = null;
        try {
            success = kakaoAlimTalkService.sendAlimTalk(phone, apiTemplateCode, params);
            SolapiSendIds ids = consumeAlimtalkSendIdsSafely();
            if (ids != null) {
                solapiGroupId = ids.groupId();
                solapiMessageId = ids.messageId();
            }
            if (!success) {
                errorCode = ERROR_CODE_SEND_FAILED;
                String detail = consumeAlimtalkDetailSafely();
                errorMessage = truncate(detail != null && !detail.isBlank()
                    ? detail
                    : "KakaoAlimTalkService.sendAlimTalk returned false");
            }
        } catch (Exception e) {
            success = false;
            errorCode = ERROR_CODE_SEND_FAILED;
            SolapiSendIds ids = consumeAlimtalkSendIdsSafely();
            if (ids != null) {
                solapiGroupId = ids.groupId();
                solapiMessageId = ids.messageId();
            }
            String detail = consumeAlimtalkDetailSafely();
            String base = detail != null && !detail.isBlank()
                ? detail
                : e.getClass().getSimpleName() + ": " + e.getMessage();
            errorMessage = truncate(base);
            log.warn("Alimtalk dispatch 예외", e);
        }
        return new DispatchResult(success, errorCode, errorMessage, solapiGroupId, solapiMessageId);
    }

    /**
     * SMS 프로바이더의 ThreadLocal detail 을 안전 조회. 실패해도 호출 흐름을 막지 않는다.
     *
     * @return 직전 SMS 발송 실패의 상세 또는 {@code null}
     */
    public String consumeSmsDetailSafely() {
        try {
            return smsAuthService.consumeLastErrorDetail();
        } catch (Exception e) {
            log.debug("SmsAuthService.consumeLastErrorDetail 실패 (무시): {}", e.getMessage());
            return null;
        }
    }

    /**
     * 알림톡 프로바이더의 ThreadLocal detail 을 안전 조회.
     *
     * @return 직전 알림톡 발송 실패의 상세 또는 {@code null}
     */
    public String consumeAlimtalkDetailSafely() {
        try {
            return kakaoAlimTalkService.consumeLastErrorDetail();
        } catch (Exception e) {
            log.debug("KakaoAlimTalkService.consumeLastErrorDetail 실패 (무시): {}", e.getMessage());
            return null;
        }
    }

    /**
     * 알림톡 발송에서 솔라피가 반환한 식별자 묶음(groupId/messageId)을 안전 조회.
     *
     * @return 직전 알림톡 발송의 식별자 묶음 또는 {@code null}
     */
    public SolapiSendIds consumeAlimtalkSendIdsSafely() {
        try {
            return kakaoAlimTalkService.consumeLastSolapiIds();
        } catch (Exception e) {
            log.debug("KakaoAlimTalkService.consumeLastSolapiIds 실패 (무시): {}", e.getMessage());
            return null;
        }
    }

    /**
     * {@code error_message} VARCHAR(1000) 안전 절단.
     *
     * @param value 원본
     * @return {@code null} 또는 최대 {@link #ERROR_MESSAGE_LOG_LIMIT}자
     */
    public static String truncate(String value) {
        if (value == null) {
            return null;
        }
        return value.length() <= ERROR_MESSAGE_LOG_LIMIT
            ? value
            : value.substring(0, ERROR_MESSAGE_LOG_LIMIT) + "…(truncated)";
    }

    /**
     * 단일 수신자 발송 결과.
     *
     * @param success         발송 성공 여부
     * @param errorCode       실패 시 표준 에러코드(성공이면 null)
     * @param errorMessage    실패 시 상세 메시지(성공이면 null)
     * @param solapiGroupId   솔라피 groupId(SMS·미수신 시 null)
     * @param solapiMessageId 솔라피 messageId(SMS·미수신 시 null)
     */
    public record DispatchResult(boolean success, String errorCode, String errorMessage,
            String solapiGroupId, String solapiMessageId) {
    }
}
