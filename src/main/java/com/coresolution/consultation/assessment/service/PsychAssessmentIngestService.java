package com.coresolution.consultation.assessment.service;

import com.coresolution.consultation.assessment.dto.PsychAssessmentUploadResponse;
import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PsychAssessmentIngestService {
    PsychAssessmentUploadResponse uploadScannedPdf(PsychAssessmentType type, MultipartFile file, Long clientId, Long createdBy);

    /**
     * 다중 이미지(JPG, PNG) 업로드. 이미지 N장을 각각 저장 후 경로 목록 JSON으로 문서 1건 생성.
     *
     * @param type      검사 유형
     * @param files     이미지 파일 목록 (순서 유지)
     * @param clientId  내담자 ID (선택)
     * @param createdBy 등록자 ID (선택)
     * @return 업로드 응답
     */
    PsychAssessmentUploadResponse uploadScannedImages(PsychAssessmentType type, List<MultipartFile> files,
            Long clientId, Long createdBy);
}


