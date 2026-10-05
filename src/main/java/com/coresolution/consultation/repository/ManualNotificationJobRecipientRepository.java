package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import com.coresolution.consultation.constant.ManualNotificationDeliveryStatus;
import com.coresolution.consultation.entity.ManualNotificationJobRecipient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 수동 발송 작업 확정 수신자 저장소. 상태 전이는 직전 상태를 조건으로 한 UPDATE 로만 한다.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@Repository
public interface ManualNotificationJobRecipientRepository
        extends JpaRepository<ManualNotificationJobRecipient, Long> {

    /**
     * 작업의 전체 확정 수신자(순번 순).
     *
     * @param jobId 작업 PK
     * @return 수신자 목록
     */
    List<ManualNotificationJobRecipient> findByJobIdOrderBySeqAsc(Long jobId);

    /**
     * 작업의 특정 상태 수신자(순번 순).
     *
     * @param jobId  작업 PK
     * @param status 상태
     * @return 수신자 목록
     */
    List<ManualNotificationJobRecipient> findByJobIdAndStatusOrderBySeqAsc(Long jobId,
            ManualNotificationDeliveryStatus status);

    /**
     * 순번 구간 안의 특정 상태 수신자(청크 단위 조회).
     *
     * @param jobId   작업 PK
     * @param status  상태
     * @param seqFrom 시작 순번(포함)
     * @param seqTo   끝 순번(포함)
     * @return 수신자 목록
     */
    List<ManualNotificationJobRecipient> findByJobIdAndStatusAndSeqBetweenOrderBySeqAsc(Long jobId,
            ManualNotificationDeliveryStatus status, Integer seqFrom, Integer seqTo);

    /**
     * PENDING → DISPATCHING. 1 이면 이 실행자가 프로바이더를 부를 권한을 얻었다.
     *
     * @param id         수신자 PK
     * @param chunkIndex 청크 순번
     * @param attemptNo  작업 실행 시도 번호
     * @return 갱신 행 수
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ManualNotificationJobRecipient r SET r.status = com.coresolution.consultation.constant"
        + ".ManualNotificationDeliveryStatus.DISPATCHING, r.chunkIndex = :chunkIndex, r.attemptNo = :attemptNo"
        + " WHERE r.id = :id AND r.status = com.coresolution.consultation.constant"
        + ".ManualNotificationDeliveryStatus.PENDING")
    int markDispatching(@Param("id") Long id, @Param("chunkIndex") int chunkIndex,
            @Param("attemptNo") int attemptNo);

    /**
     * 직전 상태가 {@code from} 인 수신자를 종료 상태로 바꾼다.
     *
     * @param id           수신자 PK
     * @param from         직전 상태
     * @param to           종료 상태
     * @param resultCode   프로바이더 결과 코드
     * @param errorCode    오류 코드
     * @param errorMessage 오류 메시지(마스킹·절단된 값)
     * @param auditLogId   감사로그 PK
     * @param now          종료 시각(KST)
     * @return 갱신 행 수
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ManualNotificationJobRecipient r SET r.status = :to, r.providerResultCode = :resultCode,"
        + " r.errorCode = :errorCode, r.errorMessage = :errorMessage,"
        + " r.auditLogId = COALESCE(:auditLogId, r.auditLogId), r.completedAt = :now"
        + " WHERE r.id = :id AND r.status = :from")
    int complete(@Param("id") Long id, @Param("from") ManualNotificationDeliveryStatus from,
            @Param("to") ManualNotificationDeliveryStatus to, @Param("resultCode") String resultCode,
            @Param("errorCode") String errorCode, @Param("errorMessage") String errorMessage,
            @Param("auditLogId") Long auditLogId, @Param("now") LocalDateTime now);
}
