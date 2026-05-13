package com.coresolution.consultation.controller;

import java.util.List;
import com.coresolution.consultation.dto.mindweather.MindWeatherAnalyzeRequest;
import com.coresolution.consultation.dto.mindweather.MindWeatherCardResponse;
import com.coresolution.consultation.dto.mindweather.MindWeatherShareRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.MindWeatherService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Expo {@code MIND_WEATHER_API} 정합 REST.
 *
 * <p>인증·테넌트: {@link com.coresolution.core.filter.TenantContextFilter}·세션/JWT 표준.
 * 내담자 전용 엔드포인트와 상담사 수신함({@code GET /inbox})을 역할로 분리한다.</p>
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/mind-weather")
@RequiredArgsConstructor
public class MindWeatherController extends BaseApiController {

    private final MindWeatherService mindWeatherService;

    /**
     * 상담사 수신함 — 경로 {@code /inbox}는 {@code /{id}}보다 먼저 매핑한다.
     */
    @GetMapping("/inbox")
    public ResponseEntity<ApiResponse<List<MindWeatherCardResponse>>> inbox(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        if (user.getRole() == null || !user.getRole().isProfessionalProvider()) {
            log.warn("마음 날씨 수신함 접근 거부 — 상담사만 허용: userId={}, role={}", user.getId(), user.getRole());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("상담사만 이용할 수 있습니다."));
        }
        return success(mindWeatherService.listInboxForConsultant(user));
    }

    /**
     * 텍스트 분석 후 카드 저장.
     */
    @PostMapping("/analyze")
    public ResponseEntity<ApiResponse<MindWeatherCardResponse>> analyze(
            HttpSession session,
            @Valid @RequestBody MindWeatherAnalyzeRequest request) {
        return created(mindWeatherService.analyze(request, requireClient(session)));
    }

    /**
     * 본인 카드 목록.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MindWeatherCardResponse>>> listMine(HttpSession session) {
        return success(mindWeatherService.listMine(requireClient(session)));
    }

    /**
     * 본인 카드 상세.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MindWeatherCardResponse>> getMine(
            HttpSession session,
            @PathVariable("id") String id) {
        return success(mindWeatherService.getMineById(id, requireClient(session)));
    }

    /**
     * 공유 옵트인·갱신.
     */
    @PostMapping("/{id}/share")
    public ResponseEntity<ApiResponse<MindWeatherCardResponse>> share(
            HttpSession session,
            @PathVariable("id") String id,
            @RequestBody(required = false) MindWeatherShareRequest request) {
        MindWeatherShareRequest body = request != null ? request : new MindWeatherShareRequest();
        return updated(mindWeatherService.share(id, body, requireClient(session)));
    }

    /**
     * 공유 철회.
     */
    @DeleteMapping("/{id}/share")
    public ResponseEntity<ApiResponse<MindWeatherCardResponse>> unshare(
            HttpSession session,
            @PathVariable("id") String id) {
        return success(mindWeatherService.unshare(id, requireClient(session)));
    }

    private static User requireClient(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        if (user.getRole() == null || !user.getRole().isClient()) {
            throw new AccessDeniedException("내담자만 이용할 수 있습니다.");
        }
        return user;
    }
}
