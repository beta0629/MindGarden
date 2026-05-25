package com.coresolution.core.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;

/**
 * Spring Retry 활성화 설정 (핫픽스 2026-05-25, N1 후속).
 *
 * <p>{@code statistics_values} {@link org.hibernate.StaleStateException} 잔여 사건은
 * 무중단 BG 배포의 비대칭 윈도우(green 슬롯 핫픽스 미적용 시점에 blue와 동시 실행)로
 * 결정되었다. 양 슬롯 핫픽스 적용 후 19:00 KST부터 자연 해소되었으나, 동일 윈도우가
 * 재발할 경우를 대비해 재발 방지 권고 1순위로 {@code @Retryable} 보강을 활성화한다.</p>
 *
 * <p>적용 대상: {@code StatisticsMetadataServiceImpl#calculateStatistic} —
 * {@link org.springframework.orm.ObjectOptimisticLockingFailureException},
 * {@link org.springframework.dao.DataIntegrityViolationException},
 * {@link org.hibernate.StaleStateException} 발생 시 최대 1회 재시도(initial 100ms,
 * multiplier 2). 재시도 후에도 실패하면 기존 동작(rollback + 다음 정시 재시도) 유지.</p>
 *
 * <p>본 설정은 클래스패스에 {@code spring-retry} 및 {@code spring-aspects} 가 존재해야
 * 동작하며, {@code pom.xml} 의 동일 시점 변경과 함께 적용된다.</p>
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-05-25
 */
@Configuration
@EnableRetry
public class RetryConfig {
}
