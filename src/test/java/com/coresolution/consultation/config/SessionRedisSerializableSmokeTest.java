package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.Collections;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.CustomUserDetails;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

/**
 * Spring Session Redis 저장을 위한 Serializable 계약 스모크.
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

        User restored = roundTrip(user);
        assertThat(restored.getId()).isEqualTo(42L);
        assertThat(restored.getTenantId()).isEqualTo("tenant-1");
        assertThat(restored.getEmail()).isEqualTo("user@example.com");
        assertThat(restored.getUserSocialAccounts()).isNull();
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
