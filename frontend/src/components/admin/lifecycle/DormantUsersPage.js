/**
 * 어드민 휴면 사용자 관리 페이지 — Phase 4 (정책서 §10.9 + §10.12).
 *
 * 라우트: /admin/lifecycle/dormant-users (App.js 등록 필요).
 * 4 endpoint 와 통신:
 *   - GET    /api/v1/admin/lifecycle/dormant-users
 *   - GET    /api/v1/admin/lifecycle/dormant-users/{userId}
 *   - POST   /api/v1/admin/lifecycle/dormant-users/{userId}/reactivate
 *   - DELETE /api/v1/admin/lifecycle/dormant-users/{userId}
 *
 * @author Core Solution
 * @since 2026-06-06
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import ContentArea from '../../dashboard-v2/content/ContentArea';
import ContentHeader from '../../dashboard-v2/content/ContentHeader';
import DormantUsersList from './DormantUsersList';
import DormantUserDetail from './DormantUserDetail';
import ReactivateUserModal from './ReactivateUserModal';
import ForceAnonymizeUserModal from './ForceAnonymizeUserModal';
import {
  fetchDormantUsers,
  fetchDormantUserDetail,
  reactivateDormantUser,
  forceAnonymizeDormantUser
} from './dormantUsersApi';
import { useToast } from '../../../contexts/ToastContext';
import { toErrorMessage } from '../../../utils/safeDisplay';
import '../../../styles/unified-design-tokens.css';
import '../AdminDashboard/AdminDashboardB0KlA.css';

const PAGE_SIZE = 20;
const PAGE_TITLE_ID = 'dormant-users-page-title';

const extractPage = (response) => {
  if (response && response.data && typeof response.data === 'object'
      && Array.isArray(response.data.content)) {
    return response.data;
  }
  if (response && Array.isArray(response.content)) {
    return response;
  }
  return null;
};

const extractDetail = (response) => {
  if (response && response.data && typeof response.data === 'object') {
    return response.data;
  }
  return response;
};

const DormantUsersPage = () => {
  const { t } = useTranslation('admin');
  const toast = useToast?.() ?? null;

  const [pageNumber, setPageNumber] = useState(0);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [detailUser, setDetailUser] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const [reactivateTarget, setReactivateTarget] = useState(null);
  const [reactivateLoading, setReactivateLoading] = useState(false);

  const [forceAnonymizeTarget, setForceAnonymizeTarget] = useState(null);
  const [forceAnonymizeLoading, setForceAnonymizeLoading] = useState(false);

  const loadList = useCallback(async (targetPage = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchDormantUsers({
        page: targetPage, size: PAGE_SIZE
      });
      const extracted = extractPage(response);
      setPage(extracted);
      setPageNumber(targetPage);
    } catch (e) {
      setError(toErrorMessage(e,
        t('lifecycle.dormantUsers.error.load',
          '휴면 사용자 목록을 불러오지 못했습니다.')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadList(0);
  }, [loadList]);

  const handleChangePage = useCallback((next) => {
    if (typeof next !== 'number' || next < 0) return;
    loadList(next);
  }, [loadList]);

  const handleViewDetail = useCallback(async (row) => {
    setDetailUser(row);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const response = await fetchDormantUserDetail(row.userId);
      setDetail(extractDetail(response));
    } catch (e) {
      setDetailError(toErrorMessage(e,
        t('lifecycle.dormantUsers.error.loadDetail',
          '휴면 사용자 상세 정보를 불러오지 못했습니다.')));
    } finally {
      setDetailLoading(false);
    }
  }, [t]);

  const handleCloseDetail = useCallback(() => {
    setDetailUser(null);
    setDetail(null);
    setDetailError(null);
  }, []);

  const handleOpenReactivate = useCallback((row) => {
    setReactivateTarget(row);
  }, []);

  const handleConfirmReactivate = useCallback(async (row) => {
    if (!row) return;
    setReactivateLoading(true);
    try {
      await reactivateDormantUser(row.userId);
      if (toast?.showToast) {
        toast.showToast({
          type: 'success',
          message: t('lifecycle.dormantUsers.success.reactivate',
            '휴면 사용자가 활성 상태로 복귀했습니다.')
        });
      }
      setReactivateTarget(null);
      await loadList(pageNumber);
    } catch (e) {
      const message = toErrorMessage(e,
        t('lifecycle.dormantUsers.error.reactivate',
          '휴면 사용자 복귀 처리에 실패했습니다.'));
      if (toast?.showToast) {
        toast.showToast({ type: 'error', message });
      }
    } finally {
      setReactivateLoading(false);
    }
  }, [loadList, pageNumber, t, toast]);

  const handleOpenForceAnonymize = useCallback((row) => {
    setForceAnonymizeTarget(row);
  }, []);

  const handleConfirmForceAnonymize = useCallback(async (row) => {
    if (!row) return;
    setForceAnonymizeLoading(true);
    try {
      await forceAnonymizeDormantUser(row.userId);
      if (toast?.showToast) {
        toast.showToast({
          type: 'success',
          message: t('lifecycle.dormantUsers.success.forceAnonymize',
            '휴면 사용자가 즉시 익명화되었습니다.')
        });
      }
      setForceAnonymizeTarget(null);
      await loadList(pageNumber);
    } catch (e) {
      const message = toErrorMessage(e,
        t('lifecycle.dormantUsers.error.forceAnonymize',
          '휴면 사용자 즉시 익명화 처리에 실패했습니다.'));
      if (toast?.showToast) {
        toast.showToast({ type: 'error', message });
      }
    } finally {
      setForceAnonymizeLoading(false);
    }
  }, [loadList, pageNumber, t, toast]);

  const pageTitle = t('lifecycle.dormantUsers.pageTitle', '휴면 사용자 관리');
  const pageSubtitle = t('lifecycle.dormantUsers.pageSubtitle',
    '1년 비활성 사용자(DORMANT)의 4년 안정 보관 진행 상태를 확인하고 강제 복귀 또는 즉시 익명화할 수 있습니다.');

  return (
    <AdminCommonLayout title={pageTitle} loading={loading}>
      <div className="mg-v2-ad-b0kla" data-testid="dormant-users-page">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel={pageTitle}>
            <ContentHeader
              title={pageTitle}
              subtitle={pageSubtitle}
              titleId={PAGE_TITLE_ID}
            />
            <main aria-labelledby={PAGE_TITLE_ID}>
              <DormantUsersList
                page={page}
                loading={loading}
                error={error}
                onChangePage={handleChangePage}
                onViewDetail={handleViewDetail}
                onReactivate={handleOpenReactivate}
                onForceAnonymize={handleOpenForceAnonymize}
              />
            </main>
          </ContentArea>
        </div>
      </div>

      <DormantUserDetail
        isOpen={!!detailUser}
        onClose={handleCloseDetail}
        detail={detail}
        loading={detailLoading}
        error={detailError}
      />

      <ReactivateUserModal
        isOpen={!!reactivateTarget}
        onClose={() => setReactivateTarget(null)}
        onConfirm={handleConfirmReactivate}
        user={reactivateTarget}
        loading={reactivateLoading}
      />

      <ForceAnonymizeUserModal
        isOpen={!!forceAnonymizeTarget}
        onClose={() => setForceAnonymizeTarget(null)}
        onConfirm={handleConfirmForceAnonymize}
        user={forceAnonymizeTarget}
        loading={forceAnonymizeLoading}
      />
    </AdminCommonLayout>
  );
};

export default DormantUsersPage;
