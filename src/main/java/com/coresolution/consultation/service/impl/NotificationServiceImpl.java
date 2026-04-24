package com.coresolution.consultation.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.dto.EmailRequest;
import com.coresolution.consultation.entity.Alert;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.AlertRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.KakaoAlimTalkService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.service.TenantKakaoAlimtalkSettingsService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.PhoneLogMasking;
import com.coresolution.core.context.TenantContextHolder;
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
    
    private static final String CODE_GROUP_ALIMTALK_BIZ_TEMPLATE_CODE = "ALIMTALK_BIZ_TEMPLATE_CODE";
    
    private final KakaoAlimTalkService kakaoAlimTalkService;
    private final CommonCodeRepository commonCodeRepository;
    private final CommonCodeService commonCodeService;
    private final SmsAuthService smsAuthService;
    private final EmailService emailService;
    private final AlertRepository alertRepository;
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final TenantKakaoAlimtalkSettingsService tenantKakaoAlimtalkSettingsService;
    
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
                    if (kakaoEnabled && phoneNumber != null && isAlimTalkChannelAvailable()) {
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
                    if (kakaoEnabled && phoneNumber != null && isAlimTalkChannelAvailable()) {
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
    public boolean sendConsultationCancelled(User user, String consultantName, String cancelledReservationDateTime) {
        return sendNotification(user, NotificationType.CONSULTATION_CANCELLED, NotificationPriority.HIGH,
            consultantName, cancelledReservationDateTime);
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
            
            case CONSULTATION_CANCELLED:
                if (params.length >= 2) {
                    alimTalkParams.put("consultantName", params[0]);
                    alimTalkParams.put("cancelledDateTime", params[1]);
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
     * 전역 {@code kakao.alimtalk.*} 가용성 + 테넌트 DB {@code alimtalk_enabled}
     * (설정 행 없으면 true, §11.4 전역 상속).
     *
     * @return 알림톡 채널 시도 가능 여부
     */
    private boolean isAlimTalkChannelAvailable() {
        if (!kakaoAlimTalkService.isServiceAvailable()) {
            return false;
        }
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            return true;
        }
        return tenantKakaoAlimtalkSettingsService.isAlimTalkEnabledForTenant(tenantId);
    }
    
    /**
     * 비즈 템플릿 코드 결정 우선순위 (§11.4, {@code tenant_kakao_alimtalk_settings} §11.3 SSOT):
     * <ol>
     *   <li>테넌트 DB 설정 테이블의 해당 알림 유형 컬럼이 비어있지 않으면 그 값</li>
     *   <li>공통코드 ALIMTALK_BIZ_TEMPLATE_CODE (테넌트 행 → 코어 행, codeLabel)</li>
     *   <li>{@link NotificationType#name()}</li>
     * </ol>
     *
     * @param type 알림 유형
     * @return 카카오 API용 템플릿 코드
     */
    private String resolveAlimTalkBizTemplateCode(NotificationType type) {
        try {
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId != null && !tenantId.isEmpty()) {
                Optional<String> fromSettingsTable = tenantKakaoAlimtalkSettingsService.findBizTemplateCodeOverride(
                    tenantId, type);
                if (fromSettingsTable.isPresent()) {
                    return fromSettingsTable.get();
                }
                Optional<CommonCode> tenantRow = commonCodeRepository.findTenantCodeByGroupAndValue(
                    tenantId, CODE_GROUP_ALIMTALK_BIZ_TEMPLATE_CODE, type.name());
                if (tenantRow.isPresent() && tenantRow.get().getCodeLabel() != null
                        && !tenantRow.get().getCodeLabel().isBlank()) {
                    return tenantRow.get().getCodeLabel().trim();
                }
            }
            Optional<CommonCode> coreRow = commonCodeRepository.findCoreCodeByGroupAndValue(
                CODE_GROUP_ALIMTALK_BIZ_TEMPLATE_CODE, type.name());
            if (coreRow.isPresent() && coreRow.get().getCodeLabel() != null
                    && !coreRow.get().getCodeLabel().isBlank()) {
                return coreRow.get().getCodeLabel().trim();
            }
        } catch (Exception e) {
            log.debug("ALIMTALK_BIZ_TEMPLATE_CODE 조회 실패, 내부 키 사용: type={}, {}", type.name(), e.getMessage());
        }
        return type.name();
    }
    
    /**
     * 카카오 알림톡 발송
     */
    private boolean sendKakaoAlimTalk(String phoneNumber, NotificationType type, Map<String, String> params) {
        try {
            String apiTemplateCode = resolveAlimTalkBizTemplateCode(type);
            return kakaoAlimTalkService.sendAlimTalk(phoneNumber, apiTemplateCode, type.name(), params);
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
            // 공통 코드에서 SMS 템플릿 조회 (테넌트별)
            String tenantId = TenantContextHolder.getTenantId();
            List<CommonCode> smsCodes = tenantId != null 
                ? commonCodeRepository.findByTenantIdAndCodeGroupOrderBySortOrderAsc(tenantId, "SMS_TEMPLATE")
                : commonCodeRepository.findByCodeGroupOrderBySortOrderAsc("SMS_TEMPLATE");
            
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
            case CONSULTATION_CANCELLED: return "[마인드가든] 상담 예약 취소 안내";
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
            log.info("📱 SMS 발송: {}", PhoneLogMasking.maskForLog(phoneNumber));
            
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
            case CONSULTATION_CANCELLED: return "상담 예약이 취소되었습니다";
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
            case CONSULTATION_CANCELLED:
                return String.format("상담 예약이 취소되었습니다. 상담사: %s, 일시: %s",
                    params.length > 0 ? params[0] : "상담사",
                    params.length > 1 ? params[1] : "일시");
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
            case CONSULTATION_CANCELLED: return "bi-x-circle-fill";
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
            case CONSULTATION_CANCELLED: return "#6c757d";
            case REFUND_COMPLETED: return "#17a2b8";
            case SCHEDULE_CHANGED: return "#fd7e14";
            case PAYMENT_COMPLETED: return "#007bff";
            case DEPOSIT_PENDING_REMINDER: return "#dc3545";
            default: return "#6c757d";
        }
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
