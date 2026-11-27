package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 개인정보 암호화 스킴 검증 — v1 결정적(조회용) · v2 랜덤 IV(본문용) · 키 미설정 fail-fast.
 *
 * <p>컬럼별 스킴은 아래와 같이 나뉜다.</p>
 * <ul>
 *   <li><strong>v1 고정 IV (결정적)</strong> — {@code user.email}·{@code user.phone} 등.
 *       {@code findByEmail}·{@code existsByPhone} 같은 동등 비교 조회가 암호문 일치에
 *       의존하므로 랜덤 IV 로 바꿀 수 없다.</li>
 *   <li><strong>v2 랜덤 IV (AES-GCM)</strong> — 상담일지 본문·초안 payload 등 서술형 컬럼.
 *       동등 비교 조회가 없다.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("PersonalDataEncryption 스킴")
class PersonalDataEncryptionSchemeTest {

    private static final String KEY_ID = "k1";
    private static final String KEY_VALUE = "unit-test-encryption-key-32-bytes!!";
    private static final String IV_VALUE = "unit-test-iv-16!";
    private static final String BODY = "내담자가 불안을 호소함. 다음 회기에 호흡 훈련 예정.";
    private static final String EMAIL = "client@example.com";

    private PersonalDataEncryptionUtil util;

    /**
     * 활성 키 1개로 초기화된 provider 를 만든다.
     *
     * @param profiles 활성 프로파일
     * @param keys key-versions 설정 값
     * @param ivs iv-versions 설정 값
     * @return 초기화된 provider
     */
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

    @BeforeEach
    void setUp() {
        PersonalDataEncryptionKeyProvider provider = newProvider(
            new String[] { "test" }, KEY_ID + ":" + KEY_VALUE, KEY_ID + ":" + IV_VALUE);
        provider.initialize();
        util = new PersonalDataEncryptionUtil(provider);
    }

    @Test
    @DisplayName("v2 랜덤 IV — 왕복 복호화된다")
    void randomIv_roundTrip() {
        String cipher = util.encryptWithRandomIv(BODY);

        assertThat(cipher).startsWith(KEY_ID + ":v2::");
        assertThat(util.isRandomIvEncrypted(cipher)).isTrue();
        assertThat(util.extractKeyVersion(cipher)).isEqualTo(KEY_ID);
        assertThat(util.decrypt(cipher)).isEqualTo(BODY);
    }

    @Test
    @DisplayName("v2 랜덤 IV — 같은 평문을 두 번 암호화하면 암호문이 다르다")
    void randomIv_twoEncryptionsDiffer() {
        String first = util.encryptWithRandomIv(BODY);
        String second = util.encryptWithRandomIv(BODY);

        assertThat(first).isNotEqualTo(second);
        assertThat(util.decrypt(first)).isEqualTo(BODY);
        assertThat(util.decrypt(second)).isEqualTo(BODY);
    }

    @Test
    @DisplayName("v1 고정 IV — 조회용 컬럼은 같은 평문이 같은 암호문이어야 한다 (findByEmail 의존)")
    void deterministic_sameCipherForLookupColumns() {
        String first = util.encrypt(EMAIL);
        String second = util.encrypt(EMAIL);

        assertThat(first).isEqualTo(second);
        assertThat(util.isRandomIvEncrypted(first)).isFalse();
        assertThat(util.decrypt(first)).isEqualTo(EMAIL);
    }

    @Test
    @DisplayName("혼재 읽기 — v1(#1409 형식) 암호문도 그대로 복호화된다")
    void mixedRead_legacyV1StillDecrypts() {
        String legacyCipher = util.encrypt(BODY);

        assertThat(legacyCipher).startsWith(KEY_ID + "::");
        assertThat(util.decrypt(legacyCipher)).isEqualTo(BODY);
    }

    @Test
    @DisplayName("혼재 읽기 — 마커 없는 평문은 그대로 반환된다")
    void mixedRead_plainTextPassesThrough() {
        assertThat(util.safeDecrypt(BODY)).isEqualTo(BODY);
    }

    @Test
    @DisplayName("손상된 v2 암호문은 예외 없이 원본을 반환한다 (목록 전체 500 금지)")
    void corruptedCipher_doesNotThrow() {
        String cipher = util.encryptWithRandomIv(BODY);
        String corrupted = cipher.substring(0, cipher.length() - 6) + "AAAAAA";

        assertThat(util.decrypt(corrupted)).isNotNull();
        assertThat(util.decrypt(KEY_ID + ":v2::not-base64!!")).isNotNull();
        assertThat(util.decrypt(KEY_ID + ":v2::QUJD")).isNotNull();
    }

    @Test
    @DisplayName("회전 시 스킴 유지 — v2 는 v2 로, v1 은 v1 로 재암호화된다")
    void ensureActiveKeyEncryption_keepsScheme() {
        String v2Cipher = util.encryptWithRandomIv(BODY);
        String v1Cipher = util.encrypt(EMAIL);

        assertThat(util.ensureActiveKeyEncryption(v2Cipher)).isEqualTo(v2Cipher);
        assertThat(util.ensureActiveKeyEncryption(v1Cipher)).isEqualTo(v1Cipher);
    }

    @Test
    @DisplayName("fail-fast — local/test 가 아닌 프로파일에서 키가 없으면 기동이 중단된다")
    void missingKey_failsFastOutsideLocalAndTest() {
        for (String profile : new String[] { "dev", "prod" }) {
            PersonalDataEncryptionKeyProvider provider =
                newProvider(new String[] { profile }, "", "");

            assertThatThrownBy(provider::initialize)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("암호화 키가 설정되지 않았습니다")
                .hasMessageContaining("PERSONAL_DATA_ENCRYPTION_KEYS")
                .hasMessageContaining(profile);
        }
    }

    @Test
    @DisplayName("fail-fast — 프로파일이 비어 있어도(기본 기동) 키 없이는 기동하지 않는다")
    void missingKey_failsFastWithoutActiveProfile() {
        PersonalDataEncryptionKeyProvider provider = newProvider(new String[0], "", "");

        assertThatThrownBy(provider::initialize).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("fail-fast — local/test 도 코드 폴백 키 없이는 기동하지 않고 설정 파일을 안내한다")
    void missingKey_localAndTestHaveNoCodeFallback() {
        for (String profile : new String[] { "local", "test" }) {
            PersonalDataEncryptionKeyProvider provider =
                newProvider(new String[] { profile }, "", "");

            assertThatThrownBy(provider::initialize)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("application-" + profile + ".yml");
        }
    }

    @Test
    @DisplayName("fail-fast — IV 가 없으면 keyId 를 알려주며 기동을 중단한다")
    void missingIv_failsFast() {
        PersonalDataEncryptionKeyProvider provider =
            newProvider(new String[] { "dev" }, KEY_ID + ":" + KEY_VALUE, "");

        assertThatThrownBy(provider::initialize)
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("IV가 설정되지 않았습니다")
            .hasMessageContaining(KEY_ID);
    }
}
