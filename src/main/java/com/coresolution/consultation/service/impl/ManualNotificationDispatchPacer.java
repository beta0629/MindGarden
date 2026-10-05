package com.coresolution.consultation.service.impl;

import java.util.EnumMap;
import java.util.Map;
import com.coresolution.consultation.config.ManualNotificationProperties;
import com.coresolution.consultation.constant.ManualNotificationJobConstants;
import com.coresolution.consultation.dto.TestNotificationChannel;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 채널별 초당 발송 수 조절(인스턴스 단위). 설정 {@code notification.manual.job.<channel>.per-second} 를 넘지 않도록
 * 다음 허용 시각까지 기다린다. 0 이하면 조절하지 않는다.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@Component
@RequiredArgsConstructor
public class ManualNotificationDispatchPacer {

    private final ManualNotificationProperties properties;
    private final Sleeper sleeper;
    private final Map<TestNotificationChannel, Long> nextAllowedAt = new EnumMap<>(TestNotificationChannel.class);

    /**
     * {@code permits} 건을 보내기 전에 호출한다.
     *
     * @param channel 채널
     * @param permits 이번에 보낼 건수
     * @throws InterruptedException 대기 중 인터럽트
     */
    public void acquire(TestNotificationChannel channel, int permits) throws InterruptedException {
        int perSecond = properties.getJob().forChannel(channel).getPerSecond();
        if (perSecond <= 0 || permits <= 0) {
            return;
        }
        long intervalMillis = permits * ManualNotificationJobConstants.MILLIS_PER_SECOND / perSecond;
        long waitMillis;
        synchronized (nextAllowedAt) {
            long now = sleeper.currentTimeMillis();
            long allowedAt = Math.max(now, nextAllowedAt.getOrDefault(channel, now));
            waitMillis = allowedAt - now;
            nextAllowedAt.put(channel, allowedAt + intervalMillis);
        }
        if (waitMillis > 0) {
            sleeper.sleep(waitMillis);
        }
    }

    /**
     * 시계·대기 추상화(테스트에서 실제로 잠들지 않게 교체).
     */
    public interface Sleeper {

        /**
         * @return 현재 시각(ms)
         */
        long currentTimeMillis();

        /**
         * @param millis 대기(ms)
         * @throws InterruptedException 인터럽트
         */
        void sleep(long millis) throws InterruptedException;
    }

    /**
     * 기본 시계·대기.
     */
    @Component
    public static class SystemSleeper implements Sleeper {

        @Override
        public long currentTimeMillis() {
            return System.currentTimeMillis();
        }

        @Override
        public void sleep(long millis) throws InterruptedException {
            Thread.sleep(millis);
        }
    }
}
