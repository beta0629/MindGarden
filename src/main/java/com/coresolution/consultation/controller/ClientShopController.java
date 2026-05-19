package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.shop.ShopCartReplaceRequest;
import com.coresolution.consultation.dto.shop.ShopCatalogSkuResponse;
import com.coresolution.consultation.dto.shop.ShopCartResponse;
import com.coresolution.consultation.dto.shop.ShopCheckoutRequest;
import com.coresolution.consultation.dto.shop.ShopCheckoutResponse;
import com.coresolution.consultation.dto.shop.ShopConsultantMappingOption;
import com.coresolution.consultation.dto.shop.ShopOrderResponse;
import com.coresolution.consultation.dto.shop.ShopOrderSummaryResponse;
import com.coresolution.consultation.dto.shop.ShopPointBalanceResponse;
import com.coresolution.consultation.dto.shop.ShopPointLedgerEntryResponse;
import com.coresolution.consultation.dto.shop.ShopPreparePaymentRequest;
import com.coresolution.consultation.dto.shop.ShopPreparePaymentResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.ClientShopCartService;
import com.coresolution.consultation.service.ClientShopCatalogService;
import com.coresolution.consultation.service.ClientShopCheckoutService;
import com.coresolution.consultation.service.ClientShopConsultantMappingService;
import com.coresolution.consultation.service.ClientPointWalletService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.constant.PlatformComponentCodes;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.TenantComponentActivationService;
import java.util.List;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 내담자 EA — 카탈로그·장바구니·체크아웃·포인트(MVP).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/clients/me/shop")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ClientShopController extends BaseApiController {

    private static final String CLIENT_SHOP_DISABLED_MESSAGE =
            "내담자 쇼핑몰 컴포넌트가 활성화되지 않았습니다.";
    private static final String CLIENT_REWARD_DISABLED_MESSAGE =
            "내담자 리워드 컴포넌트가 활성화되지 않았습니다.";

    private final ClientShopCatalogService clientShopCatalogService;
    private final ClientShopCartService clientShopCartService;
    private final ClientShopCheckoutService clientShopCheckoutService;
    private final ClientShopConsultantMappingService clientShopConsultantMappingService;
    private final ClientPointWalletService clientPointWalletService;
    private final TenantComponentActivationService tenantComponentActivationService;

    /**
     * PLP용 카탈로그.
     *
     * @param session HTTP 세션
     * @return SKU 목록
     */
    @GetMapping("/catalog")
    public ResponseEntity<ApiResponse<List<ShopCatalogSkuResponse>>> getCatalog(HttpSession session) {
        User user = requireClient(session);
        String tenantId = requireTenant(user);
        try {
            TenantContextHolder.setTenantId(tenantId);
            ResponseEntity<ApiResponse<List<ShopCatalogSkuResponse>>> denied = requireClientShop(tenantId);
            if (denied != null) {
                return denied;
            }
            return success(clientShopCatalogService.listVisibleSkus(tenantId));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 장바구니 조회.
     *
     * @param session HTTP 세션
     * @return 장바구니
     */
    @GetMapping("/cart")
    public ResponseEntity<ApiResponse<ShopCartResponse>> getCart(HttpSession session) {
        User user = requireClient(session);
        String tenantId = requireTenant(user);
        try {
            TenantContextHolder.setTenantId(tenantId);
            return success(clientShopCartService.getCart(tenantId, user.getId()));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 장바구니 교체.
     *
     * @param session HTTP 세션
     * @param request 라인 목록
     * @return 빈 본문 성공
     */
    @PutMapping("/cart")
    public ResponseEntity<ApiResponse<Void>> putCart(
            HttpSession session,
            @Valid @RequestBody ShopCartReplaceRequest request) {

        User user = requireClient(session);
        String tenantId = requireTenant(user);
        try {
            TenantContextHolder.setTenantId(tenantId);
            clientShopCartService.replaceCart(tenantId, user.getId(), request);
            return success(null);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 포인트 잔액(가용·예약).
     *
     * @param session HTTP 세션
     * @return 잔액
     */
    @GetMapping("/points/balance")
    public ResponseEntity<ApiResponse<ShopPointBalanceResponse>> getPointBalance(HttpSession session) {
        User user = requireClient(session);
        String tenantId = requireTenant(user);
        try {
            TenantContextHolder.setTenantId(tenantId);
            ResponseEntity<ApiResponse<ShopPointBalanceResponse>> denied = requireClientReward(tenantId);
            if (denied != null) {
                return denied;
            }
            return success(clientPointWalletService.getBalance(tenantId, user.getId()));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 포인트 원장 최근 N건.
     *
     * @param session HTTP 세션
     * @param limit   조회 건수 (기본 20)
     * @return 원장 목록
     */
    @GetMapping("/points/ledger")
    public ResponseEntity<ApiResponse<List<ShopPointLedgerEntryResponse>>> getPointLedger(
            HttpSession session,
            @RequestParam(defaultValue = "20") int limit) {

        User user = requireClient(session);
        String tenantId = requireTenant(user);
        try {
            TenantContextHolder.setTenantId(tenantId);
            ResponseEntity<ApiResponse<List<ShopPointLedgerEntryResponse>>> denied = requireClientReward(tenantId);
            if (denied != null) {
                return denied;
            }
            return success(clientPointWalletService.listRecentLedger(tenantId, user.getId(), limit));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 체크아웃용 활성 상담사-내담자 매핑 목록 (PII 최소).
     *
     * @param session HTTP 세션
     * @return 매핑 선택 옵션
     */
    @GetMapping("/consultant-mappings")
    public ResponseEntity<ApiResponse<List<ShopConsultantMappingOption>>> listConsultantMappings(
            HttpSession session) {

        User user = requireClient(session);
        String tenantId = requireTenant(user);
        try {
            TenantContextHolder.setTenantId(tenantId);
            ResponseEntity<ApiResponse<List<ShopConsultantMappingOption>>> denied = requireClientShop(tenantId);
            if (denied != null) {
                return denied;
            }
            return success(clientShopConsultantMappingService.listActiveMappingOptions(tenantId, user.getId()));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 체크아웃.
     *
     * @param session HTTP 세션
     * @param request 멱등 키·포인트
     * @return 주문 요약
     */
    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<ShopCheckoutResponse>> checkout(
            HttpSession session,
            @Valid @RequestBody ShopCheckoutRequest request) {

        User user = requireClient(session);
        String tenantId = requireTenant(user);
        try {
            TenantContextHolder.setTenantId(tenantId);
            return success(clientShopCheckoutService.checkout(tenantId, user.getId(), request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * PG 결제 레코드 생성.
     *
     * @param session        HTTP 세션
     * @param orderPublicId  주문 공개 ID
     * @param request        결제 수단(선택)
     * @return 결제 응답
     */
    @PostMapping("/orders/{orderPublicId}/prepare-payment")
    public ResponseEntity<ApiResponse<ShopPreparePaymentResponse>> preparePayment(
            HttpSession session,
            @PathVariable String orderPublicId,
            @RequestBody(required = false) ShopPreparePaymentRequest request) {

        User user = requireClient(session);
        String tenantId = requireTenant(user);
        ShopPreparePaymentRequest body = request == null ? new ShopPreparePaymentRequest() : request;
        try {
            TenantContextHolder.setTenantId(tenantId);
            return success(clientShopCheckoutService.preparePayment(tenantId, user.getId(), orderPublicId, body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        } catch (RuntimeException e) {
            log.warn("preparePayment 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(ApiResponse.error("결제 준비에 실패했습니다."));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 결제 전 주문 취소.
     *
     * @param session       HTTP 세션
     * @param orderPublicId 주문 공개 ID
     * @return 빈 성공
     */
    @PostMapping("/orders/{orderPublicId}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelOrder(HttpSession session, @PathVariable String orderPublicId) {
        User user = requireClient(session);
        String tenantId = requireTenant(user);
        try {
            TenantContextHolder.setTenantId(tenantId);
            clientShopCheckoutService.cancelOrder(tenantId, user.getId(), orderPublicId);
            return success(null);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 내 주문 목록.
     *
     * @param session HTTP 세션
     * @param page    페이지
     * @param size    크기
     * @return 목록
     */
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<ShopOrderSummaryResponse>>> listOrders(
            HttpSession session,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        User user = requireClient(session);
        String tenantId = requireTenant(user);
        try {
            TenantContextHolder.setTenantId(tenantId);
            return success(clientShopCheckoutService.listMyOrders(tenantId, user.getId(), page, size));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 주문 상세.
     *
     * @param session       HTTP 세션
     * @param orderPublicId 주문 공개 ID
     * @return 상세
     */
    @GetMapping("/orders/{orderPublicId}")
    public ResponseEntity<ApiResponse<ShopOrderResponse>> getOrder(
            HttpSession session,
            @PathVariable String orderPublicId) {

        User user = requireClient(session);
        String tenantId = requireTenant(user);
        try {
            TenantContextHolder.setTenantId(tenantId);
            return success(clientShopCheckoutService.getOrder(tenantId, user.getId(), orderPublicId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        } finally {
            TenantContextHolder.clear();
        }
    }

    private static User requireClient(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new ClientShopAuthException("로그인이 필요합니다.");
        }
        if (currentUser.getRole() == null || !currentUser.getRole().isClient()) {
            throw new ClientShopAuthException("내담자 전용 API 입니다.");
        }
        return currentUser;
    }

    private static String requireTenant(User user) {
        String tenantId = user.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new ClientShopAuthException("테넌트 정보가 없습니다.");
        }
        return tenantId.trim();
    }

    private <T> ResponseEntity<ApiResponse<T>> requireClientShop(String tenantId) {
        if (tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.CLIENT_SHOP)) {
            return null;
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(CLIENT_SHOP_DISABLED_MESSAGE));
    }

    private <T> ResponseEntity<ApiResponse<T>> requireClientReward(String tenantId) {
        if (tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.CLIENT_REWARD)) {
            return null;
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(CLIENT_REWARD_DISABLED_MESSAGE));
    }

    /**
     * 인증·역할 실패 시 컨트롤러 예외 (아래 핸들러에서 401/403으로 매핑).
     */
    private static final class ClientShopAuthException extends RuntimeException {
        private static final long serialVersionUID = 1L;

        ClientShopAuthException(String message) {
            super(message);
        }
    }

    /**
     * 세션·역할 검증 실패 응답.
     *
     * @param ex 예외
     * @return 401 또는 403
     */
    @org.springframework.web.bind.annotation.ExceptionHandler(ClientShopAuthException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuth(ClientShopAuthException ex) {
        String msg = ex.getMessage() != null ? ex.getMessage() : "인증이 필요합니다.";
        if (msg.contains("내담자 전용") || msg.contains("테넌트")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(msg));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(msg));
    }
}
