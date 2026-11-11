package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.config.HomepageInquiryProperties;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 홈페이지 문의 보관기간 초과 행 퍼지 훅.
 *
 * <p>기본 비활성({@code mindgarden.homepage-inquiry.purge-enabled=false}).
 * retentionDays 미설정 시에도 실행하지 않는다. 실삭제 로직은 후속 활성화 시 추가.
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
     * 매일 03:40 — 활성화·보관일수가 있을 때만 로그(실삭제 없음).
     */
    @Scheduled(cron = "${mindgarden.homepage-inquiry.purge-cron:0 40 3 * * *}")
    public void purgeExpiredIfEnabled() {
        if (!properties.isPurgeEnabled() || properties.getRetentionDays() == null) {
            return;
        }
        log.info("homepage-inquiry purge hook armed but delete is disabled until explicitly implemented: retentionDays={}",
                properties.getRetentionDays());
    }
}
