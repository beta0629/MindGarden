package com.coresolution.consultation.assessment.service;

import com.coresolution.consultation.assessment.dto.PsychAssessmentUploadResponse;
import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import org.springframework.web.multipart.MultipartFile;

public interface PsychAssessmentIngestService {
    PsychAssessmentUploadResponse uploadScannedPdf(PsychAssessmentType type, MultipartFile file, Long clientId, Long createdBy);
}


