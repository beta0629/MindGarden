package com.coresolution.consultation.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.SessionExtensionRequest;
import com.coresolution.consultation.entity.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@link SessionExtensionRequestResponse} 직렬화 안전 변환 테스트.
 */
@DisplayName("SessionExtensionRequestResponse — lazy proxy 직렬화 방지")
class SessionExtensionRequestResponseTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    @DisplayName("fromEntity: 스칼라·ID·초기화된 연관 필드만 DTO에 매핑")
    void fromEntity_mapsScalarsAndIds() {
        User requester = new User();
        requester.setId(3L);
        requester.setName("요청자");
        User consultant = new User();
        consultant.setId(10L);
        consultant.setName("상담사");
        User client = new User();
        client.setId(20L);
        client.setName("내담자");
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .consultant(consultant)
                .client(client)
                .build();
        mapping.setId(100L);

        SessionExtensionRequest entity = SessionExtensionRequest.builder()
                .id(1L)
                .tenantId("tenant-a")
                .mapping(mapping)
                .requester(requester)
                .additionalSessions(5)
                .packageName("10회기")
                .packagePrice(new BigDecimal("500000"))
                .status(SessionExtensionRequest.ExtensionStatus.PENDING)
                .reason("회기 추가")
                .createdAt(LocalDateTime.of(2026, 7, 16, 10, 0))
                .updatedAt(LocalDateTime.of(2026, 7, 16, 10, 0))
                .build();

        SessionExtensionRequestResponse response = SessionExtensionRequestResponse.fromEntity(entity);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getTenantId()).isEqualTo("tenant-a");
        assertThat(response.getMappingId()).isEqualTo(100L);
        assertThat(response.getRequesterId()).isEqualTo(3L);
        assertThat(response.getRequesterName()).isEqualTo("요청자");
        assertThat(response.getStatus()).isEqualTo("PENDING");
        assertThat(response.getMapping()).isNotNull();
        assertThat(response.getMapping().getConsultantName()).isEqualTo("상담사");
        assertThat(response.getMapping().getClientName()).isEqualTo("내담자");
    }

    @Test
    @DisplayName("fromEntity: Jackson 직렬화 시 User 엔티티 중첩 없음")
    void fromEntity_serializesWithoutNestedUserEntity() throws Exception {
        User requester = new User();
        requester.setId(3L);
        requester.setName("요청자");
        SessionExtensionRequest entity = SessionExtensionRequest.builder()
                .id(1L)
                .tenantId("tenant-a")
                .requester(requester)
                .additionalSessions(3)
                .packageName("패키지")
                .packagePrice(new BigDecimal("300000"))
                .status(SessionExtensionRequest.ExtensionStatus.PENDING)
                .build();

        String json = objectMapper.writeValueAsString(
                SessionExtensionRequestResponse.fromEntity(entity));

        assertThat(json).contains("\"requesterId\":3");
        assertThat(json).contains("\"requesterName\":\"요청자\"");
        assertThat(json).doesNotContain("\"requester\":{");
        assertThat(json).doesNotContain("\"password\"");
    }

    @Test
    @DisplayName("fromEntities: null·빈 목록은 빈 리스트 반환")
    void fromEntities_handlesEmptyInput() {
        assertThat(SessionExtensionRequestResponse.fromEntities(null)).isEmpty();
        assertThat(SessionExtensionRequestResponse.fromEntities(List.of())).isEmpty();
    }
}
