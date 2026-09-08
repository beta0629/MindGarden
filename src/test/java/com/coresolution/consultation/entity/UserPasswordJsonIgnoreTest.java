package com.coresolution.consultation.entity;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.coresolution.consultation.constant.UserRole;
import java.time.LocalDateTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * User 엔티티 JSON 직렬화 시 비밀 필드 미노출 검증.
 *
 * @author MindGarden
 * @since 2026-09-08
 */
@DisplayName("User JSON — password 등 비밀 필드 미노출")
class UserPasswordJsonIgnoreTest {

    @Test
    @DisplayName("password / resetToken / resetExpiresAt 이 JSON에 포함되지 않음")
    void passwordFields_areNotSerialized() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setUserId("user-json");
        user.setEmail("user@example.com");
        user.setName("테스트");
        user.setPassword("super-secret-password-hash");
        user.setPasswordResetToken("reset-token-value");
        user.setPasswordResetExpiresAt(LocalDateTime.of(2026, 9, 8, 12, 0));
        user.setRole(UserRole.CLIENT);
        user.setIsActive(true);

        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
        String json = mapper.writeValueAsString(user);

        assertThat(json).doesNotContain("super-secret-password-hash");
        assertThat(json).doesNotContain("reset-token-value");
        assertThat(json).doesNotContain("\"password\"");
        assertThat(json).doesNotContain("passwordResetToken");
        assertThat(json).doesNotContain("passwordResetExpiresAt");
        assertThat(json).contains("user@example.com");
    }
}
