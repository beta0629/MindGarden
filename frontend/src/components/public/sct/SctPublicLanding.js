/**
 * SCT 공개 랜딩 — invite / expired / submitted / reissued (시안 landing.html)
 *
 * @author MindGarden
 * @since 2026-11-27
 */

import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  formatSctExpiryUntil,
  formatSctKoreanDateTime,
  toSctTelHref
} from '../../../utils/sctInviteDisplay';
import {
  SCT_FORM_TYPE,
  SCT_FORM_TYPE_LABEL,
  SCT_TEST_ID,
  SCT_UI
} from '../../../constants/sctOnline';
import mindgardenMark from '../../../assets/mindgarden-mark.svg';
import './sctPublicLanding.css';

export const SCT_LANDING_KIND = Object.freeze({
  INVITE: 'invite',
  EXPIRED: 'expired',
  SUBMITTED: 'submitted',
  REISSUED: 'reissued'
});

const FORM_TARGET = Object.freeze({
  [SCT_FORM_TYPE.ADULT]: '19세 이상',
  [SCT_FORM_TYPE.ADOLESCENT]: '중·고등학생',
  [SCT_FORM_TYPE.CHILD]: '초등학생'
});

/**
 * @param {string} formType
 * @returns {string}
 */
const formTitleOf = (formType) => {
  const label = SCT_FORM_TYPE_LABEL[formType] || '';
  return label ? `${label} 문장완성 질문지` : SCT_UI.TITLE;
};

/**
 * @param {'check'|'clock'|'alert'} kind
 * @returns {JSX.Element}
 */
const StateIcon = ({ kind }) => {
  if (kind === 'check') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    );
  }
  if (kind === 'clock') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <circle cx="12" cy="16.5" r=".7" fill="currentColor" />
    </svg>
  );
};

StateIcon.propTypes = {
  kind: PropTypes.oneOf(['check', 'clock', 'alert']).isRequired
};

/**
 * @param {{ officePhone?: string|null, mobilePhone?: string|null }} props
 * @returns {JSX.Element}
 */
const HelpChapter = ({ officePhone, mobilePhone }) => {
  const officeHref = toSctTelHref(officePhone);
  const mobileHref = toSctTelHref(mobilePhone);
  const hasAny = Boolean(officeHref || mobileHref);

  return (
    <section className="mg-v2-sct-lp-chap" aria-label={SCT_UI.LANDING_HELP_02}>
      <div className="mg-v2-sct-lp-chap__h">
        <span className="n">02</span>
        {SCT_UI.LANDING_HELP_02}
      </div>
      <div className="mg-v2-sct-lp-tel-stack">
        {officeHref ? (
          <a
            className="mg-v2-sct-lp-tel"
            href={officeHref}
            data-testid={SCT_TEST_ID.LANDING_TEL_OFFICE}
          >
            <div>
              <b><SafeText>{officePhone}</SafeText></b>
              <small>{SCT_UI.LANDING_OFFICE_HINT}</small>
            </div>
            <span className="go">{SCT_UI.LANDING_TEL_GO}</span>
          </a>
        ) : null}
        {mobileHref ? (
          <a
            className="mg-v2-sct-lp-tel"
            href={mobileHref}
            data-testid={SCT_TEST_ID.LANDING_TEL_MOBILE}
          >
            <div>
              <b><SafeText>{mobilePhone}</SafeText></b>
              <small>{SCT_UI.LANDING_MOBILE_HINT}</small>
            </div>
            <span className="go">{SCT_UI.LANDING_TEL_GO}</span>
          </a>
        ) : null}
        {!hasAny ? (
          <p className="mg-v2-sct-lp-tel-empty">{SCT_UI.LANDING_CONTACT_EMPTY}</p>
        ) : null}
      </div>
      <p className="mg-v2-sct-lp-privacy">{SCT_UI.LANDING_PRIVACY_NOTE}</p>
    </section>
  );
};

HelpChapter.propTypes = {
  officePhone: PropTypes.string,
  mobilePhone: PropTypes.string
};

/**
 * @param {{
 *   kind: 'invite'|'expired'|'submitted'|'reissued',
 *   meta: object,
 *   resumed?: boolean,
 *   onStart?: () => void
 * }} props
 * @returns {JSX.Element}
 */
const SctPublicLanding = ({ kind, meta, resumed = false, onStart }) => {
  const formType = meta?.formType || SCT_FORM_TYPE.ADULT;
  const isChild = formType === SCT_FORM_TYPE.CHILD;
  const formTitle = toDisplayString(meta?.title, formTitleOf(formType));
  const target = FORM_TARGET[formType] || '';
  const kindLabel = SCT_FORM_TYPE_LABEL[formType] || formType;
  const recipientName = toDisplayString(meta?.recipientName, '');
  const officePhone = typeof meta?.officePhone === 'string' ? meta.officePhone.trim() : '';
  const mobilePhone = typeof meta?.mobilePhone === 'string' ? meta.mobilePhone.trim() : '';
  const officeHref = toSctTelHref(officePhone);
  const isClosed = kind === SCT_LANDING_KIND.EXPIRED || kind === SCT_LANDING_KIND.REISSUED;
  const isErrState = kind !== SCT_LANDING_KIND.INVITE;
  const expiryLabel = formatSctExpiryUntil(meta?.tokenExpiresAt);
  const expiryPlain = formatSctKoreanDateTime(meta?.tokenExpiresAt);
  const submittedLabel = formatSctKoreanDateTime(meta?.submittedAt);

  const coverSub = isClosed
    ? [formTitle, target].filter(Boolean).join(' · ')
    : [formTitle, target, SCT_UI.LANDING_DURATION].filter(Boolean).join(' · ');

  const coverFoot = isClosed
    ? SCT_UI.EXPIRED_COVER_FOOT
    : SCT_UI.LANDING_COVER_FOOT;

  let stateBadge = '';
  let stateTagCls = '';
  let stateIconKind = 'clock';
  let stateIconCls = '';
  let stateTitle = '';
  let stateLead = '';
  let stateRows = [];

  if (kind === SCT_LANDING_KIND.EXPIRED) {
    stateBadge = SCT_UI.EXPIRED_BADGE;
    stateTagCls = 'is-exp';
    stateIconKind = 'clock';
    stateTitle = SCT_UI.EXPIRED_TITLE;
    stateLead = expiryPlain
      ? `${expiryPlain}까지 열려 있던 링크입니다. ${SCT_UI.EXPIRED_BODY}`
      : SCT_UI.EXPIRED_BODY;
    stateRows = [
      [SCT_UI.FORM_KIND, formTitle],
      [SCT_UI.LANDING_DEADLINE_LABEL, expiryPlain || '—'],
      officePhone ? [SCT_UI.LANDING_OFFICE_LABEL, officePhone] : null
    ].filter(Boolean);
  } else if (kind === SCT_LANDING_KIND.SUBMITTED) {
    stateBadge = SCT_UI.ALREADY_BADGE;
    stateTagCls = 'is-done';
    stateIconKind = 'check';
    stateIconCls = 'is-done';
    stateTitle = SCT_UI.ALREADY_TITLE;
    stateLead = SCT_UI.ALREADY_BODY;
    stateRows = [
      [SCT_UI.FORM_KIND, formTitle],
      [SCT_UI.LANDING_SUBMITTED_LABEL, submittedLabel || '—'],
      officePhone ? [SCT_UI.LANDING_OFFICE_LABEL, officePhone] : null
    ].filter(Boolean);
  } else if (kind === SCT_LANDING_KIND.REISSUED) {
    stateBadge = SCT_UI.REISSUED_BADGE;
    stateTagCls = 'is-err';
    stateIconKind = 'alert';
    stateIconCls = 'is-err';
    stateTitle = SCT_UI.REISSUED_TITLE;
    stateLead = SCT_UI.REISSUED_BODY;
    stateRows = [
      [SCT_UI.FORM_KIND, formTitle],
      ['안내', SCT_UI.REISSUED_HINT],
      officePhone ? [SCT_UI.LANDING_OFFICE_LABEL, officePhone] : null
    ].filter(Boolean);
  }

  const callCtaLabel = officePhone
    ? `${kind === SCT_LANDING_KIND.SUBMITTED ? SCT_UI.LANDING_ASK_CENTER : SCT_UI.LANDING_CALL_CENTER} (${officePhone})`
    : SCT_UI.LANDING_CONTACT_EMPTY;

  const callCta = officeHref ? (
    <a className="mg-v2-sct-lp-btn mg-v2-sct-lp-btn--pri mg-v2-sct-lp-btn--lg" href={officeHref}>
      {callCtaLabel}
    </a>
  ) : (
    <span className="mg-v2-sct-lp-btn mg-v2-sct-lp-btn--lg is-muted">{SCT_UI.LANDING_CONTACT_EMPTY}</span>
  );

  const inviteCtaDesk = (
    <div className="mg-v2-sct-lp-cta-desk">
      <MGButton
        type="button"
        variant="primary"
        preventDoubleClick={false}
        className="mg-v2-sct-lp-btn--lg"
        onClick={onStart}
      >
        {resumed ? SCT_UI.RESUME : SCT_UI.START}
      </MGButton>
      {officeHref ? (
        <a className="mg-v2-sct-lp-btn mg-v2-sct-lp-btn--lg" href={officeHref}>
          {`문의 ${officePhone}`}
        </a>
      ) : null}
    </div>
  );

  return (
    <div className="mg-v2-sct-lp" data-testid={SCT_TEST_ID.LANDING} data-landing-kind={kind}>
      <section className="mg-v2-sct-lp-cover" aria-label={SCT_UI.TITLE}>
        <div className="mg-v2-sct-lp-cover__top">
          <div className="mg-v2-sct-lp-brand-row">
            <img className="mg-v2-sct-lp-brand-mark" src={mindgardenMark} alt="" />
            <div>
              <span className="mg-v2-sct-lp-brand-name">{SCT_UI.BRAND}</span>
              <span className="mg-v2-sct-lp-brand-sub">{SCT_UI.LANDING_BRAND_SUB}</span>
            </div>
          </div>
          <h1 className="mg-v2-sct-lp-h">
            {isErrState ? (
              SCT_UI.LANDING_COVER_SUB_CLOSED
            ) : (
              <>
                마음을 꺼내 놓는
                <br />
                문장완성 질문지
              </>
            )}
          </h1>
          <p className="mg-v2-sct-lp-sub">{coverSub || kindLabel}</p>
          {isClosed ? null : (
            <div className="mg-v2-sct-lp-paper" aria-hidden="true">
              <span className="stem">{SCT_UI.LANDING_RULE_STEM}</span>
              <span className="caret" />
            </div>
          )}
        </div>
        <p className="mg-v2-sct-lp-cover-foot">{coverFoot}</p>
      </section>

      <main className="mg-v2-sct-lp-main">
        {isErrState ? (
          <section className="mg-v2-sct-lp-card mg-v2-sct-lp-card--state" aria-label="질문지 상태">
            <div className="mg-v2-sct-lp-card__top">
              <div className="mg-v2-sct-lp-brand-pill">
                <img src={mindgardenMark} alt="" />
                <span>{SCT_UI.BRAND}</span>
              </div>
              <span className={`mg-v2-sct-lp-tag ${stateTagCls}`}>{stateBadge}</span>
            </div>
            <span className={`mg-v2-sct-lp-state-icon ${stateIconCls}`} aria-hidden="true">
              <StateIcon kind={stateIconKind} />
            </span>
            <div>
              <h2 className="mg-v2-sct-lp-to">{stateTitle}</h2>
              <p className="mg-v2-sct-lp-state-lead">{stateLead}</p>
            </div>
            <dl className="mg-v2-sct-lp-kv">
              {stateRows.map(([k, v]) => (
                <React.Fragment key={k}>
                  <dt>{k}</dt>
                  <dd><SafeText>{v}</SafeText></dd>
                </React.Fragment>
              ))}
            </dl>
            <div className="mg-v2-sct-lp-cta-desk">{callCta}</div>
          </section>
        ) : (
          <section className="mg-v2-sct-lp-card" aria-label="초대 안내">
            <div className="mg-v2-sct-lp-card__top">
              <div className="mg-v2-sct-lp-brand-pill">
                <img src={mindgardenMark} alt="" />
                <span>{SCT_UI.BRAND}</span>
              </div>
              <span className="mg-v2-sct-lp-tag">{SCT_UI.LANDING_TAG}</span>
            </div>
            <div>
              <h2 className="mg-v2-sct-lp-to">
                {recipientName
                  ? `${recipientName} ${SCT_UI.LANDING_INVITE_TO}`
                  : formTitle}
              </h2>
              <p className="mg-v2-sct-lp-form-title">
                {formTitle}
                {target ? ` (${target})` : ''}
              </p>
            </div>
            <dl className="mg-v2-sct-lp-kv">
              <dt>{SCT_UI.LANDING_DURATION_LABEL}</dt>
              <dd>{SCT_UI.LANDING_DURATION}</dd>
              <dt>{SCT_UI.EXPIRES}</dt>
              <dd>{expiryLabel || '—'}</dd>
              <dt>{SCT_UI.LANDING_SAVE_LABEL}</dt>
              <dd>{SCT_UI.LANDING_SAVE_VALUE}</dd>
            </dl>
            {resumed ? (
              <p className="mg-v2-sct-lp-resume" data-testid={SCT_TEST_ID.CAPTION}>
                {SCT_UI.RESUME_HINT}
                {' · '}
                {SCT_UI.RESUME_CAP}
              </p>
            ) : null}
            <div className="mg-v2-sct-lp-id-note">
              <b>{SCT_UI.LANDING_ID_NOTE_TITLE}</b>
              {isChild ? SCT_UI.LANDING_ID_NOTE_CHILD : SCT_UI.LANDING_ID_NOTE_ADULT}
            </div>
            {inviteCtaDesk}
          </section>
        )}

        <div className="mg-v2-sct-lp-body">
          <div className={isErrState ? undefined : 'mg-v2-sct-lp-grid2'}>
            {isErrState ? null : (
              <section className="mg-v2-sct-lp-chap" aria-label={SCT_UI.LANDING_STEPS_01}>
                <div className="mg-v2-sct-lp-chap__h">
                  <span className="n">01</span>
                  {SCT_UI.LANDING_STEPS_01}
                </div>
                <ol className="mg-v2-sct-lp-steps">
                  <li>
                    <span className="n">1</span>
                    <div>
                      {SCT_UI.LANDING_STEP1_TITLE}
                      <small>{SCT_UI.LANDING_STEP1_BODY}</small>
                    </div>
                  </li>
                  <li>
                    <span className="n">2</span>
                    <div>
                      {SCT_UI.LANDING_STEP2_TITLE}
                      <small>
                        {isChild ? SCT_UI.LANDING_STEP2_BODY_CHILD : SCT_UI.LANDING_STEP2_BODY}
                      </small>
                    </div>
                  </li>
                  <li>
                    <span className="n">3</span>
                    <div>
                      {SCT_UI.LANDING_STEP3_TITLE}
                      <small>{SCT_UI.LANDING_STEP3_BODY}</small>
                    </div>
                  </li>
                </ol>
              </section>
            )}
            <HelpChapter officePhone={officePhone} mobilePhone={mobilePhone} />
          </div>
          <p className="mg-v2-sct-lp-notice">{SCT_UI.LANDING_NOTICE}</p>
        </div>
      </main>

      <div
        className="mg-v2-sct-lp-mbar"
        data-testid={isErrState ? undefined : SCT_TEST_ID.THUMB_BAR}
      >
        {isErrState ? (
          callCta
        ) : (
          <MGButton
            type="button"
            variant="primary"
            preventDoubleClick={false}
            className="mg-v2-sct-lp-btn--lg"
            data-testid={SCT_TEST_ID.LANDING_START}
            onClick={onStart}
          >
            {resumed ? SCT_UI.RESUME : SCT_UI.START}
          </MGButton>
        )}
      </div>
    </div>
  );
};

SctPublicLanding.propTypes = {
  kind: PropTypes.oneOf(Object.values(SCT_LANDING_KIND)).isRequired,
  meta: PropTypes.object,
  resumed: PropTypes.bool,
  onStart: PropTypes.func
};

export default SctPublicLanding;
