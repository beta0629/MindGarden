package com.coresolution.consultation.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 옵션 B R4 — 디러티 PENDING_PAYMENT 매핑 정리 결과 응답 DTO.
 *
 * <p>합의서: {@code docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md}.
 * 단건 정리 시 {@code mappingId} 가 1건만 채워지고, 일괄 정리 시
 * {@code successMappingIds} / {@code failedMappingIds} 로 분리되어 채워진다.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingPaymentCleanupResult {

    /** 단건 정리 성공 시 정리된 매핑 ID. */
    private Long mappingId;

    /** 일괄 정리 성공 매핑 ID 목록. */
    private List<Long> successMappingIds;

    /** 일괄 정리 실패 매핑 ID 목록 (상태 위반 / 미존재 등). */
    private List<Long> failedMappingIds;

    /** 함께 CANCELLED로 전환된 가예약 스케줄 수 (TENTATIVE_PENDING_PAYMENT 등). */
    private int cancelledScheduleCount;

    /** 내담자 알림을 발송 시도한 횟수. */
    private int notifiedClientCount;

    private String message;
}
