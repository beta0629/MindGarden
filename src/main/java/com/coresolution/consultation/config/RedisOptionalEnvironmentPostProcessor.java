package com.coresolution.consultation.config;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.util.StringUtils;

/**
 * Redis host가 비어 있을 때 빈 host로 자동구성을 깨지 않도록 처리한다.
 *
 * <p>{@code REDIS_HOST} 또는 {@code spring.data.redis.host}가 non-blank이면 host를 설정하고
 * Redis를 사용한다. blank/미설정이면 Redis 관련 자동구성을 exclude하고
 * {@code mindgarden.redis.enabled=false}로 MEMORY_FALLBACK 경로를 연다.</p>
 *
 * <p>ConfigData(application-*.yml) 로드 이후에 실행되도록 낮은 우선순위를 사용한다.</p>
 *
 * @author CoreSolution
 * @since 2026-11-02
 */
@Order(Ordered.LOWEST_PRECEDENCE)
public class RedisOptionalEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    static final String PROPERTY_SOURCE_NAME = "redisOptionalEnvironment";
    static final String ENV_REDIS_HOST = "REDIS_HOST";
    static final String PROP_REDIS_HOST = "spring.data.redis.host";
    static final String PROP_REDIS_ENABLED = "mindgarden.redis.enabled";
    static final String PROP_AUTOCONFIGURE_EXCLUDE = "spring.autoconfigure.exclude";

    static final String REDIS_AUTO_CONFIGURATION =
            "org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration";
    static final String REDIS_REPOSITORIES_AUTO_CONFIGURATION =
            "org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration";
    static final String REDIS_HEALTH_CONTRIBUTOR_AUTO_CONFIGURATION =
            "org.springframework.boot.actuate.autoconfigure.data.redis.RedisHealthContributorAutoConfiguration";
    static final String REDIS_REACTIVE_HEALTH_CONTRIBUTOR_AUTO_CONFIGURATION =
            "org.springframework.boot.actuate.autoconfigure.data.redis.RedisReactiveHealthContributorAutoConfiguration";

    private static final List<String> REDIS_EXCLUDES = List.of(
            REDIS_AUTO_CONFIGURATION,
            REDIS_REPOSITORIES_AUTO_CONFIGURATION,
            REDIS_HEALTH_CONTRIBUTOR_AUTO_CONFIGURATION,
            REDIS_REACTIVE_HEALTH_CONTRIBUTOR_AUTO_CONFIGURATION
    );

    /**
     * Redis host 유무에 따라 Environment에 enable 또는 exclude 프로퍼티를 추가한다.
     *
     * @param environment 설정 가능한 환경
     * @param application Spring 애플리케이션
     */
    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String host = resolveNonBlankHost(environment);
        if (host != null) {
            applyRedisEnabled(environment, host);
            return;
        }
        applyRedisDisabled(environment);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }

    /**
     * REDIS_HOST 우선, 없으면 spring.data.redis.host. blank/whitespace면 null.
     *
     * @param environment 환경
     * @return trim된 host 또는 null
     */
    static String resolveNonBlankHost(ConfigurableEnvironment environment) {
        String fromEnv = environment.getProperty(ENV_REDIS_HOST);
        if (StringUtils.hasText(fromEnv)) {
            return fromEnv.trim();
        }
        String fromProp = environment.getProperty(PROP_REDIS_HOST);
        if (StringUtils.hasText(fromProp)) {
            return fromProp.trim();
        }
        return null;
    }

    /**
     * 기존 spring.autoconfigure.exclude 와 Redis exclude 목록을 병합한다.
     *
     * @param environment 환경
     * @return 병합된 exclude FQCN 목록(삽입 순서 유지)
     */
    static List<String> mergeRedisExcludes(ConfigurableEnvironment environment) {
        Set<String> merged = new LinkedHashSet<>();
        List<String> existing = Binder.get(environment)
                .bind(PROP_AUTOCONFIGURE_EXCLUDE, Bindable.listOf(String.class))
                .orElseGet(List::of);
        for (String item : existing) {
            if (StringUtils.hasText(item)) {
                merged.add(item.trim());
            }
        }
        merged.addAll(REDIS_EXCLUDES);
        return new ArrayList<>(merged);
    }

    private static void applyRedisEnabled(ConfigurableEnvironment environment, String host) {
        Map<String, Object> map = new HashMap<>();
        map.put(PROP_REDIS_HOST, host);
        map.put(PROP_REDIS_ENABLED, "true");
        environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, map));
    }

    private static void applyRedisDisabled(ConfigurableEnvironment environment) {
        List<String> excludes = mergeRedisExcludes(environment);
        Map<String, Object> map = new HashMap<>();
        map.put(PROP_REDIS_ENABLED, "false");
        map.put(PROP_AUTOCONFIGURE_EXCLUDE, String.join(",", excludes));
        environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, map));
    }
}
