package com.coresolution.integrationtest.clientevent;

import com.coresolution.consultation.controller.ClientEventBackfillController;
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
 * {@link ClientEventBackfillController} MockMvc 전용 최소 부트스트랩.
 *
 * @author MindGarden
 * @since 2026-11-26
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
@Import({ClientEventBackfillController.class, GlobalExceptionHandler.class})
public class ClientEventBackfillControllerMvcTestApplication {
}
