package com.coresolution.consultation.security.pii;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.util.PersonalDataEncryptionKeyProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 운영 키 전략 B: 신규 활성 키 + 기존 키링 보조(복호화 전용).
 * 기존 v1(CBC)·v2 암호문은 그대로 복호화되고, 새 쓰기는 신규 keyId 의 v2 여야 한다.
 */
@DisplayName("PII 키링 회전 (신규 활성 + 기존 보조)")
class PiiKeyringRotationDecryptTest {

    private static final String OLD_ID = "oldk";
    private static final String NEW_ID = "newk";
    private static final String OLD_KEY = "unit-test-old-encryption-key-32b!!";
    private static final String NEW_KEY = "unit-test-new-encryption-key-32b!!";
    private static final String OLD_IV = "unit-test-old16!";
    private static final String NEW_IV = "unit-test-new16!";
    private static final String BODY = "기존 서명자 이름 샘플";

    @Test
    @DisplayName("기존 보조 키로 v1(CBC)·v2 복호화, 새 쓰기는 신규 keyId v2")
    void newActive_oldAuxiliary_decryptsLegacyAndWritesNewV2() {
        PersonalDataEncryptionKeyProvider oldOnly = provider(OLD_ID, entry(OLD_ID, OLD_KEY), entry(OLD_ID, OLD_IV));
        oldOnly.initialize();
        PiiCryptoService oldCrypto = new PiiCryptoService(oldOnly);

        String v1 = oldCrypto.encryptCbcForLegacyCompat(BODY);
        String v2 = oldCrypto.encryptGcm(BODY);
        assertThat(v1).startsWith(OLD_ID + "::");
        assertThat(v2).startsWith(OLD_ID + ":v2::");
        assertThat(v1).doesNotContain(":v2::");

        PersonalDataEncryptionKeyProvider rotated = provider(
            NEW_ID,
            entry(NEW_ID, NEW_KEY) + "," + entry(OLD_ID, OLD_KEY),
            entry(NEW_ID, NEW_IV) + "," + entry(OLD_ID, OLD_IV));
        rotated.initialize();
        PiiCryptoService rotatedCrypto = new PiiCryptoService(rotated);

        assertThat(rotated.getActiveKeyId()).isEqualTo(NEW_ID);
        assertThat(rotated.hasKey(OLD_ID)).isTrue();
        assertThat(rotatedCrypto.decryptCompatible(v1)).isEqualTo(BODY);
        assertThat(rotatedCrypto.decryptCompatible(v2)).isEqualTo(BODY);

        String written = rotatedCrypto.encryptGcm(BODY);
        assertThat(written).startsWith(NEW_ID + ":v2::");
        assertThat(written).doesNotStartWith(OLD_ID + ":");
        assertThat(rotatedCrypto.decryptCompatible(written)).isEqualTo(BODY);
    }

    private static String entry(String id, String value) {
        return id + ":" + value;
    }

    private static PersonalDataEncryptionKeyProvider provider(String activeKeyId, String keys, String ivs) {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("test");
        PersonalDataEncryptionKeyProvider provider = new PersonalDataEncryptionKeyProvider(environment);
        ReflectionTestUtils.setField(provider, "keyVersions", keys);
        ReflectionTestUtils.setField(provider, "ivVersions", ivs);
        ReflectionTestUtils.setField(provider, "activeKeyId", activeKeyId);
        ReflectionTestUtils.setField(provider, "legacyKey", "");
        ReflectionTestUtils.setField(provider, "legacyIv", "");
        return provider;
    }
}
