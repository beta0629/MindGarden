package com.coresolution.core.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@link LogSanitizer} 단위 테스트.
 *
 * <p>CodeQL Log Injection 대응 유틸의 sanitize 동작을 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-12
 */
class LogSanitizerTest {

    @Test
    @DisplayName("forLog: null 입력 → \"null\" 문자열 반환")
    void forLog_null입력_null문자열반환() {
        assertThat(LogSanitizer.forLog(null)).isEqualTo("null");
    }

    @Test
    @DisplayName("forLog: 정상 문자열 → 그대로 반환")
    void forLog_정상문자열_그대로반환() {
        assertThat(LogSanitizer.forLog("tenant-abc-123")).isEqualTo("tenant-abc-123");
    }

    @Test
    @DisplayName("forLog: CRLF → 언더스코어로 치환")
    void forLog_CRLF_언더스코어로치환() {
        assertThat(LogSanitizer.forLog("tenant\r\nINJECTED")).isEqualTo("tenant__INJECTED");
    }

    @Test
    @DisplayName("forLog: 탭 → 언더스코어로 치환")
    void forLog_탭_언더스코어로치환() {
        assertThat(LogSanitizer.forLog("tenant\tINJECTED")).isEqualTo("tenant_INJECTED");
    }

    @Test
    @DisplayName("forLog: 기타 제어 문자(0x00, 0x1F) → 언더스코어로 치환")
    void forLog_제어문자_언더스코어로치환() {
        assertThat(LogSanitizer.forLog("tenant\u0000\u001F")).isEqualTo("tenant__");
    }

    @Test
    @DisplayName("forLog: 200자 초과 → truncate 후 \"...\" 부가")
    void forLog_200자초과_truncate() {
        String input = "a".repeat(250);
        String result = LogSanitizer.forLog(input);
        assertThat(result).hasSize(203);
        assertThat(result).endsWith("...");
    }

    @Test
    @DisplayName("forLog: 빈 문자열 → 빈 문자열 반환")
    void forLog_빈문자열_빈문자열반환() {
        assertThat(LogSanitizer.forLog("")).isEmpty();
    }
}
