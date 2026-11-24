package com.coresolution.consultation.sct.service;

import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.sct.entity.SctInvitation;
import org.springframework.security.access.AccessDeniedException;

/**
 * 임상 접근 거부 + {@code SCT_CLINICAL_ACCESS_DENIED} 감사 단일 헬퍼.
 *
 * <p>주입된 {@link SctClinicalAccessDeniedAuditWriter} 프록시를 통해 {@code record} 를 호출한 뒤
 * {@link AccessDeniedException} 을 던져, REQUIRES_NEW 커밋이 롤백되지 않게 한다.</p>
 *
 * @author MindGarden
 * @since 2026-11-24
 */
public final class SctClinicalAccessDenySupport {

    private SctClinicalAccessDenySupport() {
    }

    /**
     * 감사 적재 후 접근 거부.
     *
     * @param writer           REQUIRES_NEW 감사 writer(주입 프록시)
     * @param tenantId         테넌트
     * @param actor            행위자
     * @param invitation       대상 초대(없으면 null)
     * @param clientIdFallback 초대 null 일 때 clientId
     * @param message          거부 메시지
     */
    public static void denyAndThrow(
            SctClinicalAccessDeniedAuditWriter writer,
            String tenantId,
            User actor,
            SctInvitation invitation,
            Long clientIdFallback,
            String message) {
        if (invitation != null) {
            writer.record(tenantId, actor, invitation);
        } else {
            writer.record(tenantId, actor, null, clientIdFallback);
        }
        throw new AccessDeniedException(message);
    }
}
