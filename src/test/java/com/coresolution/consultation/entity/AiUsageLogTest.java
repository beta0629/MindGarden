package com.coresolution.consultation.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import jakarta.persistence.Column;
import jakarta.persistence.Table;
import java.lang.reflect.Field;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 트랙 B PR-2 + N3 보강 검증 — {@code AiUsageLog} 엔티티의 테이블 매핑이
 * {@code ai_usage_logs} 로 리네임됐는지 확인 + V20260529_001 신규 컬럼 매핑 검증.
 *
 * @author CoreSolution
 * @since 2026-05-23
 */
@DisplayName("AiUsageLog — @Table + N3 보강 컬럼 매핑 검증")
class AiUsageLogTest {

    @Test
    @DisplayName("@Table.name 이 ai_usage_logs 여야 한다 (Flyway V20260528_006 RENAME 와 짝)")
    void tableAnnotation_pointsToAiUsageLogs() {
        Table annotation = AiUsageLog.class.getAnnotation(Table.class);
        assertNotNull(annotation, "AiUsageLog 는 @Table 매핑이 필수");
        assertEquals("ai_usage_logs", annotation.name(),
                "리네임 일괄 (기획서 §7 Q5=a) — openai_usage_logs → ai_usage_logs 로 엔티티 매핑 갱신 필요");
    }

    @Test
    @DisplayName("ai_provider 컬럼 — NOT NULL + VARCHAR(50) (V20260529_001 default 제거)")
    void aiProviderColumn_mappedAsNotNullVarchar50() throws NoSuchFieldException {
        Field field = AiUsageLog.class.getDeclaredField("aiProvider");
        Column col = field.getAnnotation(Column.class);
        assertNotNull(col, "aiProvider 필드는 @Column 매핑 필수");
        assertEquals("ai_provider", col.name());
        assertFalse(col.nullable(),
                "ai_provider 는 NOT NULL — caller 가 반드시 effectiveProvider 정규화 결과를 set");
        assertEquals(50, col.length(), "ai_provider 길이 50 유지");
    }

    @Test
    @DisplayName("prompt 컬럼 — LONGTEXT NULL (V20260529_001 신설)")
    void promptColumn_mappedAsLongtextNullable() throws NoSuchFieldException {
        Field field = AiUsageLog.class.getDeclaredField("prompt");
        Column col = field.getAnnotation(Column.class);
        assertNotNull(col, "prompt 필드는 @Column 매핑 필수");
        assertEquals("prompt", col.name());
        assertTrue(col.nullable(), "prompt 는 nullable (기존 행은 NULL)");
        assertEquals("LONGTEXT", col.columnDefinition(), "prompt 는 LONGTEXT");
    }

    @Test
    @DisplayName("response 컬럼 — LONGTEXT NULL (V20260529_001 신설)")
    void responseColumn_mappedAsLongtextNullable() throws NoSuchFieldException {
        Field field = AiUsageLog.class.getDeclaredField("response");
        Column col = field.getAnnotation(Column.class);
        assertNotNull(col, "response 필드는 @Column 매핑 필수");
        assertEquals("response", col.name());
        assertTrue(col.nullable(), "response 는 nullable (실패/기존 행은 NULL)");
        assertEquals("LONGTEXT", col.columnDefinition(), "response 는 LONGTEXT");
    }

    @Test
    @DisplayName("builder 가 신규 필드를 모두 채울 수 있어야 한다")
    void builder_supportsAllN3Fields() {
        AiUsageLog log = AiUsageLog.builder()
                .tenantId("TENANT")
                .aiProvider("GEMINI")
                .requestType("WELLNESS")
                .model("gemini-2.5-flash")
                .prompt("[system]\nyou are\n\n[user]\nhello")
                .response("response body")
                .isSuccess(true)
                .build();
        assertEquals("GEMINI", log.getAiProvider());
        assertEquals("[system]\nyou are\n\n[user]\nhello", log.getPrompt());
        assertEquals("response body", log.getResponse());
    }
}
