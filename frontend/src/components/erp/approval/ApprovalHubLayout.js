import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import UnifiedLoading from '../../common/UnifiedLoading';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import { ContentHeader, ContentArea } from '../../dashboard-v2/content';
import ErpButton from '../common/ErpButton';
import { buildErpApprovalHubPath } from './erpApprovalHubRoutes';
import '../../admin/AdminDashboard/AdminDashboardB0KlA.css';
import '../ErpCommon.css';
import '../ApprovalDashboard.css';

/** @typedef {'admin' | 'super'} ApprovalHubMode */

/**
 * ERP 승인 허브 공통 레이아웃 (헤더·필터 리듬·모드 전환 준비)
 *
 * @param {Object} props
 * @param {string} props.layoutTitle AdminCommonLayout 제목
 * @param {string} props.headerTitle ContentHeader 제목
 * @param {string} [props.headerSubtitle] ContentHeader 부제
 * @param {boolean} props.loading
 * @param {string} props.loadingText
 * @param {() => void} props.onRefresh 목록 새로고침
 * @param {ApprovalHubMode} props.activeMode 현재 모드 (세그먼트 강조)
 * @param {boolean} [props.showModeSwitcher=true] 일반/상위 승인 전환 바 표시
 * @param {React.ReactNode} props.children ContentArea 내부
 * @returns {React.ReactElement}
 */
const ApprovalHubLayout = ({
  layoutTitle,
  headerTitle,
  headerSubtitle,
  loading,
  loadingText,
  onRefresh,
  activeMode,
  showModeSwitcher = true,
  children
}) => {
  const navigate = useNavigate();

  const goAdmin = useCallback(() => {
    navigate(buildErpApprovalHubPath('admin'));
  }, [navigate]);

  const goSuper = useCallback(() => {
    navigate(buildErpApprovalHubPath('super'));
  }, [navigate]);

  if (loading) {
    return (
      <AdminCommonLayout title={layoutTitle}>
        <UnifiedLoading type="page" text={loadingText} />
      </AdminCommonLayout>
    );
  }

  const isAdminActive = activeMode === 'admin';
  const isSuperActive = activeMode === 'super';

  return (
    <AdminCommonLayout title={layoutTitle}>
      <ContentHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        actions={
          <ErpButton
            variant="primary"
            onClick={onRefresh}
          >
            <RefreshCw size={16} aria-hidden />
            새로고침
          </ErpButton>
        }
      />
      {showModeSwitcher && (
        <div className="approval-hub-mode-wrap">
          <nav className="mg-v2-financial-refund-hub" aria-label="승인 구역 전환">
            <div className="mg-v2-ad-b0kla__pill-toggle" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={isAdminActive}
                className={`mg-v2-ad-b0kla__pill ${isAdminActive ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                onClick={goAdmin}
              >
                일반 승인
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isSuperActive}
                className={`mg-v2-ad-b0kla__pill ${isSuperActive ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                onClick={goSuper}
              >
                상위 승인
              </button>
            </div>
          </nav>
        </div>
      )}
      <ContentArea className="approval-dashboard-container">
        {children}
      </ContentArea>
    </AdminCommonLayout>
  );
};

ApprovalHubLayout.propTypes = {
  layoutTitle: PropTypes.string.isRequired,
  headerTitle: PropTypes.string.isRequired,
  headerSubtitle: PropTypes.string,
  loading: PropTypes.bool.isRequired,
  loadingText: PropTypes.string.isRequired,
  onRefresh: PropTypes.func.isRequired,
  activeMode: PropTypes.oneOf(['admin', 'super']).isRequired,
  showModeSwitcher: PropTypes.bool,
  children: PropTypes.node
};

export default ApprovalHubLayout;
