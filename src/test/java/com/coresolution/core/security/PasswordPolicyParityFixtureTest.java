package com.coresolution.core.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 로그인 비밀번호 정책 BE·FE 동일성 — 공용 픽스처 기준.
 *
 * <p>같은 픽스처를 프론트 {@code frontend/src/utils/__tests__/loginPasswordPolicy.parity.test.js} 가
 * {@code frontend/src/constants/passwordPolicyUi.js} 에 대해 검사한다. 한쪽 값만 바뀌면 어느 한쪽 테스트가 실패한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@DisplayName("PasswordPolicy — BE·FE 공용 픽스처 동일성")
class PasswordPolicyParityFixtureTest {

    private static final String FIXTURE = "/password-policy/login-password-policy-parity.json";

    private static JsonNode fixture() throws IOException {
        try (InputStream in = PasswordPolicyParityFixtureTest.class.getResourceAsStream(FIXTURE)) {
            assertThat(in).as("fixture %s", FIXTURE).isNotNull();
            return new ObjectMapper().readTree(in);
        }
    }

    private static String casePassword(JsonNode c) {
        JsonNode repeat = c.get("repeat");
        if (repeat != null) {
            return repeat.get("unit").asText().repeat(repeat.get("times").asInt());
        }
        return c.get("password").asText();
    }

    @Test
    @DisplayName("길이·특수문자·금지어 상수가 픽스처와 같다")
    void constantsMatchFixture() throws IOException {
        JsonNode f = fixture();
        assertThat(PasswordPolicy.LOGIN_PASSWORD_MIN_LENGTH).isEqualTo(f.get("minLength").asInt());
        assertThat(PasswordPolicy.LOGIN_PASSWORD_MAX_LENGTH).isEqualTo(f.get("maxLength").asInt());
        assertThat(PasswordPolicy.LOGIN_PASSWORD_ALLOWED_SPECIALS).isEqualTo(f.get("allowedSpecials").asText());
        List<String> common = new ArrayList<>();
        f.get("commonSubstrings").forEach(n -> common.add(n.asText()));
        assertThat(PasswordPolicy.LOGIN_PASSWORD_COMMON_SUBSTRINGS).containsExactlyElementsOf(common);
    }

    @Test
    @DisplayName("픽스처 사례마다 첫 위반 코드가 같다(통과 사례는 위반 없음)")
    void firstViolationCodeMatchesFixture() throws IOException {
        JsonNode cases = fixture().get("cases");
        assertThat(cases.size()).isGreaterThan(0);
        for (JsonNode c : cases) {
            String password = casePassword(c);
            Map<String, String> violations = PasswordPolicy.collectLoginStorageViolations(password);
            JsonNode expected = c.get("code");
            if (expected == null || expected.isNull()) {
                assertThat(violations).as("expected pass, length=%d", password.length()).isEmpty();
            } else {
                assertThat(violations.keySet().iterator().next())
                    .as("length=%d", password.length())
                    .isEqualTo(expected.asText());
            }
        }
    }

    @Test
    @DisplayName("일반 단어: 픽스처 일치 사례마다 isCommonPattern(대소문자 무시 부분 일치) 결과가 같다")
    void commonSubstringMatchesFixture() throws IOException {
        JsonNode matches = fixture().get("commonSubstringMatches");
        assertThat(matches.size()).isGreaterThan(0);
        for (JsonNode m : matches) {
            String text = m.get("text").asText();
            assertThat(PasswordPolicy.isCommonPattern(text)).as("text=%s", text).isEqualTo(m.get("matches").asBoolean());
        }
    }

    @Test
    @DisplayName("일반 단어: 목록 항목마다 대소문자를 섞은 일치 사례가 픽스처에 있다")
    void everyCommonSubstringHasMixedCaseMatchCase() throws IOException {
        JsonNode f = fixture();
        List<String> positives = new ArrayList<>();
        f.get("commonSubstringMatches").forEach(m -> {
            if (m.get("matches").asBoolean()) {
                positives.add(m.get("text").asText());
            }
        });
        for (String entry : PasswordPolicy.LOGIN_PASSWORD_COMMON_SUBSTRINGS) {
            assertThat(positives)
                .as("entry=%s", entry)
                .anyMatch(t -> t.toLowerCase().contains(entry) && !t.equals(t.toLowerCase()));
        }
    }

    @Test
    @DisplayName("통과 사례는 PasswordService.validatePassword 도 통과하고, 위반 사례는 정책 문구로 거절한다")
    void passwordServiceAgreesWithFixture() throws IOException {
        PasswordService service = new PasswordService(null);
        for (JsonNode c : fixture().get("cases")) {
            String password = casePassword(c);
            JsonNode expected = c.get("code");
            if (expected == null || expected.isNull()) {
                service.validatePassword(password);
            } else {
                String message = PasswordPolicy.firstLoginStorageViolationMessage(password);
                assertThat(message).isNotBlank();
                try {
                    service.validatePassword(password);
                    throw new AssertionError("expected InvalidPasswordException for code " + expected.asText());
                } catch (PasswordService.InvalidPasswordException e) {
                    assertThat(e.getMessage()).isEqualTo(message);
                }
            }
        }
    }
}
