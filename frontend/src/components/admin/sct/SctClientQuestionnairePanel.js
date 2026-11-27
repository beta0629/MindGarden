/**
 * 내담자 상세 — 질문지 탭/패널
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import StatusBadge from '../../common/StatusBadge';
import UnifiedLoading from '../../common/UnifiedLoading';
import UnifiedModal from '../../common/modals/UnifiedModal';
import { formatDate } from '../../../utils/common';
import notificationManager from '../../../utils/notification';
import { toDisplayString } from '../../../utils/safeDisplay';
import { resolveUserFacingApiErrorMessage } from '../../../utils/userFacingApiErrorMessage';
import { RoleUtils, USER_ROLES } from '../../../constants/roles';
import { useSession } from '../../../contexts/SessionContext';
import {
  cancelSctInvitation,
  destroySctInvitation,
  fetchSctClientInvitations,
  fetchSctInvitation,
  reissueSctInviteLink
} from '../../../utils/sctApi';
import SctPublicLinkCopy from './SctPublicLinkCopy';
import useSctFeatureEnabled from '../../../hooks/useSctFeatureEnabled';
import {
  SCT_CSS,
  SCT_FORM_TYPE_LABEL,
  SCT_STATUS,
  SCT_STATUS_LABEL,
  SCT_TEST_ID,
  SCT_UI
} from '../../../constants/sctOnline';
import SctSendSheet from './SctSendSheet';
import './sctAdmin.css';

const SCT_DATE_DISPLAY_FORMAT = 'YYYY.MM.DD';
const SCT_DATE_EMPTY = '—';

/**
 * SCT 초대 행 날짜 — YYYY.MM.DD (공통 formatDate).
 * @param {string|number|Date|null|undefined} iso
 * @returns {string}
 */
const formatSctInviteDate = (iso) => {
  if (!iso) return SCT_DATE_EMPTY;
  const formatted = formatDate(iso, SCT_DATE_DISPLAY_FORMAT);
  return formatted || SCT_DATE_EMPTY;
};

/**
 * 공개 링크 복사·재발급 UI — ADMIN·CONSULTANT만 (STAFF 임상 본문 403 정합).
 *
 * @param {object|null|undefined} user
 * @returns {boolean}
 */
const canUseSctPublicLinkUi = (user) => (
  RoleUtils.isAdmin(user) || RoleUtils.hasRole(user, USER_ROLES.CONSULTANT)
);

/**
 * @param {{ client: object }} props
 */
const SctClientQuestionnairePanel = ({ client }) => {
  const { user } = useSession();
  const isAdmin = RoleUtils.isAdmin(user);
  const canPublicLink = canUseSctPublicLinkUi(user);
  const { enabled, loading: flagLoading } = useSctFeatureEnabled();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendOpen, setSendOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [destroyTarget, setDestroyTarget] = useState(null);
  const [destroyBusy, setDestroyBusy] = useState(false);
  const [reissuedUrl, setReissuedUrl] = useState('');

  const clientId = client?.id;

  const reload = useCallback(async() => {
    if (!clientId || !enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchSctClientInvitations(clientId);
      setList(rows);
    } catch (e) {
      notificationManager.show(
        resolveUserFacingApiErrorMessage(e, SCT_UI.LOAD_FAIL),
        'error'
      );
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [clientId, enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const summary = useMemo(() => {
    const counts = {
      [SCT_STATUS.SENT]: 0,
      [SCT_STATUS.DRAFT]: 0,
      [SCT_STATUS.SUBMITTED]: 0,
      [SCT_STATUS.EXPIRED]: 0
    };
    list.forEach((row) => {
      if (counts[row.status] != null) counts[row.status] += 1;
    });
    return counts;
  }, [list]);

  const hasActiveDraft = list.some(
    (r) => r.status === SCT_STATUS.SENT || r.status === SCT_STATUS.DRAFT
  );

  const handleDestroy = async() => {
    if (!destroyTarget?.id) return;
    setDestroyBusy(true);
    try {
      await destroySctInvitation(destroyTarget.id);
      notificationManager.success(SCT_UI.DESTROY_SUCCESS);
      setDestroyTarget(null);
      setDetail(null);
      reload();
    } catch (e) {
      notificationManager.show(
        resolveUserFacingApiErrorMessage(e, SCT_UI.LOAD_FAIL),
        'error'
      );
    } finally {
      setDestroyBusy(false);
    }
  };

  if (flagLoading) {
    return <UnifiedLoading type="inline" text={SCT_UI.LOADING} />;
  }

  if (!enabled) {
    return null;
  }

  return (
    <section
      className={SCT_CSS.ADMIN}
      data-testid={SCT_TEST_ID.ADMIN_TAB}
      aria-label={SCT_UI.TAB_QUESTIONNAIRE}
    >
      <div className="mg-v2-sct-admin__head">
        <h3 className="mg-v2-sct-top__title">{SCT_UI.TAB_QUESTIONNAIRE}</h3>
        <MGButton
          type="button"
          variant="primary"
          preventDoubleClick={false}
          onClick={() => setSendOpen(true)}
        >
          {SCT_UI.SEND}
        </MGButton>
      </div>

      <div className="mg-v2-sct-admin__summary" aria-label="요약">
        <article>
          <span className="lab lab-m">{SCT_UI.SUMMARY_SENT}</span>
          <strong>{summary[SCT_STATUS.SENT]}</strong>
        </article>
        <article>
          <span className="lab lab-m">{SCT_UI.SUMMARY_DRAFT}</span>
          <strong>{summary[SCT_STATUS.DRAFT]}</strong>
        </article>
        <article>
          <span className="lab lab-m">{SCT_UI.SUMMARY_SUBMITTED}</span>
          <strong>{summary[SCT_STATUS.SUBMITTED]}</strong>
        </article>
        <article>
          <span className="lab lab-m">{SCT_UI.SUMMARY_EXPIRED}</span>
          <strong>{summary[SCT_STATUS.EXPIRED]}</strong>
        </article>
      </div>

      {loading ? (
        <UnifiedLoading type="inline" text={SCT_UI.LOADING} />
      ) : (
        <div className="mg-v2-sct-admin__list">
          {list.length === 0 ? (
            <p className={SCT_CSS.CAPTION}>보낸 질문지가 없습니다.</p>
          ) : (
            list.map((row) => (
              <article key={row.id} className="mg-v2-sct-admin__row">
                <div className="mg-v2-sct-admin__row-line1">
                  <span className="mg-v2-sct-admin__row-title">
                    <SafeText>
                      {SCT_FORM_TYPE_LABEL[row.formType] || row.formType}
                    </SafeText>
                  </span>
                  <div className="mg-v2-sct-admin__row-badges">
                    <StatusBadge status={row.status}>
                      {SCT_STATUS_LABEL[row.status] || row.status}
                    </StatusBadge>
                    {row.destroyEligible ? (
                      <span
                        className="mg-v2-sct-tag mg-v2-sct-tag--danger"
                        data-testid={SCT_TEST_ID.DESTROY_BADGE}
                      >
                        {SCT_UI.DESTROY_ELIGIBLE}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="mg-v2-sct-admin__row-meta">
                  {row.managementNo ? (
                    <span
                      className="mg-v2-sct-admin__row-meta-item"
                      data-testid={SCT_TEST_ID.MANAGEMENT_NO}
                    >
                      {SCT_UI.MANAGEMENT_NO}
                      {': '}
                      <SafeText>{row.managementNo}</SafeText>
                    </span>
                  ) : null}
                  <span className="mg-v2-sct-admin__row-meta-item">
                    <SafeText>
                      {toDisplayString(row.maskedPhone || row.maskedEmail, SCT_DATE_EMPTY)}
                    </SafeText>
                  </span>
                  <span className="mg-v2-sct-admin__row-dates">
                    {formatSctInviteDate(row.sentAt)}
                    ~
                    {formatSctInviteDate(row.tokenExpiresAt)}
                  </span>
                </div>
                <div className="mg-v2-sct-admin__row-actions">
                  {row.status === SCT_STATUS.SUBMITTED ? (
                    <MGButton
                      type="button"
                      variant="outline"
                      size="small"
                      preventDoubleClick={false}
                      onClick={async() => {
                        try {
                          const d = await fetchSctInvitation(row.id);
                          setDetail(d);
                        } catch (e) {
                          notificationManager.show(
                            resolveUserFacingApiErrorMessage(e, SCT_UI.LOAD_FAIL),
                            'error'
                          );
                        }
                      }}
                    >
                      열람
                    </MGButton>
                  ) : null}
                  {isAdmin && row.destroyEligible ? (
                    <MGButton
                      type="button"
                      variant="danger"
                      size="small"
                      preventDoubleClick={false}
                      data-testid={SCT_TEST_ID.DESTROY_BTN}
                      onClick={() => setDestroyTarget(row)}
                    >
                      {SCT_UI.DESTROY}
                    </MGButton>
                  ) : null}
                  {canPublicLink
                    && (row.status === SCT_STATUS.SENT || row.status === SCT_STATUS.DRAFT) ? (
                    <MGButton
                      type="button"
                      variant="outline"
                      size="small"
                      preventDoubleClick={false}
                      onClick={async() => {
                        try {
                          const refreshed = await reissueSctInviteLink(row.id);
                          if (refreshed?.publicUrl) {
                            setReissuedUrl(refreshed.publicUrl);
                            notificationManager.success(SCT_UI.REISSUE_SUCCESS);
                          }
                          reload();
                        } catch (e) {
                          notificationManager.show(
                            resolveUserFacingApiErrorMessage(e, SCT_UI.LOAD_FAIL),
                            'error'
                          );
                        }
                      }}
                    >
                      {SCT_UI.REISSUE_LINK}
                    </MGButton>
                  ) : null}
                  {row.status === SCT_STATUS.SENT || row.status === SCT_STATUS.DRAFT ? (
                    <MGButton
                      type="button"
                      variant="ghost"
                      size="small"
                      preventDoubleClick={false}
                      onClick={async() => {
                        try {
                          await cancelSctInvitation(row.id);
                          notificationManager.success(SCT_UI.CANCEL_SUCCESS);
                          reload();
                        } catch (e) {
                          notificationManager.show(
                            resolveUserFacingApiErrorMessage(e, SCT_UI.LOAD_FAIL),
                            'error'
                          );
                        }
                      }}
                    >
                      {SCT_UI.CANCEL}
                    </MGButton>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {detail?.answers?.length ? (
        <section className="mg-v2-sct-session__body" aria-label="응답 본문">
          <h4>제출 응답</h4>
          {detail.managementNo ? (
            <p className={SCT_CSS.CAPTION}>
              {SCT_UI.MANAGEMENT_NO}
              {': '}
              <SafeText>{detail.managementNo}</SafeText>
            </p>
          ) : null}
          <ul>
            {detail.answers.map((a) => (
              <li key={a.formItemId || a.itemNo} className="mg-v2-sct-sent">
                <span>{a.itemNo}</span>
                <p>
                  <span className="st"><SafeText>{a.promptText}</SafeText></span>
                  {' '}
                  {a.notApplicable ? (
                    <span className="mg-v2-sct-tag">{SCT_UI.NA_BADGE}</span>
                  ) : a.isBlank || !a.answerText ? (
                    <span className="mg-v2-sct-tag">{SCT_UI.BLANK_BADGE}</span>
                  ) : (
                    <span className="an"><SafeText>{a.answerText}</SafeText></span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {canPublicLink && reissuedUrl ? (
        <SctPublicLinkCopy publicUrl={reissuedUrl} className="mg-v2-sct-admin__reissue-link" />
      ) : null}

      <SctSendSheet
        isOpen={sendOpen}
        onClose={() => setSendOpen(false)}
        client={client}
        hasActiveDraft={hasActiveDraft}
        onSent={reload}
      />

      <UnifiedModal
        isOpen={Boolean(destroyTarget)}
        onClose={() => (!destroyBusy ? setDestroyTarget(null) : null)}
        title={SCT_UI.DESTROY_CONFIRM_TITLE}
        size="small"
        actions={(
          <>
            <MGButton
              type="button"
              variant="outline"
              preventDoubleClick={false}
              disabled={destroyBusy}
              onClick={() => setDestroyTarget(null)}
            >
              {SCT_UI.CANCEL}
            </MGButton>
            <MGButton
              type="button"
              variant="danger"
              preventDoubleClick={false}
              loading={destroyBusy}
              onClick={handleDestroy}
            >
              {SCT_UI.DESTROY}
            </MGButton>
          </>
        )}
      >
        <p>{SCT_UI.DESTROY_CONFIRM_BODY}</p>
        {destroyTarget?.managementNo ? (
          <p className={SCT_CSS.CAPTION}>
            {SCT_UI.MANAGEMENT_NO}
            {': '}
            <SafeText>{destroyTarget.managementNo}</SafeText>
          </p>
        ) : null}
      </UnifiedModal>
    </section>
  );
};

SctClientQuestionnairePanel.propTypes = {
  client: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    phone: PropTypes.string,
    email: PropTypes.string,
    name: PropTypes.string
  })
};

export default SctClientQuestionnairePanel;
