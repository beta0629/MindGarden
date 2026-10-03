package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.service.PersonalDataDestructionService;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * {@link PersonalDataDestructionController} 2단계 확인 가드 단위 테스트.
 *
 * <p>P0 보안(2026-10-03): 확인 없는 파기 실행이 반드시 거부되는지, 서비스 파기 메서드가
 * 호출되지 않는지 검증한다. 실제 파기는 어디서도 수행하지 않는다(모든 서비스는 mock).
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("PersonalDataDestructionController — 2단계 확인 가드")
class PersonalDataDestructionControllerConfirmationTest {

    private static final int PREVIEW_COUNT = 7;

    @Mock
    private PersonalDataDestructionService personalDataDestructionService;

    @InjectMocks
    private PersonalDataDestructionController controller;

    @Test
    @DisplayName("execute/user-data — confirm 누락 시 거부, 파기 호출 없음")
    void destroyExpiredUserData_withoutConfirm_isRejected() {
        ResponseEntity<Map<String, Object>> response =
                controller.destroyExpiredUserData(null, PREVIEW_COUNT);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(personalDataDestructionService, never()).destroyExpiredUserData();
    }

    @Test
    @DisplayName("execute/user-data — expectedCount 누락 시 거부, 파기 호출 없음")
    void destroyExpiredUserData_withoutExpectedCount_isRejected() {
        ResponseEntity<Map<String, Object>> response =
                controller.destroyExpiredUserData(true, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(personalDataDestructionService, never()).destroyExpiredUserData();
    }

    @Test
    @DisplayName("execute/user-data — 건수 불일치 시 거부, 파기 호출 없음")
    void destroyExpiredUserData_countMismatch_isRejected() {
        when(personalDataDestructionService
                .previewExpiredCount(PersonalDataDestructionService.SCOPE_USER_DATA))
                .thenReturn(PREVIEW_COUNT + 1);

        ResponseEntity<Map<String, Object>> response =
                controller.destroyExpiredUserData(true, PREVIEW_COUNT);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(personalDataDestructionService, never()).destroyExpiredUserData();
    }

    @Test
    @DisplayName("execute/all — 확인 없으면 모든 범위 파기 호출 없음")
    void destroyAll_withoutConfirm_isRejected() {
        ResponseEntity<Map<String, Object>> response = controller.destroyAllExpiredPersonalData(null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(personalDataDestructionService, never()).destroyExpiredUserData();
        verify(personalDataDestructionService, never()).destroyExpiredConsultationData();
        verify(personalDataDestructionService, never()).destroyExpiredPaymentData();
        verify(personalDataDestructionService, never()).destroyExpiredSalaryData();
        verify(personalDataDestructionService, never()).destroyExpiredAccessLogs();
    }

    @Test
    @DisplayName("execute/consultation-data·payment-data·salary-data — 확인 없으면 모두 거부")
    void destroyOtherScopes_withoutConfirm_areRejected() {
        assertThat(controller.destroyExpiredConsultationData(null, null).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(controller.destroyExpiredPaymentData(null, null).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(controller.destroyExpiredSalaryData(null, null).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);

        verify(personalDataDestructionService, never()).destroyExpiredConsultationData();
        verify(personalDataDestructionService, never()).destroyExpiredPaymentData();
        verify(personalDataDestructionService, never()).destroyExpiredSalaryData();
    }

    @Test
    @DisplayName("execute — confirm 누락 / confirmDataId 불일치 시 거부, 파기 호출 없음")
    void executeManual_withoutConfirmation_isRejected() {
        ResponseEntity<Map<String, Object>> noConfirm = controller
                .executeManualPersonalDataDestruction("USER", "user-1", "보관기간 만료", null, "user-1");
        ResponseEntity<Map<String, Object>> mismatch = controller
                .executeManualPersonalDataDestruction("USER", "user-1", "보관기간 만료", true, "user-2");
        ResponseEntity<Map<String, Object>> missingConfirmId = controller
                .executeManualPersonalDataDestruction("USER", "user-1", "보관기간 만료", true, null);

        assertThat(noConfirm.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(mismatch.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(missingConfirmId.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(personalDataDestructionService, never())
                .executeManualPersonalDataDestruction(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("preview — 아무것도 파기하지 않고 범위별 건수만 반환")
    void preview_doesNotDestroy() {
        when(personalDataDestructionService.previewExpiredCounts())
                .thenReturn(Map.of(PersonalDataDestructionService.SCOPE_USER_DATA, PREVIEW_COUNT));

        Map<String, Object> result = controller.previewPersonalDataDestruction();

        assertThat(result).containsEntry("total", PREVIEW_COUNT);
        verify(personalDataDestructionService, never()).destroyExpiredUserData();
        verify(personalDataDestructionService, never()).destroyExpiredConsultationData();
        verify(personalDataDestructionService, never()).destroyExpiredPaymentData();
        verify(personalDataDestructionService, never()).destroyExpiredSalaryData();
        verify(personalDataDestructionService, never()).destroyExpiredAccessLogs();
    }
}
