package com.coresolution.consultation.security.pii;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.util.PersonalDataEncryptionKeyProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * {@link PiiLegacyUpgradeSupport} — 복호화 실패 시 GCM 재암호화·HMAC 방지.
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
@DisplayName("PiiLegacyUpgradeSupport fail-closed")
class PiiLegacyUpgradeSupportTest {

    private static final String KEY_ID = "k1";
    private static final String KEY_VALUE = "unit-test-encryption-key-32-bytes!!";
    private static final String IV_VALUE = "unit-test-iv-16!";
    private static final String BODY = "홍길동";

    private PiiCryptoService crypto;

    @BeforeEach
    void setUp() {
        crypto = newCrypto(KEY_ID + ":" + KEY_VALUE, KEY_ID + ":" + IV_VALUE);
    }

    @Test
    @DisplayName("upgradeCipher — 읽을 수 없는 v1 암호문은 null, GCM wrap 없음")
    void upgradeCipher_unreadableV1_returnsNullWithoutGcmWrap() {
        // 동일 keyId 이지만 다른 키링(ops→.dev 덮어쓰기 시나리오)
        PiiCryptoService otherRing = newCrypto(
            KEY_ID + ":other-ring-encryption-key-32b-!!",
            KEY_ID + ":other-ring-iv-16!");
        String foreignCbc = otherRing.encryptCbcForLegacyCompat(BODY);
        assertThat(PiiCipherFormats.looksV1(foreignCbc)).isTrue();

        PiiLegacyUpgradeSupport.UpgradeCounts counts = new PiiLegacyUpgradeSupport.UpgradeCounts();
        String upgraded = PiiLegacyUpgradeSupport.upgradeCipher(crypto, foreignCbc, counts);

        assertThat(upgraded).isNull();
        assertThat(counts.cipherUpdated).isZero();
        assertThat(counts.skipped).isEqualTo(1);
        // decryptCompatible 은 읽기 fail-open 으로 원본 반환 — 그걸 GCM 으로 감싸지 않았는지
        assertThat(crypto.decryptCompatible(foreignCbc)).isEqualTo(foreignCbc);
    }

    @Test
    @DisplayName("upgradeCipher — 가짜 v1 마커 암호문도 skip")
    void upgradeCipher_fakeV1Marker_skips() {
        String fake = "k1::YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=";
        assertThat(PiiCipherFormats.looksEncrypted(fake)).isTrue();

        PiiLegacyUpgradeSupport.UpgradeCounts counts = new PiiLegacyUpgradeSupport.UpgradeCounts();
        String upgraded = PiiLegacyUpgradeSupport.upgradeCipher(crypto, fake, counts);

        assertThat(upgraded).isNull();
        assertThat(counts.skipped).isEqualTo(1);
        assertThat(counts.cipherUpdated).isZero();
    }

    @Test
    @DisplayName("upgradeCipher — CBC→GCM 정상")
    void upgradeCipher_cbcToGcm_happyPath() {
        String cbc = crypto.encryptCbcForLegacyCompat(BODY);
        PiiLegacyUpgradeSupport.UpgradeCounts counts = new PiiLegacyUpgradeSupport.UpgradeCounts();
        String upgraded = PiiLegacyUpgradeSupport.upgradeCipher(crypto, cbc, counts);

        assertThat(upgraded).isNotNull();
        assertThat(PiiCipherFormats.looksV2(upgraded)).isTrue();
        assertThat(crypto.decryptCompatible(upgraded)).isEqualTo(BODY);
        assertThat(counts.cipherUpdated).isEqualTo(1);
        assertThat(counts.skipped).isZero();
    }

    @Test
    @DisplayName("plainFrom — 복호화 실패 시 null (HMAC 방지)")
    void plainFrom_decryptFailure_returnsNull() {
        PiiCryptoService otherRing = newCrypto(
            KEY_ID + ":other-ring-encryption-key-32b-!!",
            KEY_ID + ":other-ring-iv-16!");
        String foreignCbc = otherRing.encryptCbcForLegacyCompat("01012345678");

        assertThat(PiiLegacyUpgradeSupport.plainFrom(crypto, foreignCbc)).isNull();
        assertThat(PiiLegacyUpgradeSupport.plainFrom(crypto, "01012345678"))
            .isEqualTo("01012345678");
    }

    private static PiiCryptoService newCrypto(String keys, String ivs) {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("test");
        PersonalDataEncryptionKeyProvider provider =
            new PersonalDataEncryptionKeyProvider(environment);
        ReflectionTestUtils.setField(provider, "keyVersions", keys);
        ReflectionTestUtils.setField(provider, "ivVersions", ivs);
        ReflectionTestUtils.setField(provider, "activeKeyId", "");
        ReflectionTestUtils.setField(provider, "legacyKey", "");
        ReflectionTestUtils.setField(provider, "legacyIv", "");
        provider.initialize();
        return new PiiCryptoService(provider);
    }
}
