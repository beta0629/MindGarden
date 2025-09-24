package com.mindgarden.consultation.service;

import java.util.Map;

/**
 * 이메일 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
public interface EmailService {
    
    /**
     * 비밀번호 재설정 이메일 발송
     */
    boolean sendPasswordResetEmail(String to, String resetToken, String userName);
    
    /**
     * 일반 이메일 발송
     */
    boolean sendEmail(String to, String subject, String content);
    
    /**
     * 템플릿 기반 이메일 발송
     */
    boolean sendTemplateEmail(String to, String templateName, Map<String, Object> variables);
}