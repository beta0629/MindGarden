package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.config.HomepageInquiryProperties;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * CONTACTED 이후 보관기간 초과 행 퍼지 훅.
 *
 * <p>기본 {@code purge-enabled=false}. 활성화·보관일수가 있어도 본 PR 에서는 실삭제하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class HomepageInquiryRetentionPurgeScheduler {

    private final HomepageInquiryProperties properties;

    /**
     * 매일 03:40 — 게이트만 확인(실삭제 없음).
     */
    @Scheduled(cron = "${mindgarden.homepage-inquiry.purge-cron:0 40 3 * * *}")
    public void purgeExpiredIfEnabled() {
        if (!properties.isPurgeEnabled()) {
            return;
        }
        log.info(
                "homepage-inquiry purge hook armed but delete is disabled until explicitly implemented: "
                        + "purgeAfterContactedDays={}",
                properties.getPurgeAfterContactedDays());
    }
}
