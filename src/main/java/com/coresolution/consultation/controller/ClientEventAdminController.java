package com.coresolution.consultation.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import com.coresolution.consultation.constant.ClientEventApiConstants;
import com.coresolution.consultation.dto.ClientEventResponse;
import com.coresolution.consultation.service.ClientEventService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 내담자 관리용 타임라인 조회 API (ADMIN·STAFF).
 *
 * <p>조회 범위는 {@link TenantContextHolder#getRequiredTenantId()} 로 강제된다.
 * 기본 정렬은 {@code occurred_at ASC, id ASC} (처음부터→최신).</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/clients")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class ClientEventAdminController extends BaseApiController {

    private final ClientEventService clientEventService;

    /**
     * 내담자 단위 관리용 타임라인 조회.
     *
     * @param clientId 내담자 ID
     * @param sort     {@code asc}(기본) 또는 {@code desc}
     * @param pageable 페이지 정보
     * @return 이벤트 페이지
     */
    @GetMapping("/{clientId}/events")
    public ResponseEntity<ApiResponse<Map<String, Object>>> listEvents(
            @PathVariable Long clientId,
            @RequestParam(required = false, defaultValue = ClientEventApiConstants.SORT_ASC)
                    String sort,
            @PageableDefault(size = ClientEventApiConstants.DEFAULT_PAGE_SIZE) Pageable pageable) {

        String tenantId = TenantContextHolder.getRequiredTenantId();
        Pageable timelinePageable = resolveTimelinePageable(pageable, sort);
        log.info(
                "내담자 관리용 타임라인 조회: tenantId={}, clientId={}, sort={}, page={}",
                tenantId,
                clientId,
                sort,
                timelinePageable.getPageNumber());

        Page<ClientEventResponse> page =
                clientEventService.findTimeline(tenantId, clientId, timelinePageable);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("events", page.getContent());
        data.put("totalCount", page.getTotalElements());
        data.put("totalPages", page.getTotalPages());
        data.put("number", page.getNumber());
        data.put("size", page.getSize());
        data.put("last", page.isLast());
        return success(data);
    }

    private static Pageable resolveTimelinePageable(Pageable pageable, String sort) {
        boolean descending = ClientEventApiConstants.SORT_DESC.equalsIgnoreCase(sort);
        Sort order = descending
                ? Sort.by(
                        Sort.Order.desc(ClientEventApiConstants.SORT_PROPERTY_OCCURRED_AT),
                        Sort.Order.desc(ClientEventApiConstants.SORT_PROPERTY_ID))
                : Sort.by(
                        Sort.Order.asc(ClientEventApiConstants.SORT_PROPERTY_OCCURRED_AT),
                        Sort.Order.asc(ClientEventApiConstants.SORT_PROPERTY_ID));
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), order);
    }
}
