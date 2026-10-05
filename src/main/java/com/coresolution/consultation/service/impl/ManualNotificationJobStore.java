package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import com.coresolution.consultation.constant.ManualNotificationDeliveryStatus;
import com.coresolution.consultation.constant.ManualNotificationJobConstants;
import com.coresolution.consultation.constant.ManualNotificationJobStatus;
import com.coresolution.consultation.constant.ManualNotificationProviderMode;
import com.coresolution.consultation.entity.ManualNotificationDispatchRecord;
import com.coresolution.consultation.entity.ManualNotificationJob;
import com.coresolution.consultation.entity.ManualNotificationJobRecipient;
import com.coresolution.consultation.repository.ManualNotificationDispatchRecordRepository;
import com.coresolution.consultation.repository.ManualNotificationJobRecipientRepository;
import com.coresolution.consultation.repository.ManualNotificationJobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 수동 발송 작업의 짧은 DB 쓰기 모음. 메서드마다 독립 트랜잭션으로 끝나므로 워커는 프로바이더 호출 동안
 * 트랜잭션·커넥션을 잡지 않는다. 상태 전이는 모두 직전 상태를 조건으로 한 UPDATE 다.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@Component
@RequiredArgsConstructor
public class ManualNotificationJobStore {

    private final ManualNotificationJobRepository jobRepository;
    private final ManualNotificationJobRecipientRepository recipientRepository;
    private final ManualNotificationDispatchRecordRepository dispatchRecordRepository;

    /**
     * 작업과 확정 수신자를 한 트랜잭션으로 저장한다.
     *
     * @param job        작업
     * @param recipients 확정 수신자(jobId 는 여기서 채운다)
     * @return 저장된 작업
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ManualNotificationJob createJob(ManualNotificationJob job, List<ManualNotificationJobRecipient> recipients) {
        ManualNotificationJob saved = jobRepository.saveAndFlush(job);
        for (ManualNotificationJobRecipient r : recipients) {
            r.setJobId(saved.getId());
            r.setTenantId(saved.getTenantId());
        }
        recipientRepository.saveAll(recipients);
        return saved;
    }

    /**
     * 실행 점유.
     *
     * @param jobId      작업 PK
     * @param owner      실행자
     * @param now        현재(KST)
     * @param leaseUntil 만료(KST)
     * @return 점유 성공 여부
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean claim(Long jobId, String owner, LocalDateTime now, LocalDateTime leaseUntil) {
        return jobRepository.claim(jobId, owner, now, leaseUntil) == 1;
    }

    /**
     * 점유 연장.
     *
     * @param jobId      작업 PK
     * @param owner      실행자
     * @param leaseUntil 새 만료(KST)
     * @return 여전히 점유 중이면 true
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean renewLease(Long jobId, String owner, LocalDateTime leaseUntil) {
        return jobRepository.renewLease(jobId, owner, leaseUntil) == 1;
    }

    /**
     * 이전 실행이 프로바이더 호출 중 멈춘 수신자(DISPATCHING)를 결과 미상 FAILED 로 닫는다. 다시 보내지 않는다.
     *
     * @param jobId 작업 PK
     * @param now   현재(KST)
     * @return 닫은 수신자 수
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int closeInterruptedDispatches(Long jobId, LocalDateTime now) {
        List<ManualNotificationJobRecipient> stuck = recipientRepository.findByJobIdAndStatusOrderBySeqAsc(jobId,
            ManualNotificationDeliveryStatus.DISPATCHING);
        int closed = 0;
        for (ManualNotificationJobRecipient r : stuck) {
            closed += recipientRepository.complete(r.getId(), ManualNotificationDeliveryStatus.DISPATCHING,
                ManualNotificationDeliveryStatus.FAILED, ManualNotificationJobConstants.RESULT_DISPATCH_OUTCOME_UNKNOWN,
                ManualNotificationJobConstants.RESULT_DISPATCH_OUTCOME_UNKNOWN, null, null, now);
            dispatchRecordRepository.complete(jobId, r.getId(), ManualNotificationDeliveryStatus.FAILED,
                ManualNotificationJobConstants.RESULT_DISPATCH_OUTCOME_UNKNOWN, now);
        }
        if (closed > 0) {
            jobRepository.incrementCounters(jobId, 0, closed, 0);
        }
        return closed;
    }

    /**
     * 프로바이더 호출 직전 기록: 수신자 PENDING → DISPATCHING 과 발송 기록(유니크 dispatch_key) INSERT.
     * 이미 다른 실행이 가져갔으면 false. 유니크 위반이면 예외로 롤백된다(호출측은 발송하지 않는다).
     *
     * @param job          작업
     * @param recipient    수신자
     * @param chunkIndex   청크 순번
     * @param attemptNo    실행 시도 번호
     * @param providerMode 프로바이더 모드
     * @param dispatchKey  발송 키
     * @param now          현재(KST)
     * @return 프로바이더를 불러도 되면 true
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean beginDispatch(ManualNotificationJob job, ManualNotificationJobRecipient recipient, int chunkIndex,
            int attemptNo, ManualNotificationProviderMode providerMode, String dispatchKey, LocalDateTime now) {
        if (recipientRepository.markDispatching(recipient.getId(), chunkIndex, attemptNo) != 1) {
            return false;
        }
        dispatchRecordRepository.saveAndFlush(ManualNotificationDispatchRecord.builder()
            .tenantId(job.getTenantId())
            .jobId(job.getId())
            .jobRecipientId(recipient.getId())
            .userId(recipient.getUserId())
            .phoneMasked(recipient.getPhoneMasked())
            .channel(job.getChannel())
            .chunkIndex(chunkIndex)
            .dispatchKey(dispatchKey)
            .attemptNo(attemptNo)
            .providerMode(providerMode)
            .status(ManualNotificationDeliveryStatus.DISPATCHING)
            .dispatchedAt(now)
            .build());
        return true;
    }

    /**
     * 프로바이더 결과 기록(DISPATCHING → SENT·FAILED·SKIPPED)과 진행 집계.
     *
     * @param jobId        작업 PK
     * @param recipientId  수신자 PK
     * @param to           결과 상태
     * @param resultCode   결과 코드
     * @param errorCode    오류 코드
     * @param errorMessage 오류 메시지
     * @param now          현재(KST)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void completeDispatch(Long jobId, Long recipientId, ManualNotificationDeliveryStatus to, String resultCode,
            String errorCode, String errorMessage, LocalDateTime now) {
        int updated = recipientRepository.complete(recipientId, ManualNotificationDeliveryStatus.DISPATCHING, to,
            resultCode, errorCode, truncate(errorMessage), null, now);
        if (updated != 1) {
            return;
        }
        dispatchRecordRepository.complete(jobId, recipientId, to, resultCode, now);
        incrementFor(jobId, to);
    }

    /**
     * 프로바이더 호출 전 판정으로 끝내기(PENDING → SKIPPED·FAILED). 발송 기록은 만들지 않는다.
     *
     * @param jobId       작업 PK
     * @param recipientId 수신자 PK
     * @param to          결과 상태
     * @param code        결과 코드
     * @param now         현재(KST)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void completeWithoutDispatch(Long jobId, Long recipientId, ManualNotificationDeliveryStatus to,
            String code, LocalDateTime now) {
        if (recipientRepository.complete(recipientId, ManualNotificationDeliveryStatus.PENDING, to, code, code, null,
                null, now) == 1) {
            incrementFor(jobId, to);
        }
    }

    /**
     * 남은 PENDING 전부 FAILED 로 닫는다(템플릿 매핑 없음 등 작업 단위 실패).
     *
     * @param jobId 작업 PK
     * @param code  결과 코드
     * @param now   현재(KST)
     * @return 닫은 수
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int failRemaining(Long jobId, String code, LocalDateTime now) {
        int failed = 0;
        for (ManualNotificationJobRecipient r : recipientRepository.findByJobIdAndStatusOrderBySeqAsc(jobId,
                ManualNotificationDeliveryStatus.PENDING)) {
            failed += recipientRepository.complete(r.getId(), ManualNotificationDeliveryStatus.PENDING,
                ManualNotificationDeliveryStatus.FAILED, code, code, null, null, now);
        }
        if (failed > 0) {
            jobRepository.incrementCounters(jobId, 0, failed, 0);
        }
        return failed;
    }

    /**
     * 작업 종료.
     *
     * @param jobId     작업 PK
     * @param owner     실행자
     * @param status    종료 상태
     * @param errorCode 오류 코드
     * @param now       현재(KST)
     * @return 종료했으면 true
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean finish(Long jobId, String owner, ManualNotificationJobStatus status, String errorCode,
            LocalDateTime now) {
        return jobRepository.finish(jobId, owner, status, errorCode, now) == 1;
    }

    private void incrementFor(Long jobId, ManualNotificationDeliveryStatus to) {
        int sent = to == ManualNotificationDeliveryStatus.SENT ? 1 : 0;
        int failed = to == ManualNotificationDeliveryStatus.FAILED ? 1 : 0;
        int skipped = to == ManualNotificationDeliveryStatus.SKIPPED ? 1 : 0;
        jobRepository.incrementCounters(jobId, sent, failed, skipped);
    }

    private static String truncate(String message) {
        if (message == null) {
            return null;
        }
        String redacted = ManualNotificationJobConstants.PHONE_IN_TEXT_PATTERN.matcher(message)
            .replaceAll(ManualNotificationJobConstants.PHONE_REDACTION);
        if (redacted.length() <= ManualNotificationJobConstants.ERROR_MESSAGE_MAX_LENGTH) {
            return redacted;
        }
        return redacted.substring(0, ManualNotificationJobConstants.ERROR_MESSAGE_MAX_LENGTH);
    }
}
