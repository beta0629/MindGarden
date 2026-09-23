/**
 * PgConfigKeyStrip — 결제 연결 열쇠 스트립 (채널 키·스토어 ID·테스트 모드)
 * 읽기 요약만. 인라인 편집·포커스 편집 연출 없음. 클릭 시 폼 필드로 포커스만.
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../common/SafeText';
import './PgConfigKeyStrip.css';

export const PG_CONFIG_KEY_STRIP_CELL = {
  CHANNEL_KEY: 'channelKey',
  STORE_ID: 'storeId',
  TEST_MODE: 'testMode'
};

/**
 * @param {object} props
 * @param {string} [props.channelKeyDisplay]
 * @param {string} [props.storeIdDisplay]
 * @param {boolean} [props.testMode]
 * @param {(cell: string) => void} [props.onCellActivate]
 * @param {string} [props.className]
 * @param {string} [props.ariaLabel]
 */
function PgConfigKeyStrip({
  channelKeyDisplay = '—',
  storeIdDisplay = '—',
  testMode = false,
  onCellActivate,
  className = '',
  ariaLabel = '결제 열쇠'
}) {
  const rootClass = ['pg-config-key-strip', className].filter(Boolean).join(' ');
  const interactive = typeof onCellActivate === 'function';

  const activate = (cell) => {
    if (interactive) {
      onCellActivate(cell);
    }
  };

  const onKeyDown = (cell, event) => {
    if (!interactive) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onCellActivate(cell);
    }
  };

  const cellProps = (cell) => (
    interactive
      ? {
        role: 'button',
        tabIndex: 0,
        onClick: () => activate(cell),
        onKeyDown: (event) => onKeyDown(cell, event)
      }
      : {}
  );

  return (
    <div className={rootClass} aria-label={ariaLabel}>
      <div
        className="pg-config-key-strip__cell"
        data-cell={PG_CONFIG_KEY_STRIP_CELL.CHANNEL_KEY}
        {...cellProps(PG_CONFIG_KEY_STRIP_CELL.CHANNEL_KEY)}
      >
        <div className="pg-config-key-strip__lab">채널 키</div>
        <div className="pg-config-key-strip__val">
          <SafeText fallback="—">{channelKeyDisplay}</SafeText>
        </div>
        <div className="pg-config-key-strip__hint">포트원 채널 키</div>
      </div>
      <div
        className="pg-config-key-strip__cell"
        data-cell={PG_CONFIG_KEY_STRIP_CELL.STORE_ID}
        {...cellProps(PG_CONFIG_KEY_STRIP_CELL.STORE_ID)}
      >
        <div className="pg-config-key-strip__lab">스토어 ID</div>
        <div className="pg-config-key-strip__val">
          <SafeText fallback="—">{storeIdDisplay}</SafeText>
        </div>
        <div className="pg-config-key-strip__hint">상점·스토어 식별</div>
      </div>
      <div
        className="pg-config-key-strip__cell"
        data-cell={PG_CONFIG_KEY_STRIP_CELL.TEST_MODE}
        {...cellProps(PG_CONFIG_KEY_STRIP_CELL.TEST_MODE)}
      >
        <div className="pg-config-key-strip__lab">
          테스트 모드
          {!testMode ? (
            <span className="pg-config-key-strip__ops-badge">운영</span>
          ) : null}
        </div>
        <div
          className={`pg-config-key-strip__switch${testMode ? '' : ' pg-config-key-strip__switch--off'}`}
          aria-hidden="true"
        />
        <div className="pg-config-key-strip__hint">
          {testMode ? '켜짐 · 테스트 결제만' : '꺼짐 · 실결제 · 운영 키'}
        </div>
      </div>
    </div>
  );
}

PgConfigKeyStrip.propTypes = {
  channelKeyDisplay: PropTypes.string,
  storeIdDisplay: PropTypes.string,
  testMode: PropTypes.bool,
  onCellActivate: PropTypes.func,
  className: PropTypes.string,
  ariaLabel: PropTypes.string
};

export default PgConfigKeyStrip;
