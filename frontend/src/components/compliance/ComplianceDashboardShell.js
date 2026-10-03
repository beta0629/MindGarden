import AdminCommonLayout from '../layout/AdminCommonLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import { SettingsButton, SettingsPageShell } from '../admin/settings-shell';
import { useTranslation } from 'react-i18next';

/**
 * 컴플라이언스 대시보드 공통 레이아웃 래퍼
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @param {string} props.titleId
 * @param {boolean} props.refreshDisabled
 * @param {() => void} props.onRefresh
 * @param {boolean} [props.loading]
 * @param {string} [props.loadingText]
 */
export function ComplianceDashboardShell({
  children,
  titleId,
  refreshDisabled,
  onRefresh,
  loading = false,
  loadingText = '컴플라이언스 데이터를 불러오는 중...'
}) {
  const { t } = useTranslation();
  return (
    <AdminCommonLayout title="컴플라이언스 관리">
      <SettingsPageShell
        title="컴플라이언스 모니터링"
        titleId={titleId}
        ariaLabel="컴플라이언스 관리 본문"
        actions={(
          <SettingsButton
            type="button"
            variant="ghost"
            onClick={onRefresh}
            disabled={refreshDisabled}
            preventDoubleClick
          >
            {t('admin.actions.refresh')}
          </SettingsButton>
        )}
      >
        {loading ? (
          <div className="mg-v2-loading-container" role="status" aria-live="polite" aria-busy="true">
            <UnifiedLoading type="inline" text={loadingText} />
          </div>
        ) : (
          <div className="mg-v2-compliance-dashboard">
            {children}
          </div>
        )}
      </SettingsPageShell>
    </AdminCommonLayout>
  );
}
