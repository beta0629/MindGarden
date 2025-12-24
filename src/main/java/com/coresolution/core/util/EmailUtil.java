package com.coresolution.core.util;

import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.constant.EmailConstants;
import com.coresolution.consultation.dto.EmailResponse;
import com.coresolution.consultation.service.EmailService;
import lombok.extern.slf4j.Slf4j;

/**
 * 이메일 발송 유틸리티 클래스
 * 공통 이메일 발송 로직을 제공하여 코드 중복을 방지합니다.
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-25
 */
@Slf4j
public class EmailUtil {

    private EmailUtil() {
        // 유틸리티 클래스이므로 인스턴스 생성 방지
        throw new UnsupportedOperationException("유틸리티 클래스입니다.");
    }

    /**
     * 기본 이메일 템플릿 변수 생성
     * 공통 변수들(사용자명, 이메일, 회사명, 지원 이메일, 현재 연도)을 포함합니다.
     * 
     * @param userName 사용자명 (null이면 "고객님"으로 설정)
     * @param userEmail 사용자 이메일
     * @param companyName 회사명 (null이면 "CoreSolution"으로 설정)
     * @return 기본 변수가 포함된 Map
     */
    public static Map<String, Object> createBaseEmailVariables(String userName, String userEmail,
            String companyName) {
        Map<String, Object> variables = new HashMap<>();
        variables.put(EmailConstants.VAR_USER_NAME, userName != null ? userName : "고객님");
        variables.put(EmailConstants.VAR_USER_EMAIL, userEmail);
        variables.put(EmailConstants.VAR_COMPANY_NAME, companyName != null ? companyName : "CoreSolution");
        variables.put(EmailConstants.VAR_SUPPORT_EMAIL, EmailConstants.SUPPORT_EMAIL);
        variables.put(EmailConstants.VAR_CURRENT_YEAR, String.valueOf(java.time.Year.now().getValue()));
        return variables;
    }

    /**
     * 템플릿 이메일 발송 (공통 로직)
     * 
     * @param emailService 이메일 서비스
     * @param templateType 템플릿 타입 (EmailConstants.TEMPLATE_*)
     * @param toEmail 수신자 이메일
     * @param toName 수신자 이름
     * @param variables 템플릿 변수
     * @param context 컨텍스트 정보 (로깅용, 예: "온보딩 승인", "상담사 승인" 등)
     * @return EmailResponse
     */
    public static EmailResponse sendTemplateEmail(EmailService emailService, String templateType,
            String toEmail, String toName, Map<String, Object> variables, String context) {
        try {
            if (toEmail == null || toEmail.trim().isEmpty()) {
                log.warn("{} 이메일 발송 건너뜀: 이메일 주소가 없습니다. context={}", context, context);
                return createErrorResponse("이메일 주소가 없습니다.");
            }

            log.info("{} 이메일 발송 시작: toEmail={}, toName={}, templateType={}", context, toEmail, toName,
                    templateType);

            EmailResponse response = emailService.sendTemplateEmail(templateType, toEmail, toName, variables);

            if (response.isSuccess()) {
                log.info("{} 이메일 발송 성공: toEmail={}, emailId={}", context, toEmail, response.getEmailId());
            } else {
                log.error("{} 이메일 발송 실패: toEmail={}, error={}", context, toEmail,
                        response.getErrorMessage());
            }

            return response;

        } catch (Exception e) {
            log.error("{} 이메일 발송 중 오류: toEmail={}, error={}", context, toEmail, e.getMessage(), e);
            return createErrorResponse("이메일 발송 중 오류 발생: " + e.getMessage());
        }
    }

    /**
     * 온보딩 승인 완료 이메일 발송
     * 
     * @param emailService 이메일 서비스
     * @param toEmail 수신자 이메일
     * @param tenantName 테넌트명
     * @param tenantId 테넌트 ID
     * @param businessType 업종
     * @return EmailResponse
     */
    public static EmailResponse sendOnboardingApprovalEmail(EmailService emailService, String toEmail,
            String tenantName, String tenantId, String businessType) {
        // 기본 변수 생성
        Map<String, Object> variables = createBaseEmailVariables(tenantName, toEmail, "CoreSolution");

        // 온보딩 관련 추가 변수
        variables.put("tenantName", tenantName != null ? tenantName : "");
        variables.put("tenantId", tenantId != null ? tenantId : "");
        variables.put("businessType", businessType != null ? businessType : "");

        // 템플릿 이메일 발송
        return sendTemplateEmail(emailService, EmailConstants.TEMPLATE_ADMIN_APPROVAL, toEmail,
                tenantName != null ? tenantName : "고객님", variables, "온보딩 승인 완료");
    }

    /**
     * 관리자 승인 완료 이메일 발송
     * 
     * @param emailService 이메일 서비스
     * @param toEmail 수신자 이메일
     * @param userName 사용자명
     * @return EmailResponse
     */
    public static EmailResponse sendAdminApprovalEmail(EmailService emailService, String toEmail,
            String userName) {
        Map<String, Object> variables = createBaseEmailVariables(userName, toEmail, "mindgarden");

        return sendTemplateEmail(emailService, EmailConstants.TEMPLATE_ADMIN_APPROVAL, toEmail, userName,
                variables, "관리자 승인 완료");
    }

    /**
     * 상담사 승인 완료 이메일 발송
     * 
     * @param emailService 이메일 서비스
     * @param toEmail 수신자 이메일
     * @param userName 사용자명
     * @return EmailResponse
     */
    public static EmailResponse sendConsultantApprovalEmail(EmailService emailService, String toEmail,
            String userName) {
        Map<String, Object> variables = createBaseEmailVariables(userName, toEmail, "mindgarden");

        return sendTemplateEmail(emailService, EmailConstants.TEMPLATE_CONSULTANT_APPROVAL, toEmail,
                userName, variables, "상담사 승인 완료");
    }

    /**
     * 상담사 신청 거부 이메일 발송
     * 
     * @param emailService 이메일 서비스
     * @param toEmail 수신자 이메일
     * @param userName 사용자명
     * @param reason 거부 사유
     * @return EmailResponse
     */
    public static EmailResponse sendConsultantRejectionEmail(EmailService emailService, String toEmail,
            String userName, String reason) {
        Map<String, Object> variables = createBaseEmailVariables(userName, toEmail, "mindgarden");
        variables.put("reason", reason != null ? reason : "");

        return sendTemplateEmail(emailService, EmailConstants.TEMPLATE_CONSULTANT_REJECTION, toEmail,
                userName, variables, "상담사 신청 거부");
    }

    /**
     * 시스템 알림 이메일 발송
     * 
     * @param emailService 이메일 서비스
     * @param toEmail 수신자 이메일
     * @param toName 수신자 이름
     * @param message 알림 메시지
     * @return EmailResponse
     */
    public static EmailResponse sendSystemNotificationEmail(EmailService emailService, String toEmail,
            String toName, String message) {
        Map<String, Object> variables = createBaseEmailVariables(toName, toEmail, "mindgarden");
        variables.put("message", message != null ? message : "");

        return sendTemplateEmail(emailService, EmailConstants.TEMPLATE_SYSTEM_NOTIFICATION, toEmail,
                toName, variables, "시스템 알림");
    }

    /**
     * 비밀번호 재설정 이메일 발송
     * 
     * @param emailService 이메일 서비스
     * @param toEmail 수신자 이메일
     * @param userName 사용자명
     * @param resetLink 비밀번호 재설정 링크
     * @return EmailResponse
     */
    public static EmailResponse sendPasswordResetEmail(EmailService emailService, String toEmail,
            String userName, String resetLink) {
        Map<String, Object> variables = createBaseEmailVariables(userName, toEmail, "mindgarden");
        variables.put(EmailConstants.VAR_RESET_LINK, resetLink != null ? resetLink : "");

        return sendTemplateEmail(emailService, EmailConstants.TEMPLATE_PASSWORD_RESET, toEmail, userName,
                variables, "비밀번호 재설정");
    }

    /**
     * 에러 응답 생성
     */
    private static EmailResponse createErrorResponse(String errorMessage) {
        return EmailResponse.builder()
                .success(false)
                .errorMessage(errorMessage)
                .status(EmailConstants.STATUS_FAILED)
                .build();
    }
}

