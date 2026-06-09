package com.coresolution.consultation.controller;

import java.util.List;
import com.coresolution.consultation.dto.share.ConsultantMappingActiveStatusResponse;
import com.coresolution.consultation.dto.share.ConsultantMappingActiveStatusResponse.ConsultantMappingSummary;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 내담자 본인의 활성 상담사 매핑 사전 조회 — 마음 날씨·무드 저널 공유 가드용.
 *
 * <p>FE 가 공유 버튼을 disabled 하거나 안내 모달을 띄우기 전에 호출. 기존
 * {@link ClientShopController#listConsultantMappings} 와 달리 {@code CLIENT_SHOP}
 * 컴포넌트 활성화에 의존하지 않고 모든 테넌트에서 동작한다.</p>
 *
 * <p>응답: {@link ConsultantMappingActiveStatusResponse} — PII 미포함, mappingId·consultantId·status 만.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/clients/me/consultant-mappings")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ClientConsultantMappingShareGuardController extends BaseApiController {

    private final ConsultantClientMappingRepository consultantClientMappingRepository;

    /**
     * 내담자 본인 기준 공유 가능한 매핑 (ACTIVE 또는 SESSIONS_EXHAUSTED) 조회.
     *
     * @param session HTTP 세션
     * @return {@link ConsultantMappingActiveStatusResponse}
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<ConsultantMappingActiveStatusResponse>> getActiveMappingStatus(
            HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("로그인이 필요합니다."));
        }
        if (currentUser.getRole() == null || !currentUser.getRole().isClient()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("내담자 전용 API 입니다."));
        }
        String tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("테넌트 정보가 없습니다."));
        }
        try {
            TenantContextHolder.setTenantId(tenantId.trim());
            List<ConsultantClientMapping> nonInactive = consultantClientMappingRepository
                .findByClientIdAndStatusNot(
                    tenantId.trim(),
                    currentUser.getId(),
                    ConsultantClientMapping.MappingStatus.INACTIVE);
            List<ConsultantMappingSummary> shareable = nonInactive.stream()
                .filter(m -> m.getStatus() == ConsultantClientMapping.MappingStatus.ACTIVE
                    || m.getStatus() == ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED)
                .map(m -> ConsultantMappingSummary.builder()
                    .mappingId(m.getId())
                    .consultantId(m.getConsultant() != null ? m.getConsultant().getId() : null)
                    .status(m.getStatus() != null ? m.getStatus().name() : null)
                    .build())
                .toList();
            ConsultantMappingActiveStatusResponse data = ConsultantMappingActiveStatusResponse.builder()
                .hasActiveMapping(!shareable.isEmpty())
                .mappings(shareable)
                .build();
            return success(data);
        } finally {
            TenantContextHolder.clear();
        }
    }
}
