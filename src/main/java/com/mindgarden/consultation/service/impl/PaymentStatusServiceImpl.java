package com.mindgarden.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.dto.PaymentStatusResponse;
import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.entity.Payment;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.PaymentRepository;
import com.mindgarden.consultation.service.CommonCodeService;
import com.mindgarden.consultation.service.PaymentGatewayService;
import com.mindgarden.consultation.service.PaymentStatusService;
import com.mindgarden.consultation.service.UserService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 결제 상태 관리 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentStatusServiceImpl implements PaymentStatusService {
    
    private final PaymentRepository paymentRepository;
    
    @Qualifier("tossPaymentService")
    private final PaymentGatewayService paymentGatewayService;
    
    private final UserService userService;
    private final CommonCodeService commonCodeService;
    
    @Override
    @Transactional(readOnly = true)
    public PaymentStatusResponse checkPaymentStatus(String paymentId) {
        log.info("결제 상태 확인: {}", paymentId);
        
        try {
            // 데이터베이스에서 결제 정보 조회
            Optional<Payment> paymentOpt = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentId);
            if (paymentOpt.isEmpty()) {
                throw new RuntimeException("결제 정보를 찾을 수 없습니다: " + paymentId);
            }
            
            Payment payment = paymentOpt.get();
            
            // 외부 결제 시스템에서 최신 상태 확인
            PaymentStatusResponse externalStatus = paymentGatewayService.getPaymentStatus(paymentId);
            
            // 상태가 변경되었으면 업데이트
            if (!payment.getStatus().toString().equals(externalStatus.getStatus())) {
                Payment.PaymentStatus newStatus = Payment.PaymentStatus.valueOf(externalStatus.getStatus());
                updatePaymentStatus(paymentId, newStatus);
                
                // 상태 변경 알림 전송
                sendPaymentNotification(paymentId, externalStatus.getStatus());
            }
            
            return externalStatus;
            
        } catch (Exception e) {
            log.error("결제 상태 확인 실패: {}", e.getMessage(), e);
            throw new RuntimeException("결제 상태 확인에 실패했습니다.", e);
        }
    }
    
    @Override
    @Transactional
    public boolean updatePaymentStatus(String paymentId, Payment.PaymentStatus newStatus) {
        log.info("결제 상태 업데이트: {} -> {}", paymentId, newStatus);
        
        try {
            Optional<Payment> paymentOpt = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentId);
            if (paymentOpt.isEmpty()) {
                log.warn("결제 정보를 찾을 수 없습니다: {}", paymentId);
                return false;
            }
            
            Payment payment = paymentOpt.get();
            Payment.PaymentStatus oldStatus = payment.getStatus();
            
            // 상태 업데이트
            payment.setStatus(newStatus);
            payment.setUpdatedAt(LocalDateTime.now());
            
            // 상태별 추가 처리
            switch (newStatus) {
                case APPROVED:
                    payment.setApprovedAt(LocalDateTime.now());
                    break;
                case CANCELLED:
                    payment.setCancelledAt(LocalDateTime.now());
                    break;
                case FAILED:
                    payment.setFailedAt(LocalDateTime.now());
                    break;
                case REFUNDED:
                    payment.setRefundedAt(LocalDateTime.now());
                    break;
                case PENDING:
                case PROCESSING:
                case EXPIRED:
                    // 추가 처리 없음
                    break;
            }
            
            paymentRepository.save(payment);
            
            log.info("결제 상태 업데이트 완료: {} ({} -> {})", paymentId, oldStatus, newStatus);
            return true;
            
        } catch (Exception e) {
            log.error("결제 상태 업데이트 실패: {}", e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    @Transactional
    public boolean syncPaymentStatus(String paymentId) {
        log.info("결제 상태 동기화: {}", paymentId);
        
        try {
            // 외부 시스템에서 상태 조회
            PaymentStatusResponse externalStatus = paymentGatewayService.getPaymentStatus(paymentId);
            
            // 내부 데이터베이스 상태와 비교하여 동기화
            return updatePaymentStatus(paymentId, Payment.PaymentStatus.valueOf(externalStatus.getStatus()));
            
        } catch (Exception e) {
            log.error("결제 상태 동기화 실패: {}", e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    @Transactional
    @Scheduled(fixedRate = 300000) // 5분마다 실행
    public int processExpiredPayments() {
        log.info("만료된 결제 처리 시작");
        
        try {
            // 30분 이상 PENDING 상태인 결제들 조회
            LocalDateTime expiredTime = LocalDateTime.now().minusMinutes(30);
            List<Payment> expiredPayments = paymentRepository.findExpiredPayments(expiredTime);
            
            int processedCount = 0;
            for (Payment payment : expiredPayments) {
                try {
                    // 외부 시스템에서 상태 확인
                    PaymentStatusResponse externalStatus = paymentGatewayService.getPaymentStatus(payment.getPaymentId());
                    
                    if ("PENDING".equals(externalStatus.getStatus())) {
                        // 여전히 PENDING이면 만료 처리
                        updatePaymentStatus(payment.getPaymentId(), Payment.PaymentStatus.EXPIRED);
                        sendPaymentNotification(payment.getPaymentId(), "EXPIRED");
                        processedCount++;
                    } else {
                        // 상태가 변경되었으면 업데이트
                        updatePaymentStatus(payment.getPaymentId(), Payment.PaymentStatus.valueOf(externalStatus.getStatus()));
                        processedCount++;
                    }
                    
                } catch (Exception e) {
                    log.error("만료된 결제 처리 실패: {}", payment.getPaymentId(), e);
                }
            }
            
            log.info("만료된 결제 처리 완료: {}개 처리됨", processedCount);
            return processedCount;
            
        } catch (Exception e) {
            log.error("만료된 결제 처리 중 오류 발생: {}", e.getMessage(), e);
            return 0;
        }
    }
    
    @Override
    public boolean sendPaymentNotification(String paymentId, String status) {
        log.info("결제 상태 알림 전송: {} - {}", paymentId, status);
        
        try {
            // 실제 구현에서는 이메일, SMS, 푸시 알림 등을 전송
            // 여기서는 로그로 대체
            log.info("결제 상태 알림: 결제ID={}, 상태={}", paymentId, status);
            
            // 실제 알림 시스템 연동
            Optional<Payment> paymentOpt = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentId);
            if (paymentOpt.isPresent()) {
                sendPaymentNotification(paymentOpt.get(), Payment.PaymentStatus.valueOf(status));
            }
            
            return true;
            
        } catch (Exception e) {
            log.error("결제 상태 알림 전송 실패: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * 결제 상태 알림 전송
     * 
     * @param payment 결제 정보
     * @param status 결제 상태
     */
    private void sendPaymentNotification(Payment payment, Payment.PaymentStatus status) {
        try {
            log.info("🔔 결제 알림 전송 시작 - 결제 ID: {}, 상태: {}", payment.getId(), status);
            
            // 사용자 정보 조회 (orderId를 통해 사용자 찾기)
            // TODO: Payment 엔티티에 userId 필드가 없으므로 orderId를 통해 사용자 조회하거나 Payment 엔티티 수정 필요
            User user = null; // 임시로 null 처리
            if (user == null) {
                log.warn("결제 알림 전송 실패 - 사용자 정보 없음: {}", payment.getOrderId());
                // TODO: Payment 엔티티에 userId 필드 추가 후 실제 알림 로직 구현
                log.info("📝 결제 알림 로직 준비 완료 - Payment 엔티티 수정 후 활성화 예정");
                return;
            }
            
            // TODO: Payment 엔티티에 userId 필드 추가 후 아래 로직 활성화
            /*
            // 알림 메시지 생성
            String message = createPaymentNotificationMessage(payment, status);
            String title = "결제 상태 알림";
            
            // 이메일 알림 (사용자가 이메일 알림을 허용한 경우)
            if (user.getEmailNotification() != null && user.getEmailNotification()) {
                sendEmailNotification(user.getEmail(), title, message);
            }
            
            // SMS 알림 (사용자가 SMS 알림을 허용한 경우)
            if (user.getSmsNotification() != null && user.getSmsNotification() && user.getPhone() != null) {
                sendSmsNotification(user.getPhone(), message);
            }
            
            // 푸시 알림 (사용자가 푸시 알림을 허용한 경우)
            if (user.getPushNotification() != null && user.getPushNotification()) {
                sendPushNotification(user.getId(), title, message);
            }
            
            // 웹소켓 실시간 알림
            sendWebSocketNotification(user.getId(), title, message);
            
            log.info("✅ 결제 알림 전송 완료 - 사용자: {}, 알림 수신: 이메일={}, SMS={}, 푸시={}", 
                    user.getEmail(), 
                    user.getEmailNotification(), 
                    user.getSmsNotification(), 
                    user.getPushNotification());
            */
            
        } catch (Exception e) {
            log.error("❌ 결제 알림 전송 중 오류 발생: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 결제 알림 메시지 생성 (공통 코드 사용)
     */
    private String createPaymentNotificationMessage(Payment payment, Payment.PaymentStatus status) {
        StringBuilder message = new StringBuilder();
        message.append("결제 상태가 변경되었습니다.\n\n");
        message.append("결제 금액: ").append(payment.getAmount()).append("원\n");
        
        try {
            // 결제 방법을 공통 코드에서 조회
            String paymentMethodLabel = commonCodeService.getCodeName("PAYMENT_METHOD", payment.getMethod().name());
            message.append("결제 방법: ").append(paymentMethodLabel).append("\n");
            
            // 결제 상태를 공통 코드에서 조회
            String statusLabel = commonCodeService.getCodeName("PAYMENT_STATUS", status.name());
            CommonCode statusCode = commonCodeService.getCommonCodeByGroupAndValue("PAYMENT_STATUS", status.name());
            
            // extraData에서 아이콘 정보 추출
            String icon = "📄"; // 기본 아이콘
            if (statusCode != null && statusCode.getExtraData() != null) {
                // JSON 파싱하여 아이콘 정보 추출 (간단한 방법)
                if (statusCode.getExtraData().contains("bi-check-circle")) {
                    icon = "✅";
                } else if (statusCode.getExtraData().contains("bi-x-circle")) {
                    icon = "❌";
                } else if (statusCode.getExtraData().contains("bi-dash-circle")) {
                    icon = "⚠️";
                } else if (statusCode.getExtraData().contains("bi-arrow-counterclockwise")) {
                    icon = "💰";
                } else if (statusCode.getExtraData().contains("bi-clock")) {
                    icon = "⏳";
                } else if (statusCode.getExtraData().contains("bi-arrow-repeat")) {
                    icon = "🔄";
                } else if (statusCode.getExtraData().contains("bi-clock-history")) {
                    icon = "⏰";
                }
            }
            
            message.append("상태: ").append(statusLabel).append(" ").append(icon).append("\n");
            
            // 상태별 메시지 (공통 코드 설명 사용)
            if (statusCode != null && statusCode.getCodeDescription() != null) {
                message.append(statusCode.getCodeDescription());
            } else {
                // 기본 메시지
                switch (status) {
                    case APPROVED:
                        message.append("결제가 성공적으로 승인되었습니다.");
                        break;
                    case FAILED:
                        message.append("결제 처리 중 오류가 발생했습니다.");
                        break;
                    case CANCELLED:
                        message.append("결제가 취소되었습니다.");
                        break;
                    case REFUNDED:
                        message.append("결제 금액이 환불되었습니다.");
                        break;
                    case PENDING:
                        message.append("결제 처리를 기다리고 있습니다.");
                        break;
                    case PROCESSING:
                        message.append("결제가 처리 중입니다.");
                        break;
                    case EXPIRED:
                        message.append("결제 시간이 만료되었습니다.");
                        break;
                    default:
                        message.append("결제 상태가 변경되었습니다.");
                        break;
                }
            }
            
        } catch (Exception e) {
            log.warn("공통 코드 조회 실패, 기본값 사용: {}", e.getMessage());
            message.append("결제 방법: ").append(payment.getMethod()).append("\n");
            message.append("상태: ").append(status).append("\n");
        }
        
        message.append("\n\n문의사항이 있으시면 고객센터로 연락해주세요.");
        return message.toString();
    }
    
    /**
     * 이메일 알림 전송
     */
    private void sendEmailNotification(String email, String title, String message) {
        try {
            // TODO: 실제 이메일 서비스 연동 (예: JavaMail, SendGrid, AWS SES 등)
            log.info("📧 이메일 알림 전송 - 수신자: {}, 제목: {}", email, title);
            // 실제 구현에서는 이메일 서비스를 호출
        } catch (Exception e) {
            log.error("이메일 알림 전송 실패: {}", e.getMessage(), e);
        }
    }
    
    /**
     * SMS 알림 전송
     */
    private void sendSmsNotification(String phoneNumber, String message) {
        try {
            // TODO: 실제 SMS 서비스 연동 (예: NHN Cloud, Twilio, Aligo 등)
            log.info("📱 SMS 알림 전송 - 수신자: {}", phoneNumber);
            // 실제 구현에서는 SMS 서비스를 호출
        } catch (Exception e) {
            log.error("SMS 알림 전송 실패: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 푸시 알림 전송
     */
    private void sendPushNotification(Long userId, String title, String message) {
        try {
            // TODO: 실제 푸시 알림 서비스 연동 (예: FCM, APNs 등)
            log.info("🔔 푸시 알림 전송 - 사용자 ID: {}, 제목: {}", userId, title);
            // 실제 구현에서는 푸시 알림 서비스를 호출
        } catch (Exception e) {
            log.error("푸시 알림 전송 실패: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 웹소켓 실시간 알림
     */
    private void sendWebSocketNotification(Long userId, String title, String message) {
        try {
            // TODO: 실제 웹소켓 서비스 연동 (예: STOMP, Socket.IO 등)
            log.info("🌐 웹소켓 알림 전송 - 사용자 ID: {}, 제목: {}", userId, title);
            // 실제 구현에서는 웹소켓을 통해 실시간 알림 전송
        } catch (Exception e) {
            log.error("웹소켓 알림 전송 실패: {}", e.getMessage(), e);
        }
    }
}
