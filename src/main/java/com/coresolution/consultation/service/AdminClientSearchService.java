package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.AdminClientSearchConstants;
import com.coresolution.consultation.constant.ClientVisibilityPolicy;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.admin.client.AdminClientSearchItem;
import com.coresolution.consultation.dto.admin.client.AdminClientSearchPage;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.service.SensitiveDataMaskingService;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 관리자 내담자 검색 — 이름 부분 일치 또는 연락처 뒷자리(숫자 4자리) 일치.
 * 연락처는 이 서비스 안에서만 복호화·비교하고, 응답에는 뒷자리와 마스킹 값만 담는다. 검색어·연락처는 로그에 남기지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-12
 */
@Service
@RequiredArgsConstructor
public class AdminClientSearchService {

    private final UserRepository userRepository;
    private final SensitiveDataMaskingService maskingService;

    /**
     * @param tenantId 테넌트 ID
     * @param query 검색어 (빈 값이면 전체)
     * @param page 0부터 시작
     * @param size 페이지 크기 (1~{@link AdminClientSearchConstants#MAX_PAGE_SIZE})
     * @return 검색 결과
     */
    @Transactional(readOnly = true)
    public AdminClientSearchPage search(String tenantId, String query, Integer page, Integer size) {
        int p = page == null || page < 0 ? 0 : page;
        int s = size == null || size < 1 ? AdminClientSearchConstants.DEFAULT_PAGE_SIZE
                : Math.min(size, AdminClientSearchConstants.MAX_PAGE_SIZE);
        String q = query == null ? "" : query.trim();
        String qLower = q.toLowerCase(Locale.ROOT);
        String qDigits = digits(q);
        boolean tailQuery = qDigits.length() == AdminClientSearchConstants.PHONE_TAIL_LENGTH
                && qDigits.equals(q.replaceAll("[\\s-]", ""));
        List<AdminClientSearchItem> matched = userRepository.findByRole(tenantId, UserRole.CLIENT).stream()
                .filter(ClientVisibilityPolicy::isVisible)
                .filter(u -> q.isEmpty() || nameMatches(u, qLower) || (tailQuery && digits(u.getPhone()).endsWith(qDigits)))
                .sorted(Comparator.comparing(u -> u.getName() == null ? "" : u.getName()))
                .map(this::toItem)
                .toList();
        int from = (int) Math.min((long) p * s, matched.size());
        int to = Math.min(from + s, matched.size());
        return new AdminClientSearchPage(matched.subList(from, to), p, s, matched.size());
    }

    private static boolean nameMatches(User u, String qLower) {
        return u.getName() != null && u.getName().toLowerCase(Locale.ROOT).contains(qLower);
    }

    private AdminClientSearchItem toItem(User u) {
        String d = digits(u.getPhone());
        if (d.length() < AdminClientSearchConstants.PHONE_TAIL_LENGTH) {
            return new AdminClientSearchItem(u.getId(), u.getName(), null, null);
        }
        String tail = d.substring(d.length() - AdminClientSearchConstants.PHONE_TAIL_LENGTH);
        String masked = maskingService.maskPhone(u.getPhone());
        // 마스킹이 꺼진 환경(개발)에서도 전체 번호가 나가지 않게 한다
        if (masked == null || digits(masked).length() > AdminClientSearchConstants.PHONE_TAIL_LENGTH) {
            masked = AdminClientSearchConstants.MASKED_PHONE_PREFIX + tail;
        }
        return new AdminClientSearchItem(u.getId(), u.getName(), tail, masked);
    }

    private static String digits(String text) {
        return text == null ? "" : text.replaceAll("\\D", "");
    }
}
