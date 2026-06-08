package com.coresolution.consultation.repository.auth;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.auth.PhoneOtpAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * {@link PhoneOtpAttempt} 시도 추적 / 한도 검사 / 검증 조회용 Repository.
 *
 * <p>Apple SIWA 휴대폰 매칭 흐름에서 사용한다. 카카오/네이버 흐름은 본 Repository 를 사용하지 않는다.
 * 다른 OAuth provider 가 추후 동일 흐름을 채택하면 {@code provider} 컬럼으로 격리된다.</p>
 *
 * @author MindGarden
 * @since 2026-06-08
 */
@Repository
public interface PhoneOtpAttemptRepository extends JpaRepository<PhoneOtpAttempt, Long> {

    /**
     * 검증 흐름에서 challenge 토큰의 otp_id 로 단건 조회.
     *
     * <p>tenant_id + status=PENDING 추가 필터로 다른 테넌트의 row 노출을 차단한다.</p>
     *
     * @param id otp 행 PK
     * @param tenantId 멀티테넌트 격리
     * @return PENDING 상태 row 또는 empty
     */
    Optional<PhoneOtpAttempt> findByIdAndTenantIdAndStatus(Long id, String tenantId, String status);

    /**
     * 동일 (tenant, provider, providerUserId, phoneHash) 의 가장 최근 row — 재발송 쿨다운 검사용.
     */
    Optional<PhoneOtpAttempt> findFirstByTenantIdAndProviderAndProviderUserIdAndPhoneHashOrderByCreatedAtDesc(
        String tenantId, String provider, String providerUserId, String phoneHash);

    /**
     * 같은 (tenantId, provider, providerUserId) 의 오늘 발송된 row 수 — 일 5회 한도 검사용.
     *
     * @param fromInclusive 오늘 00:00 (KST) 등 자정의 LocalDateTime
     */
    long countByTenantIdAndProviderAndProviderUserIdAndCreatedAtGreaterThanEqual(
        String tenantId, String provider, String providerUserId, LocalDateTime fromInclusive);

    /**
     * 만료된 row 청소 cron 용 — status=PENDING 이면서 expires_at &lt; now 인 row.
     */
    List<PhoneOtpAttempt> findByStatusAndExpiresAtLessThan(String status, LocalDateTime threshold);
}
