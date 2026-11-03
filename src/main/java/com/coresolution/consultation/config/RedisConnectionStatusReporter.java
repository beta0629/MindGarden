package com.coresolution.consultation.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 기동 완료 시 Redis 연결 사용 여부를 INFO 한 줄로 남긴다.
 *
 * <p>비밀번호·시크릿은 로그에 포함하지 않는다. host 미설정·ping 실패여도 기동을 중단하지 않으며,
 * opaque 토큰 스토어 등의 메모리 폴백과 정합한다.
 * ApplicationReady 리스너 중 일찍 남겨 배포 점검이 파일 로그에서 찾을 수 있게 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-11-02
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RedisConnectionStatusReporter {

    static final String ENV_REDIS_HOST = "REDIS_HOST";
    static final String PROP_REDIS_HOST = "spring.data.redis.host";
    static final String STATUS_IN_USE = "IN_USE";
    static final String STATUS_MEMORY_FALLBACK = "MEMORY_FALLBACK";
    static final String PING_OK = "PONG";

    private final Environment environment;
    private final ObjectProvider<RedisConnectionFactory> redisConnectionFactory;

    /**
     * 애플리케이션 준비 완료 후 Redis 연결 상태를 한 줄 INFO로 기록한다.
     *
     * @param event 애플리케이션 준비 이벤트
     */
    @Order(Ordered.HIGHEST_PRECEDENCE)
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady(ApplicationReadyEvent event) {
        String host = resolveRedisHost(environment);
        String pingResult = null;
        if (StringUtils.hasText(host)) {
            pingResult = tryPing(redisConnectionFactory);
        }
        log.info(buildStatusLine(host, pingResult));
    }

    /**
     * Redis host 프로퍼티를 해석한다. {@code REDIS_HOST} 우선, 없으면 {@code spring.data.redis.host}.
     *
     * @param environment 환경
     * @return host 문자열(공백만 있으면 null에 가깝게 취급되도록 trim), 없으면 null/빈 문자열
     */
    static String resolveRedisHost(Environment environment) {
        String fromEnv = environment.getProperty(ENV_REDIS_HOST);
        if (StringUtils.hasText(fromEnv)) {
            return fromEnv.trim();
        }
        String fromProp = environment.getProperty(PROP_REDIS_HOST);
        return StringUtils.hasText(fromProp) ? fromProp.trim() : fromProp;
    }

    /**
     * Redis 사용 여부 상태 한 줄을 만든다. 비밀번호·시크릿은 포함하지 않는다.
     *
     * @param redisHost  host (비어 있으면 unset)
     * @param pingResult ping 성공 시 응답(보통 PONG), 실패·빈 없음이면 {@code null}
     * @return INFO 로그용 한 줄
     */
    static String buildStatusLine(String redisHost, String pingResult) {
        if (!StringUtils.hasText(redisHost)) {
            return "Redis connection status: " + STATUS_MEMORY_FALLBACK + " (REDIS_HOST unset)";
        }
        if (pingResult != null && PING_OK.equalsIgnoreCase(pingResult.trim())) {
            return "Redis connection status: " + STATUS_IN_USE + " (ping=" + PING_OK + ")";
        }
        return "Redis connection status: " + STATUS_MEMORY_FALLBACK + " (connection failed)";
    }

    /**
     * RedisConnectionFactory로 PING을 시도한다. 실패·빈 없음 시 null.
     *
     * @param factoryProvider ConnectionFactory provider
     * @return ping 응답 또는 null
     */
    static String tryPing(ObjectProvider<RedisConnectionFactory> factoryProvider) {
        RedisConnectionFactory factory = factoryProvider.getIfAvailable();
        if (factory == null) {
            return null;
        }
        RedisConnection connection = null;
        try {
            connection = factory.getConnection();
            String pong = connection.ping();
            return StringUtils.hasText(pong) ? pong.trim() : null;
        } catch (Exception ex) {
            log.debug("Redis ping 실패(기동 계속, 메모리 폴백 가능): {}", ex.getClass().getSimpleName());
            return null;
        } finally {
            if (connection != null) {
                try {
                    connection.close();
                } catch (Exception closeEx) {
                    log.debug("Redis ping 연결 종료 실패: {}", closeEx.getClass().getSimpleName());
                }
            }
        }
    }
}
