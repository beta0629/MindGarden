package com.coresolution.core.tenant;

import com.coresolution.core.domain.Tenant.TenantStatus;
import org.springframework.stereotype.Component;

/**
 * 테넌트 상태별 접근 허용 여부.
 *
 * <p>SUSPENDED 와 CLOSED 는 막고, {@code /api/v1/ops/**} 는 예외다.
 * ACTIVE·PENDING·상태 없음은 이 정책에서 막지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Component
public class TenantAccessPolicy {

    /**
     * 요청 경로가 Ops API 인지.
     *
     * @param requestPath 쿼리 포함 가능
     * @return Ops 경로이면 true
     */
    public boolean isOpsPath(String requestPath) {
        String path = stripQuery(requestPath);
        if (path.isEmpty()) {
            return false;
        }
        return TenantAccessMessages.OPS_PATH_PREFIX.equals(path)
                || path.startsWith(TenantAccessMessages.OPS_PATH_PREFIX + "/");
    }

    /**
     * 상태와 경로로 접근을 판정한다.
     *
     * @param status      테넌트 상태. 행이 없으면 null
     * @param requestPath 요청 경로. 스케줄·로그인처럼 경로가 없으면 null
     * @return 판정
     */
    public TenantAccessDecision decide(TenantStatus status, String requestPath) {
        if (isOpsPath(requestPath)) {
            return TenantAccessDecision.ALLOW;
        }
        if (status == TenantStatus.CLOSED) {
            return TenantAccessDecision.DENY_CLOSED;
        }
        if (status == TenantStatus.SUSPENDED) {
            return TenantAccessDecision.DENY_SUSPENDED;
        }
        return TenantAccessDecision.ALLOW;
    }

    /**
     * @param status      테넌트 상태
     * @param requestPath 요청 경로
     * @return 허용이면 true
     */
    public boolean allows(TenantStatus status, String requestPath) {
        return decide(status, requestPath).isAllowed();
    }

    private static String stripQuery(String requestPath) {
        if (requestPath == null || requestPath.isBlank()) {
            return "";
        }
        String path = requestPath.trim();
        int query = path.indexOf('?');
        if (query >= 0) {
            path = path.substring(0, query);
        }
        return path;
    }
}
