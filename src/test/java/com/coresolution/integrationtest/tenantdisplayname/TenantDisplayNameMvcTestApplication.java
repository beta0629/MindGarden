package com.coresolution.integrationtest.tenantdisplayname;

import com.coresolution.core.controller.TenantDisplayNameController;
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
 * TenantDisplayNameController MockMvc 전용 최소 부트스트랩.
 * <p>
 * {@code com.coresolution.consultation} 이하에 두면 메인 애플리케이션 컴포넌트 스캔에
 * 흡수되어 {@code @EnableAutoConfiguration(exclude=…)} 가 전역에 적용되어 JPA 컨텍스트가 깨지므로,
 * 스캔 대상 밖 패키지({@code com.coresolution.integrationtest})에 둔다.
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
@Import({TenantDisplayNameController.class, AccessDeniedToForbiddenAdvice.class})
public class TenantDisplayNameMvcTestApplication {
}
