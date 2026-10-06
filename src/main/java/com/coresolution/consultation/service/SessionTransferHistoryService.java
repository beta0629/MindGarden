package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.SessionTransferHistoryResponse;

/**
 * 회기 승계·이관 이력 조회 (표시 전용, 이벤트 미생성).
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
public interface SessionTransferHistoryService {

    /**
     * 내담자가 소스이거나 타깃인 승계·이관 이력을 최신순으로 반환한다.
     *
     * @param clientId 내담자 ID
     * @return 이력 목록(없으면 빈 목록)
     * @throws IllegalArgumentException clientId null
     * @throws IllegalStateException tenantId 미설정
     */
    SessionTransferHistoryResponse findByClientId(Long clientId);

    /**
     * 매핑이 소스이거나 타깃인 승계·이관 이력을 최신순으로 반환한다.
     *
     * @param mappingId 매핑 ID
     * @return 이력 목록(없으면 빈 목록)
     * @throws IllegalArgumentException mappingId null
     * @throws IllegalStateException tenantId 미설정
     * @throws com.coresolution.consultation.exception.EntityNotFoundException 테넌트 매핑 없음
     */
    SessionTransferHistoryResponse findByMappingId(Long mappingId);
}
