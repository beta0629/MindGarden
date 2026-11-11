package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.config.HomepageInquiryProperties;
import com.coresolution.consultation.service.HomepageInquiryNotificationChannel;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 기본 알림 채널 — 사이드바 뱃지(COUNT)만 사용. email/sms 설정 시에도 개인정보 없이 no-op 로깅만 한다.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BadgeHomepageInquiryNotificationChannel implements HomepageInquiryNotificationChannel {

    private static final String CHANNEL_BADGE = "badge";
    private static final String CHANNEL_EMAIL = "email";
    private static final String CHANNEL_SMS = "sms";

    private final HomepageInquiryProperties properties;

    @Override
    public void notifyNewInquiry(String tenantId, Long inquiryId) {
        String channel = properties.getNotificationChannel();
        if (channel == null || channel.isBlank() || CHANNEL_BADGE.equalsIgnoreCase(channel)) {
            log.debug("homepage-inquiry badge channel: tenantId={} inquiryId={}", tenantId, inquiryId);
            return;
        }
        if (CHANNEL_EMAIL.equalsIgnoreCase(channel) || CHANNEL_SMS.equalsIgnoreCase(channel)) {
            // 명시 활성화 전까지 no-op (개인정보 미포함)
            log.info("homepage-inquiry {} channel configured but not enabled yet: tenantId={} inquiryId={}",
                    channel, tenantId, inquiryId);
            return;
        }
        log.debug("homepage-inquiry unknown channel '{}', treating as badge: tenantId={} inquiryId={}",
                channel, tenantId, inquiryId);
    }
}
