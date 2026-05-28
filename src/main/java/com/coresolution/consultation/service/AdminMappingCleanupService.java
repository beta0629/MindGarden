package com.coresolution.consultation.service;

import java.util.List;
import com.coresolution.consultation.dto.PendingPaymentCleanupResult;
import com.coresolution.consultation.dto.PendingPaymentDirtyMappingPage;

/**
 * 옵션 B R4 — 디러티 PENDING_PAYMENT 매핑 어드민 수동 정리 전용 서비스.
 *
 * <p>합의서: {@code docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md}.
 * 어드민이 매칭 생성 후 일정 시간(기본 24h) 이상 결제가 들어오지 않은 PENDING_PAYMENT 매핑을
 * 조회·정리(취소)·일괄 정리할 수 있도록 지원한다. 정리 시 연관 가예약 스케줄 일괄 CANCELLED
 * 전이 + 선택적 내담자 통지 + 멀티테넌트 격리를 보장한다.</p>
 *
 * @author MindGarden
 * @since 2026-05-28
 */
public interface AdminMappingCleanupService {

    /**
     * 디러티 PENDING_PAYMENT 매핑 페이지 조회.
     *
     * @param ageHours 최소 경과 시간(시간 단위, 기본 24)
     * @param page     0 기반 페이지 번호
     * @param size     페이지 크기 (1~100)
     * @return 페이지 응답 DTO
     */
    PendingPaymentDirtyMappingPage getDirtyPendingPaymentMappings(long ageHours, int page, int size);

    /**
     * 단건 매핑 수동 정리.
     *
     * @param mappingId    대상 매핑 ID
     * @param reason       정리 사유 (10자 이상)
     * @param notifyClient 내담자 통지 발송 여부 (null 이면 true 로 간주)
     * @param actor        정리 수행 어드민 식별자 (감사 추적용)
     * @return 정리 결과
     */
    PendingPaymentCleanupResult cleanupPendingPaymentMapping(
            Long mappingId, String reason, Boolean notifyClient, String actor);

    /**
     * 일괄 매핑 수동 정리 (최대 50건). 각 매핑은 독립 트랜잭션으로 처리되어 부분 실패가
     * 다른 매핑 정리에 영향을 주지 않는다.
     *
     * @param mappingIds   대상 매핑 ID 목록
     * @param reason       정리 사유 (10자 이상)
     * @param notifyClient 내담자 통지 발송 여부
     * @param actor        정리 수행 어드민 식별자
     * @return 정리 결과 (successMappingIds / failedMappingIds 분리)
     */
    PendingPaymentCleanupResult bulkCleanupPendingPaymentMappings(
            List<Long> mappingIds, String reason, Boolean notifyClient, String actor);
}
