package com.coresolution.consultation.assessment.service.impl;

import com.coresolution.consultation.assessment.model.PsychAssessmentDocumentStatus;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentExtractionRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentReportRepository;
import com.coresolution.consultation.assessment.service.PsychAssessmentStatsService;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PsychAssessmentStatsServiceImpl implements PsychAssessmentStatsService {

    private final PsychAssessmentDocumentRepository documentRepository;
    private final PsychAssessmentExtractionRepository extractionRepository;
    private final PsychAssessmentReportRepository reportRepository;

    @Override
    public Map<String, Object> getTenantStats() {
        String tenantId = TenantContextHolder.getRequiredTenantId();

        long docs = documentRepository.countByTenantId(tenantId);
        long extractions = extractionRepository.countByTenantId(tenantId);
        long reports = reportRepository.countByTenantId(tenantId);
        Map<String, Object> data = new HashMap<>();
        data.put("tenantId", tenantId);
        data.put("documentsTotal", docs);
        data.put("extractionsTotal", extractions);
        data.put("reportsTotal", reports);
        data.put("status", PsychAssessmentDocumentStatus.class.getSimpleName());
        return data;
    }
}


