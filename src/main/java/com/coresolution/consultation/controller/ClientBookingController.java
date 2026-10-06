package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.ClientDirectBookingRequest;
import com.coresolution.consultation.dto.ClientDirectBookingResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.ForbiddenException;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.service.ClientDirectBookingService;
import com.coresolution.consultation.service.support.DeferredExternalCalls;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 내담자 직접 예약 — 웹·앱 공통 엔드포인트 (CLIENT 전용).
 *
 * <p>가예약으로 접수하고 센터가 확정한다. 내담자는 세션 사용자, 테넌트는 TenantContextHolder 에서 정한다.
 * 예약 안내 등 외부 호출은 {@link DeferredExternalCalls} 로 트랜잭션 커밋·커넥션 반환 뒤 실행한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/clients/me/bookings")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ClientBookingController extends BaseApiController {

    private static final String MSG_LOGIN_REQUIRED = "로그인이 필요합니다.";
    private static final String MSG_CLIENT_ONLY = "내담자만 예약을 신청할 수 있습니다.";
    private static final String MSG_TENANT_MISMATCH = "현재 기관에서 예약할 수 없는 계정입니다.";
    private static final String MSG_CREATED = "예약 신청이 접수되었습니다. 센터 확정 후 안내드립니다.";

    private final ClientDirectBookingService clientDirectBookingService;

    /**
     * 내담자 본인 가예약 신청.
     *
     * @param request 예약 요청 (명시 필드만)
     * @param session HTTP 세션
     * @return 생성된 가예약 (201)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ClientDirectBookingResponse>> createBooking(
            @Valid @RequestBody ClientDirectBookingRequest request, HttpSession session) {
        User client = requireClient(session);
        requireSameTenant(client);
        ClientDirectBookingResponse response = DeferredExternalCalls.run(
                () -> clientDirectBookingService.createTentativeBooking(client.getId(), request));
        return created(MSG_CREATED, response);
    }

    private static User requireClient(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null || user.getId() == null) {
            throw new UnauthorizedException(MSG_LOGIN_REQUIRED);
        }
        if (user.getRole() == null || !user.getRole().isClient()) {
            log.warn("내담자 예약 거부(역할): userId={}, role={}", user.getId(), user.getRole());
            throw new ForbiddenException(MSG_CLIENT_ONLY);
        }
        return user;
    }

    private static void requireSameTenant(User client) {
        String contextTenantId = TenantContextHolder.getTenantId();
        if (contextTenantId == null || contextTenantId.isBlank()) {
            throw new UnauthorizedException(MSG_LOGIN_REQUIRED);
        }
        if (client.getTenantId() == null || !contextTenantId.equals(client.getTenantId())) {
            log.warn("내담자 예약 거부(테넌트 불일치): userId={}", client.getId());
            throw new ForbiddenException(MSG_TENANT_MISMATCH);
        }
    }
}
