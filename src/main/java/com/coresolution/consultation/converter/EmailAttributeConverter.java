package com.coresolution.consultation.converter;

import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

/**
 * 이메일 PII 컬럼용 JPA AttributeConverter SSOT.
 *
 * <p>{@code user.email}, {@code client.email} 등 이메일 컬럼에 적용하여 DB 저장 시
 * AES-256/CBC 자동 암호화·조회 시 자동 복호화한다. 내부 구현은
 * {@link PersonalDataEncryptionUtil#safeEncrypt(String)} /
 * {@link PersonalDataEncryptionUtil#safeDecrypt(String)} 를 위임 호출하여
 * <strong>멱등성</strong> 을 보장한다(이미 암호화된 값을 재차 변환해도 결과 동일).
 * 이는 기존 서비스 레이어 코드가 수동 {@code safeEncrypt}/{@code safeDecrypt} 호출을
 * 유지하더라도 회귀를 일으키지 않도록 하기 위한 의도된 설계이다.</p>
 *
 * <h3>관련 표준</h3>
 * <ul>
 *   <li>docs/standards/PII_PROTECTION_STANDARD.md §2~§3 — 적용 컬럼·구현 패턴</li>
 *   <li>docs/standards/ENCRYPTION_STANDARD.md — AES-256/CBC 사양</li>
 *   <li>docs/standards/SECRET_ROTATION_POLICY.md §2~§4 — 키 회전 절차</li>
 * </ul>
 *
 * <h3>적용 예시</h3>
 * <pre>{@code
 * @Convert(converter = EmailAttributeConverter.class)
 * @Column(name = "email", length = 512)
 * private String email;
 * }</pre>
 *
 * @author CoreSolution
 * @since 2026-06-14
 */
@Slf4j
@Converter
public class EmailAttributeConverter implements AttributeConverter<String, String> {

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        PersonalDataEncryptionUtil util = PersonalDataEncryptionContextHolder.get();
        if (util == null) {
            log.warn("PersonalDataEncryptionUtil 미초기화 - 이메일 평문 폴백 반환 (부팅 초기 또는 비-Spring 테스트 컨텍스트)");
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
            log.warn("PersonalDataEncryptionUtil 미초기화 - 이메일 원본 폴백 반환 (부팅 초기 또는 비-Spring 테스트 컨텍스트)");
            return dbData;
        }
        return util.safeDecrypt(dbData);
    }
}
