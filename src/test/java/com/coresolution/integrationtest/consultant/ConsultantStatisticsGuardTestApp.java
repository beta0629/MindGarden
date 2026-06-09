package com.coresolution.integrationtest.consultant;

import com.coresolution.consultation.controller.ConsultantController;
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
 * {@code ConsultantController} 통계 가드 슬라이스 테스트({@code ConsultantControllerStatisticsGuardTest})
 * 전용 최소 부트스트랩.
 *
 * <p><strong>왜 별도 패키지에 두는가</strong>: 메인 앱
 * {@code ConsultationManagementApplication} 의
 * {@code @ComponentScan(basePackages = {"com.coresolution.consultation", "com.coresolution.core",
 * "com.coresolution.user"})} 에 흡수되면 본 클래스의
 * {@code @EnableAutoConfiguration(exclude={DataSourceAutoConfiguration, HibernateJpaAutoConfiguration,
 * FlywayAutoConfiguration, ...})} 이 다른 SpringBootTest 컨텍스트(예: {@code
 * MeditationsUnauthenticatedSecurityMvcIntegrationTest}) 에까지 전역 적용되어
 * {@code entityManagerFactory} 빈이 생성되지 못해 ApplicationContext 부팅 실패가 연쇄적으로 발생한다.
 * 이것이 develop CI {@code mvn test} 16+분 hang(2026-06-03 이후) 의 핵심 원인이었다.</p>
 *
 * <p>{@code com.coresolution.integrationtest.*} 패키지는 메인 {@code @ComponentScan} 범위 밖이므로
 * 본 부트스트랩 클래스는 {@code @SpringBootTest(classes = ConsultantStatisticsGuardTestApp.class)}
 * 로 명시 참조될 때만 활성화된다(다른 통합 테스트의 컨텍스트 cache 와 격리됨).</p>
 *
 * @author MindGarden
 * @since 2026-06-09
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
@Import({ConsultantController.class, GlobalExceptionHandler.class})
public class ConsultantStatisticsGuardTestApp {
}
