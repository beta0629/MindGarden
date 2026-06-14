package com.coresolution.consultation.converter;

import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

/**
 * 이름 PII 컬럼용 JPA AttributeConverter SSOT.
 *
 * <p>{@code user.name}, {@code client.name}, {@code consultant.name} 등 이름 컬럼에
 * 적용하여 DB 저장 시 AES-256/CBC 자동 암호화·조회 시 자동 복호화한다. 내부 구현은
 * {@link PersonalDataEncryptionUtil#safeEncrypt(String)} /
 * {@link PersonalDataEncryptionUtil#safeDecrypt(String)} 를 위임 호출하여
 * <strong>멱등성</strong> 을 보장한다(서비스 레이어가 동일 컬럼에 이중 암호화 호출을
 * 유지하더라도 회귀하지 않음).</p>
 *
 * <h3>관련 표준</h3>
 * <ul>
 *   <li>docs/standards/PII_PROTECTION_STANDARD.md §2~§3 — 적용 컬럼·구현 패턴</li>
 *   <li>docs/standards/ENCRYPTION_STANDARD.md — AES-256/CBC 사양</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-14
 */
@Slf4j
@Converter
public class PersonalNameAttributeConverter implements AttributeConverter<String, String> {

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        PersonalDataEncryptionUtil util = PersonalDataEncryptionContextHolder.get();
        if (util == null) {
            log.warn("PersonalDataEncryptionUtil 미초기화 - 이름 평문 폴백 반환 (부팅 초기 또는 비-Spring 테스트 컨텍스트)");
            return attribute;
        }
        return util.safeEncrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        PersonalDataEncryptionUtil util = PersonalDataEncryptionContextHolder.get();
        if (util == null) {
            log.warn("PersonalDataEncryptionUtil 미초기화 - 이름 원본 폴백 반환 (부팅 초기 또는 비-Spring 테스트 컨텍스트)");
            return dbData;
        }
        return util.safeDecrypt(dbData);
    }
}
