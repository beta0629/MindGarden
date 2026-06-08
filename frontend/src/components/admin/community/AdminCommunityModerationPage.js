/**
 * Apple T2 (1.2 UGC) — 어드민 신고 처리 큐 페이지.
 *
 * <p>디자이너 핸드오프 §8 신고 처리 큐 — 상태 필터(전체/OPEN/UNDER_REVIEW/RESOLVED/REJECTED) +
 * SLA 카운터 + 4종 처리 액션(Resolve/Reject/Hide/Delete). 모든 API 호출은 {@code StandardizedApi}
 * 를 사용하고 SLA 라벨 색은 디자인 토큰 클래스만 사용한다 (인라인 #hex 금지).</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import StandardizedApi from '../../../utils/standardizedApi';
import { useToast } from '../../../contexts/ToastContext';
import {
  ADMIN_COMMUNITY_API,
  COMMUNITY_REPORT_RESOLUTION_ACTIONS,
  COMMUNITY_REPORT_STATUS_OPTIONS,
  COMMUNITY_SLA_THRESHOLDS
} from '../../../constants/communityApi';
import './AdminCommunityModerationPage.css';

const FILTER_TABS = [
  { value: 'ALL', label: '전체' },
  ...COMMUNITY_REPORT_STATUS_OPTIONS
];

const ACTION_LABEL = {};
COMMUNITY_REPORT_RESOLUTION_ACTIONS.forEach((row) => {
  ACTION_LABEL[row.value] = row.label;
});

const STATUS_LABEL = {};
COMMUNITY_REPORT_STATUS_OPTIONS.forEach((row) => {
  STATUS_LABEL[row.value] = row.label;
});

const formatSlaRemaining = (minutesSinceCreated) => {
  if (typeof minutesSinceCreated !== 'number') return '';
  const remaining = COMMUNITY_SLA_THRESHOLDS.BREACH_MINUTES - minutesSinceCreated;
  if (remaining <= 0) return '24h 초과';
  const hours = Math.floor(remaining / 60);
  const mins = remaining % 60;
  return `SLA ${hours}h ${mins}m 남음`;
};

const slaClassName = (minutesSinceCreated) => {
  if (typeof minutesSinceCreated !== 'number') return 'admin-cm__sla';
  if (minutesSinceCreated >= COMMUNITY_SLA_THRESHOLDS.BREACH_MINUTES) return 'admin-cm__sla admin-cm__sla--danger';
  if (minutesSinceCreated >= COMMUNITY_SLA_THRESHOLDS.WARN_MINUTES) return 'admin-cm__sla admin-cm__sla--warn';
  return 'admin-cm__sla';
};

const AdminCommunityModerationPage = () => {
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const loadList = useCallback(async() => {
    setLoading(true);
    try {
      const params = statusFilter === 'ALL' ? {} : { status: statusFilter };
      const response = await StandardizedApi.get(ADMIN_COMMUNITY_API.REPORTS, params);
      const data = response?.data ?? response;
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setItems([]);
      showToast?.({ type: 'error', message: '신고 큐를 불러오지 못했습니다.' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleResolve = async(item, action) => {
    if (busyId === item.id) return;
    setBusyId(item.id);
    try {
      const status = action === 'NONE' ? 'REJECTED' : 'RESOLVED';
      await StandardizedApi.patch(ADMIN_COMMUNITY_API.reportPatch(item.id), {
        status,
        action,
        note: null
      });
      showToast?.({ type: 'success', message: '신고가 처리되었습니다.' });
      loadList();
    } catch (error) {
      showToast?.({ type: 'error', message: '처리에 실패했습니다.' });
    } finally {
      setBusyId(null);
    }
  };

  const renderActions = (item) => {
    if (item.status === 'RESOLVED' || item.status === 'REJECTED') {
      return (
        <div className="admin-cm__resolved-meta">
          <span>{STATUS_LABEL[item.status]}</span>
          {item.resolutionAction && item.resolutionAction !== 'NONE' ? (
            <span> · {ACTION_LABEL[item.resolutionAction] || item.resolutionAction}</span>
          ) : null}
          {item.resolvedByDisplay ? <span> · {item.resolvedByDisplay}</span> : null}
        </div>
      );
    }
    return (
      <div className="admin-cm__actions">
        <button
          type="button"
          className="admin-cm__btn admin-cm__btn--hide"
          onClick={() => handleResolve(item, 'HIDE_CONTENT')}
          disabled={busyId === item.id}
          data-testid={`admin-cm-hide-${item.id}`}
        >
          콘텐츠 숨김
        </button>
        <button
          type="button"
          className="admin-cm__btn admin-cm__btn--delete"
          onClick={() => handleResolve(item, 'DELETE_CONTENT')}
          disabled={busyId === item.id}
          data-testid={`admin-cm-delete-${item.id}`}
        >
          콘텐츠 삭제
        </button>
        <button
          type="button"
          className="admin-cm__btn admin-cm__btn--reject"
          onClick={() => handleResolve(item, 'NONE')}
          disabled={busyId === item.id}
          data-testid={`admin-cm-reject-${item.id}`}
        >
          기각
        </button>
      </div>
    );
  };

  const filterTabs = useMemo(() => FILTER_TABS, []);

  return (
    <section className="admin-cm" data-testid="admin-community-moderation-page">
      <header className="admin-cm__header">
        <div>
          <h1 className="admin-cm__title">커뮤니티 신고 처리</h1>
          <p className="admin-cm__subtitle">Apple App Store 1.2 — UGC 안전장치</p>
        </div>
        <button
          type="button"
          className="admin-cm__refresh"
          onClick={loadList}
          disabled={loading}
          data-testid="admin-cm-refresh"
        >
          새로고침
        </button>
      </header>
      <nav className="admin-cm__filters" data-testid="admin-cm-filters">
        {filterTabs.map((tab) => (
          <button
            key={tab.value || tab.key || 'ALL'}
            type="button"
            className={`admin-cm__filter${statusFilter === (tab.value || 'ALL') ? ' admin-cm__filter--active' : ''}`}
            onClick={() => setStatusFilter(tab.value || 'ALL')}
            data-testid={`admin-cm-filter-${tab.value || 'ALL'}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {loading ? (
        <div className="admin-cm__empty">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="admin-cm__empty" data-testid="admin-cm-empty">신고 항목이 없습니다.</div>
      ) : (
        <ul className="admin-cm__list" data-testid="admin-cm-list">
          {items.map((item) => (
            <li className="admin-cm__card" key={item.id} data-testid={`admin-cm-card-${item.id}`}>
              <div className="admin-cm__card-top">
                <span className={slaClassName(item.minutesSinceCreated)}>
                  {formatSlaRemaining(item.minutesSinceCreated)}
                </span>
                <span className="admin-cm__status">{STATUS_LABEL[item.status] || item.status}</span>
                {item.priority === 'AUTO_QUARANTINE' ? (
                  <span className="admin-cm__priority admin-cm__priority--auto">자동 격리</span>
                ) : null}
                {item.postHidden ? (
                  <span className="admin-cm__priority admin-cm__priority--hidden">숨김</span>
                ) : null}
              </div>
              <div className="admin-cm__meta">
                <span>사유: <strong>{item.reasonCode}</strong></span>
                <span>신고자: {item.reporterDisplay || '익명'}</span>
                <span>대상: {item.commentId ? `댓글 #${item.commentId}` : `게시 #${item.postId}`}</span>
              </div>
              <h2 className="admin-cm__post-title">{item.postTitle}</h2>
              <p className="admin-cm__preview">{item.commentBodyPreview || item.postBodyPreview}</p>
              {item.detailMessage ? (
                <p className="admin-cm__detail"><strong>신고 노트:</strong> {item.detailMessage}</p>
              ) : null}
              {renderActions(item)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default AdminCommunityModerationPage;
