package com.coresolution.consultation.service.support;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import com.coresolution.consultation.constant.consultation.ConsultationRecordAccessAudit;
import com.coresolution.core.util.HttpRequestClientIp;
import com.coresolution.consultation.entity.ConsultationRecordAccessLog;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultationRecordAccessLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * 상담일지 열람 감사 로그 기록 서비스.
 *
 * <p>읽기 요청을 막지 않는 것이 1순위다. 기록은 호출 트랜잭션과 분리된
 * {@link Propagation#REQUIRES_NEW} 비동기 스레드에서 수행하고, 실패해도 예외를 밖으로
 * 던지지 않는다(실패 사실만 로그로 남긴다).</p>
 *
 * <p>IP·User-Agent 는 원문을 저장하지 않고 SHA-256 해시만 남긴다. 상담일지 본문은 어떤
 * 컬럼에도 담지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConsultationRecordAccessLogService {

    private static final String HASH_ALGORITHM = "SHA-256";
    private static final String HEADER_USER_AGENT = "User-Agent";

    private final ConsultationRecordAccessLogRepository consultationRecordAccessLogRepository;

    /**
     * 열람 감사 기록을 비동기로 남긴다. 호출 측은 결과를 기다리지 않는다.
     *
     * @param command 기록할 열람 정보
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(ConsultationRecordAccessCommand command) {
        if (command == null) {
            return;
        }
        try {
            ConsultationRecordAccessLog entity = ConsultationRecordAccessLog.builder()
                    .recordId(command.recordId())
                    .recordKind(command.recordKind() != null ? command.recordKind()
                            : ConsultationRecordAccessAudit.KIND_CONSULTATION_RECORD)
                    .clientId(command.clientId())
                    .authorConsultantId(command.authorConsultantId())
                    .actorId(command.actorId())
                    .actorRole(command.actorRole())
                    .action(command.action())
                    .result(command.result())
                    .denialReason(command.denialReason())
                    .ipHash(command.ipHash())
                    .userAgentHash(command.userAgentHash())
                    .accessedAt(LocalDateTime.now())
                    .build();
            entity.setTenantId(command.tenantId());
            consultationRecordAccessLogRepository.save(entity);
        } catch (Exception e) {
            // 감사 기록 실패가 열람 자체를 막으면 안 된다. 본문·식별 정보는 로그에 남기지 않는다.
            log.error("상담일지 열람 감사 기록 실패: action={}, result={}, recordId={}",
                    command.action(), command.result(), command.recordId(), e);
        }
    }

    /**
     * 현재 요청 정보(IP·User-Agent 해시)를 채운 기록 커맨드를 만든다.
     *
     * @param caller 세션 사용자 (null 허용 — 미인증)
     * @param tenantId 테넌트 ID
     * @param recordKind 대상 종류 ({@link ConsultationRecordAccessAudit} KIND_*)
     * @param recordId 대상 상담일지 ID (목록이면 null)
     * @param clientId 대상 내담자 ID
     * @param authorConsultantId 일지 작성 상담사 ID
     * @param action 행위 ({@link ConsultationRecordAccessAudit} ACTION_*)
     * @param result 결과 ({@link ConsultationRecordAccessAudit} RESULT_*)
     * @param denialReason 거부 사유 (허용이면 null)
     * @return 기록 커맨드
     */
    public ConsultationRecordAccessCommand buildCommand(User caller, String tenantId, String recordKind,
            Long recordId, Long clientId, Long authorConsultantId, String action, String result,
            String denialReason) {
        HttpServletRequest request = currentRequest();
        return new ConsultationRecordAccessCommand(
                tenantId,
                recordId,
                recordKind,
                clientId,
                authorConsultantId,
                caller != null ? caller.getId() : null,
                caller != null && caller.getRole() != null ? caller.getRole().name() : null,
                action,
                result,
                denialReason,
                sha256(resolveClientIp(request)),
                sha256(request != null ? request.getHeader(HEADER_USER_AGENT) : null));
    }

    /**
     * 현재 HTTP 요청. 스케줄러·배치 스레드에서는 null.
     *
     * @return 요청 또는 null
     */
    private static HttpServletRequest currentRequest() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (attributes instanceof ServletRequestAttributes servletAttributes) {
            return servletAttributes.getRequest();
        }
        return null;
    }

    private static String resolveClientIp(HttpServletRequest request) {
        return HttpRequestClientIp.resolve(request);
    }

    /**
     * SHA-256 16진 해시. 원문을 저장·로그하지 않기 위한 단방향 변환이다.
     *
     * @param value 원문 (null·공백이면 null 반환)
     * @return 소문자 16진 해시 또는 null
     */
    static String sha256(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            MessageDigest digest = MessageDigest.getInstance(HASH_ALGORITHM);
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            log.warn("감사 로그 해시 생성 실패 — 해시 없이 기록합니다.");
            return null;
        }
    }

    /**
     * 열람 감사 기록 커맨드 (불변).
     *
     * @param tenantId 테넌트 ID
     * @param recordId 대상 상담일지 ID
     * @param recordKind 대상 종류
     * @param clientId 대상 내담자 ID
     * @param authorConsultantId 작성 상담사 ID
     * @param actorId 행위자 ID
     * @param actorRole 행위자 역할
     * @param action 행위
     * @param result 결과
     * @param denialReason 거부 사유
     * @param ipHash IP 해시
     * @param userAgentHash User-Agent 해시
     */
    public record ConsultationRecordAccessCommand(String tenantId, Long recordId, String recordKind,
            Long clientId, Long authorConsultantId, Long actorId, String actorRole, String action,
            String result, String denialReason, String ipHash, String userAgentHash) {
    }
}
