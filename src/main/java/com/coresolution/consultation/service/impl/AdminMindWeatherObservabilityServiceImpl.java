package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import com.coresolution.consultation.constant.AdminWellnessObservabilityConstants;
import com.coresolution.consultation.dto.admin.wellness.MindWeatherAdminCardItemResponse;
import com.coresolution.consultation.dto.admin.wellness.MindWeatherAdminSummaryResponse;
import com.coresolution.consultation.entity.MindWeatherCard;
import com.coresolution.consultation.repository.MindWeatherCardRepository;
import com.coresolution.consultation.service.AdminMindWeatherObservabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * BW-6 마음 날씨 어드민 관측 구현.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Service
@RequiredArgsConstructor
public class AdminMindWeatherObservabilityServiceImpl implements AdminMindWeatherObservabilityService {

    private final MindWeatherCardRepository mindWeatherCardRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<MindWeatherAdminCardItemResponse> listCards(String tenantId, Pageable pageable) {
        String tid = tenantId.trim();
        return mindWeatherCardRepository.findAdminPageByTenantId(tid, pageable).map(this::toItem);
    }

    @Override
    @Transactional(readOnly = true)
    public MindWeatherAdminSummaryResponse summarize(String tenantId) {
        String tid = tenantId.trim();
        long total = mindWeatherCardRepository.countByTenantId(tid);
        long share = mindWeatherCardRepository.countActiveShareSummaryByTenantId(tid);
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        long last24h = mindWeatherCardRepository.countActiveCreatedSince(tid, since);
        LocalDateTime newest = mindWeatherCardRepository.findMaxCreatedAtByTenantId(tid);
        return new MindWeatherAdminSummaryResponse(total, share, last24h, newest);
    }

    private MindWeatherAdminCardItemResponse toItem(MindWeatherCard c) {
        Long consultantId = c.getShareConsultant() != null ? c.getShareConsultant().getId() : null;
        return new MindWeatherAdminCardItemResponse(
                c.getId(),
                c.getClient() != null ? c.getClient().getId() : null,
                c.getSource(),
                c.getSourceRefId(),
                preview(c.getSummary()),
                c.getTone(),
                c.isShareSummary(),
                c.isShareOriginal(),
                consultantId,
                c.getCreatedAt());
    }

    private static String preview(String summary) {
        if (summary == null) {
            return "";
        }
        String t = summary.trim();
        int max = AdminWellnessObservabilityConstants.MIND_WEATHER_SUMMARY_PREVIEW_MAX_CHARS;
        if (t.length() <= max) {
            return t;
        }
        return t.substring(0, max) + "…";
    }
}
