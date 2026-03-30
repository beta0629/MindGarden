package com.coresolution.consultation.controller;

import com.coresolution.consultation.entity.*;
import com.coresolution.consultation.service.EmotionAnalysisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 멀티모달 감정 분석 REST API 컨트롤러
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/emotion-analysis")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class EmotionAnalysisController {

    private final EmotionAnalysisService emotionAnalysisService;

    /**
     * 음성 바이오마커 분석
     *
     * POST /api/v1/emotion-analysis/voice/{audioFileId}
     */
    @PostMapping("/voice/{audioFileId}")
    public ResponseEntity<Map<String, Object>> analyzeVoiceEmotion(
            @PathVariable Long audioFileId) {

        log.info("🎤 음성 감정 분석 요청: audioFileId={}", audioFileId);

        try {
            VoiceBiomarker biomarker = emotionAnalysisService.analyzeVoiceBiomarkers(audioFileId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "음성 바이오마커 분석 완료");
            response.put("data", biomarker);
            response.put("isHighRisk", biomarker.isHighRisk());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 음성 감정 분석 실패: {}", e.getMessage(), e);

            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "음성 감정 분석 실패: " + e.getMessage());

            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * 비디오 감정 분석
     *
     * POST /api/v1/emotion-analysis/video/{consultationRecordId}
     */
    @PostMapping("/video/{consultationRecordId}")
    public ResponseEntity<Map<String, Object>> analyzeVideoEmotion(
            @PathVariable Long consultationRecordId,
            @RequestParam("file") MultipartFile videoFile) {

        log.info("📹 비디오 감정 분석 요청: recordId={}, fileSize={}",
            consultationRecordId, videoFile.getSize());

        try {
            // TODO: 비디오 파일 저장
            String videoPath = "./uploads/consultation-videos/" + videoFile.getOriginalFilename();

            VideoEmotionAnalysis analysis = emotionAnalysisService.analyzeVideoEmotion(
                consultationRecordId, videoPath);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "비디오 감정 분석 완료");
            response.put("data", analysis);
            response.put("isNegativeDominant", analysis.isNegativeEmotionDominant());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 비디오 감정 분석 실패: {}", e.getMessage(), e);

            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "비디오 감정 분석 실패: " + e.getMessage());

            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * 텍스트 감정 및 인지 왜곡 분석
     *
     * POST /api/v1/emotion-analysis/text/{consultationRecordId}
     */
    @PostMapping("/text/{consultationRecordId}")
    public ResponseEntity<Map<String, Object>> analyzeTextEmotion(
            @PathVariable Long consultationRecordId,
            @RequestBody Map<String, String> request) {

        String text = request.get("text");
        String sourceType = request.getOrDefault("sourceType", "TRANSCRIPTION");

        log.info("📝 텍스트 감정 분석 요청: recordId={}, sourceType={}, textLength={}",
            consultationRecordId, sourceType, text.length());

        try {
            TextEmotionAnalysis analysis = emotionAnalysisService.analyzeTextEmotion(
                consultationRecordId, text, sourceType);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "텍스트 감정 분석 완료");
            response.put("data", analysis);
            response.put("isVeryNegative", analysis.isVeryNegative());
            response.put("hasHighRiskDistortions", analysis.hasHighRiskDistortions());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 텍스트 감정 분석 실패: {}", e.getMessage(), e);

            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "텍스트 감정 분석 실패: " + e.getMessage());

            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * 멀티모달 통합 리포트 생성
     *
     * POST /api/v1/emotion-analysis/multimodal/{consultationRecordId}
     */
    @PostMapping("/multimodal/{consultationRecordId}")
    public ResponseEntity<Map<String, Object>> generateMultimodalReport(
            @PathVariable Long consultationRecordId) {

        log.info("🔬 멀티모달 통합 리포트 생성 요청: recordId={}", consultationRecordId);

        try {
            MultimodalEmotionReport report = emotionAnalysisService.generateMultimodalReport(
                consultationRecordId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "멀티모달 리포트 생성 완료");
            response.put("report", report);
            response.put("isHighRisk", report.isHighRisk());
            response.put("isComplete", report.isCompleteMultimodal());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 멀티모달 리포트 생성 실패: {}", e.getMessage(), e);

            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "멀티모달 리포트 생성 실패: " + e.getMessage());

            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * 멀티모달 리포트 조회
     *
     * GET /api/v1/emotion-analysis/multimodal/{reportId}
     */
    @GetMapping("/multimodal/{reportId}")
    public ResponseEntity<Map<String, Object>> getMultimodalReport(
            @PathVariable Long reportId) {

        try {
            MultimodalEmotionReport report = emotionAnalysisService.getMultimodalReport(reportId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("report", report);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 멀티모달 리포트 조회 실패: {}", e.getMessage(), e);

            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "리포트를 찾을 수 없습니다");

            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * 감정 변화 추이 조회
     *
     * GET /api/v1/emotion-analysis/trend/{clientId}
     */
    @GetMapping("/trend/{clientId}")
    public ResponseEntity<Map<String, Object>> getEmotionTrend(
            @PathVariable Long clientId,
            @RequestParam(required = false) String emotionType) {

        try {
            List<EmotionTrackingHistory> trend = emotionType != null
                ? emotionAnalysisService.getEmotionTrend(clientId, emotionType)
                : List.of();  // 전체 조회는 추후 구현

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("trend", trend);
            response.put("emotionType", emotionType);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 감정 추이 조회 실패: {}", e.getMessage(), e);

            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "감정 추이 조회 실패");

            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * 감정 변화 추적 기록 생성
     *
     * POST /api/v1/emotion-analysis/track/{clientId}
     */
    @PostMapping("/track/{clientId}")
    public ResponseEntity<Map<String, Object>> trackEmotionChanges(
            @PathVariable Long clientId,
            @RequestParam Long consultationRecordId,
            @RequestParam Integer sessionNumber) {

        try {
            emotionAnalysisService.trackEmotionChanges(clientId, consultationRecordId, sessionNumber);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "감정 변화 추적 완료");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 감정 변화 추적 실패: {}", e.getMessage(), e);

            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "감정 변화 추적 실패");

            return ResponseEntity.internalServerError().body(error);
        }
    }
}
