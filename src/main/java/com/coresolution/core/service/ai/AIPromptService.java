package com.coresolution.core.service.ai;

import com.coresolution.core.domain.SystemMetric;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * AI 프롬프트 관리 서비스
 * 공통 프롬프트를 관리하여 모델 변경 시에도 일관된 분석 가능
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Slf4j
@Service
public class AIPromptService {
    
    /**
     * 시스템 모니터링 전문가 역할 프롬프트
     */
    public String getSystemMonitoringExpertPrompt() {
        return "당신은 시스템 모니터링 및 이상 탐지 전문가입니다. " +
               "메트릭 데이터를 분석하여 이상 패턴을 정확하게 식별하고, " +
               "원인을 규명하며, 실용적인 해결 방안을 제시합니다.";
    }
    
    /**
     * 사이버 보안 전문가 역할 프롬프트
     */
    public String getSecurityExpertPrompt() {
        return "당신은 사이버 보안 전문가입니다. " +
               "보안 이벤트를 분석하여 위협을 정확하게 평가하고, " +
               "공격 패턴을 식별하며, 효과적인 대응 조치를 제안합니다.";
    }
    
    /**
     * 마음 건강 전문가 역할 프롬프트
     */
    public String getWellnessExpertPrompt() {
        return "당신은 마음 건강 전문가입니다. " +
               "내담자들을 위한 따뜻하고 실용적인 웰니스 팁을 작성합니다.";
    }
    
    /**
     * 이상 탐지 분석 프롬프트 생성
     */
    public String buildAnomalyDetectionPrompt(List<SystemMetric> metrics, String metricType, String metricDescription) {
        StringBuilder metricsData = new StringBuilder();
        for (SystemMetric metric : metrics) {
            metricsData.append(String.format("- %s: %.2f%%\n", 
                metric.getCollectedAt().toString(), 
                metric.getMetricValue()));
        }
        
        return String.format(
            "다음 시스템 메트릭 데이터를 분석하여 이상 여부를 판단해주세요.\n\n" +
            "메트릭 타입: %s\n" +
            "설명: %s\n\n" +
            "최근 데이터 (시간: 값):\n%s\n" +
            "분석 요청:\n" +
            "1. 이상 패턴이 있는지 판단 (있음/없음)\n" +
            "2. 이상이 있다면 심각도 평가 (CRITICAL/HIGH/MEDIUM/LOW)\n" +
            "3. 이상 점수 (0.0-1.0)\n" +
            "4. 이상 원인 분석 (간단히)\n" +
            "5. 권장 조치사항\n\n" +
            "응답 형식 (JSON):\n" +
            "{\n" +
            "  \"hasAnomaly\": true/false,\n" +
            "  \"severity\": \"CRITICAL/HIGH/MEDIUM/LOW\",\n" +
            "  \"anomalyScore\": 0.0-1.0,\n" +
            "  \"analysis\": \"원인 분석\",\n" +
            "  \"recommendation\": \"권장 조치사항\"\n" +
            "}",
            metricType, metricDescription, metricsData.toString()
        );
    }
    
    /**
     * 보안 위협 분석 프롬프트 생성
     */
    public String buildSecurityThreatPrompt(String eventType, Map<String, Object> eventDetails) {
        StringBuilder detailsText = new StringBuilder();
        for (Map.Entry<String, Object> entry : eventDetails.entrySet()) {
            detailsText.append(String.format("- %s: %s\n", entry.getKey(), entry.getValue()));
        }
        
        return String.format(
            "다음 보안 이벤트를 분석하여 위협 수준을 평가해주세요.\n\n" +
            "이벤트 타입: %s\n\n" +
            "이벤트 상세:\n%s\n" +
            "분석 요청:\n" +
            "1. 보안 위협 여부 판단 (있음/없음)\n" +
            "2. 위협이 있다면 심각도 평가 (CRITICAL/HIGH/MEDIUM/LOW)\n" +
            "3. 위협 점수 (0.0-1.0)\n" +
            "4. 위협 분석 (공격 유형, 의도 등)\n" +
            "5. 권장 대응 조치\n\n" +
            "응답 형식 (JSON):\n" +
            "{\n" +
            "  \"isThreat\": true/false,\n" +
            "  \"severity\": \"CRITICAL/HIGH/MEDIUM/LOW\",\n" +
            "  \"threatScore\": 0.0-1.0,\n" +
            "  \"threatType\": \"공격 유형\",\n" +
            "  \"analysis\": \"위협 분석\",\n" +
            "  \"recommendation\": \"권장 대응 조치\"\n" +
            "}",
            eventType, detailsText.toString()
        );
    }
    
    /**
     * 웰니스 컨텐츠 생성 프롬프트
     */
    public String buildWellnessContentPrompt(String dayName, String seasonName, String categoryName) {
        return String.format(
            "내담자들을 위한 따뜻하고 실용적인 웰니스 팁을 작성해주세요.\n\n" +
            "조건:\n" +
            "- 요일: %s\n" +
            "- 계절: %s\n" +
            "- 주제: %s\n" +
            "- 형식: JSON 형식으로 반환 {\"title\": \"제목\", \"content\": \"HTML 내용\"}\n" +
            "- 제목: 20자 이내, 따뜻하고 격려하는 느낌\n" +
            "- 내용: HTML 형식 (h3, p, ul, li 태그 사용), 200-300자\n" +
            "- 톤: 친근하고 따뜻한 말투\n" +
            "- 구성: 인사말 + 설명 + 실천 가능한 3-5개 팁 + 마무리 격려\n" +
            "- 이모지 적절히 사용\n\n" +
            "예시:\n" +
            "{\n" +
            "  \"title\": \"새로운 한 주를 시작하는 마음가짐\",\n" +
            "  \"content\": \"<h3>💪 월요일, 새로운 시작</h3><p>새로운 한 주가 시작되었습니다...</p>\"\n" +
            "}",
            dayName, seasonName, categoryName
        );
    }
}

