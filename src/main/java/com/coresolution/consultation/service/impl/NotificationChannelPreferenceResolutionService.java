package com.coresolution.consultation.service.impl;

import java.util.ArrayList;
import java.util.List;
import com.coresolution.consultation.constant.NotificationChannelPreferenceCode;
import com.coresolution.consultation.constant.NotificationChannelTenantHintCode;
import com.coresolution.consultation.constant.NotificationPhysicalChannel;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.KakaoAlimTalkService;
import com.coresolution.consultation.service.NotificationService.NotificationPriority;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.service.TenantKakaoAlimtalkSettingsService;
import com.coresolution.consultation.service.TenantSmsSettingsService;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

/**
 * 알림 채널 선호·테넌트 가용성·발송 순서 결정(Phase1 공용).
 * <p>
 * 레거시 {@code User#notificationPreferences} 문자열은 {@code NotificationServiceImpl}의
 * legacy 메서드에서 처리하며, 본 서비스는 테넌트 인프라 게이트와 enum 선호만 다룬다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-04-24
 */
@Service
@RequiredArgsConstructor
public class NotificationChannelPreferenceResolutionService {

    private final KakaoAlimTalkService kakaoAlimTalkService;
    private final TenantKakaoAlimtalkSettingsService tenantKakaoAlimtalkSettingsService;
    private final TenantSmsSettingsService tenantSmsSettingsService;
    private final SmsAuthService smsAuthService;

    /**
     * 테넌트·전역 설정 기준 채널 인프라 가용성(사용자 레거시 동의와 무관).
     *
     * @param tenantId 테넌트 ID(null/빈 문자열이면 전역만)
     * @return 알림톡/SMS 각각 시도 가능한 인프라 여부
     */
    public TenantInfrastructureGates resolveTenantInfrastructure(String tenantId) {
        boolean kakaoInfra = kakaoAlimTalkService.isServiceAvailable();
        if (tenantId != null && !tenantId.isBlank()) {
            kakaoInfra = kakaoInfra && tenantKakaoAlimtalkSettingsService.isAlimTalkEnabledForTenant(tenantId);
        }
        boolean smsInfra = smsAuthService.isSmsAuthEnabled()
            && tenantSmsSettingsService.isSmsEnabledForTenant(
                tenantId == null || tenantId.isBlank() ? null : tenantId);
        return new TenantInfrastructureGates(kakaoInfra, smsInfra);
    }

    /**
     * 저장 요청값을 테넌트 가용성에 맞게 보정한다. 불가 조합은 {@link NotificationChannelPreferenceCode#TENANT_DEFAULT}.
     *
     * @param requested 클라이언트 입력
     * @param tenantId    테넌트 ID
     * @return DB 저장 문자열
     */
    public String normalizeIncomingPreference(String requested, String tenantId) {
        TenantInfrastructureGates gates = resolveTenantInfrastructure(tenantId);
        NotificationChannelPreferenceCode code = NotificationChannelPreferenceCode.fromStored(requested);
        if (code == NotificationChannelPreferenceCode.KAKAO && !gates.kakaoInfrastructureUp()) {
            return NotificationChannelPreferenceCode.TENANT_DEFAULT.name();
        }
        if (code == NotificationChannelPreferenceCode.SMS && !gates.smsInfrastructureUp()) {
            return NotificationChannelPreferenceCode.TENANT_DEFAULT.name();
        }
        return code.name();
    }

    /**
     * 프로필 API용: 테넌트 기본 힌트(HIGH 우선순위 1순위 채널) 및 UI 보정 필요 여부.
     *
     * @param user 사용자
     * @return 부가 필드 묶음
     */
    public NotificationChannelProfileSnapshot buildProfileSnapshot(User user) {
        String tenantId = user.getTenantId();
        TenantInfrastructureGates gates = resolveTenantInfrastructure(tenantId);
        NotificationChannelPreferenceCode stored = NotificationChannelPreferenceCode.fromStored(
            user.getNotificationChannelPreference());
        boolean uiAdjusted =
            (stored == NotificationChannelPreferenceCode.KAKAO && !gates.kakaoInfrastructureUp())
                || (stored == NotificationChannelPreferenceCode.SMS && !gates.smsInfrastructureUp());
        NotificationChannelTenantHintCode hint = resolveTenantDefaultHint(gates);
        return new NotificationChannelProfileSnapshot(
            user.getNotificationChannelPreference(),
            gates.kakaoInfrastructureUp(),
            gates.smsInfrastructureUp(),
            hint.name(),
            uiAdjusted
        );
    }

    /**
     * 사용자 레거시 동의·테넌트 인프라를 반영한 발송 시도 순서.
     *
     * @param preference       저장된 선호
     * @param priority         알림 우선순위
     * @param userMayUseKakao  레거시+사용자 조건으로 알림톡 시도 허용
     * @param userMayUseSms    레거시+사용자 조건으로 SMS 시도 허용
     * @param tenantId         테넌트 ID(null 가능)
     * @return 시도할 물리 채널 순서(0~2)
     */
    public List<NotificationPhysicalChannel> resolveDeliveryOrder(
        NotificationChannelPreferenceCode preference,
        NotificationPriority priority,
        boolean userMayUseKakao,
        boolean userMayUseSms,
        String tenantId) {
        TenantInfrastructureGates gates = resolveTenantInfrastructure(tenantId);
        boolean canKakao = gates.kakaoInfrastructureUp() && userMayUseKakao;
        boolean canSms = gates.smsInfrastructureUp() && userMayUseSms;

        NotificationChannelPreferenceCode pref = preference;
        if (pref == NotificationChannelPreferenceCode.KAKAO && !canKakao) {
            pref = NotificationChannelPreferenceCode.TENANT_DEFAULT;
        }
        if (pref == NotificationChannelPreferenceCode.SMS && !canSms) {
            pref = NotificationChannelPreferenceCode.TENANT_DEFAULT;
        }

        return switch (pref) {
            case KAKAO -> buildTwoStep(canKakao, canSms,
                NotificationPhysicalChannel.KAKAO, NotificationPhysicalChannel.SMS);
            case SMS -> buildTwoStep(canSms, canKakao,
                NotificationPhysicalChannel.SMS, NotificationPhysicalChannel.KAKAO);
            case TENANT_DEFAULT -> resolveTenantDefaultOrder(priority, canKakao, canSms);
        };
    }

    private static List<NotificationPhysicalChannel> resolveTenantDefaultOrder(
        NotificationPriority priority,
        boolean canKakao,
        boolean canSms) {
        if (priority == NotificationPriority.HIGH) {
            return buildTwoStep(canKakao, canSms,
                NotificationPhysicalChannel.KAKAO, NotificationPhysicalChannel.SMS);
        }
        if (priority == NotificationPriority.MEDIUM) {
            return buildTwoStep(canSms, canKakao,
                NotificationPhysicalChannel.SMS, NotificationPhysicalChannel.KAKAO);
        }
        return List.of();
    }

    private static List<NotificationPhysicalChannel> buildTwoStep(
        boolean firstGate,
        boolean secondGate,
        NotificationPhysicalChannel first,
        NotificationPhysicalChannel second) {
        List<NotificationPhysicalChannel> order = new ArrayList<>(2);
        if (firstGate) {
            order.add(first);
        }
        if (secondGate) {
            order.add(second);
        }
        return order;
    }

    private static NotificationChannelTenantHintCode resolveTenantDefaultHint(TenantInfrastructureGates gates) {
        if (!gates.kakaoInfrastructureUp() && !gates.smsInfrastructureUp()) {
            return NotificationChannelTenantHintCode.NONE;
        }
        if (gates.kakaoInfrastructureUp() && !gates.smsInfrastructureUp()) {
            return NotificationChannelTenantHintCode.KAKAO;
        }
        if (!gates.kakaoInfrastructureUp() && gates.smsInfrastructureUp()) {
            return NotificationChannelTenantHintCode.SMS;
        }
        return NotificationChannelTenantHintCode.KAKAO;
    }

    /**
     * 테넌트 인프라 게이트.
     *
     * @param kakaoInfrastructureUp 알림톡 인프라 사용 가능
     * @param smsInfrastructureUp   SMS 인프라 사용 가능
     */
    public record TenantInfrastructureGates(boolean kakaoInfrastructureUp, boolean smsInfrastructureUp) {
    }

    /**
     * 프로필 API에 실을 알림 채널 선호 부가 정보.
     *
     * @param notificationChannelPreference           DB 저장값
     * @param tenantNotificationChannelKakaoAvailable 테넌트 알림톡 인프라
     * @param tenantNotificationChannelSmsAvailable   테넌트 SMS 인프라
     * @param tenantDefaultNotificationChannelHint    HIGH 기준 1순위 힌트(KAKAO/SMS/NONE)
     * @param notificationChannelPreferenceUiAdjusted 저장값이 테넌트와 충돌해 UI에서 TENANT_DEFAULT로 안내할 때 true
     */
    public record NotificationChannelProfileSnapshot(
        String notificationChannelPreference,
        boolean tenantNotificationChannelKakaoAvailable,
        boolean tenantNotificationChannelSmsAvailable,
        String tenantDefaultNotificationChannelHint,
        boolean notificationChannelPreferenceUiAdjusted
    ) {
    }
}
