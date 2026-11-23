package com.coresolution.consultation.sct.controller;

import java.util.List;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.sct.dto.SctFormSummaryResponse;
import com.coresolution.consultation.sct.dto.SctInviteCreateRequest;
import com.coresolution.consultation.sct.dto.SctInvitationResponse;
import com.coresolution.consultation.sct.dto.SctLinkCandidateResponse;
import com.coresolution.consultation.sct.dto.SctLinkRequest;
import com.coresolution.consultation.sct.service.SctInvitationService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * SCT 관리·상담사 API.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/sct")
@RequiredArgsConstructor
public class SctInvitationController extends BaseApiController {

    private final SctInvitationService sctInvitationService;

    /**
     * 활성 양식 목록.
     *
     * @return 양식
     */
    @GetMapping("/forms")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','CONSULTANT')")
    public ResponseEntity<?> forms() {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        List<SctFormSummaryResponse> data = sctInvitationService.listForms(tenantId);
        return success(data);
    }

    /**
     * 발송.
     *
     * @param request 요청
     * @param session 세션
     * @return 초대
     */
    @PostMapping("/invitations")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','CONSULTANT')")
    public ResponseEntity<?> create(
            @Valid @RequestBody SctInviteCreateRequest request,
            HttpSession session) {
        User actor = requireUser(session);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return created(sctInvitationService.createInvitation(tenantId, actor, request));
    }

    /**
     * 목록.
     *
     * @param clientId 내담자
     * @param status   상태
     * @param session  세션
     * @return 목록
     */
    @GetMapping("/invitations")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','CONSULTANT')")
    public ResponseEntity<?> list(
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) String status,
            HttpSession session) {
        User actor = requireUser(session);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return success(sctInvitationService.listInvitations(tenantId, actor, clientId, status));
    }

    /**
     * 상세(+본문).
     *
     * @param id      ID
     * @param session 세션
     * @param http    HTTP
     * @return 상세
     */
    @GetMapping("/invitations/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','CONSULTANT')")
    public ResponseEntity<?> get(
            @PathVariable Long id,
            HttpSession session,
            HttpServletRequest http) {
        User actor = requireUser(session);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return success(sctInvitationService.getInvitation(
                tenantId, actor, id, true, clientIp(http), http.getHeader("User-Agent")));
    }

    /**
     * 취소.
     *
     * @param id      ID
     * @param session 세션
     * @return 결과
     */
    @PostMapping("/invitations/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','CONSULTANT')")
    public ResponseEntity<?> cancel(@PathVariable Long id, HttpSession session) {
        User actor = requireUser(session);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return success(sctInvitationService.cancel(tenantId, actor, id));
    }

    /**
     * SMS 재발송.
     *
     * @param id      ID
     * @param session 세션
     * @return 결과
     */
    @PostMapping("/invitations/{id}/resend-sms")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','CONSULTANT')")
    public ResponseEntity<?> resend(@PathVariable Long id, HttpSession session) {
        User actor = requireUser(session);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return success(sctInvitationService.resendSms(tenantId, actor, id));
    }

    /**
     * 내담자별 목록.
     *
     * @param clientId 내담자
     * @param session  세션
     * @return 목록
     */
    @GetMapping("/clients/{clientId}/invitations")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','CONSULTANT')")
    public ResponseEntity<?> byClient(@PathVariable Long clientId, HttpSession session) {
        User actor = requireUser(session);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return success(sctInvitationService.listByClient(tenantId, actor, clientId));
    }

    /**
     * 최신 제출(상담 중).
     *
     * @param clientId 내담자
     * @param session  세션
     * @param http     HTTP
     * @return 응답
     */
    @GetMapping("/clients/{clientId}/latest-submitted")
    @PreAuthorize("hasAnyRole('ADMIN','CONSULTANT')")
    public ResponseEntity<?> latest(
            @PathVariable Long clientId,
            HttpSession session,
            HttpServletRequest http) {
        User actor = requireUser(session);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return success(sctInvitationService.latestSubmitted(
                tenantId, actor, clientId, clientIp(http), http.getHeader("User-Agent")));
    }

    /**
     * 상담 중 보기.
     *
     * @param clientId  내담자
     * @param mappingId 배정
     * @param session   세션
     * @param http      HTTP
     * @return 응답
     */
    @GetMapping("/session-view")
    @PreAuthorize("hasAnyRole('ADMIN','CONSULTANT')")
    public ResponseEntity<?> sessionView(
            @RequestParam Long clientId,
            @RequestParam(required = false) Long mappingId,
            HttpSession session,
            HttpServletRequest http) {
        User actor = requireUser(session);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return success(sctInvitationService.sessionView(
                tenantId, actor, clientId, mappingId, clientIp(http), http.getHeader("User-Agent")));
    }

    /**
     * 미배정 목록.
     *
     * @return 목록
     */
    @GetMapping("/invitations/unlinked")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<?> unlinked() {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return success(sctInvitationService.listUnlinked(tenantId));
    }

    /**
     * 배정 후보(자동 배정 금지).
     *
     * @param id 초대
     * @return 후보
     */
    @GetMapping("/invitations/{id}/link-candidates")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> linkCandidates(@PathVariable Long id) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        List<SctLinkCandidateResponse> data = sctInvitationService.linkCandidates(tenantId, id);
        return success(data);
    }

    /**
     * 내담자 배정.
     *
     * @param id      초대
     * @param request 배정
     * @param session 세션
     * @return 결과
     */
    @PostMapping("/invitations/{id}/link")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> link(
            @PathVariable Long id,
            @Valid @RequestBody SctLinkRequest request,
            HttpSession session) {
        User actor = requireUser(session);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return success(sctInvitationService.link(tenantId, actor, id, request));
    }

    /**
     * 배정 해제.
     *
     * @param id      초대
     * @param session 세션
     * @return 결과
     */
    @DeleteMapping("/invitations/{id}/link")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> unlink(@PathVariable Long id, HttpSession session) {
        User actor = requireUser(session);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return success(sctInvitationService.unlink(tenantId, actor, id));
    }

    private User requireUser(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null) {
            throw new IllegalStateException("로그인이 필요합니다.");
        }
        return user;
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
