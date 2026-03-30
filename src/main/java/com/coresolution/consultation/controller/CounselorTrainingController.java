package com.coresolution.consultation.controller;

import com.coresolution.consultation.entity.CounselorFeedback;
import com.coresolution.consultation.entity.VirtualClientSession;
import com.coresolution.consultation.service.CounselorTrainingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 상담사 교육 REST API 컨트롤러
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/training")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class CounselorTrainingController {

    private final CounselorTrainingService trainingService;

    /**
     * 상담 세션 분석 및 피드백
     * POST /api/v1/training/analyze-session/{consultationRecordId}
     */
    @PostMapping("/analyze-session/{consultationRecordId}")
    public ResponseEntity<Map<String, Object>> analyzeSession(
            @PathVariable Long consultationRecordId,
            @RequestParam Long consultantId) {

        log.info("📊 상담 세션 분석 요청: recordId={}, consultantId={}",
            consultationRecordId, consultantId);

        try {
            CounselorFeedback feedback = trainingService.analyzeSession(
                consultationRecordId, consultantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "상담 세션 분석 완료");
            response.put("feedback", feedback);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 상담 세션 분석 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "상담 세션 분석 실패"
            ));
        }
    }

    /**
     * 가상 내담자 세션 생성
     * POST /api/v1/training/virtual-client/create
     */
    @PostMapping("/virtual-client/create")
    public ResponseEntity<Map<String, Object>> createVirtualClientSession(
            @RequestBody Map<String, Object> request) {

        Long consultantId = ((Number) request.get("consultantId")).longValue();
        String scenarioType = (String) request.get("scenarioType");
        String difficultyLevel = (String) request.getOrDefault("difficultyLevel", "MEDIUM");

        log.info("🤖 가상 내담자 세션 생성 요청: consultantId={}, scenario={}",
            consultantId, scenarioType);

        try {
            VirtualClientSession session = trainingService.createVirtualClientSession(
                consultantId, scenarioType, difficultyLevel);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "가상 내담자 세션 생성 완료");
            response.put("session", session);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 가상 내담자 세션 생성 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "가상 내담자 세션 생성 실패"
            ));
        }
    }

    /**
     * 가상 내담자와 대화
     * POST /api/v1/training/virtual-client/{sessionId}/message
     */
    @PostMapping("/virtual-client/{sessionId}/message")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @PathVariable Long sessionId,
            @RequestBody Map<String, String> request) {

        String counselorMessage = request.get("message");

        log.info("💬 가상 내담자 메시지 전송: sessionId={}", sessionId);

        try {
            Map<String, Object> result = trainingService.sendMessageToVirtualClient(
                sessionId, counselorMessage);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "메시지 전송 완료");
            response.putAll(result);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 메시지 전송 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "메시지 전송 실패"
            ));
        }
    }

    /**
     * 시뮬레이션 세션 종료
     * POST /api/v1/training/virtual-client/{sessionId}/complete
     */
    @PostMapping("/virtual-client/{sessionId}/complete")
    public ResponseEntity<Map<String, Object>> completeSession(
            @PathVariable Long sessionId) {

        log.info("✅ 시뮬레이션 세션 종료: sessionId={}", sessionId);

        try {
            Map<String, Object> result = trainingService.completeSession(sessionId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "세션 종료 및 평가 완료");
            response.putAll(result);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 세션 종료 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "세션 종료 실패"
            ));
        }
    }

    /**
     * 상담사 피드백 이력 조회
     * GET /api/v1/training/feedback/{consultantId}
     */
    @GetMapping("/feedback/{consultantId}")
    public ResponseEntity<Map<String, Object>> getFeedbackHistory(
            @PathVariable Long consultantId,
            @RequestParam(defaultValue = "10") Integer limit) {

        try {
            Map<String, Object> result = trainingService.getFeedbackHistory(consultantId, limit);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.putAll(result);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 피드백 이력 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "피드백 이력 조회 실패"
            ));
        }
    }
}
