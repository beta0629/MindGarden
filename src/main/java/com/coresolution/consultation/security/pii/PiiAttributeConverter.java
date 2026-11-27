package com.coresolution.consultation.security.pii;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

/**
 * Clinic-OS 단일 PII JPA AttributeConverter (AES-GCM v2 쓰기).
 *
 * <p>모든 String PII 컬럼은 본 컨버터만 사용한다. 쓰기는 평문만 받아 {@code encryptGcm} 한다.
 * 암호문 형식({@code keyId::} / {@code keyId:v2::}) 입력은 거부한다 — 도난 암호문
 * 패스스루·재암호화 오라클을 막기 위함이다. JDBC/키 로테이션 업그레이드는
 * {@link PiiCryptoService#ensureActiveKeyEncryption(String)} 만 사용하며,
 * 본 컨버터는 호출하지 않는다.</p>
 *
 * <p>읽기는 v2/v1/평문 호환이다. 복호화 실패 시 마커가 붙은 원본 DB 값을 그대로
 * 엔티티에 두어, 이후 flush 가 잘린 Base64 를 평문으로 오인·재암호화하지 않게 한다.
 * (암호문 형식 값이 엔티티에 남으면 쓰기 시 예외로 fail-closed.)</p>
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
@Slf4j
@Converter
public class PiiAttributeConverter implements AttributeConverter<String, String> {

    /** JPA 쓰기에 암호문 형식 값이 들어왔을 때 메시지. */
    static final String CIPHERTEXT_INPUT_REJECTED =
        "PII 필드에 암호문 형식 입력 불가 — JPA 쓰기는 평문만 허용";

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
        if (PiiCipherFormats.looksEncrypted(attribute)) {
            throw new IllegalStateException(CIPHERTEXT_INPUT_REJECTED);
        }
        PiiCryptoService crypto = PiiEncryptionContextHolder.get();
        if (crypto == null) {
            throw new IllegalStateException(
                "PiiCryptoService 미초기화 - PII 평문 저장 금지 (fail-closed)");
        }
        try {
            return crypto.encryptGcm(attribute);
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
            String decrypted = crypto.safeDecrypt(dbData);
            String plain = PiiCipherFormats.requirePlaintextAfterDecrypt(dbData, decrypted);
            if (plain == null) {
                log.error("PII 복호화 실패 - 원본 암호문 유지 (keyId={})",
                    crypto.extractKeyVersion(dbData));
                return dbData;
            }
            return plain;
        } catch (RuntimeException e) {
            log.error("PII 복호화 실패 - 원본 암호문 유지 (keyId={})",
                crypto.extractKeyVersion(dbData));
            return dbData;
        }
    }
}
