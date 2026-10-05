/**
 * 수동 발송 작업 진행 모달 (Organism). 성공·실패·남은 인원을 보여 준다(조회는 부모의 폴링 훅).
 *
 * @author MindGarden
 * @since 2026-10-05
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsButton, SettingsNotice } from '../settings-shell';
import UnifiedModal from '../../common/modals/UnifiedModal';
import { toDisplayString } from '../../../utils/safeDisplay';

const MODAL_CLASS = 'mg-manual-notif-progress';
const DRY_RUN = 'DRY_RUN';

/**
 * @param {{ isOpen: boolean, job: (object|null), pollError: (Error|null), onClose: function }} props
 */
const ManualNotificationJobProgressModal = ({ isOpen, job, pollError, onClose }) => {
  const { t } = useTranslation('admin');
  const total = Number(job?.totalCount ?? 0);
  const sent = Number(job?.sentCount ?? 0);
  const failed = Number(job?.failedCount ?? 0) + Number(job?.skippedCount ?? 0);
  const remaining = Number(job?.remainingCount ?? Math.max(0, total - sent - failed));
  const status = job?.status || 'PENDING';

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('manualNotification.job.progressTitle')}
      subtitle={t('manualNotification.job.progressSubtitle')}
      size="medium"
      actions={(
        <SettingsButton type="button" variant="outline" preventDoubleClick onClick={onClose}>
          {t('manualNotification.job.close')}
        </SettingsButton>
      )}
    >
      <div className={MODAL_CLASS} aria-live="polite">
        {job?.providerMode === DRY_RUN && (
          <SettingsNotice tone="warning">{t('manualNotification.job.providerDryRun')}</SettingsNotice>
        )}
        {pollError && (
          <SettingsNotice tone="warning" role="alert">{t('manualNotification.job.pollError')}</SettingsNotice>
        )}
        <p className={`${MODAL_CLASS}__status`}>
          {t(`manualNotification.job.status.${status}`, { defaultValue: toDisplayString(status, '-') })}
        </p>
        <progress className={`${MODAL_CLASS}__bar`} max={Math.max(total, 1)} value={sent + failed} />
        <p data-testid="manual-notif-job-progress">
          {t('manualNotification.job.progressStats', { total, sent, failed, remaining })}
        </p>
      </div>
    </UnifiedModal>
  );
};

export default ManualNotificationJobProgressModal;
