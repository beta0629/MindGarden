package com.coresolution.consultation.controller;

import com.coresolution.consultation.constant.AdminClientSearchConstants;
import com.coresolution.consultation.dto.admin.client.AdminClientSearchPage;
import com.coresolution.consultation.service.AdminClientSearchService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.util.PermissionCheckUtils;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자 내담자 검색 (이름·연락처 뒷자리). 권한·테넌트 확인은 GET /api/v1/admin/clients 와 같다.
 * 검색어는 연락처 뒷자리일 수 있으므로 로그에 남기지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-12
 */
@RestController
@RequestMapping("/api/v1/admin/clients")
@RequiredArgsConstructor
public class AdminClientSearchController extends BaseApiController {

    private final AdminClientSearchService adminClientSearchService;
    private final DynamicPermissionService dynamicPermissionService;

    /**
     * @param session 세션
     * @param q 이름 일부 또는 연락처 뒷자리 4자리
     * @param page 0부터
     * @param size 페이지 크기
     * @return {id, name, phoneLast4, maskedPhone} 목록
     */
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<AdminClientSearchPage>> search(
            HttpSession session,
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size) {
        ResponseEntity<?> denied = PermissionCheckUtils.checkPermission(session,
                AdminClientSearchConstants.PERMISSION_CLIENT_MANAGE, dynamicPermissionService);
        if (denied != null) {
            throw new AccessDeniedException(AdminClientSearchConstants.MSG_FORBIDDEN);
        }
        String tenantId = SessionUtils.getTenantId(session);
        if (tenantId == null || tenantId.isBlank()) {
            throw new AccessDeniedException(AdminClientSearchConstants.MSG_FORBIDDEN);
        }
        return success(adminClientSearchService.search(tenantId, q, page, size));
    }
}
