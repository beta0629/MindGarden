package com.coresolution.consultation.config;

import com.coresolution.consultation.service.impl.ManualNotificationJobLauncher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * 수동 발송 작업 전용 실행기. 크기는 {@code notification.manual.job.executor-*} 설정.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@Configuration
public class ManualNotificationJobExecutorConfig {

    private static final String THREAD_PREFIX = "manual-notify-";

    /**
     * @param properties 수동 발송 설정
     * @return 실행기
     */
    @Bean(name = ManualNotificationJobLauncher.EXECUTOR_BEAN)
    public ThreadPoolTaskExecutor manualNotificationJobExecutor(ManualNotificationProperties properties) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        int poolSize = Math.max(1, properties.getJob().getExecutorPoolSize());
        executor.setCorePoolSize(poolSize);
        executor.setMaxPoolSize(poolSize);
        executor.setQueueCapacity(Math.max(0, properties.getJob().getExecutorQueueCapacity()));
        executor.setThreadNamePrefix(THREAD_PREFIX);
        executor.setWaitForTasksToCompleteOnShutdown(false);
        executor.initialize();
        return executor;
    }
}
