import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';

/**
 * 컴플라이언스 대시보드 공통 레이아웃 래퍼
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @param {string} props.sectionSubtitle
 * @param {string} props.titleId
 * @param {boolean} props.refreshDisabled
 * @param {() => void} props.onRefresh
 */
export function ComplianceDashboardShell({
  children,
  sectionSubtitle,
  titleId,
  refreshDisabled,
  onRefresh
}) {
  return (
    <AdminCommonLayout title="컴플라이언스 관리">
      <div className="mg-v2-ad-b0kla">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel="컴플라이언스 관리 본문">
            <ContentHeader
              title="컴플라이언스 모니터링"
              subtitle={sectionSubtitle}
              titleId={titleId}
              actions={(
                <MGButton
                  type="button"
                  variant="outline"
                  size="small"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'sm',
                    loading: false
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={onRefresh}
                  disabled={refreshDisabled}
                >
                  새로고침
                </MGButton>
              )}
            />
            <main
              aria-labelledby={titleId}
              className="mg-v2-compliance-dashboard"
            >
              {children}
            </main>
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
}
