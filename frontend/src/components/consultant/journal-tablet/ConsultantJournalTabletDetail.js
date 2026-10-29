/**
 * 상담사 웹 태블릿 일지 상세 — 읽기 전용 stone read-out · 목록+수정 ghost
 * 저장/완료 primary 금지. CUD/API 변경 없음.
 *
 * @author CoreSolution
 * @since 2026-10-28
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import UnifiedLoading from '../../common/UnifiedLoading';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../utils/safeDisplay';
import { CONSULTANT_SUITE_NS } from '../../../constants/consultantSuite';
import {
  CONSULTANT_JOURNAL_TABLET_CLASS as C,
  CONSULTANT_JOURNAL_TABLET_TEST_ID
} from './consultantJournalTabletConstants';
import './ConsultantJournalTabletDetail.css';

const EMPTY_DASH = '—';

const ConsultantJournalTabletDetail = ({
  clientName,
  dateText,
  sessionText,
  methodText,
  placeText,
  done,
  summary,
  content,
  nextPlan,
  loading,
  onBackToList,
  onEdit
}) => {
  const { t } = useTranslation(CONSULTANT_SUITE_NS);
  const name = toDisplayString(clientName, t('records.unassignedClient'));
  const summaryText = toDisplayString(summary, EMPTY_DASH);
  const contentText = toDisplayString(content, EMPTY_DASH);
  const planText = toDisplayString(nextPlan, '');

  return (
    <div
      className={C.DETAIL}
      data-testid={CONSULTANT_JOURNAL_TABLET_TEST_ID.DETAIL}
      role="region"
      aria-label={t('journalTablet.detailAria')}
    >
      <div className={C.DETAIL_STAGE}>
        <div className={C.DETAIL_LAYOUT}>
          <section className={C.DETAIL_SUMMARY} aria-label={t('journalTablet.summaryAria')}>
            <SafeText tag="h2" className={C.DETAIL_NAME}>{name}</SafeText>
            <dl className={C.DETAIL_META}>
              <dt>{t('journalTablet.metaDate')}</dt>
              <dd>{toDisplayString(dateText, EMPTY_DASH)}</dd>
              {sessionText ? (
                <>
                  <dt>{t('journalTablet.metaSession')}</dt>
                  <dd>{sessionText}</dd>
                </>
              ) : null}
              {methodText ? (
                <>
                  <dt>{t('journalTablet.metaMethod')}</dt>
                  <dd>{methodText}</dd>
                </>
              ) : null}
              {placeText ? (
                <>
                  <dt>{t('journalTablet.metaPlace')}</dt>
                  <dd>{placeText}</dd>
                </>
              ) : null}
            </dl>
            <span className={C.DETAIL_STATUS}>
              {done ? t('journalTablet.badgeDone') : t('journalTablet.badgePending')}
            </span>
          </section>

          <section className={C.DETAIL_BODY} aria-label={t('journalTablet.bodyAria')}>
            <h3 className={C.DETAIL_SEC_TITLE}>{t('journalTablet.recordTitle')}</h3>
            {loading ? (
              <UnifiedLoading
                type="inline"
                variant="pulse"
                text={t('journalTablet.loading')}
                label={t('journalTablet.loading')}
              />
            ) : (
              <>
                <div className={C.DETAIL_BLOCK}>
                  <span className={C.DETAIL_LAB}>{t('journalTablet.fieldSummary')}</span>
                  <div className={C.DETAIL_RO}>{summaryText}</div>
                </div>
                <div className={C.DETAIL_BLOCK}>
                  <span className={C.DETAIL_LAB}>{t('journalTablet.fieldContent')}</span>
                  <div className={C.DETAIL_RO}>{contentText}</div>
                </div>
                {planText ? (
                  <div className={C.DETAIL_BLOCK}>
                    <span className={C.DETAIL_LAB}>{t('journalTablet.fieldNextPlan')}</span>
                    <div className={C.DETAIL_RO}>{planText}</div>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>
      </div>

      <div className={C.DETAIL_ACTIONS} role="group" aria-label={t('journalTablet.actionsAria')}>
        <MGButton
          type="button"
          variant="outline"
          size="medium"
          className={buildErpMgButtonClassName({
            variant: 'outline',
            size: 'md',
            loading: false,
            className: `${C.DETAIL_BTN} ${C.DETAIL_BTN_LIST}`
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onBackToList}
          preventDoubleClick={false}
        >
          {t('journalTablet.actionList')}
        </MGButton>
        <MGButton
          type="button"
          variant="outline"
          size="medium"
          className={buildErpMgButtonClassName({
            variant: 'outline',
            size: 'md',
            loading: false,
            className: `${C.DETAIL_BTN} ${C.DETAIL_BTN_EDIT}`
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onEdit}
          preventDoubleClick={false}
        >
          {t('journalTablet.actionEdit')}
        </MGButton>
      </div>
    </div>
  );
};

ConsultantJournalTabletDetail.propTypes = {
  clientName: PropTypes.string,
  dateText: PropTypes.string,
  sessionText: PropTypes.string,
  methodText: PropTypes.string,
  placeText: PropTypes.string,
  done: PropTypes.bool,
  summary: PropTypes.string,
  content: PropTypes.string,
  nextPlan: PropTypes.string,
  loading: PropTypes.bool,
  onBackToList: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired
};

ConsultantJournalTabletDetail.defaultProps = {
  clientName: '',
  dateText: '',
  sessionText: '',
  methodText: '',
  placeText: '',
  done: false,
  summary: '',
  content: '',
  nextPlan: '',
  loading: false
};

export default ConsultantJournalTabletDetail;
