package com.coresolution.integrationtest.onboarding;

import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.core.controller.OnboardingController;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

/**
 * {@link OnboardingController} MockMvc 전용 최소 부트스트랩.
 * <p>
 * {@code com.coresolution.consultation} 이하에 두면 메인 애플리케이션 스캔에 흡수될 수 있어
 * {@code com.coresolution.integrationtest} 패키지에 둔다.
 *
 * @author CoreSolution
 * @since 2026-04-11
 */
@Configuration
@EnableAutoConfiguration(exclude = {
        DataSourceAutoConfiguration.class,
        HibernateJpaAutoConfiguration.class,
        FlywayAutoConfiguration.class,
        RedisAutoConfiguration.class,
        RedisRepositoriesAutoConfiguration.class
})
@Import({OnboardingController.class, GlobalExceptionHandler.class})
public class OnboardingControllerMvcTestApplication {
}
