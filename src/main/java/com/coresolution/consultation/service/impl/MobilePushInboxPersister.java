package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.MobilePushNotificationCategory;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.SystemNotification;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.SystemNotificationRepository;
import com.coresolution.consultation.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Expo 푸시 발송 시 사용자 단위 알림 인박스({@code system_notifications}) 영속화 헬퍼.
 *
 * <p>OS 푸시는 도착하지만 앱/웹의 알림 센터는 비어 있는 갭을 해소한다.
 * Expo 발송 트랜잭션과 분리({@link Propagation#REQUIRES_NEW})하여 푸시 발송 트랜잭션의
 * 상태와 무관하게 인박스 row 가 커밋되도록 한다. persist 실패는 푸시 발송을 막지 않는다.
 *
 * <p>현재 구조의 한계(Phase 1):
 * <ul>
 *   <li>{@link SystemNotification} 은 본질적으로 공지 모델이라 사용자 단일 row 매핑이 아닌
 *       {@code targetType} 기반 broadcast 시맨틱을 갖는다.</li>
 *   <li>본 헬퍼는 수신자 단일 역할({@code CLIENT} / {@code CONSULTANT} / {@code ALL})을
 *       {@code targetType} 에 저장해 sender 자신만 알림센터에서 row 를 보도록 한다.
 *       다만 동일 역할의 다른 사용자가 같은 row 를 노출받는 한계가 있으며,
 *       per-recipient 격리는 별도 매핑 테이블 추가(Phase 2)에서 해결한다.</li>
 *   <li>{@code linkUrl} 등 deep-link 컬럼은 현재 {@link SystemNotification} 스키마에 없어
 *       Phase 1 에서는 저장하지 않는다(Phase 2 에서 컬럼 추가 후 적재).</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-26
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MobilePushInboxPersister {

    /** 어드민 발송자 ID 미상 — {@code author_id} NOT NULL 충족용 sentinel. */
    static final Long SYSTEM_AUTHOR_ID = 0L;

    /** {@code author_name} 표시 — 백엔드 자동 발화임을 알림센터에서 식별 가능하게. */
    static final String SYSTEM_AUTHOR_NAME = "system";

    /** 사용자 역할 조회 실패 시 fallback target — 알림 센터 SSOT 조회에서 누락되지 않도록 ALL 사용. */
    static final String FALLBACK_TARGET_TYPE = "ALL";

    /** 전문가(상담사 계열) 공통 targetType — {@code SystemNotificationServiceImpl} 매핑과 일치. */
    static final String CONSULTANT_TARGET_TYPE = UserRole.CONSULTANT.name();

    /** 내담자 targetType. */
    static final String CLIENT_TARGET_TYPE = UserRole.CLIENT.name();

    private final SystemNotificationRepository systemNotificationRepository;
    private final UserRepository userRepository;

    /**
     * Expo 푸시 발송 1건(수신자 1명) 에 대응하는 알림 센터 row 를 저장한다.
     *
     * <p>호출자(예: {@code MobilePushDispatchServiceImpl}) 의 트랜잭션 상태와 무관하게
     * 별도 트랜잭션({@link Propagation#REQUIRES_NEW})에서 커밋된다. 예외는 호출자로
     * 전파하지 않고 warn 로그만 남긴다.
     *
     * @param tenantId      테넌트 ID. 빈 값이면 skip.
     * @param userId        수신자 PK. null 이면 skip.
     * @param canonicalType {@link com.coresolution.consultation.constant.MobilePushCanonicalTypes} 코드.
     * @param title         알림 제목(이미 절단된 값). 빈 값이면 skip.
     * @param body          알림 본문(이미 절단된 값). null 가능.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void persistForRecipient(
            String tenantId,
            Long userId,
            String canonicalType,
            String title,
            String body) {
        if (tenantId == null || tenantId.isBlank()) {
            log.debug("알림 인박스 persist skip: tenantId 없음 type={} userId={}", canonicalType, userId);
            return;
        }
        if (userId == null) {
            log.debug("알림 인박스 persist skip: userId 없음 type={} tenantId={}", canonicalType, tenantId);
            return;
        }
        if (title == null || title.isBlank()) {
            log.debug("알림 인박스 persist skip: title 없음 type={} tenantId={} userId={}",
                    canonicalType, tenantId, userId);
            return;
        }
        try {
            String targetType = resolveTargetType(tenantId, userId);
            String notificationType = resolveNotificationType(canonicalType);

            SystemNotification notification = new SystemNotification();
            notification.setTenantId(tenantId);
            notification.setTargetType(targetType);
            notification.setTitle(title);
            notification.setContent(body != null ? body : "");
            notification.setNotificationType(notificationType);
            notification.setStatus("PUBLISHED");
            notification.setPublishedAt(LocalDateTime.now());
            notification.setAuthorId(SYSTEM_AUTHOR_ID);
            notification.setAuthorName(SYSTEM_AUTHOR_NAME);
            notification.setIsDeleted(false);
            notification.setIsImportant(false);
            notification.setIsUrgent(false);
            notification.setViewCount(0);

            systemNotificationRepository.save(notification);
            log.debug("알림 인박스 persist 완료: tenantId={} userId={} type={} target={}",
                    tenantId, userId, canonicalType, targetType);
        } catch (Exception e) {
            // 인박스 적재 실패가 푸시 발송 흐름을 막지 않도록 swallow.
            log.warn("알림 인박스 persist 실패(무시): tenantId={} userId={} type={} reason={}",
                    tenantId, userId, canonicalType, e.getMessage());
        }
    }

    /**
     * 수신자 단일 역할을 {@code SystemNotification.targetType} 으로 매핑한다.
     * {@code SystemNotificationServiceImpl.getTargetTypesForUser} 와 정합하여
     * 동일 사용자 조회 시 누락되지 않도록 한다.
     *
     * @param tenantId 테넌트 ID
     * @param userId   수신자 PK
     * @return targetType 문자열
     */
    private String resolveTargetType(String tenantId, Long userId) {
        try {
            Optional<User> userOpt = userRepository.findByTenantIdAndId(tenantId, userId);
            if (userOpt.isEmpty()) {
                return FALLBACK_TARGET_TYPE;
            }
            UserRole role = userOpt.get().getRole();
            if (role == null) {
                return FALLBACK_TARGET_TYPE;
            }
            if (role.isClient()) {
                return CLIENT_TARGET_TYPE;
            }
            if (role.isProfessionalProvider()) {
                // SystemNotificationServiceImpl#getTargetTypesForUser 가 전문가 그룹을 CONSULTANT 로 본다.
                return CONSULTANT_TARGET_TYPE;
            }
            // ADMIN·STAFF — 알림 센터에서 ALL 공지만 노출되므로 ALL 로 저장.
            return FALLBACK_TARGET_TYPE;
        } catch (Exception e) {
            log.debug("targetType 해석 실패 — ALL fallback: tenantId={} userId={} reason={}",
                    tenantId, userId, e.getMessage());
            return FALLBACK_TARGET_TYPE;
        }
    }

    /**
     * canonical 푸시 type 을 알림 카테고리(enum name) 로 매핑한다.
     * Expo 앱 훅({@code useNotifications.ts} 의 {@code mapNotificationType}) 이
     * "PAY" / "MESSAGE" / "WELLNESS" / "SCHEDULE" / "SYSTEM" 키워드를 포함 검사하므로
     * {@link MobilePushNotificationCategory#name()} 을 그대로 저장하면 카테고리가 일치한다.
     *
     * @param canonicalType canonical 푸시 type
     * @return SystemNotification.notification_type 값
     */
    private String resolveNotificationType(String canonicalType) {
        return MobilePushNotificationCategory.forCanonicalType(canonicalType).name();
    }
}
