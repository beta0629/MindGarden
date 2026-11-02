package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.mock.env.MockEnvironment;

/**
 * {@link RedisOptionalEnvironmentPostProcessor} — blank host exclude / non-blank enable 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-11-02
 */
@DisplayName("RedisOptionalEnvironmentPostProcessor")
class RedisOptionalEnvironmentPostProcessorTest {

    private final RedisOptionalEnvironmentPostProcessor processor = new RedisOptionalEnvironmentPostProcessor();
    private final SpringApplication application = new SpringApplication();

    @Test
    @DisplayName("REDIS_HOST unset → exclude RedisAutoConfiguration, enabled=false")
    void redisHostUnset_excludesRedisAndDisables() {
        ConfigurableEnvironment env = new StandardEnvironment();
        // 시스템/환경에 REDIS_HOST가 있을 수 있으므로 명시적으로 빈 Map으로 덮지 않고 property만 확인
        clearRedisHostSources(env);

        processor.postProcessEnvironment(env, application);

        assertThat(env.getProperty(RedisOptionalEnvironmentPostProcessor.PROP_REDIS_ENABLED))
                .isEqualTo("false");
        String excludes = env.getProperty(RedisOptionalEnvironmentPostProcessor.PROP_AUTOCONFIGURE_EXCLUDE);
        assertThat(excludes).contains(RedisOptionalEnvironmentPostProcessor.REDIS_AUTO_CONFIGURATION);
        assertThat(excludes).contains(
                RedisOptionalEnvironmentPostProcessor.REDIS_REPOSITORIES_AUTO_CONFIGURATION);
        assertThat(excludes).contains(
                RedisOptionalEnvironmentPostProcessor.REDIS_HEALTH_CONTRIBUTOR_AUTO_CONFIGURATION);
        assertThat(excludes).contains(
                RedisOptionalEnvironmentPostProcessor.REDIS_REACTIVE_HEALTH_CONTRIBUTOR_AUTO_CONFIGURATION);
    }

    @Test
    @DisplayName("REDIS_HOST empty/whitespace → exclude + enabled=false")
    void redisHostEmptyOrWhitespace_excludesRedisAndDisables() {
        for (String blank : List.of("", "   ", "\t")) {
            MockEnvironment env = new MockEnvironment();
            env.setProperty(RedisOptionalEnvironmentPostProcessor.ENV_REDIS_HOST, blank);
            env.setProperty(RedisOptionalEnvironmentPostProcessor.PROP_REDIS_HOST, blank);

            processor.postProcessEnvironment(env, application);

            assertThat(env.getProperty(RedisOptionalEnvironmentPostProcessor.PROP_REDIS_ENABLED))
                    .as("blank='%s'", blank)
                    .isEqualTo("false");
            assertThat(env.getProperty(RedisOptionalEnvironmentPostProcessor.PROP_AUTOCONFIGURE_EXCLUDE))
                    .as("blank='%s'", blank)
                    .contains(RedisOptionalEnvironmentPostProcessor.REDIS_AUTO_CONFIGURATION);
        }
    }

    @Test
    @DisplayName("REDIS_HOST=127.0.0.1 → spring.data.redis.host 설정, enabled=true")
    void redisHostSet_enablesRedis() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty(RedisOptionalEnvironmentPostProcessor.ENV_REDIS_HOST, " 127.0.0.1 ");

        processor.postProcessEnvironment(env, application);

        assertThat(env.getProperty(RedisOptionalEnvironmentPostProcessor.PROP_REDIS_HOST))
                .isEqualTo("127.0.0.1");
        assertThat(env.getProperty(RedisOptionalEnvironmentPostProcessor.PROP_REDIS_ENABLED))
                .isEqualTo("true");
        String excludes = env.getProperty(RedisOptionalEnvironmentPostProcessor.PROP_AUTOCONFIGURE_EXCLUDE);
        assertThat(excludes == null
                || !excludes.contains(RedisOptionalEnvironmentPostProcessor.REDIS_AUTO_CONFIGURATION))
                .as("enabled 경로에서는 RedisAutoConfiguration exclude를 넣지 않음")
                .isTrue();
    }

    @Test
    @DisplayName("spring.data.redis.host non-blank (REDIS_HOST 없음) → enable")
    void springDataRedisHost_enablesWhenEnvMissing() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty(RedisOptionalEnvironmentPostProcessor.PROP_REDIS_HOST, "redis.internal");

        processor.postProcessEnvironment(env, application);

        assertThat(env.getProperty(RedisOptionalEnvironmentPostProcessor.PROP_REDIS_HOST))
                .isEqualTo("redis.internal");
        assertThat(env.getProperty(RedisOptionalEnvironmentPostProcessor.PROP_REDIS_ENABLED))
                .isEqualTo("true");
    }

    @Test
    @DisplayName("기존 autoconfigure.exclude 와 Redis exclude merge")
    void mergesExistingAutoconfigureExclude() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty(RedisOptionalEnvironmentPostProcessor.PROP_AUTOCONFIGURE_EXCLUDE,
                "com.example.OtherAutoConfiguration");

        processor.postProcessEnvironment(env, application);

        String excludes = env.getProperty(RedisOptionalEnvironmentPostProcessor.PROP_AUTOCONFIGURE_EXCLUDE);
        assertThat(excludes).contains("com.example.OtherAutoConfiguration");
        assertThat(excludes).contains(RedisOptionalEnvironmentPostProcessor.REDIS_AUTO_CONFIGURATION);
    }

    @Test
    @DisplayName("application-dev.yml 에 redis host 빈 기본값 키 없음")
    void applicationDevYaml_noEmptyRedisHostDefault() throws Exception {
        try (InputStream in = getClass().getClassLoader()
                .getResourceAsStream("application-dev.yml")) {
            assertThat(in).as("application-dev.yml on classpath").isNotNull();
            String yaml = new String(in.readAllBytes(), StandardCharsets.UTF_8);
            // 실제 YAML 키만 검사(주석의 금지 안내 문구는 허용)
            boolean hasEmptyHostKey = yaml.lines()
                    .map(String::trim)
                    .filter(line -> !line.startsWith("#"))
                    .anyMatch(line -> line.matches("host:\\s*\\$\\{REDIS_HOST:\\s*\\}.*"));
            assertThat(hasEmptyHostKey)
                    .as("non-comment host: ${REDIS_HOST:} must not exist")
                    .isFalse();
            assertThat(yaml).contains("RedisOptionalEnvironmentPostProcessor");
            assertThat(yaml).containsIgnoringCase("빈 REDIS_HOST");
        }
    }

    /**
     * 시스템/환경에 REDIS_HOST가 있으면 빈 값으로 덮어 unset/blank 경로를 강제한다.
     *
     * @param env 테스트 환경
     */
    private static void clearRedisHostSources(ConfigurableEnvironment env) {
        java.util.Map<String, Object> override = new java.util.HashMap<>();
        override.put(RedisOptionalEnvironmentPostProcessor.ENV_REDIS_HOST, "");
        override.put(RedisOptionalEnvironmentPostProcessor.PROP_REDIS_HOST, "");
        env.getPropertySources().addFirst(
                new org.springframework.core.env.MapPropertySource("redisOptionalTestOverride", override));
    }
}
