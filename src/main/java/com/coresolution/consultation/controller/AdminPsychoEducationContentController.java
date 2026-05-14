package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.content.ContentReorderRequest;
import com.coresolution.consultation.dto.content.PublishedPatchRequest;
import com.coresolution.consultation.dto.content.PsychoEducationArticleAdminDetail;
import com.coresolution.consultation.dto.content.PsychoEducationArticleAdminItem;
import com.coresolution.consultation.dto.content.PsychoEducationArticleUpsertRequest;
import com.coresolution.consultation.service.PsychoEducationAdminService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * BW-3 심리교육 마스터 어드민 API ({@code /api/v1/admin/content/psycho-education}).
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@RestController
@RequestMapping("/api/v1/admin/content/psycho-education")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPsychoEducationContentController extends BaseApiController {

    private final PsychoEducationAdminService psychoEducationAdminService;

    /**
     * 목록(삭제 제외, 노출·비노출 모두).
     *
     * @return 어드민 목록
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PsychoEducationArticleAdminItem>>> list() {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return success(psychoEducationAdminService.listAllForTenant(tenantId));
    }

    /**
     * 상세.
     *
     * @param id PK
     * @return 상세
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PsychoEducationArticleAdminDetail>> get(@PathVariable Long id) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return success(psychoEducationAdminService.getForAdmin(tenantId, id));
    }

    /**
     * 생성.
     *
     * @param request 요청
     * @return 생성 결과
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PsychoEducationArticleAdminDetail>> create(
            @Valid @RequestBody PsychoEducationArticleUpsertRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return created(psychoEducationAdminService.create(tenantId, request));
    }

    /**
     * 수정.
     *
     * @param id      PK
     * @param request 요청
     * @return 수정 결과
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PsychoEducationArticleAdminDetail>> update(
            @PathVariable Long id,
            @Valid @RequestBody PsychoEducationArticleUpsertRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return updated(psychoEducationAdminService.update(tenantId, id, request));
    }

    /**
     * 소프트 삭제.
     *
     * @param id PK
     * @return 성공 메시지
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        psychoEducationAdminService.softDelete(tenantId, id);
        return deleted();
    }

    /**
     * 클라이언트 노출 토글.
     *
     * @param id      PK
     * @param request published
     * @return 성공 메시지
     */
    @PatchMapping("/{id}/published")
    public ResponseEntity<ApiResponse<Void>> patchPublished(
            @PathVariable Long id,
            @Valid @RequestBody PublishedPatchRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        psychoEducationAdminService.patchPublished(tenantId, id, request.published());
        return updated("노출 설정이 반영되었습니다.", null);
    }

    /**
     * 표시 순서 일괄 반영.
     *
     * @param request 정렬된 ID 목록
     * @return 성공 메시지
     */
    @PostMapping("/reorder")
    public ResponseEntity<ApiResponse<Void>> reorder(@Valid @RequestBody ContentReorderRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        psychoEducationAdminService.reorder(tenantId, request);
        return updated("순서가 반영되었습니다.", null);
    }
}
