/**
 * 알림 카드 — 아이콘 · 제목 · 안 읽음 · 요약 · 이동 안내.
 * 이동이 있으면 「…보기」, 없으면 오른쪽 › 만.
 *
 * @author CoreSolution
 * @since 2026-10-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';
import { ICONS, ICON_SIZES } from '../../constants/icons';
import { NOTIFICATION_PREVIEW_MAX_CHARS, NOTIFICATION_SKELETON_COUNT, NOTIFICATION_PAGE_TEST_IDS } from '../../constants/notificationTabs';

const ChevronIcon = ICONS.CHEVRON_RIGHT;

/**
 * @param {unknown} content
 * @returns {string}
 */
export const toNotificationPreview = (content) => {
  const text = toDisplayString(content, '').replace(/<[^>]*>/g, '').trim();
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
  unread,
  unreadLabel,
  unreadSr,
  icon: Icon,
  iconTone,
  fields,
  goLabel,
  showChevron,
  onClick,
  testId
}) => {
  const toneClass = iconTone ? ` notif-card__icon--${iconTone}` : '';
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
        <span className={`notif-card__icon${toneClass}`} aria-hidden="true">
          {Icon ? <Icon size={ICON_SIZES.XL} /> : null}
        </span>
        <span className="notif-card__main">
          <span className="notif-card__head">
            {unread ? <span className="notif-card__dot" aria-hidden="true" /> : null}
            <span className="notif-card__title">
              <SafeText>{title}</SafeText>
            </span>
            {unread ? (
              <>
                <span className="sr-only">{unreadSr}</span>
                <span className="notif-card__unread" aria-hidden="true">{unreadLabel}</span>
              </>
            ) : null}
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
          {meta ? (
            <span className="notif-card__meta">
              <SafeText>{meta}</SafeText>
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
  unreadLabel: PropTypes.string,
  unreadSr: PropTypes.string,
  icon: PropTypes.elementType,
  iconTone: PropTypes.string,
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
  unreadLabel: '',
  unreadSr: '',
  icon: null,
  iconTone: '',
  fields: [],
  goLabel: '',
  showChevron: false,
  testId: undefined
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
