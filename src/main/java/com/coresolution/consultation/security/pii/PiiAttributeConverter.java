package com.coresolution.consultation.security.pii;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

/**
 * Clinic-OS 단일 PII JPA AttributeConverter (AES-GCM v2 쓰기).
 *
 * <p>모든 String PII 컬럼은 본 컨버터만 사용한다. 쓰기는 fail-closed,
 * 읽기는 v2/v1/평문 호환(관용)이다.</p>
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
@Slf4j
@Converter
public class PiiAttributeConverter implements AttributeConverter<String, String> {

    /**
     * 암호문 마커(v1/v2) 여부 — {@link PiiCipherFormats#looksEncrypted(String)} 위임.
     *
     * @param value 검사할 값
     * @return 마커 형식이면 true
     */
    public static boolean looksEncrypted(String value) {
        return PiiCipherFormats.looksEncrypted(value);
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        if (attribute.isEmpty()) {
            return attribute;
        }
        PiiCryptoService crypto = PiiEncryptionContextHolder.get();
        if (crypto == null) {
            throw new IllegalStateException(
                "PiiCryptoService 미초기화 - PII 평문 저장 금지 (fail-closed)");
        }
        try {
            return crypto.ensureActiveKeyEncryption(attribute);
        } catch (IllegalStateException e) {
            throw e;
        } catch (RuntimeException e) {
            throw new IllegalStateException("PII 암호화 실패 - 평문 저장 금지 (fail-closed)", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        if (dbData.isEmpty()) {
            return dbData;
        }
        PiiCryptoService crypto = PiiEncryptionContextHolder.get();
        if (crypto == null) {
            log.warn("PiiCryptoService 미초기화 - PII 원본 폴백 반환 (부팅 초기 또는 비-Spring 테스트)");
            return dbData;
        }
        try {
            if (!PiiCipherFormats.looksEncrypted(dbData) && !crypto.isEncrypted(dbData)) {
                return dbData;
            }
            return crypto.safeDecrypt(dbData);
        } catch (RuntimeException e) {
            log.error("PII 복호화 실패 - 원본 폴백 반환 (keyId={})",
                crypto.extractKeyVersion(dbData));
            return dbData;
        }
    }
}
