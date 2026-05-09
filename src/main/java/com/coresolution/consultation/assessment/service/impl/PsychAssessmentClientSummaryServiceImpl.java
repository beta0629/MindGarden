package com.coresolution.consultation.assessment.service.impl;

import com.coresolution.consultation.assessment.dto.PsychAssessmentClientSummaryDto;
import com.coresolution.consultation.assessment.dto.PsychAssessmentDocumentListItem;
import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import com.coresolution.consultation.assessment.entity.PsychAssessmentReport;
import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentReportRepository;
import com.coresolution.consultation.assessment.service.PsychAssessmentClientSummaryService;
import com.coresolution.consultation.assessment.support.PsychAssessmentMarkdownSections;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * TCI/MMPI 노출: client 연결 + 최신 GENERATED 리포트 + 노출용 요약 비어 있지 않음.
 *
 * @author CoreSolution
 * @since 2026-05-09
 */
@Service
@RequiredArgsConstructor
public class PsychAssessmentClientSummaryServiceImpl implements PsychAssessmentClientSummaryService {

    private static final String REPORT_STATUS_GENERATED = "GENERATED";
    private static final int SUMMARY_MAX_LEN = 300;

    private final PsychAssessmentDocumentRepository documentRepository;
    private final PsychAssessmentReportRepository reportRepository;

    @Override
    @Transactional(readOnly = true)
    public PsychAssessmentClientSummaryDto buildClientSummary(String tenantId, Long clientId) {
        if (!StringUtils.hasText(tenantId) || clientId == null) {
            return PsychAssessmentClientSummaryDto.builder()
                    .hasPsychData(false)
                    .typesPresent(List.of())
                    .documents(List.of())
                    .build();
        }

        List<PsychAssessmentDocument> docs =
                documentRepository.findByTenantIdAndClientIdOrderByCreatedAtDesc(tenantId, clientId);

        List<PsychAssessmentDocumentListItem> documents = new ArrayList<>();
        Set<PsychAssessmentType> typesPresent = new LinkedHashSet<>();

        for (PsychAssessmentDocument d : docs) {
            if (d.getClientId() == null) {
                continue;
            }
            PsychAssessmentType type = d.getAssessmentType();
            if (type != PsychAssessmentType.TCI && type != PsychAssessmentType.MMPI) {
                continue;
            }

            Optional<PsychAssessmentReport> reportOpt = reportRepository
                    .findFirstByTenantIdAndDocumentIdAndStatusOrderByCreatedAtDesc(
                            tenantId, d.getId(), REPORT_STATUS_GENERATED);
            if (reportOpt.isEmpty()) {
                continue;
            }

            String md = reportOpt.get().getReportMarkdown();
            if (!StringUtils.hasText(md == null ? null : md.trim())) {
                continue;
            }

            String reportSummary = md.length() > SUMMARY_MAX_LEN
                    ? md.substring(0, SUMMARY_MAX_LEN).trim() + "…"
                    : md.trim();
            String summarySection = PsychAssessmentMarkdownSections.extractSection(md, "## 요약");
            String recommendationSection = PsychAssessmentMarkdownSections.extractSection(md, "## 권고");
            String keyFindings = PsychAssessmentMarkdownSections.extractSection(md, "## 임상 척도");
            if (keyFindings == null) {
                keyFindings = PsychAssessmentMarkdownSections.extractSection(md, "## 주요 소견");
            }

            PsychAssessmentDocumentListItem item = PsychAssessmentDocumentListItem.builder()
                    .documentId(d.getId())
                    .clientId(d.getClientId())
                    .assessmentType(type)
                    .status(d.getStatus())
                    .originalFilename(d.getOriginalFilename())
                    .fileSize(d.getFileSize())
                    .sha256(d.getSha256())
                    .createdAt(d.getCreatedAt())
                    .reportSummary(reportSummary)
                    .summarySection(summarySection)
                    .recommendationSection(recommendationSection)
                    .keyFindings(keyFindings)
                    .build();

            if (!hasDisplayableSummary(item)) {
                continue;
            }

            documents.add(item);
            typesPresent.add(type);
        }

        return PsychAssessmentClientSummaryDto.builder()
                .hasPsychData(!documents.isEmpty())
                .typesPresent(new ArrayList<>(typesPresent))
                .documents(documents)
                .build();
    }

    private static boolean hasDisplayableSummary(PsychAssessmentDocumentListItem item) {
        return StringUtils.hasText(trimToNull(item.getSummarySection()))
                || StringUtils.hasText(trimToNull(item.getKeyFindings()))
                || StringUtils.hasText(trimToNull(item.getRecommendationSection()))
                || StringUtils.hasText(trimToNull(item.getReportSummary()));
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
