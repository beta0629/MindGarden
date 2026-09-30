package com.coresolution.consultation.util;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

/**
 * 계정 단위 JWT 폐기 기준 시각({@code users.tokens_invalidated_at}) 비교.
 *
 * <p>기준 시각은 초 단위로 절삭 저장되고 JWT iat 도 초 단위이므로, iat 가 기준 시각보다
 * <strong>엄격히 이전</strong>일 때만 거부한다(같은 초에 새로 발급된 토큰은 허용).</p>
 *
 * @author MindGarden
 * @since 2026-09-30
 */
public final class JwtTokenCutoffUtils {

    private JwtTokenCutoffUtils() {
    }

    /**
     * @param cutoff   계정 단위 폐기 기준 시각 (null 이면 기준 없음)
     * @param issuedAt JWT iat
     * @return 기준 시각 이전 발급(또는 기준이 있는데 iat 없음)이면 true
     */
    public static boolean isIssuedBeforeCutoff(LocalDateTime cutoff, Date issuedAt) {
        if (cutoff == null) {
            return false;
        }
        if (issuedAt == null) {
            return true;
        }
        long cutoffEpochMs = cutoff.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
        return issuedAt.getTime() < cutoffEpochMs;
    }
}
