package com.coresolution.consultation.entity;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@code ai_usage_logs.prompt} 에는 마스킹된 값만 저장 — 저장 직전 훅 (#1422).
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("AiUsageLog 저장 직전 프롬프트 마스킹")
class AiUsageLogPromptMaskingTest {

    @Test
    @DisplayName("주민등록번호·카드·전화·이메일 원문은 저장 전 토큰으로 바뀐다")
    void onCreate_masksPatterns() {
        AiUsageLog row = AiUsageLog.builder()
                .prompt("[user] 900101-1234567 / 1234-5678-9012-3456 / 010-9876-5432 / someone@example.com")
                .build();

        row.onCreate();

        assertThat(row.getPrompt())
                .doesNotContain("900101-1234567", "1234-5678-9012-3456", "010-9876-5432", "someone@example.com")
                .contains("[주민등록번호]", "[카드번호]", "[전화번호]", "[이메일]");
    }

    @Test
    @DisplayName("이미 마스킹된 본문은 그대로(멱등), null 은 null")
    void onCreate_idempotentAndNullSafe() {
        AiUsageLog masked = AiUsageLog.builder().prompt("[user] [이름] 님 [전화번호] 2026-10-04 3회기").build();
        masked.onCreate();
        assertThat(masked.getPrompt()).isEqualTo("[user] [이름] 님 [전화번호] 2026-10-04 3회기");

        AiUsageLog empty = AiUsageLog.builder().build();
        empty.onCreate();
        assertThat(empty.getPrompt()).isNull();
    }
}
