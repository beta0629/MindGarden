package com.coresolution.core.service.impl;
import com.coresolution.core.context.TenantContextHolder;

import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.service.ErdChangeNotificationService;
import com.coresolution.consultation.dto.EmailRequest;
import com.coresolution.consultation.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * ERD 변경 알림 서비스 구현체
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ErdChangeNotificationServiceImpl implements ErdChangeNotificationService {

    private final EmailService emailService;
    private final TenantRepository tenantRepository;

    /** 기본 false: ERD·스키마 변경 알림만 중단. 재개 시 erd.notification.enabled=true 또는 ERD_NOTIFICATION_ENABLED=true */
    @Value("${erd.notification.enabled:false}")
    private boolean notificationEnabled;

    @Value("${erd.notification.email.from:noreply@mindgarden.com}")
    private String fromEmail;

    @Value("${erd.notification.email.from-name:MindGarden 시스템}")
    private String fromName;

    @Override
    public void notifyErdChange(String tenantId, String diagramId, String changeDescription, Integer version) {
        if (!notificationEnabled) {
            log.debug("ERD 변경 알림이 비활성화되어 있습니다.");
            return;
        }

        log.info("📧 ERD 변경 알림 발송 시작: tenantId={}, diagramId={}, version={}", 
                tenantId, diagramId, version);

        try {
            if (tenantId != null) {
                // 테넌트별 ERD 변경 알림
                var tenant = tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId);
                if (tenant.isPresent() && tenant.get().getContactEmail() != null) {
                    sendTenantErdChangeNotification(
                            tenant.get().getContactEmail(),
                            tenant.get().getName(),
                            tenantId,
                            diagramId,
                            changeDescription,
                            version
                    );
                } else {
                    log.warn("⚠️ 테넌트를 찾을 수 없거나 이메일이 없습니다: tenantId={}", tenantId);
                }
            } else {
                // 전체 시스템 ERD 변경 알림 (관리자에게만)
                log.debug("전체 시스템 ERD 변경은 관리자에게만 알림 발송");
            }

        } catch (Exception e) {
            log.error("❌ ERD 변경 알림 발송 실패: tenantId={}, error={}", tenantId, e.getMessage(), e);
            // 알림 실패가 ERD 재생성을 막지 않도록 예외를 로깅만 하고 계속 진행
        }
    }

    @Override
    public int notifyErdChangeToTenants(List<String> tenantIds, String diagramId, 
                                       String changeDescription, Integer version) {
        if (!notificationEnabled) {
            log.debug("ERD 변경 알림이 비활성화되어 있습니다.");
            return 0;
        }

        log.info("📧 여러 테넌트에게 ERD 변경 알림 발송 시작: tenantCount={}, diagramId={}", 
                tenantIds.size(), diagramId);

        int successCount = 0;
        int failureCount = 0;

        for (String tenantId : tenantIds) {
            try {
                notifyErdChange(tenantId, diagramId, changeDescription, version);
                successCount++;
            } catch (Exception e) {
                failureCount++;
                log.error("❌ 테넌트 ERD 변경 알림 발송 실패: tenantId={}, error={}", 
                        tenantId, e.getMessage(), e);
            }
        }

        log.info("✅ ERD 변경 알림 발송 완료: 성공={}, 실패={}", successCount, failureCount);

        return successCount;
    }

    @Override
    public void notifySchemaChange(String tenantId, List<String> changedTableNames) {
        if (!notificationEnabled) {
            log.debug("ERD 변경 알림이 비활성화되어 있습니다.");
            return;
        }

        log.info("📧 스키마 변경 알림 발송 시작: tenantId={}, changedTables={}", 
                tenantId, changedTableNames);

        try {
            var tenant = tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId);
            if (tenant.isPresent() && tenant.get().getContactEmail() != null) {
                sendSchemaChangeNotification(
                        tenant.get().getContactEmail(),
                        tenant.get().getName(),
                        tenantId,
                        changedTableNames
                );
            } else {
                log.warn("⚠️ 테넌트를 찾을 수 없거나 이메일이 없습니다: tenantId={}", tenantId);
            }

        } catch (Exception e) {
            log.error("❌ 스키마 변경 알림 발송 실패: tenantId={}, error={}", tenantId, e.getMessage(), e);
        }
    }

    /**
     * 테넌트 ERD 변경 알림 발송
     */
    private void sendTenantErdChangeNotification(String toEmail, String toName, String tenantId,
                                                  String diagramId, String changeDescription, Integer version) {
        String subject = "[MindGarden] ERD 변경 알림";
        String content = buildErdChangeEmailContent(toName, tenantId, diagramId, changeDescription, version);

        EmailRequest emailRequest = EmailRequest.builder()
                .toEmail(toEmail)
                .toName(toName)
                .fromEmail(fromEmail)
                .fromName(fromName)
                .subject(subject)
                .content(content)
                .type("HTML")
                .priority("NORMAL")
                .build();

        emailService.sendEmail(emailRequest);
        log.info("✅ ERD 변경 알림 발송 완료: tenantId={}, email={}", tenantId, toEmail);
    }

    /**
     * 스키마 변경 알림 발송
     */
    private void sendSchemaChangeNotification(String toEmail, String toName, String tenantId,
                                             List<String> changedTableNames) {
        String subject = "[MindGarden] 데이터베이스 스키마 변경 알림";
        String content = buildSchemaChangeEmailContent(toName, tenantId, changedTableNames);

        EmailRequest emailRequest = EmailRequest.builder()
                .toEmail(toEmail)
                .toName(toName)
                .fromEmail(fromEmail)
                .fromName(fromName)
                .subject(subject)
                .content(content)
                .type("HTML")
                .priority("NORMAL")
                .build();

        emailService.sendEmail(emailRequest);
        log.info("✅ 스키마 변경 알림 발송 완료: tenantId={}, email={}", tenantId, toEmail);
    }

    /**
     * ERD 변경 이메일 내용 생성
     */
    private String buildErdChangeEmailContent(String toName, String tenantId, String diagramId,
                                             String changeDescription, Integer version) {
        return String.format("""
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #2c3e50;">ERD 변경 알림</h2>
                        <p>안녕하세요, %s님</p>
                        <p>귀하의 데이터베이스 ERD가 업데이트되었습니다.</p>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p><strong>테넌트 ID:</strong> %s</p>
                            <p><strong>ERD ID:</strong> %s</p>
                            <p><strong>버전:</strong> %d</p>
                            <p><strong>변경 사항:</strong> %s</p>
                        </div>
                        <p>새로운 ERD를 확인하시려면 테넌트 포털에 로그인하여 ERD 페이지를 방문해주세요.</p>
                        <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
                            이 메일은 자동으로 발송된 알림입니다. 문의사항이 있으시면 고객지원팀에 연락해주세요.
                        </p>
                    </div>
                </body>
                </html>
                """, toName, tenantId, diagramId, version, changeDescription);
    }

    /**
     * 스키마 변경 이메일 내용 생성
     */
    private String buildSchemaChangeEmailContent(String toName, String tenantId, List<String> changedTableNames) {
        String tableList = changedTableNames != null && !changedTableNames.isEmpty() 
                ? String.join(", ", changedTableNames) 
                : "전체 스키마";

        return String.format("""
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #2c3e50;">데이터베이스 스키마 변경 알림</h2>
                        <p>안녕하세요, %s님</p>
                        <p>데이터베이스 스키마가 변경되어 ERD가 자동으로 업데이트되었습니다.</p>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p><strong>테넌트 ID:</strong> %s</p>
                            <p><strong>변경된 테이블:</strong> %s</p>
                        </div>
                        <p>업데이트된 ERD를 확인하시려면 테넌트 포털에 로그인하여 ERD 페이지를 방문해주세요.</p>
                        <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
                            이 메일은 자동으로 발송된 알림입니다. 문의사항이 있으시면 고객지원팀에 연락해주세요.
                        </p>
                    </div>
                </body>
                </html>
                """, toName, tenantId, tableList);
    }
}

