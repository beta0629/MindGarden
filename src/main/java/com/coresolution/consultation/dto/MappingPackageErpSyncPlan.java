package com.coresolution.consultation.dto;

/**
 * 매칭 패키지 금액·회기 변경 시 UpdateMappingInfo 호출 인자.
 *
 * @param mappingId 매칭 ID
 * @param packageName 패키지명
 * @param packagePrice 패키지 금액
 * @param totalSessions 총 회기
 * @param updatedBy 수정자
 * @author CoreSolution
 * @since 2026-10-05
 */
public record MappingPackageErpSyncPlan(Long mappingId, String packageName, double packagePrice,
        int totalSessions, String updatedBy) {
}
