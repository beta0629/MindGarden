import React from 'react';
import SafeText from '../../common/SafeText';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import MGButton from '../../common/MGButton';
import { toDisplayString } from '../../../utils/safeDisplay';
import { renderConsultationLogKeywordHighlight } from '../utils/renderConsultationLogKeywordHighlight';

const TRIGGER_ID = 'consultation-log-accordion-precautions-trigger';
const PANEL_ID = 'consultation-log-accordion-precautions-panel';

/**
 * 상담 시 주의사항 아코디언 패널
 * @param {Object} props
 * @param {boolean} props.expanded
 * @param {function(boolean): void} props.onExpandedChange
 * @param {Array<{source: string, text: string}>} props.importantComments
 */
const ConsultationLogPrecautionsPanel = ({ expanded, onExpandedChange, importantComments = [] }) => (
  <div className="mg-accordion-item mg-v2-consultation-log-modal__precautions-panel">
    <MGButton
      type="button"
      variant="outline"
      className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false, className: 'mg-accordion-header' })}
      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
      id={TRIGGER_ID}
      aria-expanded={expanded}
      aria-controls={PANEL_ID}
      onClick={() => onExpandedChange(!expanded)}
      preventDoubleClick={false}
    >
      <span className="mg-accordion-title mg-flex mg-v2-items-center mg-v2-gap-sm">
        상담 시 주의사항
      </span>
      <span className={`mg-accordion-icon${expanded ? ' open' : ''}`} aria-hidden="true">
        ▼
      </span>
    </MGButton>
    <section
      id={PANEL_ID}
      className={`mg-accordion-content${expanded ? ' open' : ''}`}
      aria-labelledby={TRIGGER_ID}
    >
      <div className="mg-accordion-body">
        {importantComments.length === 0 ? (
          <p className="mg-v2-text-sm mg-v2-text-secondary mg-v2-m-0">주의사항 없음</p>
        ) : (
          <ul className="mg-v2-consultation-log-modal__precaution-list">
            {importantComments.map((item, idx) => (
              <li
                key={`${toDisplayString(item.source)}-${idx}`}
                className="mg-v2-consultation-log-modal__precaution-item"
              >
                <span className="mg-v2-consultation-log-modal__precaution-source">
                  [<SafeText tag="span">{item.source}</SafeText>]
                </span>{' '}
                {typeof item.text === 'string'
                  ? renderConsultationLogKeywordHighlight(item.text)
                  : <SafeText>{item.text}</SafeText>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  </div>
);

export default ConsultationLogPrecautionsPanel;
