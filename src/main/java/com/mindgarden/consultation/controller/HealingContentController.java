package com.mindgarden.consultation.controller;

import java.util.Map;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.HealingContentService;
import com.mindgarden.consultation.utils.SessionUtils;
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
@RequestMapping("/api/healing")
@RequiredArgsConstructor
public class HealingContentController {
    
    private final HealingContentService healingContentService;
    
    /**
     * 오늘의 힐링 컨텐츠 조회
     */
    @GetMapping("/content")
    public ResponseEntity<?> getHealingContent(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String userRole,
            HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 사용자 역할이 지정되지 않은 경우 세션에서 가져오기
            if (userRole == null) {
                userRole = currentUser.getRole().name();
            }
            
            log.info("💚 힐링 컨텐츠 조회 - 사용자 ID: {}, 역할: {}, 카테고리: {}", 
                    currentUser.getId(), userRole, category);
            
            var content = healingContentService.getHealingContent(userRole, category);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", content,
                "message", "힐링 컨텐츠를 성공적으로 조회했습니다."
            ));
            
        } catch (Exception e) {
            log.error("❌ 힐링 컨텐츠 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "힐링 컨텐츠 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 힐링 컨텐츠 새로고침
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshHealingContent(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String userRole,
            HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            if (userRole == null) {
                userRole = currentUser.getRole().name();
            }
            
            log.info("🔄 힐링 컨텐츠 새로고침 - 사용자 ID: {}, 역할: {}, 카테고리: {}", 
                    currentUser.getId(), userRole, category);
            
            var content = healingContentService.generateNewHealingContent(userRole, category);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", content,
                "message", "새로운 힐링 컨텐츠를 생성했습니다."
            ));
            
        } catch (Exception e) {
            log.error("❌ 힐링 컨텐츠 새로고침 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "힐링 컨텐츠 새로고침에 실패했습니다: " + e.getMessage()
            ));
        }
    }
}
