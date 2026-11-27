package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.entity.ConsultantClientMapping;

/**
 * 매핑 회기 수 불변식 {@code totalSessions == usedSessions + remainingSessions} SSOT.
 *
 * <p>null 은 0 으로 취급한다. 위반·불가능 입력은 {@link IllegalArgumentException}(HTTP 400).</p>
 *
 * <ul>
 *   <li>잔여 회기 명시 정정: remaining 이 SSOT → {@code used = total - remaining}</li>
 *   <li>총 회기만 변경: used 고정 → {@code remaining = total - used}</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-11-26
 */
public final class MappingSessionCountInvariant {

    private MappingSessionCountInvariant() {
    }

    /**
     * null 을 0 으로 취급.
     *
     * @param value 회기 수 (null 허용)
     * @return 0 또는 원값
     */
    public static int nullToZero(Integer value) {
        return value == null ? 0 : value;
    }

    /**
     * 불변식 검증. 위반 시 {@link IllegalArgumentException}.
     *
     * @param total     총 회기
     * @param used      사용 회기
     * @param remaining 잔여 회기
     * @throws IllegalArgumentException 음수이거나 total != used + remaining
     */
    public static void assertInvariant(Integer total, Integer used, Integer remaining) {
        assertInvariant(null, total, used, remaining);
    }

    /**
     * 불변식 검증 (mappingId 포함 메시지).
     *
     * @param mappingId 매핑 ID (null 이면 ID 없는 메시지)
     * @param total     총 회기
     * @param used      사용 회기
     * @param remaining 잔여 회기
     * @throws IllegalArgumentException 음수이거나 total != used + remaining
     */
    public static void assertInvariant(Long mappingId, Integer total, Integer used, Integer remaining) {
        int totalValue = nullToZero(total);
        int usedValue = nullToZero(used);
        int remainingValue = nullToZero(remaining);

        if (totalValue < 0 || usedValue < 0 || remainingValue < 0) {
            throw new IllegalArgumentException(String.format(
                    AdminServiceUserFacingMessages.MSG_MAPPING_SESSION_COUNT_NEGATIVE_FMT,
                    totalValue, usedValue, remainingValue));
        }
        if (totalValue != usedValue + remainingValue) {
            if (mappingId != null) {
                throw new IllegalArgumentException(String.format(
                        AdminServiceUserFacingMessages.MSG_MAPPING_SESSION_COUNT_MISMATCH_WITH_ID_FMT,
                        mappingId, totalValue, usedValue, remainingValue));
            }
            throw new IllegalArgumentException(String.format(
                    AdminServiceUserFacingMessages.MSG_MAPPING_SESSION_COUNT_MISMATCH_FMT,
                    totalValue, usedValue, remainingValue));
        }
    }

    /**
     * 매핑 엔티티 회기 불변식 검증.
     *
     * @param mapping 검증 대상 (null 이면 NPE 방지용 IllegalArgumentException)
     * @throws IllegalArgumentException 불변식 위반
     */
    public static void assertInvariant(ConsultantClientMapping mapping) {
        if (mapping == null) {
            throw new IllegalArgumentException(String.format(
                    AdminServiceUserFacingMessages.MSG_MAPPING_SESSION_COUNT_MISMATCH_FMT, 0, 0, 0));
        }
        assertInvariant(
                mapping.getId(),
                mapping.getTotalSessions(),
                mapping.getUsedSessions(),
                mapping.getRemainingSessions());
    }

    /**
     * 잔여 회기 SSOT — {@code used = total - remaining}.
     *
     * @param total     총 회기
     * @param remaining 잔여 회기
     * @return 파생된 사용 회기
     * @throws IllegalArgumentException remaining &lt; 0, remaining &gt; total, total &lt; 0
     */
    public static int deriveUsedFromTotalAndRemaining(Integer total, Integer remaining) {
        int totalValue = nullToZero(total);
        int remainingValue = nullToZero(remaining);
        if (totalValue < 0) {
            throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_MAPPING_TOTAL_SESSIONS_NEGATIVE);
        }
        if (remainingValue < 0) {
            throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_MAPPING_REMAINING_SESSIONS_NEGATIVE);
        }
        if (remainingValue > totalValue) {
            throw new IllegalArgumentException(String.format(
                    AdminServiceUserFacingMessages.MSG_MAPPING_REMAINING_SESSIONS_EXCEEDS_TOTAL_FMT,
                    remainingValue, totalValue));
        }
        return totalValue - remainingValue;
    }

    /**
     * 총 회기만 변경 — used 고정, {@code remaining = total - used}.
     *
     * @param total 총 회기
     * @param used  사용 회기
     * @return 파생된 잔여 회기
     * @throws IllegalArgumentException total &lt; 0, used &lt; 0, total &lt; used
     */
    public static int deriveRemainingFromTotalAndUsed(Integer total, Integer used) {
        int totalValue = nullToZero(total);
        int usedValue = nullToZero(used);
        if (totalValue < 0) {
            throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_MAPPING_TOTAL_SESSIONS_NEGATIVE);
        }
        if (usedValue < 0) {
            throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_MAPPING_USED_SESSIONS_NEGATIVE);
        }
        if (totalValue < usedValue) {
            throw new IllegalArgumentException(String.format(
                    AdminServiceUserFacingMessages.MSG_MAPPING_TOTAL_SESSIONS_LESS_THAN_USED_FMT,
                    totalValue, usedValue));
        }
        return totalValue - usedValue;
    }
}
