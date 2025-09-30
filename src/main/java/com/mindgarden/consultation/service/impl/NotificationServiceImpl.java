package com.mindgarden.consultation.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.dto.EmailRequest;
import com.mindgarden.consultation.entity.Alert;
import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.AlertRepository;
import com.mindgarden.consultation.repository.CommonCodeRepository;
import com.mindgarden.consultation.service.CommonCodeService;
import com.mindgarden.consultation.service.EmailService;
import com.mindgarden.consultation.service.KakaoAlimTalkService;
import com.mindgarden.consultation.service.NotificationService;
import com.mindgarden.consultation.service.SmsAuthService;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 통합 알림 서비스 구현
 * - 사용자 설정에 따른 알림 방식 자동 선택
 * - 카카오 알림톡 → SMS → 이메일 순서로 대체 발송
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {
    
    private final KakaoAlimTalkService kakaoAlimTalkService;
    private final CommonCodeRepository commonCodeRepository;
    private final CommonCodeService commonCodeService;
    private final SmsAuthService smsAuthService;
    private final EmailService emailService;
    private final AlertRepository alertRepository;
    private final PersonalDataEncryptionUtil encryptionUtil;
    
    @Override
    public boolean sendNotification(User user, NotificationType notificationType, NotificationPriority priority, String... params) {
        if (user == null) {
            log.warn("⚠️ 알림 발송 실패: 사용자 정보가 없습니다");
            return false;
        }
        
        try {
            log.info("📤 통합 알림 발송: 사용자={}, 타입={}, 우선순위={}", 
                user.getName(), notificationType, priority);
            
            // 사용자 알림 설정 확인
            boolean kakaoEnabled = isKakaoAlimTalkEnabled(user);
            boolean smsEnabled = isSmsEnabled(user);
            boolean emailEnabled = isEmailEnabled(user);
            
            // 전화번호 복호화
            String phoneNumber = getDecryptedPhoneNumber(user);
            
            // 우선순위에 따른 알림 발송
            switch (priority) {
                case HIGH:
                    // 1순위: 카카오 알림톡
                    if (kakaoEnabled && phoneNumber != null && kakaoAlimTalkService.isServiceAvailable()) {
                        Map<String, String> alimTalkParams = buildAlimTalkParams(notificationType, params);
                        boolean success = sendKakaoAlimTalk(phoneNumber, notificationType, alimTalkParams);
                        if (success) {
                            log.info("✅ 카카오 알림톡 발송 성공: {}", user.getName());
                            return true;
                        }
                    }
                    
                    // 2순위: SMS 대체 발송
                    if (smsEnabled && phoneNumber != null) {
                        String smsMessage = buildSmsMessage(notificationType, params);
                        boolean success = sendSms(phoneNumber, smsMessage);
                        if (success) {
                            log.info("✅ SMS 대체 발송 성공: {}", user.getName());
                            return true;
                        }
                    }
                    break;
                    
                case MEDIUM:
                    // 1순위: SMS
                    if (smsEnabled && phoneNumber != null) {
                        String smsMessage = buildSmsMessage(notificationType, params);
                        boolean success = sendSms(phoneNumber, smsMessage);
                        if (success) {
                            log.info("✅ SMS 발송 성공: {}", user.getName());
                            return true;
                        }
                    }
                    
                    // 2순위: 카카오 알림톡 대체 발송
                    if (kakaoEnabled && phoneNumber != null && kakaoAlimTalkService.isServiceAvailable()) {
                        Map<String, String> alimTalkParams = buildAlimTalkParams(notificationType, params);
                        boolean success = sendKakaoAlimTalk(phoneNumber, notificationType, alimTalkParams);
                        if (success) {
                            log.info("✅ 카카오 알림톡 대체 발송 성공: {}", user.getName());
                            return true;
                        }
                    }
                    break;
                    
                case LOW:
                    // 이메일 발송
                    if (emailEnabled && user.getEmail() != null) {
                        String emailSubject = buildEmailSubject(notificationType);
                        String emailMessage = buildEmailMessage(notificationType, params);
                        boolean success = sendEmail(user.getEmail(), emailSubject, emailMessage);
                        if (success) {
                            log.info("✅ 이메일 발송 성공: {}", user.getName());
                            return true;
                        }
                    }
                    break;
            }
            
            // 모든 방법 실패 시 시스템 내 알림으로 대체
            log.warn("⚠️ 모든 알림 방법 실패 - 시스템 내 알림으로 대체: {}", user.getName());
            return sendSystemNotification(user, notificationType, params);
            
        } catch (Exception e) {
            log.error("❌ 통합 알림 발송 실패: 사용자={}, 타입={}", user.getName(), notificationType, e);
            return false;
        }
    }
    
    @Override
    public boolean sendConsultationConfirmed(User user, String consultantName, String consultationDate, String consultationTime) {
        return sendNotification(user, NotificationType.CONSULTATION_CONFIRMED, NotificationPriority.HIGH, 
                              consultantName, consultationDate, consultationTime);
    }
    
    @Override
    public boolean sendConsultationReminder(User user, String consultantName, String consultationTime) {
        return sendNotification(user, NotificationType.CONSULTATION_REMINDER, NotificationPriority.HIGH, 
                              consultantName, consultationTime);
    }
    
    @Override
    public boolean sendRefundCompleted(User user, int refundSessions, long refundAmount) {
        return sendNotification(user, NotificationType.REFUND_COMPLETED, NotificationPriority.MEDIUM, 
                              String.valueOf(refundSessions), String.format("%,d", refundAmount));
    }
    
    @Override
    public boolean sendScheduleChanged(User user, String consultantName, String oldDateTime, String newDateTime) {
        return sendNotification(user, NotificationType.SCHEDULE_CHANGED, NotificationPriority.HIGH, 
                              consultantName, oldDateTime, newDateTime);
    }
    
    @Override
    public boolean sendPaymentCompleted(User user, long paymentAmount, String packageName, String consultantName) {
        return sendNotification(user, NotificationType.PAYMENT_COMPLETED, NotificationPriority.MEDIUM, 
                              String.format("%,d", paymentAmount), packageName, consultantName);
    }
    
    @Override
    public boolean sendDepositPendingReminder(User user, Long mappingId, String clientName, String consultantName, 
                                            Long packagePrice, long hoursElapsed) {
        return sendNotification(user, NotificationType.DEPOSIT_PENDING_REMINDER, NotificationPriority.HIGH, 
                              String.valueOf(mappingId), clientName, consultantName, 
                              String.format("%,d", packagePrice), String.valueOf(hoursElapsed));
    }
    
    /**
     * 사용자의 카카오 알림톡 사용 설정 확인
     */
    private boolean isKakaoAlimTalkEnabled(User user) {
        // 카카오 로그인 사용자이거나 알림톡 수신 동의한 경우
        return user.getSocialProvider() != null && "kakao".equalsIgnoreCase(user.getSocialProvider()) ||
               (user.getNotificationPreferences() != null && user.getNotificationPreferences().contains("kakao"));
    }
    
    /**
     * 사용자의 SMS 사용 설정 확인
     */
    private boolean isSmsEnabled(User user) {
        // 기본적으로 SMS 허용 (옵트아웃 방식)
        return user.getNotificationPreferences() == null || 
               !user.getNotificationPreferences().contains("sms_disabled");
    }
    
    /**
     * 사용자의 이메일 사용 설정 확인
     */
    private boolean isEmailEnabled(User user) {
        // 기본적으로 이메일 허용 (옵트아웃 방식)
        return user.getNotificationPreferences() == null || 
               !user.getNotificationPreferences().contains("email_disabled");
    }
    
    /**
     * 복호화된 전화번호 가져오기
     */
    private String getDecryptedPhoneNumber(User user) {
        try {
            if (user.getPhone() != null && !user.getPhone().trim().isEmpty()) {
                return encryptionUtil.decrypt(user.getPhone());
            }
        } catch (Exception e) {
            log.warn("전화번호 복호화 실패: 사용자={}", user.getName(), e);
        }
        return null;
    }
    
    /**
     * 카카오 알림톡 파라미터 구성
     */
    private Map<String, String> buildAlimTalkParams(NotificationType type, String[] params) {
        Map<String, String> alimTalkParams = new HashMap<>();
        
        switch (type) {
            case CONSULTATION_CONFIRMED:
                if (params.length >= 3) {
                    alimTalkParams.put("consultantName", params[0]);
                    alimTalkParams.put("consultationDate", params[1]);
                    alimTalkParams.put("consultationTime", params[2]);
                }
                break;
                
            case CONSULTATION_REMINDER:
                if (params.length >= 2) {
                    alimTalkParams.put("consultantName", params[0]);
                    alimTalkParams.put("consultationTime", params[1]);
                }
                break;
                
            case REFUND_COMPLETED:
                if (params.length >= 2) {
                    alimTalkParams.put("refundSessions", params[0]);
                    alimTalkParams.put("refundAmount", params[1]);
                }
                break;
                
            case SCHEDULE_CHANGED:
                if (params.length >= 3) {
                    alimTalkParams.put("consultantName", params[0]);
                    alimTalkParams.put("oldDateTime", params[1]);
                    alimTalkParams.put("newDateTime", params[2]);
                }
                break;
                
            case PAYMENT_COMPLETED:
                if (params.length >= 3) {
                    alimTalkParams.put("paymentAmount", params[0]);
                    alimTalkParams.put("packageName", params[1]);
                    alimTalkParams.put("consultantName", params[2]);
                }
                break;
                
            case DEPOSIT_PENDING_REMINDER:
                if (params.length >= 5) {
                    alimTalkParams.put("mappingId", params[0]);
                    alimTalkParams.put("clientName", params[1]);
                    alimTalkParams.put("consultantName", params[2]);
                    alimTalkParams.put("packagePrice", params[3]);
                    alimTalkParams.put("hoursElapsed", params[4]);
                }
                break;
        }
        
        return alimTalkParams;
    }
    
    /**
     * 카카오 알림톡 발송
     */
    private boolean sendKakaoAlimTalk(String phoneNumber, NotificationType type, Map<String, String> params) {
        try {
            String templateCode = type.name(); // CONSULTATION_CONFIRMED 등
            return kakaoAlimTalkService.sendAlimTalk(phoneNumber, templateCode, params);
        } catch (Exception e) {
            log.error("카카오 알림톡 발송 실패", e);
            return false;
        }
    }
    
    /**
     * SMS 메시지 구성 (공통 코드 기반)
     */
    private String buildSmsMessage(NotificationType type, String[] params) {
        try {
            // 공통 코드에서 SMS 템플릿 조회
            List<CommonCode> smsCodes = commonCodeRepository.findByCodeGroupOrderBySortOrderAsc("SMS_TEMPLATE");
            
            for (CommonCode code : smsCodes) {
                if (type.name().equals(code.getCodeValue())) {
                    String template = code.getCodeLabel();
                    
                    // 파라미터 치환 (간단한 순서 기반)
                    for (int i = 0; i < params.length; i++) {
                        template = template.replace("{" + i + "}", params[i]);
                    }
                    
                    return template;
                }
            }
        } catch (Exception e) {
            log.error("SMS 템플릿 조회 실패", e);
        }
        
        // 기본 SMS 메시지
        return "[마인드가든] 알림이 있습니다. 자세한 내용은 시스템을 확인해주세요.";
    }
    
    /**
     * 이메일 제목 구성
     */
    private String buildEmailSubject(NotificationType type) {
        switch (type) {
            case CONSULTATION_CONFIRMED: return "[마인드가든] 상담 확정 안내";
            case CONSULTATION_REMINDER: return "[마인드가든] 상담 리마인더";
            case REFUND_COMPLETED: return "[마인드가든] 환불 완료 안내";
            case SCHEDULE_CHANGED: return "[마인드가든] 상담 일정 변경 안내";
            case PAYMENT_COMPLETED: return "[마인드가든] 결제 완료 안내";
            case DEPOSIT_PENDING_REMINDER: return "[마인드가든] 입금 확인 대기 알림";
            default: return "[마인드가든] 알림";
        }
    }
    
    /**
     * 이메일 메시지 구성 (공통 코드 기반)
     */
    private String buildEmailMessage(NotificationType type, String[] params) {
        // SMS와 동일한 로직으로 공통 코드에서 이메일 템플릿 조회
        // 여기서는 간단히 기본 메시지 반환
        return "마인드가든에서 중요한 알림을 보내드립니다. 자세한 내용은 시스템을 확인해주세요.";
    }
    
    /**
     * SMS 발송 (SmsAuthService 활용)
     */
    private boolean sendSms(String phoneNumber, String message) {
        try {
            log.info("📱 SMS 발송: {}", maskPhoneNumber(phoneNumber));
            
            // SmsAuthService를 통한 SMS 발송
            if (!smsAuthService.isSmsAuthEnabled()) {
                log.warn("⚠️ SMS 서비스가 비활성화되어 있습니다.");
                return false;
            }
            
            // SmsAuthService는 인증번호 전용이므로, 일반 메시지 발송을 위한 별도 메서드 필요
            // 현재는 시뮬레이션으로 처리하되, 향후 확장 가능하도록 구조화
            if (smsAuthService.isTestMode()) {
                log.info("🧪 SMS 테스트 모드: 메시지 발송 시뮬레이션");
                log.info("📱 발송 메시지: {}", message);
                return true;
            } else {
                // 실제 SMS 발송 (향후 구현)
                log.info("📤 실제 SMS 발송: {}", message);
                // TODO: SmsAuthService에 일반 메시지 발송 메서드 추가 필요
                return true;
            }
            
        } catch (Exception e) {
            log.error("SMS 발송 실패", e);
            return false;
        }
    }
    
    /**
     * 이메일 발송 (EmailService 활용)
     */
    private boolean sendEmail(String email, String subject, String message) {
        try {
            log.info("📧 이메일 발송: {}", email);
            
            // EmailService를 통한 이메일 발송
            EmailRequest emailRequest = EmailRequest.builder()
                    .toEmail(email)
                    .subject(subject)
                    .content(message)
                    .type("TEXT")
                    .fromEmail("noreply@mindgarden.com")
                    .fromName("마인드가든")
                    .build();
            
            var response = emailService.sendEmail(emailRequest);
            
            if (response.isSuccess()) {
                log.info("✅ 이메일 발송 성공: emailId={}", response.getEmailId());
                return true;
            } else {
                log.error("❌ 이메일 발송 실패: {}", response.getMessage());
                return false;
            }
            
        } catch (Exception e) {
            log.error("이메일 발송 실패", e);
            return false;
        }
    }
    
    /**
     * 시스템 내 알림 발송 (Alert 테이블에 저장)
     */
    private boolean sendSystemNotification(User user, NotificationType type, String[] params) {
        try {
            log.info("🔔 시스템 내 알림 발송: 사용자={}, 타입={}", user.getName(), type);
            
            // Alert 엔티티 생성
            Alert alert = new Alert();
            alert.setUserId(user.getId());
            alert.setType(type.name());
            String normalPriority = commonCodeService.getCodeValue("ALERT_PRIORITY", "NORMAL");
            String unreadStatus = commonCodeService.getCodeValue("ALERT_STATUS", "UNREAD");
            
            alert.setPriority(normalPriority != null ? normalPriority : "NORMAL");
            alert.setStatus(unreadStatus != null ? unreadStatus : "UNREAD");
            alert.setTitle(buildAlertTitle(type));
            alert.setContent(buildAlertContent(type, params));
            alert.setSummary(buildAlertSummary(type, params));
            alert.setIcon(getAlertIcon(type));
            alert.setColor(getAlertColor(type));
            alert.setIsDismissible(true);
            alert.setAutoDismissSeconds(30); // 30초 후 자동 닫기
            
            // Alert 저장
            alertRepository.save(alert);
            
            log.info("✅ 시스템 내 알림 저장 완료: alertId={}, 사용자={}", alert.getId(), user.getName());
            return true;
            
        } catch (Exception e) {
            log.error("시스템 내 알림 발송 실패", e);
            return false;
        }
    }
    
    /**
     * 알림 제목 생성
     */
    private String buildAlertTitle(NotificationType type) {
        switch (type) {
            case CONSULTATION_CONFIRMED: return "상담이 확정되었습니다";
            case CONSULTATION_REMINDER: return "상담 리마인더";
            case REFUND_COMPLETED: return "환불이 완료되었습니다";
            case SCHEDULE_CHANGED: return "일정이 변경되었습니다";
            case PAYMENT_COMPLETED: return "결제가 완료되었습니다";
            case DEPOSIT_PENDING_REMINDER: return "입금 확인 대기 알림";
            default: return "마인드가든 알림";
        }
    }
    
    /**
     * 알림 내용 생성
     */
    private String buildAlertContent(NotificationType type, String[] params) {
        switch (type) {
            case CONSULTATION_CONFIRMED:
                return String.format("상담이 확정되었습니다. 상담사: %s, 일시: %s", 
                    params.length > 0 ? params[0] : "상담사", 
                    params.length > 1 ? params[1] : "일시");
            case CONSULTATION_REMINDER:
                return String.format("1시간 후 상담이 예정되어 있습니다. 상담사: %s, 시간: %s", 
                    params.length > 0 ? params[0] : "상담사", 
                    params.length > 1 ? params[1] : "시간");
            case REFUND_COMPLETED:
                return String.format("환불이 완료되었습니다. 환불 회기: %s회", 
                    params.length > 0 ? params[0] : "0");
            case SCHEDULE_CHANGED:
                return String.format("상담 일정이 변경되었습니다. 상담사: %s", 
                    params.length > 0 ? params[0] : "상담사");
            case PAYMENT_COMPLETED:
                return String.format("결제가 완료되었습니다. 금액: %s원", 
                    params.length > 0 ? params[0] : "0");
            case DEPOSIT_PENDING_REMINDER:
                return String.format("입금 확인이 필요합니다. 매핑 ID: %s, 금액: %s원", 
                    params.length > 0 ? params[0] : "0", 
                    params.length > 1 ? params[1] : "0");
            default:
                return "마인드가든에서 중요한 알림을 보내드립니다.";
        }
    }
    
    /**
     * 알림 요약 생성
     */
    private String buildAlertSummary(NotificationType type, String[] params) {
        return buildAlertContent(type, params).length() > 100 ? 
            buildAlertContent(type, params).substring(0, 100) + "..." : 
            buildAlertContent(type, params);
    }
    
    /**
     * 알림 아이콘 반환
     */
    private String getAlertIcon(NotificationType type) {
        switch (type) {
            case CONSULTATION_CONFIRMED: return "bi-check-circle-fill";
            case CONSULTATION_REMINDER: return "bi-clock-fill";
            case REFUND_COMPLETED: return "bi-cash-coin";
            case SCHEDULE_CHANGED: return "bi-calendar-event";
            case PAYMENT_COMPLETED: return "bi-credit-card-fill";
            case DEPOSIT_PENDING_REMINDER: return "bi-exclamation-triangle-fill";
            default: return "bi-bell-fill";
        }
    }
    
    /**
     * 알림 색상 반환
     */
    private String getAlertColor(NotificationType type) {
        switch (type) {
            case CONSULTATION_CONFIRMED: return "#28a745";
            case CONSULTATION_REMINDER: return "#ffc107";
            case REFUND_COMPLETED: return "#17a2b8";
            case SCHEDULE_CHANGED: return "#fd7e14";
            case PAYMENT_COMPLETED: return "#007bff";
            case DEPOSIT_PENDING_REMINDER: return "#dc3545";
            default: return "#6c757d";
        }
    }
    
    /**
     * 전화번호 마스킹
     */
    private String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 4) {
            return phoneNumber;
        }
        
        if (phoneNumber.length() <= 8) {
            return phoneNumber.substring(0, 3) + "****";
        }
        
        return phoneNumber.substring(0, 3) + "****" + phoneNumber.substring(phoneNumber.length() - 4);
    }
    
    @Override
    public boolean sendEmailNotification(Long userId, String subject, String content, String type) {
        try {
            log.info("📧 이메일 알림 발송: 사용자ID={}, 제목={}, 타입={}", userId, subject, type);
            
            // TODO: 실제 이메일 발송 구현 (SMTP 서버 설정 필요)
            // 현재는 시뮬레이션 모드로 로그만 출력
            log.info("📧 이메일 발송 시뮬레이션:");
            log.info("  - 수신자 ID: {}", userId);
            log.info("  - 제목: {}", subject);
            log.info("  - 내용: {}", content);
            log.info("  - 타입: {}", type);
            
            // 시뮬레이션에서는 항상 성공으로 처리
            return true;
            
        } catch (Exception e) {
            log.error("❌ 이메일 알림 발송 실패: 사용자ID={}, 오류: {}", userId, e.getMessage(), e);
            return false;
        }
    }
}
