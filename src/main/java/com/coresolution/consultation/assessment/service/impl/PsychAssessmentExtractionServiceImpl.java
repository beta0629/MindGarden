package com.coresolution.consultation.assessment.service.impl;

import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import com.coresolution.consultation.assessment.entity.PsychAssessmentExtraction;
import com.coresolution.consultation.assessment.model.PsychAssessmentDocumentStatus;
import com.coresolution.consultation.assessment.model.PsychAssessmentExtractionStatus;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentExtractionRepository;
import com.coresolution.consultation.assessment.service.PsychAssessmentExtractionService;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 템플릿 감지/필드 추출 MVP 구현.
 * - 실제 OCR/템플릿별 좌표 추출은 확장 포인트로 남김
 * - 현재는 "업로드된 문서에 대해 추출 레코드 생성 + NEEDS_REVIEW"까지 제공
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PsychAssessmentExtractionServiceImpl implements PsychAssessmentExtractionService {

    private final PsychAssessmentDocumentRepository documentRepository;
    private final PsychAssessmentExtractionRepository extractionRepository;

    @Override
    public void enqueueExtraction(Long documentId) {
        // tenant 컨텍스트는 호출자에서 이미 설정되어 있어야 함
        processAsync(documentId);
    }

    @Async
    @Transactional
    public void processAsync(Long documentId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        PsychAssessmentDocument doc = documentRepository.findByTenantIdAndId(tenantId, documentId)
                .orElseThrow(() -> new IllegalArgumentException("문서를 찾을 수 없습니다."));

        // 템플릿 감지(placeholder): 추후 병원별 템플릿 매칭로직 연결
        String templateId = null;
        String extractionMode = "GENERIC";
        String ocrEngine = "UNCONFIGURED";

        PsychAssessmentExtraction extraction = PsychAssessmentExtraction.builder()
                .tenantId(tenantId)
                .documentId(doc.getId())
                .templateId(templateId)
                .extractionMode(extractionMode)
                .ocrEngine(ocrEngine)
                .ocrConfidence(null)
                .extractedJson(null)
                .validationJson("{\"warnings\":[\"OCR/템플릿 추출이 아직 구성되지 않았습니다.\"],\"errors\":[]}")
                .status(PsychAssessmentExtractionStatus.NEEDS_REVIEW)
                .build();

        extractionRepository.save(extraction);
        doc.setStatus(PsychAssessmentDocumentStatus.OCR_DONE);
        documentRepository.save(doc);

        log.info("Psych extraction created (MVP): tenantId={}, documentId={}, status={}",
                tenantId, documentId, extraction.getStatus());
    }
}


