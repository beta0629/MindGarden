package com.coresolution.consultation.service.support;

import java.util.Objects;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 경로·파라미터로 내담자/상담사 id 를 받는 API 의 본인·매칭·테넌트 접근 가드.
 *
 * <p>역할은 세션 사용자에서만 읽는다 (요청 파라미터 {@code userRole} 등은 신뢰하지 않음).
 * 테넌트는 {@link TenantContextHolder} 기준이며, 세션 사용자 테넌트와 다르면 거부한다.</p>
 * <ul>
 *   <li>CLIENT — 경로 내담자 id 가 본인 id 일 때만. 상담사 id 경로는 거부.</li>
 *   <li>CONSULTANT(전문가 계열) — 내담자 id 는 같은 테넌트에서 매칭 이력(상태 무관)이 있을 때만,
 *       상담사 id 는 본인일 때만 ({@link ConsultationMessageAccessGuard} 와 같은 매칭 규칙).</li>
 *   <li>ADMIN·STAFF — 대상 사용자가 같은 테넌트에 있을 때만.</li>
 * </ul>
 * <p>거부 시 {@link AccessDeniedException} → {@code GlobalExceptionHandler} 가 HTTP 403,
 * 세션 사용자 없음은 {@link UnauthorizedException} → HTTP 401 로 매핑한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ClientPathAccessGuard {

    public static final String LOGIN_REQUIRED = "로그인이 필요합니다.";
    public static final String DENIAL_OWN_CLIENT_ONLY = "본인 정보만 조회할 수 있습니다.";
    public static final String DENIAL_UNMAPPED_CLIENT = "매칭된 내담자의 정보만 조회할 수 있습니다.";
    public static final String DENIAL_OWN_CONSULTANT_ONLY = "본인 상담사 정보만 조회할 수 있습니다.";
    public static final String DENIAL_OTHER_TENANT = "같은 기관의 사용자 정보만 조회할 수 있습니다.";
    public static final String DENIAL_MANAGER_ONLY = "관리자만 변경할 수 있습니다.";
    public static final String DENIAL_STAFF_OR_CONSULTANT_ONLY = "상담사 또는 관리자만 이용할 수 있습니다.";
    public static final String DENIAL_UNKNOWN_CALLER = "접근 권한이 없습니다.";

    private final ConsultantClientMappingRepository consultantClientMappingRepository;
    private final UserRepository userRepository;

    /**
     * 세션 사용자를 돌려준다.
     *
     * @param session HTTP 세션 (null 허용)
     * @return 세션 사용자
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     */
    public User requireCaller(HttpSession session) {
        User caller = SessionUtils.getCurrentUser(session);
        if (caller == null || caller.getId() == null) {
            throw new UnauthorizedException(LOGIN_REQUIRED);
        }
        return caller;
    }

    /**
     * 본인 계정에만 쓰는 API(패스키·SNS 연결 등)를 검증한다. 요청 사용자 id 는 비교용으로만 쓰고,
     * 실제 대상은 항상 세션 사용자다. 관리자라도 다른 사용자 id 는 거부한다.
     *
     * @param session         HTTP 세션
     * @param requestedUserId 요청에 실린 사용자 ID (null 이면 세션 사용자로 본다)
     * @return 세션 사용자
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 요청 사용자 id 가 세션 사용자와 다를 때
     */
    public User requireSelf(HttpSession session, Long requestedUserId) {
        User caller = requireCaller(session);
        if (requestedUserId != null && !requestedUserId.equals(caller.getId())) {
            deny(DENIAL_OWN_CLIENT_ONLY, caller, "userId", requestedUserId);
        }
        return caller;
    }

    /**
     * 세션 사용자가 경로 내담자 id 에 접근할 수 있는지 검증한다.
     *
     * @param session  HTTP 세션
     * @param clientId 경로 내담자 ID
     * @return 세션 사용자
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 본인·매칭·같은 테넌트 조건을 만족하지 않을 때
     */
    public User requireClientAccess(HttpSession session, Long clientId) {
        User caller = requireCaller(session);
        assertCanAccessClient(caller, clientId);
        return caller;
    }

    /**
     * 세션 사용자가 경로 상담사 id 에 접근할 수 있는지 검증한다.
     *
     * @param session      HTTP 세션
     * @param consultantId 경로 상담사 ID
     * @return 세션 사용자
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 본인 상담사도 같은 테넌트 관리자도 아닐 때
     */
    public User requireConsultantAccess(HttpSession session, Long consultantId) {
        User caller = requireCaller(session);
        assertCanAccessConsultant(caller, consultantId);
        return caller;
    }

    /**
     * {@code /consultants/{consultantId}/clients/{clientId}} 형태 접근 검증.
     *
     * @param session      HTTP 세션
     * @param consultantId 경로 상담사 ID
     * @param clientId     경로 내담자 ID
     * @return 세션 사용자
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 상담사 본인·매칭 또는 같은 테넌트 관리자가 아닐 때
     */
    public User requireConsultantClientAccess(HttpSession session, Long consultantId, Long clientId) {
        User caller = requireCaller(session);
        assertCanAccessConsultant(caller, consultantId);
        assertCanAccessClient(caller, clientId);
        return caller;
    }

    /**
     * 같은 테넌트 관리자·사무원만 허용한다 (타 사용자 역할·비밀번호 등 계정 속성 변경용).
     *
     * @param session HTTP 세션
     * @return 세션 사용자
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException ADMIN·STAFF 가 아니거나 테넌트가 맞지 않을 때
     */
    public User requireTenantManager(HttpSession session) {
        User caller = requireCaller(session);
        requireRole(caller);
        resolveTenantId(caller);
        if (!isTenantManager(caller)) {
            deny(DENIAL_MANAGER_ONLY, caller, "userId", caller.getId());
        }
        return caller;
    }

    /**
     * 같은 테넌트 관리자·사무원·상담사만 허용한다 (내담자 거부. 테넌트 단위 목록·통계용).
     *
     * @param session HTTP 세션
     * @return 세션 사용자
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 내담자이거나 역할·테넌트가 맞지 않을 때
     */
    public User requireTenantManagerOrConsultant(HttpSession session) {
        User caller = requireCaller(session);
        UserRole role = requireRole(caller);
        resolveTenantId(caller);
        if (!isTenantManager(caller) && !role.isConsultant()) {
            deny(DENIAL_STAFF_OR_CONSULTANT_ONLY, caller, "userId", caller.getId());
        }
        return caller;
    }

    /**
     * 세션 사용자 기준 테넌트 ID 를 돌려준다 (TenantContext 와 세션 사용자 테넌트가 다르면 거부).
     *
     * @param caller 세션 사용자
     * @return 테넌트 ID
     * @throws AccessDeniedException 테넌트를 확정할 수 없거나 불일치할 때
     */
    public String requireCallerTenantId(User caller) {
        requireRole(caller);
        return resolveTenantId(caller);
    }

    /**
     * {@link #assertCanAccessClient} 와 같은 규칙을 예외·경고 로그 없이 판정한다 (목록 필터용).
     *
     * @param caller   세션 사용자
     * @param clientId 대상 내담자 ID (null 이면 false)
     * @return 접근 가능하면 true
     */
    public boolean canAccessClient(User caller, Long clientId) {
        if (caller == null || caller.getId() == null || caller.getRole() == null || clientId == null) {
            return false;
        }
        String contextTenantId = trimToNull(TenantContextHolder.getTenantId());
        String callerTenantId = trimToNull(caller.getTenantId());
        if (contextTenantId != null && callerTenantId != null && !contextTenantId.equals(callerTenantId)) {
            return false;
        }
        String tenantId = contextTenantId != null ? contextTenantId : callerTenantId;
        if (tenantId == null) {
            return false;
        }
        UserRole role = caller.getRole();
        if (role.isClient()) {
            return Objects.equals(caller.getId(), clientId);
        }
        if (isTenantManager(caller)) {
            return userRepository.findByTenantIdAndId(tenantId, clientId).isPresent();
        }
        return role.isConsultant() && hasAnyMapping(tenantId, caller.getId(), clientId);
    }

    /**
     * 내담자 id 접근 검증.
     *
     * @param caller   세션 사용자
     * @param clientId 대상 내담자 ID
     * @throws AccessDeniedException 접근 불가
     */
    public void assertCanAccessClient(User caller, Long clientId) {
        UserRole role = requireRole(caller);
        String tenantId = resolveTenantId(caller);
        if (clientId == null) {
            deny(DENIAL_OWN_CLIENT_ONLY, caller, "clientId", null);
        }
        if (role.isClient()) {
            if (!Objects.equals(caller.getId(), clientId)) {
                deny(DENIAL_OWN_CLIENT_ONLY, caller, "clientId", clientId);
            }
            return;
        }
        if (isTenantManager(caller)) {
            assertUserInTenant(caller, tenantId, "clientId", clientId);
            return;
        }
        if (role.isConsultant()) {
            if (!hasAnyMapping(tenantId, caller.getId(), clientId)) {
                deny(DENIAL_UNMAPPED_CLIENT, caller, "clientId", clientId);
            }
            return;
        }
        deny(DENIAL_UNKNOWN_CALLER, caller, "clientId", clientId);
    }

    /**
     * 상담사 id 접근 검증.
     *
     * @param caller       세션 사용자
     * @param consultantId 대상 상담사 ID
     * @throws AccessDeniedException 접근 불가
     */
    public void assertCanAccessConsultant(User caller, Long consultantId) {
        UserRole role = requireRole(caller);
        String tenantId = resolveTenantId(caller);
        if (consultantId == null) {
            deny(DENIAL_OWN_CONSULTANT_ONLY, caller, "consultantId", null);
        }
        if (isTenantManager(caller)) {
            assertUserInTenant(caller, tenantId, "consultantId", consultantId);
            return;
        }
        if (role.isConsultant() && Objects.equals(caller.getId(), consultantId)) {
            return;
        }
        deny(DENIAL_OWN_CONSULTANT_ONLY, caller, "consultantId", consultantId);
    }

    /**
     * 같은 테넌트 전체 사용자를 다룰 수 있는 역할인지 (ADMIN·STAFF).
     *
     * @param caller 세션 사용자
     * @return ADMIN 또는 STAFF 이면 true
     */
    public boolean isTenantManager(User caller) {
        UserRole role = caller != null ? caller.getRole() : null;
        return role != null && (role.isAdmin() || role.isStaff());
    }

    private boolean hasAnyMapping(String tenantId, Long consultantId, Long clientId) {
        if (consultantId == null || clientId == null) {
            return false;
        }
        return !consultantClientMappingRepository
            .findAllByTenantIdAndConsultantIdAndClientIdOrderByCreatedAtDesc(tenantId, consultantId, clientId)
            .isEmpty();
    }

    private void assertUserInTenant(User caller, String tenantId, String field, Long targetId) {
        if (userRepository.findByTenantIdAndId(tenantId, targetId).isEmpty()) {
            deny(DENIAL_OTHER_TENANT, caller, field, targetId);
        }
    }

    private static UserRole requireRole(User caller) {
        if (caller == null || caller.getId() == null) {
            throw new UnauthorizedException(LOGIN_REQUIRED);
        }
        if (caller.getRole() == null) {
            throw new AccessDeniedException(DENIAL_UNKNOWN_CALLER);
        }
        return caller.getRole();
    }

    private static String resolveTenantId(User caller) {
        String contextTenantId = trimToNull(TenantContextHolder.getTenantId());
        String callerTenantId = trimToNull(caller.getTenantId());
        if (contextTenantId == null && callerTenantId == null) {
            deny(DENIAL_OTHER_TENANT, caller, "tenant", null);
        }
        if (contextTenantId != null && callerTenantId != null && !contextTenantId.equals(callerTenantId)) {
            deny(DENIAL_OTHER_TENANT, caller, "tenant", null);
        }
        return contextTenantId != null ? contextTenantId : callerTenantId;
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    static void deny(String message, User caller, String field, Object requested) {
        throw denied(message, caller, field, requested);
    }

    /**
     * 거부를 로그에 남기고 던질 예외를 돌려준다 ({@code throw denied(...)} 로 써서 이후 코드를 도달 불가로 만든다).
     *
     * @param message   사용자 문구 (내부 id·세션 값 금지)
     * @param caller    세션 사용자
     * @param field     로그용 필드 이름
     * @param requested 로그용 요청 값
     * @return 던질 {@link AccessDeniedException}
     */
    static AccessDeniedException denied(String message, User caller, String field, Object requested) {
        log.warn("[security] client path access denied: userId={}, role={}, {}={}",
            caller != null ? caller.getId() : null, caller != null ? caller.getRole() : null, field, requested);
        return new AccessDeniedException(message);
    }
}
