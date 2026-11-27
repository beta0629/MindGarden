package com.coresolution.consultation.sct.service.impl;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import com.coresolution.consultation.sct.service.SctIdentityOtpDevCodeStore;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * {@code @Profile("dev")} 한정 인메모리 OTP 코드 저장.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@Component
@Profile("dev")
public class SctIdentityOtpDevCodeStoreImpl implements SctIdentityOtpDevCodeStore {

    private final ConcurrentHashMap<String, String> codes = new ConcurrentHashMap<>();

    @Override
    public void remember(String tenantId, Long invitationId, String code) {
        if (tenantId == null || invitationId == null || code == null) {
            return;
        }
        codes.put(key(tenantId, invitationId), code);
    }

    @Override
    public Optional<String> peek(String tenantId, Long invitationId) {
        if (tenantId == null || invitationId == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(codes.get(key(tenantId, invitationId)));
    }

    private static String key(String tenantId, Long invitationId) {
        return tenantId + ":" + invitationId;
    }
}
