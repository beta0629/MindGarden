package com.coresolution.consultation.assessment.service;

public interface PsychAssessmentExtractionService {
    /**
     * 문서 추출을 비동기로 예약한다. 활성 스프링 트랜잭션이 있으면 커밋 완료 후 실행되며,
     * 그렇지 않으면(단위 테스트 등) 즉시 비동기 작업이 시작된다.
     *
     * @param documentId 대상 문서 ID
     */
    void enqueueExtraction(Long documentId);

    /**
     * 동기로 추출 레코드를 생성합니다. 이미 추출이 있으면 아무 작업도 하지 않습니다.
     * (비동기 실패로 추출이 없는 기존 문서에 대해 리포트 생성 시 사용)
     */
    void ensureExtractionSync(String tenantId, Long documentId);
}


