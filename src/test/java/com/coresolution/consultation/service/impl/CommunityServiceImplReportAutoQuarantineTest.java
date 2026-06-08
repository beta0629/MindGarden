package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import com.coresolution.consultation.constant.CommunityModerationStatus;
import com.coresolution.consultation.constant.CommunityReportPriority;
import com.coresolution.consultation.constant.CommunityReportReasonCode;
import com.coresolution.consultation.constant.CommunityReportStatus;
import com.coresolution.consultation.dto.community.CommunityReportCreateRequest;
import com.coresolution.consultation.entity.CommunityPost;
import com.coresolution.consultation.entity.CommunityReport;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.CommunityCommentRepository;
import com.coresolution.consultation.repository.CommunityPostLikeRepository;
import com.coresolution.consultation.repository.CommunityPostRepository;
import com.coresolution.consultation.repository.CommunityReportRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommunityContentFilterService;
import com.coresolution.consultation.service.CommunityUserBlockService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

/**
 * Apple T2 (1.2 UGC) — {@link CommunityServiceImpl#report} 의 자동 격리 트리거 단위 테스트.
 *
 * <p>{@link CommunityServiceImpl#AUTO_QUARANTINE_THRESHOLD} 건 누적 신고 시 게시물이 자동
 * 숨김 처리되고 마지막 신고가 {@link CommunityReportPriority#AUTO_QUARANTINE} 으로 마킹되는지
 * 검증한다. 중복 신고 차단도 함께 검증한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CommunityServiceImpl — Apple T2 신고 처리 + 3건 누적 자동 격리")
class CommunityServiceImplReportAutoQuarantineTest {

    private static final String TENANT_ID = "tenant-report-test";
    private static final Long REPORTER_ID = 700L;
    private static final Long POST_AUTHOR_ID = 800L;
    private static final Long POST_ID = 5001L;

    @Mock private CommunityPostRepository communityPostRepository;
    @Mock private CommunityCommentRepository communityCommentRepository;
    @Mock private CommunityPostLikeRepository communityPostLikeRepository;
    @Mock private CommunityReportRepository communityReportRepository;
    @Mock private UserRepository userRepository;
    @Mock private CommunityUserBlockService communityUserBlockService;
    @Mock private CommunityContentFilterService communityContentFilterService;

    private CommunityServiceImpl service;

    private User reporter;
    private CommunityPost approvedPost;

    @BeforeEach
    void setUp() {
        service = new CommunityServiceImpl(
                communityPostRepository,
                communityCommentRepository,
                communityPostLikeRepository,
                communityReportRepository,
                userRepository,
                communityUserBlockService,
                communityContentFilterService);
        reporter = new User();
        reporter.setId(REPORTER_ID);
        reporter.setTenantId(TENANT_ID);
        User author = new User();
        author.setId(POST_AUTHOR_ID);
        author.setTenantId(TENANT_ID);
        approvedPost = CommunityPost.builder()
                .tenantId(TENANT_ID)
                .author(author)
                .title("test")
                .body("body")
                .moderationStatus(CommunityModerationStatus.APPROVED)
                .anonymous(false)
                .isDeleted(false)
                .build();
        approvedPost.setId(POST_ID);
    }

    @Test
    @DisplayName("신고 1건 — status=OPEN/priority=NORMAL 로 저장, 자동 격리 미발동")
    void firstReport_savesOpenAndNormal() {
        when(communityPostRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT_ID, POST_ID))
                .thenReturn(Optional.of(approvedPost));
        when(communityReportRepository.existsActiveByReporter(
                eq(TENANT_ID), eq(REPORTER_ID), eq(POST_ID), eq(null))).thenReturn(false);
        when(userRepository.getReferenceById(REPORTER_ID)).thenReturn(reporter);
        when(communityReportRepository.countActiveByPost(TENANT_ID, POST_ID)).thenReturn(1L);
        when(communityReportRepository.save(any(CommunityReport.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        CommunityReportCreateRequest req = new CommunityReportCreateRequest();
        req.setReasonCode(CommunityReportReasonCode.SPAM);
        req.setDetailMessage("광고성 게시물");

        service.report(reporter, POST_ID, req);

        ArgumentCaptor<CommunityReport> captor = ArgumentCaptor.forClass(CommunityReport.class);
        verify(communityReportRepository).save(captor.capture());
        CommunityReport saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(CommunityReportStatus.OPEN);
        assertThat(saved.getPriority()).isEqualTo(CommunityReportPriority.NORMAL);
        assertThat(saved.getReasonCode()).isEqualTo("SPAM");
        // 자동 격리 미발동 → 게시물 hidden_at 변경 없음
        assertThat(approvedPost.getHiddenAt()).isNull();
        verify(communityPostRepository, never()).save(any(CommunityPost.class));
    }

    @Test
    @DisplayName("신고 3건 누적 — 게시물 자동 숨김 + 마지막 신고 AUTO_QUARANTINE 마킹")
    void thirdReport_triggersAutoQuarantine() {
        when(communityPostRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT_ID, POST_ID))
                .thenReturn(Optional.of(approvedPost));
        when(communityReportRepository.existsActiveByReporter(
                eq(TENANT_ID), eq(REPORTER_ID), eq(POST_ID), eq(null))).thenReturn(false);
        when(userRepository.getReferenceById(REPORTER_ID)).thenReturn(reporter);
        when(communityReportRepository.countActiveByPost(TENANT_ID, POST_ID)).thenReturn(3L);
        when(communityReportRepository.save(any(CommunityReport.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        CommunityReportCreateRequest req = new CommunityReportCreateRequest();
        req.setReasonCode(CommunityReportReasonCode.HARASSMENT);

        service.report(reporter, POST_ID, req);

        // 두 번 save: (1) report 저장 (2) AUTO_QUARANTINE 마킹 갱신
        ArgumentCaptor<CommunityReport> reportCaptor = ArgumentCaptor.forClass(CommunityReport.class);
        verify(communityReportRepository, org.mockito.Mockito.times(2)).save(reportCaptor.capture());
        CommunityReport last = reportCaptor.getAllValues().get(reportCaptor.getAllValues().size() - 1);
        assertThat(last.getPriority()).isEqualTo(CommunityReportPriority.AUTO_QUARANTINE);

        // 게시물 hidden_at 설정 + hidden_reason 마킹
        assertThat(approvedPost.getHiddenAt()).isNotNull();
        assertThat(approvedPost.getHiddenReason()).isEqualTo("AUTO:THREE_REPORTS");
        verify(communityPostRepository).save(approvedPost);
    }

    @Test
    @DisplayName("중복 신고 — 동일 사용자가 같은 게시물 재신고 시 AccessDenied")
    void duplicateReport_throwsAccessDenied() {
        when(communityPostRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT_ID, POST_ID))
                .thenReturn(Optional.of(approvedPost));
        when(communityReportRepository.existsActiveByReporter(
                eq(TENANT_ID), eq(REPORTER_ID), eq(POST_ID), eq(null))).thenReturn(true);

        CommunityReportCreateRequest req = new CommunityReportCreateRequest();
        req.setReasonCode(CommunityReportReasonCode.SPAM);

        assertThatThrownBy(() -> service.report(reporter, POST_ID, req))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("이미 신고");
        verify(communityReportRepository, never()).save(any(CommunityReport.class));
    }
}
