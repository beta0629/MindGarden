package com.coresolution.consultation.service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.ConsultationRecord;

/**
 * 상담일지 목록의 내담자·상담사 표시명.
 *
 * <p>같은 테넌트의 미삭제 사용자만 한 번에 읽고, 이름은
 * {@link UserPersonalDataCacheService#getDecryptedUserData} 로 복호화한다.
 * 다른 테넌트·삭제·미존재 id 는 맵에 넣지 않는다. 이름이 없을 때의 화면 문구는
 * 서버에 두지 않고 프론트 locale {@code adminConsultationLogs.people.unknownName} 을 쓴다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-11
 */
public interface ConsultationRecordPersonNameResolver {

    /**
     * 사용자 PK 묶음의 표시명을 현재 테넌트에서 한 번에 조회한다.
     *
     * @param tenantId 현재 테넌트 ID. 비어 있으면 조회하지 않는다
     * @param userIds  내담자·상담사 users.id. null 원소는 무시한다
     * @return id → 복호화된 이름(없으면 로그인 id). 조회되지 않은 id 는 키 자체가 없다
     */
    Map<Long, String> resolveDisplayNames(String tenantId, Collection<Long> userIds);

    /**
     * 목록에 등장하는 내담자·상담사 id 를 모아 {@link #resolveDisplayNames} 를 한 번 호출한다.
     *
     * @param tenantId 현재 테넌트 ID
     * @param records  상담일지 목록. null 이면 빈 맵
     * @return id → 표시명
     */
    Map<Long, String> resolveForRecords(String tenantId, List<ConsultationRecord> records);

    /**
     * 불변 맵은 null 키 조회 시 예외를 던지므로, id 가 없을 때는 조회하지 않는다.
     *
     * @param names  표시명 인덱스
     * @param userId 사용자 PK
     * @return 표시명. 없으면 null
     */
    static String nameOrNull(Map<Long, String> names, Long userId) {
        if (names == null || userId == null) {
            return null;
        }
        return names.get(userId);
    }
}
