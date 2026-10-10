/**
 * 상담일지 읽기 전용 상세. 데스크톱은 표 옆, 그 아래 폭은 시트.
 *
 * @author CoreSolution
 * @since 2026-10-10
 */

import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import ConsultationLogStatusBadge from './ConsultationLogStatusBadge';
import UnifiedLoading from '../../common/UnifiedLoading';
import {
  CONSULTATION_LOG_MEDIA_DESKTOP_UP,
  useMediaQuery
} from './useConsultationLogMedia';
import './ConsultationLogDetailPanel.css';

const ConsultationLogDetailPanel = ({
  titleId,
  labels,
  dateText,
  sessionText,
  clientName,
  consultantName,
  done,
  writtenAt,
  summary,
  content,
  loading,
  onClose,
  onEdit,
  returnFocusId
}) => {
  const panelRef = useRef(null);
  const isDesktop = useMediaQuery(CONSULTATION_LOG_MEDIA_DESKTOP_UP);
  const isModalSheet = !isDesktop;

  useEffect(() => {
    const node = panelRef.current?.querySelector('h2, button');
    if (node && typeof node.focus === 'function') {
      node.focus();
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') {
        return;
      }
      event.preventDefault();
      onClose();
      const trigger = returnFocusId ? document.getElementById(returnFocusId) : null;
      if (trigger && typeof trigger.focus === 'function') {
        trigger.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, returnFocusId]);

  const closeLabel = isModalSheet ? labels.back : labels.close;

  return (
    <aside
      ref={panelRef}
      className={`mg-v2-consultation-log-detail${isModalSheet ? ' mg-v2-consultation-log-detail--sheet' : ''}`}
      aria-labelledby={titleId}
      role={isModalSheet ? 'dialog' : undefined}
      aria-modal={isModalSheet ? 'true' : undefined}
    >
      <header className="mg-v2-consultation-log-detail__header">
        <MGButton
          type="button"
          variant="ghost"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'ghost',
            size: 'sm',
            loading: false,
            className: 'mg-v2-consultation-log-detail__back'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onClose}
          aria-label={closeLabel}
          preventDoubleClick={false}
        >
          {isModalSheet ? labels.back : labels.close}
        </MGButton>
        <h2 id={titleId} className="mg-v2-consultation-log-detail__title" tabIndex={-1}>
          {labels.title}
        </h2>
      </header>
      <dl className="mg-v2-consultation-log-detail__meta">
        <div>
          <dt>{labels.date}</dt>
          <dd>{dateText}</dd>
        </div>
        {sessionText ? (
          <div>
            <dt>{labels.session}</dt>
            <dd>{sessionText}</dd>
          </div>
        ) : null}
        <div>
          <dt>{labels.client}</dt>
          <dd>{clientName}</dd>
        </div>
        <div>
          <dt>{labels.consultant}</dt>
          <dd>{consultantName}</dd>
        </div>
        <div>
          <dt>{labels.status}</dt>
          <dd>
            <ConsultationLogStatusBadge
              done={done}
              doneLabel={labels.done}
              pendingLabel={labels.pending}
            />
          </dd>
        </div>
        {writtenAt ? (
          <div>
            <dt>{labels.writtenAt}</dt>
            <dd>{writtenAt}</dd>
          </div>
        ) : null}
      </dl>
      <section className="mg-v2-consultation-log-detail__body">
        <h3>{labels.summary}</h3>
        <p>{summary}</p>
        <h3>{labels.content}</h3>
        {loading ? (
          <UnifiedLoading type="inline" variant="pulse" text={labels.loading} label={labels.loading} />
        ) : (
          <p className="mg-v2-consultation-log-detail__content">{content}</p>
        )}
      </section>
      <footer className="mg-v2-consultation-log-detail__footer">
        <MGButton
          type="button"
          variant="primary"
          size="medium"
          className={buildErpMgButtonClassName({
            variant: 'primary',
            size: 'md',
            loading: false,
            className: 'mg-v2-consultation-log-detail__edit'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onEdit}
          preventDoubleClick={false}
        >
          {labels.edit}
        </MGButton>
      </footer>
    </aside>
  );
};

ConsultationLogDetailPanel.propTypes = {
  titleId: PropTypes.string.isRequired,
  labels: PropTypes.shape({
    title: PropTypes.string.isRequired,
    close: PropTypes.string.isRequired,
    back: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    session: PropTypes.string.isRequired,
    client: PropTypes.string.isRequired,
    consultant: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    writtenAt: PropTypes.string.isRequired,
    summary: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    edit: PropTypes.string.isRequired,
    done: PropTypes.string.isRequired,
    pending: PropTypes.string.isRequired,
    loading: PropTypes.string.isRequired
  }).isRequired,
  dateText: PropTypes.string,
  sessionText: PropTypes.string,
  clientName: PropTypes.string,
  consultantName: PropTypes.string,
  done: PropTypes.bool,
  writtenAt: PropTypes.string,
  summary: PropTypes.string,
  content: PropTypes.string,
  loading: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  returnFocusId: PropTypes.string
};

ConsultationLogDetailPanel.defaultProps = {
  dateText: '',
  sessionText: '',
  clientName: '',
  consultantName: '',
  done: false,
  writtenAt: '',
  summary: '',
  content: '',
  loading: false,
  returnFocusId: ''
};

export default ConsultationLogDetailPanel;
