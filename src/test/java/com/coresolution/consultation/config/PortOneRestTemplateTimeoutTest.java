package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.service.portone.PortOneV2PaymentCancelService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentLookupService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentVerifyService;
import com.coresolution.core.service.impl.IamportConnectionTestServiceImpl;
import java.lang.reflect.Constructor;
import java.lang.reflect.Parameter;
import java.time.Duration;
import java.util.Properties;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.PropertyPlaceholderHelper;
import org.springframework.web.client.RestTemplate;

/**
 * #1311 후속 — PortOne 조회·취소·연결 테스트 RestTemplate 타임아웃(연결 3초·읽기 5초) 계약.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@DisplayName("PortOne RestTemplate 타임아웃 설정")
class PortOneRestTemplateTimeoutTest {

    private static final long EXPECTED_CONNECT_TIMEOUT_MS = 3_000L;
    private static final long EXPECTED_READ_TIMEOUT_MS = 5_000L;

    @Test
    @DisplayName("application.yml 기본값: portone.http connect 3000ms / read 5000ms")
    void applicationYml_defaults() {
        YamlPropertiesFactoryBean yaml = new YamlPropertiesFactoryBean();
        yaml.setResources(new ClassPathResource("application.yml"));
        Properties loaded = yaml.getObject();
        PropertyPlaceholderHelper defaults = new PropertyPlaceholderHelper("${", "}", ":", true);

        assertThat(loaded).isNotNull();
        assertThat(defaults.replacePlaceholders(loaded.getProperty("portone.http.connect-timeout-ms"), new Properties()))
                .isEqualTo(String.valueOf(EXPECTED_CONNECT_TIMEOUT_MS));
        assertThat(defaults.replacePlaceholders(loaded.getProperty("portone.http.read-timeout-ms"), new Properties()))
                .isEqualTo(String.valueOf(EXPECTED_READ_TIMEOUT_MS));
    }

    @Test
    @DisplayName("portOneRestTemplate 빈: 설정값을 connect/read 타임아웃으로 적용")
    void portOneRestTemplate_appliesConfiguredTimeouts() {
        RestTemplateBuilder builder = mock(RestTemplateBuilder.class);
        RestTemplateBuilder withConnect = mock(RestTemplateBuilder.class);
        RestTemplateBuilder withRead = mock(RestTemplateBuilder.class);
        RestTemplate built = new RestTemplate();
        when(builder.setConnectTimeout(Duration.ofMillis(EXPECTED_CONNECT_TIMEOUT_MS))).thenReturn(withConnect);
        when(withConnect.setReadTimeout(Duration.ofMillis(EXPECTED_READ_TIMEOUT_MS))).thenReturn(withRead);
        when(withRead.build()).thenReturn(built);

        RestTemplate result = new RestTemplateConfig().portOneRestTemplate(
                builder, EXPECTED_CONNECT_TIMEOUT_MS, EXPECTED_READ_TIMEOUT_MS);

        assertThat(result).isSameAs(built);
        verify(builder).setConnectTimeout(Duration.ofMillis(EXPECTED_CONNECT_TIMEOUT_MS));
        verify(withConnect).setReadTimeout(Duration.ofMillis(EXPECTED_READ_TIMEOUT_MS));
    }

    @Test
    @DisplayName("PortOne 연결 테스트·조회·취소·검증 서비스는 모두 타임아웃 적용 빈(portOneRestTemplate)만 주입")
    void portOneServices_injectTimeoutBoundRestTemplate() {
        assertThat(restTemplateQualifier(IamportConnectionTestServiceImpl.class))
                .isEqualTo(RestTemplateConfig.PORTONE_REST_TEMPLATE);
        assertThat(restTemplateQualifier(PortOneV2PaymentVerifyService.class))
                .isEqualTo(RestTemplateConfig.PORTONE_REST_TEMPLATE);
        assertThat(restTemplateQualifier(PortOneV2PaymentLookupService.class))
                .isEqualTo(RestTemplateConfig.PORTONE_REST_TEMPLATE);
        assertThat(restTemplateQualifier(PortOneV2PaymentCancelService.class))
                .isEqualTo(RestTemplateConfig.PORTONE_REST_TEMPLATE);
    }

    private static String restTemplateQualifier(Class<?> type) {
        for (Constructor<?> constructor : type.getDeclaredConstructors()) {
            for (Parameter parameter : constructor.getParameters()) {
                if (RestTemplate.class.equals(parameter.getType())) {
                    Qualifier qualifier = parameter.getAnnotation(Qualifier.class);
                    return qualifier == null ? null : qualifier.value();
                }
            }
        }
        return null;
    }
}
