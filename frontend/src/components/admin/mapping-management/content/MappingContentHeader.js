/**
 * MappingContentHeader - 매칭 관리 페이지 헤더 (B0KlA 스타일)
 * 타이틀, 설명, 액션 버튼
 *
 * @author Core Solution
 * @since 2025-02-22
 */

import React from 'react';
import { ActionButton } from '../../../common';
import './MappingContentHeader.css';

const MappingContentHeader = ({ title, subtitle, onCreateClick }) => {
  return (
    <header className="mg-v2-ad-b0kla__header mg-v2-mapping-header">
      <div className="mg-v2-ad-b0kla__header-left">
        <h1 className="mg-v2-mapping-header__title">{title}</h1>
        {subtitle && <p className="mg-v2-mapping-header__subtitle">{subtitle}</p>}
      </div>
      {onCreateClick && (
        <div className="mg-v2-ad-b0kla__header-right">
          <ActionButton variant="primary" onClick={onCreateClick}>
            새 매칭 생성
          </ActionButton>
        </div>
      )}
    </header>
  );
};

export default MappingContentHeader;
