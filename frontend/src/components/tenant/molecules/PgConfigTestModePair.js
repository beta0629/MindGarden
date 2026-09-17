/**
 * PgConfigTestModePair — 테스트 ON / 리얼 OFF 나란히 교육용 키스트립 페어
 * 정적 시안(읽기 전용). 편집 불가. Clinic-OS PG 상세 SSOT.
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import React from 'react';
import PropTypes from 'prop-types';
import './PgConfigTestModePair.css';

const ARIA_LABEL = '테스트 모드 ON OFF 차이';
const HEADER_SUFFIX = '키스트립 · 필수';

/**
 * @param {object} props
 * @param {string} [props.className]
 * @param {string} [props.ariaLabel]
 */
function PgConfigTestModePair({
  className = '',
  ariaLabel = ARIA_LABEL
}) {
  const rootClass = ['pg-config-test-mode-pair', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} aria-label={ariaLabel}>
      <article className="pg-config-test-mode-pair__mode">
        <h3 className="pg-config-test-mode-pair__heading">
          <span className="pg-config-test-mode-pair__tag pg-config-test-mode-pair__tag--on">
            테스트 ON
          </span>
          {HEADER_SUFFIX}
        </h3>
        <div className="pg-config-test-mode-pair__mini-strip">
          <div className="pg-config-test-mode-pair__mk">
            <div className="pg-config-test-mode-pair__mk-lab">채널 키</div>
            <div className="pg-config-test-mode-pair__mk-val">channel-test-••••</div>
          </div>
          <div className="pg-config-test-mode-pair__mk">
            <div className="pg-config-test-mode-pair__mk-lab">스토어 ID</div>
            <div className="pg-config-test-mode-pair__mk-val">store-test-…</div>
          </div>
          <div className="pg-config-test-mode-pair__mk">
            <div className="pg-config-test-mode-pair__mk-lab">테스트 모드</div>
            <div className="pg-config-test-mode-pair__mk-val">켜짐</div>
          </div>
        </div>
        <ul className="pg-config-test-mode-pair__bullets">
          <li>
            채널 키 · 스토어 ID = <b>테스트</b> 값
          </li>
          <li>
            API 시크릿 = <b>선택</b> (테스트용)
          </li>
          <li>
            운영 키/시크릿 칸 <b>없음</b>
          </li>
        </ul>
      </article>

      <article className="pg-config-test-mode-pair__mode">
        <h3 className="pg-config-test-mode-pair__heading">
          <span className="pg-config-test-mode-pair__tag pg-config-test-mode-pair__tag--off">
            리얼 OFF
          </span>
          {HEADER_SUFFIX}
          {' '}
          <span className="pg-config-test-mode-pair__tag pg-config-test-mode-pair__tag--off">
            운영
          </span>
        </h3>
        <div className="pg-config-test-mode-pair__mini-strip">
          <div className="pg-config-test-mode-pair__mk">
            <div className="pg-config-test-mode-pair__mk-lab">채널 키</div>
            <div className="pg-config-test-mode-pair__mk-val">channel-live-••••</div>
          </div>
          <div className="pg-config-test-mode-pair__mk">
            <div className="pg-config-test-mode-pair__mk-lab">스토어 ID</div>
            <div className="pg-config-test-mode-pair__mk-val">store-live-…</div>
          </div>
          <div className="pg-config-test-mode-pair__mk">
            <div className="pg-config-test-mode-pair__mk-lab">테스트 모드</div>
            <div className="pg-config-test-mode-pair__mk-val">꺼짐</div>
          </div>
        </div>
        <ul className="pg-config-test-mode-pair__bullets">
          <li>
            채널 키 · 스토어 ID = <b>운영</b> 값
          </li>
          <li>
            API 시크릿 = <b>필수</b>
          </li>
          <li>
            <b>운영 키·시크릿 등 추가</b> (제공자별 apiKey 등)
          </li>
        </ul>
        <div className="pg-config-test-mode-pair__add">
          + 리얼 전환 시 추가 필수 칸이 나타남 · 미입력 시 저장 불가
        </div>
      </article>
    </div>
  );
}

PgConfigTestModePair.propTypes = {
  className: PropTypes.string,
  ariaLabel: PropTypes.string
};

export default PgConfigTestModePair;
