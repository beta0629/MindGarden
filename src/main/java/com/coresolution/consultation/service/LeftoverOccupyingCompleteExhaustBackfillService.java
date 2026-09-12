package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.LeftoverOccupyingCompleteExhaustBackfillResult;

/**
 * 이미 COMPLETED된 leftover occupying rem 잔존 백필.
 *
 * @author MindGarden
 * @since 2026-09-12
 */
public interface LeftoverOccupyingCompleteExhaustBackfillService {

    /**
     * 한 테넌트의 leftover occupying 완료 rem을 백필한다.
     *
     * @param tenantId 테넌트 ID
     * @return 집계
     * @throws IllegalStateException tenantId가 없거나 컨텍스트와 불일치
     */
    LeftoverOccupyingCompleteExhaustBackfillResult backfillTenant(String tenantId);

    /**
     * 활성 테넌트 전부에 대해 백필한다. 테넌트별 실패는 건너뛴다.
     *
     * @return 전 테넌트 집계
     */
    LeftoverOccupyingCompleteExhaustBackfillResult backfillAllActiveTenants();
}
