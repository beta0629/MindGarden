import { useCallback, useId } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import UnifiedLoading from '../../common/UnifiedLoading';
import '../../dashboard-v2/content/ContentHeader.css';
import ErpPageShell from '../shell/ErpPageShell';
import ErpButton from '../common/ErpButton';
import { buildErpApprovalHubPath } from './erpApprovalHubRoutes';
import '../../admin/AdminDashboard/AdminDashboardB0KlA.css';
import '../ErpCommon.css';
import '../ApprovalDashboard.css';

/** @typedef {'admin' | 'super'} ApprovalHubMode */

/**
 * ERP 승인 허브 공통 레이아웃 — ErpPageShell 슬롯 (헤더·탭·본문).
 * LNB/GNB는 ErpApprovalHub의 AdminCommonLayout에서 담당한다.
 *
 * @param {Object} props
 * @param {string} props.headerTitle 페이지 헤더 제목
 * @param {string} [props.headerSubtitle] 부제
 * @param {boolean} props.loading true일 때 본문에 인라인 로딩만 표시하고 children은 렌더하지 않음
 * @param {string} props.loadingText 인라인 로딩 시 표시 문구 (UnifiedLoading text)
 * @param {boolean} [props.refreshing=false] 헤더 새로고침 등 무음 재조회 중
 * @param {() => void} props.onRefresh 목록 새로고침
 * @param {ApprovalHubMode} props.activeMode 현재 모드 (세그먼트 강조)
 * @param {boolean} [props.showModeSwitcher=true] 일반/상위 승인 전환 바 표시
 * @param {React.ReactNode} props.children loading이 false일 때만 렌더되는 메인 본문
 * @returns {React.ReactElement}
 */
const ApprovalHubLayout = ({
  headerTitle,
  headerSubtitle,
  loading,
  loadingText,
  refreshing = false,
  onRefresh,
  activeMode,
  showModeSwitcher = true,
  children
}) => {
  const navigate = useNavigate();
  const titleId = useId();

  const goAdmin = useCallback(() => {
    navigate(buildErpApprovalHubPath('admin'));
  }, [navigate]);

  const goSuper = useCallback(() => {
    navigate(buildErpApprovalHubPath('super'));
  }, [navigate]);

  const isAdminActive = activeMode === 'admin';
  const isSuperActive = activeMode === 'super';

  const headerSlot = (
    <div className="mg-v2-content-header">
      <div className="mg-v2-content-header__left">
        {headerTitle ? (
          <h1 id={titleId} className="mg-v2-content-header__title">
            {headerTitle}
          </h1>
        ) : null}
        {headerSubtitle ? (
          <p className="mg-v2-content-header__subtitle">{headerSubtitle}</p>
        ) : null}
      </div>
      <div className="mg-v2-content-header__right">
        <ErpButton
          variant="primary"
          onClick={onRefresh}
          disabled={loading || refreshing}
          aria-busy={refreshing}
        >
          <RefreshCw
            size={16}
            aria-hidden
            className={refreshing ? 'erp-refresh-icon--spin' : undefined}
          />
          새로고침
        </ErpButton>
      </div>
    </div>
  );

  const tabsSlot = showModeSwitcher ? (
    <div className="approval-hub-mode-wrap">
      <div className="mg-v2-financial-refund-hub">
        <div className="mg-v2-ad-b0kla__pill-toggle" role="tablist" aria-label="승인 구역 전환">
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
      </div>
    </div>
  ) : null;

  return (
    <ErpPageShell
      className="approval-dashboard-container"
      headerSlot={headerSlot}
      tabsSlot={tabsSlot}
      mainAriaLabel="승인 허브 본문"
    >
      <section
        className={`approval-hub-main-region${loading ? ' approval-hub-main-region--loading' : ''}`}
        aria-labelledby={titleId}
        aria-busy={loading || refreshing}
      >
        {loading ? (
          <UnifiedLoading type="inline" text={loadingText} />
        ) : (
          children
        )}
      </section>
    </ErpPageShell>
  );
};

ApprovalHubLayout.propTypes = {
  headerTitle: PropTypes.string.isRequired,
  headerSubtitle: PropTypes.string,
  /** true면 본문에 인라인 로딩만 표시, children은 렌더하지 않음 */
  loading: PropTypes.bool.isRequired,
  /** 인라인 로딩 시 UnifiedLoading에 전달되는 문구 */
  loadingText: PropTypes.string.isRequired,
  refreshing: PropTypes.bool,
  onRefresh: PropTypes.func.isRequired,
  activeMode: PropTypes.oneOf(['admin', 'super']).isRequired,
  showModeSwitcher: PropTypes.bool,
  /** loading이 false일 때만 렌더 */
  children: PropTypes.node
};

export default ApprovalHubLayout;
