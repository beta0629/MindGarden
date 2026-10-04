package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

/**
 * 상담사 담당 내담자 목록 API 권한·범위 검증.
 *
 * <p>상담일지 관리 화면이 쓰던 {@code /api/v1/admin/clients/with-stats} 는 관리자 전용이라
 * 상담사 로그인에서 403 이었다. 대체 경로는 본인 consultantId 만 허용해야 하고(#1398),
 * 응답에 본인 활성 매칭 내담자만 담겨야 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("ConsultantRecordsController 담당 내담자 목록")
class ConsultantRecordsControllerAssignedClientsTest {

    private static final Long CONSULTANT_ID = 41L;
    private static final Long OTHER_CONSULTANT_ID = 99L;
    private static final String TENANT_ID = "tenant-a";

    private ClientPathAccessGuard clientPathAccessGuard;
    private ConsultantClientMappingRepository mappingRepository;
    private ConsultantRecordsController controller;
    private HttpSession session;

    @BeforeEach
    void setUp() {
        clientPathAccessGuard = mock(ClientPathAccessGuard.class);
        mappingRepository = mock(ConsultantClientMappingRepository.class);
        session = mock(HttpSession.class);

        // 이 엔드포인트가 쓰지 않는 협력자는 null 로 둔다 (검증 대상은 가드·매칭 조회뿐).
        controller = new ConsultantRecordsController(
            null, null, null, null, null, null, null,
            clientPathAccessGuard, mappingRepository);
    }

    private User consultant(Long id) {
        User user = new User();
        user.setId(id);
        user.setTenantId(TENANT_ID);
        return user;
    }

    private ConsultantClientMapping mappingWithClient(Long clientId, String name) {
        User client = new User();
        client.setId(clientId);
        client.setName(name);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setClient(client);
        return mapping;
    }

    @Test
    @DisplayName("본인 consultantId 는 담당 내담자만 돌려받는다")
    void ownConsultantId_returnsAssignedClientsOnly() {
        User caller = consultant(CONSULTANT_ID);
        when(clientPathAccessGuard.requireConsultantAccess(session, CONSULTANT_ID)).thenReturn(caller);
        when(clientPathAccessGuard.requireCallerTenantId(caller)).thenReturn(TENANT_ID);
        when(mappingRepository.findByConsultantIdAndStatusNot(
            eq(TENANT_ID), eq(CONSULTANT_ID), eq(ConsultantClientMapping.MappingStatus.TERMINATED)))
            .thenReturn(List.of(
                mappingWithClient(7L, "홍길동"),
                mappingWithClient(7L, "홍길동"),
                mappingWithClient(8L, "김영희")));

        ResponseEntity<Map<String, Object>> response =
            controller.getAssignedClients(CONSULTANT_ID, session);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).containsEntry("success", true);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> clients = (List<Map<String, Object>>) response.getBody().get("data");
        // 중복 매칭은 1건으로 합쳐진다
        assertThat(clients).hasSize(2);
        assertThat(clients.get(0)).containsEntry("id", 7L).containsEntry("name", "홍길동");
        assertThat(clients.get(1)).containsEntry("id", 8L).containsEntry("name", "김영희");
    }

    @Test
    @DisplayName("다른 상담사 id 로 호출하면 가드가 막는다 (403)")
    void otherConsultantId_isDenied() {
        doThrow(new AccessDeniedException(ClientPathAccessGuard.DENIAL_OWN_CONSULTANT_ONLY))
            .when(clientPathAccessGuard).requireConsultantAccess(session, OTHER_CONSULTANT_ID);

        assertThatThrownBy(() -> controller.getAssignedClients(OTHER_CONSULTANT_ID, session))
            .isInstanceOf(AccessDeniedException.class)
            .hasMessageContaining(ClientPathAccessGuard.DENIAL_OWN_CONSULTANT_ONLY);

        // 가드에서 막혔으면 매칭 조회 자체가 일어나지 않아야 한다 (타인 데이터 조회 금지)
        org.mockito.Mockito.verify(mappingRepository, org.mockito.Mockito.never())
            .findByConsultantIdAndStatusNot(anyString(), anyLong(), any());
    }

    @Test
    @DisplayName("내담자가 비어 있는 매칭은 결과에서 제외한다 (NPE·null id 방지)")
    void mappingWithoutClient_isSkipped() {
        User caller = consultant(CONSULTANT_ID);
        when(clientPathAccessGuard.requireConsultantAccess(session, CONSULTANT_ID)).thenReturn(caller);
        when(clientPathAccessGuard.requireCallerTenantId(caller)).thenReturn(TENANT_ID);
        ConsultantClientMapping noClient = new ConsultantClientMapping();
        when(mappingRepository.findByConsultantIdAndStatusNot(anyString(), anyLong(), any()))
            .thenReturn(List.of(noClient, mappingWithClient(7L, "홍길동")));

        ResponseEntity<Map<String, Object>> response =
            controller.getAssignedClients(CONSULTANT_ID, session);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> clients = (List<Map<String, Object>>) response.getBody().get("data");
        assertThat(clients).hasSize(1);
        assertThat(clients.get(0)).containsEntry("id", 7L);
    }
}
