package com.coresolution.consultation.controller;

import com.coresolution.consultation.entity.DropoutRiskAssessment;
import com.coresolution.consultation.entity.TreatmentPrediction;
import com.coresolution.consultation.service.PredictionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 예측 기반 경과 모니터링 REST API 컨트롤러
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/predictions")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class PredictionController {

    private final PredictionService predictionService;

    /**
     * 치료 경과 예측
     * POST /api/v1/predictions/treatment-outcome/{clientId}
     */
    @PostMapping("/treatment-outcome/{clientId}")
    public ResponseEntity<Map<String, Object>> predictTreatmentOutcome(@PathVariable Long clientId) {
        log.info("📊 치료 경과 예측 요청: clientId={}", clientId);

        try {
            TreatmentPrediction prediction = predictionService.predictTreatmentOutcome(clientId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "치료 경과 예측 완료");
            response.put("prediction", prediction);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 치료 경과 예측 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "치료 경과 예측 실패: " + e.getMessage()
            ));
        }
    }

    /**
     * 중도 탈락 위험도 평가
     * GET /api/v1/predictions/dropout-risk/{clientId}
     */
    @GetMapping("/dropout-risk/{clientId}")
    public ResponseEntity<Map<String, Object>> assessDropoutRisk(@PathVariable Long clientId) {
        log.info("⚠️ 중도 탈락 위험 평가 요청: clientId={}", clientId);

        try {
            DropoutRiskAssessment assessment = predictionService.assessDropoutRisk(clientId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "중도 탈락 위험 평가 완료");
            response.put("assessment", assessment);
            response.put("needsIntervention", assessment.needsEarlyIntervention());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 중도 탈락 위험 평가 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "중도 탈락 위험 평가 실패: " + e.getMessage()
            ));
        }
    }

    /**
     * 최적 회기 수 추천
     * POST /api/v1/predictions/recommend-sessions/{clientId}
     */
    @PostMapping("/recommend-sessions/{clientId}")
    public ResponseEntity<Map<String, Object>> recommendSessionCount(@PathVariable Long clientId) {
        log.info("💡 최적 회기 수 추천 요청: clientId={}", clientId);

        try {
            Map<String, Object> recommendation = predictionService.recommendSessionCount(clientId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "최적 회기 수 추천 완료");
            response.put("recommendation", recommendation);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 회기 수 추천 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "회기 수 추천 실패: " + e.getMessage()
            ));
        }
    }

    /**
     * 유사 케이스 검색
     * GET /api/v1/predictions/similar-cases/{clientId}
     */
    @GetMapping("/similar-cases/{clientId}")
    public ResponseEntity<Map<String, Object>> findSimilarCases(
            @PathVariable Long clientId,
            @RequestParam(defaultValue = "5") Integer limit) {

        log.info("🔍 유사 케이스 검색 요청: clientId={}, limit={}", clientId, limit);

        try {
            Map<String, Object> result = predictionService.findSimilarCases(clientId, limit);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "유사 케이스 검색 완료");
            response.putAll(result);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 유사 케이스 검색 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "유사 케이스 검색 실패: " + e.getMessage()
            ));
        }
    }
}
