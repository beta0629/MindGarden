package com.coresolution.consultation.sct.service;

import java.time.Instant;
import java.util.Iterator;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import com.coresolution.consultation.sct.constant.SctConstants;
import org.springframework.stereotype.Service;

/**
 * 공개 verify 세션(메모리). Redis 도입 시 동일 계약으로 교체 가능.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Service
public class SctVerifySessionStore {

    private final ConcurrentHashMap<String, SessionEntry> store = new ConcurrentHashMap<>();

    /**
     * verify 세션 발급.
     *
     * @param invitationId 초대 ID
     * @param tenantId     테넌트
     * @return session id
     */
    public String issue(Long invitationId, String tenantId) {
        purgeExpired();
        String id = UUID.randomUUID().toString().replace("-", "");
        Instant expires = Instant.now().plusSeconds(SctConstants.VERIFY_SESSION_TTL_MINUTES * 60L);
        store.put(id, new SessionEntry(invitationId, tenantId, expires));
        return id;
    }

    /**
     * 세션 검증.
     *
     * @param sessionId    세션
     * @param invitationId 초대
     * @return 테넌트 ID
     */
    public Optional<String> validate(String sessionId, Long invitationId) {
        if (sessionId == null || invitationId == null) {
            return Optional.empty();
        }
        SessionEntry entry = store.get(sessionId);
        if (entry == null) {
            return Optional.empty();
        }
        if (entry.expiresAt().isBefore(Instant.now())) {
            store.remove(sessionId);
            return Optional.empty();
        }
        if (!invitationId.equals(entry.invitationId())) {
            return Optional.empty();
        }
        return Optional.of(entry.tenantId());
    }

    private void purgeExpired() {
        Instant now = Instant.now();
        Iterator<Map.Entry<String, SessionEntry>> it = store.entrySet().iterator();
        while (it.hasNext()) {
            if (it.next().getValue().expiresAt().isBefore(now)) {
                it.remove();
            }
        }
    }

    private record SessionEntry(Long invitationId, String tenantId, Instant expiresAt) {
    }
}
