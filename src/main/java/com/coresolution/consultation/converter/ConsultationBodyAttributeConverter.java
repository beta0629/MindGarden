package com.coresolution.consultation.converter;

import java.util.regex.Pattern;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담일지 본문(민감 서술 텍스트) 컬럼용 JPA AttributeConverter.
 *
 * <p>{@link PersonalNameAttributeConverter} 와 같은 키 관리
 * ({@link com.coresolution.consultation.util.PersonalDataEncryptionKeyProvider} · 환경변수
 * {@code encryption.personal-data.*})를 재사용하며, 저장 시 AES-256/CBC 암호화,
 * 조회 시 복호화한다. 적용 대상은 {@code consultation_records} 서술 컬럼과
 * {@code consultation_record_drafts.payload_json} 이다.</p>
 *
 * <h3>평문·암호문 혼재(전환 호환)</h3>
 * <p>기존 행은 평문이므로 읽기는 반드시 <strong>둘 다</strong> 처리해야 한다. 판별은
 * {@link PersonalDataEncryptionUtil} 이 쓰는 버전 마커 {@code {keyId}::{base64}} 형식을
 * 정규식({@link #ENCRYPTED_MARKER})으로 엄격하게 검사한다. 상담 서술 평문이 이 형식과
 * 겹치려면 "식별자 + {@code ::} + 전부 Base64 문자" 여야 하므로 사실상 충돌하지 않는다.
 * ({@code safeDecrypt} 의 legacy Base64 추측 경로는 쓰지 않는다 — 짧은 ASCII 평문을
 * 암호문으로 오판할 수 있기 때문이다.)</p>
 *
 * <h3>실패 내성</h3>
 * <p>키 미초기화·키 부재·복호화 실패 시 예외를 던지지 않고 DB 원본을 그대로 돌려준다.
 * 목록 조회 한 건의 복호화 실패가 전체 응답을 500 으로 만들지 않도록 하기 위함이다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@Slf4j
@Converter
public class ConsultationBodyAttributeConverter implements AttributeConverter<String, String> {

    /** {@code {keyId}::{base64}} 버전 마커. keyId 는 영숫자·{@code _.-} 만 허용. */
    private static final Pattern ENCRYPTED_MARKER =
        Pattern.compile("^[A-Za-z0-9_.\\-]{1,32}::[A-Za-z0-9+/=\\r\\n]+$");

    /**
     * 암호문 여부를 버전 마커로 판별한다.
     *
     * @param value 검사할 값 (null 허용)
     * @return 마커 형식이면 true
     */
    public static boolean looksEncrypted(String value) {
        return value != null && ENCRYPTED_MARKER.matcher(value).matches();
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return attribute;
        }
        if (looksEncrypted(attribute)) {
            return attribute;
        }
        PersonalDataEncryptionUtil util = PersonalDataEncryptionContextHolder.get();
        if (util == null) {
            log.warn("PersonalDataEncryptionUtil 미초기화 - 상담 본문 평문 폴백 저장 (부팅 초기 또는 비-Spring 테스트 컨텍스트)");
            return attribute;
        }
        try {
            return util.encrypt(attribute);
        } catch (RuntimeException e) {
            log.error("상담 본문 암호화 실패 - 평문 폴백 저장 (길이={})", attribute.length());
            return attribute;
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return dbData;
        }
        if (!looksEncrypted(dbData)) {
            return dbData;
        }
        PersonalDataEncryptionUtil util = PersonalDataEncryptionContextHolder.get();
        if (util == null) {
            log.warn("PersonalDataEncryptionUtil 미초기화 - 상담 본문 원본 폴백 반환");
            return dbData;
        }
        try {
            return util.decrypt(dbData);
        } catch (RuntimeException e) {
            log.error("상담 본문 복호화 실패 - 원본 폴백 반환 (keyId={})", util.extractKeyVersion(dbData));
            return dbData;
        }
    }
}
