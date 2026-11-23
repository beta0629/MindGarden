/**
 * 주간 겹침 「외 n」 시트 — 시간·이름·상담사·상태 목록 (dialog a11y)
 *
 * @author CoreSolution
 * @since 2026-11-23
 */

import React, { useEffect, useId, useRef } from 'react';
import PropTypes from 'prop-types';
import useCoverDrawerFocus from '../../common/coverChapter/useCoverDrawerFocus';
import MGButton from '../../common/MGButton';
import Icon from '../Icon/Icon';
import SafeText from '../../common/SafeText';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import './WeekOverlapSheet.css';

const WeekOverlapSheet = ({
  isOpen,
  title = '겹치는 일정',
  rows = [],
  onClose
}) => {
  const titleId = useId();
  const panelRef = useRef(null);

  useCoverDrawerFocus({
    isOpen,
    panelRef,
    onClose,
    returnFocusSelector: '.mg-v2-week-overlap-more'
  });

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="mg-v2-week-overlap-sheet-scrim"
        aria-label="겹침 목록 닫기"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="mg-v2-week-overlap-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="mg-v2-week-overlap-sheet__head">
          <h2 id={titleId} className="mg-v2-week-overlap-sheet__title">
            <SafeText>{title}</SafeText>
          </h2>
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              className: 'mg-v2-week-overlap-sheet__close'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={onClose}
            preventDoubleClick={false}
            aria-label="닫기"
          >
            <Icon name="X" size="MD" color="INHERIT" aria-hidden />
          </MGButton>
        </div>
        <ul className="mg-v2-week-overlap-sheet__list">
          {rows.map((row, idx) => (
            <li
              key={`${row.time}-${row.name}-${idx}`}
              className="mg-v2-week-overlap-sheet__item"
            >
              <div className="mg-v2-week-overlap-sheet__time">
                <SafeText>{row.time}</SafeText>
              </div>
              <div className="mg-v2-week-overlap-sheet__name">
                <SafeText>{row.name}</SafeText>
              </div>
              {(row.counselor || row.status) ? (
                <div className="mg-v2-week-overlap-sheet__meta">
                  <SafeText>
                    {[row.counselor, row.status].filter(Boolean).join(' · ')}
                  </SafeText>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

WeekOverlapSheet.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string,
  rows: PropTypes.arrayOf(PropTypes.shape({
    time: PropTypes.string,
    name: PropTypes.string,
    counselor: PropTypes.string,
    status: PropTypes.string
  })),
  onClose: PropTypes.func.isRequired
};

export default WeekOverlapSheet;
