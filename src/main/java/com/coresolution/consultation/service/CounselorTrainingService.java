package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.CounselorFeedback;
import com.coresolution.consultation.entity.VirtualClientSession;

import java.util.Map;

/**
 * 상담사 교육 서비스 인터페이스
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
public interface CounselorTrainingService {

    /**
     * 상담 세션 분석 및 피드백 생성
     *
     * @param consultationRecordId 상담 기록 ID
     * @param consultantId 상담사 ID
     * @return 피드백 결과
     */
    CounselorFeedback analyzeSession(Long consultationRecordId, Long consultantId);

    /**
     * 가상 내담자 세션 생성
     *
     * @param consultantId 상담사 ID
     * @param scenarioType 시나리오 유형
     * @param difficultyLevel 난이도
     * @return 생성된 세션
     */
    VirtualClientSession createVirtualClientSession(Long consultantId, String scenarioType, String difficultyLevel);

    /**
     * 가상 내담자와 대화
     *
     * @param sessionId 세션 ID
     * @param counselorMessage 상담사 메시지
     * @return 내담자 응답
     */
    Map<String, Object> sendMessageToVirtualClient(Long sessionId, String counselorMessage);

    /**
     * 시뮬레이션 세션 종료 및 평가
     *
     * @param sessionId 세션 ID
     * @return 평가 결과
     */
    Map<String, Object> completeSession(Long sessionId);

    /**
     * 상담사 피드백 조회
     *
     * @param consultantId 상담사 ID
     * @param limit 조회 개수
     * @return 피드백 목록
     */
    Map<String, Object> getFeedbackHistory(Long consultantId, Integer limit);
}
