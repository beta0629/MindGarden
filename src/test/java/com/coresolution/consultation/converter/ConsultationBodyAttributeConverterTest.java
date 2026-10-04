package com.coresolution.consultation.converter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 상담 본문 암호화 변환기 — 평문·암호문 dual-read 와 실패 내성 검증.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("ConsultationBodyAttributeConverter")
class ConsultationBodyAttributeConverterTest {

    private static final String PLAIN_KOREAN = "내담자가 불안을 호소함. 다음 회기에 호흡 훈련 예정.";
    private static final String CIPHER_WITH_MARKER = "v2::QWJjZGVmZ2hpams=";

    private final ConsultationBodyAttributeConverter converter = new ConsultationBodyAttributeConverter();

    @AfterEach
    void tearDown() {
        PersonalDataEncryptionContextHolder.setInstanceForTesting(null);
    }

    @Test
    @DisplayName("버전 마커 판별 — {keyId}::{base64} 만 암호문으로 본다")
    void looksEncrypted_onlyMatchesVersionMarker() {
        assertThat(ConsultationBodyAttributeConverter.looksEncrypted(CIPHER_WITH_MARKER)).isTrue();
        assertThat(ConsultationBodyAttributeConverter.looksEncrypted(PLAIN_KOREAN)).isFalse();
        // 짧은 ASCII 평문은 Base64 로 디코드되더라도 마커가 없으므로 평문이다 (legacy 추측 경로 미사용)
        assertThat(ConsultationBodyAttributeConverter.looksEncrypted("test")).isFalse();
        assertThat(ConsultationBodyAttributeConverter.looksEncrypted("상담: 진행 중 :: 메모")).isFalse();
        assertThat(ConsultationBodyAttributeConverter.looksEncrypted(null)).isFalse();
    }

    @Test
    @DisplayName("저장 — 평문은 암호화하고, 이미 암호문이면 그대로 둔다(멱등)")
    void convertToDatabaseColumn_encryptsPlainAndKeepsCipher() {
        PersonalDataEncryptionUtil util = mock(PersonalDataEncryptionUtil.class);
        when(util.encrypt(PLAIN_KOREAN)).thenReturn(CIPHER_WITH_MARKER);
        PersonalDataEncryptionContextHolder.setInstanceForTesting(util);

        assertThat(converter.convertToDatabaseColumn(PLAIN_KOREAN)).isEqualTo(CIPHER_WITH_MARKER);
        assertThat(converter.convertToDatabaseColumn(CIPHER_WITH_MARKER)).isEqualTo(CIPHER_WITH_MARKER);
        verify(util, never()).encrypt(CIPHER_WITH_MARKER);
    }

    @Test
    @DisplayName("조회 dual-read — 암호문은 복호화, 기존 평문 행은 그대로 반환")
    void convertToEntityAttribute_readsBothCipherAndPlain() {
        PersonalDataEncryptionUtil util = mock(PersonalDataEncryptionUtil.class);
        when(util.decrypt(CIPHER_WITH_MARKER)).thenReturn(PLAIN_KOREAN);
        PersonalDataEncryptionContextHolder.setInstanceForTesting(util);

        assertThat(converter.convertToEntityAttribute(CIPHER_WITH_MARKER)).isEqualTo(PLAIN_KOREAN);
        assertThat(converter.convertToEntityAttribute(PLAIN_KOREAN)).isEqualTo(PLAIN_KOREAN);
        verify(util, never()).decrypt(PLAIN_KOREAN);
    }

    @Test
    @DisplayName("복호화 실패해도 예외 없이 원본을 반환한다 (목록 전체 500 금지)")
    void convertToEntityAttribute_decryptFailureDoesNotThrow() {
        PersonalDataEncryptionUtil util = mock(PersonalDataEncryptionUtil.class);
        when(util.decrypt(anyString())).thenThrow(new RuntimeException("키 없음"));
        when(util.extractKeyVersion(anyString())).thenReturn("v2");
        PersonalDataEncryptionContextHolder.setInstanceForTesting(util);

        assertThat(converter.convertToEntityAttribute(CIPHER_WITH_MARKER)).isEqualTo(CIPHER_WITH_MARKER);
    }

    @Test
    @DisplayName("암호화 실패해도 예외 없이 평문 폴백으로 저장한다")
    void convertToDatabaseColumn_encryptFailureFallsBackToPlain() {
        PersonalDataEncryptionUtil util = mock(PersonalDataEncryptionUtil.class);
        when(util.encrypt(anyString())).thenThrow(new RuntimeException("활성 키 없음"));
        PersonalDataEncryptionContextHolder.setInstanceForTesting(util);

        assertThat(converter.convertToDatabaseColumn(PLAIN_KOREAN)).isEqualTo(PLAIN_KOREAN);
    }

    @Test
    @DisplayName("유틸 미초기화(부팅 초기·단위 테스트)에서는 입력을 그대로 통과시킨다")
    void nullUtil_passesThrough() {
        PersonalDataEncryptionContextHolder.setInstanceForTesting(null);

        assertThat(converter.convertToDatabaseColumn(PLAIN_KOREAN)).isEqualTo(PLAIN_KOREAN);
        assertThat(converter.convertToEntityAttribute(CIPHER_WITH_MARKER)).isEqualTo(CIPHER_WITH_MARKER);
    }

    @Test
    @DisplayName("null·빈 문자열은 변환하지 않는다")
    void nullAndEmptyAreUntouched() {
        assertThat(converter.convertToDatabaseColumn(null)).isNull();
        assertThat(converter.convertToDatabaseColumn("")).isEmpty();
        assertThat(converter.convertToEntityAttribute(null)).isNull();
        assertThat(converter.convertToEntityAttribute("")).isEmpty();
    }
}
