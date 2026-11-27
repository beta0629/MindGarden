/**
 * SCT 공개 응답 페이지 — /public/sct/:token
 * 흐름: 진입 → 본인확인 → (보호자) → 동의 → 문항 → 제출확인 → 완료
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useParams } from 'react-router-dom';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';
import { resolveUserFacingApiErrorMessage } from '../../../utils/userFacingApiErrorMessage';
import {
  fetchSctPublicForm,
  fetchSctPublicMeta,
  saveSctConsent,
  saveSctDraft,
  submitSct,
  verifySctPublic
} from '../../../utils/sctApi';
import {
  clearSctPublicDraft,
  loadSctPublicDraft,
  mergeSctPublicAnswers,
  saveSctPublicDraft
} from '../../../utils/sctPublicDraftStorage';
import { isSctVerifyRequiredError } from '../../../utils/sctPublicVerifyError';
import useSctVisualViewport from '../../../hooks/useSctVisualViewport';
import useSctDraftAutosave, { SCT_SAVE_STATUS } from '../../../hooks/useSctDraftAutosave';
import {
  SCT_CHANNEL,
  SCT_CONSENT_TYPE,
  SCT_CSS,
  SCT_DEFAULTS,
  SCT_FORM_TYPE,
  SCT_FORM_TYPE_LABEL,
  SCT_ITEMS_PER_PAGE,
  SCT_SIGNER_BAND,
  SCT_STATUS,
  SCT_TEST_ID,
  SCT_UI
} from '../../../constants/sctOnline';
import SctThumbBar from './molecules/SctThumbBar';
import SctProgressTicks from './molecules/SctProgressTicks';
import SctQuestionItem from './molecules/SctQuestionItem';
import './sctPublic.css';

const STEP = Object.freeze({
  LOADING: 'LOADING',
  ENTRY: 'ENTRY',
  VERIFY: 'VERIFY',
  GUARDIAN: 'GUARDIAN',
  CONSENT: 'CONSENT',
  ITEMS: 'ITEMS',
  REVIEW: 'REVIEW',
  DONE: 'DONE',
  EXPIRED: 'EXPIRED',
  INVALID_LINK: 'INVALID_LINK',
  ALREADY: 'ALREADY',
  ERROR: 'ERROR'
});

const formatExpiry = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return toDisplayString(iso, '—');
    return d.toLocaleString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return toDisplayString(iso, '—');
  }
};

/**
 * @returns {JSX.Element}
 */
const SctPublicPage = () => {
  const { token } = useParams();
  const rootRef = useRef(null);
  useSctVisualViewport(rootRef);

  const [step, setStep] = useState(STEP.LOADING);
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [verifySessionId, setVerifySessionId] = useState('');
  const [channel, setChannel] = useState(SCT_CHANNEL.PHONE);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [busy, setBusy] = useState(false);

  const [consentStatus, setConsentStatus] = useState(null);
  const [sensitiveAgreed, setSensitiveAgreed] = useState(false);
  const [instructionRead, setInstructionRead] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [childNameConfirm, setChildNameConfirm] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('');
  const [guardianAgreed, setGuardianAgreed] = useState(false);

  const [answersMap, setAnswersMap] = useState({});
  const [pageIndex, setPageIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pendingSubmitAfterVerify, setPendingSubmitAfterVerify] = useState(false);
  const pendingSubmitRef = useRef(false);

  const formType = meta?.formType || form?.formType || SCT_FORM_TYPE.ADULT;
  const isChild = formType === SCT_FORM_TYPE.CHILD;
  const perPage = SCT_ITEMS_PER_PAGE[formType] || SCT_ITEMS_PER_PAGE.ADULT;
  const items = form?.items || [];

  const answersByItemNo = useMemo(() => {
    const map = {};
    Object.values(answersMap).forEach((a) => {
      const item = items.find((it) => it.formItemId === a.formItemId);
      if (item) map[item.itemNo] = a;
    });
    return map;
  }, [answersMap, items]);

  const { statusText, status, saveNow } = useSctDraftAutosave({
    token,
    verifySessionId,
    answersMap,
    enabled: step === STEP.ITEMS && Boolean(verifySessionId)
  });

  const loadMeta = useCallback(async() => {
    if (!token) {
      setStep(STEP.INVALID_LINK);
      return;
    }
    setBusy(true);
    try {
      const data = await fetchSctPublicMeta(token);
      // 방어: null/빈 메타는 ENTRY 시작 셸로 가지 않음(토큰 존재 여부 비공개)
      if (data == null || typeof data !== 'object' || !data.status) {
        setMeta(null);
        setStep(STEP.INVALID_LINK);
        return;
      }
      setMeta(data);
      if (data.verifyChannelHint === SCT_CHANNEL.EMAIL) {
        setChannel(SCT_CHANNEL.EMAIL);
      } else if (data.verifyChannelHint === SCT_CHANNEL.PHONE) {
        setChannel(SCT_CHANNEL.PHONE);
      }
      if (data.status === SCT_STATUS.SUBMITTED) {
        setStep(STEP.ALREADY);
      } else if (data.status === SCT_STATUS.EXPIRED || data.status === SCT_STATUS.CANCELLED) {
        setStep(STEP.EXPIRED);
      } else {
        setStep(STEP.ENTRY);
      }
    } catch (error) {
      const statusCode = error?.status;
      if (statusCode === 410) {
        setStep(STEP.EXPIRED);
      } else if (statusCode === 404) {
        setStep(STEP.INVALID_LINK);
      } else {
        setErrorMsg(resolveUserFacingApiErrorMessage(error, SCT_UI.LOAD_FAIL));
        setStep(STEP.ERROR);
      }
    } finally {
      setBusy(false);
    }
  }, [token]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    const onFocusIn = (e) => {
      const t = e.target;
      if (!t || (t.tagName !== 'TEXTAREA' && t.tagName !== 'INPUT')) return;
      window.setTimeout(() => {
        t.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, SCT_DEFAULTS.FOCUS_SCROLL_DELAY_MS);
    };
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, []);

  const openVerify = () => setStep(STEP.VERIFY);

  const goToReVerify = useCallback(() => {
    setVerifySessionId('');
    setVerifyError('');
    setStep(STEP.VERIFY);
  }, []);

  /**
   * 본인확인 재개 후 대기 중이던 제출 완료.
   * @param {string} sid
   * @param {Record<string, { formItemId: number, answerText?: string, notApplicable?: boolean }>} mergedAnswers
   */
  const completePendingSubmit = async(sid, mergedAnswers) => {
    const answers = Object.values(mergedAnswers || {})
      .filter((a) => a && a.formItemId != null);
    await saveSctDraft(token, { verifySessionId: sid, answers });
    await submitSct(token, { verifySessionId: sid });
    clearSctPublicDraft(token);
    pendingSubmitRef.current = false;
    setPendingSubmitAfterVerify(false);
    setVerifyError('');
    setStep(STEP.DONE);
  };

  const applyFormAndGoItems = async(sid, consent) => {
    const formData = await fetchSctPublicForm(token, sid);
    setForm(formData);
    if (formData?.consent) {
      setConsentStatus(formData.consent);
    } else if (consent) {
      setConsentStatus(consent);
    }
    const itemsList = formData?.items || [];
    const serverAnswers = {};
    itemsList.forEach((it) => {
      if (it.answerText != null || it.notApplicable) {
        serverAnswers[it.formItemId] = {
          formItemId: it.formItemId,
          answerText: it.answerText || '',
          notApplicable: Boolean(it.notApplicable)
        };
      }
    });
    const localAnswers = loadSctPublicDraft(token);
    const nextAnswers = mergeSctPublicAnswers(serverAnswers, localAnswers);
    setAnswersMap(nextAnswers);
    if (formData?.status === SCT_STATUS.SUBMITTED) {
      setStep(STEP.ALREADY);
      return nextAnswers;
    }
    // 재방문 재개: 첫 미답 문항 페이지, 전부 답했으면 마지막 답 페이지
    const isAnswered = (it) => {
      const a = nextAnswers[it.formItemId] || nextAnswers[String(it.formItemId)];
      if (a?.notApplicable) return true;
      if (a?.answerText && String(a.answerText).trim()) return true;
      return false;
    };
    if (meta?.hasDraft || Object.keys(nextAnswers).length > 0 || itemsList.some(isAnswered)) {
      const firstUnansweredIdx = itemsList.findIndex((it) => !isAnswered(it));
      let resumeIdx = 0;
      if (firstUnansweredIdx >= 0) {
        resumeIdx = firstUnansweredIdx;
      } else if (itemsList.length > 0) {
        let lastAnsweredIdx = 0;
        itemsList.forEach((it, idx) => {
          if (isAnswered(it)) lastAnsweredIdx = idx;
        });
        resumeIdx = lastAnsweredIdx;
      }
      setPageIndex(Math.floor(resumeIdx / perPage));
    } else {
      setPageIndex(0);
    }
    setStep(STEP.ITEMS);
    return nextAnswers;
  };

  const handleVerify = async() => {
    setVerifyError('');
    const body = channel === SCT_CHANNEL.EMAIL
      ? { email: email.trim() }
      : { phone: phone.trim() };
    if ((channel === SCT_CHANNEL.PHONE && !body.phone)
      || (channel === SCT_CHANNEL.EMAIL && !body.email)) {
      setVerifyError(SCT_UI.VALIDATE_REQUIRED);
      return;
    }
    setBusy(true);
    try {
      const res = await verifySctPublic(token, body);
      const sid = res?.verifySessionId;
      if (!sid) {
        setVerifyError(SCT_UI.MISMATCH);
        return;
      }
      setVerifySessionId(sid);
      const consent = res?.consent || null;
      setConsentStatus(consent);
      if (consent?.revoked) {
        setErrorMsg(SCT_UI.LOAD_FAIL);
        setStep(STEP.ERROR);
        return;
      }
      if (consent?.satisfied) {
        const merged = await applyFormAndGoItems(sid, consent);
        if (pendingSubmitRef.current || pendingSubmitAfterVerify) {
          try {
            await completePendingSubmit(sid, merged);
          } catch (submitError) {
            if (isSctVerifyRequiredError(submitError)) {
              saveSctPublicDraft(token, merged);
              pendingSubmitRef.current = true;
              setPendingSubmitAfterVerify(true);
              setVerifyError(SCT_UI.VERIFY_TO_SUBMIT);
              setStep(STEP.REVIEW);
            } else {
              setVerifyError(resolveUserFacingApiErrorMessage(submitError, SCT_UI.LOAD_FAIL));
              setStep(STEP.REVIEW);
            }
          }
        }
        return;
      }
      if (consent?.guardianRequired) {
        setStep(STEP.GUARDIAN);
      } else {
        setStep(STEP.CONSENT);
      }
    } catch (error) {
      setVerifyError(resolveUserFacingApiErrorMessage(error, SCT_UI.MISMATCH));
    } finally {
      setBusy(false);
    }
  };

  const handleGuardianComplete = async() => {
    if (!guardianName.trim() || !guardianRelation.trim() || !guardianAgreed) {
      setVerifyError(SCT_UI.VALIDATE_REQUIRED);
      return;
    }
    setBusy(true);
    try {
      await saveSctConsent(token, {
        verifySessionId,
        consentType: SCT_CONSENT_TYPE.GUARDIAN_UNDER_14,
        agreed: true,
        guardianName: guardianName.trim(),
        guardianRelation: guardianRelation.trim()
      });
      setVerifyError('');
      setStep(STEP.CONSENT);
    } catch (error) {
      setVerifyError(resolveUserFacingApiErrorMessage(error, SCT_UI.VALIDATE_REQUIRED));
    } finally {
      setBusy(false);
    }
  };

  const handleConsentStart = async() => {
    const under14 = Boolean(consentStatus?.requiresGuardian)
      || consentStatus?.signerBand === SCT_SIGNER_BAND.UNDER_14
      || formType === SCT_FORM_TYPE.CHILD;
    const needsSelfSign = Boolean(consentStatus?.selfSignatureRequired) && !under14;
    if (!sensitiveAgreed || !instructionRead) {
      setVerifyError(SCT_UI.VALIDATE_REQUIRED);
      return;
    }
    if (needsSelfSign && !signerName.trim()) {
      setVerifyError(SCT_UI.VALIDATE_REQUIRED);
      return;
    }
    if (under14 && (!guardianName.trim() || !guardianRelation.trim())) {
      setVerifyError(SCT_UI.VALIDATE_REQUIRED);
      return;
    }
    setBusy(true);
    try {
      const payload = {
        verifySessionId,
        consentType: SCT_CONSENT_TYPE.SENSITIVE_INFO,
        agreed: true
      };
      if (under14) {
        payload.guardianName = guardianName.trim();
        payload.guardianRelation = guardianRelation.trim();
        if (childNameConfirm.trim()) {
          payload.childNameConfirm = childNameConfirm.trim();
        }
      } else {
        payload.signerName = signerName.trim();
      }
      await saveSctConsent(token, payload);
      if (under14 && consentStatus?.guardianRequired) {
        await saveSctConsent(token, {
          verifySessionId,
          consentType: SCT_CONSENT_TYPE.GUARDIAN_UNDER_14,
          agreed: true,
          guardianName: guardianName.trim(),
          guardianRelation: guardianRelation.trim()
        });
      }
      setVerifyError('');
      const merged = await applyFormAndGoItems(verifySessionId, { ...consentStatus, satisfied: true });
      if (pendingSubmitRef.current || pendingSubmitAfterVerify) {
        try {
          await completePendingSubmit(verifySessionId, merged);
        } catch (submitError) {
          if (isSctVerifyRequiredError(submitError)) {
            saveSctPublicDraft(token, merged);
            pendingSubmitRef.current = true;
            setPendingSubmitAfterVerify(true);
            setVerifyError(SCT_UI.VERIFY_TO_SUBMIT);
            setStep(STEP.REVIEW);
          } else {
            setVerifyError(resolveUserFacingApiErrorMessage(submitError, SCT_UI.LOAD_FAIL));
            setStep(STEP.REVIEW);
          }
        }
      }
    } catch (error) {
      if (isSctVerifyRequiredError(error)) {
        saveSctPublicDraft(token, answersMap);
        pendingSubmitRef.current = true;
        setPendingSubmitAfterVerify(true);
        setVerifyError(SCT_UI.VERIFY_TO_SUBMIT);
        setStep(STEP.REVIEW);
      } else {
        setVerifyError(resolveUserFacingApiErrorMessage(error, SCT_UI.VALIDATE_REQUIRED));
      }
    } finally {
      setBusy(false);
    }
  };

  const pageItems = useMemo(() => {
    const start = pageIndex * perPage;
    return items.slice(start, start + perPage);
  }, [items, pageIndex, perPage]);

  const pageFrom = pageItems[0]?.itemNo;
  const pageTo = pageItems[pageItems.length - 1]?.itemNo;
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));

  const updateAnswer = (item, next) => {
    setAnswersMap((prev) => ({
      ...prev,
      [item.formItemId]: {
        formItemId: item.formItemId,
        answerText: next.answerText || '',
        notApplicable: Boolean(next.notApplicable)
      }
    }));
  };

  const goPrev = () => {
    if (pageIndex <= 0) {
      setStep(STEP.CONSENT);
      return;
    }
    setPageIndex((p) => p - 1);
  };

  const goNext = async() => {
    await saveNow();
    if (pageIndex >= totalPages - 1) {
      setStep(STEP.REVIEW);
      return;
    }
    setPageIndex((p) => p + 1);
  };

  const handleSubmit = async() => {
    setBusy(true);
    try {
      await saveNow();
      await submitSct(token, { verifySessionId });
      clearSctPublicDraft(token);
      pendingSubmitRef.current = false;
      setPendingSubmitAfterVerify(false);
      setVerifyError('');
      setStep(STEP.DONE);
    } catch (error) {
      if (isSctVerifyRequiredError(error)) {
        saveSctPublicDraft(token, answersMap);
        pendingSubmitRef.current = true;
        setPendingSubmitAfterVerify(true);
        setVerifyError(SCT_UI.VERIFY_TO_SUBMIT);
      } else {
        setVerifyError(resolveUserFacingApiErrorMessage(error, SCT_UI.LOAD_FAIL));
      }
    } finally {
      setBusy(false);
    }
  };

  const isVerifyRequiredUi = pendingSubmitAfterVerify
    || verifyError === SCT_UI.VERIFY_TO_SUBMIT;

  const counts = useMemo(() => {
    let answered = 0;
    let na = 0;
    let blank = 0;
    const blankList = [];
    items.forEach((it) => {
      const a = answersMap[it.formItemId];
      if (a?.notApplicable) {
        na += 1;
        answered += 1;
      } else if (a?.answerText && String(a.answerText).trim()) {
        answered += 1;
      } else {
        blank += 1;
        blankList.push(it.itemNo);
      }
    });
    return { answered, na, blank, blankList };
  }, [answersMap, items]);

  const kindLabel = SCT_FORM_TYPE_LABEL[formType] || formType;
  const appClass = [
    SCT_CSS.APP,
    isChild ? SCT_CSS.APP_CHILD : ''
  ].filter(Boolean).join(' ');

  const renderTop = (sub, showSave) => (
    <header className={SCT_CSS.TOP}>
      <div className="mg-v2-sct-top__row">
        <div className="mg-v2-sct-top__title">
          {SCT_UI.BRAND}
          {sub ? <small>{sub}</small> : null}
        </div>
        {showSave && statusText ? (
          <span
            className={`${SCT_CSS.SAVE}${status === SCT_SAVE_STATUS.SAVING || status === SCT_SAVE_STATUS.OFFLINE ? ` is-${status === SCT_SAVE_STATUS.OFFLINE ? 'offline' : 'saving'}` : ''}`}
            role="status"
          >
            <i aria-hidden="true" />
            {statusText}
          </span>
        ) : null}
      </div>
      {showSave ? (
        <SctProgressTicks
          answersMap={answersByItemNo}
          currentFrom={pageFrom}
          currentTo={pageTo}
        />
      ) : null}
    </header>
  );

  const checkBtn = (checked, onToggle, label) => (
    <div className="mg-v2-sct-check">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
      >
        {checked ? '✓' : ''}
      </button>
      <span>{label}</span>
    </div>
  );

  let body = null;
  let bar = null;

  if (step === STEP.LOADING) {
    body = <p className="mg-v2-sct-lead">{SCT_UI.LOADING}</p>;
  } else if (step === STEP.ERROR) {
    body = <p className="mg-v2-sct-alert" role="alert"><SafeText>{errorMsg}</SafeText></p>;
  } else if (step === STEP.EXPIRED) {
    body = (
      <>
        <h1 className="mg-v2-sct-h1">{SCT_UI.EXPIRED_TITLE}</h1>
        <p className="mg-v2-sct-lead">{SCT_UI.EXPIRED_BODY}</p>
      </>
    );
  } else if (step === STEP.INVALID_LINK) {
    body = (
      <>
        <h1 className="mg-v2-sct-h1">{SCT_UI.INVALID_LINK_TITLE}</h1>
        <p className="mg-v2-sct-lead">{SCT_UI.INVALID_LINK_BODY}</p>
      </>
    );
  } else if (step === STEP.ALREADY) {
    body = (
      <>
        <h1 className="mg-v2-sct-h1">{SCT_UI.ALREADY_TITLE}</h1>
        <p className="mg-v2-sct-lead">{SCT_UI.ALREADY_BODY}</p>
      </>
    );
  } else if (step === STEP.DONE) {
    body = (
      <>
        <h1 className="mg-v2-sct-h1">{SCT_UI.DONE_TITLE}</h1>
        <p className="mg-v2-sct-lead">{SCT_UI.DONE_BODY}</p>
      </>
    );
  } else if (step === STEP.ENTRY) {
    const resumed = Boolean(meta?.hasDraft);
    body = (
      <>
        <section className="mg-v2-sct-cover" aria-label={SCT_UI.TITLE}>
          <div className="mg-v2-sct-cover__brand">{SCT_UI.BRAND}</div>
          <h1 className="mg-v2-sct-cover__h">
            문장완성
            <br />
            질문지
          </h1>
          <p className="mg-v2-sct-caption">
            {kindLabel}
            {' · '}
            {meta?.itemCount || SCT_DEFAULTS.TOTAL_ITEMS}
            문항
          </p>
        </section>
        <section className="mg-v2-sct-sheet" aria-label={resumed ? SCT_UI.RESUME_HINT : SCT_UI.RECEIVER}>
          <div>{resumed ? SCT_UI.RESUME_HINT : `${toDisplayString(meta?.title, SCT_UI.TITLE)}`}</div>
          {resumed ? <SctProgressTicks answersMap={{}} /> : null}
          <dl className="mg-v2-sct-kv">
            <dt>{SCT_UI.FORM_KIND}</dt>
            <dd>{kindLabel}</dd>
            <dt>{SCT_UI.EXPIRES}</dt>
            <dd>{formatExpiry(meta?.tokenExpiresAt)}</dd>
            <dt>저장</dt>
            <dd>{SCT_UI.AUTO_SAVE_HINT}</dd>
          </dl>
          {resumed ? (
            <p className={`${SCT_CSS.CAPTION}`} data-testid={SCT_TEST_ID.CAPTION}>{SCT_UI.RESUME_CAP}</p>
          ) : null}
        </section>
        <section>
          <div className="mg-v2-sct-top__title">{SCT_UI.ENTRY_STEPS_TITLE}</div>
          <ol className="mg-v2-sct-steps">
            <li>
              <span className="n">1</span>
              <div>
                {SCT_UI.STEP_VERIFY}
                <small>문자를 받은 휴대폰 번호를 입력합니다</small>
              </div>
            </li>
            <li>
              <span className="n">2</span>
              <div>
                {SCT_UI.STEP_CONSENT}
                <small>
                  민감정보 수집·이용 동의
                  {meta?.requiresGuardian ? ' · 보호자 동의' : ''}
                </small>
              </div>
            </li>
            <li>
              <span className="n">3</span>
              <div>
                {SCT_UI.STEP_ITEMS}
                <small>
                  한 번에
                  {perPage}
                  문항씩
                </small>
              </div>
            </li>
            <li>
              <span className="n">4</span>
              <div>
                {SCT_UI.STEP_SUBMIT}
                <small>제출한 뒤에는 상담 때 함께 살펴봅니다</small>
              </div>
            </li>
          </ol>
          <p className="mg-v2-sct-notice mg-v2-sct-foot">
            {toDisplayString(meta?.title, SCT_UI.TITLE)}
          </p>
        </section>
      </>
    );
    bar = (
      <SctThumbBar
        primaryLabel={resumed ? SCT_UI.RESUME : SCT_UI.START}
        onPrimary={openVerify}
      />
    );
  } else if (step === STEP.VERIFY) {
    body = (
      <>
        {renderTop(SCT_UI.VERIFY, false)}
        <h1 className="mg-v2-sct-h1">{SCT_UI.VERIFY}</h1>
        <p className="mg-v2-sct-lead">질문지를 받은 연락처를 입력해 주세요.</p>
        <div className="mg-v2-sct-seg" role="radiogroup" aria-label="받은 곳">
          <MGButton
            type="button"
            variant={channel === SCT_CHANNEL.PHONE ? 'primary' : 'outline'}
            preventDoubleClick={false}
            onClick={() => setChannel(SCT_CHANNEL.PHONE)}
          >
            {SCT_UI.PHONE_SEGMENT}
          </MGButton>
          <MGButton
            type="button"
            variant={channel === SCT_CHANNEL.EMAIL ? 'primary' : 'outline'}
            preventDoubleClick={false}
            onClick={() => setChannel(SCT_CHANNEL.EMAIL)}
          >
            {SCT_UI.EMAIL_SEGMENT}
          </MGButton>
        </div>
        {meta?.verifyChannelHint ? (
          <p className={SCT_CSS.CAPTION}>
            {meta.verifyChannelHint === SCT_CHANNEL.EMAIL
              ? SCT_UI.EMAIL_SEGMENT
              : SCT_UI.PHONE_SEGMENT}
          </p>
        ) : null}
        {verifyError ? (
          <div className="mg-v2-sct-alert" role="alert"><SafeText>{verifyError}</SafeText></div>
        ) : null}
        {channel === SCT_CHANNEL.PHONE ? (
          <div className="mg-v2-sct-field">
            <label htmlFor="sct-phone">{SCT_UI.PHONE_SEGMENT}</label>
            <input
              id="sct-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              aria-invalid={Boolean(verifyError)}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        ) : (
          <div className="mg-v2-sct-field">
            <label htmlFor="sct-email">{SCT_UI.EMAIL_SEGMENT}</label>
            <input
              id="sct-email"
              type="email"
              autoComplete="email"
              value={email}
              aria-invalid={Boolean(verifyError)}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}
      </>
    );
    bar = (
      <SctThumbBar
        primaryLabel={SCT_UI.VERIFY_SUBMIT}
        onPrimary={handleVerify}
        loading={busy}
        secondaryLabel={SCT_UI.PREV}
        onSecondary={() => setStep(STEP.ENTRY)}
      />
    );
  } else if (step === STEP.GUARDIAN) {
    body = (
      <div data-testid={SCT_TEST_ID.GUARDIAN_STEP}>
        {renderTop('보호자 동의', false)}
        <h1 className="mg-v2-sct-h1">보호자 동의</h1>
        <p className="mg-v2-sct-lead">{SCT_UI.CHILD_GUARD_HINT}</p>
        {verifyError ? (
          <div className="mg-v2-sct-alert" role="alert"><SafeText>{verifyError}</SafeText></div>
        ) : null}
        <div className="mg-v2-sct-field">
          <label htmlFor="sct-g-name">{SCT_UI.GUARDIAN_NAME}</label>
          <input id="sct-g-name" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
        </div>
        <div className="mg-v2-sct-field">
          <label htmlFor="sct-g-rel">{SCT_UI.GUARDIAN_RELATION}</label>
          <input id="sct-g-rel" value={guardianRelation} onChange={(e) => setGuardianRelation(e.target.value)} />
        </div>
        <div className="mg-v2-sct-consent-body">
          <SafeText>
            {toDisplayString(
              consentStatus?.guardianConsentBody,
              SCT_UI.GUARDIAN_REQUIRED
            )}
          </SafeText>
        </div>
        {checkBtn(guardianAgreed, () => setGuardianAgreed((v) => !v), SCT_UI.GUARDIAN_REQUIRED)}
        <p className={SCT_CSS.CAPTION}>{SCT_UI.CONSENT_OPTIONAL_NOTE}</p>
        <p className={SCT_CSS.CAPTION}>{SCT_UI.CONSENT_REUSE_HINT}</p>
      </div>
    );
    bar = (
      <SctThumbBar
        primaryLabel={SCT_UI.GUARDIAN_DONE}
        onPrimary={handleGuardianComplete}
        primaryDisabled={!guardianAgreed || !guardianName.trim() || !guardianRelation.trim()}
        loading={busy}
      />
    );
  } else if (step === STEP.CONSENT) {
    const under14 = Boolean(consentStatus?.requiresGuardian)
      || consentStatus?.signerBand === SCT_SIGNER_BAND.UNDER_14
      || formType === SCT_FORM_TYPE.CHILD;
    const needsSelfSign = Boolean(consentStatus?.selfSignatureRequired) && !under14;
    body = (
      <div data-testid={SCT_TEST_ID.CONSENT_STEP}>
        {renderTop(SCT_UI.STEP_CONSENT, false)}
        <h1 className="mg-v2-sct-h1">
          {toDisplayString(consentStatus?.sensitiveConsentTitle, '실시 안내 및 동의')}
        </h1>
        <div className="mg-v2-sct-consent-body">
          <SafeText>
            {toDisplayString(
              consentStatus?.sensitiveConsentBody,
              form?.instructionText || ''
            )}
          </SafeText>
        </div>
        {verifyError ? (
          <div className="mg-v2-sct-alert" role="alert"><SafeText>{verifyError}</SafeText></div>
        ) : null}
        {checkBtn(sensitiveAgreed, () => setSensitiveAgreed((v) => !v), SCT_UI.SENSITIVE_REQUIRED)}
        {checkBtn(instructionRead, () => setInstructionRead((v) => !v), SCT_UI.INSTRUCTION_READ)}
        {needsSelfSign ? (
          <div className="mg-v2-sct-field">
            <label htmlFor="sct-signer">{SCT_UI.SIGNER_NAME}</label>
            <input
              id="sct-signer"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
            />
          </div>
        ) : null}
        {under14 ? (
          <>
            <div className="mg-v2-sct-field">
              <label htmlFor="sct-g-name-c">{SCT_UI.GUARDIAN_NAME}</label>
              <input
                id="sct-g-name-c"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
              />
            </div>
            <div className="mg-v2-sct-field">
              <label htmlFor="sct-g-rel-c">{SCT_UI.GUARDIAN_RELATION}</label>
              <input
                id="sct-g-rel-c"
                value={guardianRelation}
                onChange={(e) => setGuardianRelation(e.target.value)}
              />
            </div>
            {consentStatus?.childNameOptional ? (
              <div className="mg-v2-sct-field">
                <label htmlFor="sct-child-name">{SCT_UI.CHILD_NAME_CONFIRM}</label>
                <input
                  id="sct-child-name"
                  value={childNameConfirm}
                  onChange={(e) => setChildNameConfirm(e.target.value)}
                />
              </div>
            ) : null}
          </>
        ) : null}
        <p className={SCT_CSS.CAPTION}>{SCT_UI.CONSENT_OPTIONAL_NOTE}</p>
        <p className={SCT_CSS.CAPTION}>{SCT_UI.CONSENT_REUSE_HINT}</p>
      </div>
    );
    const consentReady = sensitiveAgreed
      && instructionRead
      && (!needsSelfSign || Boolean(signerName.trim()))
      && (!under14 || (Boolean(guardianName.trim()) && Boolean(guardianRelation.trim())));
    bar = (
      <SctThumbBar
        primaryLabel={SCT_UI.AGREE_START}
        onPrimary={handleConsentStart}
        primaryDisabled={!consentReady}
        loading={busy}
      />
    );
  } else if (step === STEP.ITEMS) {
    if (paused) {
      body = (
        <>
          {renderTop(kindLabel, true)}
          <h1 className="mg-v2-sct-h1">{SCT_UI.PAUSE_CHILD}</h1>
          <p className="mg-v2-sct-lead">쉬었다가 이어서 작성할 수 있습니다. 지금까지 쓴 내용은 저장됩니다.</p>
        </>
      );
      bar = (
        <SctThumbBar
          primaryLabel={SCT_UI.RESUME}
          onPrimary={() => setPaused(false)}
          showPause={false}
        />
      );
    } else {
      body = (
        <>
          {renderTop(kindLabel, true)}
          <div className="mg-v2-sct-items">
            {pageItems.map((item) => (
              <SctQuestionItem
                key={item.formItemId || item.itemNo}
                item={item}
                value={answersMap[item.formItemId]}
                onChange={(next) => updateAnswer(item, next)}
              />
            ))}
            <div className="mg-v2-sct-field">
              <MGButton type="button" variant="outline" preventDoubleClick={false} onClick={saveNow}>
                {SCT_UI.SAVE_DRAFT}
              </MGButton>
            </div>
          </div>
        </>
      );
      bar = (
        <SctThumbBar
          primaryLabel={pageIndex >= totalPages - 1 ? SCT_UI.SUBMIT : SCT_UI.NEXT}
          onPrimary={goNext}
          secondaryLabel={SCT_UI.PREV}
          onSecondary={goPrev}
          showPause={isChild}
          onPause={async() => {
            await saveNow();
            setPaused(true);
          }}
          loading={busy}
        />
      );
    }
  } else if (step === STEP.REVIEW) {
    body = (
      <>
        {renderTop('제출 확인', false)}
        <h1 className="mg-v2-sct-h1">제출 확인</h1>
        <p className="mg-v2-sct-lead">{SCT_UI.SUBMIT_CONFIRM}</p>
        <div className="mg-v2-sct-summary-grid">
          <article>
            <strong>{counts.answered}</strong>
            <span>{SCT_UI.COUNT_ANSWERED}</span>
          </article>
          <article>
            <strong>{counts.na}</strong>
            <span>{SCT_UI.COUNT_NA}</span>
          </article>
          <article>
            <strong>{counts.blank}</strong>
            <span>{SCT_UI.COUNT_BLANK}</span>
          </article>
        </div>
        {counts.blankList.length > 0 ? (
          <section>
            <h2 className="mg-v2-sct-top__title">{SCT_UI.BLANK_LIST_TITLE}</h2>
            <ul className="mg-v2-sct-steps">
              {counts.blankList.map((n) => (
                <li key={n}>
                  <button
                    type="button"
                    className="mg-v2-sct-na-btn"
                    onClick={() => {
                      const idx = items.findIndex((it) => it.itemNo === n);
                      if (idx >= 0) {
                        setPageIndex(Math.floor(idx / perPage));
                        setStep(STEP.ITEMS);
                      }
                    }}
                  >
                    {n}
                    번
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {verifyError ? (
          <div
            className="mg-v2-sct-alert"
            role="alert"
            data-testid={isVerifyRequiredUi ? SCT_TEST_ID.VERIFY_REQUIRED_ALERT : undefined}
          >
            <SafeText>{verifyError}</SafeText>
            {isVerifyRequiredUi ? (
              <div className="mg-v2-sct-alert__actions">
                <MGButton
                  type="button"
                  variant="primary"
                  preventDoubleClick={false}
                  onClick={goToReVerify}
                  data-testid={SCT_TEST_ID.VERIFY_AGAIN}
                >
                  {SCT_UI.VERIFY_AGAIN}
                </MGButton>
              </div>
            ) : null}
          </div>
        ) : null}
      </>
    );
    bar = (
      <SctThumbBar
        primaryLabel={isVerifyRequiredUi ? SCT_UI.VERIFY_AGAIN : SCT_UI.SUBMIT}
        onPrimary={isVerifyRequiredUi ? goToReVerify : handleSubmit}
        secondaryLabel={SCT_UI.PREV}
        onSecondary={() => setStep(STEP.ITEMS)}
        loading={busy}
      />
    );
  }

  return (
    <div
      ref={rootRef}
      className={appClass}
      data-testid={SCT_TEST_ID.PUBLIC_APP}
    >
      <div className={SCT_CSS.SCROLL}>{body}</div>
      {bar}
    </div>
  );
};

export default SctPublicPage;
