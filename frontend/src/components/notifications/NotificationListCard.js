/**
 * 알림 카드 — 아이콘(중립 한 색) · 제목 · 안 읽음 점 · 요약 · 이동 안내.
 * 이동이 있으면 「…보기」, 없으면 오른쪽 › 만.
 * 긴급 등 글자 배지는 badge 슬롯. 좁은 화면에서는 시각이 meta 줄(출처 · 시각)로 내려간다.
 *
 * @author CoreSolution
 * @since 2026-10-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';
import { formatNotificationSummaryText } from '../../utils/displayId';
import { ICONS, ICON_SIZES } from '../../constants/icons';
import './NotificationListCard.css';
import { NOTIFICATION_PREVIEW_MAX_CHARS, NOTIFICATION_SKELETON_COUNT, NOTIFICATION_PAGE_TEST_IDS } from '../../constants/notificationTabs';

const ChevronIcon = ICONS.CHEVRON_RIGHT;

/**
 * @param {unknown} content
 * @returns {string}
 */
export const toNotificationPreview = (content) => {
  const plain = toDisplayString(content, '').replace(/<[^>]*>/g, '').trim();
  const text = formatNotificationSummaryText(plain);
  if (text.length <= NOTIFICATION_PREVIEW_MAX_CHARS) {
    return text;
  }
  return `${text.substring(0, NOTIFICATION_PREVIEW_MAX_CHARS)}...`;
};

const NotificationListCard = ({
  title,
  timeLabel,
  timeIso,
  summary,
  meta,
  badge,
  unread,
  unreadSr,
  icon: Icon,
  fields,
  goLabel,
  showChevron,
  onClick,
  testId
}) => {
  const readClass = unread ? 'notif-card--unread' : 'notif-card--read';
  const visibleFields = (fields || []).filter((field) => field && field.value);

  return (
    <li>
      <button
        type="button"
        className={`notif-card ${readClass}`}
        onClick={onClick}
        data-gnb-chrome-free="true"
        data-testid={testId}
      >
        <span className="notif-card__icon" aria-hidden="true">
          {Icon ? <Icon size={ICON_SIZES.XL} /> : null}
        </span>
        <span className="notif-card__main">
          <span className="notif-card__head">
            {unread ? <span className="notif-card__dot" aria-hidden="true" /> : null}
            <span className="notif-card__title">
              <SafeText>{title}</SafeText>
            </span>
            {badge || null}
            {unread && unreadSr ? <span className="sr-only">{unreadSr}</span> : null}
            {timeLabel ? (
              <time className="notif-card__time" dateTime={timeIso || undefined}>{timeLabel}</time>
            ) : null}
          </span>
          {summary ? (
            <span className="notif-card__summary">
              <SafeText>{summary}</SafeText>
            </span>
          ) : null}
          {visibleFields.length > 0 ? (
            <dl className="notif-card__fields">
              {visibleFields.map((field) => (
                <React.Fragment key={field.label}>
                  <dt>{field.label}</dt>
                  <dd><SafeText>{field.value}</SafeText></dd>
                </React.Fragment>
              ))}
            </dl>
          ) : null}
          {meta || timeLabel ? (
            <span className={`notif-card__meta${meta ? '' : ' notif-card__meta--time-only'}`}>
              {meta ? <span className="notif-card__meta-source"><SafeText>{meta}</SafeText></span> : null}
              {meta && timeLabel ? (
                <span className="notif-card__meta-time" aria-hidden="true"> · </span>
              ) : null}
              {timeLabel ? (
                <time className="notif-card__meta-time" dateTime={timeIso || undefined}>{timeLabel}</time>
              ) : null}
            </span>
          ) : null}
          {goLabel ? (
            <span className="notif-card__go">
              {goLabel}
              <ChevronIcon size={ICON_SIZES.MD} aria-hidden />
            </span>
          ) : null}
        </span>
        {showChevron ? (
          <span className="notif-card__chev" aria-hidden="true">
            <ChevronIcon size={ICON_SIZES.MD} />
          </span>
        ) : null}
      </button>
    </li>
  );
};

NotificationListCard.propTypes = {
  title: PropTypes.string.isRequired,
  timeLabel: PropTypes.string,
  timeIso: PropTypes.string,
  summary: PropTypes.string,
  meta: PropTypes.string,
  unread: PropTypes.bool,
  badge: PropTypes.node,
  unreadSr: PropTypes.string,
  icon: PropTypes.elementType,
  fields: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.string
  })),
  goLabel: PropTypes.string,
  showChevron: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  testId: PropTypes.string
};

NotificationListCard.defaultProps = {
  timeLabel: '',
  timeIso: '',
  summary: '',
  meta: '',
  unread: false,
  badge: null,
  unreadSr: '',
  icon: null,
  fields: [],
  goLabel: '',
  showChevron: false,
  testId: undefined
};

/**
 * 「긴급」 등 글자 배지 — 아이콘 색은 바꾸지 않는다.
 *
 * @param {{ label: string }} props
 */
export const NotificationUrgentBadge = ({ label }) => (
  <span className="mg-badge mg-badge-danger">{label}</span>
);

NotificationUrgentBadge.propTypes = {
  label: PropTypes.string.isRequired
};

/**
 * 목록 구간 라벨(안 읽은 메시지 N건 / 읽은 메시지).
 *
 * @param {{ children: React.ReactNode }} props
 */
export const NotificationSectionLabel = ({ children }) => (
  <p className="notif-section-label">{children}</p>
);

NotificationSectionLabel.propTypes = {
  children: PropTypes.node.isRequired
};

export const NotificationLoadingList = ({ label }) => (
  <div role="status" data-testid={NOTIFICATION_PAGE_TEST_IDS.SKELETON}>
    <p className="unified-notifications__loading-text">{label}</p>
    <ul className="notif-list" aria-hidden="true">
      {Array.from({ length: NOTIFICATION_SKELETON_COUNT }, (item, index) => String(index + 1)).map((key) => (
        <li className="notif-skel" key={key}>
          <span className="notif-skel__block notif-skel__icon" />
          <span className="notif-skel__lines">
            <span className="notif-skel__block notif-skel__line--title" />
            <span className="notif-skel__block notif-skel__line--body" />
            <span className="notif-skel__block notif-skel__line--meta" />
          </span>
        </li>
      ))}
    </ul>
  </div>
);

NotificationLoadingList.propTypes = {
  label: PropTypes.string.isRequired
};

export default NotificationListCard;
