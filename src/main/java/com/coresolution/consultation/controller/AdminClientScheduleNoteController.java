package com.coresolution.consultation.controller;

import java.util.Map;
import com.coresolution.consultation.dto.ClientScheduleNoteCreateRequest;
import com.coresolution.consultation.dto.ClientScheduleNoteResponse;
import com.coresolution.consultation.dto.ClientScheduleNoteUpdateRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.service.ClientScheduleNoteService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 통합 스케줄 맥락 — 내담자 특이사항 REST API. 입금 확인 adminNote와 분리.
 *
 * @author CoreSolution
 * @since 2026-04-29
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/schedule-notes")
@RequiredArgsConstructor
@org.springframework.web.bind.annotation.CrossOrigin(origins = "*")
public class AdminClientScheduleNoteController extends BaseApiController {

    private final ClientScheduleNoteService clientScheduleNoteService;

    /**
     * 특이사항 목록. clientId·scheduleId·mappingId 중 최소 1개.
     *
     * @param clientId 내담자 ID
     * @param scheduleId 스케줄 ID
     * @param mappingId 매칭 ID
     * @param includeDeleted 삭제 포함(ADMIN만)
     * @param session 세션
     * @return notes 목록
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> listNotes(
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) Long scheduleId,
            @RequestParam(required = false) Long mappingId,
            @RequestParam(defaultValue = "false") boolean includeDeleted,
            HttpSession session) {
        try {
            String tenantId = TenantContextHolder.getRequiredTenantId();
            User current = SessionUtils.getCurrentUser(session);
            Map<String, Object> data = clientScheduleNoteService.listNotes(
                    tenantId, clientId, scheduleId, mappingId, includeDeleted, current);
            return success(data);
        } catch (IllegalStateException e) {
            log.warn("특이사항 목록: 테넌트 없음");
            return badRequest("테넌트 컨텍스트가 없습니다.", "TENANT_CONTEXT_MISSING");
        } catch (IllegalArgumentException e) {
            return badRequest(e.getMessage(), "INVALID_QUERY");
        }
    }

    /**
     * 특이사항 생성.
     *
     * @param request 본문
     * @param session 세션
     * @return 생성 결과
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> create(@Valid @RequestBody ClientScheduleNoteCreateRequest request, HttpSession session) {
        try {
            String tenantId = TenantContextHolder.getRequiredTenantId();
            User current = SessionUtils.getCurrentUser(session);
            ClientScheduleNoteResponse created = clientScheduleNoteService.create(tenantId, request, current);
            return created(created);
        } catch (IllegalStateException e) {
            return badRequest("테넌트 컨텍스트가 없습니다.", "TENANT_CONTEXT_MISSING");
        } catch (IllegalArgumentException e) {
            return badRequest(e.getMessage(), "INVALID_BODY");
        } catch (EntityNotFoundException e) {
            return notFound(e.getMessage());
        }
    }

    /**
     * 특이사항 수정.
     *
     * @param id 노트 ID
     * @param request 본문
     * @param session 세션
     * @return 수정 결과
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> update(
            @PathVariable("id") Long id,
            @Valid @RequestBody ClientScheduleNoteUpdateRequest request,
            HttpSession session) {
        try {
            String tenantId = TenantContextHolder.getRequiredTenantId();
            User current = SessionUtils.getCurrentUser(session);
            ClientScheduleNoteResponse updated = clientScheduleNoteService.update(tenantId, id, request, current);
            return updated(updated);
        } catch (IllegalStateException e) {
            return badRequest("테넌트 컨텍스트가 없습니다.", "TENANT_CONTEXT_MISSING");
        } catch (EntityNotFoundException e) {
            return notFound(e.getMessage());
        } catch (AccessDeniedException e) {
            return forbidden(e.getMessage());
        }
    }

    /**
     * 특이사항 소프트 삭제.
     *
     * @param id 노트 ID
     * @param session 세션
     * @return 성공 메시지
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> delete(@PathVariable("id") Long id, HttpSession session) {
        try {
            String tenantId = TenantContextHolder.getRequiredTenantId();
            User current = SessionUtils.getCurrentUser(session);
            clientScheduleNoteService.softDelete(tenantId, id, current);
            return deleted("삭제되었습니다.");
        } catch (IllegalStateException e) {
            return badRequest("테넌트 컨텍스트가 없습니다.", "TENANT_CONTEXT_MISSING");
        } catch (EntityNotFoundException e) {
            return notFound(e.getMessage());
        } catch (AccessDeniedException e) {
            return forbidden(e.getMessage());
        }
    }
}
