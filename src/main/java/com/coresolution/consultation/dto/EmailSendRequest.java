package com.coresolution.consultation.dto;

import java.util.List;
import java.util.Map;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 이메일 발송 요청 DTO
 * 
 * <p><b>Phase 2.3 명확성 개선:</b> EmailRequest를 더 명확한 이름인 EmailSendRequest로 변경</p>
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailSendRequest {
    
    /**
     * 수신자 이메일 주소
     */
    @NotBlank(message = "수신자 이메일은 필수입니다.")
    @Email(message = "유효한 이메일 형식이 아닙니다.")
    private String toEmail;
    
    /**
     * 수신자 이름
     */
    private String toName;
    
    /**
     * 발신자 이메일 주소 (선택사항)
     */
    @Email(message = "유효한 이메일 형식이 아닙니다.")
    private String fromEmail;
    
    /**
     * 발신자 이름 (선택사항)
     */
    private String fromName;
    
    /**
     * 이메일 제목
     */
    @NotBlank(message = "이메일 제목은 필수입니다.")
    private String subject;
    
    /**
     * 이메일 내용
     */
    @NotBlank(message = "이메일 내용은 필수입니다.")
    private String content;
    
    /**
     * 이메일 타입 (HTML 또는 TEXT)
     */
    private String type = "HTML";
    
    /**
     * 이메일 템플릿 타입
     */
    private String templateType;
    
    /**
     * 템플릿 변수
     */
    private Map<String, Object> templateVariables;
    
    /**
     * 첨부파일 목록
     */
    private List<String> attachments;
    
    /**
     * 이메일 우선순위
     */
    private String priority = "NORMAL";
    
    /**
     * 즉시 발송 여부
     */
    private boolean sendImmediately = true;
    
    /**
     * 예약 발송 시간 (밀리초)
     */
    private Long scheduledTime;
    
    /**
     * 회신 이메일 주소
     */
    @Email(message = "유효한 이메일 형식이 아닙니다.")
    private String replyTo;
    
    /**
     * 숨은 참조 이메일 목록
     */
    private List<String> bccEmails;
    
    /**
     * 참조 이메일 목록
     */
    private List<String> ccEmails;
    
    /**
     * EmailRequest로 변환 (하위 호환성)
     */
    public EmailRequest toEmailRequest() {
        return EmailRequest.builder()
            .toEmail(this.toEmail)
            .toName(this.toName)
            .fromEmail(this.fromEmail)
            .fromName(this.fromName)
            .subject(this.subject)
            .content(this.content)
            .type(this.type)
            .templateType(this.templateType)
            .templateVariables(this.templateVariables)
            .attachments(this.attachments)
            .priority(this.priority)
            .sendImmediately(this.sendImmediately)
            .scheduledTime(this.scheduledTime)
            .replyTo(this.replyTo)
            .bccEmails(this.bccEmails)
            .ccEmails(this.ccEmails)
            .build();
    }
}

