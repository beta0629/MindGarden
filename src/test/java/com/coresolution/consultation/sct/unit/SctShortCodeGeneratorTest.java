package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashSet;
import java.util.Set;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.util.SctShortCodeGenerator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * SCT 단축 코드 생성기 — 길이·문자셋·충돌 재시도 입력 검증.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
class SctShortCodeGeneratorTest {

    @Test
    @DisplayName("길이 6·혼동 문자 제외")
    void generate_hasFixedLengthAndSafeCharset() {
        for (int i = 0; i < 100; i++) {
            String code = SctShortCodeGenerator.generate();
            assertEquals(SctConstants.SHORT_CODE_LENGTH, code.length());
            assertTrue(SctShortCodeGenerator.isValidFormat(code));
            assertFalse(code.contains("0"));
            assertFalse(code.contains("O"));
            assertFalse(code.contains("1"));
            assertFalse(code.contains("l"));
            assertFalse(code.contains("I"));
        }
    }

    @Test
    @DisplayName("연속 생성 시 다양성(전수 동일 금지)")
    void generate_notAllIdentical() {
        Set<String> codes = new HashSet<>();
        for (int i = 0; i < 40; i++) {
            codes.add(SctShortCodeGenerator.generate());
        }
        assertTrue(codes.size() > 1);
    }

    @Test
    @DisplayName("형식 검증 — 길이·문자셋")
    void isValidFormat_rejectsBadInput() {
        assertFalse(SctShortCodeGenerator.isValidFormat(null));
        assertFalse(SctShortCodeGenerator.isValidFormat("abc"));
        assertFalse(SctShortCodeGenerator.isValidFormat("abcdefg"));
        assertFalse(SctShortCodeGenerator.isValidFormat("abc0ef"));
        assertTrue(SctShortCodeGenerator.isValidFormat("k9P2mX"));
    }
}
