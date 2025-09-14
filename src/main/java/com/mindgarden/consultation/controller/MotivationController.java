package com.mindgarden.consultation.controller;

import java.util.Map;
import com.mindgarden.consultation.entity.DailyHumor;
import com.mindgarden.consultation.entity.WarmWords;
import com.mindgarden.consultation.service.ConsultantMotivationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 동기부여 컨트롤러
 */
@RestController
@RequestMapping("/api/motivation")
@CrossOrigin(origins = "*")
public class MotivationController {
    
    @Autowired
    private ConsultantMotivationService consultantMotivationService;
    
    /**
     * 오늘의 유머 조회
     * @param category 카테고리 (선택사항)
     * @return 랜덤 유머
     */
    @GetMapping("/humor")
    public ResponseEntity<Map<String, Object>> getTodayHumor(@RequestParam(required = false) String category) {
        try {
            DailyHumor humor = consultantMotivationService.getTodayHumor(category);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", humor
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "유머 조회 중 오류가 발생했습니다.",
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * 따뜻한 말 조회
     * @param targetRole 대상 역할 (선택사항)
     * @return 랜덤 따뜻한 말
     */
    @GetMapping("/warm-words")
    public ResponseEntity<Map<String, Object>> getWarmWords(@RequestParam(required = false) String targetRole) {
        try {
            WarmWords warmWords = consultantMotivationService.getWarmWords(targetRole);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", warmWords
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "따뜻한 말 조회 중 오류가 발생했습니다.",
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * 동기부여 메시지 전체 조회
     * @param category 유머 카테고리 (선택사항)
     * @param targetRole 대상 역할 (선택사항)
     * @return 유머와 따뜻한 말
     */
    @GetMapping("/motivation")
    public ResponseEntity<Map<String, Object>> getMotivation(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String targetRole) {
        try {
            DailyHumor humor = consultantMotivationService.getTodayHumor(category);
            WarmWords warmWords = consultantMotivationService.getWarmWords(targetRole);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "humor", humor,
                    "warmWords", warmWords
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "동기부여 메시지 조회 중 오류가 발생했습니다.",
                "error", e.getMessage()
            ));
        }
    }
}
