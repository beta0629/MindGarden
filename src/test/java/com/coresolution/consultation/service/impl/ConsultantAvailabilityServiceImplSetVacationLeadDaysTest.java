package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Map;
import com.coresolution.consultation.constant.ConsultantAvailabilityUserFacingMessages;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.Vacation;
import com.coresolution.consultation.repository.ConsultantAvailabilityRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.VacationRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.util.ReservationSmsBusinessHours;
import com.coresolution.consultation.utils.SessionUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ConsultantAvailabilityServiceImpl#setVacation} 휴가 D-2 선행일·Admin/Staff 우회 단위 테스트.
 *
 * <p>setVacationData(테스트 헬퍼)는 Admin/Staff 전용 시드 경로로 보고 D-2 가드를 적용하지 않음.</p>
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConsultantAvailabilityServiceImpl.setVacation — D-2 / Admin·Staff bypass")
class ConsultantAvailabilityServiceImplSetVacationLeadDaysTest {

    private static final Long CONSULTANT_ID = 42L;

    @Mock
    private ConsultantAvailabilityRepository availabilityRepository;
    @Mock
    private VacationRepository vacationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CommonCodeService commonCodeService;

    private MockedStatic<SessionUtils> sessionUtilsStatic;
    private ConsultantAvailabilityServiceImpl service;

    @BeforeEach
    void setUp() {
        sessionUtilsStatic = mockStatic(SessionUtils.class);
        service = new ConsultantAvailabilityServiceImpl(
                availabilityRepository,
                vacationRepository,
                userRepository,
                commonCodeService);
    }

    @AfterEach
    void tearDown() {
        sessionUtilsStatic.close();
    }

    private static LocalDate seoulToday() {
        return LocalDate.now(ReservationSmsBusinessHours.ZONE_SEOUL);
    }

    private static User userWithRole(UserRole role) {
        User user = new User();
        user.setId(1L);
        user.setRole(role);
        return user;
    }

    private void stubSaveAsPersisted() {
        when(vacationRepository.findByConsultantIdAndVacationDateAndIsDeletedFalse(any(), any()))
                .thenReturn(null);
        when(vacationRepository.save(any(Vacation.class))).thenAnswer(invocation -> {
            Vacation v = invocation.getArgument(0);
            v.setId(100L);
            return v;
        });
        when(commonCodeService.getCodeName(any(), any())).thenAnswer(inv -> inv.getArgument(1));
    }

    @Test
    @DisplayName("CONSULTANT + D-0 → fail-closed 거부, save 미호출")
    void consultant_d0_rejects() {
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(null))
                .thenReturn(userWithRole(UserRole.CONSULTANT));
        String date = seoulToday().toString();

        assertThatThrownBy(() -> service.setVacation(
                        CONSULTANT_ID, date, "ALL_DAY", "개인사유", null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(ConsultantAvailabilityUserFacingMessages.MSG_VACATION_LEAD_DAYS_DENIED);
        verify(vacationRepository, never()).save(any());
    }

    @Test
    @DisplayName("CONSULTANT + D-1 → fail-closed 거부")
    void consultant_d1_rejects() {
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(null))
                .thenReturn(userWithRole(UserRole.CONSULTANT));
        String date = seoulToday().plusDays(1).toString();

        assertThatThrownBy(() -> service.setVacation(
                        CONSULTANT_ID, date, "ALL_DAY", "개인사유", null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(ConsultantAvailabilityUserFacingMessages.MSG_VACATION_LEAD_DAYS_DENIED);
        verify(vacationRepository, never()).save(any());
    }

    @Test
    @DisplayName("CONSULTANT + D-2 → 허용 및 저장")
    void consultant_d2_allows() {
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(null))
                .thenReturn(userWithRole(UserRole.CONSULTANT));
        stubSaveAsPersisted();
        LocalDate vacationDate = seoulToday().plusDays(2);

        Map<String, Object> result = service.setVacation(
                CONSULTANT_ID, vacationDate.toString(), "ALL_DAY", "개인사유", null, null);

        assertThat(result.get("id")).isEqualTo(100L);
        ArgumentCaptor<Vacation> captor = ArgumentCaptor.forClass(Vacation.class);
        verify(vacationRepository).save(captor.capture());
        assertThat(captor.getValue().getVacationDate()).isEqualTo(vacationDate);
    }

    @Test
    @DisplayName("ADMIN + D-0 → 즉시 등록 우회")
    void admin_d0_bypasses() {
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(null))
                .thenReturn(userWithRole(UserRole.ADMIN));
        stubSaveAsPersisted();
        LocalDate vacationDate = seoulToday();

        Map<String, Object> result = service.setVacation(
                CONSULTANT_ID, vacationDate.toString(), "ALL_DAY", "관리자등록", null, null);

        assertThat(result.get("id")).isEqualTo(100L);
        verify(vacationRepository).save(any(Vacation.class));
    }

    @Test
    @DisplayName("STAFF + D-0 → 즉시 등록 우회")
    void staff_d0_bypasses() {
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(null))
                .thenReturn(userWithRole(UserRole.STAFF));
        stubSaveAsPersisted();
        LocalDate vacationDate = seoulToday();

        Map<String, Object> result = service.setVacation(
                CONSULTANT_ID, vacationDate.toString(), "ALL_DAY", "스텝등록", null, null);

        assertThat(result.get("id")).isEqualTo(100L);
        verify(vacationRepository).save(any(Vacation.class));
    }

    @Test
    @DisplayName("호출자 null(역할 미확인) + D-0 → fail-closed 거부")
    void unknownCaller_d0_rejects() {
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(null);
        String date = seoulToday().toString();

        assertThatThrownBy(() -> service.setVacation(
                        CONSULTANT_ID, date, "ALL_DAY", "사유", null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(ConsultantAvailabilityUserFacingMessages.MSG_VACATION_LEAD_DAYS_DENIED);
        verify(vacationRepository, never()).save(any());
    }
}
