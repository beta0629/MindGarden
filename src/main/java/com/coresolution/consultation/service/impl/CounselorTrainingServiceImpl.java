package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.coresolution.consultation.entity.Consultant;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.CounselorFeedback;
import com.coresolution.consultation.entity.VirtualClientSession;
import com.coresolution.consultation.repository.AudioTranscriptionRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.CounselorFeedbackRepository;
import com.coresolution.consultation.repository.VirtualClientSessionRepository;
import com.coresolution.consultation.service.CounselorTrainingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담사 교육 서비스 구현체
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CounselorTrainingServiceImpl implements CounselorTrainingService {

    private final CounselorFeedbackRepository feedbackRepository;
    private final VirtualClientSessionRepository sessionRepository;
    private final ConsultationRecordRepository recordRepository;
    private final AudioTranscriptionRepository transcriptionRepository;
    private final ObjectMapper objectMapper;

    @Override
    public CounselorFeedback analyzeSession(Long consultationRecordId, Long consultantId) {
        try {
            ConsultationRecord recordEntity = recordRepository.findById(consultationRecordId)
                    .orElseThrow(() -> new IllegalArgumentException("상담 기록을 찾을 수 없습니다"));

            log.info("상담 세션 분석 시작: recordId={}, consultantId={}", consultationRecordId,
                    consultantId);

            // TODO: MCP counselor-training 서버 호출
            // mcpService.call("counselor-training", "analyze_counseling_technique", ...)

            CounselorFeedback feedback = CounselorFeedback.builder().consultantId(consultantId)
                    .consultationRecordId(consultationRecordId)
                    .empathicListeningScore(new BigDecimal("0.82"))
                    .questioningTechniqueScore(new BigDecimal("0.75"))
                    .interventionTimingScore(new BigDecimal("0.88"))
                    .rapportBuildingScore(new BigDecimal("0.90"))
                    .overallPerformanceScore(new BigDecimal("0.84")).performanceLevel("GOOD")
                    .aiFeedbackSummary("전반적으로 우수한 상담 진행. 공감적 경청과 라포 형성이 특히 좋음.")
                    .specificRecommendations("개방형 질문을 더 활용하면 내담자의 표현을 촉진할 수 있습니다.")
                    .analysisModel("gemini-pro").feedbackDate(LocalDateTime.now()).build();

            try {
                feedback.setStrengths(
                        objectMapper.writeValueAsString(List.of("우수한 공감 능력", "효과적인 라포 형성")));
                feedback.setAreasForImprovement(
                        objectMapper.writeValueAsString(List.of("질문 기법 다양화", "침묵 활용")));
            } catch (Exception e) {
                log.warn("JSON 변환 실패", e);
            }

            feedback.setTenantId(recordEntity.getTenantId());

            CounselorFeedback saved = feedbackRepository.save(feedback);

            log.info("✅ 상담 세션 분석 완료: id={}, 점수={}", saved.getId(),
                    feedback.getOverallPerformanceScore());

            return saved;

        } catch (Exception e) {
            log.error("❌ 상담 세션 분석 실패: recordId={}, error={}", consultationRecordId, e.getMessage(),
                    e);
            throw new RuntimeException("상담 세션 분석 실패: " + e.getMessage(), e);
        }
    }

    @Override
    public VirtualClientSession createVirtualClientSession(Long consultantId, String scenarioType,
            String difficultyLevel) {
        try {
            log.info("가상 내담자 세션 생성: consultantId={}, scenario={}", consultantId, scenarioType);

            // TODO: MCP counselor-training 서버 호출
            // mcpService.call("counselor-training", "create_virtual_client", ...)

            Consultant consultant = new Consultant(); // TODO: 실제 조회

            VirtualClientSession session = VirtualClientSession.builder().consultantId(consultantId)
                    .scenarioType(scenarioType).difficultyLevel(difficultyLevel)
                    .presentingProblem("최근 불안 증상으로 어려움을 겪고 있습니다.")
                    .backgroundStory("직장에서의 스트레스와 대인관계 어려움이 지속되고 있습니다.").turnCount(0)
                    .sessionStatus("IN_PROGRESS").build();

            try {
                Map<String, Object> profile = new HashMap<>();
                profile.put("name", "김가상");
                profile.put("age", 32);
                profile.put("gender", "여성");
                profile.put("occupation", "직장인");
                session.setVirtualClientProfile(objectMapper.writeValueAsString(profile));

                session.setConversationHistory(objectMapper.writeValueAsString(List.of()));
            } catch (Exception e) {
                log.warn("JSON 변환 실패", e);
            }

            session.setTenantId("default"); // TODO: 실제 tenantId

            VirtualClientSession saved = sessionRepository.save(session);

            log.info("✅ 가상 내담자 세션 생성 완료: id={}", saved.getId());

            return saved;

        } catch (Exception e) {
            log.error("❌ 가상 내담자 세션 생성 실패: error={}", e.getMessage(), e);
            throw new RuntimeException("가상 내담자 세션 생성 실패: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> sendMessageToVirtualClient(Long sessionId, String counselorMessage) {
        try {
            VirtualClientSession session = sessionRepository.findById(sessionId)
                    .orElseThrow(() -> new IllegalArgumentException("세션을 찾을 수 없습니다"));

            // TODO: MCP counselor-training 서버 호출
            String clientResponse = "네, 그렇습니다. 최근 계속 불안해요...";

            // 대화 이력 업데이트
            List<Map<String, String>> history =
                    parseConversationHistory(session.getConversationHistory());
            history.add(Map.of("role", "counselor", "message", counselorMessage, "timestamp",
                    LocalDateTime.now().toString()));
            history.add(Map.of("role", "client", "message", clientResponse, "timestamp",
                    LocalDateTime.now().toString()));

            try {
                session.setConversationHistory(objectMapper.writeValueAsString(history));
                session.setTurnCount(session.getTurnCount() + 1);
                sessionRepository.save(session);
            } catch (Exception e) {
                log.warn("대화 이력 업데이트 실패", e);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("sessionId", sessionId);
            result.put("clientResponse", clientResponse);
            result.put("turnCount", session.getTurnCount());

            return result;

        } catch (Exception e) {
            log.error("❌ 가상 내담자 응답 생성 실패: sessionId={}, error={}", sessionId, e.getMessage(), e);
            throw new RuntimeException("가상 내담자 응답 생성 실패: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> completeSession(Long sessionId) {
        try {
            VirtualClientSession session = sessionRepository.findById(sessionId)
                    .orElseThrow(() -> new IllegalArgumentException("세션을 찾을 수 없습니다"));

            log.info("시뮬레이션 세션 종료: sessionId={}", sessionId);

            // 평가 점수 계산
            BigDecimal performanceScore = calculatePerformanceScore(session);

            session.setSessionStatus("COMPLETED");
            session.setCompletedAt(LocalDateTime.now());
            session.setCounselorPerformanceScore(performanceScore);
            session.setAiEvaluationSummary("전반적으로 좋은 진행이었습니다. 라포 형성이 우수했습니다.");

            sessionRepository.save(session);

            Map<String, Object> result = new HashMap<>();
            result.put("sessionId", sessionId);
            result.put("performanceScore", performanceScore);
            result.put("turnCount", session.getTurnCount());
            result.put("evaluation", session.getAiEvaluationSummary());

            return result;

        } catch (Exception e) {
            log.error("❌ 세션 종료 실패: sessionId={}, error={}", sessionId, e.getMessage(), e);
            throw new RuntimeException("세션 종료 실패: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> getFeedbackHistory(Long consultantId, Integer limit) {
        List<CounselorFeedback> feedbacks = feedbackRepository
                .findByConsultantIdAndIsDeletedFalseOrderByFeedbackDateDesc(consultantId);

        if (limit != null && limit > 0 && feedbacks.size() > limit) {
            feedbacks = feedbacks.subList(0, limit);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("consultantId", consultantId);
        result.put("feedbacks", feedbacks);
        result.put("count", feedbacks.size());

        return result;
    }

    // Helper methods

    private List<Map<String, String>> parseConversationHistory(String historyJson) {
        if (historyJson == null || historyJson.isEmpty()) {
            return new ArrayList<>();
        }

        try {
            return objectMapper.readValue(historyJson, List.class);
        } catch (Exception e) {
            log.warn("대화 이력 파싱 실패", e);
            return new ArrayList<>();
        }
    }

    private BigDecimal calculatePerformanceScore(VirtualClientSession session) {
        // 간단한 점수 계산 (턴 수 기반)
        int turnCount = session.getTurnCount();
        if (turnCount >= 10)
            return new BigDecimal("0.85");
        if (turnCount >= 5)
            return new BigDecimal("0.70");
        return new BigDecimal("0.50");
    }
}
