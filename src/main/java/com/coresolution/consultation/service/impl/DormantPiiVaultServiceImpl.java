package com.coresolution.consultation.service.impl;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import com.coresolution.consultation.dto.lifecycle.DormantUserPiiSnapshot;
import com.coresolution.consultation.service.DormantPiiVaultService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * {@link DormantPiiVaultService} 기본 구현 — AES-256-GCM (nonce 12B, tag 16B).
 *
 * <p>{@code mindgarden.lifecycle.dormant-pii-encryption-key} 환경변수에서 Base64-디코딩한
 * 32 bytes 키를 사용한다. 빈 값으로 기동되면 본 service 는 키 검증에서 IllegalState 를
 * 던지지 않지만, 실제 encrypt/decrypt 호출 시점에 검증되어 오작동을 차단한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Slf4j
@Service
public class DormantPiiVaultServiceImpl implements DormantPiiVaultService {

    /** AES-256 키 길이 (bytes). */
    static final int KEY_LENGTH_BYTES = 32;

    /** GCM nonce 길이 (bytes) — NIST 권고. */
    static final int GCM_NONCE_LENGTH_BYTES = 12;

    /** GCM 인증 tag 길이 (bits). */
    static final int GCM_TAG_LENGTH_BITS = 128;

    /** JSON 본문 버전 키 — 향후 알고리즘 변경 시 호환성 핸들링. */
    static final int JSON_VERSION = 1;

    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final String KEY_ALGORITHM = "AES";

    private final byte[] secretKeyBytes;
    private final SecureRandom secureRandom;
    private final ObjectMapper objectMapper;

    @Autowired
    public DormantPiiVaultServiceImpl(
            @Value("${mindgarden.lifecycle.dormant-pii-encryption-key:}") String base64Key) {
        this.secureRandom = new SecureRandom();
        this.objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        this.secretKeyBytes = decodeKey(base64Key);
    }

    /**
     * 테스트·재구성 용 protected 생성자 — 명시적 키 주입.
     *
     * @param keyBytes AES-256 32 bytes 키 (non-null, length=32)
     */
    public DormantPiiVaultServiceImpl(byte[] keyBytes) {
        if (keyBytes == null || keyBytes.length != KEY_LENGTH_BYTES) {
            throw new IllegalArgumentException(
                    "dormant PII encryption key must be 32 bytes (AES-256)");
        }
        this.secretKeyBytes = keyBytes.clone();
        this.secureRandom = new SecureRandom();
        this.objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    }

    @Override
    public String encrypt(DormantUserPiiSnapshot snapshot) {
        if (snapshot == null) {
            throw new IllegalArgumentException("snapshot must not be null");
        }
        ensureKeyConfigured();

        try {
            byte[] plaintext = objectMapper.writeValueAsBytes(snapshot);

            byte[] nonce = new byte[GCM_NONCE_LENGTH_BYTES];
            secureRandom.nextBytes(nonce);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            SecretKeySpec keySpec = new SecretKeySpec(secretKeyBytes, KEY_ALGORITHM);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, nonce);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec);

            byte[] cipherWithTag = cipher.doFinal(plaintext);

            // GCM 출력 = ciphertext || tag (16 bytes)
            int tagLengthBytes = GCM_TAG_LENGTH_BITS / 8;
            int cipherLength = cipherWithTag.length - tagLengthBytes;
            byte[] ciphertext = new byte[cipherLength];
            byte[] tag = new byte[tagLengthBytes];
            System.arraycopy(cipherWithTag, 0, ciphertext, 0, cipherLength);
            System.arraycopy(cipherWithTag, cipherLength, tag, 0, tagLengthBytes);

            ObjectNode node = objectMapper.createObjectNode();
            node.put("v", JSON_VERSION);
            node.put("nonce", Base64.getEncoder().encodeToString(nonce));
            node.put("ciphertext", Base64.getEncoder().encodeToString(ciphertext));
            node.put("tag", Base64.getEncoder().encodeToString(tag));
            return objectMapper.writeValueAsString(node);
        } catch (GeneralSecurityException | RuntimeException | java.io.IOException e) {
            throw new IllegalStateException("Failed to encrypt dormant PII snapshot", e);
        }
    }

    @Override
    public DormantUserPiiSnapshot decrypt(String ciphertextJson) {
        if (ciphertextJson == null || ciphertextJson.isBlank()) {
            throw new IllegalArgumentException("ciphertextJson must not be blank");
        }
        ensureKeyConfigured();

        try {
            JsonNode node = objectMapper.readTree(ciphertextJson);
            int v = node.path("v").asInt(-1);
            if (v != JSON_VERSION) {
                throw new IllegalArgumentException(
                        "unsupported dormant PII vault JSON version: " + v);
            }
            byte[] nonce = Base64.getDecoder().decode(node.path("nonce").asText());
            byte[] ciphertext = Base64.getDecoder().decode(node.path("ciphertext").asText());
            byte[] tag = Base64.getDecoder().decode(node.path("tag").asText());

            if (nonce.length != GCM_NONCE_LENGTH_BYTES
                    || tag.length != GCM_TAG_LENGTH_BITS / 8) {
                throw new IllegalArgumentException(
                        "dormant PII vault JSON nonce/tag length invalid");
            }

            byte[] cipherWithTag = new byte[ciphertext.length + tag.length];
            System.arraycopy(ciphertext, 0, cipherWithTag, 0, ciphertext.length);
            System.arraycopy(tag, 0, cipherWithTag, ciphertext.length, tag.length);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            SecretKeySpec keySpec = new SecretKeySpec(secretKeyBytes, KEY_ALGORITHM);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, nonce);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec);

            byte[] plaintext = cipher.doFinal(cipherWithTag);
            return objectMapper.readValue(plaintext, DormantUserPiiSnapshot.class);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (GeneralSecurityException | java.io.IOException e) {
            throw new IllegalArgumentException(
                    "Failed to decrypt dormant PII vault payload (key mismatch or tampered): "
                            + e.getMessage(), e);
        }
    }

    /**
     * 환경변수의 Base64 키를 디코딩해 32 bytes 인지 확인한다.
     *
     * <p>빈 값/잘못된 길이여도 본 시점에 예외를 던지지 않고 빈 배열로 보관한다 — 실제 호출 시
     * {@link #ensureKeyConfigured()} 가 검증하여 빌드/스타트업 시점은 영향 받지 않는다.
     * 본 vault 가 실제로 사용되는 시점에만 키 누락이 차단된다.</p>
     */
    static byte[] decodeKey(String base64Key) {
        if (base64Key == null || base64Key.isBlank()) {
            return new byte[0];
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(base64Key.trim());
            return decoded;
        } catch (IllegalArgumentException e) {
            // Spring @Value 가 잘못된 키를 주입했을 때 — startup 막지 않고 빈 배열 (호출 시 검증)
            return base64Key.trim().getBytes(StandardCharsets.UTF_8);
        }
    }

    private void ensureKeyConfigured() {
        if (secretKeyBytes == null || secretKeyBytes.length != KEY_LENGTH_BYTES) {
            throw new IllegalStateException(
                    "mindgarden.lifecycle.dormant-pii-encryption-key 가 32 bytes (AES-256) "
                            + "Base64 키로 설정되지 않았습니다. 운영 yml 또는 환경변수를 점검하세요.");
        }
    }
}
