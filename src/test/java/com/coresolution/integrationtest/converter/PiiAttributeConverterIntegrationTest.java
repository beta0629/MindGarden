package com.coresolution.integrationtest.converter;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.NotificationChannelPreferenceCode;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.integrationtest.support.AbstractIntegrationTest;
import java.time.LocalDateTime;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

/**
 * PII AttributeConverter (Email / PersonalName / Phone) JPA 통합 round-trip 테스트.
 *
 * <p>{@link com.coresolution.consultation.converter.EmailAttributeConverter},
 * {@link com.coresolution.consultation.converter.PersonalNameAttributeConverter},
 * {@link com.coresolution.consultation.converter.PhoneAttributeConverter} 가 실제
 * Hibernate 컨텍스트에서 다음 계약을 만족하는지 검증한다.
 * <ul>
 *   <li>save 시점에 평문 → AES-256/CBC 암호문으로 컬럼에 저장된다 (JdbcTemplate 로
 *       raw SELECT 시 활성 키 prefix "{keyId}::" 가 보임)</li>
 *   <li>findById 등 load 시점에 컬럼 암호문 → 평문 entity 필드 복원</li>
 *   <li>멱등성: 서비스 레이어가 수동 {@code safeEncrypt} 한 cipher 를 entity 에 set 하더라도
 *       Converter 가 이중 암호화하지 않는다 (DB 에는 1차 cipher 그대로 저장)</li>
 * </ul>
 * </p>
 *
 * @author CoreSolution
 * @since 2026-06-14
 */
@DisplayName("PII AttributeConverter — JPA 통합 round-trip (User 엔티티)")
@Transactional
class PiiAttributeConverterIntegrationTest extends AbstractIntegrationTest {

    private static final String TEST_TENANT_ID = "pr4-pii-converter-tenant";

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PersonalDataEncryptionUtil encryptionUtil;

    @PersistenceContext
    private EntityManager entityManager;

    @AfterEach
    void cleanup() {
        jdbcTemplate.update("DELETE FROM users WHERE tenant_id = ?", TEST_TENANT_ID);
    }

    @Test
    @DisplayName("save: 평문 entity 필드가 DB 컬럼에는 활성 키 prefix 가 붙은 cipher 로 저장된다")
    void save_persistsEncryptedColumn() {
        User user = newPlainUser("alice-pr4@example.com", "홍길동", "010-1234-5678", "길동이");

        User saved = userRepository.saveAndFlush(user);
        entityManager.clear();

        String rawEmail = jdbcTemplate.queryForObject(
            "SELECT email FROM users WHERE id = ?", String.class, saved.getId());
        String rawName = jdbcTemplate.queryForObject(
            "SELECT name FROM users WHERE id = ?", String.class, saved.getId());
        String rawPhone = jdbcTemplate.queryForObject(
            "SELECT phone FROM users WHERE id = ?", String.class, saved.getId());
        String rawNickname = jdbcTemplate.queryForObject(
            "SELECT nickname FROM users WHERE id = ?", String.class, saved.getId());

        String activeKeyId = encryptionUtil.getActiveKeyId();
        assertThat(rawEmail).startsWith(activeKeyId + "::");
        assertThat(rawName).startsWith(activeKeyId + "::");
        assertThat(rawPhone).startsWith(activeKeyId + "::");
        assertThat(rawNickname).startsWith(activeKeyId + "::");

        assertThat(rawEmail).doesNotContain("alice-pr4@example.com");
        assertThat(rawName).doesNotContain("홍길동");
        assertThat(rawPhone).doesNotContain("010-1234-5678");
    }

    @Test
    @DisplayName("load: DB 의 cipher 컬럼이 entity 로드 시 평문 필드로 복원된다 (round-trip)")
    void load_decryptsToPlaintext() {
        User user = newPlainUser("bob-pr4@example.com", "이영희", "010-9999-0000", "영희님");
        User saved = userRepository.saveAndFlush(user);
        Long id = saved.getId();
        entityManager.clear();

        User reloaded = userRepository.findById(id).orElseThrow();

        assertThat(reloaded.getEmail()).isEqualTo("bob-pr4@example.com");
        assertThat(reloaded.getName()).isEqualTo("이영희");
        assertThat(reloaded.getPhone()).isEqualTo("010-9999-0000");
        assertThat(reloaded.getNickname()).isEqualTo("영희님");
    }

    @Test
    @DisplayName("멱등성: 서비스 레이어가 수동 safeEncrypt 후 set 한 cipher 도 이중 암호화되지 않는다")
    void idempotent_serviceLayerManualEncryptCoexists() {
        String plainEmail = "carol-pr4@example.com";
        String preEncryptedEmail = encryptionUtil.safeEncrypt(plainEmail);
        assertThat(preEncryptedEmail).startsWith(encryptionUtil.getActiveKeyId() + "::");

        User user = newPlainUser(plainEmail, "박지성", "010-5555-6666", "지성");
        user.setEmail(preEncryptedEmail);
        User saved = userRepository.saveAndFlush(user);
        Long id = saved.getId();
        entityManager.clear();

        String rawEmail = jdbcTemplate.queryForObject(
            "SELECT email FROM users WHERE id = ?", String.class, id);
        long delimiterCount = rawEmail.chars().filter(c -> c == ':').count();

        assertThat(delimiterCount).isEqualTo(2);

        User reloaded = userRepository.findById(id).orElseThrow();
        assertThat(reloaded.getEmail()).isEqualTo(plainEmail);
    }

    @Test
    @DisplayName("NULL 안전: nullable 컬럼(phone, nickname) 은 평문 set NULL 시 DB NULL 그대로 저장된다")
    void nullable_columnRemainsNullThroughConverter() {
        User user = newPlainUser("dave-pr4@example.com", "최영수", null, null);

        User saved = userRepository.saveAndFlush(user);
        Long id = saved.getId();
        entityManager.clear();

        String rawPhone = jdbcTemplate.queryForObject(
            "SELECT phone FROM users WHERE id = ?", String.class, id);
        String rawNickname = jdbcTemplate.queryForObject(
            "SELECT nickname FROM users WHERE id = ?", String.class, id);
        assertThat(rawPhone).isNull();
        assertThat(rawNickname).isNull();

        User reloaded = userRepository.findById(id).orElseThrow();
        assertThat(reloaded.getPhone()).isNull();
        assertThat(reloaded.getNickname()).isNull();
        assertThat(reloaded.getEmail()).isEqualTo("dave-pr4@example.com");
        assertThat(reloaded.getName()).isEqualTo("최영수");
    }

    private User newPlainUser(String email, String name, String phone, String nickname) {
        User user = User.builder()
            .userId("pr4-" + Math.abs(email.hashCode()))
            .email(email)
            .name(name)
            .phone(phone)
            .nickname(nickname)
            .password("encoded-pwd-placeholder")
            .role(UserRole.CLIENT)
            .counselingEnabled(false)
            .isEmailVerified(false)
            .isActive(true)
            .isSocialAccount(false)
            .isPasswordChanged(true)
            .lifecycleState(LifecycleState.ACTIVE)
            .notificationChannelPreference(NotificationChannelPreferenceCode.TENANT_DEFAULT.name())
            .build();
        user.setTenantId(TEST_TENANT_ID);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setIsDeleted(false);
        return user;
    }
}
