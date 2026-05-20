package com.coresolution.consultation.integration.solapi;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 솔라피 HMAC 서명 결정값(determinism) 검증.
 *
 * @author CoreSolution
 * @since 2026-05-20
 */
@DisplayName("SolapiSignatureSigner")
class SolapiSignatureSignerTest {

    /**
     * 동일 입력에 대해 동일한 hex 서명을 반환해야 한다.
     * 사전 계산: HMAC-SHA256(secret, date+salt) → hex
     */
    @Test
    @DisplayName("sign(): 동일 입력 → 동일 서명(hex)")
    void signProducesDeterministicValue() {
        SolapiSignatureSigner signer = new SolapiSignatureSigner();
        String secret = "TEST_SECRET_VALUE_123456789012345";
        String date = "2026-05-20T03:14:15Z";
        String salt = "abcdef0123456789abcdef0123456789";

        String signature = signer.sign(secret, date, salt);

        assertThat(signature)
            .isEqualTo("ba43bccbb3ded561b26eed60f6edd6c73f6f086b62cee6ceb5744c399934de5e");
    }

    @Test
    @DisplayName("buildAuthorizationHeader(): 헤더 포맷이 Solapi 사양과 일치")
    void buildHeaderMatchesSolapiSpec() {
        SolapiSignatureSigner signer = new SolapiSignatureSigner();
        String apiKey = "NCSXXXXXXXXX";
        String secret = "TEST_SECRET_VALUE_123456789012345";
        String date = "2026-05-20T03:14:15Z";
        String salt = "abcdef0123456789abcdef0123456789";

        String header = signer.buildAuthorizationHeader(apiKey, secret, date, salt);

        assertThat(header).isEqualTo(
            "HMAC-SHA256 apiKey=NCSXXXXXXXXX, date=2026-05-20T03:14:15Z,"
                + " salt=abcdef0123456789abcdef0123456789,"
                + " signature=ba43bccbb3ded561b26eed60f6edd6c73f6f086b62cee6ceb5744c399934de5e");
    }

    @Test
    @DisplayName("generateSalt(): 32자 hex 문자열 반환")
    void generateSaltReturnsHex32() {
        SolapiSignatureSigner signer = new SolapiSignatureSigner();
        String salt = signer.generateSalt();
        assertThat(salt).hasSize(32).matches("^[0-9a-f]{32}$");
    }

    @Test
    @DisplayName("currentDate(): ISO-8601 UTC(Z) 포맷")
    void currentDateReturnsIsoInstant() {
        SolapiSignatureSigner signer = new SolapiSignatureSigner();
        String date = signer.currentDate();
        assertThat(date).matches("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z$");
    }

    @Test
    @DisplayName("sign(): null/empty 입력 → IllegalArgumentException")
    void signRejectsBlankInputs() {
        SolapiSignatureSigner signer = new SolapiSignatureSigner();
        assertThatThrownBy(() -> signer.sign(null, "d", "saltsaltsalt"))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> signer.sign("s", "", "saltsaltsalt"))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> signer.sign("s", "d", null))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("buildAuthorizationHeader(): salt가 12자 미만이면 IllegalArgumentException")
    void buildHeaderRejectsShortSalt() {
        SolapiSignatureSigner signer = new SolapiSignatureSigner();
        assertThatThrownBy(() -> signer.buildAuthorizationHeader("k", "s", "2026-05-20T00:00:00Z", "short"))
            .isInstanceOf(IllegalArgumentException.class);
    }
}
