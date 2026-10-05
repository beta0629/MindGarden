package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import com.coresolution.consultation.config.ManualNotificationProperties;
import com.coresolution.consultation.constant.ManualNotificationJobConstants;
import com.coresolution.consultation.repository.ManualNotificationJobRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 수동 발송 작업을 전용 스레드풀에 올리고, 멈춘 작업(오래 남은 PENDING·점유 만료 RUNNING)을 주기적으로 다시 올린다.
 * 실제 실행 여부는 워커의 조건부 점유가 결정하므로 같은 작업이 여러 번 올라가도 한 번만 실행된다.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@Slf4j
@Component
public class ManualNotificationJobLauncher {

    /** 전용 실행기 빈 이름. */
    public static final String EXECUTOR_BEAN = "manualNotificationJobExecutor";

    private final TaskExecutor executor;
    private final ManualNotificationJobWorker worker;
    private final ManualNotificationJobRepository jobRepository;
    private final ManualNotificationProperties properties;

    /**
     * @param executor      전용 실행기
     * @param worker        워커
     * @param jobRepository 작업 저장소
     * @param properties    설정
     */
    public ManualNotificationJobLauncher(@Qualifier(EXECUTOR_BEAN) TaskExecutor executor,
            ManualNotificationJobWorker worker, ManualNotificationJobRepository jobRepository,
            ManualNotificationProperties properties) {
        this.executor = executor;
        this.worker = worker;
        this.jobRepository = jobRepository;
        this.properties = properties;
    }

    /**
     * 작업 실행 예약. 트랜잭션 안이면 커밋 후에 올린다. 대기열이 가득 차면 PENDING 으로 남겨 복구가 이어 간다.
     *
     * @param jobId 작업 PK
     */
    public void launch(Long jobId) {
        if (!properties.getJob().isAutoLaunch()) {
            return;
        }
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    submit(jobId);
                }
            });
            return;
        }
        submit(jobId);
    }

    /**
     * 멈춘 작업 복구.
     */
    @Scheduled(fixedDelayString = "${notification.manual.job.recovery-interval-ms:60000}")
    public void recoverStaleJobs() {
        if (!properties.getJob().isRecoveryEnabled() || !properties.getJob().isAutoLaunch()) {
            return;
        }
        LocalDateTime pendingBefore = LocalDateTime.now().minusSeconds(properties.getJob().getPendingGraceSeconds());
        List<Long> ids = jobRepository.findRecoverableIds(pendingBefore, ManualNotificationJobConstants.nowKst(),
            PageRequest.of(0, Math.max(1, properties.getJob().getRecoveryBatchSize())));
        for (Long id : ids) {
            log.info("manual_notification_job_recover jobPk={}", id);
            submit(id);
        }
    }

    private void submit(Long jobId) {
        try {
            executor.execute(() -> worker.run(jobId));
        } catch (TaskRejectedException e) {
            log.warn("manual_notification_job_deferred jobPk={} code={}", jobId,
                ManualNotificationJobConstants.ERROR_EXECUTOR_BUSY);
        }
    }
}
