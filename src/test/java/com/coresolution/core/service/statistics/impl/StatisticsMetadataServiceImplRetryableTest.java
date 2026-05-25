package com.coresolution.core.service.statistics.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import com.coresolution.core.domain.statistics.StatisticsDefinition;
import com.coresolution.core.domain.statistics.StatisticsGenerationLog;
import com.coresolution.core.domain.statistics.StatisticsValue;
import com.coresolution.core.repository.statistics.StatisticsDefinitionRepository;
import com.coresolution.core.repository.statistics.StatisticsGenerationLogRepository;
import com.coresolution.core.repository.statistics.StatisticsValueRepository;
import com.coresolution.core.service.statistics.StatisticsCalculationEngine;
import org.hibernate.StaleStateException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.retry.annotation.Retryable;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

/**
 * {@link StatisticsMetadataServiceImpl#calculateStatistic} 의 {@link Retryable} 보강
 * 검증 (핫픽스 2026-05-25, N1 후속).
 *
 * <p>무중단 배포 비대칭 윈도우에서 {@code statistics_values} 잔여 {@link StaleStateException}
 * / {@link ObjectOptimisticLockingFailureException} / {@link DataIntegrityViolationException}
 * 에 대해 1회 자동 재시도하도록 부착된 어노테이션 메타데이터와 실제 재시도 동작을 검증한다.</p>
 *
 * <p>구조:</p>
 * <ul>
 *   <li>{@link AnnotationMetadata} — reflection 으로 어노테이션 메타데이터(클래스 3종,
 *       maxAttempts, backoff.delay) 검증.</li>
 *   <li>{@link RetryBehavior} — {@link EnableRetry} + mock 의존성으로 실제 재시도 호출
 *       카운트 검증 (1회 실패 → 2회차 성공).</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-25
 */
class StatisticsMetadataServiceImplRetryableTest {

    @Nested
    @DisplayName("@Retryable 어노테이션 메타데이터 (reflection)")
    class AnnotationMetadata {

        @Test
        @DisplayName("calculateStatistic — @Retryable 부착, retryFor 3종(Optimistic/DataIntegrity/StaleState), maxAttempts=2, backoff.delay=100, multiplier=2")
        void calculateStatistic_hasRetryableAnnotation() throws NoSuchMethodException {
            Method method = StatisticsMetadataServiceImpl.class.getDeclaredMethod(
                "calculateStatistic", String.class, String.class, LocalDate.class, Map.class
            );

            Retryable retryable = method.getAnnotation(Retryable.class);

            assertThat(retryable)
                .as("calculateStatistic 는 N1 후속 권고 1순위로 @Retryable 부착되어야 한다")
                .isNotNull();
            assertThat(retryable.maxAttempts())
                .as("maxAttempts=2 (초기 시도 1회 + 재시도 1회)")
                .isEqualTo(2);
            assertThat(retryable.retryFor())
                .as("retryFor: OptimisticLocking, DataIntegrityViolation, StaleState 3종")
                .containsExactlyInAnyOrder(
                    ObjectOptimisticLockingFailureException.class,
                    DataIntegrityViolationException.class,
                    StaleStateException.class
                );

            Backoff backoff = retryable.backoff();
            assertThat(backoff.delay())
                .as("backoff.delay=100ms")
                .isEqualTo(100L);
            assertThat(backoff.multiplier())
                .as("backoff.multiplier=2")
                .isEqualTo(2.0);
        }
    }

    @Nested
    @DisplayName("Spring Retry 실제 동작 (mock + @EnableRetry)")
    @SpringJUnitConfig(RetryBehavior.RetryBehaviorTestConfig.class)
    class RetryBehavior {

        @Autowired
        private StatisticsMetadataServiceImpl service;

        @Autowired
        private StatisticsDefinitionRepository definitionRepository;

        @Autowired
        private StatisticsValueRepository valueRepository;

        @Autowired
        private StatisticsCalculationEngine calculationEngine;

        @Autowired
        private StatisticsGenerationLogRepository logRepository;

        @Test
        @DisplayName("ObjectOptimisticLockingFailureException 1회 발생 시 1회 재시도 후 성공")
        void retriesOnceOnOptimisticLockingFailure() {
            // Given
            String tenantId = "tenant-a";
            String statisticCode = "TEST_CODE";
            LocalDate date = LocalDate.of(2026, 5, 25);

            StatisticsDefinition definition = new StatisticsDefinition();
            definition.setTenantId(tenantId);
            definition.setStatisticCode(statisticCode);
            when(definitionRepository.findByStatisticCodeAndTenantId(statisticCode, tenantId))
                .thenReturn(java.util.List.of(definition));

            when(valueRepository.findByTenantIdAndStatisticCodeAndCalculationDate(
                tenantId, statisticCode, date)
            ).thenReturn(Optional.empty());

            when(calculationEngine.calculate(eq(definition), eq(date), any()))
                .thenReturn(BigDecimal.valueOf(42));

            when(valueRepository.save(any(StatisticsValue.class)))
                .thenThrow(new ObjectOptimisticLockingFailureException(StatisticsValue.class, 1L))
                .thenAnswer(invocation -> invocation.getArgument(0));

            when(logRepository.save(any(StatisticsGenerationLog.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

            // When
            BigDecimal result = service.calculateStatistic(tenantId, statisticCode, date, Map.of());

            // Then
            assertThat(result)
                .as("2회차 시도에서 성공 — 계산 결과 반환")
                .isEqualByComparingTo(BigDecimal.valueOf(42));

            verify(valueRepository, times(2))
                .save(any(StatisticsValue.class));
        }

        @TestConfiguration
        @EnableRetry(proxyTargetClass = true)
        static class RetryBehaviorTestConfig {

            @Bean
            StatisticsDefinitionRepository statisticsDefinitionRepository() {
                return mock(StatisticsDefinitionRepository.class);
            }

            @Bean
            StatisticsGenerationLogRepository statisticsGenerationLogRepository() {
                return mock(StatisticsGenerationLogRepository.class);
            }

            @Bean
            StatisticsValueRepository statisticsValueRepository() {
                return mock(StatisticsValueRepository.class);
            }

            @Bean
            StatisticsCalculationEngine statisticsCalculationEngine() {
                return mock(StatisticsCalculationEngine.class);
            }

            @Bean
            StatisticsMetadataServiceImpl statisticsMetadataServiceImpl(
                StatisticsDefinitionRepository definitionRepository,
                StatisticsGenerationLogRepository logRepository,
                StatisticsValueRepository valueRepository,
                StatisticsCalculationEngine calculationEngine
            ) {
                return new StatisticsMetadataServiceImpl(
                    definitionRepository, logRepository, valueRepository, calculationEngine
                );
            }
        }
    }
}
