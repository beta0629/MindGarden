package com.coresolution.consultation.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import jakarta.persistence.Table;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 트랙 B PR-2 검증 — {@code AiUsageLog} 엔티티의 테이블 매핑이
 * {@code ai_usage_logs} 로 리네임됐는지 확인 (Flyway V20260528_006 와 짝).
 *
 * @author CoreSolution
 * @since 2026-05-23
 */
@DisplayName("AiUsageLog — @Table(name=\"ai_usage_logs\") 매핑 검증")
class AiUsageLogTest {

    @Test
    @DisplayName("@Table.name 이 ai_usage_logs 여야 한다 (Flyway V20260528_006 RENAME 와 짝)")
    void tableAnnotation_pointsToAiUsageLogs() {
        Table annotation = AiUsageLog.class.getAnnotation(Table.class);
        assertNotNull(annotation, "AiUsageLog 는 @Table 매핑이 필수");
        assertEquals("ai_usage_logs", annotation.name(),
                "리네임 일괄 (기획서 §7 Q5=a) — openai_usage_logs → ai_usage_logs 로 엔티티 매핑 갱신 필요");
    }
}
