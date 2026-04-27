package com.coresolution.core.security;

import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@link PasswordPolicy} 로그인 저장 정책 SSOT 검증.
 *
 * @author CoreSolution
 * @since 2026-04-27
 */
@DisplayName("PasswordPolicy 로그인 비밀번호 정책")
class PasswordPolicyTest {

    @Test
    @DisplayName("허용되지 않은 특수문자(#)는 invalidCharacters로 거절")
    void hashSymbol_rejectedAsInvalidCharacters() {
        String pwd = "Abcdef12#";
        Map<String, String> v = PasswordPolicy.collectLoginStorageViolations(pwd);
        assertThat(v).containsKey("invalidCharacters");
        assertThat(PasswordPolicy.firstLoginStorageViolationMessage(pwd)).isEqualTo(v.get("invalidCharacters"));
    }

    @Test
    @DisplayName("허용 특수문자만 포함하고 복잡도·연속·반복·금지어 없으면 통과")
    void allowedSpecials_andComplexity_passes() {
        String pwd = "Str0ng!Aa";
        assertThat(PasswordPolicy.collectLoginStorageViolations(pwd)).isEmpty();
        assertThat(PasswordPolicy.firstLoginStorageViolationMessage(pwd)).isNull();
    }

    @Test
    @DisplayName("일반 금지 패턴(password 포함)은 commonPattern")
    void commonSubstring_rejected() {
        String pwd = "Valid1@XpasswordX";
        Map<String, String> v = PasswordPolicy.collectLoginStorageViolations(pwd);
        assertThat(v).containsKey("commonPattern");
    }

    @Test
    @DisplayName("연속 문자(123)는 consecutiveForbidden")
    void sequentialDigits_rejected() {
        String pwd = "Abcdef123@";
        Map<String, String> v = PasswordPolicy.collectLoginStorageViolations(pwd);
        assertThat(v).containsKey("consecutiveForbidden");
    }
}
