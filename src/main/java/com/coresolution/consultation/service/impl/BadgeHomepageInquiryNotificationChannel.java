package com.coresolution.consultation.service.impl;

import java.util.List;
import com.coresolution.consultation.config.HomepageInquiryProperties;
import com.coresolution.consultation.service.HomepageInquiryNotificationChannel;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.support.DeferredExternalCalls;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 홈페이지 문의 알림 — 기본 {@code badge,push}. email/sms 는 명시 포함 시 no-op.
 * 개인정보를 포함하지 않는다. 푸시는 트랜잭션 커밋 이후({@link DeferredExternalCalls})에 보낸다.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BadgeHomepageInquiryNotificationChannel implements HomepageInquiryNotificationChannel {

    private static final String CHANNEL_BADGE = "badge";
    private static final String CHANNEL_PUSH = "push";
    private static final String CHANNEL_EMAIL = "email";
    private static final String CHANNEL_SMS = "sms";

    private final HomepageInquiryProperties properties;
    private final MobilePushDispatchService mobilePushDispatchService;

    @Override
    public void notifyNewInquiry(String tenantId, Long inquiryId, String inquiryTypeLabel) {
        List<String> channels = properties.resolvedNotificationChannels();
        for (String channel : channels) {
            if (CHANNEL_BADGE.equals(channel)) {
                log.debug("homepage-inquiry badge channel: tenantId={} inquiryId={}", tenantId, inquiryId);
                continue;
            }
            if (CHANNEL_PUSH.equals(channel)) {
                schedulePush(tenantId, inquiryId, inquiryTypeLabel);
                continue;
            }
            if (CHANNEL_EMAIL.equals(channel) || CHANNEL_SMS.equals(channel)) {
                log.info("homepage-inquiry {} channel configured but not enabled yet: tenantId={} inquiryId={}",
                        channel, tenantId, inquiryId);
                continue;
            }
            log.debug("homepage-inquiry unknown channel '{}': tenantId={} inquiryId={}",
                    channel, tenantId, inquiryId);
        }
    }

    private void schedulePush(String tenantId, Long inquiryId, String inquiryTypeLabel) {
        Runnable pushCall = () -> {
            try {
                mobilePushDispatchService.dispatchHomepageInquiry(tenantId, inquiryId, inquiryTypeLabel);
            } catch (RuntimeException ex) {
                log.error("homepage-inquiry push failed (POST unaffected): tenantId={} inquiryId={} reason={}",
                        tenantId, inquiryId, ex.getMessage());
            }
        };
        if (!DeferredExternalCalls.deferIfActive(pushCall)) {
            pushCall.run();
        }
    }
}
