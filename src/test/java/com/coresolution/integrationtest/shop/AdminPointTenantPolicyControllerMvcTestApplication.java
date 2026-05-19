package com.coresolution.integrationtest.shop;

import com.coresolution.consultation.controller.AdminPointTenantPolicyController;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

/**
 * {@link AdminPointTenantPolicyController} MockMvc 전용 최소 부트스트랩.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Configuration
@EnableAutoConfiguration(exclude = {
        DataSourceAutoConfiguration.class,
        HibernateJpaAutoConfiguration.class,
        FlywayAutoConfiguration.class,
        RedisAutoConfiguration.class,
        RedisRepositoriesAutoConfiguration.class
})
@EnableMethodSecurity(prePostEnabled = true)
@Import({AdminPointTenantPolicyController.class, GlobalExceptionHandler.class})
public class AdminPointTenantPolicyControllerMvcTestApplication {
}
