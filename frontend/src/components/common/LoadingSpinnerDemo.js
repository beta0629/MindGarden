/**
 * UnifiedLoading 데모 페이지 (SSOT 사용 예시)
 *
 * 기존 LoadingSpinner 데모(broken)를 UnifiedLoading 기반으로 재작성.
 * 새 코드에서는 반드시 UnifiedLoading을 직접 사용한다.
 *
 * @author MindGarden
 * @since 2026-05-23
 */

import React, { useState } from 'react';
import UnifiedLoading from './UnifiedLoading';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from './MGButton';
import './LoadingSpinnerDemo.css';

const SIZE_OPTIONS = ['xs', 'sm', 'md', 'lg', 'xl'];
const TONE_OPTIONS = ['primary', 'secondary', 'success', 'danger', 'neutral'];
const VARIANT_OPTIONS = ['spinner', 'dots', 'pulse', 'bars'];

const LoadingSpinnerDemo = () => {
  const [isOverlay, setIsOverlay] = useState(false);

  return (
    <div className="loading-demo-container">
      <h2>UnifiedLoading 데모 (SSOT)</h2>

      <div className="demo-section">
        <h3>variant 별 (spinner / dots / pulse / bars)</h3>
        <div className="demo-grid">
          {VARIANT_OPTIONS.map((variant) => (
            <div key={variant} className="demo-item">
              <h4>{variant}</h4>
              <UnifiedLoading
                variant={variant}
                size="md"
                text={`${variant} 로딩`}
                type="inline"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="demo-section">
        <h3>size 별 (xs / sm / md / lg / xl)</h3>
        <div className="demo-grid">
          {SIZE_OPTIONS.map((size) => (
            <div key={size} className="demo-item">
              <h4>{size}</h4>
              <UnifiedLoading
                variant="spinner"
                size={size}
                text={size}
                type="inline"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="demo-section">
        <h3>tone 별 (primary / secondary / success / danger / neutral)</h3>
        <div className="demo-grid">
          {TONE_OPTIONS.map((tone) => (
            <div key={tone} className="demo-item">
              <h4>{tone}</h4>
              <UnifiedLoading
                variant="spinner"
                size="md"
                tone={tone}
                text={tone}
                type="inline"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="demo-section">
        <h3>접근성·텍스트 옵션</h3>
        <div className="demo-grid">
          <div className="demo-item">
            <h4>label만 (텍스트 숨김)</h4>
            <UnifiedLoading
              variant="spinner"
              size="md"
              showText={false}
              label="데이터를 불러오는 중"
              type="inline"
            />
          </div>
          <div className="demo-item">
            <h4>inline (텍스트 흐름에 배치)</h4>
            <p>
              저장 중
              <UnifiedLoading variant="spinner" size="xs" inline showText={false} />
            </p>
          </div>
        </div>
      </div>

      <div className="demo-section">
        <h3>overlay (전체 화면)</h3>
        <MGButton
          className={buildErpMgButtonClassName({
            variant: 'primary',
            size: 'md',
            loading: false,
            className: 'demo-button'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          variant="primary"
          preventDoubleClick={false}
          onClick={() => setIsOverlay((v) => !v)}
        >
          {isOverlay ? '오버레이 끄기' : '오버레이 켜기'}
        </MGButton>

        {isOverlay && (
          <UnifiedLoading
            variant="spinner"
            size="lg"
            text="전체 화면 로딩 중..."
            overlay
          />
        )}
      </div>

      <div className="demo-section">
        <h3>사용법</h3>
        <pre>{`import UnifiedLoading from '../common/UnifiedLoading';

// 기본
<UnifiedLoading text="로딩 중..." size="md" />

// 사이즈 / 톤
<UnifiedLoading size="lg" tone="success" text="저장 중..." />

// 인라인
<UnifiedLoading inline size="xs" showText={false} label="저장 중" />

// 전체 화면 오버레이
<UnifiedLoading overlay text="처리 중..." size="lg" />

// variant
<UnifiedLoading variant="dots" text="잠시만요" />`}</pre>
      </div>
    </div>
  );
};

export default LoadingSpinnerDemo;
