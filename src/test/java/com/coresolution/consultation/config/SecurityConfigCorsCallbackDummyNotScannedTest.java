package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;

/**
 * PR #215 회귀 방어 — {@link SecurityConfigCorsCallbackTest.DummyController} 가
 * Spring 컴포넌트 스캔에 절대 잡히지 않음을 보증한다.
 *
 * <p>배경: PR #215 에서 {@code DummyController} 가 {@code @RestController}
 * (= {@code @Controller} → {@code @Component}) 로 선언되어
 * {@code RequestMappingHandlerMapping} 빈 생성 시점에 운영 컨트롤러
 * (예: {@code AppleSignInController}) 와 ambiguous mapping 충돌이 발생하여
 * {@code WebSecurityConfiguration} autowire 실패 → 30+ {@code @SpringBootTest}
 * 동시 ApplicationContext 로딩 실패가 누적되었다.</p>
 *
 * <p>본 테스트는 ApplicationContext 가 정상 부팅된 뒤
 * {@code DummyController} 빈이 컨테이너에 존재하지 않음을 두 가지 방식으로 검증한다.
 *   <ol>
 *     <li>{@link ApplicationContext#getBeansOfType(Class)} 결과가 비어 있어야 한다.</li>
 *     <li>{@link ApplicationContext#containsBean(String) containsBean("dummyController") == false} 여야 한다.</li>
 *   </ol>
 * 둘 중 하나라도 위반되면 동일한 회귀가 재발한 것이므로 즉시 빌드를 차단한다.</p>
 *
 * <p>안전 패턴 참고: {@code BearerTokenAuthCsrfMatcherIntegrationTest} 134-148
 * ({@code @ConditionalOnProperty} 가드 + {@code /test-csrf} prefix).</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@DisplayName("PR #215 회귀 방어 — DummyController 컴포넌트 스캔 차단")
class SecurityConfigCorsCallbackDummyNotScannedTest {

    private static final String DUMMY_CONTROLLER_BEAN_NAME = "dummyController";

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    @DisplayName("getBeansOfType(DummyController.class) 결과가 비어 있어야 한다")
    void dummyController_isNotRegisteredAsBeanByType() {
        assertThat(applicationContext.getBeansOfType(SecurityConfigCorsCallbackTest.DummyController.class))
                .as("PR #215 회귀 — DummyController 가 컴포넌트 스캔에 잡히면 운영 컨트롤러와 ambiguous mapping 충돌 발생")
                .isEmpty();
    }

    @Test
    @DisplayName("containsBean(\"dummyController\") == false 여야 한다")
    void dummyController_isNotRegisteredAsBeanByName() {
        assertThat(applicationContext.containsBean(DUMMY_CONTROLLER_BEAN_NAME))
                .as("PR #215 회귀 — DummyController 가 'dummyController' 빈 이름으로 등록되면 ambiguous mapping 충돌 발생")
                .isFalse();
    }
}
