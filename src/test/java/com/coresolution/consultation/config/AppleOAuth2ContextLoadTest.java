package com.coresolution.consultation.config;

import com.coresolution.consultation.integration.apple.AppleClientSecretGenerator;
import com.coresolution.consultation.integration.apple.AppleIdTokenVerifier;
import com.coresolution.consultation.integration.apple.AppleOAuth2Client;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.context.PropertyPlaceholderAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Apple T1 SIWA 빈 부팅 회귀 테스트.
 *
 * <p>Apple T1 P1 hotfix — {@link AppleOAuth2Properties} 가 {@code @Component +
 * @ConfigurationProperties} 병용 deprecated 패턴이라 일부 환경에서 binding 체인이 끊겨
 * {@link AppleIdTokenVerifier} 등 생성자 주입이 fallback default constructor 를 찾다가
 * {@code NoSuchMethodException} 으로 ApplicationContext 부팅 자체가 실패했다. 본 테스트는
 * 동일 결함이 재발하면 즉시 적발하기 위한 회귀 게이트다.</p>
 *
 * <p>두 단계로 검증한다:
 * <ol>
 *   <li>{@link AppleOAuth2Config} + {@link AppleOAuth2Properties} 가 ApplicationContext 슬라이스에서
 *       {@code @ConfigurationProperties} binding 으로 정상 등록되는지 ({@link ApplicationContextRunner})</li>
 *   <li>Apple 통합 4종(verifier / generator / client + Service 호출 단위) 의 생성자 시그니처가
 *       {@link AppleOAuth2Properties} 만으로 직접 주입 가능한지 (단위 인스턴스화)</li>
 * </ol>
 * </p>
 *
 * <p>JPA · DataSource 등 무거운 환경에 의존하지 않으므로 BW-1 환경 이슈와 독립적으로 항상 PASS 해야 한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-08
 */
@DisplayName("Apple OAuth2 빈 부팅 회귀")
class AppleOAuth2ContextLoadTest {

    private static final String[] BLANK_FALLBACK_PROPS = {
        "apple.client-id=",
        "apple.team-id=",
        "apple.key-id=",
        "apple.private-key=",
        "apple.redirect-uri="
    };

    @Test
    @DisplayName("AppleOAuth2Config 단독으로 AppleOAuth2Properties 가 binding 된다 (P1 회귀 게이트)")
    void enableConfigurationPropertiesRegistersAppleProperties() {
        new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(PropertyPlaceholderAutoConfiguration.class))
            .withUserConfiguration(AppleOAuth2Config.class)
            .withPropertyValues(BLANK_FALLBACK_PROPS)
            .run(context -> {
                assertThat(context).hasNotFailed();
                assertThat(context).hasSingleBean(AppleOAuth2Properties.class);

                AppleOAuth2Properties properties = context.getBean(AppleOAuth2Properties.class);

                // application.yml 의 5종 env placeholder 가 빈 문자열이어도 binding 정상 — 즉 P1 결함 재현 안 됨.
                assertThat(properties.getClientId()).isEqualTo("");
                assertThat(properties.getTeamId()).isEqualTo("");
                assertThat(properties.getKeyId()).isEqualTo("");
                assertThat(properties.getPrivateKey()).isEqualTo("");
                assertThat(properties.getRedirectUri()).isEqualTo("");

                // 기본값이 정의된 키는 클래스 필드 default 유지.
                assertThat(properties.getIssuer()).isEqualTo("https://appleid.apple.com");
                assertThat(properties.getJwksUri()).isEqualTo("https://appleid.apple.com/auth/keys");
                assertThat(properties.getTokenUri()).isEqualTo("https://appleid.apple.com/auth/token");
                assertThat(properties.getJwksCacheTtlSeconds()).isEqualTo(3600L);
                assertThat(properties.getClientSecretTtlSeconds()).isEqualTo(5184000L);
            });
    }

    @Test
    @DisplayName("Apple 통합 빈 3종(verifier/generator/client) 생성자가 AppleOAuth2Properties 로 wire 가능")
    void appleIntegrationBeansInstantiableWithProperties() {
        AppleOAuth2Properties properties = new AppleOAuth2Properties();

        // 본 hotfix 의 핵심 — Lombok @NoArgsConstructor 가 default constructor 를 보장하므로 Spring 생성자 주입 정상.
        // 만약 향후 @Data 의 동작이 바뀌어 default constructor 가 사라지면 위 한 줄에서 컴파일 실패.

        AppleClientSecretGenerator generator = new AppleClientSecretGenerator(properties);
        AppleIdTokenVerifier verifier = new AppleIdTokenVerifier(properties);
        AppleOAuth2Client client = new AppleOAuth2Client(new RestTemplate(), generator, properties);

        assertThat(generator).isNotNull();
        assertThat(verifier).isNotNull();
        assertThat(client).isNotNull();
    }

    /**
     * Apple T1 P0 hotfix #2 회귀 게이트.
     *
     * <p>{@link AppleIdTokenVerifier} 는 Spring 주입용·테스트 주입용 두 개의 public 생성자를 가진다.
     * Spring 4.3+ 단일 생성자 자동 주입 정책에 따라 어느 한 쪽에 {@code @Autowired} 를 명시하지
     * 않으면 fallback 으로 default constructor 를 탐색하다 {@link NoSuchMethodException} 으로 부팅이
     * 실패한다 (PR #150 hotfix #1 머지 후에도 dev/prod 동일 실패 재현).</p>
     *
     * <p>{@code @Bean} 메서드는 시그니처에서 생성자를 명시 호출하므로 Spring 의 생성자 선택 로직을
     * <em>우회</em> 한다. 본 회귀를 정확히 적발하려면 클래스 자체를 bean definition 으로 등록해
     * {@code AutowiredAnnotationBeanPostProcessor} 가 생성자 후보를 결정하도록 해야 한다.
     * Spring 5+ 의 {@link Import @Import} 는 일반 {@code @Component} 클래스도 import 대상으로 받아
     * 동일 경로로 등록한다.</p>
     */
    @Test
    @DisplayName("AppleIdTokenVerifier 가 Spring 생성자 선택 정책으로 부팅된다 (P0 hotfix #2 회귀 게이트)")
    void appleIdTokenVerifierBootsUnderSpringConstructorSelection() {
        new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(PropertyPlaceholderAutoConfiguration.class))
            .withUserConfiguration(AppleOAuth2Config.class, AppleBeansImportConfiguration.class)
            .withPropertyValues(BLANK_FALLBACK_PROPS)
            .run(context -> {
                // hasNotFailed() 가 P0 hotfix #2 회귀 게이트의 핵심. Spring 생성자 선택 실패 시
                // 컨텍스트가 NoSuchMethodException 으로 startupFailure 를 기록한다.
                assertThat(context).hasNotFailed();
                assertThat(context).hasSingleBean(AppleIdTokenVerifier.class);
                assertThat(context).hasSingleBean(AppleClientSecretGenerator.class);
                assertThat(context).hasSingleBean(AppleOAuth2Client.class);

                AppleIdTokenVerifier verifier = context.getBean(AppleIdTokenVerifier.class);
                assertThat(verifier).isNotNull();
            });
    }

    /**
     * Apple 통합 빈 3종을 클래스 import 로 등록한다.
     *
     * <p>{@code @Bean} 팩토리 메서드는 명시적 {@code new} 호출이라 Spring 의 다중 생성자 선택을
     * 우회한다. 본 회귀 게이트는 그 우회를 의도적으로 피해야 하므로 {@link Import} 로 클래스
     * 자체를 bean definition 에 올린다. 등록된 클래스는 {@code AutowiredAnnotationBeanPostProcessor}
     * 가 생성자 후보를 평가해 인스턴스화하므로, {@code @Autowired} 누락이 발생하면 동일 실패가
     * 본 테스트에서 즉시 재현된다.</p>
     *
     * <p>{@link RestTemplate} 은 본 슬라이스에 자동 등록되지 않으므로 명시 {@code @Bean} 으로 보조한다.</p>
     */
    @Configuration
    @Import({ AppleIdTokenVerifier.class, AppleClientSecretGenerator.class, AppleOAuth2Client.class })
    static class AppleBeansImportConfiguration {

        @Bean
        RestTemplate appleOAuth2RestTemplate() {
            return new RestTemplate();
        }
    }
}
