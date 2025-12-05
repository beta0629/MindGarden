package com.coresolution.consultation.controller;

import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.HealingContentService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 힐링 컨텐츠 컨트롤러
 * 오늘의 힐링, 유머, 따뜻한 말 등을 GPT로 생성
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-22
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/healing") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
public class HealingContentController extends BaseApiController {
    
    private final HealingContentService healingContentService;
    
    /**
     * 오늘의 힐링 컨텐츠 조회
     */
    @GetMapping("/content")
    public ResponseEntity<ApiResponse<Object>> getHealingContent(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String userRole,
            HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        // 사용자 역할이 지정되지 않은 경우 세션에서 가져오기
        if (userRole == null) {
            userRole = currentUser.getRole().name();
        }
        
        log.info("💚 힐링 컨텐츠 조회 - 사용자 ID: {}, 역할: {}, 카테고리: {}", 
                currentUser.getId(), userRole, category);
        
        var content = healingContentService.getHealingContent(userRole, category);
        
        return success("힐링 컨텐츠를 성공적으로 조회했습니다.", content);
    }
    
    /**
     * 힐링 컨텐츠 새로고침
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Object>> refreshHealingContent(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String userRole,
            HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        if (userRole == null) {
            userRole = currentUser.getRole().name();
        }
        
        log.info("🔄 힐링 컨텐츠 새로고침 - 사용자 ID: {}, 역할: {}, 카테고리: {}", 
                currentUser.getId(), userRole, category);
        
        var content = healingContentService.generateNewHealingContent(userRole, category);
        
        return success("새로운 힐링 컨텐츠를 생성했습니다.", content);
    }
}
