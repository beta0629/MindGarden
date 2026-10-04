package com.coresolution.consultation.service.support;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Arrays;
import javax.crypto.Cipher;
import javax.crypto.CipherOutputStream;
import javax.crypto.spec.GCMParameterSpec;
import org.springframework.stereotype.Component;
import com.coresolution.consultation.util.PersonalDataEncryptionKeyProvider;
import com.coresolution.consultation.util.PersonalDataEncryptionKeyProvider.KeyMaterial;
import lombok.RequiredArgsConstructor;

/**
 * 상담 음성 파일 저장 암호화 (AES-256-GCM, 파일마다 랜덤 IV).
 *
 * <p>파일 형식 (v1):
 * <pre>
 * MAGIC(4, "MGA\u0001") | VERSION(1) | KEY_ID_LEN(1) | KEY_ID(UTF-8) | NONCE(12) | CIPHERTEXT || GCM_TAG(16)
 * </pre>
 * 헤더 전체(MAGIC~NONCE)를 AAD 로 묶어 키 ID·버전 변조를 탐지한다. 키는
 * {@link PersonalDataEncryptionKeyProvider} 의 공개 API(활성 키 / 키 ID 조회)만 사용한다.
 *
 * <p>읽기는 이중 경로: 헤더가 있으면 복호화, 없으면 기존 평문 파일로 그대로 반환한다(기존 파일 이관 없음).
 * 헤더가 있는데 키가 없거나 태그 검증에 실패하면 예외 — 평문으로 폴백하지 않는다.
 *
 * @author MindGarden
 * @since 2026-10-04
 */
@Component
@RequiredArgsConstructor
public class ConsultationAudioFileCipher {

    static final byte[] MAGIC = {'M', 'G', 'A', 0x01};
    static final byte FORMAT_VERSION = 0x01;
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int NONCE_LENGTH_BYTES = 12;
    private static final int TAG_LENGTH_BITS = 128;
    private static final int MAX_KEY_ID_BYTES = 255;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final PersonalDataEncryptionKeyProvider keyProvider;

    /**
     * 입력 스트림을 활성 키로 암호화해 대상 파일에 쓴다 (새 파일 생성, 기존 파일 덮어쓰기 금지).
     *
     * @param source 평문 음성 스트림
     * @param target 저장 경로
     * @throws IOException 저장 실패
     */
    public void encryptToFile(InputStream source, Path target) throws IOException {
        KeyMaterial key = keyProvider.getActiveKey();
        if (key == null || key.getSecretKey() == null) {
            throw new IllegalStateException("음성 파일 암호화 키가 없습니다.");
        }
        byte[] header = buildHeader(key.getKeyId());
        byte[] nonce = Arrays.copyOfRange(header, header.length - NONCE_LENGTH_BYTES, header.length);
        Cipher cipher = initCipher(Cipher.ENCRYPT_MODE, key, nonce, header);
        OutputStream created = Files.newOutputStream(target, StandardOpenOption.CREATE_NEW,
                StandardOpenOption.WRITE);
        try (OutputStream fileOut = created) {
            fileOut.write(header);
            try (CipherOutputStream cipherOut = new CipherOutputStream(fileOut, cipher)) {
                source.transferTo(cipherOut);
            }
        } catch (IOException | RuntimeException e) {
            Files.deleteIfExists(target);
            throw e;
        }
    }

    /**
     * 저장 파일을 읽어 평문 바이트를 반환한다. 암호화 헤더가 없으면 기존 평문 파일로 간주한다.
     *
     * @param path 저장 경로
     * @return 평문 음성 바이트
     * @throws IOException 읽기 실패
     */
    public byte[] readAllBytes(Path path) throws IOException {
        byte[] stored = Files.readAllBytes(path);
        if (!hasEncryptionHeader(stored)) {
            return stored;
        }
        return decrypt(stored);
    }

    /**
     * 저장 파일이 암호화 형식인지 확인한다.
     *
     * @param path 저장 경로
     * @return 암호화 헤더가 있으면 true
     * @throws IOException 읽기 실패
     */
    public boolean isEncrypted(Path path) throws IOException {
        try (InputStream in = Files.newInputStream(path)) {
            byte[] prefix = in.readNBytes(MAGIC.length);
            return Arrays.equals(prefix, MAGIC);
        }
    }

    static boolean hasEncryptionHeader(byte[] stored) {
        return stored != null && stored.length > MAGIC.length
                && Arrays.equals(Arrays.copyOfRange(stored, 0, MAGIC.length), MAGIC);
    }

    private byte[] decrypt(byte[] stored) {
        int offset = MAGIC.length;
        if (stored.length < offset + 2) {
            throw new IllegalStateException("음성 파일 암호화 헤더가 손상되었습니다.");
        }
        byte version = stored[offset++];
        if (version != FORMAT_VERSION) {
            throw new IllegalStateException("지원하지 않는 음성 파일 암호화 버전입니다.");
        }
        int keyIdLength = stored[offset++] & 0xFF;
        int headerLength = offset + keyIdLength + NONCE_LENGTH_BYTES;
        if (keyIdLength == 0 || stored.length < headerLength + TAG_LENGTH_BITS / Byte.SIZE) {
            throw new IllegalStateException("음성 파일 암호화 헤더가 손상되었습니다.");
        }
        String keyId = new String(stored, offset, keyIdLength, StandardCharsets.UTF_8);
        KeyMaterial key = keyProvider.getKey(keyId);
        if (key == null || key.getSecretKey() == null) {
            throw new IllegalStateException("음성 파일 복호화 키를 찾을 수 없습니다.");
        }
        byte[] header = Arrays.copyOfRange(stored, 0, headerLength);
        byte[] nonce = Arrays.copyOfRange(header, headerLength - NONCE_LENGTH_BYTES, headerLength);
        Cipher cipher = initCipher(Cipher.DECRYPT_MODE, key, nonce, header);
        try {
            return cipher.doFinal(stored, headerLength, stored.length - headerLength);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("음성 파일 복호화에 실패했습니다.", e);
        }
    }

    private static byte[] buildHeader(String keyId) {
        byte[] keyIdBytes = keyId == null ? new byte[0] : keyId.getBytes(StandardCharsets.UTF_8);
        if (keyIdBytes.length == 0 || keyIdBytes.length > MAX_KEY_ID_BYTES) {
            throw new IllegalStateException("음성 파일 암호화 키 ID 가 유효하지 않습니다.");
        }
        byte[] nonce = new byte[NONCE_LENGTH_BYTES];
        SECURE_RANDOM.nextBytes(nonce);
        ByteArrayOutputStream header = new ByteArrayOutputStream();
        header.writeBytes(MAGIC);
        header.write(FORMAT_VERSION);
        header.write(keyIdBytes.length);
        header.writeBytes(keyIdBytes);
        header.writeBytes(nonce);
        return header.toByteArray();
    }

    private static Cipher initCipher(int mode, KeyMaterial key, byte[] nonce, byte[] aad) {
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(mode, key.getSecretKey(), new GCMParameterSpec(TAG_LENGTH_BITS, nonce));
            cipher.updateAAD(aad);
            return cipher;
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("음성 파일 암호화 초기화에 실패했습니다.", e);
        }
    }
}
