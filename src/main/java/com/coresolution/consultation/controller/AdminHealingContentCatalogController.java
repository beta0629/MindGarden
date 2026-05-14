package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.content.ContentReorderRequest;
import com.coresolution.consultation.dto.content.HealingContentCatalogAdminDetail;
import com.coresolution.consultation.dto.content.HealingContentCatalogAdminItem;
import com.coresolution.consultation.dto.content.HealingContentCatalogUpsertRequest;
import com.coresolution.consultation.dto.content.PublishedPatchRequest;
import com.coresolution.consultation.service.HealingContentCatalogAdminService;
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
 * BW-3 힐링 카탈로그 마스터 어드민 API ({@code /api/v1/admin/content/healing-catalog}).
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@RestController
@RequestMapping("/api/v1/admin/content/healing-catalog")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminHealingContentCatalogController extends BaseApiController {

    private final HealingContentCatalogAdminService healingContentCatalogAdminService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<HealingContentCatalogAdminItem>>> list() {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return success(healingContentCatalogAdminService.listAllForTenant(tenantId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HealingContentCatalogAdminDetail>> get(@PathVariable Long id) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return success(healingContentCatalogAdminService.getForAdmin(tenantId, id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<HealingContentCatalogAdminDetail>> create(
            @Valid @RequestBody HealingContentCatalogUpsertRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return created(healingContentCatalogAdminService.create(tenantId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<HealingContentCatalogAdminDetail>> update(
            @PathVariable Long id,
            @Valid @RequestBody HealingContentCatalogUpsertRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return updated(healingContentCatalogAdminService.update(tenantId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        healingContentCatalogAdminService.softDelete(tenantId, id);
        return deleted();
    }

    @PatchMapping("/{id}/published")
    public ResponseEntity<ApiResponse<Void>> patchPublished(
            @PathVariable Long id,
            @Valid @RequestBody PublishedPatchRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        healingContentCatalogAdminService.patchPublished(tenantId, id, request.published());
        return updated("노출 설정이 반영되었습니다.", null);
    }

    @PostMapping("/reorder")
    public ResponseEntity<ApiResponse<Void>> reorder(@Valid @RequestBody ContentReorderRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        healingContentCatalogAdminService.reorder(tenantId, request);
        return updated("순서가 반영되었습니다.", null);
    }
}
