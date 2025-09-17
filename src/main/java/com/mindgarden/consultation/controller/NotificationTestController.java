package com.mindgarden.consultation.controller;

import java.util.HashMap;
import java.util.Map;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.KakaoAlimTalkService;
import com.mindgarden.consultation.service.NotificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 알림 테스트 컨트롤러
 * - 카카오 알림톡, SMS, 이메일 테스트
 * - 개발/테스트 환경에서만 사용
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
@Slf4j
@RestController
@RequestMapping("/api/test/notification")
@RequiredArgsConstructor
public class NotificationTestController {
    
    @Value("${kakao.alimtalk.simulation-mode:true}")
    private boolean simulationMode;
    
    private final NotificationService notificationService;
    private final KakaoAlimTalkService kakaoAlimTalkService;
    private final UserRepository userRepository;
    
    /**
     * 카카오 알림톡 서비스 상태 확인
     */
    @GetMapping("/alimtalk/status")
    public ResponseEntity<?> checkAlimTalkStatus() {
        try {
            boolean available = kakaoAlimTalkService.isServiceAvailable();
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("available", available);
            result.put("simulationMode", simulationMode);
            result.put("message", available ? 
                (simulationMode ? "카카오 알림톡 시뮬레이션 모드 활성화" : "카카오 알림톡 실제 모드 활성화") : 
                "카카오 알림톡 서비스 설정 필요");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("알림톡 상태 확인 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "상태 확인 실패: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 카카오 알림톡 직접 테스트
     */
    @PostMapping("/alimtalk/send")
    public ResponseEntity<?> testAlimTalk(@RequestBody Map<String, Object> request) {
        try {
            String phoneNumber = (String) request.get("phoneNumber");
            String templateCode = (String) request.get("templateCode");
            @SuppressWarnings("unchecked")
            Map<String, String> params = (Map<String, String>) request.get("params");
            
            if (phoneNumber == null || templateCode == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "전화번호와 템플릿 코드는 필수입니다"
                ));
            }
            
            log.info("🧪 카카오 알림톡 테스트: 전화번호={}, 템플릿={}", phoneNumber, templateCode);
            
            boolean success = kakaoAlimTalkService.sendAlimTalk(phoneNumber, templateCode, params);
            
            return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "알림톡 발송 성공" : "알림톡 발송 실패",
                "phoneNumber", phoneNumber,
                "templateCode", templateCode,
                "params", params
            ));
            
        } catch (Exception e) {
            log.error("알림톡 테스트 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "테스트 실패: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 통합 알림 테스트 (사용자 기반)
     */
    @PostMapping("/send-to-user")
    public ResponseEntity<?> testNotificationToUser(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String notificationType = (String) request.get("notificationType");
            String priority = (String) request.get("priority");
            @SuppressWarnings("unchecked")
            Map<String, String> params = (Map<String, String>) request.get("params");
            
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + userId));
            
            log.info("🧪 통합 알림 테스트: 사용자={}, 타입={}, 우선순위={}", user.getName(), notificationType, priority);
            
            // 알림 타입 변환
            NotificationService.NotificationType type = NotificationService.NotificationType.valueOf(notificationType);
            NotificationService.NotificationPriority prio = NotificationService.NotificationPriority.valueOf(priority);
            
            // 파라미터 배열 변환
            String[] paramArray = params != null ? params.values().toArray(new String[0]) : new String[0];
            
            boolean success = notificationService.sendNotification(user, type, prio, paramArray);
            
            return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "알림 발송 성공" : "알림 발송 실패",
                "user", user.getName(),
                "notificationType", notificationType,
                "priority", priority,
                "params", params
            ));
            
        } catch (Exception e) {
            log.error("통합 알림 테스트 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "테스트 실패: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 환불 완료 알림 테스트
     */
    @PostMapping("/refund-completed")
    public ResponseEntity<?> testRefundNotification(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            int refundSessions = Integer.parseInt(request.get("refundSessions").toString());
            long refundAmount = Long.parseLong(request.get("refundAmount").toString());
            
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + userId));
            
            log.info("🧪 환불 완료 알림 테스트: 사용자={}, 회기={}, 금액={}", 
                user.getName(), refundSessions, refundAmount);
            
            boolean success = notificationService.sendRefundCompleted(user, refundSessions, refundAmount);
            
            return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "환불 알림 발송 성공" : "환불 알림 발송 실패",
                "user", user.getName(),
                "refundSessions", refundSessions,
                "refundAmount", refundAmount
            ));
            
        } catch (Exception e) {
            log.error("환불 알림 테스트 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "테스트 실패: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 상담 확정 알림 테스트
     */
    @PostMapping("/consultation-confirmed")
    public ResponseEntity<?> testConsultationConfirmed(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String consultantName = (String) request.get("consultantName");
            String consultationDate = (String) request.get("consultationDate");
            String consultationTime = (String) request.get("consultationTime");
            
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + userId));
            
            log.info("🧪 상담 확정 알림 테스트: 사용자={}, 상담사={}, 날짜={}, 시간={}", 
                user.getName(), consultantName, consultationDate, consultationTime);
            
            boolean success = notificationService.sendConsultationConfirmed(user, consultantName, consultationDate, consultationTime);
            
            return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "상담 확정 알림 발송 성공" : "상담 확정 알림 발송 실패",
                "user", user.getName(),
                "consultantName", consultantName,
                "consultationDate", consultationDate,
                "consultationTime", consultationTime
            ));
            
        } catch (Exception e) {
            log.error("상담 확정 알림 테스트 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "테스트 실패: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 모든 알림 방식 테스트
     */
    @PostMapping("/all-methods")
    public ResponseEntity<?> testAllMethods(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String message = (String) request.getOrDefault("message", "테스트 메시지입니다.");
            
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + userId));
            
            log.info("🧪 모든 알림 방식 테스트: 사용자={}", user.getName());
            
            Map<String, Object> results = new HashMap<>();
            
            // 1. 카카오 알림톡 테스트
            try {
                Map<String, String> params = new HashMap<>();
                params.put("message", message);
                boolean alimTalkSuccess = kakaoAlimTalkService.sendAlimTalk(
                    user.getPhone(), "TEST_MESSAGE", params);
                results.put("alimtalk", alimTalkSuccess);
            } catch (Exception e) {
                results.put("alimtalk", false);
                results.put("alimtalkError", e.getMessage());
            }
            
            // 2. 통합 알림 HIGH 우선순위 테스트
            try {
                boolean highPrioritySuccess = notificationService.sendNotification(
                    user, NotificationService.NotificationType.CONSULTATION_CONFIRMED, 
                    NotificationService.NotificationPriority.HIGH, "테스트상담사", "2025-09-18", "14:00");
                results.put("highPriority", highPrioritySuccess);
            } catch (Exception e) {
                results.put("highPriority", false);
                results.put("highPriorityError", e.getMessage());
            }
            
            // 3. 통합 알림 MEDIUM 우선순위 테스트
            try {
                boolean mediumPrioritySuccess = notificationService.sendNotification(
                    user, NotificationService.NotificationType.REFUND_COMPLETED, 
                    NotificationService.NotificationPriority.MEDIUM, "5", "250,000");
                results.put("mediumPriority", mediumPrioritySuccess);
            } catch (Exception e) {
                results.put("mediumPriority", false);
                results.put("mediumPriorityError", e.getMessage());
            }
            
            results.put("success", true);
            results.put("user", user.getName());
            results.put("message", "모든 알림 방식 테스트 완료");
            
            return ResponseEntity.ok(results);
            
        } catch (Exception e) {
            log.error("모든 알림 방식 테스트 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "테스트 실패: " + e.getMessage()
            ));
        }
    }
}
