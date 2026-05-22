/**
 * 어드민 알림 테스트 발송 이력 패널 (Organism).
 *
 * - `/api/v1/admin/test-notifications/history?page=0&size=30` 호출
 * - 발송 성공 후 `refreshKey`가 변하면 자동 새로고침
 * - 카드 리스트(채널 뱃지·결과 뱃지·시각·수신자 마스킹·사유)
 *
 * 참조: docs/project-management/2026-05-22/ADMIN_TEST_NOTIFICATION_DESIGN_HANDOFF.md §3.2
 *
 * @author MindGarden
 * @since 2026-05-22
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import MGButton from '../../common/MGButton';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  getTestNotificationHistory,
  TEST_NOTIFICATION_HISTORY_DEFAULT_SIZE
} from '../../../api/admin/testNotificationApi';
import { normalizeSpringPageRows } from '../../../constants/adminWebScaffold';
import './TestNotificationHistory.css';

const RESULT_SUCCESS = 'SUCCESS';

/**
 * 발송 이력 단일 행 정규화.
 * @param {*} raw
 * @param {number} idx
 * @returns {object}
 */
const normalizeHistoryItem = (raw, idx) => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const success = raw.success === true || raw.result === RESULT_SUCCESS;
  const channelCode = String(raw.channel ?? '').toUpperCase();
  return {
    id: raw.id != null ? String(raw.id) : `row-${idx}`,
    sentAt: toDisplayString(raw.sentAt, ''),
    channel: channelCode,
    success,
    recipient: toDisplayString(
      raw.recipientPhoneMasked
        ?? raw.recipient
        ?? raw.recipientMasked
        ?? raw.recipient_user_id,
      '-'
    ),
    templateCode: toDisplayString(raw.templateCode, ''),
    reason: toDisplayString(raw.reason, ''),
    // 백엔드 TestNotificationHistoryItem DTO는 errorCode만 노출하므로 errorMessage가 없으면 코드를 사용한다.
    errorMessage: toDisplayString(raw.errorMessage ?? raw.errorCode, '')
  };
};

const TestNotificationHistory = ({ refreshKey = 0 }) => {
  const { t } = useTranslation('admin');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async() => {
    setLoading(true);
    setError('');
    try {
      const raw = await getTestNotificationHistory({
        page: 0,
        size: TEST_NOTIFICATION_HISTORY_DEFAULT_SIZE
      });
      const list = normalizeSpringPageRows(raw)
        .map((row, idx) => normalizeHistoryItem(row, idx))
        .filter(Boolean);
      setItems(list);
    } catch (err) {
      console.error('테스트 발송 이력 로드 실패:', err);
      setError(err?.response?.data?.message || err?.message
        || t('testNotification.errors.loadFailed', '데이터를 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <section className="mg-test-notif-history" aria-label={t('testNotification.history.title', '최근 발송 이력')}>
      <header className="mg-test-notif-history__header">
        <div>
          <h3 className="mg-test-notif-history__title">{t('testNotification.history.title', '최근 발송 이력')}</h3>
          <p className="mg-test-notif-history__subtitle">{t('testNotification.history.subtitle', '최대 30건 (감사로그)')}</p>
        </div>
        <MGButton
          type="button"
          variant="outline"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'outline',
            size: 'sm',
            loading,
            className: 'mg-test-notif-history__refresh'
          })}
          loading={loading}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={load}
          aria-label={t('testNotification.history.refresh', '새로고침')}
        >
          {t('testNotification.history.refresh', '새로고침')}
        </MGButton>
      </header>

      {loading && items.length === 0 && (
        <p className="mg-test-notif-history__empty">{t('testNotification.history.loading', '이력 불러오는 중...')}</p>
      )}

      {!loading && error && (
        <p className="mg-test-notif-history__error" role="alert">{error}</p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="mg-test-notif-history__empty">{t('testNotification.history.empty', '발송 이력이 없습니다.')}</p>
      )}

      {items.length > 0 && (
        <ul className="mg-test-notif-history__list">
          {items.map((item) => (
            <li
              key={item.id}
              className={`mg-test-notif-history__item${item.success ? '' : ' mg-test-notif-history__item--fail'}`}
            >
              <div className="mg-test-notif-history__row">
                <span className={`mg-test-notif-history__chip mg-test-notif-history__chip--channel${item.channel === 'SMS' ? ' mg-test-notif-history__chip--sms' : ' mg-test-notif-history__chip--alimtalk'}`}>
                  {item.channel === 'SMS'
                    ? t('testNotification.history.channelSms', 'SMS')
                    : t('testNotification.history.channelAlimtalk', '알림톡')}
                </span>
                <span className={`mg-test-notif-history__chip mg-test-notif-history__chip--result${item.success ? ' mg-test-notif-history__chip--success' : ' mg-test-notif-history__chip--fail'}`}>
                  {item.success
                    ? t('testNotification.history.resultSuccess', '성공')
                    : t('testNotification.history.resultFail', '실패')}
                </span>
                <time className="mg-test-notif-history__time">{item.sentAt}</time>
              </div>
              <div className="mg-test-notif-history__row">
                <span className="mg-test-notif-history__field">
                  <strong>{t('testNotification.history.recipientLabel', '수신')}:</strong> {item.recipient}
                </span>
                {item.templateCode && (
                  <span className="mg-test-notif-history__field">{item.templateCode}</span>
                )}
              </div>
              <div className="mg-test-notif-history__row mg-test-notif-history__row--reason">
                <span className="mg-test-notif-history__field">
                  <strong>{t('testNotification.history.reasonLabel', '사유')}:</strong> {item.reason || '-'}
                </span>
                {!item.success && item.errorMessage && (
                  <span className="mg-test-notif-history__error-inline">{item.errorMessage}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default TestNotificationHistory;
