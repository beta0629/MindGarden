package com.coresolution.consultation.service.support;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.Arrays;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import com.coresolution.consultation.util.PersonalDataEncryptionKeyProvider;
import com.coresolution.consultation.util.PersonalDataEncryptionKeyProvider.KeyMaterial;

/**
 * {@link ConsultationAudioFileCipher} — 왕복, 랜덤 IV, 기존 평문 이중 읽기, 변조·키 부재 반례.
 *
 * @author MindGarden
 * @since 2026-10-04
 */
@DisplayName("ConsultationAudioFileCipher")
class ConsultationAudioFileCipherTest {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String KEY_A = "audio-test-a";
    private static final String KEY_B = "audio-test-b";

    @TempDir
    Path tempDir;

    private PersonalDataEncryptionKeyProvider keyProvider;
    private KeyMaterial keyA;
    private KeyMaterial keyB;
    private ConsultationAudioFileCipher cipher;

    @BeforeEach
    void setUp() {
        keyProvider = mock(PersonalDataEncryptionKeyProvider.class);
        keyA = newKey(KEY_A);
        keyB = newKey(KEY_B);
        when(keyProvider.getActiveKey()).thenReturn(keyA);
        when(keyProvider.getKey(KEY_A)).thenReturn(keyA);
        when(keyProvider.getKey(KEY_B)).thenReturn(keyB);
        cipher = new ConsultationAudioFileCipher(keyProvider);
    }

    private static KeyMaterial newKey(String keyId) {
        byte[] key = new byte[32];
        RANDOM.nextBytes(key);
        byte[] iv = new byte[16];
        RANDOM.nextBytes(iv);
        return new KeyMaterial(keyId, new SecretKeySpec(key, "AES"), new IvParameterSpec(iv));
    }

    private static byte[] sampleAudio(int size) {
        byte[] audio = new byte[size];
        RANDOM.nextBytes(audio);
        System.arraycopy("RIFF".getBytes(StandardCharsets.US_ASCII), 0, audio, 0, 4);
        return audio;
    }

    private Path encrypt(byte[] plain, String name) throws IOException {
        Path target = tempDir.resolve(name);
        cipher.encryptToFile(new ByteArrayInputStream(plain), target);
        return target;
    }

    @Test
    @DisplayName("왕복 — 저장본은 평문과 다르고 헤더를 가지며, 읽으면 원본과 동일")
    void roundTrip() throws IOException {
        byte[] plain = sampleAudio(1024 * 1024 + 7);
        Path stored = encrypt(plain, "a.enc");
        byte[] raw = Files.readAllBytes(stored);
        assertTrue(ConsultationAudioFileCipher.hasEncryptionHeader(raw));
        assertTrue(cipher.isEncrypted(stored));
        assertFalse(containsSequence(raw, Arrays.copyOfRange(plain, 0, 64)));
        assertArrayEquals(plain, cipher.readAllBytes(stored));
    }

    @Test
    @DisplayName("같은 내용도 파일마다 다른 IV·암호문")
    void randomIvPerFile() throws IOException {
        byte[] plain = sampleAudio(4096);
        byte[] first = Files.readAllBytes(encrypt(plain, "1.enc"));
        byte[] second = Files.readAllBytes(encrypt(plain, "2.enc"));
        assertFalse(Arrays.equals(first, second));
    }

    @Test
    @DisplayName("기존 평문 파일(헤더 없음)은 그대로 읽힘 — 이관 없음")
    void legacyPlaintextDualRead() throws IOException {
        byte[] legacy = sampleAudio(2048);
        Path legacyPath = tempDir.resolve("legacy.wav");
        Files.write(legacyPath, legacy);
        assertFalse(cipher.isEncrypted(legacyPath));
        assertArrayEquals(legacy, cipher.readAllBytes(legacyPath));
        assertArrayEquals(legacy, Files.readAllBytes(legacyPath));
    }

    @Test
    @DisplayName("키 교체 후에도 이전 키 ID 로 저장된 파일 복호화")
    void readsWithStoredKeyIdAfterRotation() throws IOException {
        byte[] plain = sampleAudio(3000);
        Path stored = encrypt(plain, "old.enc");
        when(keyProvider.getActiveKey()).thenReturn(keyB);
        assertArrayEquals(plain, cipher.readAllBytes(stored));
    }

    @Test
    @DisplayName("반례 — 암호문 1바이트 변조 시 예외(평문 폴백 없음)")
    void tamperedCiphertextFails() throws IOException {
        Path stored = encrypt(sampleAudio(2048), "t.enc");
        byte[] raw = Files.readAllBytes(stored);
        raw[raw.length - 20] ^= 0x01;
        Files.write(stored, raw);
        assertThrows(IllegalStateException.class, () -> cipher.readAllBytes(stored));
    }

    @Test
    @DisplayName("반례 — 헤더의 키 ID 를 다른 존재 키로 바꾸면 AAD·키 불일치로 예외")
    void swappedKeyIdFails() throws IOException {
        Path stored = encrypt(sampleAudio(2048), "k.enc");
        byte[] raw = Files.readAllBytes(stored);
        int keyIdOffset = ConsultationAudioFileCipher.MAGIC.length + 2;
        byte[] replacement = KEY_B.getBytes(StandardCharsets.UTF_8);
        System.arraycopy(replacement, 0, raw, keyIdOffset, replacement.length);
        Files.write(stored, raw);
        assertThrows(IllegalStateException.class, () -> cipher.readAllBytes(stored));
    }

    @Test
    @DisplayName("반례 — 저장 키가 사라지면 예외")
    void missingKeyFails() throws IOException {
        Path stored = encrypt(sampleAudio(2048), "m.enc");
        when(keyProvider.getKey(KEY_A)).thenReturn(null);
        assertThrows(IllegalStateException.class, () -> cipher.readAllBytes(stored));
    }

    @Test
    @DisplayName("반례 — 잘린 파일(헤더만) 예외")
    void truncatedFails() throws IOException {
        Path stored = encrypt(sampleAudio(2048), "c.enc");
        byte[] raw = Files.readAllBytes(stored);
        Files.write(stored, Arrays.copyOf(raw, ConsultationAudioFileCipher.MAGIC.length + 3));
        assertThrows(IllegalStateException.class, () -> cipher.readAllBytes(stored));
    }

    @Test
    @DisplayName("반례 — 기존 파일 덮어쓰기 금지, 활성 키 없으면 저장 거부")
    void refusesOverwriteAndMissingActiveKey() throws IOException {
        Path existing = tempDir.resolve("exists.enc");
        Files.write(existing, new byte[] {1, 2, 3});
        assertThrows(FileAlreadyExistsException.class,
                () -> cipher.encryptToFile(new ByteArrayInputStream(new byte[] {9}), existing));
        assertArrayEquals(new byte[] {1, 2, 3}, Files.readAllBytes(existing));

        when(keyProvider.getActiveKey()).thenReturn(null);
        Path target = tempDir.resolve("nokey.enc");
        assertThrows(IllegalStateException.class,
                () -> cipher.encryptToFile(new ByteArrayInputStream(new byte[] {9}), target));
        assertFalse(Files.exists(target));
    }

    @Test
    @DisplayName("빈 음성도 왕복")
    void emptyRoundTrip() throws IOException {
        Path stored = encrypt(new byte[0], "e.enc");
        assertEquals(0, cipher.readAllBytes(stored).length);
    }

    private static boolean containsSequence(byte[] haystack, byte[] needle) {
        outer:
        for (int i = 0; i <= haystack.length - needle.length; i++) {
            for (int j = 0; j < needle.length; j++) {
                if (haystack[i + j] != needle[j]) {
                    continue outer;
                }
            }
            return true;
        }
        return false;
    }
}
