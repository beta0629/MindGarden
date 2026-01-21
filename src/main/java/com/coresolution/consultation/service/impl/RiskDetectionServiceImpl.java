package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.coresolution.consultation.entity.AudioTranscription;
import com.coresolution.consultation.entity.ConsultationRecordAlert;
import com.coresolution.consultation.entity.ConsultationRecordAlert.AlertStatus;
import com.coresolution.consultation.entity.ConsultationRecordAlert.AlertType;
import com.coresolution.consultation.repository.ConsultationAudioFileRepository;
import com.coresolution.consultation.repository.ConsultationRecordAlertRepository;
import com.coresolution.consultation.service.RiskDetectionService;
import com.coresolution.core.service.ai.AIModelProvider;
import com.coresolution.core.service.ai.AIModelProvider.AIResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 위험 징후 자동 감지 서비스 구현체 키워드 기반 + AI 문맥 분석을 통한 위험도 평가
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RiskDetectionServiceImpl implements RiskDetectionService {

    private final AIModelProvider geminiModelProvider;
    private final ConsultationRecordAlertRepository alertRepository;
    private final ConsultationAudioFileRepository audioFileRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 위험 키워드 정의
    private static final List<String> CRITICAL_KEYWORDS =
            Arrays.asList("자살", "죽고 싶다", "자해", "목숨", "끝내고 싶다", "죽음", "사라지고 싶다");

    private static final List<String> HIGH_KEYWORDS =
            Arrays.asList("우울", "불안", "공황", "폭력", "때리다", "해치다", "상처", "절망");

    private static final List<String> MEDIUM_KEYWORDS =
            Arrays.asList("힘들다", "괴롭다", "외롭다", "무기력", "의욕 없다", "슬프다");

    @Override
    @Transactional
    public ConsultationRecordAlert analyzeTranscriptionForRisks(AudioTranscription transcription) {
        log.info("🔍 위험 징후 분석 시작: transcriptionId={}", transcription.getId());

        try {
            String text = transcription.getTranscriptionText();

            if (text == null || text.trim().isEmpty()) {
                log.info("전사 텍스트가 비어있어 분석을 건너뜁니다.");
                return null;
            }

            // 1. 키워드 기반 검사
            List<String> detectedKeywords = detectRiskKeywords(text);

            if (detectedKeywords.isEmpty()) {
                log.info("위험 키워드가 발견되지 않았습니다.");
                return null;
            }

            log.warn("⚠️ 위험 키워드 발견: {}", detectedKeywords);

            // 2. AI를 통한 문맥 기반 분석
            RiskAnalysisResult aiAnalysis = analyzeRiskWithAI(text, detectedKeywords);

            // 3. 위험도가 있으면 알림 생성
            if (aiAnalysis.hasRisk() && aiAnalysis.getRiskScore() >= 0.3) {
                // 음성 파일에서 상담 기록 ID 조회
                Long consultationRecordId =
                        audioFileRepository.findById(transcription.getAudioFileId())
                                .map(af -> af.getConsultationRecordId()).orElse(null);

                if (consultationRecordId == null) {
                    log.warn("상담 기록 ID를 찾을 수 없습니다. 알림 생성을 건너뜁니다.");
                    return null;
                }

                ConsultationRecordAlert alert = createRiskAlert(consultationRecordId, aiAnalysis);

                // 고위험일 경우 즉시 알림 발송
                if (aiAnalysis.isHighRisk() || aiAnalysis.isCritical()) {
                    sendHighRiskAlert(alert);
                }

                return alert;
            }

            log.info("위험도가 낮아 알림을 생성하지 않습니다. riskScore={}", aiAnalysis.getRiskScore());
            return null;

        } catch (Exception e) {
            log.error("❌ 위험 징후 분석 실패: transcriptionId={}, error={}", transcription.getId(),
                    e.getMessage(), e);
            return null;
        }
    }

    @Override
    public List<String> detectRiskKeywords(String text) {
        if (text == null || text.isEmpty()) {
            return new ArrayList<>();
        }

        List<String> detected = new ArrayList<>();
        String lowerText = text.toLowerCase();

        // CRITICAL 키워드 검사
        for (String keyword : CRITICAL_KEYWORDS) {
            if (lowerText.contains(keyword.toLowerCase())) {
                detected.add(keyword + " (CRITICAL)");
            }
        }

        // HIGH 키워드 검사
        for (String keyword : HIGH_KEYWORDS) {
            if (lowerText.contains(keyword.toLowerCase())) {
                detected.add(keyword + " (HIGH)");
            }
        }

        // MEDIUM 키워드 검사 (중복 방지)
        for (String keyword : MEDIUM_KEYWORDS) {
            if (lowerText.contains(keyword.toLowerCase())
                    && detected.stream().noneMatch(d -> d.startsWith(keyword))) {
                detected.add(keyword + " (MEDIUM)");
            }
        }

        return detected;
    }

    @Override
    public RiskAnalysisResult analyzeRiskWithAI(String text, List<String> detectedKeywords) {
        try {
            log.info("🤖 AI 위험도 분석 시작: 키워드 수={}", detectedKeywords.size());

            String systemPrompt = getRiskAnalysisSystemPrompt();
            String userPrompt = buildRiskAnalysisPrompt(text, detectedKeywords);

            AIResponse aiResponse =
                    geminiModelProvider.analyze(systemPrompt, userPrompt, 1000, 0.2); // 낮은
                                                                                      // temperature
                                                                                      // (보수적 분석)

            if (!aiResponse.isSuccess()) {
                log.error("AI 위험도 분석 실패: {}", aiResponse.getErrorMessage());
                // 폴백: 키워드 기반으로만 판단
                return createFallbackRiskAnalysis(detectedKeywords);
            }

            // JSON 응답 파싱
            return parseRiskAnalysisResponse(aiResponse.getContent(), detectedKeywords);

        } catch (Exception e) {
            log.error("❌ AI 위험도 분석 중 오류: {}", e.getMessage(), e);
            return createFallbackRiskAnalysis(detectedKeywords);
        }
    }

    @Override
    @Transactional
    public void sendHighRiskAlert(ConsultationRecordAlert alert) {
        try {
            log.warn("🚨 고위험 알림 발송: alertId={}, status={}", alert.getId(), alert.getStatus());

            log.info("📧 고위험 알림 내용: consultantId={}, clientId={}, date={}, type={}",
                    alert.getConsultantId(), alert.getClientId(), alert.getSessionDate(),
                    alert.getAlertType());

            // TODO: 관리자 목록을 조회하여 각각에게 이메일 발송
            // 현재는 로그만 남김 (추후 관리자 알림 기능 통합)
            log.info("✅ 고위험 알림 준비 완료 (실제 발송은 관리자 알림 기능 통합 후)");

        } catch (Exception e) {
            log.error("❌ 고위험 알림 발송 실패: {}", e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public ConsultationRecordAlert createRiskAlert(Long consultationRecordId,
            RiskAnalysisResult riskAnalysis) {
        try {
            // 음성 파일에서 상담사/내담자 정보 조회
            var audioFile = audioFileRepository
                    .findByConsultationRecordIdAndIsDeletedFalse(consultationRecordId).stream()
                    .findFirst().orElse(null);

            if (audioFile == null) {
                throw new IllegalStateException("음성 파일을 찾을 수 없습니다.");
            }

            // 알림 생성
            ConsultationRecordAlert alert = ConsultationRecordAlert.builder()
                    .scheduleId(audioFile.getConsultationId()) // consultation_id를
                                                               // schedule_id로
                                                               // 사용
                    .consultantId(0L) // TODO: 실제 상담사 ID 조회 필요
                    .clientId(0L) // TODO: 실제 내담자 ID 조회 필요
                    .sessionDate(LocalDate.now()).sessionTime(LocalTime.now()).title("AI 위험 징후 감지")
                    .alertType(AlertType.RISK_DETECTED).status(AlertStatus.PENDING)
                    .message("AI가 위험 징후를 감지했습니다: "
                            + String.join(", ", riskAnalysis.getDetectedKeywords()))
                    .tenantId(audioFile.getTenantId()).build();

            alert = alertRepository.save(alert);

            log.info("✅ 위험 알림 생성 완료: alertId={}, priorityScore={}", alert.getId(),
                    alert.getPriorityScore());

            return alert;

        } catch (Exception e) {
            log.error("❌ 위험 알림 생성 실패: {}", e.getMessage(), e);
            throw new RuntimeException("위험 알림 생성 실패", e);
        }
    }

    // ==================== Private Helper Methods ====================

    /**
     * 위험 분석 전문가 시스템 프롬프트
     */
    private String getRiskAnalysisSystemPrompt() {
        return "당신은 자살 예방 및 위기 개입 전문가입니다. " + "상담 대화 내용에서 자살, 자해, 폭력 등의 위험 징후를 정확하게 평가하며, "
                + "문맥을 고려하여 진짜 위험과 단순 표현을 구분합니다. "
                + "내담자의 안전을 최우선으로 하되, 과도한 오탐을 피하기 위해 신중하게 판단합니다.";
    }

    /**
     * 위험 분석 프롬프트 구성
     */
    private String buildRiskAnalysisPrompt(String text, List<String> detectedKeywords) {
        return String.format("다음 상담 대화에서 위험 키워드가 감지되었습니다. 문맥을 분석하여 실제 위험도를 평가해주세요.\n\n"
                + "[감지된 키워드]\n%s\n\n" + "[상담 대화 내용]\n%s\n\n" + "[분석 요청]\n"
                + "1. 실제 위험이 있는지 판단 (true/false)\n" + "2. 위험도 수준 평가:\n"
                + "   - CRITICAL: 즉각적인 개입 필요 (자살 계획, 구체적 자해 의도)\n"
                + "   - HIGH: 높은 주의 필요 (자살 생각, 자해 충동)\n" + "   - MEDIUM: 모니터링 필요 (우울/불안 증상)\n"
                + "   - LOW: 일반적 표현 (비유적 표현)\n" + "3. 위험 점수 (0.0-1.0)\n" + "4. 위험 분석 (200자 이내)\n"
                + "5. 권장 조치사항 (150자 이내)\n\n" + "⚠️ 주의사항:\n" + "- 단순 비유나 일상적 표현은 LOW로 판단\n"
                + "- 구체적 계획이나 반복적 언급은 HIGH 이상\n" + "- 과거형('~했었다')보다 현재형('~하고 싶다')이 더 위험\n\n"
                + "응답 형식 (JSON):\n" + "{\n" + "  \"hasRisk\": true/false,\n"
                + "  \"severity\": \"CRITICAL/HIGH/MEDIUM/LOW\",\n" + "  \"riskScore\": 0.0-1.0,\n"
                + "  \"analysis\": \"위험 분석 텍스트\",\n" + "  \"recommendation\": \"권장 조치사항\"\n" + "}",
                String.join(", ", detectedKeywords),
                text.length() > 2000 ? text.substring(0, 2000) + "..." : text);
    }

    /**
     * AI 위험 분석 응답 파싱
     */
    private RiskAnalysisResult parseRiskAnalysisResponse(String jsonResponse,
            List<String> detectedKeywords) {
        try {
            String cleanJson = cleanJsonResponse(jsonResponse);
            JsonNode root = objectMapper.readTree(cleanJson);

            boolean hasRisk = root.path("hasRisk").asBoolean(false);
            String severity = root.path("severity").asText("LOW");
            double riskScore = root.path("riskScore").asDouble(0.0);
            String analysis = root.path("analysis").asText("");
            String recommendation = root.path("recommendation").asText("");

            log.info("✅ AI 위험 분석 완료: hasRisk={}, severity={}, score={}", hasRisk, severity,
                    riskScore);

            return new RiskAnalysisResult(hasRisk, severity, riskScore, detectedKeywords, analysis,
                    recommendation);

        } catch (Exception e) {
            log.error("❌ 위험 분석 응답 파싱 실패: {}", jsonResponse, e);
            return createFallbackRiskAnalysis(detectedKeywords);
        }
    }

    /**
     * 폴백 위험 분석 (AI 실패 시 키워드 기반)
     */
    private RiskAnalysisResult createFallbackRiskAnalysis(List<String> detectedKeywords) {
        // 키워드 레벨에 따라 위험도 결정
        boolean hasCritical = detectedKeywords.stream().anyMatch(k -> k.contains("(CRITICAL)"));
        boolean hasHigh = detectedKeywords.stream().anyMatch(k -> k.contains("(HIGH)"));

        String severity;
        double riskScore;

        if (hasCritical) {
            severity = "CRITICAL";
            riskScore = 0.9;
        } else if (hasHigh) {
            severity = "HIGH";
            riskScore = 0.7;
        } else {
            severity = "MEDIUM";
            riskScore = 0.5;
        }

        String analysis = "키워드 기반 위험 감지: " + String.join(", ", detectedKeywords);
        String recommendation = "상담사가 직접 확인하고 적절한 개입을 수행하세요.";

        return new RiskAnalysisResult(true, severity, riskScore, detectedKeywords, analysis,
                recommendation);
    }

    /**
     * JSON 응답 정리
     */
    private String cleanJsonResponse(String response) {
        response = response.trim();
        if (response.startsWith("```json")) {
            response = response.substring(7);
        }
        if (response.startsWith("```")) {
            response = response.substring(3);
        }
        if (response.endsWith("```")) {
            response = response.substring(0, response.length() - 3);
        }
        return response.trim();
    }
}
