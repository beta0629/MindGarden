package com.coresolution.consultation.sct.controller;

import java.util.List;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.sct.dto.SctDomainMemoResponse;
import com.coresolution.consultation.sct.dto.SctDomainMemoUpsertRequest;
import com.coresolution.consultation.sct.dto.SctFormSummaryResponse;
import com.coresolution.consultation.sct.dto.SctInviteCreateRequest;
import com.coresolution.consultation.sct.dto.SctInvitationResponse;
import com.coresolution.consultation.sct.dto.SctLinkCandidateResponse;
import com.coresolution.consultation.sct.dto.SctLinkRequest;
import com.coresolution.consultation.sct.service.SctDomainMemoService;
import com.coresolution.consultation.sct.service.SctInvitationService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.util.HttpRequestClientIp;
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
import org.springframework.web.bind.annotation.PutMapping;
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
    private final SctDomainMemoService sctDomainMemoService;

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
     * ADMIN 수동 파기(보관 기간 경과분만). 동의는 유지.
     *
     * @param id      초대
     * @param session 세션
     * @return 204
     */
    @DeleteMapping("/invitations/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> destroy(@PathVariable Long id, HttpSession session) {
        User actor = requireUser(session);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        sctInvitationService.destroyInvitation(tenantId, actor, id);
        return deleted("응답이 파기되었습니다.");
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
     * 공개 링크 재발급(SMS 없음). 이전 토큰 무효, 응답에 one-shot publicUrl.
     *
     * @param id      초대 ID
     * @param session 세션
     * @return 초대 메타 + 링크
     */
    @PostMapping("/invitations/{id}/reissue-link")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','CONSULTANT')")
    public ResponseEntity<?> reissueLink(@PathVariable Long id, HttpSession session) {
        User actor = requireUser(session);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return success(sctInvitationService.reissueLink(tenantId, actor, id));
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
     * 영역 메모 목록.
     *
     * @param id      초대
     * @param session 세션
     * @param http    HTTP
     * @return 메모
     */
    @GetMapping("/invitations/{id}/domain-memos")
    @PreAuthorize("hasAnyRole('ADMIN','CONSULTANT')")
    public ResponseEntity<?> listDomainMemos(
            @PathVariable Long id,
            HttpSession session,
            HttpServletRequest http) {
        User actor = requireUser(session);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        List<SctDomainMemoResponse> data = sctDomainMemoService.list(
                tenantId, actor, id, clientIp(http), http.getHeader("User-Agent"));
        return success(data);
    }

    /**
     * 영역 메모 저장.
     *
     * @param id         초대
     * @param domainCode 영역
     * @param request    본문
     * @param session    세션
     * @param http       HTTP
     * @return 저장 결과
     */
    @PutMapping("/invitations/{id}/domain-memos/{domainCode}")
    @PreAuthorize("hasAnyRole('ADMIN','CONSULTANT')")
    public ResponseEntity<?> upsertDomainMemo(
            @PathVariable Long id,
            @PathVariable String domainCode,
            @Valid @RequestBody SctDomainMemoUpsertRequest request,
            HttpSession session,
            HttpServletRequest http) {
        User actor = requireUser(session);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        SctDomainMemoResponse data = sctDomainMemoService.upsert(
                tenantId, actor, id, domainCode, request,
                clientIp(http), http.getHeader("User-Agent"));
        return updated(data);
    }

    /**
     * 응답 인쇄 감사 로그(열람과 별도).
     *
     * @param id      초대
     * @param session 세션
     * @param http    HTTP
     * @return 204
     */
    @PostMapping("/invitations/{id}/print-audit")
    @PreAuthorize("hasAnyRole('ADMIN','CONSULTANT')")
    public ResponseEntity<?> printAudit(
            @PathVariable Long id,
            HttpSession session,
            HttpServletRequest http) {
        User actor = requireUser(session);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        sctInvitationService.recordPrintAudit(
                tenantId, actor, id, clientIp(http), http.getHeader("User-Agent"));
        return success("인쇄 감사가 기록되었습니다.");
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

    /**
     * 내담자 단위 SCT 동의 철회(ADMIN). 이후 발송·실시 차단.
     *
     * @param clientId 내담자
     * @param session  세션
     * @return 204
     */
    @PostMapping("/clients/{clientId}/consents/revoke")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> revokeConsent(@PathVariable Long clientId, HttpSession session) {
        User actor = requireUser(session);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        sctInvitationService.revokeClientConsent(tenantId, actor, clientId);
        return success("동의가 철회되었습니다.");
    }

    private User requireUser(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null) {
            throw new IllegalStateException("로그인이 필요합니다.");
        }
        return user;
    }

    private static String clientIp(HttpServletRequest request) {
        return HttpRequestClientIp.resolve(request);
    }
}
