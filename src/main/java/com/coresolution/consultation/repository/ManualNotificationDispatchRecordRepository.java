package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import com.coresolution.consultation.constant.ManualNotificationDeliveryStatus;
import com.coresolution.consultation.entity.ManualNotificationDispatchRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 프로바이더 호출 직전 기록 저장소.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@Repository
public interface ManualNotificationDispatchRecordRepository
        extends JpaRepository<ManualNotificationDispatchRecord, Long> {

    /**
     * 작업의 발송 기록(청크·PK 순).
     *
     * @param jobId 작업 PK
     * @return 발송 기록
     */
    List<ManualNotificationDispatchRecord> findByJobIdOrderByChunkIndexAscIdAsc(Long jobId);

    /**
     * DISPATCHING 기록을 결과 상태로 닫는다.
     *
     * @param jobId          작업 PK
     * @param jobRecipientId 확정 수신자 PK
     * @param to             결과 상태
     * @param resultCode     프로바이더 결과 코드
     * @param now            종료 시각(KST)
     * @return 갱신 행 수
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ManualNotificationDispatchRecord d SET d.status = :to, d.providerResultCode = :resultCode,"
        + " d.completedAt = :now WHERE d.jobId = :jobId AND d.jobRecipientId = :jobRecipientId"
        + " AND d.status = com.coresolution.consultation.constant.ManualNotificationDeliveryStatus.DISPATCHING")
    int complete(@Param("jobId") Long jobId, @Param("jobRecipientId") Long jobRecipientId,
            @Param("to") ManualNotificationDeliveryStatus to, @Param("resultCode") String resultCode,
            @Param("now") LocalDateTime now);
}
