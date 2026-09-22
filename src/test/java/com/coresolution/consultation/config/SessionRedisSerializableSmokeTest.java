package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.CustomUserDetails;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.jackson2.SecurityJackson2Modules;

/**
 * Spring Session Redis 저장을 위한 Serializable / Jackson 계약 스모크.
 *
 * @author CoreSolution
 * @since 2026-09-22
 */
@DisplayName("Session Redis — User/CustomUserDetails Serializable")
class SessionRedisSerializableSmokeTest {

    @Test
    @DisplayName("CustomUserDetails 는 JDK 직렬화/역직렬화 가능")
    void customUserDetails_isSerializable() throws Exception {
        CustomUserDetails details = new CustomUserDetails(
                "u1",
                "user@example.com",
                "secret",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")),
                true,
                true,
                true,
                true);

        CustomUserDetails restored = roundTrip(details);
        assertThat(restored.getUserId()).isEqualTo("u1");
        assertThat(restored.getUsername()).isEqualTo("user@example.com");
        assertThat(restored.getAuthorities()).hasSize(1);
    }

    @Test
    @DisplayName("User 엔티티(소셜 컬렉션 transient) 는 JDK 직렬화 가능")
    void user_isSerializableWithoutSocialAccounts() throws Exception {
        User user = sampleUser();

        User restored = roundTrip(user);
        assertThat(restored.getId()).isEqualTo(42L);
        assertThat(restored.getTenantId()).isEqualTo("tenant-1");
        assertThat(restored.getEmail()).isEqualTo("user@example.com");
        assertThat(restored.getUserSocialAccounts()).isNull();
    }

    @Test
    @DisplayName("User 는 RedisSessionConfig 와 동일 Jackson serializer 로 왕복 가능하고 deleted 를 쓰지 않음")
    void user_jacksonRedisRoundTrip_doesNotEmitDeletedProperty() {
        GenericJackson2JsonRedisSerializer serializer = redisSessionSerializer();
        User user = sampleUser();

        byte[] bytes = serializer.serialize(user);
        assertThat(bytes).isNotNull();

        String json = new String(bytes, StandardCharsets.UTF_8);
        assertThat(json).doesNotContain("\"deleted\":");
        assertThat(json).doesNotContain("\"active\":");

        Object restored = serializer.deserialize(bytes);
        assertThat(restored).isInstanceOf(User.class);
        User restoredUser = (User) restored;
        assertThat(restoredUser.getId()).isEqualTo(42L);
        assertThat(restoredUser.getEmail()).isEqualTo("user@example.com");
        assertThat(restoredUser.getIsDeleted()).isFalse();
        assertThat(restoredUser.isDeleted()).isFalse();
    }

    @Test
    @DisplayName("기존 Redis JSON 의 deleted 필드는 FAIL_ON_UNKNOWN_PROPERTIES=false 로 fail-soft")
    void user_deserializeLegacyJsonWithDeletedField_succeeds() {
        ObjectMapper mapper = redisSessionObjectMapper();
        String legacyJson = "{"
                + "\"@class\":\"com.coresolution.consultation.entity.User\","
                + "\"id\":42,"
                + "\"tenantId\":\"tenant-1\","
                + "\"userId\":\"user42\","
                + "\"email\":\"user@example.com\","
                + "\"password\":\"hashed\","
                + "\"name\":\"테스트\","
                + "\"role\":\"ADMIN\","
                + "\"isActive\":true,"
                + "\"isDeleted\":false,"
                + "\"deleted\":false,"
                + "\"active\":true,"
                + "\"version\":0"
                + "}";

        assertThatCode(() -> {
            User restored = mapper.readValue(legacyJson, User.class);
            assertThat(restored.getId()).isEqualTo(42L);
            assertThat(restored.getIsDeleted()).isFalse();
            assertThat(restored.isDeleted()).isFalse();
        }).doesNotThrowAnyException();
    }

    /**
     * {@link RedisSessionConfig#springSessionDefaultRedisSerializer()} 와 동일 ObjectMapper 설정.
     */
    private static ObjectMapper redisSessionObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.registerModules(SecurityJackson2Modules.getModules(
                SessionRedisSerializableSmokeTest.class.getClassLoader()));
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        BasicPolymorphicTypeValidator typeValidator = BasicPolymorphicTypeValidator.builder()
                .allowIfSubType("com.coresolution.")
                .allowIfSubType("org.springframework.security.")
                .allowIfSubType("java.util.")
                .allowIfSubType("java.time.")
                .allowIfSubType("java.lang.")
                .build();
        mapper.activateDefaultTyping(typeValidator, ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY);
        return mapper;
    }

    private static GenericJackson2JsonRedisSerializer redisSessionSerializer() {
        return new GenericJackson2JsonRedisSerializer(redisSessionObjectMapper());
    }

    private static User sampleUser() {
        User user = new User();
        user.setId(42L);
        user.setTenantId("tenant-1");
        user.setUserId("user42");
        user.setEmail("user@example.com");
        user.setPassword("hashed");
        user.setName("테스트");
        user.setRole(UserRole.ADMIN);
        user.setIsActive(true);
        user.setIsDeleted(false);
        return user;
    }

    @SuppressWarnings("unchecked")
    private static <T> T roundTrip(T value) throws Exception {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        try (ObjectOutputStream oos = new ObjectOutputStream(bos)) {
            oos.writeObject(value);
        }
        try (ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(bos.toByteArray()))) {
            return (T) ois.readObject();
        }
    }
}
