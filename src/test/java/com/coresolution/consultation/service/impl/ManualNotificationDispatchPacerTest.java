package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import com.coresolution.consultation.config.ManualNotificationProperties;
import com.coresolution.consultation.dto.TestNotificationChannel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 초당 발송 수 조절 단위 테스트(실제로 잠들지 않는 시계).
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@DisplayName("수동 발송 초당 조절")
class ManualNotificationDispatchPacerTest {

    @Test
    @DisplayName("초당 2건이면 같은 시각 연속 호출은 0·500·1000ms 대기")
    void perSecondLimit_spacesCalls() throws Exception {
        FakeSleeper sleeper = new FakeSleeper();
        ManualNotificationDispatchPacer pacer = new ManualNotificationDispatchPacer(properties(2), sleeper);

        pacer.acquire(TestNotificationChannel.SMS, 1);
        pacer.acquire(TestNotificationChannel.SMS, 1);
        pacer.acquire(TestNotificationChannel.SMS, 1);

        assertThat(sleeper.sleeps).containsExactly(500L, 1000L);
    }

    @Test
    @DisplayName("청크 단위(푸시 3건)는 건수만큼 간격을 잡는다")
    void permits_scaleInterval() throws Exception {
        FakeSleeper sleeper = new FakeSleeper();
        ManualNotificationDispatchPacer pacer = new ManualNotificationDispatchPacer(properties(2), sleeper);

        pacer.acquire(TestNotificationChannel.SMS, 3);
        pacer.acquire(TestNotificationChannel.SMS, 1);

        assertThat(sleeper.sleeps).containsExactly(1500L);
    }

    @Test
    @DisplayName("0 이하 설정이면 조절하지 않는다")
    void nonPositive_noThrottle() throws Exception {
        FakeSleeper sleeper = new FakeSleeper();
        ManualNotificationDispatchPacer pacer = new ManualNotificationDispatchPacer(properties(0), sleeper);

        for (int i = 0; i < 5; i++) {
            pacer.acquire(TestNotificationChannel.SMS, 1);
        }

        assertThat(sleeper.sleeps).isEmpty();
    }

    private static ManualNotificationProperties properties(int perSecond) {
        ManualNotificationProperties properties = new ManualNotificationProperties();
        properties.getJob().getSms().setPerSecond(perSecond);
        return properties;
    }

    private static final class FakeSleeper implements ManualNotificationDispatchPacer.Sleeper {
        private final List<Long> sleeps = new ArrayList<>();

        @Override
        public long currentTimeMillis() {
            return 0L;
        }

        @Override
        public void sleep(long millis) {
            sleeps.add(millis);
        }
    }
}
