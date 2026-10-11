package com.coresolution.consultation.service.impl;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ConsultationRecordPersonNameResolver;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link ConsultationRecordPersonNameResolver} 구현.
 *
 * <p>{@code ConsultantRecordsController} 가 행마다 호출하던 이름 조회를 여기로 옮겼다.
 * 미삭제·현재 테넌트 조건은 {@link UserRepository#findByTenantIdAndIdInAndIsDeletedFalse} 한 번으로
 * 맞추고, 복호화는 기존 캐시 서비스를 재사용한다. 삭제된 사용자는 단건
 * {@code findByTenantIdAndId} 와 같이 결과에 포함하지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-11
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConsultationRecordPersonNameResolverImpl implements ConsultationRecordPersonNameResolver {

    private final UserRepository userRepository;
    private final UserPersonalDataCacheService userPersonalDataCacheService;

    @Override
    public Map<Long, String> resolveDisplayNames(String tenantId, Collection<Long> userIds) {
        if (tenantId == null || tenantId.isBlank() || userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        Set<Long> distinctIds = new LinkedHashSet<>();
        for (Long userId : userIds) {
            if (userId != null) {
                distinctIds.add(userId);
            }
        }
        if (distinctIds.isEmpty()) {
            return Map.of();
        }
        List<User> users = userRepository.findByTenantIdAndIdInAndIsDeletedFalse(tenantId.trim(), distinctIds);
        Map<Long, String> names = new LinkedHashMap<>();
        for (User user : users) {
            if (user == null || user.getId() == null) {
                continue;
            }
            String displayName = displayNameOf(user);
            if (displayName != null) {
                names.put(user.getId(), displayName);
            }
        }
        return names;
    }

    @Override
    public Map<Long, String> resolveForRecords(String tenantId, List<ConsultationRecord> records) {
        if (records == null || records.isEmpty()) {
            return Map.of();
        }
        Set<Long> ids = new LinkedHashSet<>();
        for (ConsultationRecord record : records) {
            if (record == null) {
                continue;
            }
            if (record.getClientId() != null) {
                ids.add(record.getClientId());
            }
            if (record.getConsultantId() != null) {
                ids.add(record.getConsultantId());
            }
        }
        return resolveDisplayNames(tenantId, ids);
    }

    /**
     * 복호화된 이름, 없으면 로그인 id. 둘 다 없으면 null (화면 locale 폴백).
     *
     * @param user 같은 테넌트의 미삭제 사용자
     * @return 표시명. 없으면 null
     */
    private String displayNameOf(User user) {
        try {
            Map<String, String> decrypted = userPersonalDataCacheService.getDecryptedUserData(user);
            String name = decrypted != null ? decrypted.get("name") : null;
            if (name != null && !name.isBlank()) {
                return name.trim();
            }
        } catch (Exception ex) {
            log.warn("상담일지 목록 이름 복호화 실패: userId={}, error={}", user.getId(), ex.getMessage());
        }
        String loginId = user.getUserId();
        if (loginId != null && !loginId.isBlank()) {
            return loginId.trim();
        }
        return null;
    }
}
