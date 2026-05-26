package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.entity.Alert;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.AlertRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.KakaoAlimTalkService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.RefundAutoCancelNotificationService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 부분 환불 / 강제 종료로 회기 소진 시 4채널 의무 통지 오케스트레이터 구현.
 *
 * <p>각 채널은 독립적으로 발송되며, 한 채널 예외/실패는 다른 채널 발송에 영향을 주지 않도록 try-catch
 * 로 격리한다. 결과는 채널 키 → {@code OK}/{@code FAIL}/{@code SKIP(reason)} 맵으로 반환한다.</p>
 *
 * @author MindGarden
 * @since 2026-05-26
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefundAutoCancelNotificationServiceImpl implements RefundAutoCancelNotificationService {

    private final AlertRepository alertRepository;
    private final EmailService emailService;
    private final MobilePushDispatchService mobilePushDispatchService;
    private final KakaoAlimTalkService kakaoAlimTalkService;
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final CommonCodeService commonCodeService;

    @Override
    public Map<String, String> dispatchRefundAutoCancelNotification(
            String tenantId,
            User client,
            Long mappingId,
            int cancelCount,
            String mypageUrl) {
        Map<String, String> results = new LinkedHashMap<>();
        results.put(CHANNEL_KEY_IN_APP, RESULT_SKIP + "(not-attempted)");
        results.put(CHANNEL_KEY_EMAIL, RESULT_SKIP + "(not-attempted)");
        results.put(CHANNEL_KEY_PUSH, RESULT_SKIP + "(not-attempted)");
        results.put(CHANNEL_KEY_ALIMTALK, RESULT_SKIP + "(not-attempted)");

        if (client == null) {
            log.warn("환불 자동 취소 4채널 통지 skip: client null (mappingId={})", mappingId);
            results.replaceAll((k, v) -> RESULT_SKIP + "(no-client)");
            return results;
        }
        if (tenantId == null || tenantId.isBlank()) {
            log.warn("환불 자동 취소 4채널 통지 skip: tenantId 없음 (mappingId={}, clientId={})",
                    mappingId, client.getId());
            results.replaceAll((k, v) -> RESULT_SKIP + "(no-tenant)");
            return results;
        }
        int safeCount = Math.max(cancelCount, 0);

        results.put(CHANNEL_KEY_IN_APP, sendInApp(tenantId, client, mappingId, safeCount, mypageUrl));
        results.put(CHANNEL_KEY_EMAIL, sendEmail(client, safeCount, mypageUrl));
        results.put(CHANNEL_KEY_PUSH, sendPush(tenantId, client, mappingId, safeCount, mypageUrl));
        results.put(CHANNEL_KEY_ALIMTALK, sendAlimtalk(client, safeCount, mypageUrl));

        log.info("📢 자동 취소 알림 4채널 발송: mappingId={}, count={}, channels={}",
                mappingId, safeCount, results);
        return results;
    }

    private String sendInApp(String tenantId, User client, Long mappingId, int cancelCount, String mypageUrl) {
        try {
            Alert alert = new Alert();
            alert.setTenantId(tenantId);
            alert.setUserId(client.getId());
            alert.setType(AdminServiceUserFacingMessages.REFUND_AUTO_CANCEL_REASON_CODE);
            String highPriority = safeCommonCode("ALERT_PRIORITY", "HIGH", "HIGH");
            String unreadStatus = safeCommonCode("ALERT_STATUS", "UNREAD", "UNREAD");
            alert.setPriority(highPriority);
            alert.setStatus(unreadStatus);
            alert.setTitle(AdminServiceUserFacingMessages.REFUND_AUTO_CANCEL_NOTIFICATION_TITLE);
            String body = String.format(
                    AdminServiceUserFacingMessages.REFUND_AUTO_CANCEL_NOTIFICATION_BODY_FMT, cancelCount);
            alert.setContent(body);
            alert.setSummary(body.length() <= 200 ? body : body.substring(0, 200));
            alert.setIcon("bi-x-circle-fill");
            alert.setColor("#dc3545");
            alert.setChannel("IN_APP");
            alert.setIsDismissible(true);
            // 의무 통지 — 자동 닫기 없음(사용자 명시적 확인 요구)
            if (mypageUrl != null && !mypageUrl.isBlank()) {
                alert.setLinkUrl(mypageUrl.trim());
            }
            if (mappingId != null) {
                alert.setRelatedEntityType("CONSULTANT_CLIENT_MAPPING");
                alert.setRelatedEntityId(mappingId);
            }
            alert.setIsSent(true);
            alert.setSentAt(LocalDateTime.now());
            alertRepository.save(alert);
            return RESULT_OK;
        } catch (Exception e) {
            log.error("❌ 인앱 알림 저장 실패: mappingId={}, clientId={}", mappingId, client.getId(), e);
            return RESULT_FAIL + "(" + safeShort(e.getClass().getSimpleName()) + ")";
        }
    }

    private String sendEmail(User client, int cancelCount, String mypageUrl) {
        String email = client.getEmail();
        if (email == null || email.isBlank()) {
            return RESULT_SKIP + "(no-email)";
        }
        try {
            boolean ok = emailService.sendAutoCancelNotification(email, cancelCount, mypageUrl);
            return ok ? RESULT_OK : RESULT_FAIL;
        } catch (Exception e) {
            log.error("❌ 이메일 발송 실패: clientId={}", client.getId(), e);
            return RESULT_FAIL + "(" + safeShort(e.getClass().getSimpleName()) + ")";
        }
    }

    private String sendPush(String tenantId, User client, Long mappingId, int cancelCount, String mypageUrl) {
        try {
            mobilePushDispatchService.dispatchAutoCancellation(
                    tenantId, client.getId(), mappingId, cancelCount, mypageUrl);
            return RESULT_OK;
        } catch (Exception e) {
            log.error("❌ 푸시 발송 실패: mappingId={}, clientId={}", mappingId, client.getId(), e);
            return RESULT_FAIL + "(" + safeShort(e.getClass().getSimpleName()) + ")";
        }
    }

    private String sendAlimtalk(User client, int cancelCount, String mypageUrl) {
        String phone = decryptPhone(client);
        if (phone == null || phone.isBlank()) {
            return RESULT_SKIP + "(no-phone)";
        }
        try {
            boolean ok = kakaoAlimTalkService.sendAutoCancelRefund(phone, cancelCount, mypageUrl);
            if (ok) {
                return RESULT_OK;
            }
            String detail = null;
            try {
                detail = kakaoAlimTalkService.consumeLastErrorDetail();
            } catch (Exception ignore) {
                // ignore — 일부 구현은 미지원
            }
            return RESULT_FAIL + (detail != null && !detail.isBlank()
                    ? "(" + safeShort(detail) + ")"
                    : "");
        } catch (Exception e) {
            log.error("❌ 알림톡 발송 실패: clientId={}", client.getId(), e);
            return RESULT_FAIL + "(" + safeShort(e.getClass().getSimpleName()) + ")";
        }
    }

    private String decryptPhone(User user) {
        try {
            if (user.getPhone() != null && !user.getPhone().trim().isEmpty()) {
                return encryptionUtil.decrypt(user.getPhone());
            }
        } catch (Exception e) {
            log.warn("전화번호 복호화 실패: clientId={}, error={}", user.getId(), e.getMessage());
        }
        return null;
    }

    private String safeCommonCode(String group, String key, String fallback) {
        try {
            String value = commonCodeService.getCodeValue(group, key);
            if (value != null && !value.isBlank()) {
                return value;
            }
        } catch (Exception e) {
            log.debug("공통코드 조회 실패 group={} key={}: {}", group, key, e.getMessage());
        }
        return fallback;
    }

    private static String safeShort(String value) {
        if (value == null) {
            return "";
        }
        return value.length() <= 64 ? value : value.substring(0, 64);
    }
}
