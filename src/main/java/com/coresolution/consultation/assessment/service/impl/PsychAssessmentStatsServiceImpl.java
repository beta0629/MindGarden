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

        long docs = documentRepository.count();
        long extractions = extractionRepository.count();
        long reports = reportRepository.count();

        // MVP: 테넌트 스코프 count는 repository에 tenant 조건 메서드가 추가되면 교체
        Map<String, Object> data = new HashMap<>();
        data.put("tenantId", tenantId);
        data.put("documentsTotal", docs);
        data.put("extractionsTotal", extractions);
        data.put("reportsTotal", reports);
        data.put("status", PsychAssessmentDocumentStatus.class.getSimpleName());
        return data;
    }
}


