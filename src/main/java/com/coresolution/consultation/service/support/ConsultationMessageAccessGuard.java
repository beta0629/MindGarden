package com.coresolution.consultation.service.support;

import java.util.Objects;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultationMessage;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

/**
 * 상담 메시지 API 본인·참여자·테넌트 접근 가드.
 *
 * <p>규칙 (모든 조회는 호출 전 컨트롤러가 세션 사용자 테넌트로 설정한 {@link TenantContextHolder} 기준):</p>
 * <ul>
 *   <li>CLIENT — 경로 id 는 세션 사용자 id 와 같아야 하며, 메시지 단건은 발신자·수신자일 때만.</li>
 *   <li>CONSULTANT — 본인 id, 또는 같은 테넌트에서 매칭 이력(상태 무관)이 있는 내담자 스레드 중 본인 스레드만.</li>
 *   <li>ADMIN·STAFF(또는 내담자가 아닌 MESSAGE_MANAGE 보유자) — 같은 테넌트 전체.</li>
 * </ul>
 * <p>거부 시 {@link AccessDeniedException} → {@code GlobalExceptionHandler} 가 HTTP 403 으로 매핑한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ConsultationMessageAccessGuard {

    /** 테넌트 메시지 관리 권한 코드. */
    public static final String PERMISSION_MESSAGE_MANAGE = "MESSAGE_MANAGE";

    public static final String DENIAL_OWN_MESSAGES_ONLY = "본인 메시지만 조회할 수 있습니다.";
    public static final String DENIAL_UNMAPPED_CLIENT = "매칭된 내담자의 메시지만 조회할 수 있습니다.";
    public static final String DENIAL_NOT_PARTICIPANT = "메시지를 조회할 권한이 없습니다.";
    public static final String DENIAL_MARK_READ = "이 메시지를 읽음 처리할 권한이 없습니다.";
    public static final String DENIAL_SEND = "본인 명의로 매칭된 상대에게만 메시지를 보낼 수 있습니다.";
    public static final String DENIAL_REPLY = "이 메시지에 답장할 권한이 없습니다.";
    public static final String DENIAL_DELETE = "이 메시지를 삭제할 권한이 없습니다.";
    public static final String DENIAL_ARCHIVE = "이 메시지를 보관할 권한이 없습니다.";
    public static final String DENIAL_UNKNOWN_CALLER = "접근 권한이 없습니다.";

    private final DynamicPermissionService dynamicPermissionService;
    private final ConsultantClientMappingRepository consultantClientMappingRepository;

    /**
     * 메시지 전송에 사용할 강제 스코프 (요청 본문의 발신자 정보를 신뢰하지 않음).
     *
     * @param consultantId 스레드 상담사 ID
     * @param clientId     스레드 내담자 ID
     * @param senderType   발신자 유형
     */
    public record SendScope(Long consultantId, Long clientId, String senderType) {
    }

    /**
     * 같은 테넌트 전체 메시지를 다룰 수 있는 호출자인지. CLIENT 는 권한 코드와 무관하게 false.
     *
     * @param caller 세션 사용자
     * @return ADMIN·STAFF 또는 내담자가 아닌 MESSAGE_MANAGE 보유자이면 true
     */
    public boolean isTenantMessageManager(User caller) {
        UserRole role = caller != null ? caller.getRole() : null;
        if (role == null || role.isClient()) {
            return false;
        }
        if (role.isAdmin() || role.isStaff()) {
            return true;
        }
        return dynamicPermissionService.hasPermission(caller, PERMISSION_MESSAGE_MANAGE);
    }

    /**
     * {@code GET /consultant/{consultantId}} 접근 검증.
     *
     * @param caller       세션 사용자
     * @param consultantId 경로 상담사 ID
     * @throws AccessDeniedException 본인이 아니고 테넌트 관리자도 아닌 경우
     */
    public void assertCanReadConsultantThread(User caller, Long consultantId) {
        requireCaller(caller);
        if (isTenantMessageManager(caller)) {
            return;
        }
        if (caller.getRole().isConsultant() && Objects.equals(caller.getId(), consultantId)) {
            return;
        }
        deny(DENIAL_OWN_MESSAGES_ONLY, caller, "consultantId", consultantId);
    }

    /**
     * {@code GET /client/{clientId}} 접근 검증 후 조회에 쓸 상담사 필터를 돌려준다.
     *
     * @param caller                세션 사용자
     * @param clientId              경로 내담자 ID
     * @param requestedConsultantId 쿼리 consultantId (선택)
     * @return 조회에 사용할 consultantId 필터 (상담사 호출은 본인 id 로 고정)
     * @throws AccessDeniedException 본인·매칭·테넌트 관리자 조건을 만족하지 않는 경우
     */
    public Long resolveClientThreadConsultantFilter(User caller, Long clientId, Long requestedConsultantId) {
        requireCaller(caller);
        UserRole role = caller.getRole();
        if (role.isClient()) {
            if (!Objects.equals(caller.getId(), clientId)) {
                deny(DENIAL_OWN_MESSAGES_ONLY, caller, "clientId", clientId);
            }
            return requestedConsultantId;
        }
        if (isTenantMessageManager(caller)) {
            return requestedConsultantId;
        }
        if (role.isConsultant()) {
            Long self = caller.getId();
            if (requestedConsultantId != null && !Objects.equals(requestedConsultantId, self)) {
                deny(DENIAL_OWN_MESSAGES_ONLY, caller, "consultantId", requestedConsultantId);
            }
            if (!hasAnyMapping(self, clientId)) {
                deny(DENIAL_UNMAPPED_CLIENT, caller, "clientId", clientId);
            }
            return self;
        }
        deny(DENIAL_OWN_MESSAGES_ONLY, caller, "clientId", clientId);
        return null;
    }

    /**
     * 메시지 단건 조회: 발신자·수신자 또는 테넌트 관리자.
     *
     * @param caller  세션 사용자
     * @param message 대상 메시지 (테넌트 스코프 조회 결과)
     * @throws AccessDeniedException 참여자가 아닌 경우
     */
    public void assertCanViewMessage(User caller, ConsultationMessage message) {
        requireCaller(caller);
        if (isTenantMessageManager(caller) || isSender(caller, message) || isReceiver(caller, message)) {
            return;
        }
        deny(DENIAL_NOT_PARTICIPANT, caller, "messageId", message != null ? message.getId() : null);
    }

    /**
     * 읽음 처리: 수신자 또는 테넌트 관리자.
     *
     * @param caller  세션 사용자
     * @param message 대상 메시지
     * @return 수신자 본인이거나 관리자이면 true
     */
    public boolean canMarkAsRead(User caller, ConsultationMessage message) {
        return caller != null && caller.getRole() != null
            && (isTenantMessageManager(caller) || isReceiver(caller, message));
    }

    /**
     * 읽음 처리 검증.
     *
     * @param caller  세션 사용자
     * @param message 대상 메시지
     * @throws AccessDeniedException 수신자도 관리자도 아닌 경우
     */
    public void assertCanMarkAsRead(User caller, ConsultationMessage message) {
        requireCaller(caller);
        if (!canMarkAsRead(caller, message)) {
            deny(DENIAL_MARK_READ, caller, "messageId", message != null ? message.getId() : null);
        }
    }

    /**
     * 전송 스코프 결정. CLIENT·CONSULTANT 는 발신자를 세션 사용자로 고정하고 매칭 이력을 요구한다.
     *
     * @param caller              세션 사용자
     * @param requestConsultantId 요청 consultantId
     * @param requestClientId     요청 clientId
     * @param requestSenderType   요청 senderType
     * @return 서비스에 넘길 스코프
     * @throws AccessDeniedException 타인 명의·미매칭 상대
     */
    public SendScope resolveSendScope(
            User caller, Long requestConsultantId, Long requestClientId, String requestSenderType) {
        requireCaller(caller);
        UserRole role = caller.getRole();
        Long self = caller.getId();
        if (role.isClient()) {
            if (requestClientId != null && !Objects.equals(requestClientId, self)) {
                deny(DENIAL_SEND, caller, "clientId", requestClientId);
            }
            if (requestConsultantId == null || !hasAnyMapping(requestConsultantId, self)) {
                deny(DENIAL_SEND, caller, "consultantId", requestConsultantId);
            }
            return new SendScope(requestConsultantId, self, UserRole.CLIENT.name());
        }
        if (isTenantMessageManager(caller)) {
            if (requestConsultantId == null || requestClientId == null) {
                deny(DENIAL_SEND, caller, "consultantId", requestConsultantId);
            }
            return new SendScope(requestConsultantId, requestClientId, requestSenderType);
        }
        if (role.isConsultant()) {
            if (requestConsultantId != null && !Objects.equals(requestConsultantId, self)) {
                deny(DENIAL_SEND, caller, "consultantId", requestConsultantId);
            }
            if (requestClientId == null || !hasAnyMapping(self, requestClientId)) {
                deny(DENIAL_SEND, caller, "clientId", requestClientId);
            }
            return new SendScope(self, requestClientId, UserRole.CONSULTANT.name());
        }
        deny(DENIAL_SEND, caller, "consultantId", requestConsultantId);
        return null;
    }

    /**
     * 답장 검증: 답장 발신자로 기록될 사용자가 세션 사용자여야 한다 (관리자 제외).
     *
     * @param caller   세션 사용자
     * @param original 원본 메시지
     * @throws AccessDeniedException 타인 명의 답장
     */
    public void assertCanReply(User caller, ConsultationMessage original) {
        requireCaller(caller);
        if (isTenantMessageManager(caller)) {
            return;
        }
        Long replySenderId = UserRole.CONSULTANT.name().equals(original.getSenderType())
            ? original.getClientId() : original.getConsultantId();
        if (!Objects.equals(replySenderId, caller.getId())) {
            deny(DENIAL_REPLY, caller, "messageId", original.getId());
        }
    }

    /**
     * 삭제 검증: 발신자 본인 또는 테넌트 관리자.
     *
     * @param caller  세션 사용자
     * @param message 대상 메시지
     * @throws AccessDeniedException 권한 없음
     */
    public void assertCanDelete(User caller, ConsultationMessage message) {
        requireCaller(caller);
        if (isTenantMessageManager(caller) || isSender(caller, message)) {
            return;
        }
        deny(DENIAL_DELETE, caller, "messageId", message.getId());
    }

    /**
     * 보관 검증: 발신자·수신자 또는 테넌트 관리자.
     *
     * @param caller  세션 사용자
     * @param message 대상 메시지
     * @throws AccessDeniedException 권한 없음
     */
    public void assertCanArchive(User caller, ConsultationMessage message) {
        requireCaller(caller);
        if (isTenantMessageManager(caller) || isSender(caller, message) || isReceiver(caller, message)) {
            return;
        }
        deny(DENIAL_ARCHIVE, caller, "messageId", message.getId());
    }

    private boolean hasAnyMapping(Long consultantId, Long clientId) {
        if (consultantId == null || clientId == null) {
            return false;
        }
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return !consultantClientMappingRepository
            .findAllByTenantIdAndConsultantIdAndClientIdOrderByCreatedAtDesc(tenantId, consultantId, clientId)
            .isEmpty();
    }

    private static boolean isSender(User caller, ConsultationMessage message) {
        return message != null && caller.getId() != null && Objects.equals(message.getSenderId(), caller.getId());
    }

    private static boolean isReceiver(User caller, ConsultationMessage message) {
        return message != null && caller.getId() != null
            && Objects.equals(message.getReceiverId(), caller.getId());
    }

    private static void requireCaller(User caller) {
        if (caller == null || caller.getId() == null || caller.getRole() == null) {
            throw new AccessDeniedException(DENIAL_UNKNOWN_CALLER);
        }
    }

    private static void deny(String message, User caller, String field, Long requested) {
        log.warn("[security] consultation message access denied: userId={}, role={}, {}={}",
            caller.getId(), caller.getRole(), field, requested);
        throw new AccessDeniedException(message);
    }
}
