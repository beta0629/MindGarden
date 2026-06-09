package com.coresolution.integrationtest.support;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;

/**
 * {@link AbstractIntegrationTest} 부팅 smoke 통합 테스트.
 *
 * <p>본 베이스를 상속한 가장 단순한 통합 테스트가 정상 컨텍스트 부팅하는지 회귀 검증한다.
 * 부팅 실패 시 {@link AbstractIntegrationTest} 의 시그니처(설정 classes, profiles 등) 변경이
 * 다른 47+ {@code *IntegrationTest.java} 컨텍스트 캐시까지 깨트리므로 baseline 으로 보존한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@DisplayName("AbstractIntegrationTest — 컨텍스트 부팅 smoke")
class AbstractIntegrationTestBootSmokeIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    @DisplayName("ApplicationContext 가 정상 부팅하고 ConsultationManagementApplication 설정이 등록된다")
    void contextLoads_consultationManagementApplicationIsConfigured() {
        assertThat(applicationContext).isNotNull();
        assertThat(applicationContext.getId())
                .as("ApplicationContext id 가 비어 있지 않아야 한다")
                .isNotBlank();
    }
}
