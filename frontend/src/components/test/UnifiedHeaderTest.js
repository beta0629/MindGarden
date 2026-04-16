import React, { useState } from 'react';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import UnifiedHeader from "../common/UnifiedHeader";
import '../../styles/main.css';

const UnifiedHeaderTest = () => {
  const [logoType, setLogoType] = useState('text');
  const [variant, setVariant] = useState('default');
  const [sticky, setSticky] = useState(true);

  // 커스텀 로고 SVG 예시
  const customLogoSVG = `
    <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="40" rx="8" fill="url(#gradient)"/>
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:var(--mg-primary-500);stop-opacity:1" />
          <stop offset="100%" style="stop-color:var(--mg-purple-500);stop-opacity:1" />
        </linearGradient>
      </defs>
      <text x="60" y="25" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
        Core Solution
      </text>
    </svg>
  `;

  return (
    <div className="mg-page-wrapper" style={{ padding: '0', minHeight: '100vh' }}>
      {/* 테스트 컨트롤 */}
      <div style={{ 
        position: 'fixed', 
        top: '80px', 
        right: '20px', 
        zIndex: 1000, 
        background: 'white', 
        padding: '20px', 
        borderRadius: '12px', 
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0,0,0,0.1) -> var(--mg-custom-color)
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        minWidth: '250px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>헤더 테스트 컨트롤</h3>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            로고 타입:
          </label>
          <select 
            value={logoType} 
            onChange={(e) => setLogoType(e.target.value)}
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
          >
            <option value="text">텍스트 로고</option>
            <option value="image">이미지 로고</option>
            <option value="custom">커스텀 로고 (SVG)</option>
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            헤더 스타일:
          </label>
          <select 
            value={variant} 
            onChange={(e) => setVariant(e.target.value)}
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
          >
            <option value="default">기본</option>
            <option value="compact">컴팩트</option>
            <option value="transparent">투명</option>
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '500' }}>
            <input 
              type="checkbox" 
              checked={sticky} 
              onChange={(e) => setSticky(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            상단 고정
          </label>
        </div>
      </div>

      {/* 헤더 테스트 */}
      <UnifiedHeader
        title="Core Solution"
        logoType={logoType}
        logoImage={logoType === 'custom' ? customLogoSVG : '/logo.png'}
        logoAlt="Core Solution"
        variant={variant}
        sticky={sticky}
        showUserMenu={true}
        showHamburger={true}
        extraActions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <MGButton
              type="button"
              variant="secondary"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            >
              알림
            </MGButton>
            <MGButton
              type="button"
              variant="primary"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'sm', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            >
              새로고침
            </MGButton>
          </div>
        }
      />

      {/* 콘텐츠 영역 */}
      <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
          UnifiedHeader 테스트 페이지
        </h1>
        
        <div style={{ marginBottom: '32px' }}>
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
            로고 확장성 테스트
          </h2>
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#6b7280', marginBottom: '16px' }}>
            이 페이지에서는 향후 커스텀 로고가 적용될 때를 대비한 헤더 시스템을 테스트합니다.
          </p>
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
          <ul style={{ fontSize: '16px', lineHeight: '1.6', color: '#6b7280', paddingLeft: '20px' }}>
            <li>텍스트 로고: 기본 브랜드명 표시</li>
            <li>이미지 로고: PNG/JPG 파일 지원</li>
            <li>커스텀 로고: SVG 등 HTML 직접 삽입</li>
            <li>반응형 크기 조정</li>
            <li>다크 모드 대응</li>
          </ul>
        </div>

        <div style={{ marginBottom: '32px' }}>
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
            헤더 스타일 변형
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f9fafb -> var(--mg-custom-f9fafb)
            <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>기본 스타일</h3>
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
              <p style={{ fontSize: '14px', color: '#6b7280' }}>표준 높이와 패딩</p>
            </div>
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f9fafb -> var(--mg-custom-f9fafb)
            <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>컴팩트 스타일</h3>
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
              <p style={{ fontSize: '14px', color: '#6b7280' }}>작은 높이와 패딩</p>
            </div>
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f9fafb -> var(--mg-custom-f9fafb)
            <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>투명 스타일</h3>
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
              <p style={{ fontSize: '14px', color: '#6b7280' }}>투명 배경과 테두리</p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
            스크롤 테스트
          </h2>
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#6b7280', marginBottom: '16px' }}>
            상단 고정 옵션을 켜고 아래로 스크롤해보세요. 헤더가 상단에 고정되는 것을 확인할 수 있습니다.
          </p>
        </div>

        {/* 긴 콘텐츠로 스크롤 테스트 */}
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f3f4f6 -> var(--mg-custom-f3f4f6)
        <div style={{ height: '200vh', background: 'linear-gradient(180deg, #f3f4f6 0%, #e5e7eb 100%)', margin: '0 -20px', padding: '40px 20px' }}>
          <div style={{ textAlign: 'center', paddingTop: '100px' }}>
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
            <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
              스크롤 테스트 영역
            </h2>
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
            <p style={{ fontSize: '18px', color: '#6b7280' }}>
              이 영역을 스크롤하면서 헤더의 동작을 확인해보세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedHeaderTest;
