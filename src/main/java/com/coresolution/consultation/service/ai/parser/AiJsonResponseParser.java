package com.coresolution.consultation.service.ai.parser;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * AI 응답 JSON 파서 — markdown 코드블록·fence·safety wrap 등 다양한 형식을 강건하게 처리.
 *
 * @author CoreSolution
 * @since 2026-05-23
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AiJsonResponseParser {

    private final ObjectMapper objectMapper;

    /**
     * markdown 코드블록 / ```json fence / safety wrap / 다양한 escape 패턴을 강건하게 처리.
     * Gemini 응답 (markdown wrap) + OpenAI 응답 (raw JSON) 양쪽 호환.
     *
     * @param text AI 모델 원본 응답 텍스트
     * @return 파싱된 JsonNode, 실패 시 empty
     */
    public Optional<JsonNode> parseJson(String text) {
        if (text == null || text.isBlank()) {
            return Optional.empty();
        }
        String cleaned = stripCodeFence(text);
        try {
            return Optional.of(objectMapper.readTree(cleaned));
        } catch (JsonProcessingException e) {
            log.warn("⚠️ AI 응답 JSON 파싱 실패 (try greedy match): {}", e.getMessage());
            return tryGreedyJsonMatch(cleaned);
        }
    }

    private String stripCodeFence(String text) {
        String trimmed = text.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            if (firstNewline > 0) {
                trimmed = trimmed.substring(firstNewline + 1);
            }
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3).trim();
            }
        }
        return trimmed;
    }

    private Optional<JsonNode> tryGreedyJsonMatch(String text) {
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start < 0 || end <= start) {
            return Optional.empty();
        }
        try {
            return Optional.of(objectMapper.readTree(text.substring(start, end + 1)));
        } catch (JsonProcessingException e) {
            log.error("❌ AI 응답 JSON 파싱 최종 실패", e);
            return Optional.empty();
        }
    }
}
