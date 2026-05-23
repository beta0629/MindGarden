package com.coresolution.consultation.service.ai.parser;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link AiJsonResponseParser} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-05-23
 */
@DisplayName("AiJsonResponseParser")
class AiJsonResponseParserTest {

    private AiJsonResponseParser parser;

    @BeforeEach
    void setUp() {
        parser = new AiJsonResponseParser(new ObjectMapper());
    }

    @Test
    @DisplayName("raw JSON 파싱 성공")
    void parseJson_rawJson() {
        Optional<JsonNode> result = parser.parseJson("{\"title\":\"테스트\",\"content\":\"본문\"}");
        assertTrue(result.isPresent());
        assertEquals("테스트", result.get().path("title").asText());
        assertEquals("본문", result.get().path("content").asText());
    }

    @Test
    @DisplayName("```json 코드블록 fence 파싱")
    void parseJson_jsonCodeFence() {
        String input = "```json\n{\"key\":\"value\"}\n```";
        Optional<JsonNode> result = parser.parseJson(input);
        assertTrue(result.isPresent());
        assertEquals("value", result.get().path("key").asText());
    }

    @Test
    @DisplayName("``` 일반 코드블록 fence 파싱")
    void parseJson_plainCodeFence() {
        String input = "```\n{\"name\":\"hello\"}\n```";
        Optional<JsonNode> result = parser.parseJson(input);
        assertTrue(result.isPresent());
        assertEquals("hello", result.get().path("name").asText());
    }

    @Test
    @DisplayName("markdown wrap + safety text — greedy match fallback")
    void parseJson_markdownWrapGreedyMatch() {
        String input = "Here is the result:\n{\"score\":95,\"label\":\"good\"}\nThank you!";
        Optional<JsonNode> result = parser.parseJson(input);
        assertTrue(result.isPresent());
        assertEquals(95, result.get().path("score").asInt());
        assertEquals("good", result.get().path("label").asText());
    }

    @Test
    @DisplayName("null/blank 입력 → empty")
    void parseJson_nullOrBlank() {
        assertFalse(parser.parseJson(null).isPresent());
        assertFalse(parser.parseJson("").isPresent());
        assertFalse(parser.parseJson("   ").isPresent());
    }

    @Test
    @DisplayName("유효하지 않은 JSON → empty")
    void parseJson_invalidJson() {
        assertFalse(parser.parseJson("not json at all").isPresent());
    }
}
