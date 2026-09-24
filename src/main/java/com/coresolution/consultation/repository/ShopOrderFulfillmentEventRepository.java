package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.ShopOrderFulfillmentEvent;
import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 주문 이행 이벤트 저장소.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Repository
public interface ShopOrderFulfillmentEventRepository extends BaseRepository<ShopOrderFulfillmentEvent, Long> {

    /**
     * 주문 단위 이행 멱등 여부 (이미 이벤트가 있으면 {@code orderPublicId:FULFILL} 재실행 스킵).
     *
     * @param tenantId       테넌트 ID
     * @param orderPublicId  주문 공개 ID
     * @return 존재 여부
     */
    boolean existsByTenantIdAndOrderPublicIdAndIsDeletedFalse(String tenantId, String orderPublicId);

    /**
     * 주문별 이행 이벤트 목록 (SKU 코드 오름차순).
     *
     * @param tenantId       테넌트 ID
     * @param orderPublicId  주문 공개 ID
     * @return 이행 이벤트 목록
     */
    List<ShopOrderFulfillmentEvent> findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
            String tenantId, String orderPublicId);

    /**
     * 상담 회기 grant 원복 rem-restored claim (COMPLETED 또는 INCOME_SYNC FAILED만).
     *
     * <p>조건부 UPDATE — 승리(1) 시에만 rem 차감. 동시 Admin+webhook reverse 시 패자(0)는 rem 금지.</p>
     *
     * @param tenantId              테넌트 ID
     * @param orderPublicId         주문 공개 ID
     * @param skuCode               SKU 코드
     * @param reversedStatus        {@code REVERSED}
     * @param remRestoredMessage    {@code CONSULTATION_SESSIONS_REVERSED_REM_RESTORED}
     * @param completedStatus       {@code COMPLETED}
     * @param failedStatus          {@code FAILED}
     * @param incomeSyncFailedPrefix {@code CONSULTATION_INCOME_SYNC_FAILED} (startsWith)
     * @return 갱신 행 수 (0 또는 1)
     */
    /**
     * 주의: {@code e.version} 을 수동 +1 하지 않는다.
     * clearAutomatically 후 호출측이 동일 엔티티를 {@code save} 하면
     * 수동 version bump 는 {@code OptimisticLockException} 으로
     * PG 취소 이후 Clinic(회기·ERP·REFUNDED) 전체 롤백을 유발한다.
     * 동시성은 status/message WHERE 조건으로 선점한다.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ShopOrderFulfillmentEvent e"
            + " SET e.status = :reversedStatus,"
            + " e.message = :remRestoredMessage"
            + " WHERE e.tenantId = :tenantId"
            + " AND e.orderPublicId = :orderPublicId"
            + " AND e.skuCode = :skuCode"
            + " AND (e.isDeleted = false OR e.isDeleted IS NULL)"
            + " AND ("
            + "   e.status = :completedStatus"
            + "   OR (e.status = :failedStatus"
            + "       AND e.message IS NOT NULL"
            + "       AND e.message LIKE CONCAT(:incomeSyncFailedPrefix, '%'))"
            + " )"
            + " AND (e.message IS NULL"
            + "      OR e.message NOT LIKE CONCAT('%', :remRestoredMessage, '%'))")
    int claimRemRestoredForGrantedConsultationSessions(
            @Param("tenantId") String tenantId,
            @Param("orderPublicId") String orderPublicId,
            @Param("skuCode") String skuCode,
            @Param("reversedStatus") String reversedStatus,
            @Param("remRestoredMessage") String remRestoredMessage,
            @Param("completedStatus") String completedStatus,
            @Param("failedStatus") String failedStatus,
            @Param("incomeSyncFailedPrefix") String incomeSyncFailedPrefix);

    /**
     * rem-restored claim 이 아직 없는 이행 행을 REVERSED+REM_RESTORED 로 선점.
     *
     * <p>residual 벨트용 — 상태 무관, message 에 REM_RESTORED 미포함이면 1행 갱신.</p>
     *
     * @param tenantId           테넌트 ID
     * @param orderPublicId      주문 공개 ID
     * @param skuCode            SKU 코드
     * @param reversedStatus     {@code REVERSED}
     * @param remRestoredMessage {@code CONSULTATION_SESSIONS_REVERSED_REM_RESTORED}
     * @return 갱신 행 수 (0 또는 1)
     */
    /**
     * 주의: {@code e.version} 수동 +1 금지 — {@link #claimRemRestoredForGrantedConsultationSessions} 와 동일.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ShopOrderFulfillmentEvent e"
            + " SET e.status = :reversedStatus,"
            + " e.message = :remRestoredMessage"
            + " WHERE e.tenantId = :tenantId"
            + " AND e.orderPublicId = :orderPublicId"
            + " AND e.skuCode = :skuCode"
            + " AND (e.isDeleted = false OR e.isDeleted IS NULL)"
            + " AND (e.message IS NULL"
            + "      OR e.message NOT LIKE CONCAT('%', :remRestoredMessage, '%'))")
    int claimRemRestoredIfMessageAbsent(
            @Param("tenantId") String tenantId,
            @Param("orderPublicId") String orderPublicId,
            @Param("skuCode") String skuCode,
            @Param("reversedStatus") String reversedStatus,
            @Param("remRestoredMessage") String remRestoredMessage);
}
