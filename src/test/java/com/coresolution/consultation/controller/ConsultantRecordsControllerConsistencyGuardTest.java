package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ConsultationRecordService;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.MockedStatic;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

/**
 * 상담기록 정합성 점검·정리 API — 같은 테넌트 관리자·사무원만 (#1421).
 *
 * <p>예전에는 내담자 토큰도 200 으로 상담사 상담기록 요약을 받았다. 실제 {@link ClientPathAccessGuard} 로
 * 거부를 판정하고, 거부 시 일정·상담기록 서비스가 한 번도 불리지 않는지 확인한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("ConsultantRecordsController data-consistency-check·cleanup — 관리자 전용 가드")
class ConsultantRecordsControllerConsistencyGuardTest {

    private static final Long CONSULTANT_ID = 41L;
    private static final String TENANT_ID = "tenant-a";
    private static final String OTHER_TENANT_ID = "tenant-b";
    private static final String CHECK = "check";

    private ScheduleService scheduleService;
    private ConsultationRecordService recordService;
    private UserRepository userRepository;
    private ConsultantRecordsController controller;
    private HttpSession session;

    @BeforeEach
    void setUp() {
        scheduleService = mock(ScheduleService.class);
        recordService = mock(ConsultationRecordService.class);
        userRepository = mock(UserRepository.class);
        ConsultantClientMappingRepository mappingRepository = mock(ConsultantClientMappingRepository.class);
        session = mock(HttpSession.class);
        ClientPathAccessGuard guard = new ClientPathAccessGuard(mappingRepository, userRepository);
        controller = new ConsultantRecordsController(
            recordService, null, null, userRepository, scheduleService, null, null, guard, mappingRepository);
        TenantContextHolder.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private static User user(Long id, UserRole role, String tenantId) {
        User user = new User();
        user.setId(id);
        user.setRole(role);
        user.setTenantId(tenantId);
        return user;
    }

    private ResponseEntity<Map<String, Object>> callAs(User caller, String endpoint) {
        Function<Long, ResponseEntity<Map<String, Object>>> call = CHECK.equals(endpoint)
            ? id -> controller.checkDataConsistency(id, session)
            : id -> controller.cleanupInconsistentData(id, session);
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(caller);
            return call.apply(CONSULTANT_ID);
        }
    }

    private void assertNoServiceCall() {
        verifyNoInteractions(scheduleService, recordService);
    }

    @ParameterizedTest
    @ValueSource(strings = {CHECK, "cleanup"})
    @DisplayName("미인증 — 401, 서비스 호출 없음")
    void anonymous_unauthorized(String endpoint) {
        assertThatThrownBy(() -> callAs(null, endpoint)).isInstanceOf(UnauthorizedException.class);
        assertNoServiceCall();
    }

    @ParameterizedTest
    @ValueSource(strings = {CHECK, "cleanup"})
    @DisplayName("내담자 — 403, 서비스 호출 없음")
    void client_denied(String endpoint) {
        assertThatThrownBy(() -> callAs(user(7L, UserRole.CLIENT, TENANT_ID), endpoint))
            .isInstanceOf(AccessDeniedException.class);
        assertNoServiceCall();
    }

    @ParameterizedTest
    @ValueSource(strings = {CHECK, "cleanup"})
    @DisplayName("상담사 본인 id 라도 — 403, 서비스 호출 없음")
    void consultantSelf_denied(String endpoint) {
        assertThatThrownBy(() -> callAs(user(CONSULTANT_ID, UserRole.CONSULTANT, TENANT_ID), endpoint))
            .isInstanceOf(AccessDeniedException.class);
        assertNoServiceCall();
    }

    @ParameterizedTest
    @ValueSource(strings = {CHECK, "cleanup"})
    @DisplayName("다른 테넌트 관리자 — 403, 서비스 호출 없음")
    void otherTenantAdmin_denied(String endpoint) {
        when(userRepository.findByTenantIdAndId(OTHER_TENANT_ID, CONSULTANT_ID)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> callAs(user(1L, UserRole.ADMIN, OTHER_TENANT_ID), endpoint))
            .isInstanceOf(AccessDeniedException.class);
        assertNoServiceCall();
    }

    @ParameterizedTest
    @ValueSource(strings = {CHECK, "cleanup"})
    @DisplayName("같은 테넌트 관리자 — 200")
    void sameTenantAdmin_allowed(String endpoint) {
        when(userRepository.findByTenantIdAndId(TENANT_ID, CONSULTANT_ID))
            .thenReturn(Optional.of(user(CONSULTANT_ID, UserRole.CONSULTANT, TENANT_ID)));
        when(scheduleService.findSchedulesByUserRole(anyLong(), anyString())).thenReturn(List.of());
        Page<com.coresolution.consultation.entity.ConsultationRecord> empty = new PageImpl<>(List.of());
        when(recordService.getConsultationRecords(any(), any(), any())).thenReturn(empty);

        ResponseEntity<Map<String, Object>> response = callAs(user(1L, UserRole.ADMIN, TENANT_ID), endpoint);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }
}
