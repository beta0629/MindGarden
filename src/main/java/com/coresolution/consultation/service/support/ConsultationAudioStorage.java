package com.coresolution.consultation.service.support;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 상담 음성 파일 저장소. 새 파일은 항상 {@link ConsultationAudioFileCipher} 로 암호화해 저장한다.
 *
 * <p>저장 루트는 {@code mindgarden.upload.consultation-audio.base-dir}(env {@code CONSULTATION_AUDIO_UPLOAD_DIR})로만 주입한다.
 * 파일명·확장자는 클라이언트 파일명을 쓰지 않고 서버가 정한다(경로 조작 차단).
 *
 * @author MindGarden
 * @since 2026-10-04
 */
@Component
public class ConsultationAudioStorage {

    /** 허용 MIME → 저장 확장자. */
    public static final Map<String, String> EXTENSION_BY_MIME_TYPE = Map.of(
            "audio/wav", ".wav",
            "audio/mpeg", ".mp3",
            "audio/mp3", ".mp3",
            "audio/m4a", ".m4a",
            "audio/x-m4a", ".m4a");

    private static final String FILE_PREFIX = "consultation_";
    private static final String ENCRYPTED_SUFFIX = ".enc";

    private final ConsultationAudioFileCipher cipher;
    private final Path storageRoot;

    public ConsultationAudioStorage(ConsultationAudioFileCipher cipher,
            @Value("${mindgarden.upload.consultation-audio.base-dir}") String storageDir) {
        this.cipher = cipher;
        this.storageRoot = Paths.get(storageDir).toAbsolutePath().normalize();
    }

    /**
     * 허용 MIME 인지 확인.
     *
     * @param mimeType MIME
     * @return 허용이면 true
     */
    public boolean isAllowedMimeType(String mimeType) {
        return mimeType != null && EXTENSION_BY_MIME_TYPE.containsKey(mimeType);
    }

    /**
     * 테넌트 디렉터리에 암호화 저장.
     *
     * @param tenantId       테넌트 ID (필수)
     * @param consultationId 상담(일정) ID
     * @param mimeType       허용 MIME
     * @param source         평문 스트림
     * @return 저장 경로
     * @throws IOException 저장 실패
     */
    public Path storeEncrypted(String tenantId, Long consultationId, String mimeType, InputStream source)
            throws IOException {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalStateException("테넌트 정보가 없습니다.");
        }
        if (!isAllowedMimeType(mimeType)) {
            throw new IllegalArgumentException("지원하지 않는 파일 형식입니다.");
        }
        Path tenantDir = storageRoot.resolve(tenantId).normalize();
        if (!tenantDir.startsWith(storageRoot) || tenantDir.equals(storageRoot)) {
            throw new IllegalStateException("테넌트 저장 경로가 유효하지 않습니다.");
        }
        Files.createDirectories(tenantDir);
        String filename = FILE_PREFIX + consultationId + "_" + UUID.randomUUID()
                + EXTENSION_BY_MIME_TYPE.get(mimeType) + ENCRYPTED_SUFFIX;
        Path target = tenantDir.resolve(filename);
        cipher.encryptToFile(source, target);
        return target;
    }
}
