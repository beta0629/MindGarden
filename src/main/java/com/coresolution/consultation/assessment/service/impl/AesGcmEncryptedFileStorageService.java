package com.coresolution.consultation.assessment.service.impl;

import com.coresolution.consultation.assessment.service.EncryptedFileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Slf4j
@Service
public class AesGcmEncryptedFileStorageService implements EncryptedFileStorageService {

    private static final String KEY_VERSION_ENV = "PSYCH_DOC_KEY_VERSION";
    private static final String KEY_B64_ENV = "PSYCH_DOC_KEY_B64";
    private static final int GCM_TAG_BITS = 128;
    private static final int IV_BYTES = 12;

    @Value("${psych.assessment.storage.base-dir:./uploads/psych-assessments}")
    private String baseDir;

    @Override
    public StoredEncryptedFile storePdf(String tenantId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있습니다.");
        }
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId가 필요합니다.");
        }

        String keyVersion = StringUtils.hasText(System.getenv(KEY_VERSION_ENV))
                ? System.getenv(KEY_VERSION_ENV)
                : "v1";
        SecretKey key = loadKeyFromEnv();

        try {
            Files.createDirectories(Path.of(baseDir, tenantId));
            byte[] iv = new byte[IV_BYTES];
            new SecureRandom().nextBytes(iv);

            String originalFilename = file.getOriginalFilename();
            String contentType = file.getContentType();
            long size = file.getSize();

            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            Path outPath = Path.of(baseDir, tenantId,
                    System.currentTimeMillis() + "_" + Math.abs(new SecureRandom().nextInt()) + ".bin");

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));

            try (InputStream in = file.getInputStream();
                 DigestInputStream din = new DigestInputStream(in, sha256)) {

                byte[] plain = din.readAllBytes();
                byte[] encrypted = cipher.doFinal(plain);

                // file format: [iv(12)] + [ciphertext+tag]
                byte[] payload = new byte[iv.length + encrypted.length];
                System.arraycopy(iv, 0, payload, 0, iv.length);
                System.arraycopy(encrypted, 0, payload, iv.length, encrypted.length);
                Files.write(outPath, payload);
            }

            String shaHex = bytesToHex(sha256.digest());
            log.info("Encrypted PDF stored: tenantId={}, path={}, sha256={}", tenantId, outPath, shaHex);

            return new StoredEncryptedFile(
                    outPath.toString(),
                    shaHex,
                    size,
                    contentType,
                    originalFilename,
                    keyVersion
            );
        } catch (Exception e) {
            throw new RuntimeException("파일 저장(암호화)에 실패했습니다: " + e.getMessage(), e);
        }
    }

    private SecretKey loadKeyFromEnv() {
        String b64 = System.getenv(KEY_B64_ENV);
        if (!StringUtils.hasText(b64)) {
            throw new IllegalStateException("암호화 키가 필요합니다: " + KEY_B64_ENV);
        }
        byte[] keyBytes = Base64.getDecoder().decode(b64);
        if (keyBytes.length != 16 && keyBytes.length != 24 && keyBytes.length != 32) {
            throw new IllegalStateException("AES 키 길이가 올바르지 않습니다(16/24/32 bytes): " + keyBytes.length);
        }
        return new SecretKeySpec(keyBytes, "AES");
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}


