package com.coresolution.consultation.controller;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import com.coresolution.consultation.dto.SessionExtensionRequestResponse;
import com.coresolution.consultation.entity.SessionExtensionRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.SessionExtensionService;
import com.coresolution.core.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link SessionExtensionController#createRequest} 응답 DTO 변환 검증.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SessionExtensionController.createRequest — DTO 응답")
class SessionExtensionControllerCreateRequestTest {

    @Mock
    private SessionExtensionService sessionExtensionService;

    @InjectMocks
    private SessionExtensionController controller;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    @DisplayName("createRequest: 엔티티 대신 SessionExtensionRequestResponse 반환")
    void createRequest_returnsDtoNotEntity() throws Exception {
        User requester = new User();
        requester.setId(3L);
        requester.setName("관리자");
        SessionExtensionRequest saved = SessionExtensionRequest.builder()
                .id(99L)
                .tenantId("tenant-x")
                .requester(requester)
                .additionalSessions(5)
                .packageName("10회기")
                .packagePrice(new BigDecimal("500000"))
                .status(SessionExtensionRequest.ExtensionStatus.PENDING)
                .reason("추가")
                .build();

        when(sessionExtensionService.createRequest(
                eq(10L), eq(3L), eq(5), eq("10회기"), any(BigDecimal.class), eq("추가")))
                .thenReturn(saved);

        Map<String, Object> body = new HashMap<>();
        body.put("mappingId", 10L);
        body.put("requesterId", 3L);
        body.put("additionalSessions", 5);
        body.put("packageName", "10회기");
        body.put("packagePrice", "500000");
        body.put("reason", "추가");

        ResponseEntity<ApiResponse<SessionExtensionRequestResponse>> response =
                controller.createRequest(body);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).isInstanceOf(SessionExtensionRequestResponse.class);
        assertThat(response.getBody().getData().getId()).isEqualTo(99L);
        assertThat(response.getBody().getData().getRequesterId()).isEqualTo(3L);

        String json = objectMapper.writeValueAsString(response.getBody().getData());
        assertThat(json).doesNotContain("\"requester\":{");

        verify(sessionExtensionService).createRequest(
                eq(10L), eq(3L), eq(5), eq("10회기"), any(BigDecimal.class), eq("추가"));
    }
}
