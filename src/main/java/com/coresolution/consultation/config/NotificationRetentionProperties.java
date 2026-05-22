package com.coresolution.consultation.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import lombok.Getter;
import lombok.Setter;

/**
 * 알림 로그 보관기간(retention) 스케줄러 설정.
 *
 * <p>{@code app.notification.retention.*} 키로 바인딩. 두 테이블
 * ({@code admin_test_notification_logs}, {@code notification_batch_send_log}) 의
 * 90일 초과 row 를 매일 03:30 KST 에 일괄 삭제하는 시스템 잡 설정이다.
 *
 * <p>운영 디스크 사용량 안정화를 위한 보관 정책이며, 멀티테넌트 무관(전역) 잡으로
 * tenant 컨텍스트 fallback 은 사용하지 않는다. 컷오프 기준은 {@code created_at}.
 *
 * <p>모든 값은 외부화(properties)되어 있고 하드코딩이 없다.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@ConfigurationProperties(prefix = "app.notification.retention")
@Getter
@Setter
public class NotificationRetentionProperties {

    /** 스케줄러 활성화 토글. */
    private boolean enabled = true;

    /** 보관 기간(일). 기본 90일. */
    private int retentionDays = 90;

    /** 1회 DELETE 당 배치 사이즈(LIMIT). 대량 lock 방지를 위해 N회 반복 처리. */
    private int batchSize = 5000;

    /** Cron 표현식. 기본 매일 03:30 KST. */
    private String cron = "0 30 3 * * *";

    /** 드라이런 모드 — 활성화 시 카운트만 로깅하고 실제 삭제는 수행하지 않는다. */
    private boolean dryRun = false;
}
