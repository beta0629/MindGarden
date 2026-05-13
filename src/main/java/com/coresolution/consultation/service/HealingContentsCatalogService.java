package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.HealingContentItemResponse;
import java.util.List;

/**
 * 내담자용 힐링 콘텐츠 목록(Expo {@code GET /api/v1/healing-contents}) 제공.
 *
 * @author MindGarden
 * @since 2026-05-13
 */
public interface HealingContentsCatalogService {

    /**
     * 테넌트·역할에 맞는 힐링 콘텐츠 목록을 반환한다. 일별 DB 행 뒤에 MVP 시드를 이어 붙인다.
     *
     * @param tenantId 테넌트 ID (비어 있으면 안 됨)
     * @return 목록 (빈 DB여도 시드로 비지 않음)
     */
    List<HealingContentItemResponse> listForClientTenant(String tenantId);
}
