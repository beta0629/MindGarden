package com.coresolution.consultation.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.security.jackson2.SecurityJackson2Modules;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

/**
 * Spring Session Redis 직렬화 설정.
 *
 * <p>선택 근거: HttpSession 에 {@code User} 엔티티·SecurityContext 가 들어가고 Hibernate
 * 컬렉션·프록시는 JDK 직렬화에 적대적이므로, {@code springSessionDefaultRedisSerializer}
 * 빈으로 GenericJackson2JsonRedisSerializer + SecurityJackson2Modules 를 사용한다.
 * User 의 LAZY 컬렉션은 {@code transient}/{@code @JsonIgnore} 로 직렬화 대상에서 제외한다.</p>
 *
 * <p>{@code spring.session.store-type=redis} 인 프로파일(prod 등)에서만 활성화.
 * local/test 는 store-type=none + Redis autoconfig exclude 로 서블릿 세션을 유지한다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-22
 */
@Configuration
@ConditionalOnProperty(name = "spring.session.store-type", havingValue = "redis")
public class RedisSessionConfig {

    /**
     * Spring Session Redis 기본 serializer.
     *
     * @return Jackson 기반 RedisSerializer
     */
    @Bean(name = "springSessionDefaultRedisSerializer")
    public RedisSerializer<Object> springSessionDefaultRedisSerializer() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.registerModules(SecurityJackson2Modules.getModules(getClass().getClassLoader()));
        // 기존 세션 JSON 에 남아 있는 "deleted"/"active" 등 미인식 필드 fail-soft
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        // NON_FINAL + allowlist: session 속성에 넣는 도메인 타입만 역직렬화 허용
        BasicPolymorphicTypeValidator typeValidator = BasicPolymorphicTypeValidator.builder()
                .allowIfSubType("com.coresolution.")
                .allowIfSubType("org.springframework.security.")
                .allowIfSubType("java.util.")
                .allowIfSubType("java.time.")
                .allowIfSubType("java.lang.")
                .build();
        mapper.activateDefaultTyping(typeValidator, ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY);
        return new GenericJackson2JsonRedisSerializer(mapper);
    }
}
