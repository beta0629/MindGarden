package com.mindgarden.consultation.controller;

import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.dto.ActivityResponse;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.ActivityService;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;

/**
 * 활동 내역 컨트롤러
 */
@RestController
@RequestMapping("/api/activities")
@CrossOrigin(origins = "*")
public class ActivityController {

    @Autowired
    private ActivityService activityService;

    /**
     * 사용자의 활동 내역 조회
     */
    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getActivityHistory(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String dateRange,
            HttpSession session) {
        
        try {
            // 세션에서 사용자 정보 확인
            User user = SessionUtils.getCurrentUser(session);
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다"
                ));
            }

            List<ActivityResponse> activities = activityService.getUserActivities(
                user.getId(), type, dateRange
            );

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", activities,
                "total", activities.size()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "활동 내역 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 활동 통계 조회
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getActivityStatistics(HttpSession session) {
        try {
            User user = SessionUtils.getCurrentUser(session);
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다"
                ));
            }

            Map<String, Object> statistics = activityService.getActivityStatistics(user.getId());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", statistics
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "활동 통계 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
}
