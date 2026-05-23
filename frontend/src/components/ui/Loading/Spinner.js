/**
 * Spinner — UnifiedLoading SSOT 위임 래퍼
 *
 * 기존 API(size: small/medium/large)를 유지하면서 내부적으로 UnifiedLoading의
 * jitter-free 스피너를 그대로 사용한다. 새 코드는 UnifiedLoading을 직접 임포트하는 것을 권장한다.
 *
 * @param {Object} props
 * @param {('xs'|'sm'|'md'|'lg'|'xl'|'small'|'medium'|'large')} [props.size='md']
 * @param {string} [props.className='']
 *
 * @author Core Solution
 * @since 2026-05-23
 */

import React from 'react';
import UnifiedLoading from '../../common/UnifiedLoading';

const Spinner = ({ size = 'md', className = '' }) => (
  <UnifiedLoading
    variant="spinner"
    size={size}
    type="inline"
    inline
    showText={false}
    className={className}
    label="로딩 중"
  />
);

export default Spinner;
