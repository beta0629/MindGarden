package com.mindgarden.consultation.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.mindgarden.consultation.dto.EmailRequest;
import com.mindgarden.consultation.dto.EmailResponse;
import com.mindgarden.consultation.service.EmailService;
import lombok.extern.slf4j.Slf4j;

/**
 * 이메일 테스트 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-10
 */
@Slf4j
@RestController
@RequestMapping("/api/test/email")
public class EmailTestController {
    
    @Autowired
    private EmailService emailService;
    
    /**
     * 이메일 발송 테스트
     */
    @PostMapping("/send")
    public ResponseEntity<EmailResponse> sendTestEmail(@RequestBody EmailRequest request) {
        log.info("이메일 테스트 요청: to={}, subject={}", request.getToEmail(), request.getSubject());
        
        try {
            EmailResponse response = emailService.sendEmail(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("이메일 테스트 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 간단한 이메일 테스트
     */
    @PostMapping("/send-simple")
    public ResponseEntity<EmailResponse> sendSimpleEmail(
            @RequestParam String to,
            @RequestParam String subject,
            @RequestParam String content) {
        
        log.info("간단한 이메일 테스트: to={}, subject={}", to, subject);
        
        try {
            EmailRequest request = EmailRequest.builder()
                    .toEmail(to)
                    .subject(subject)
                    .content(content)
                    .type("HTML")
                    .build();
            
            EmailResponse response = emailService.sendEmail(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("간단한 이메일 테스트 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 환영 이메일 테스트
     */
    @PostMapping("/send-welcome")
    public ResponseEntity<EmailResponse> sendWelcomeEmail(@RequestParam String to) {
        log.info("환영 이메일 테스트: to={}", to);
        
        try {
            String htmlContent = """
                <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">🎉 mindgarden에 오신 것을 환영합니다!</h2>
                    <p>안녕하세요! mindgarden 상담 관리 시스템에 가입해주셔서 감사합니다.</p>
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057;">📋 다음 단계</h3>
                        <ul>
                            <li>프로필 정보를 완성해주세요</li>
                            <li>상담사 승인을 기다려주세요</li>
                            <li>승인 후 상담 예약을 시작할 수 있습니다</li>
                        </ul>
                    </div>
                    <p style="color: #6c757d; font-size: 14px;">
                        문의사항이 있으시면 언제든지 연락주세요.<br>
                        mindgarden 팀 드림
                    </p>
                </body>
                </html>
                """;
            
            EmailRequest request = EmailRequest.builder()
                    .toEmail(to)
                    .subject("[mindgarden] 환영합니다!")
                    .content(htmlContent)
                    .type("HTML")
                    .build();
            
            EmailResponse response = emailService.sendEmail(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("환영 이메일 테스트 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
