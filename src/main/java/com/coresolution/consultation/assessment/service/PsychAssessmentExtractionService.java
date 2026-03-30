package com.coresolution.consultation.assessment.service;

public interface PsychAssessmentExtractionService {
    void enqueueExtraction(Long documentId);

    /**
     * 동기로 추출 레코드를 생성합니다. 이미 추출이 있으면 아무 작업도 하지 않습니다.
     * (비동기 실패로 추출이 없는 기존 문서에 대해 리포트 생성 시 사용)
     */
    void ensureExtractionSync(String tenantId, Long documentId);
}


