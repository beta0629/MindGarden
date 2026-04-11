import React from 'react';
import UnifiedLoading from './UnifiedLoading';
import './CommonLoading.css';

/**
 * 공통 로딩 컴포넌트 - UnifiedLoading 기반 래퍼
 */

export const FullscreenLoading = ({ text = '로딩 중...' }) => (
  <UnifiedLoading text={text} size="large" variant="spinner" type="fullscreen" showText />
);

export const InlineLoading = ({ text = '로딩 중...', size = 'medium' }) => (
  <UnifiedLoading text={text} size={size} variant="spinner" type="inline" showText />
);

export const PageLoading = ({ text = '페이지를 불러오는 중...' }) => (
  <div className="page-loading-container">
    <UnifiedLoading text={text} size="large" variant="spinner" type="page" showText />
  </div>
);

export const ButtonLoading = ({ text = '처리 중...' }) => (
  <UnifiedLoading text={text} size="small" variant="spinner" type="button" showText={false} />
);

export const DataLoading = ({ text = '데이터를 불러오는 중...' }) => (
  <div className="data-loading-container">
    <UnifiedLoading text={text} size="medium" variant="spinner" type="inline" showText />
  </div>
);

const CommonLoading = ({
  text = '로딩 중...',
  size = 'medium',
  type = 'inline'
}) => {
  switch (type) {
    case 'fullscreen':
      return <FullscreenLoading text={text} />;
    case 'page':
      return <PageLoading text={text} />;
    case 'data':
      return <DataLoading text={text} />;
    case 'button':
      return <ButtonLoading text={text} />;
    case 'inline':
    default:
      return <InlineLoading text={text} size={size} />;
  }
};

export default CommonLoading;
