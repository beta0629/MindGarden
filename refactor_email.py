import re

with open('src/main/java/com/coresolution/consultation/service/impl/EmailServiceImpl.java', 'r') as f:
    content = f.read()

start_marker = "    // ==================== Template Methods ===================="
end_marker = "    private String formatAmount(Object amount) {"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Markers not found")
    exit(1)

template_methods_content = """    // ==================== Template Methods ====================
    
    private String getBaseTemplate() {
        return \"\"\"
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>{{title}}</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #F2EDE8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; word-break: keep-all;">
                <!-- 100% Width Background Table -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F2EDE8; width: 100%;">
                    <tr>
                        <td align="center" style="padding: 40px 20px;">
                            
                            <!-- 600px Container Table -->
                            <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                                
                                <!-- Header -->
                                <tr>
                                    <td align="center" style="background-color: #FAF9F7; padding: 32px 40px; border-bottom: 1px solid #EAEAEA;">
                                        <h1 style="margin: 0; color: #333333; font-size: 24px; font-weight: bold; line-height: 1.4;">{{title}}</h1>
                                    </td>
                                </tr>
                                
                                <!-- Content (Body) -->
                                <tr>
                                    <td style="padding: 40px;">
                                        {{content}}
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #FAF9F7; padding: 32px 40px; border-top: 1px solid #EAEAEA; border-radius: 0 0 16px 16px;">
                                        <p style="margin: 0 0 8px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                                            문의사항이 있으시면 <a href="mailto:{{supportEmail}}" style="color: #3D5246; text-decoration: underline;">{{supportEmail}}</a>로 연락해주세요.
                                        </p>
                                        <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.5;">
                                            감사합니다.<br><strong>mindgarden 팀</strong>
                                        </p>
                                    </td>
                                </tr>
                                
                            </table>
                            <!-- // 600px Container Table -->
            
                        </td>
                    </tr>
                </table>
                <!-- // 100% Width Background Table -->
            </body>
            </html>
            \"\"\";
    }
    
    private String getWelcomeTemplate() {
        String content = \"\"\"
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{userName}}님!
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                mindgarden에 가입해주셔서 감사합니다.<br>
                계정을 활성화하려면 아래 버튼을 클릭해주세요.
            </p>
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0 0 0;">
                <tr>
                    <td align="center">
                        <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                                <td align="center" bgcolor="#3D5246" style="border-radius: 8px;">
                                    <a href="{{activationLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 16px; color: #FFFFFF; text-decoration: none; font-weight: bold; border-radius: 8px; background-color: #3D5246; border: 1px solid #3D5246;">
                                        계정 활성화
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            \"\"\";
        return getBaseTemplate()
                .replace("{{title}}", "환영합니다")
                .replace("{{content}}", content);
    }
    
    private String getConsultantApprovalTemplate() {
        String content = \"\"\"
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                축하합니다, {{userName}}님!
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                상담사 승인이 완료되었습니다.<br>
                이제 mindgarden에서 상담 서비스를 제공하실 수 있습니다.
            </p>
            \"\"\";
        return getBaseTemplate()
                .replace("{{title}}", "상담사 승인 완료")
                .replace("{{content}}", content);
    }
    
    private String getConsultantRejectionTemplate() {
        String content = \"\"\"
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{userName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                상담사 신청에 대한 검토 결과를 안내드립니다.<br>
                현재 자격 요건을 충족하지 못하여 승인이 어렵습니다.<br>
                자세한 내용은 고객센터로 문의해주세요.
            </p>
            \"\"\";
        return getBaseTemplate()
                .replace("{{title}}", "상담사 신청 결과 안내")
                .replace("{{content}}", content);
    }
    
    private String getAdminApprovalTemplate() {
        String content = \"\"\"
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                축하합니다, {{userName}}님!
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                관리자 승인이 완료되었습니다.<br>
                이제 mindgarden의 관리자 권한을 사용하실 수 있습니다.
            </p>
            \"\"\";
        return getBaseTemplate()
                .replace("{{title}}", "관리자 승인 완료")
                .replace("{{content}}", content);
    }
    
    private String getPasswordResetTemplate() {
        String content = \"\"\"
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{userName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                비밀번호 재설정을 요청하셨습니다.<br>
                아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.
            </p>
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                    <td style="background-color: #FAF9F7; padding: 20px; border-radius: 8px;">
                        <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.5; text-align: center;">
                            <strong>링크 유효 시간:</strong> 24시간 이내
                        </p>
                    </td>
                </tr>
            </table>
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0 0 0;">
                <tr>
                    <td align="center">
                        <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                                <td align="center" bgcolor="#3D5246" style="border-radius: 8px;">
                                    <a href="{{resetLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 16px; color: #FFFFFF; text-decoration: none; font-weight: bold; border-radius: 8px; background-color: #3D5246; border: 1px solid #3D5246;">
                                        비밀번호 재설정
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            \"\"\";
        return getBaseTemplate()
                .replace("{{title}}", "비밀번호 재설정")
                .replace("{{content}}", content);
    }
    
    private String getAccountActivationTemplate() {
        String content = \"\"\"
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{userName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                계정이 성공적으로 활성화되었습니다.<br>
                이제 mindgarden의 모든 서비스를 이용하실 수 있습니다.
            </p>
            \"\"\";
        return getBaseTemplate()
                .replace("{{title}}", "계정 활성화 완료")
                .replace("{{content}}", content);
    }
    
    private String getEmailVerificationTemplate() {
        String content = \"\"\"
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                이메일 인증 코드
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                안녕하세요,<br>
                CoreSolution 서비스 신청을 위한 이메일 인증 코드입니다.
            </p>
            <div style="background-color: #FAF9F7; border: 1px solid #EAEAEA; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="margin: 0 0 12px; font-size: 13px; color: #3D5246; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">인증 코드</p>
                <p style="margin: 0; font-size: 42px; font-weight: 700; color: #3D5246; letter-spacing: 8px; font-family: 'Courier New', monospace;">{{verificationCode}}</p>
            </div>
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                    <td style="background-color: #FFF9E6; padding: 20px; border-radius: 8px; border-left: 4px solid #FFC107;">
                        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                            <strong>⏰ 유효 시간:</strong> 이 코드는 <strong>{{expiryMinutes}}분</strong> 동안 유효합니다.<br>
                            <strong>🔒 보안:</strong> 본인이 요청하지 않은 경우 이 이메일을 무시하셔도 됩니다.
                        </p>
                    </td>
                </tr>
            </table>
            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #EAEAEA;">
                <p style="margin: 0 0 12px; color: #333333; font-size: 15px; font-weight: 600;">사용 방법</p>
                <ol style="margin: 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 1.8;">
                    <li>서비스 신청 페이지로 돌아가세요</li>
                    <li>위의 인증 코드를 입력란에 입력하세요</li>
                    <li>"인증 코드 확인" 버튼을 클릭하세요</li>
                </ol>
            </div>
            \"\"\";
        return getBaseTemplate()
                .replace("{{title}}", "이메일 인증 코드 - Trinity")
                .replace("{{content}}", content);
    }
    
    private String getAppointmentConfirmationTemplate() {
        String content = \"\"\"
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{userName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                상담 예약이 확정되었습니다.
            </p>
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                    <td style="background-color: #FAF9F7; padding: 20px; border-radius: 8px;">
                        <p style="margin: 0 0 8px 0; color: #333333; font-size: 15px; line-height: 1.5;">
                            <strong>상담사:</strong> {{consultantName}}
                        </p>
                        <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.5;">
                            <strong>일시:</strong> {{appointmentDate}} {{appointmentTime}}
                        </p>
                    </td>
                </tr>
            </table>
            \"\"\";
        return getBaseTemplate()
                .replace("{{title}}", "상담 예약 확인")
                .replace("{{content}}", content);
    }
    
    private String getAppointmentReminderTemplate() {
        String content = \"\"\"
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{userName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                내일 상담 예약이 있습니다.
            </p>
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                    <td style="background-color: #FAF9F7; padding: 20px; border-radius: 8px;">
                        <p style="margin: 0 0 8px 0; color: #333333; font-size: 15px; line-height: 1.5;">
                            <strong>상담사:</strong> {{consultantName}}
                        </p>
                        <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.5;">
                            <strong>일시:</strong> {{appointmentDate}} {{appointmentTime}}
                        </p>
                    </td>
                </tr>
            </table>
            \"\"\";
        return getBaseTemplate()
                .replace("{{title}}", "상담 예약 알림")
                .replace("{{content}}", content);
    }
    
    private String getPaymentConfirmationTemplate() {
        String content = \"\"\"
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{userName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                결제가 성공적으로 완료되었습니다.
            </p>
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                    <td style="background-color: #FAF9F7; padding: 20px; border-radius: 8px;">
                        <p style="margin: 0 0 8px 0; color: #333333; font-size: 15px; line-height: 1.5;">
                            <strong>결제 금액:</strong> {{paymentAmount}}원
                        </p>
                        <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.5;">
                            <strong>결제 방법:</strong> {{paymentMethod}}
                        </p>
                    </td>
                </tr>
            </table>
            \"\"\";
        return getBaseTemplate()
                .replace("{{title}}", "결제 완료 안내")
                .replace("{{content}}", content);
    }
    
    private String getPaymentFailedTemplate() {
        String content = \"\"\"
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{userName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                결제 처리 중 오류가 발생했습니다.<br>
                다시 시도해주시거나 다른 결제 방법을 이용해주세요.
            </p>
            \"\"\";
        return getBaseTemplate()
                .replace("{{title}}", "결제 실패 안내")
                .replace("{{content}}", content);
    }
    
    private String getSystemNotificationTemplate() {
        String content = \"\"\"
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{userName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                {{message}}
            </p>
            \"\"\";
        return getBaseTemplate()
                .replace("{{title}}", "시스템 알림")
                .replace("{{content}}", content);
    }
    
    private String getSessionExtensionConfirmationTemplate() {
        String content = \"\"\"
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{userName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                요청하신 회기 추가가 성공적으로 완료되었습니다.
            </p>
            
            <div style="background-color: #FAF9F7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #3D5246; margin: 0 0 12px 0; font-size: 16px;">📋 결제 정보</h3>
                <ul style="list-style: none; padding: 0; margin: 0; color: #444444; font-size: 14px; line-height: 1.6;">
                    <li style="margin-bottom: 8px;"><strong>결제 금액:</strong> {{paymentAmount}}원</li>
                    <li style="margin-bottom: 8px;"><strong>결제 방법:</strong> {{paymentMethod}}</li>
                    <li><strong>확인 일시:</strong> {{confirmationDate}}</li>
                </ul>
            </div>
            
            <div style="background-color: #FAF9F7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #3D5246; margin: 0 0 12px 0; font-size: 16px;">📈 회기 정보</h3>
                <ul style="list-style: none; padding: 0; margin: 0; color: #444444; font-size: 14px; line-height: 1.6;">
                    <li style="margin-bottom: 8px;"><strong>패키지명:</strong> {{packageName}}</li>
                    <li style="margin-bottom: 8px;"><strong>추가 회기:</strong> {{additionalSessions}}회</li>
                    <li style="margin-bottom: 8px;"><strong>총 회기:</strong> {{totalSessions}}회</li>
                    <li><strong>남은 회기:</strong> {{remainingSessions}}회</li>
                </ul>
            </div>
            
            <div style="background-color: #FAF9F7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #3D5246; margin: 0 0 12px 0; font-size: 16px;">👥 상담 정보</h3>
                <ul style="list-style: none; padding: 0; margin: 0; color: #444444; font-size: 14px; line-height: 1.6;">
                    <li style="margin-bottom: 8px;"><strong>상담사:</strong> {{consultantName}}</li>
                    <li><strong>내담자:</strong> {{clientName}}</li>
                </ul>
            </div>
            
            <p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                추가된 회기는 즉시 사용 가능하며, 상담 예약 시 자동으로 차감됩니다.
            </p>
            \"\"\";
        return getBaseTemplate()
                .replace("{{title}}", "회기 추가 완료 안내")
                .replace("{{content}}", content);
    }
    
    // ==================== 급여 관련 이메일 ====================
    
    @Override
    public boolean sendSalaryCalculationEmail(String toEmail, String consultantName, 
                                            String period, Map<String, Object> salaryData, 
                                            String attachmentPath) {
        try {
            log.info("급여 계산서 이메일 발송: to={}, 상담사={}, 기간={}", toEmail, consultantName, period);
            
            String subject = String.format("[mindgarden] %s 급여 계산서 - %s", consultantName, period);
            String content = createSalaryCalculationEmailContent(consultantName, period, salaryData);
            
            EmailRequest request = EmailRequest.builder()
                    .toEmail(toEmail)
                    .toName(consultantName)
                    .subject(subject)
                    .content(content)
                    .type("HTML")
                    .templateType("SALARY_CALCULATION")
                    .templateVariables(Map.of(
                        "consultantName", consultantName,
                        "period", period,
                        "salaryData", salaryData
                    ))
                    .attachments(attachmentPath != null ? List.of(attachmentPath) : null)
                    .build();
            
            EmailResponse response = sendEmail(request);
            return response.isSuccess();
            
        } catch (Exception e) {
            log.error("급여 계산서 이메일 발송 실패: to={}, error={}", toEmail, e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public boolean sendSalaryApprovalEmail(String toEmail, String consultantName, 
                                         String period, String approvedAmount) {
        try {
            log.info("급여 승인 이메일 발송: to={}, 상담사={}, 기간={}", toEmail, consultantName, period);
            
            String subject = String.format("[mindgarden] %s 급여 승인 완료 - %s", consultantName, period);
            String content = createSalaryApprovalEmailContent(consultantName, period, approvedAmount);
            
            EmailRequest request = EmailRequest.builder()
                    .toEmail(toEmail)
                    .toName(consultantName)
                    .subject(subject)
                    .content(content)
                    .type("HTML")
                    .templateType("SALARY_APPROVAL")
                    .templateVariables(Map.of(
                        "consultantName", consultantName,
                        "period", period,
                        "approvedAmount", approvedAmount
                    ))
                    .build();
            
            EmailResponse response = sendEmail(request);
            return response.isSuccess();
            
        } catch (Exception e) {
            log.error("급여 승인 이메일 발송 실패: to={}, error={}", toEmail, e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public boolean sendSalaryPaymentEmail(String toEmail, String consultantName, 
                                        String period, String paidAmount, String payDate) {
        try {
            log.info("급여 지급 완료 이메일 발송: to={}, 상담사={}, 기간={}", toEmail, consultantName, period);
            
            String subject = String.format("[mindgarden] %s 급여 지급 완료 - %s", consultantName, period);
            String content = createSalaryPaymentEmailContent(consultantName, period, paidAmount, payDate);
            
            EmailRequest request = EmailRequest.builder()
                    .toEmail(toEmail)
                    .toName(consultantName)
                    .subject(subject)
                    .content(content)
                    .type("HTML")
                    .templateType("SALARY_PAYMENT")
                    .templateVariables(Map.of(
                        "consultantName", consultantName,
                        "period", period,
                        "paidAmount", paidAmount,
                        "payDate", payDate
                    ))
                    .build();
            
            EmailResponse response = sendEmail(request);
            return response.isSuccess();
            
        } catch (Exception e) {
            log.error("급여 지급 완료 이메일 발송 실패: to={}, error={}", toEmail, e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public boolean sendTaxReportEmail(String toEmail, String consultantName, 
                                    String period, Map<String, Object> taxData, 
                                    String attachmentPath) {
        try {
            log.info("세금 내역서 이메일 발송: to={}, 상담사={}, 기간={}", toEmail, consultantName, period);
            
            String subject = String.format("[mindgarden] %s 세금 내역서 - %s", consultantName, period);
            String content = createTaxReportEmailContent(consultantName, period, taxData);
            
            EmailRequest request = EmailRequest.builder()
                    .toEmail(toEmail)
                    .toName(consultantName)
                    .subject(subject)
                    .content(content)
                    .type("HTML")
                    .templateType("TAX_REPORT")
                    .templateVariables(Map.of(
                        "consultantName", consultantName,
                        "period", period,
                        "taxData", taxData
                    ))
                    .attachments(attachmentPath != null ? List.of(attachmentPath) : null)
                    .build();
            
            EmailResponse response = sendEmail(request);
            return response.isSuccess();
            
        } catch (Exception e) {
            log.error("세금 내역서 이메일 발송 실패: to={}, error={}", toEmail, e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public String getEmailTemplate(String templateType) {
        return switch (templateType) {
            case "SALARY_CALCULATION" -> getSalaryCalculationTemplate();
            case "SALARY_APPROVAL" -> getSalaryApprovalTemplate();
            case "SALARY_PAYMENT" -> getSalaryPaymentTemplate();
            case "TAX_REPORT" -> getTaxReportTemplate();
            default -> getSystemNotificationTemplate();
        };
    }
    
    // ==================== 급여 이메일 템플릿 ====================
    
    private String createSalaryCalculationEmailContent(String consultantName, String period, Map<String, Object> salaryData) {
        String template = getSalaryCalculationTemplate();
        
        return template
                .replace("{{consultantName}}", consultantName)
                .replace("{{period}}", period)
                .replace("{{baseSalary}}", formatAmount(salaryData.get("baseSalary")))
                .replace("{{optionSalary}}", formatAmount(salaryData.get("optionSalary")))
                .replace("{{totalSalary}}", formatAmount(salaryData.get("totalSalary")))
                .replace("{{taxAmount}}", formatAmount(salaryData.get("taxAmount")))
                .replace("{{netSalary}}", formatAmount(salaryData.get("netSalary")))
                .replace("{{consultationCount}}", String.valueOf(salaryData.get("consultationCount")))
                .replace("{{supportEmail}}", EmailConstants.SUPPORT_EMAIL);
    }
    
    private String createSalaryApprovalEmailContent(String consultantName, String period, String approvedAmount) {
        String template = getSalaryApprovalTemplate();
        
        return template
                .replace("{{consultantName}}", consultantName)
                .replace("{{period}}", period)
                .replace("{{approvedAmount}}", approvedAmount)
                .replace("{{supportEmail}}", EmailConstants.SUPPORT_EMAIL);
    }
    
    private String createSalaryPaymentEmailContent(String consultantName, String period, String paidAmount, String payDate) {
        String template = getSalaryPaymentTemplate();
        
        return template
                .replace("{{consultantName}}", consultantName)
                .replace("{{period}}", period)
                .replace("{{paidAmount}}", paidAmount)
                .replace("{{payDate}}", payDate)
                .replace("{{supportEmail}}", EmailConstants.SUPPORT_EMAIL);
    }
    
    private String createTaxReportEmailContent(String consultantName, String period, Map<String, Object> taxData) {
        String template = getTaxReportTemplate();
        
        return template
                .replace("{{consultantName}}", consultantName)
                .replace("{{period}}", period)
                .replace("{{totalTaxAmount}}", formatAmount(taxData.get("totalTaxAmount")))
                .replace("{{supportEmail}}", EmailConstants.SUPPORT_EMAIL);
    }
    
    private String getSalaryCalculationTemplate() {
        String content = \"\"\"
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{consultantName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                {{period}} 급여 계산이 완료되었습니다.
            </p>
            
            <div style="background-color: #FAF9F7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #3D5246; margin: 0 0 12px 0; font-size: 16px;">급여 내역</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #444444;">
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #EAEAEA;"><strong>기본 급여:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #EAEAEA; text-align: right;">{{baseSalary}}원</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #EAEAEA;"><strong>옵션 급여:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #EAEAEA; text-align: right;">{{optionSalary}}원</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #EAEAEA;"><strong>총 급여 (세전):</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #EAEAEA; text-align: right;">{{totalSalary}}원</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #EAEAEA;"><strong>세금:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #EAEAEA; text-align: right; color: #D32F2F;">-{{taxAmount}}원</td>
                    </tr>
                    <tr style="background-color: #F2EDE8;">
                        <td style="padding: 8px; border-bottom: 1px solid #EAEAEA;"><strong>실지급액 (세후):</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #EAEAEA; text-align: right; color: #3D5246; font-weight: bold;">{{netSalary}}원</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;"><strong>상담 건수:</strong></td>
                        <td style="padding: 8px; text-align: right;">{{consultationCount}}건</td>
                    </tr>
                </table>
            </div>
            \"\"\";
        return getBaseTemplate()
                .replace("{{title}}", "급여 계산서")
                .replace("{{content}}", content);
    }
    
    private String getSalaryApprovalTemplate() {
        String content = \"\"\"
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{consultantName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                {{period}} 급여가 승인되었습니다.
            </p>
            
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                    <td style="background-color: #FAF9F7; padding: 20px; border-radius: 8px; text-align: center;">
                        <h3 style="color: #3D5246; margin: 0 0 8px 0; font-size: 15px;">승인된 급여</h3>
                        <p style="margin: 0; color: #3D5246; font-size: 24px; font-weight: bold;">{{approvedAmount}}원</p>
                    </td>
                </tr>
            </table>
            \"\"\";
        return getBaseTemplate()
                .replace("{{title}}", "급여 승인 완료")
                .replace("{{content}}", content);
    }
    
    private String getSalaryPaymentTemplate() {
        String content = \"\"\"
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{consultantName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                {{period}} 급여가 지급되었습니다.
            </p>
            
            <div style="background-color: #FAF9F7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #3D5246; margin: 0 0 12px 0; font-size: 16px;">지급 정보</h3>
                <p style="margin: 0 0 8px 0; color: #444444; font-size: 14px;"><strong>지급 금액:</strong> {{paidAmount}}원</p>
                <p style="margin: 0; color: #444444; font-size: 14px;"><strong>지급일:</strong> {{payDate}}</p>
            </div>
            \"\"\";
        return getBaseTemplate()
                .replace("{{title}}", "급여 지급 완료")
                .replace("{{content}}", content);
    }
    
    private String getTaxReportTemplate() {
        String content = \"\"\"
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{consultantName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                {{period}} 세금 내역서를 발송해드립니다.
            </p>
            
            <div style="background-color: #FAF9F7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #3D5246; margin: 0 0 12px 0; font-size: 16px;">세금 요약</h3>
                <p style="margin: 0; color: #444444; font-size: 14px;"><strong>총 세금:</strong> {{totalTaxAmount}}원</p>
            </div>
            \"\"\";
        return getBaseTemplate()
                .replace("{{title}}", "세금 내역서")
                .replace("{{content}}", content);
    }
"""

new_content = content[:start_idx] + template_methods_content + "\n    " + content[end_idx:]

with open('src/main/java/com/coresolution/consultation/service/impl/EmailServiceImpl.java', 'w') as f:
    f.write(new_content)

print("Refactoring complete.")
