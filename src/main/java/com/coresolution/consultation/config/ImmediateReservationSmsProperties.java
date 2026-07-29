package com.coresolution.consultation.config;

import java.time.LocalTime;
import org.springframework.boot.context.properties.ConfigurationProperties;
import lombok.Getter;
import lombok.Setter;

/**
 * 예약 즉시 SMS 업무시간·지연 발송 스케줄러 설정.
 *
 * <p>{@code scheduler.immediate-reservation-sms.*} 바인딩.
 * 업무시간 외 등록 분은 pending 큐에 넣고 fire_at 에 발송한다.</p>
 *
 * @author MindGarden
 * @since 2026-07-29
 */
@ConfigurationProperties(prefix = "scheduler.immediate-reservation-sms")
@Getter
@Setter
public class ImmediateReservationSmsProperties {

    /** 스케줄러·지연 발송 활성 여부. false 이면 업무시간 가드 없이 즉시 발송(레거시). */
    private boolean enabled = true;

    /** 업무 시작(포함). 기본 09:00 Asia/Seoul. */
    private LocalTime businessStart = LocalTime.of(9, 0);

    /** 업무 종료(미포함). 기본 18:00 Asia/Seoul. */
    private LocalTime businessEnd = LocalTime.of(18, 0);

    /** due pending 폴링 cron. 기본 매 1분. */
    private String cron = "0 * * * * *";
}
