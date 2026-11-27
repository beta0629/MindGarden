package com.coresolution.consultation.security.pii;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.coresolution.consultation.util.PersonalDataEncryptionKeyProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * {@link PiiCryptoService} — GCM 쓰기·CBC/평문 읽기·fail-closed.
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
@DisplayName("PiiCryptoService")
class PiiCryptoServiceTest {

    private static final String KEY_ID = "k1";
    private static final String KEY_VALUE = "unit-test-encryption-key-32-bytes!!";
    private static final String IV_VALUE = "unit-test-iv-16!";
    private static final String BODY = "내담자가 불안을 호소함.";

    private PiiCryptoService crypto;

    @BeforeEach
    void setUp() {
        PersonalDataEncryptionKeyProvider provider = newProvider(
            new String[] { "test" }, KEY_ID + ":" + KEY_VALUE, KEY_ID + ":" + IV_VALUE);
        provider.initialize();
        crypto = new PiiCryptoService(provider);
    }

    @Test
    @DisplayName("GCM 왕복")
    void gcm_roundTrip() {
        String cipher = crypto.encryptGcm(BODY);
        assertThat(cipher).startsWith(KEY_ID + ":v2::");
        assertThat(crypto.decryptCompatible(cipher)).isEqualTo(BODY);
        assertThat(crypto.encryptGcm(BODY)).isNotEqualTo(cipher);
    }

    @Test
    @DisplayName("CBC(v1) 읽기 호환")
    void cbc_readCompatible() {
        String cbc = crypto.encryptCbcForLegacyCompat(BODY);
        assertThat(cbc).startsWith(KEY_ID + "::");
        assertThat(crypto.decryptCompatible(cbc)).isEqualTo(BODY);
    }

    @Test
    @DisplayName("평문 읽기 호환")
    void plaintext_readCompatible() {
        assertThat(crypto.safeDecrypt(BODY)).isEqualTo(BODY);
    }

    @Test
    @DisplayName("쓰기 fail-closed — 활성 키 없음")
    void write_failClosed_whenNoKey() {
        PersonalDataEncryptionKeyProvider empty = new PersonalDataEncryptionKeyProvider(
            new MockEnvironment());
        ReflectionTestUtils.setField(empty, "keyVersions", "");
        ReflectionTestUtils.setField(empty, "ivVersions", "");
        ReflectionTestUtils.setField(empty, "activeKeyId", "");
        ReflectionTestUtils.setField(empty, "legacyKey", "");
        ReflectionTestUtils.setField(empty, "legacyIv", "");
        // 초기화하지 않은 provider — getActiveKey() null
        PiiCryptoService noKey = new PiiCryptoService(empty);
        assertThat(noKey.hasActiveKey()).isFalse();
        assertThatThrownBy(() -> noKey.encryptGcm(BODY))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("활성 암호화 키");
    }

    @Test
    @DisplayName("ensureActiveKeyEncryption — CBC→GCM")
    void ensureActive_upgradesCbcToGcm() {
        String cbc = crypto.encryptCbcForLegacyCompat(BODY);
        String upgraded = crypto.ensureActiveKeyEncryption(cbc);
        assertThat(PiiCipherFormats.looksV2(upgraded)).isTrue();
        assertThat(crypto.decryptCompatible(upgraded)).isEqualTo(BODY);
    }

    private PersonalDataEncryptionKeyProvider newProvider(String[] profiles, String keys, String ivs) {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles(profiles);
        PersonalDataEncryptionKeyProvider provider = new PersonalDataEncryptionKeyProvider(environment);
        ReflectionTestUtils.setField(provider, "keyVersions", keys);
        ReflectionTestUtils.setField(provider, "ivVersions", ivs);
        ReflectionTestUtils.setField(provider, "activeKeyId", "");
        ReflectionTestUtils.setField(provider, "legacyKey", "");
        ReflectionTestUtils.setField(provider, "legacyIv", "");
        return provider;
    }
}
