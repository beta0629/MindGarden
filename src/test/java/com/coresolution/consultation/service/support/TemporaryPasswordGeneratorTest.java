package com.coresolution.consultation.service.support;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.Set;

import com.coresolution.consultation.config.TemporaryPasswordProperties;
import com.coresolution.core.security.PasswordPolicy;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link TemporaryPasswordGenerator} 길이·문자군·정책·중복·{@code Math.random} 미사용.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */
@DisplayName("TemporaryPasswordGenerator")
class TemporaryPasswordGeneratorTest {

    private static final int SAMPLE_SIZE = 10_000;

    @Test
    @DisplayName("설정 길이·문자군만 사용하고 로그인 저장 정책을 통과한다")
    void generate_matchesConfiguredLengthCharsetAndPolicy() {
        TemporaryPasswordProperties properties = new TemporaryPasswordProperties();
        properties.setLength(12);
        TemporaryPasswordGenerator generator = new TemporaryPasswordGenerator(properties);
        String allowed = properties.getLowercase()
                + properties.getUppercase()
                + properties.getDigits()
                + properties.getSpecials();

        String password = generator.generate();

        assertThat(password).hasSize(12);
        for (int i = 0; i < password.length(); i++) {
            assertThat(allowed.indexOf(password.charAt(i))).isGreaterThanOrEqualTo(0);
        }
        assertThat(PasswordPolicy.collectLoginStorageViolations(password)).isEmpty();
    }

    @Test
    @DisplayName("1만 회 생성은 서로 다르고 정책을 통과한다")
    void generate_tenThousandSamplesAreUniqueAndCompliant() {
        TemporaryPasswordGenerator generator = new TemporaryPasswordGenerator(new TemporaryPasswordProperties());
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < SAMPLE_SIZE; i++) {
            String password = generator.generate();
            assertThat(password).hasSize(new TemporaryPasswordProperties().getLength());
            assertThat(PasswordPolicy.collectLoginStorageViolations(password)).isEmpty();
            assertThat(seen.add(password)).isTrue();
        }
    }

    @Test
    @DisplayName("길이가 정책 최소보다 짧으면 생성하지 않는다")
    void generate_rejectsLengthBelowPolicy() {
        TemporaryPasswordProperties properties = new TemporaryPasswordProperties();
        properties.setLength(PasswordPolicy.LOGIN_PASSWORD_MIN_LENGTH - 1);
        TemporaryPasswordGenerator generator = new TemporaryPasswordGenerator(properties);

        assertThatThrownBy(generator::generate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(TemporaryPasswordGenerator.CONFIG_INVALID);
    }

    @Test
    @DisplayName("생성기와 호출부는 Math.random·예측 가능 접두 패턴을 쓰지 않는다")
    void sourcesDoNotUseMathRandomOrPredictablePrefixes() throws Exception {
        assertThat(read("src/main/java/com/coresolution/consultation/service/support/TemporaryPasswordGenerator.java"))
                .contains("SecureRandom")
                .doesNotContain("Math.random");
        assertThat(read("src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java"))
                .doesNotContain("Math.random")
                .doesNotContain("\"CLIENT_\" + System.currentTimeMillis()");
        assertThat(read("src/main/java/com/coresolution/consultation/service/impl/UserServiceImpl.java"))
                .doesNotContain("\"Temp\" + System.currentTimeMillis()");
        assertThat(read("src/main/java/com/coresolution/consultation/service/impl/AbstractOAuth2Service.java"))
                .doesNotContain("Math.random")
                .doesNotContain("\"SOCIAL_\" + System.currentTimeMillis()");
        assertThat(read("src/main/java/com/coresolution/consultation/service/impl/ApplePhoneVerificationServiceImpl.java"))
                .doesNotContain("\"APPLE_\" + System.currentTimeMillis()");
        assertThat(read("src/main/java/com/coresolution/consultation/service/impl/OAuthPhoneVerificationServiceImpl.java"))
                .doesNotContain("providerName + \"_\" + System.currentTimeMillis()");
        assertThat(read("src/main/java/com/coresolution/consultation/service/impl/SocialAuthServiceImpl.java"))
                .doesNotContain("Math.random")
                .doesNotContain("new SecureRandom()");
    }

    private static String read(String relativePath) throws Exception {
        return Files.readString(Path.of(relativePath));
    }
}
