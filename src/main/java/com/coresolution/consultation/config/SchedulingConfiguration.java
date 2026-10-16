package com.coresolution.consultation.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * {@code @EnableScheduling} 을 애플리케이션 클래스에서 분리한다.
 *
 * <p>테스트·로컬은 {@code spring.task.scheduling.enabled=false} 로 분 단위 스케줄러를 끈다.
 * 애플리케이션 클래스에 어노테이션이 있으면 이 속성이 무시되어, 매분 0초 스케줄러 SQL 이
 * Hibernate 통계에 섞이고 쿼리 수 가드레일이 흔들린다.</p>
 *
 * @author MindGarden
 * @since 2026-10-10
 */
@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "spring.task.scheduling.enabled", havingValue = "true", matchIfMissing = true)
public class SchedulingConfiguration {
}
