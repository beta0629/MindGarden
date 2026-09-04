package com.coresolution.testsupport;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * {@link SecurityContextIsolationExtension} 회귀 가드.
 *
 * <p>Extension 이 AfterEach 시점에 {@link SecurityContextHolder} 를 비워서
 * 후속 테스트로 인증 정보가 누설되지 않는지 검증한다. PR #234 (commit
 * {@code 63b2fd2c}) 가 발견한 누설 패턴을 controller 단위 테스트 전체에 적용한 후,
 * 표준 자체가 회귀하지 않도록 lock-in 한다.</p>
 *
 * <p>테스트 순서를 명시 고정하여 "오염 → 격리" 시나리오를 deterministic 하게 재현한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-12
 */
@ExtendWith(SecurityContextIsolationExtension.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SecurityContextIsolationExtensionTest {

    @Test
    @Order(1)
    @DisplayName("①: SecurityContext 에 Authentication 을 주입한 채 테스트 종료 → Extension 의 afterEach 가 청소")
    void firstTestPollutesSecurityContext() {
        Authentication injected = new UsernamePasswordAuthenticationToken(
                "leak-canary@mindgarden.test", null, java.util.Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(injected);

        assertThat(SecurityContextHolder.getContext().getAuthentication())
                .as("본 테스트 내부에서는 주입한 Authentication 이 보여야 함")
                .isSameAs(injected);
    }

    @Test
    @Order(2)
    @DisplayName("②: 선행 테스트가 오염시킨 SecurityContext 가 본 테스트로 누설되지 않는다")
    void secondTestIsIsolatedFromPriorPollution() {
        Authentication current = SecurityContextHolder.getContext().getAuthentication();
        assertThat(current)
                .as("선행 테스트(①)가 주입한 Authentication 이 Extension 의 afterEach 에 의해 정리되어야 함")
                .isNull();
    }
}
