package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.coresolution.consultation.constant.ClientEventApiConstants;
import com.coresolution.consultation.constant.ClientEventSource;
import com.coresolution.consultation.constant.ClientEventType;
import com.coresolution.consultation.dto.ClientEventResponse;
import com.coresolution.consultation.service.ClientEventService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.integrationtest.clientevent.ClientEventAdminControllerMvcTestApplication;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * 내담자 관리용 타임라인 API — 역할·테넌트 가드 MockMvc.
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@SpringBootTest(classes = ClientEventAdminControllerMvcTestApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("ClientEventAdminController MockMvc")
class ClientEventAdminControllerMvcTest {

    private static final Long CLIENT_ID = 42L;
    private static final String URI = "/api/v1/admin/clients/" + CLIENT_ID + "/events";

    private String tenantId;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ClientEventService clientEventService;

    @BeforeEach
    void setUp() {
        tenantId = "tenant-client-event-" + UUID.randomUUID();
        TenantContextHolder.setTenantId(tenantId);
        ClientEventResponse sample = ClientEventResponse.builder()
                .id(1L)
                .clientId(CLIENT_ID)
                .eventType(ClientEventType.MAPPING_CREATED.getCode())
                .occurredAt(LocalDateTime.of(2026, 11, 1, 9, 0))
                .actorUserId(7L)
                .actorRole("ADMIN")
                .source(ClientEventSource.API.getCode())
                .mappingId(100L)
                .sessionsRemainingBefore(10)
                .sessionsRemainingAfter(10)
                .build();
        when(clientEventService.findTimeline(eq(tenantId), eq(CLIENT_ID), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sample), PageRequest.of(0, 20), 1));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("미인증 → 401, 서비스 미호출")
    void unauthenticated_returns401() throws Exception {
        mockMvc.perform(get(URI)).andExpect(status().isUnauthorized());
        verifyNoInteractions(clientEventService);
    }

    @Test
    @DisplayName("CLIENT → 403, 서비스 미호출")
    @WithMockUser(roles = {"CLIENT"})
    void client_returns403() throws Exception {
        mockMvc.perform(get(URI)).andExpect(status().isForbidden());
        verify(clientEventService, never()).findTimeline(any(), any(), any());
    }

    @Test
    @DisplayName("CONSULTANT → 403, 서비스 미호출")
    @WithMockUser(roles = {"CONSULTANT"})
    void consultant_returns403() throws Exception {
        mockMvc.perform(get(URI)).andExpect(status().isForbidden());
        verify(clientEventService, never()).findTimeline(any(), any(), any());
    }

    @Test
    @DisplayName("ADMIN → 200, 현재 tenantId+clientId 로만 조회 · 기본 ASC 정렬")
    @WithMockUser(roles = {"ADMIN"})
    void admin_returns200_withAscSort() throws Exception {
        mockMvc.perform(get(URI))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.events.length()").value(1))
                .andExpect(jsonPath("$.data.events[0].eventType")
                        .value(ClientEventType.MAPPING_CREATED.getCode()))
                .andExpect(jsonPath("$.data.events[0].mappingId").value(100))
                .andExpect(jsonPath("$.data.events[0].sessionsRemainingBefore").value(10));

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(clientEventService).findTimeline(eq(tenantId), eq(CLIENT_ID), pageableCaptor.capture());
        Pageable used = pageableCaptor.getValue();
        Sort.Order occurred = used.getSort().getOrderFor(ClientEventApiConstants.SORT_PROPERTY_OCCURRED_AT);
        Sort.Order idOrder = used.getSort().getOrderFor(ClientEventApiConstants.SORT_PROPERTY_ID);
        assertThat(occurred).isNotNull();
        assertThat(occurred.getDirection()).isEqualTo(Sort.Direction.ASC);
        assertThat(idOrder).isNotNull();
        assertThat(idOrder.getDirection()).isEqualTo(Sort.Direction.ASC);
    }

    @Test
    @DisplayName("STAFF → 200")
    @WithMockUser(roles = {"STAFF"})
    void staff_returns200() throws Exception {
        mockMvc.perform(get(URI))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalCount").value(1));
        verify(clientEventService).findTimeline(eq(tenantId), eq(CLIENT_ID), any(Pageable.class));
    }

    @Test
    @DisplayName("타 테넌트 컨텍스트로 조회해도 서비스에는 현재 TenantContext tenantId 만 전달")
    @WithMockUser(roles = {"ADMIN"})
    void usesCurrentTenantContextOnly() throws Exception {
        String otherTenant = "tenant-other-" + UUID.randomUUID();
        TenantContextHolder.setTenantId(otherTenant);
        when(clientEventService.findTimeline(eq(otherTenant), eq(CLIENT_ID), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 20), 0));

        mockMvc.perform(get(URI)).andExpect(status().isOk());

        verify(clientEventService).findTimeline(eq(otherTenant), eq(CLIENT_ID), any(Pageable.class));
        verify(clientEventService, never()).findTimeline(eq(tenantId), any(), any());
    }

    @Test
    @DisplayName("sort=desc → occurredAt DESC, id DESC")
    @WithMockUser(roles = {"ADMIN"})
    void sortDesc_usesDescendingOrders() throws Exception {
        mockMvc.perform(get(URI).param("sort", ClientEventApiConstants.SORT_DESC))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(clientEventService).findTimeline(eq(tenantId), eq(CLIENT_ID), pageableCaptor.capture());
        Pageable used = pageableCaptor.getValue();
        Sort.Order occurred = used.getSort().getOrderFor(ClientEventApiConstants.SORT_PROPERTY_OCCURRED_AT);
        Sort.Order idOrder = used.getSort().getOrderFor(ClientEventApiConstants.SORT_PROPERTY_ID);
        assertThat(occurred.getDirection()).isEqualTo(Sort.Direction.DESC);
        assertThat(idOrder.getDirection()).isEqualTo(Sort.Direction.DESC);
    }
}
