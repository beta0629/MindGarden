/**
 * ConsultantMoodJournalInboxPage — 상담사 감정 일기 수신함
 * MindWeatherInbox 패턴 복제. 공유 동의 일기만 표시.
 *
 * @author MindGarden
 * @since 2026-09-03
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Inbox, BookHeart } from 'lucide-react';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import UnifiedLoading from '../common/UnifiedLoading';
import MGButton from '../common/MGButton';
import SafeText from '../common/SafeText';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import {
  CONSULTANT_MOOD_JOURNAL_INBOX_STRINGS as S
} from '../../constants/consultantMoodJournalInboxStrings';
import { fetchConsultantMoodJournalInbox } from '../../api/consultantMoodJournalInboxClient';
import { toDisplayString, toErrorMessage, htmlToPlainText } from '../../utils/safeDisplay';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ConsultantMoodJournalInboxPage.css';

const PAGE_TITLE_ID = 'consultant-mood-journal-inbox-title';

/**
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

const ConsultantMoodJournalInboxPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async() => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConsultantMoodJournalInbox();
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
      <div className="mg-v2-ad-b0kla consultant-mood-journal-inbox">
        {loading ? (
          <UnifiedLoading type="inline" text={S.LOADING} />
        ) : null}

        {!loading && error ? (
          <section
            className="consultant-mood-journal-inbox__state consultant-mood-journal-inbox__state--error"
            role="alert"
            aria-live="polite"
          >
            <Inbox size={28} className="consultant-mood-journal-inbox__state-icon" aria-hidden />
            <p className="consultant-mood-journal-inbox__state-text">
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
            className="consultant-mood-journal-inbox__state consultant-mood-journal-inbox__state--empty"
            aria-live="polite"
          >
            <BookHeart size={28} className="consultant-mood-journal-inbox__state-icon" aria-hidden />
            <p className="consultant-mood-journal-inbox__state-text">{S.EMPTY}</p>
            <p className="consultant-mood-journal-inbox__state-hint">{S.EMPTY_HINT}</p>
          </section>
        ) : null}

        {!loading && !error && !empty ? (
          <ul className="consultant-mood-journal-inbox__list" aria-labelledby={PAGE_TITLE_ID}>
            {items.map((row) => (
              <li key={toDisplayString(row.id, '—')} className="consultant-mood-journal-inbox__card">
                <div className="consultant-mood-journal-inbox__card-head">
                  <h3 className="consultant-mood-journal-inbox__card-title">
                    <SafeText fallback={S.LABEL_CLIENT}>{formatClientHeadline(row)}</SafeText>
                  </h3>
                  <p className="consultant-mood-journal-inbox__card-meta">
                    <SafeText fallback="">{S.CARD_META}</SafeText>
                    {' '}
                    <SafeText fallback="—">{row.date || row.createdAt}</SafeText>
                  </p>
                </div>
                {(row.emoji || row.moodValue > 0) ? (
                  <span
                    className="consultant-mood-journal-inbox__badge"
                    aria-label={S.LABEL_MOOD}
                  >
                    <SafeText fallback=" ">
                      {row.emoji
                        ? `${row.emoji} ${row.moodValue || ''}`.trim()
                        : String(row.moodValue)}
                    </SafeText>
                  </span>
                ) : null}
                <dl className="consultant-mood-journal-inbox__dl">
                  {row.memo && toDisplayString(row.memo, '') !== '' ? (
                    <>
                      <dt className="consultant-mood-journal-inbox__dt">{S.LABEL_MEMO}</dt>
                      <dd className="consultant-mood-journal-inbox__dd">
                        <p className="consultant-mood-journal-inbox__text">
                          <SafeText>{htmlToPlainText(row.memo)}</SafeText>
                        </p>
                      </dd>
                    </>
                  ) : null}
                  {row.tags.length > 0 ? (
                    <>
                      <dt className="consultant-mood-journal-inbox__dt">{S.LABEL_TAGS}</dt>
                      <dd className="consultant-mood-journal-inbox__dd">
                        <div className="consultant-mood-journal-inbox__tags" aria-label={S.LABEL_TAGS}>
                          {row.tags.map((tag, i) => (
                            <span
                              key={`${toDisplayString(row.id, '')}-tag-${String(i)}`}
                              className="consultant-mood-journal-inbox__tag"
                            >
                              <SafeText>{tag}</SafeText>
                            </span>
                          ))}
                        </div>
                      </dd>
                    </>
                  ) : null}
                </dl>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </ContentArea>
  );
};

export default ConsultantMoodJournalInboxPage;
