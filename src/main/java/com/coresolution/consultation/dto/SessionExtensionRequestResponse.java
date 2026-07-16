package com.coresolution.consultation.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.SessionExtensionRequest;
import com.coresolution.consultation.entity.User;
import org.hibernate.Hibernate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 회기 추가 요청 응답 DTO.
 *
 * <p>Lazy {@link User}·{@link ConsultantClientMapping} 연관을 JSON에 직접 노출하지 않고
 * 스칼라·ID·이미 초기화된 연관 필드만 안전하게 직렬화한다.</p>
 *
 * @author CoreSolution
 * @since 2026-07-16
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionExtensionRequestResponse {

    private Long id;
    private String tenantId;
    private Long mappingId;
    private Long requesterId;
    private String requesterName;
    private Integer additionalSessions;
    private String packageName;
    private BigDecimal packagePrice;
    private String status;
    private String reason;
    private String adminComment;
    private Long approvedById;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private LocalDateTime rejectedAt;
    private String rejectionReason;
    private String paymentMethod;
    private String paymentReference;
    private LocalDateTime paymentDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private MappingSummary mapping;

    /**
     * 목록·상세 화면용 매핑 요약 (fetch join 으로 초기화된 경우에만 이름 포함).
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MappingSummary {
        private Long id;
        private Long clientId;
        private String clientName;
        private Long consultantId;
        private String consultantName;
    }

    /**
     * 엔티티를 API 응답 DTO로 변환한다.
     *
     * @param request 회기 추가 요청 엔티티
     * @return 직렬화 안전 DTO (null 입력 시 null)
     */
    public static SessionExtensionRequestResponse fromEntity(SessionExtensionRequest request) {
        if (request == null) {
            return null;
        }

        User requester = request.getRequester();
        User approvedBy = request.getApprovedBy();
        ConsultantClientMapping mapping = request.getMapping();

        return SessionExtensionRequestResponse.builder()
                .id(request.getId())
                .tenantId(request.getTenantId())
                .mappingId(mapping != null ? mapping.getId() : null)
                .requesterId(safeEntityId(requester))
                .requesterName(safeUserName(requester))
                .additionalSessions(request.getAdditionalSessions())
                .packageName(request.getPackageName())
                .packagePrice(request.getPackagePrice())
                .status(request.getStatus() != null ? request.getStatus().name() : null)
                .reason(request.getReason())
                .adminComment(request.getAdminComment())
                .approvedById(safeEntityId(approvedBy))
                .approvedByName(safeUserName(approvedBy))
                .approvedAt(request.getApprovedAt())
                .rejectedAt(request.getRejectedAt())
                .rejectionReason(request.getRejectionReason())
                .paymentMethod(request.getPaymentMethod())
                .paymentReference(request.getPaymentReference())
                .paymentDate(request.getPaymentDate())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .mapping(toMappingSummary(mapping))
                .build();
    }

    /**
     * 엔티티 목록을 응답 DTO 목록으로 변환한다.
     *
     * @param requests 엔티티 목록
     * @return DTO 목록
     */
    public static List<SessionExtensionRequestResponse> fromEntities(List<SessionExtensionRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return Collections.emptyList();
        }
        return requests.stream()
                .map(SessionExtensionRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    private static MappingSummary toMappingSummary(ConsultantClientMapping mapping) {
        if (mapping == null) {
            return null;
        }
        return MappingSummary.builder()
                .id(mapping.getId())
                .clientId(safeEntityId(mapping.getClient()))
                .clientName(safeUserName(mapping.getClient()))
                .consultantId(safeEntityId(mapping.getConsultant()))
                .consultantName(safeUserName(mapping.getConsultant()))
                .build();
    }

    private static Long safeEntityId(User user) {
        return user != null ? user.getId() : null;
    }

    private static String safeUserName(User user) {
        if (user == null || !Hibernate.isInitialized(user)) {
            return null;
        }
        return user.getName();
    }
}
