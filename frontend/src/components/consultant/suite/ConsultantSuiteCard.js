/**
 * ConsultantSuiteCard — 상담사 스위트 공유 카드 (card | row)
 * 흰 카드 + slate 테두리 · shadow 없음 · 밀도 토큰(--mg-v2-consultant-card-*)
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../common/SafeText';
import { CONSULTANT_SUITE_CLASS } from '../../../constants/consultantSuite';

export const CONSULTANT_SUITE_CARD_VARIANT = Object.freeze({
  CARD: 'card',
  ROW: 'row'
});

/**
 * 이름 이니셜(최대 2자). 비어 있으면 「—」.
 *
 * @param {string} [name]
 * @returns {string}
 */
export const toConsultantSuiteAvatarInitials = (name) => {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (!trimmed) {
    return '—';
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return trimmed.slice(0, 2);
};

/**
 * @param {object} props
 * @param {'card'|'row'} [props.variant]
 * @param {React.ReactNode} [props.avatar]
 * @param {React.ReactNode} [props.pill]
 * @param {React.ReactNode} [props.title]
 * @param {React.ReactNode} [props.time]
 * @param {React.ReactNode} [props.body]
 * @param {React.ReactNode} [props.meta]
 * @param {React.ReactNode} [props.foot]
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.className]
 * @param {string} [props.testId]
 * @param {function} [props.onClick]
 * @param {string} [props.as]
 */
const ConsultantSuiteCard = ({
  variant = CONSULTANT_SUITE_CARD_VARIANT.CARD,
  avatar,
  pill,
  title,
  time,
  body,
  meta,
  foot,
  children,
  className,
  testId,
  onClick,
  as
}) => {
  const isRow = variant === CONSULTANT_SUITE_CARD_VARIANT.ROW;
  const Tag = as || (onClick ? 'button' : 'article');
  const rootClass = [
    CONSULTANT_SUITE_CLASS.CARD,
    isRow ? CONSULTANT_SUITE_CLASS.CARD_ROW : '',
    onClick && Tag === 'button' ? `${CONSULTANT_SUITE_CLASS.CARD}--interactive` : '',
    className
  ].filter(Boolean).join(' ');

  const head = (title != null || time != null || avatar != null || pill != null) ? (
    <header className={CONSULTANT_SUITE_CLASS.CARD_HEAD}>
      {avatar != null ? (
        <span className={CONSULTANT_SUITE_CLASS.AVATAR} aria-hidden={typeof avatar === 'string'}>
          {typeof avatar === 'string' ? <SafeText>{avatar}</SafeText> : avatar}
        </span>
      ) : null}
      <div className={CONSULTANT_SUITE_CLASS.CARD_HEAD_TEXT}>
        {title != null ? (
          <SafeText tag="h3" className={CONSULTANT_SUITE_CLASS.CARD_TITLE}>{title}</SafeText>
        ) : null}
        {time != null ? (
          <SafeText tag="time" className={CONSULTANT_SUITE_CLASS.CARD_TIME}>{time}</SafeText>
        ) : null}
      </div>
      {pill != null ? pill : null}
    </header>
  ) : null;

  return (
    <Tag
      className={rootClass}
      data-testid={testId}
      type={Tag === 'button' ? 'button' : undefined}
      onClick={onClick}
    >
      {head}
      {body != null ? (
        <div className={CONSULTANT_SUITE_CLASS.CARD_BODY}>{body}</div>
      ) : null}
      {meta != null ? (
        <div className={CONSULTANT_SUITE_CLASS.CARD_META}>{meta}</div>
      ) : null}
      {children}
      {foot != null ? (
        <footer className={CONSULTANT_SUITE_CLASS.CARD_FOOT}>{foot}</footer>
      ) : null}
    </Tag>
  );
};

ConsultantSuiteCard.propTypes = {
  variant: PropTypes.oneOf(Object.values(CONSULTANT_SUITE_CARD_VARIANT)),
  avatar: PropTypes.node,
  pill: PropTypes.node,
  title: PropTypes.node,
  time: PropTypes.node,
  body: PropTypes.node,
  meta: PropTypes.node,
  foot: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
  testId: PropTypes.string,
  onClick: PropTypes.func,
  as: PropTypes.elementType
};

ConsultantSuiteCard.defaultProps = {
  variant: CONSULTANT_SUITE_CARD_VARIANT.CARD,
  avatar: null,
  pill: null,
  title: null,
  time: null,
  body: null,
  meta: null,
  foot: null,
  children: null,
  className: '',
  testId: undefined,
  onClick: undefined,
  as: undefined
};

/**
 * 상태·유형 필 — 아이콘 없음 · slate-100
 *
 * @param {{ children: React.ReactNode, className?: string }} props
 */
export const ConsultantSuitePill = ({ children, className }) => (
  <span className={[CONSULTANT_SUITE_CLASS.PILL, className].filter(Boolean).join(' ')}>
    {children}
  </span>
);

ConsultantSuitePill.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

ConsultantSuitePill.defaultProps = {
  className: ''
};

export default ConsultantSuiteCard;
