package com.coresolution.consultation.security.pii;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.util.PersonalDataEncryptionKeyProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * {@link PiiBlindIndexListener} — 동일 평문 → 동일 HMAC, GCM 암호문에서도 해시 가능.
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
@DisplayName("PiiBlindIndexListener")
class PiiBlindIndexListenerTest {

    private PiiCryptoService crypto;
    private PiiHmacService hmac;
    private PiiBlindIndexListener listener;

    @BeforeEach
    void setUp() {
        PersonalDataEncryptionKeyProvider provider =
            new PersonalDataEncryptionKeyProvider(new MockEnvironment());
        ReflectionTestUtils.setField(provider, "activeKeyId", "k1");
        ReflectionTestUtils.setField(provider, "keyVersions",
            "k1:unit-test-encryption-key-32-bytes!!");
        ReflectionTestUtils.setField(provider, "ivVersions", "k1:unit-test-iv-16!");
        ReflectionTestUtils.setField(provider, "legacyKey", "");
        ReflectionTestUtils.setField(provider, "legacyIv", "");
        provider.initialize();
        crypto = new PiiCryptoService(provider);
        hmac = PiiTestSecrets.hmacService();
        PiiEncryptionContextHolder.setInstanceForTesting(crypto);
        PiiHmacContextHolder.setInstanceForTesting(hmac);
        listener = new PiiBlindIndexListener();
    }

    @AfterEach
    void tearDown() {
        PiiEncryptionContextHolder.setInstanceForTesting(null);
        PiiHmacContextHolder.setInstanceForTesting(null);
    }

    @Test
    @DisplayName("동일 이메일(대소문자·공백 정규화) → 동일 email_hash")
    void sameEmail_sameHash() {
        User a = User.builder().email("  Alice@Example.COM ").build();
        User b = User.builder().email("alice@example.com").build();
        listener.prePersist(a);
        listener.prePersist(b);
        assertThat(a.getEmailHash()).isEqualTo(b.getEmailHash());
        assertThat(a.getEmailHash()).isEqualTo(hmac.hmacHex("alice@example.com"));
    }

    @Test
    @DisplayName("GCM 저장 이메일에서도 복호화 후 동일 email_hash")
    void gcmStoredEmail_stillHashesToSame() {
        String plain = "user@example.com";
        String cipher1 = crypto.encryptGcm(plain);
        String cipher2 = crypto.encryptGcm(plain);
        assertThat(cipher1).isNotEqualTo(cipher2);

        User u1 = User.builder().email(cipher1).build();
        User u2 = User.builder().email(cipher2).build();
        listener.prePersist(u1);
        listener.prePersist(u2);
        assertThat(u1.getEmailHash()).isEqualTo(u2.getEmailHash());
        assertThat(u1.getEmailHash()).isEqualTo(hmac.hmacHex(plain));
    }

    @Test
    @DisplayName("동일 전화 정규화 → 동일 phone_hash")
    void samePhone_sameHash() {
        User a = User.builder().phone("010-1234-5678").build();
        User b = User.builder().phone("01012345678").build();
        listener.prePersist(a);
        listener.prePersist(b);
        assertThat(a.getPhoneHash()).isEqualTo(b.getPhoneHash());
        assertThat(a.getPhoneHash()).isEqualTo(hmac.hmacHex("01012345678"));
    }

    @Test
    @DisplayName("HMAC 시크릿 없으면 fail-closed")
    void missingSecret_throws() {
        PiiHmacContextHolder.setInstanceForTesting(new PiiHmacService(""));
        User u = User.builder().email("a@b.com").build();
        assertThatThrownBy(() -> listener.prePersist(u))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("HMAC");
    }
}
