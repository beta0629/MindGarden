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
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import com.coresolution.consultation.util.PersonalDataEncryptionKeyProvider;
import com.coresolution.consultation.util.PersonalDataEncryptionKeyProvider.KeyMaterial;

/**
 * {@link ConsultationAudioStorage} — 테넌트 디렉터리·서버 생성 파일명·암호화 저장·경로 조작 차단.
 *
 * @author MindGarden
 * @since 2026-10-04
 */
@DisplayName("ConsultationAudioStorage")
class ConsultationAudioStorageTest {

    private static final String TENANT_ID = "tenant-audio-test";

    @TempDir
    Path tempDir;

    private ConsultationAudioFileCipher cipher;
    private ConsultationAudioStorage storage;

    @BeforeEach
    void setUp() {
        PersonalDataEncryptionKeyProvider keyProvider = mock(PersonalDataEncryptionKeyProvider.class);
        byte[] key = new byte[32];
        new SecureRandom().nextBytes(key);
        KeyMaterial material = new KeyMaterial("audio-storage-key", new SecretKeySpec(key, "AES"),
                new IvParameterSpec(new byte[16]));
        when(keyProvider.getActiveKey()).thenReturn(material);
        when(keyProvider.getKey("audio-storage-key")).thenReturn(material);
        cipher = new ConsultationAudioFileCipher(keyProvider);
        storage = new ConsultationAudioStorage(cipher, tempDir.toString());
    }

    @Test
    @DisplayName("테넌트 디렉터리에 .enc 로 암호화 저장, 읽으면 원본")
    void storesEncryptedUnderTenantDir() throws IOException {
        byte[] audio = "RIFF....WAVEfmt sample".getBytes();
        Path stored = storage.storeEncrypted(TENANT_ID, 7L, "audio/wav", new ByteArrayInputStream(audio));
        assertEquals(tempDir.resolve(TENANT_ID).toAbsolutePath().normalize(), stored.getParent());
        assertTrue(stored.getFileName().toString().startsWith("consultation_7_"));
        assertTrue(stored.getFileName().toString().endsWith(".wav.enc"));
        assertTrue(cipher.isEncrypted(stored));
        assertArrayEquals(audio, cipher.readAllBytes(stored));
    }

    @Test
    @DisplayName("반례 — 허용 외 MIME·테넌트 없음 거부, 파일 미생성")
    void rejectsBadMimeAndMissingTenant() {
        assertThrows(IllegalArgumentException.class,
                () -> storage.storeEncrypted(TENANT_ID, 1L, "application/x-sh", new ByteArrayInputStream(new byte[1])));
        assertThrows(IllegalStateException.class,
                () -> storage.storeEncrypted(" ", 1L, "audio/wav", new ByteArrayInputStream(new byte[1])));
        assertFalse(Files.exists(tempDir.resolve(TENANT_ID)));
    }

    @Test
    @DisplayName("반례 — 테넌트 값으로 저장 루트 밖 경로 조작 차단")
    void rejectsTraversalTenant() {
        assertThrows(IllegalStateException.class,
                () -> storage.storeEncrypted("../escape", 1L, "audio/wav", new ByteArrayInputStream(new byte[1])));
        assertThrows(IllegalStateException.class,
                () -> storage.storeEncrypted("..", 1L, "audio/wav", new ByteArrayInputStream(new byte[1])));
        assertFalse(Files.exists(tempDir.getParent().resolve("escape")));
    }
}
