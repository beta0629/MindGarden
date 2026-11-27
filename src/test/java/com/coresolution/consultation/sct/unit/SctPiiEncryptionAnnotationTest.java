package com.coresolution.consultation.sct.unit;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import com.coresolution.consultation.converter.PersonalNameAttributeConverter;
import com.coresolution.consultation.sct.entity.SctConsent;
import com.coresolution.consultation.sct.entity.SctInvitation;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * SCT PII 컬럼에 {@link PersonalNameAttributeConverter} 가 적용됐는지 검증.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@DisplayName("SCT PII 암호화 어노테이션")
class SctPiiEncryptionAnnotationTest {

    @Test
    @DisplayName("SctInvitation.recipientName — PersonalNameAttributeConverter + length 512")
    void recipientName_hasPersonalNameConverter() throws Exception {
        Field field = SctInvitation.class.getDeclaredField("recipientName");
        Convert convert = field.getAnnotation(Convert.class);
        Column column = field.getAnnotation(Column.class);

        assertThat(convert).isNotNull();
        assertThat(convert.converter()).isEqualTo(PersonalNameAttributeConverter.class);
        assertThat(column.length()).isEqualTo(512);
    }

    @Test
    @DisplayName("SctConsent.guardianRelation — PersonalNameAttributeConverter + length 512")
    void guardianRelation_hasPersonalNameConverter() throws Exception {
        Field field = SctConsent.class.getDeclaredField("guardianRelation");
        Convert convert = field.getAnnotation(Convert.class);
        Column column = field.getAnnotation(Column.class);

        assertThat(convert).isNotNull();
        assertThat(convert.converter()).isEqualTo(PersonalNameAttributeConverter.class);
        assertThat(column.length()).isEqualTo(512);
    }

    @Test
    @DisplayName("SctInvitation — respondentMetaJson 필드 제거됨")
    void respondentMetaJson_fieldRemoved() {
        assertThat(SctInvitation.class.getDeclaredFields())
                .extracting(Field::getName)
                .doesNotContain("respondentMetaJson");
    }
}
