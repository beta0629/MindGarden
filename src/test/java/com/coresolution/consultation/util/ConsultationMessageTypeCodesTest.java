package com.coresolution.consultation.util;

import com.coresolution.consultation.service.CommonCodeService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ConsultationMessageTypeCodes")
class ConsultationMessageTypeCodesTest {

    @Mock
    private CommonCodeService commonCodeService;

    @Test
    @DisplayName("공통코드 20자 초과 시 canonical fallback")
    void resolve_whenCodeValueTooLong_usesFallback() {
        when(commonCodeService.getCodeValue("MESSAGE_TYPE", "APPOINTMENT"))
                .thenReturn("APPOINTMENT_CONFIRMATION");

        String resolved = ConsultationMessageTypeCodes.resolve(
                commonCodeService, "APPOINTMENT", ConsultationMessageTypeCodes.CANONICAL_APPOINTMENT);

        assertThat(resolved).isEqualTo(ConsultationMessageTypeCodes.CANONICAL_APPOINTMENT);
        assertThat(resolved.length()).isLessThanOrEqualTo(ConsultationMessageTypeCodes.MAX_MESSAGE_TYPE_LENGTH);
    }

    @Test
    @DisplayName("20자 이하 code_value는 그대로 사용")
    void resolve_whenCodeValueWithinLimit_usesCodeValue() {
        when(commonCodeService.getCodeValue("MESSAGE_TYPE", "NEW_APPOINTMENT")).thenReturn("NEW_APPOINTMENT");

        String resolved = ConsultationMessageTypeCodes.resolve(
                commonCodeService, "NEW_APPOINTMENT", ConsultationMessageTypeCodes.CANONICAL_NEW_APPOINTMENT);

        assertThat(resolved).isEqualTo("NEW_APPOINTMENT");
    }
}
