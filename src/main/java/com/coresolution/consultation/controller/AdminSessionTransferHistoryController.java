package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.SessionTransferHistoryResponse;
import com.coresolution.consultation.service.SessionTransferHistoryService;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 회기 승계·이관 이력 조회 API (읽기 전용).
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminSessionTransferHistoryController extends BaseApiController {

    private final SessionTransferHistoryService sessionTransferHistoryService;

    /**
     * 내담자 기준 승계·이관 이력.
     *
     * @param clientId 내담자 ID
     * @return 최신순 이력
     */
    @GetMapping("/clients/{clientId}/session-transfer-history")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CONSULTANT')")
    public ResponseEntity<ApiResponse<SessionTransferHistoryResponse>> byClient(
            @PathVariable Long clientId) {
        log.info("회기 승계·이관 이력(내담자): clientId={}", clientId);
        return success(sessionTransferHistoryService.findByClientId(clientId));
    }

    /**
     * 매핑 기준 승계·이관 이력.
     *
     * @param mappingId 매핑 ID
     * @return 최신순 이력
     */
    @GetMapping("/mappings/{mappingId}/session-transfer-history")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CONSULTANT')")
    public ResponseEntity<ApiResponse<SessionTransferHistoryResponse>> byMapping(
            @PathVariable Long mappingId) {
        log.info("회기 승계·이관 이력(매핑): mappingId={}", mappingId);
        return success(sessionTransferHistoryService.findByMappingId(mappingId));
    }
}
