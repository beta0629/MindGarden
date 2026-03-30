package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.coresolution.core.dto.ApiResponse;
import com.coresolution.consultation.entity.Alert;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.AlertRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.http.HttpStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 알림 API 컨트롤러
 * 
 * @author CoreSolution
 * @since 2026-03-09
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/alerts")
@RequiredArgsConstructor
public class AlertController extends BaseApiController {
    
    private final AlertRepository alertRepository;
    private final UserRepository userRepository;
    
    /**
     * 알림 목록 조회 (페이징)
     * 
     * @param authentication 인증 정보
     * @param page 페이지 번호 (0부터 시작)
     * @param size 페이지 크기
     * @return 알림 목록
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> getAlerts(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        try {
            User currentUser = getCurrentUser(authentication);
            Long userId = currentUser.getId();
            String tenantId = currentUser.getTenantId();
            
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<Alert> alerts = alertRepository.findByTenantIdAndUserId(tenantId, userId, pageable);
            
            Page<Map<String, Object>> response = alerts.map(alert -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", alert.getId() != null ? alert.getId() : 0L);
                map.put("type", alert.getType() != null ? alert.getType() : "NOTIFICATION");
                map.put("title", alert.getTitle() != null ? alert.getTitle() : "");
                map.put("message", alert.getContent() != null ? alert.getContent() : "");
                map.put("isRead", "READ".equals(alert.getStatus()));
                map.put("linkUrl", alert.getLinkUrl() != null ? alert.getLinkUrl() : "");
                map.put("createdAt", alert.getCreatedAt() != null ? alert.getCreatedAt().toString() : "");
                return map;
            });
            
            return success(response);
        } catch (IllegalStateException e) {
            log.error("알림 목록 조회 실패 - 인증/테넌트 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("알림 목록 조회 실패 - tenantId: {}, userId: {}", 
                TenantContextHolder.getTenantId(), 
                authentication != null ? authentication.getName() : "null", 
                e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("알림 목록을 조회하는 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 읽지 않은 알림 개수 조회
     * 
     * @param authentication 인증 정보
     * @return 읽지 않은 알림 개수
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            Long userId = currentUser.getId();
            String tenantId = currentUser.getTenantId();
            
            long count = alertRepository.countUnreadByTenantIdAndUserId(tenantId, userId);
            
            return success(count);
        } catch (Exception e) {
            log.error("읽지 않은 알림 개수 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("읽지 않은 알림 개수 조회에 실패했습니다."));
        }
    }
    
    /**
     * 알림 읽음 처리
     * 
     * @param authentication 인증 정보
     * @param id 알림 ID
     * @return 처리 결과
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            Authentication authentication,
            @PathVariable Long id) {
        
        try {
            User currentUser = getCurrentUser(authentication);
            String tenantId = currentUser.getTenantId();
            
            Alert alert = alertRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));
            
            alert.markAsRead();
            alertRepository.save(alert);
            
            return success("알림이 읽음 처리되었습니다.");
        } catch (IllegalArgumentException e) {
            log.warn("알림 읽음 처리 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("알림 읽음 처리 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("알림 읽음 처리에 실패했습니다."));
        }
    }
    
    /**
     * 전체 알림 읽음 처리
     * 
     * @param authentication 인증 정보
     * @return 처리 결과
     */
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            Long userId = currentUser.getId();
            String tenantId = currentUser.getTenantId();
            
            List<Alert> unreadAlerts = alertRepository.findUnreadByTenantIdAndUserId(tenantId, userId);
            
            unreadAlerts.forEach(Alert::markAsRead);
            alertRepository.saveAll(unreadAlerts);
            
            return success("모든 알림이 읽음 처리되었습니다.");
        } catch (Exception e) {
            log.error("전체 알림 읽음 처리 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("전체 알림 읽음 처리에 실패했습니다."));
        }
    }
    
    /**
     * 현재 사용자 조회
     * 
     * @param authentication 인증 정보
     * @return 사용자 엔티티
     */
    private User getCurrentUser(Authentication authentication) {
        String userId = authentication.getName();
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null || tenantId.isEmpty()) {
            throw new IllegalStateException("테넌트 정보가 없습니다.");
        }
        
        return userRepository.findByTenantIdAndUserId(tenantId, userId)
            .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));
    }
}
