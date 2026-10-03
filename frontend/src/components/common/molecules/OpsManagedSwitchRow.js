/**
 * OpsManagedSwitchRow — 운영자 전용 설정의 읽기 전용 Switch 행.
 *
 * 테넌트 관리자 경로에서 쓰기가 항상 403 인 전역·플랫폼 스위치를 상태만 보여 준다.
 * 레이아웃은 {@link SettingSwitchRow} 그대로이고, Switch 는 항상 disabled 이며 저장 콜백이 없다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import PropTypes from 'prop-types';
import SettingSwitchRow from './SettingSwitchRow';
import {
  OPS_MANAGED_SETTING_CAPTION,
  OPS_MANAGED_TEST_ID_SUFFIX
} from '../../../constants/opsManagedSettings';

const META_SEPARATOR = ' · ';

/**
 * @param {object} props
 * @param {unknown} props.label
 * @param {unknown} [props.hint]
 * @param {string} [props.meta] 기존 메타(마지막 변경 등) — 안내 문구 앞에 붙인다
 * @param {unknown} [props.statusLabel]
 * @param {boolean} [props.checked=false]
 * @param {string} [props.id]
 * @param {string} [props.ariaLabel]
 * @param {string} [props.className]
 * @param {string} [props['data-testid']]
 */
function OpsManagedSwitchRow({
  label,
  hint,
  meta,
  statusLabel,
  checked = false,
  id,
  ariaLabel,
  className = '',
  'data-testid': dataTestId
}) {
  const metaText = meta ? `${meta}${META_SEPARATOR}${OPS_MANAGED_SETTING_CAPTION}` : OPS_MANAGED_SETTING_CAPTION;
  return (
    <SettingSwitchRow
      id={id}
      label={label}
      hint={hint}
      meta={metaText}
      statusLabel={statusLabel}
      checked={checked}
      disabled
      ariaLabel={ariaLabel}
      className={className}
      data-testid={dataTestId || OPS_MANAGED_TEST_ID_SUFFIX}
    />
  );
}

OpsManagedSwitchRow.propTypes = {
  label: PropTypes.any.isRequired,
  hint: PropTypes.any,
  meta: PropTypes.string,
  statusLabel: PropTypes.any,
  checked: PropTypes.bool,
  id: PropTypes.string,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  'data-testid': PropTypes.string
};

export default OpsManagedSwitchRow;
