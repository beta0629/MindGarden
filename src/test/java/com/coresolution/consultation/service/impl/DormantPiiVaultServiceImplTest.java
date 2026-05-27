package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.Base64;

import com.coresolution.consultation.dto.lifecycle.DormantUserPiiSnapshot;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link DormantPiiVaultServiceImpl} AES-256-GCM 단위 테스트 — Phase 3.
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@DisplayName("DormantPiiVaultServiceImpl — AES-256-GCM 라운드트립 + 가드")
class DormantPiiVaultServiceImplTest {

    private static byte[] randomKey() {
        byte[] key = new byte[DormantPiiVaultServiceImpl.KEY_LENGTH_BYTES];
        new SecureRandom().nextBytes(key);
        return key;
    }

    @Test
    @DisplayName("encrypt → decrypt 라운드트립 — 모든 PII 필드 보존")
    void roundTrip_preservesAllFields() {
        DormantPiiVaultServiceImpl service = new DormantPiiVaultServiceImpl(randomKey());

        DormantUserPiiSnapshot original = DormantUserPiiSnapshot.builder()
                .email("user@example.com")
                .name("홍길동")
                .nickname("길동이")
                .phone("010-1234-5678")
                .gender("MALE")
                .birthDate(LocalDate.of(1990, 1, 15))
                .address("서울시 강남구")
                .addressDetail("테헤란로 1")
                .postalCode("06000")
                .rrnEncrypted("encrypted-rrn-blob")
                .profileImageUrl("https://example.com/me.png")
                .build();

        String json = service.encrypt(original);
        assertThat(json).contains("\"v\":1").contains("\"nonce\":").contains("\"ciphertext\":")
                .contains("\"tag\":");

        DormantUserPiiSnapshot restored = service.decrypt(json);
        assertThat(restored.getEmail()).isEqualTo(original.getEmail());
        assertThat(restored.getName()).isEqualTo(original.getName());
        assertThat(restored.getNickname()).isEqualTo(original.getNickname());
        assertThat(restored.getPhone()).isEqualTo(original.getPhone());
        assertThat(restored.getGender()).isEqualTo(original.getGender());
        assertThat(restored.getBirthDate()).isEqualTo(original.getBirthDate());
        assertThat(restored.getAddress()).isEqualTo(original.getAddress());
        assertThat(restored.getAddressDetail()).isEqualTo(original.getAddressDetail());
        assertThat(restored.getPostalCode()).isEqualTo(original.getPostalCode());
        assertThat(restored.getRrnEncrypted()).isEqualTo(original.getRrnEncrypted());
        assertThat(restored.getProfileImageUrl()).isEqualTo(original.getProfileImageUrl());
    }

    @Test
    @DisplayName("encrypt: 동일 입력이라도 매 호출 nonce 가 신규 생성됨 (출력 다름)")
    void encrypt_uses_fresh_nonce_each_call() {
        DormantPiiVaultServiceImpl service = new DormantPiiVaultServiceImpl(randomKey());

        DormantUserPiiSnapshot snapshot = DormantUserPiiSnapshot.builder()
                .email("x@example.com").name("이름").build();

        String first = service.encrypt(snapshot);
        String second = service.encrypt(snapshot);

        assertThat(first).isNotEqualTo(second);
    }

    @Test
    @DisplayName("decrypt: 키 불일치 시 IllegalArgumentException")
    void decrypt_keyMismatch_throws() {
        DormantPiiVaultServiceImpl encryptService = new DormantPiiVaultServiceImpl(randomKey());
        DormantPiiVaultServiceImpl decryptService = new DormantPiiVaultServiceImpl(randomKey());

        String json = encryptService.encrypt(DormantUserPiiSnapshot.builder()
                .email("x@example.com").build());

        assertThatThrownBy(() -> decryptService.decrypt(json))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Spring @Value 생성자: 빈 키로 기동 — encrypt 호출 시점에만 IllegalStateException")
    void emptyKey_failsLazyOnEncrypt() {
        DormantPiiVaultServiceImpl service = new DormantPiiVaultServiceImpl("");

        assertThatThrownBy(() -> service.encrypt(DormantUserPiiSnapshot.builder().build()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("dormant-pii-encryption-key");
    }

    @Test
    @DisplayName("Spring @Value 생성자: Base64 디코딩된 32 bytes 키 정상 동작")
    void base64Key_decodedCorrectly() {
        byte[] keyBytes = randomKey();
        String base64Key = Base64.getEncoder().encodeToString(keyBytes);
        DormantPiiVaultServiceImpl service = new DormantPiiVaultServiceImpl(base64Key);

        DormantUserPiiSnapshot snapshot = DormantUserPiiSnapshot.builder()
                .email("base64@example.com").build();
        String json = service.encrypt(snapshot);
        DormantUserPiiSnapshot restored = service.decrypt(json);

        assertThat(restored.getEmail()).isEqualTo("base64@example.com");
    }

    @Test
    @DisplayName("decrypt: null/blank JSON 입력 — IllegalArgumentException")
    void decrypt_nullInput_throws() {
        DormantPiiVaultServiceImpl service = new DormantPiiVaultServiceImpl(randomKey());

        assertThatThrownBy(() -> service.decrypt(null))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.decrypt(""))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
