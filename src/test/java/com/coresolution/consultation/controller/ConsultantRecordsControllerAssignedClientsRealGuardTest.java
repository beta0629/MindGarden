package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

/**
 * 상담사 담당 내담자 목록 — 실제 {@link ClientPathAccessGuard} 판정으로 권한 반례 검증.
 *
 * <p>가드를 목으로 대체한 테스트와 달리, 내담자·다른 상담사·다른 테넌트 관리자 호출이
 * 실제로 막히고 그때 매칭 조회(=다른 사용자 데이터 읽기)가 일어나지 않음을 확인한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("ConsultantRecordsController 담당 내담자 목록 — 실제 가드")
class ConsultantRecordsControllerAssignedClientsRealGuardTest {

    private static final Long CONSULTANT_ID = 41L;
    private static final Long OTHER_CONSULTANT_ID = 99L;
    private static final String TENANT_ID = "tenant-a";
    private static final String OTHER_TENANT_ID = "tenant-b";

    private ConsultantClientMappingRepository mappingRepository;
    private UserRepository userRepository;
    private ConsultantRecordsController controller;
    private HttpSession session;

    @BeforeEach
    void setUp() {
        mappingRepository = mock(ConsultantClientMappingRepository.class);
        userRepository = mock(UserRepository.class);
        session = mock(HttpSession.class);
        ClientPathAccessGuard guard = new ClientPathAccessGuard(mappingRepository, userRepository);
        controller = new ConsultantRecordsController(
            null, null, null, null, null, null, guard, mappingRepository);
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

    private ResponseEntity<Map<String, Object>> callAs(User caller, Long consultantId) {
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(caller);
            return controller.getAssignedClients(consultantId, session);
        }
    }

    @Test
    @DisplayName("상담사 본인 id — 200, 본인 테넌트·본인 id 로만 매칭을 조회한다")
    void ownConsultant_allowed() {
        User client = user(7L, UserRole.CLIENT, TENANT_ID);
        client.setName("담당내담자");
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setClient(client);
        when(mappingRepository.findByConsultantIdAndStatusNot(TENANT_ID, CONSULTANT_ID,
                ConsultantClientMapping.MappingStatus.TERMINATED))
            .thenReturn(List.of(mapping));

        ResponseEntity<Map<String, Object>> response =
            callAs(user(CONSULTANT_ID, UserRole.CONSULTANT, TENANT_ID), CONSULTANT_ID);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> data = (List<Map<String, Object>>) response.getBody().get("data");
        assertThat(data).extracting(m -> m.get("id")).containsExactly(7L);
    }

    @Test
    @DisplayName("다른 상담사 id — 403, 매칭 조회 없음")
    void otherConsultant_denied() {
        User caller = user(CONSULTANT_ID, UserRole.CONSULTANT, TENANT_ID);
        assertThatThrownBy(() -> callAs(caller, OTHER_CONSULTANT_ID))
            .isInstanceOf(AccessDeniedException.class);
        verify(mappingRepository, never()).findByConsultantIdAndStatusNot(anyString(), anyLong(), any());
    }

    @Test
    @DisplayName("내담자 역할 — 자기 id 로 불러도 403, 매칭 조회 없음")
    void clientRole_denied() {
        User caller = user(7L, UserRole.CLIENT, TENANT_ID);
        assertThatThrownBy(() -> callAs(caller, 7L))
            .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> callAs(caller, CONSULTANT_ID))
            .isInstanceOf(AccessDeniedException.class);
        verify(mappingRepository, never()).findByConsultantIdAndStatusNot(anyString(), anyLong(), any());
    }

    @Test
    @DisplayName("다른 테넌트 관리자 — 대상 상담사가 자기 테넌트에 없으면 403")
    void otherTenantAdmin_denied() {
        User caller = user(1L, UserRole.ADMIN, OTHER_TENANT_ID);
        when(userRepository.findByTenantIdAndId(OTHER_TENANT_ID, CONSULTANT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> callAs(caller, CONSULTANT_ID))
            .isInstanceOf(AccessDeniedException.class);
        verify(mappingRepository, never()).findByConsultantIdAndStatusNot(anyString(), anyLong(), any());
    }
}
