package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.DropoutRiskAssessment;
import com.coresolution.consultation.entity.TreatmentPrediction;

import java.util.Map;

/**
 * 예측 기반 경과 모니터링 서비스 인터페이스
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
public interface PredictionService {

    /**
     * 치료 경과 예측
     *
     * @param clientId 내담자 ID
     * @return 치료 경과 예측 결과
     */
    TreatmentPrediction predictTreatmentOutcome(Long clientId);

    /**
     * 중도 탈락 위험도 평가
     *
     * @param clientId 내담자 ID
     * @return 탈락 위험도 평가 결과
     */
    DropoutRiskAssessment assessDropoutRisk(Long clientId);

    /**
     * 최적 상담 회기 수 추천
     *
     * @param clientId 내담자 ID
     * @return 권장 회기 수 정보
     */
    Map<String, Object> recommendSessionCount(Long clientId);

    /**
     * 유사 케이스 검색
     *
     * @param clientId 내담자 ID
     * @param limit 반환할 케이스 수
     * @return 유사 케이스 목록
     */
    Map<String, Object> findSimilarCases(Long clientId, Integer limit);
}
