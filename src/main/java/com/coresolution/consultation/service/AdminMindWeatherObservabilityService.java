package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.admin.wellness.MindWeatherAdminCardItemResponse;
import com.coresolution.consultation.dto.admin.wellness.MindWeatherAdminSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * BW-6 마음 날씨 어드민 관측(읽기 전용).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
public interface AdminMindWeatherObservabilityService {

    /**
     * 테넌트별 카드 목록(페이징).
     *
     * @param tenantId 테넌트 ID
     * @param pageable 페이지·정렬
     * @return 페이지
     */
    Page<MindWeatherAdminCardItemResponse> listCards(String tenantId, Pageable pageable);

    /**
     * 테넌트별 요약 지표.
     *
     * @param tenantId 테넌트 ID
     * @return 요약
     */
    MindWeatherAdminSummaryResponse summarize(String tenantId);
}
