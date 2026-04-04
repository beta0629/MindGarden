package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.constant.ClientGradeAutoPromotionConstants;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ClientGradeAutoPromotionService;
import com.coresolution.consultation.util.ClientGradePromotionUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 내담자 등급 자동 승급 구현.
 * <p>
 * TODO(운영/기획): 관리자 수동 등급 고정 시 자동 승급 제외 플래그
 * ({@code users.grade_auto_disabled} 등) — MVP 에서는 미도입, 전원 대상 승급만 수행.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-04-04
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClientGradeAutoPromotionServiceImpl implements ClientGradeAutoPromotionService {

    private static final int PAGE_SIZE = 200;

    private final CommonCodeRepository commonCodeRepository;
    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Result runForTenant(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId는 필수입니다.");
        }

        Map<String, Integer> minSessionsByGrade = loadMinSessionsRules(tenantId);
        if (minSessionsByGrade.isEmpty()) {
            log.warn("[ClientGradeAuto] 임계 규칙 없음(공통코드 스킵/누락), tenantId={}", tenantId);
            return new Result(0, 0);
        }

        Map<Long, Long> completedByClientId = loadCompletedSessionCountsByClient(tenantId);

        int scanned = 0;
        int updated = 0;
        int pageIndex = 0;
        Page<User> page;
        do {
            page = userRepository.pageActiveUsersByTenantIdAndRole(
                tenantId,
                UserRole.CLIENT,
                PageRequest.of(pageIndex, PAGE_SIZE));
            for (User user : page.getContent()) {
                scanned++;
                long sessions = completedByClientId.getOrDefault(user.getId(), 0L);
                String target = ClientGradePromotionUtil.resolveUpgradeGrade(
                    user.getGrade(),
                    sessions,
                    minSessionsByGrade);
                if (target == null || target.equals(user.getGrade())) {
                    continue;
                }
                log.info("[ClientGradeAuto] 승급: tenantId={}, userId={}, {} -> {}, completedSessions={}",
                    tenantId, user.getId(), user.getGrade(), target, sessions);
                user.setGrade(target);
                user.setLastGradeUpdate(LocalDateTime.now());
                user.setUpdatedAt(LocalDateTime.now());
                user.setVersion(user.getVersion() + 1);
                userRepository.save(user);
                updated++;
            }
            pageIndex++;
        } while (page.hasNext());

        return new Result(scanned, updated);
    }

    private Map<String, Integer> loadMinSessionsRules(String tenantId) {
        Map<String, Integer> out = new HashMap<>();
        putRulesFromCodeList(
            commonCodeRepository.findCodesByGroupWithFallback(tenantId,
                ClientGradeAutoPromotionConstants.CODE_GROUP_CLIENT_GRADE),
            out);
        putRulesFromCodeList(
            commonCodeRepository.findCodesByGroupWithFallback(tenantId,
                ClientGradeAutoPromotionConstants.CODE_GROUP_USER_GRADE),
            out);
        return out;
    }

    /**
     * 앞선 목록(CLIENT_GRADE)이 우선: 동일 code_value 는 먼저 들어간 값 유지.
     */
    private void putRulesFromCodeList(List<CommonCode> codes, Map<String, Integer> out) {
        for (CommonCode c : codes) {
            String cv = c.getCodeValue();
            if (cv == null || !cv.startsWith(ClientGradeAutoPromotionConstants.CLIENT_GRADE_CODE_PREFIX)) {
                continue;
            }
            Integer min = ClientGradePromotionUtil.parseMinSessionsFromExtraData(c.getExtraData());
            if (min == null) {
                continue;
            }
            out.putIfAbsent(cv, min);
        }
    }

    private Map<Long, Long> loadCompletedSessionCountsByClient(String tenantId) {
        List<Object[]> rows = scheduleRepository.countCompletedConsultationSessionsGroupedByClientIdForAutoGrade(
            tenantId,
            ScheduleStatus.COMPLETED);
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            if (row == null || row.length < 2 || row[0] == null) {
                continue;
            }
            Long clientId = ((Number) row[0]).longValue();
            long cnt = ((Number) row[1]).longValue();
            map.put(clientId, cnt);
        }
        return map;
    }
}
