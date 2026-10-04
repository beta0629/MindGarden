package com.coresolution.consultation.controller;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import com.coresolution.consultation.dto.ConsultationRecordAccessLogResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultationRecordAccessLogRepository;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 상담일지 열람 감사 로그 조회 API (관리자 전용 · 읽기 전용).
 *
 * <p>같은 테넌트 관리자·사무원만 호출할 수 있고, 조회 범위는 호출자 테넌트로 강제된다.
 * 응답에는 상담일지 본문이 들어가지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/consultation-record-access-logs")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ConsultationRecordAccessLogAdminController extends BaseApiController {

    private final ClientPathAccessGuard clientPathAccessGuard;
    private final ConsultationRecordAccessLogRepository consultationRecordAccessLogRepository;

    /**
     * 테넌트 범위 상담일지 열람 감사 로그 조회 (최신순 페이지).
     *
     * @param recordId 상담일지 ID 필터 (nullable)
     * @param actorId 행위자 users.id 필터 (nullable)
     * @param action 행위 필터 (VIEW/LIST/AI_GENERATE/EXPORT, nullable)
     * @param from 조회 시작 시각 (nullable)
     * @param to 조회 종료 시각 (nullable)
     * @param pageable 페이지 정보
     * @param session HTTP 세션
     * @return 감사 로그 페이지
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> search(
            @RequestParam(required = false) Long recordId,
            @RequestParam(required = false) Long actorId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @PageableDefault(size = 20) Pageable pageable,
            HttpSession session) {

        User caller = clientPathAccessGuard.requireTenantManager(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        log.info("🧾 상담일지 열람 감사 로그 조회: recordId={}, actorId={}, action={}, page={}",
                recordId, actorId, action, pageable.getPageNumber());

        Page<ConsultationRecordAccessLogResponse> page = consultationRecordAccessLogRepository
                .searchByTenant(tenantId, recordId, actorId, action, from, to, pageable)
                .map(ConsultationRecordAccessLogResponse::fromEntity);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("logs", page.getContent());
        data.put("totalCount", page.getTotalElements());
        data.put("totalPages", page.getTotalPages());
        data.put("number", page.getNumber());
        data.put("size", page.getSize());
        data.put("last", page.isLast());

        return success(data);
    }
}
