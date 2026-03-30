package com.coresolution.consultation.util;

import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Arrays;

/**
 * 개인정보 암호화 키/IV 관리 컴포넌트
 * <p>
 * - 환경변수를 통해 다중 키/IV를 관리하며, 활성 키 교체(로테이션)를 지원한다.<br>
 * - 키 문자열은 Base64 인코딩 여부와 상관없이 입력 가능하며, 내부적으로 32바이트로 정규화한다.<br>
 * - IV 문자열은 16바이트로 정규화한다.<br>
 * - 신규 암호화 데이터는 "{keyId}::{cipherText}" 형태로 저장된다.
 *
 * <pre>
 * 환경변수 예시
 * PERSONAL_DATA_ENCRYPTION_ACTIVE_KEY_ID=v2
 * PERSONAL_DATA_ENCRYPTION_KEYS=v2:Q29vbFNlY3JldEtleTIzIT8=,v1:QmFja3VwS2V5MTIzIT8=
 * PERSONAL_DATA_ENCRYPTION_IVS=v2:Q29vbElWMjMxMjM=,v1:QmFja3VwSXYxMjM=
 * </pre>
 *
 * <p>키/IV 맵 값은 Base64 문자열을 권장한다.</p>
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Slf4j
@Component
public class PersonalDataEncryptionKeyProvider {

    private static final String DEFAULT_LEGACY_KEY_ID = "legacy";
    private static final String DEFAULT_DELIMITER = ",";
    private static final String KEY_VALUE_DELIMITER = ":";
    /** dev/local 프로파일에서 키/IV 미설정 시 사용하는 폴백 값 (기동용) */
    private static final String DEV_FALLBACK_IV = "dev-iv-16-bytes!!";
    private static final String DEV_FALLBACK_KEY = "dev-encryption-key-32-bytes-long!!!!";

    @Value("${encryption.personal-data.active-key-id:}")
    private String activeKeyId;

    @Value("${encryption.personal-data.key-versions:}")
    private String keyVersions;

    @Value("${encryption.personal-data.iv-versions:}")
    private String ivVersions;

    /**
     * 단일 키/IV (기존 방식) - 로테이션 미사용 환경 호환용
     */
    @Value("${encryption.personal-data.key:}")
    private String legacyKey;

    @Value("${encryption.personal-data.iv:}")
    private String legacyIv;

    private final Environment environment;
    private final Map<String, KeyMaterial> keyMaterialById = new ConcurrentHashMap<>();
    private final List<String> keyPriorityOrder = new ArrayList<>();

    public PersonalDataEncryptionKeyProvider(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void initialize() {
        Map<String, String> parsedKeys = parseConfigMap(keyVersions, "key");
        Map<String, String> parsedIvs = parseConfigMap(ivVersions, "iv");
        boolean devOrLocal = isDevOrLocalProfile();

        if (parsedKeys.isEmpty()) {
            if (!StringUtils.hasText(legacyKey)) {
                if (devOrLocal) {
                    log.warn("⚠️ [dev/local] 암호화 키가 설정되지 않았습니다. 개발용 폴백 키로 기동합니다.");
                    parsedKeys = new LinkedHashMap<>();
                    parsedKeys.put(DEFAULT_LEGACY_KEY_ID, DEV_FALLBACK_KEY);
                    parsedIvs = new LinkedHashMap<>();
                    parsedIvs.put(DEFAULT_LEGACY_KEY_ID, DEV_FALLBACK_IV);
                } else {
                    throw new IllegalStateException(
                        "암호화 키가 설정되지 않았습니다. 환경변수 PERSONAL_DATA_ENCRYPTION_KEY 또는 PERSONAL_DATA_ENCRYPTION_KEYS를 확인하세요."
                    );
                }
            } else {
                log.warn("🔐 다중 키 설정이 비어 있습니다. legacy 키를 사용합니다.");
                parsedKeys = new LinkedHashMap<>();
                parsedKeys.put(DEFAULT_LEGACY_KEY_ID, legacyKey);

                if (StringUtils.hasText(legacyIv)) {
                    parsedIvs = new LinkedHashMap<>();
                    parsedIvs.put(DEFAULT_LEGACY_KEY_ID, legacyIv);
                }
            }
        }

        for (Map.Entry<String, String> entry : parsedKeys.entrySet()) {
            String keyId = entry.getKey();
            String keyValue = entry.getValue();
            String ivValue = parsedIvs.getOrDefault(keyId, legacyIv);

            if (!StringUtils.hasText(ivValue)) {
                if (devOrLocal) {
                    ivValue = DEV_FALLBACK_IV;
                    log.warn("⚠️ [dev/local] IV가 비어 있어 keyId={} 에 개발용 IV를 사용합니다.", keyId);
                } else {
                    throw new IllegalStateException(String.format("IV가 설정되지 않았습니다. keyId=%s", keyId));
                }
            }

            KeyMaterial keyMaterial = buildKeyMaterial(keyId, keyValue, ivValue);
            keyMaterialById.put(keyId, keyMaterial);
        }

        if (!keyMaterialById.containsKey(DEFAULT_LEGACY_KEY_ID) && StringUtils.hasText(legacyKey)) {
            // 기존 단일 키를 백워드 호환용으로 추가
            KeyMaterial legacyMaterial = buildKeyMaterial(DEFAULT_LEGACY_KEY_ID, legacyKey,
                StringUtils.hasText(legacyIv) ? legacyIv : legacyKey);
            keyMaterialById.put(DEFAULT_LEGACY_KEY_ID, legacyMaterial);
        }

        if (keyMaterialById.isEmpty()) {
            if (devOrLocal) {
                log.warn("⚠️ [dev/local] 유효한 암호화 키가 없습니다. 개발용 폴백 키로 기동합니다.");
                KeyMaterial fallback = buildKeyMaterial(DEFAULT_LEGACY_KEY_ID, DEV_FALLBACK_KEY, DEV_FALLBACK_IV);
                keyMaterialById.put(DEFAULT_LEGACY_KEY_ID, fallback);
            } else {
                throw new IllegalStateException("유효한 암호화 키를 초기화할 수 없습니다.");
            }
        }

        if (!StringUtils.hasText(activeKeyId) || !keyMaterialById.containsKey(activeKeyId)) {
            activeKeyId = keyMaterialById.keySet().iterator().next();
            log.warn("🔄 활성 키가 설정되지 않았거나 존재하지 않습니다. '{}' 키를 활성 키로 사용합니다.", activeKeyId);
        }

        // 우선 순위: 활성 키 → 나머지 키 → legacy
        keyPriorityOrder.add(activeKeyId);
        for (String keyId : keyMaterialById.keySet()) {
            if (!keyPriorityOrder.contains(keyId)) {
                keyPriorityOrder.add(keyId);
            }
        }

        log.info("✅ 개인정보 암호화 키 초기화 완료 - 활성 키: {}, 총 키 수: {}", activeKeyId, keyMaterialById.size());
    }

    public String getActiveKeyId() {
        return activeKeyId;
    }

    public KeyMaterial getActiveKey() {
        return keyMaterialById.get(activeKeyId);
    }

    public KeyMaterial getKey(String keyId) {
        return keyMaterialById.get(keyId);
    }

    public boolean hasKey(String keyId) {
        return keyMaterialById.containsKey(keyId);
    }

    public Collection<KeyMaterial> getAllKeysByPriority() {
        List<KeyMaterial> materials = new ArrayList<>();
        for (String keyId : keyPriorityOrder) {
            KeyMaterial material = keyMaterialById.get(keyId);
            if (material != null) {
                materials.add(material);
            }
        }
        return materials;
    }

    public boolean hasMultipleKeys() {
        return keyMaterialById.size() > 1;
    }

    public boolean isLegacyKey(String keyId) {
        return Objects.equals(DEFAULT_LEGACY_KEY_ID, keyId);
    }

    private Map<String, String> parseConfigMap(String config, String name) {
        Map<String, String> result = new LinkedHashMap<>();
        if (!StringUtils.hasText(config)) {
            return result;
        }

        String normalized = config.replace(";", DEFAULT_DELIMITER).trim();
        String[] entries = normalized.split(DEFAULT_DELIMITER);
        for (String entry : entries) {
            if (!StringUtils.hasText(entry)) {
                continue;
            }
            String[] parts = entry.trim().split(KEY_VALUE_DELIMITER, 2);
            if (parts.length < 2) {
                log.warn("⚠️ {} 구성 파싱 실패: {}", name, entry);
                continue;
            }
            result.put(parts[0].trim(), parts[1].trim());
        }
        return result;
    }

    private KeyMaterial buildKeyMaterial(String keyId, String keyValue, String ivValue) {
        try {
            SecretKeySpec secretKey = new SecretKeySpec(normalizeKeyBytes(keyValue), "AES");
            IvParameterSpec iv = new IvParameterSpec(normalizeIvBytes(ivValue));
            return new KeyMaterial(keyId, secretKey, iv);
        } catch (Exception e) {
            throw new IllegalStateException("암호화 키/IV 초기화 실패 - keyId=" + keyId + ", error=" + e.getMessage(), e);
        }
    }

    private byte[] normalizeKeyBytes(String keyValue) throws Exception {
        byte[] rawBytes = decodeKeyMaterial(keyValue);
        if (rawBytes.length == 32) {
            return rawBytes;
        }
        if (rawBytes.length > 32) {
            byte[] truncated = new byte[32];
            System.arraycopy(rawBytes, 0, truncated, 0, 32);
            return truncated;
        }
        // 길이가 32 미만인 경우 SHA-256 해시를 사용하여 32바이트 생성
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        return digest.digest(rawBytes);
    }

    private byte[] normalizeIvBytes(String ivValue) throws Exception {
        byte[] rawBytes = decodeKeyMaterial(ivValue);
        if (rawBytes.length == 16) {
            return rawBytes;
        }
        if (rawBytes.length > 16) {
            byte[] truncated = new byte[16];
            System.arraycopy(rawBytes, 0, truncated, 0, 16);
            return truncated;
        }
        // 길이가 16 미만인 경우 SHA-256 해시 후 16바이트 사용
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hashed = digest.digest(rawBytes);
        byte[] ivBytes = new byte[16];
        System.arraycopy(hashed, 0, ivBytes, 0, 16);
        return ivBytes;
    }

    private byte[] decodeKeyMaterial(String value) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException("키 또는 IV 값이 비어 있습니다.");
        }

        try {
            return Base64.getDecoder().decode(value.trim());
        } catch (IllegalArgumentException e) {
            // Base64가 아닌 경우 문자열 그대로 사용
            log.debug("ⓘ 키/IV 값이 Base64 형식이 아닙니다. 원본 문자열을 사용합니다.");
            return value.getBytes(StandardCharsets.UTF_8);
        }
    }

    /**
     * 키/IV 조합을 표현하는 레코드
     */
    @Getter
    public static class KeyMaterial {
        private final String keyId;
        private final SecretKeySpec secretKey;
        private final IvParameterSpec iv;

        public KeyMaterial(String keyId, SecretKeySpec secretKey, IvParameterSpec iv) {
            this.keyId = keyId;
            this.secretKey = secretKey;
            this.iv = iv;
        }
    }

    private boolean isDevOrLocalProfile() {
        if (environment == null) {
            return false;
        }
        String[] actives = environment.getActiveProfiles();
        if (actives.length == 0) {
            return false;
        }
        return Arrays.stream(actives)
                .anyMatch(p -> "dev".equalsIgnoreCase(p) || "local".equalsIgnoreCase(p));
    }
}

