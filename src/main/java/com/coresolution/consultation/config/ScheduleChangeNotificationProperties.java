package com.coresolution.consultation.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import lombok.Getter;
import lombok.Setter;

/**
 * 일정 변경 SCHEDULE_CHANGED 외부 채널 디바운스·스케줄러 설정.
 *
 * <p>{@code scheduler.schedule-change-notification.*} 바인딩.
 * 기본 debounce 10분, 폴링 cron 1분.</p>
 *
 * @author MindGarden
 * @since 2026-07-19
 */
@ConfigurationProperties(prefix = "scheduler.schedule-change-notification")
@Getter
@Setter
public class ScheduleChangeNotificationProperties {

    /** 스케줄러 활성 여부. */
    private boolean enabled = true;

    /**
     * 디바운스 대기(분). 마지막 슬롯 변경 후 이 시간동안 재변경 시 fire_at 이 연장된다.
     */
    private int debounceMinutes = 10;

    /** due pending 폴링 cron. 기본 매 1분. */
    private String cron = "0 * * * * *";
}
