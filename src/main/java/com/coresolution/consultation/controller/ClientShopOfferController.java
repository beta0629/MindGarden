package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.shop.offer.ShopClientOfferResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.ShopClientOfferService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.constant.PlatformComponentCodes;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.TenantComponentActivationService;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 내담자 — 본인에게 지정된 상품·할인가 목록. 내담자 ID 는 세션에서만 가져온다(요청 값 불신).
 *
 * @author MindGarden
 * @since 2026-10-12
 */
@RestController
@RequestMapping("/api/v1/clients/me/shop-offers")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ClientShopOfferController extends BaseApiController {

    private static final String CLIENT_ONLY_MESSAGE = "내담자 전용 API 입니다.";
    private static final String LOGIN_REQUIRED_MESSAGE = "로그인이 필요합니다.";
    private static final String CLIENT_SHOP_DISABLED_MESSAGE = "내담자 쇼핑몰 컴포넌트가 활성화되지 않았습니다.";

    private final ShopClientOfferService shopClientOfferService;
    private final TenantComponentActivationService tenantComponentActivationService;

    /**
     * 본인에게 지정된 결제 가능 상품.
     *
     * @param session HTTP 세션
     * @return 지정 목록
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ShopClientOfferResponse>>> list(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(LOGIN_REQUIRED_MESSAGE));
        }
        if (user.getRole() == null || !user.getRole().isClient()
                || user.getTenantId() == null || user.getTenantId().isBlank()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(CLIENT_ONLY_MESSAGE));
        }
        String tenantId = user.getTenantId().trim();
        if (!tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.CLIENT_SHOP)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(CLIENT_SHOP_DISABLED_MESSAGE));
        }
        return success(shopClientOfferService.listForClient(tenantId, user.getId(), true));
    }
}
