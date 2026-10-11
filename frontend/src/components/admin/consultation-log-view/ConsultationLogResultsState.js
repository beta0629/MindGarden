/**
 * 상담일지 조회 결과의 불러오는 중·없음·실패.
 *
 * @author CoreSolution
 * @since 2026-10-10
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Inbox, Info } from 'lucide-react';
import EmptyState from '../../common/EmptyState';
import UnifiedLoading from '../../common/UnifiedLoading';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';

const ICON_SIZE_CLASS = 'mg-v2-consultation-log-state__icon';

const ConsultationLogResultsState = ({
  phase,
  loadingTitle,
  loadingDesc,
  emptyTitle,
  emptyDesc,
  emptyActionLabel,
  errorTitle,
  errorDesc,
  errorActionLabel,
  onReset,
  onRetry
}) => {
  if (phase === 'loading') {
    return (
      <div className="mg-v2-consultation-log-state" aria-busy="true">
        <UnifiedLoading
          type="inline"
          variant="pulse"
          text={loadingTitle}
          label={loadingTitle}
        />
        <p className="mg-v2-consultation-log-state__desc">{loadingDesc}</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="mg-v2-consultation-log-state" role="alert">
        <EmptyState
          icon={<Info className={ICON_SIZE_CLASS} aria-hidden="true" />}
          title={errorTitle}
          description={errorDesc}
          action={(
            <MGButton
              type="button"
              variant="outline"
              size="medium"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'md',
                loading: false
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={onRetry}
              preventDoubleClick={false}
            >
              {errorActionLabel}
            </MGButton>
          )}
        />
      </div>
    );
  }

  return (
    <div className="mg-v2-consultation-log-state" role="status">
      <EmptyState
        icon={<Inbox className={ICON_SIZE_CLASS} aria-hidden="true" />}
        title={emptyTitle}
        description={emptyDesc}
        action={(
          <MGButton
            type="button"
            variant="outline"
            size="medium"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'md',
              loading: false
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={onReset}
            preventDoubleClick={false}
          >
            {emptyActionLabel}
          </MGButton>
        )}
      />
    </div>
  );
};

ConsultationLogResultsState.propTypes = {
  phase: PropTypes.oneOf(['loading', 'empty', 'error']).isRequired,
  loadingTitle: PropTypes.string.isRequired,
  loadingDesc: PropTypes.string.isRequired,
  emptyTitle: PropTypes.string.isRequired,
  emptyDesc: PropTypes.string.isRequired,
  emptyActionLabel: PropTypes.string.isRequired,
  errorTitle: PropTypes.string.isRequired,
  errorDesc: PropTypes.string.isRequired,
  errorActionLabel: PropTypes.string.isRequired,
  onReset: PropTypes.func,
  onRetry: PropTypes.func
};

export default ConsultationLogResultsState;
