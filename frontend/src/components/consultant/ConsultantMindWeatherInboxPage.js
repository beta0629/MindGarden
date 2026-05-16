/**
 * ConsultantMindWeatherInboxPage — 상담사 마음 날씨 수신함
 *
 * @author MindGarden
 * @since 2026-05-16
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Inbox, Cloud } from 'lucide-react';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import UnifiedLoading from '../common/UnifiedLoading';
import MGButton from '../common/MGButton';
import SafeText from '../common/SafeText';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import {
  CONSULTANT_MIND_WEATHER_INBOX_STRINGS as S
} from '../../constants/consultantMindWeatherInboxStrings';
import { fetchConsultantMindWeatherInbox } from '../../api/consultantMindWeatherInboxClient';
import { toDisplayString, toErrorMessage, htmlToPlainText } from '../../utils/safeDisplay';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ConsultantMindWeatherInboxPage.css';

const PAGE_TITLE_ID = 'consultant-mind-weather-inbox-title';

/** @param {{ summary?: boolean, original?: boolean }|null|undefined} share */
function shareScopeLabel(share) {
  if (!share) {
    return S.SHARE_NONE;
  }
  const { summary, original } = share;
  if (summary && original) {
    return S.SHARE_BOTH;
  }
  if (summary) {
    return S.SHARE_SUMMARY_ONLY;
  }
  if (original) {
    return S.SHARE_ORIGINAL_ONLY;
  }
  return S.SHARE_NONE;
}

/**
 * 카드 제목: 복호화된 이름 우선, 없으면 회원 ID로 식별.
 *
 * @param {{ clientName?: string, clientId?: number|null }} row
 * @returns {string}
 */
function formatClientHeadline(row) {
  const name = toDisplayString(row.clientName, '').trim();
  const id = row.clientId;
  const hasId = typeof id === 'number' && Number.isFinite(id) && id > 0;
  if (hasId && (!name || name === S.LABEL_CLIENT)) {
    return `${S.CLIENT_HEADLINE_ID_PREFIX}${id}`;
  }
  if (name && name !== S.LABEL_CLIENT) {
    return name;
  }
  if (hasId) {
    return `${S.CLIENT_HEADLINE_ID_PREFIX}${id}`;
  }
  return S.LABEL_CLIENT;
}

const ConsultantMindWeatherInboxPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async() => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConsultantMindWeatherInbox();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const empty = !loading && !error && items.length === 0;

  return (
    <ContentArea ariaLabel={S.ARIA_MAIN}>
      <ContentHeader
        title={toDisplayString(S.PAGE_TITLE, '')}
        subtitle={toDisplayString(S.PAGE_SUBTITLE, '')}
        titleId={PAGE_TITLE_ID}
      />
      <div className="mg-v2-ad-b0kla consultant-mind-weather-inbox">
        {loading ? (
          <UnifiedLoading type="inline" text={S.LOADING} />
        ) : null}

        {!loading && error ? (
          <section
            className="consultant-mind-weather-inbox__state consultant-mind-weather-inbox__state--error"
            role="alert"
            aria-live="polite"
          >
            <Inbox size={28} className="consultant-mind-weather-inbox__state-icon" aria-hidden />
            <p className="consultant-mind-weather-inbox__state-text">
              {toDisplayString(toErrorMessage(error, S.ERROR_FALLBACK), S.ERROR_FALLBACK)}
            </p>
            <MGButton
              type="button"
              variant="primary"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'sm',
                loading: false,
                className: 'mg-v2-btn--primary'
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              preventDoubleClick={false}
              onClick={() => load()}
            >
              {S.RETRY}
            </MGButton>
          </section>
        ) : null}

        {!loading && !error && empty ? (
          <section
            className="consultant-mind-weather-inbox__state consultant-mind-weather-inbox__state--empty"
            aria-live="polite"
          >
            <Cloud size={28} className="consultant-mind-weather-inbox__state-icon" aria-hidden />
            <p className="consultant-mind-weather-inbox__state-text">{S.EMPTY}</p>
          </section>
        ) : null}

        {!loading && !error && !empty ? (
          <ul className="consultant-mind-weather-inbox__list" aria-labelledby={PAGE_TITLE_ID}>
            {items.map((row) => (
              <li key={toDisplayString(row.id, '—')} className="consultant-mind-weather-inbox__card">
                <div className="consultant-mind-weather-inbox__card-head">
                  <h3 className="consultant-mind-weather-inbox__card-title">
                    <SafeText fallback={S.LABEL_CLIENT}>{formatClientHeadline(row)}</SafeText>
                  </h3>
                  <p className="consultant-mind-weather-inbox__card-meta">
                    <SafeText fallback="">{S.CARD_META}</SafeText>
                    {' '}
                    <SafeText fallback="—">{row.createdAt}</SafeText>
                  </p>
                </div>
                {row.tone && toDisplayString(row.tone, '') !== '' ? (
                  <span
                    className="consultant-mind-weather-inbox__badge"
                    aria-label={S.LABEL_TONE}
                  >
                    <SafeText fallback="">{row.tone}</SafeText>
                  </span>
                ) : null}
                <dl className="consultant-mind-weather-inbox__dl">
                  {row.source && toDisplayString(row.source, '') !== '' ? (
                    <>
                      <dt className="consultant-mind-weather-inbox__dt">{S.LABEL_SOURCE}</dt>
                      <dd className="consultant-mind-weather-inbox__dd">
                        <SafeText>{row.source}</SafeText>
                      </dd>
                    </>
                  ) : null}
                  <dt className="consultant-mind-weather-inbox__dt">{S.LABEL_SUMMARY}</dt>
                  <dd className="consultant-mind-weather-inbox__dd">
                    <SafeText>{htmlToPlainText(row.summary)}</SafeText>
                  </dd>
                  {row.text && toDisplayString(row.text, '') !== '' ? (
                    <>
                      <dt className="consultant-mind-weather-inbox__dt">{S.LABEL_TEXT}</dt>
                      <dd className="consultant-mind-weather-inbox__dd">
                        <p className="consultant-mind-weather-inbox__text">
                          <SafeText>{htmlToPlainText(row.text)}</SafeText>
                        </p>
                      </dd>
                    </>
                  ) : null}
                  <dt className="consultant-mind-weather-inbox__dt">{S.SHARE_SCOPE}</dt>
                  <dd className="consultant-mind-weather-inbox__dd">
                    <SafeText>{shareScopeLabel(row.share)}</SafeText>
                  </dd>
                </dl>
                {row.keywords.length > 0 ? (
                  <div className="consultant-mind-weather-inbox__keywords" aria-label={S.LABEL_KEYWORDS}>
                    {row.keywords.map((kw, i) => (
                      <span
                        key={`${toDisplayString(row.id, '')}-${String(i)}-${toDisplayString(kw.key, '')}`}
                        className="consultant-mind-weather-inbox__keyword"
                      >
                        <SafeText>{kw.label || kw.key}</SafeText>
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </ContentArea>
  );
};

export default ConsultantMindWeatherInboxPage;
