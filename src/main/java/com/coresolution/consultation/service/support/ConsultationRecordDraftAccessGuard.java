package com.coresolution.consultation.service.support;

import java.util.Objects;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.repository.ScheduleRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 상담일지 서버 초안(자동저장) 전용 <strong>작성자 본인 전용</strong> 접근 가드.
 *
 * <p>초안은 아직 확정되지 않은 상담사 개인 작업본이므로, 확정 일지보다 좁은 규칙을 적용한다.
 * {@link ClientPathAccessGuard} 의 세션·테넌트 판정을 재사용하되 아래만 허용한다.</p>
 * <ul>
 *   <li>세션 사용자가 전문가(상담사) 계열이고,</li>
 *   <li>요청 {@code consultantId} 가 세션 사용자 본인이며,</li>
 *   <li>대상 일정이 같은 테넌트에 존재하고 그 일정의 담당 상담사가 본인일 것.</li>
 * </ul>
 * <p>내담자·다른 상담사·관리자/사무원·다른 테넌트는 모두 거부한다(관리자도 타인 초안을 읽지
 * 못한다). 테넌트 안에 일정이 없으면 존재 여부를 드러내지 않도록 동일 문구로 403 을 준다.</p>
 *
 * <p>GET·PUT·DELETE 세 엔드포인트가 모두 이 메서드 하나를 통과한다(공유 가드).</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ConsultationRecordDraftAccessGuard {

    public static final String DENIAL_DRAFT_AUTHOR_ONLY = "상담일지 초안은 작성한 상담사 본인만 접근할 수 있습니다.";

    private final ClientPathAccessGuard clientPathAccessGuard;
    private final ScheduleRepository scheduleRepository;

    /**
     * 초안 접근(조회·저장·삭제) 검증.
     *
     * @param session        HTTP 세션
     * @param consultationId 상담(스케줄) ID
     * @param consultantId   요청 상담사 ID
     * @return 검증된 테넌트 ID
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 작성자 본인이 아니거나 테넌트 내 일정이 아닐 때
     */
    @Transactional(readOnly = true)
    public String requireDraftAuthor(HttpSession session, Long consultationId,
            Long consultantId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        boolean consultant = caller.getRole() != null && caller.getRole().isConsultant();
        if (!consultant || consultantId == null || !Objects.equals(caller.getId(), consultantId)) {
            deny(caller, consultationId, consultantId);
        }
        Schedule schedule = consultationId == null ? null
            : scheduleRepository.findByTenantIdAndId(tenantId, consultationId).orElse(null);
        if (schedule == null || Boolean.TRUE.equals(schedule.getIsDeleted())
                || !Objects.equals(schedule.getConsultantId(), consultantId)) {
            deny(caller, consultationId, consultantId);
        }
        return tenantId;
    }

    private static void deny(User caller, Long consultationId, Long consultantId) {
        log.warn("[security] consultation draft access denied: userId={}, role={}, consultationId={}, consultantId={}",
            caller.getId(), caller.getRole(), consultationId, consultantId);
        throw new AccessDeniedException(DENIAL_DRAFT_AUTHOR_ONLY);
    }
}
