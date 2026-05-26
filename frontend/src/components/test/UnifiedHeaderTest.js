import React, { useState } from 'react';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import UnifiedHeader from "../common/UnifiedHeader";
import '../../styles/main.css';
import { useTranslation } from 'react-i18next';

const UnifiedHeaderTest = () => {
  const { t } = useTranslation();
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
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-shadow-light) -> var(--mg-custom-color)
        boxShadow: '0 4px 20px var(--mg-shadow-light)',
        minWidth: '250px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>{t('common:test.UnifiedHeaderTest.t_d5bad20f')}</h3>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            {t('common:test.UnifiedHeaderTest.t_db8183f5')}
          </label>
          <select 
            value={logoType} 
            onChange={(e) => setLogoType(e.target.value)}
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-border-main) -> var(--mg-custom-ddd)
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--mg-color-border-main)' }}
          >
            <option value="text">{t('common:test.UnifiedHeaderTest.t_8e5e1e37')}</option>
            <option value="image">{t('common:test.UnifiedHeaderTest.t_8e07117c')}</option>
            <option value="custom">{t('common:test.UnifiedHeaderTest.t_58c9fb73')}</option>
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            {t('common:test.UnifiedHeaderTest.t_0505689a')}
          </label>
          <select 
            value={variant} 
            onChange={(e) => setVariant(e.target.value)}
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-border-main) -> var(--mg-custom-ddd)
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--mg-color-border-main)' }}
          >
            <option value="default">{t('common:test.UnifiedHeaderTest.t_7f1d8c41')}</option>
            <option value="compact">{t('common:test.UnifiedHeaderTest.t_369ca429')}</option>
            <option value="transparent">{t('common:test.UnifiedHeaderTest.t_071a71d7')}</option>
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
            {t('common:test.UnifiedHeaderTest.t_f174663d')}
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
              {t('common.labels.notification')}
            </MGButton>
            <MGButton
              type="button"
              variant="primary"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'sm', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            >
              {t('common.actions.refresh')}
            </MGButton>
          </div>
        }
      />

      {/* 콘텐츠 영역 */}
      <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-text-main) -> var(--mg-custom-1f2937)
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', color: 'var(--mg-color-text-main)' }}>
          {t('common:test.UnifiedHeaderTest.t_04f14990')}
        </h1>
        
        <div style={{ marginBottom: '32px' }}>
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-text-secondary-dark) -> var(--mg-custom-374151)
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--mg-color-text-secondary-dark)' }}>
            {t('common:test.UnifiedHeaderTest.t_9bd4e650')}
          </h2>
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-text-secondary) -> var(--mg-custom-6b7280)
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--mg-color-text-secondary)', marginBottom: '16px' }}>
            {t('common:test.UnifiedHeaderTest.t_d6029dc3')}
          </p>
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-text-secondary) -> var(--mg-custom-6b7280)
          <ul style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--mg-color-text-secondary)', paddingLeft: '20px' }}>
            <li>{t('common:test.UnifiedHeaderTest.t_aa835c65')}</li>
            <li>{t('common:test.UnifiedHeaderTest.t_064011f4')}</li>
            <li>{t('common:test.UnifiedHeaderTest.t_7471b6a6')}</li>
            <li>{t('common:test.UnifiedHeaderTest.t_4d5b77e9')}</li>
            <li>{t('common:test.UnifiedHeaderTest.t_0f3d917e')}</li>
          </ul>
        </div>

        <div style={{ marginBottom: '32px' }}>
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-text-secondary-dark) -> var(--mg-custom-374151)
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--mg-color-text-secondary-dark)' }}>
            {t('common:test.UnifiedHeaderTest.t_6e94cbb0')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-border-main) -> var(--mg-custom-e5e7eb)
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-background-main) -> var(--mg-custom-f9fafb)
            <div style={{ padding: '20px', background: 'var(--mg-color-background-main)', borderRadius: '8px', border: '1px solid var(--mg-color-border-main)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{t('common:test.UnifiedHeaderTest.t_d34a4b44')}</h3>
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-text-secondary) -> var(--mg-custom-6b7280)
              <p style={{ fontSize: '14px', color: 'var(--mg-color-text-secondary)' }}>{t('common:test.UnifiedHeaderTest.t_7d9d04ed')}</p>
            </div>
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-border-main) -> var(--mg-custom-e5e7eb)
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-background-main) -> var(--mg-custom-f9fafb)
            <div style={{ padding: '20px', background: 'var(--mg-color-background-main)', borderRadius: '8px', border: '1px solid var(--mg-color-border-main)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{t('common:test.UnifiedHeaderTest.t_e3137c7f')}</h3>
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-text-secondary) -> var(--mg-custom-6b7280)
              <p style={{ fontSize: '14px', color: 'var(--mg-color-text-secondary)' }}>{t('common:test.UnifiedHeaderTest.t_59182fe1')}</p>
            </div>
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-border-main) -> var(--mg-custom-e5e7eb)
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-background-main) -> var(--mg-custom-f9fafb)
            <div style={{ padding: '20px', background: 'var(--mg-color-background-main)', borderRadius: '8px', border: '1px solid var(--mg-color-border-main)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{t('common:test.UnifiedHeaderTest.t_4ddc8eed')}</h3>
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-text-secondary) -> var(--mg-custom-6b7280)
              <p style={{ fontSize: '14px', color: 'var(--mg-color-text-secondary)' }}>{t('common:test.UnifiedHeaderTest.t_64a365e3')}</p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-text-secondary-dark) -> var(--mg-custom-374151)
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--mg-color-text-secondary-dark)' }}>
            {t('common:test.UnifiedHeaderTest.t_ef7b95f8')}
          </h2>
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-text-secondary) -> var(--mg-custom-6b7280)
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--mg-color-text-secondary)', marginBottom: '16px' }}>
            {t('common:test.UnifiedHeaderTest.t_40bf6e1d')}
          </p>
        </div>

        {/* 긴 콘텐츠로 스크롤 테스트 */}
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-border-main) -> var(--mg-custom-e5e7eb)
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-background-main) -> var(--mg-custom-f3f4f6)
        <div style={{ height: '200vh', background: 'linear-gradient(180deg, var(--mg-color-background-main) 0%, var(--mg-color-border-main) 100%)', margin: '0 -20px', padding: '40px 20px' }}>
          <div style={{ textAlign: 'center', paddingTop: '100px' }}>
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-text-secondary-dark) -> var(--mg-custom-374151)
            <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '16px', color: 'var(--mg-color-text-secondary-dark)' }}>
              {t('common:test.UnifiedHeaderTest.t_5e1005f0')}
            </h2>
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-text-secondary) -> var(--mg-custom-6b7280)
            <p style={{ fontSize: '18px', color: 'var(--mg-color-text-secondary)' }}>
              {t('common:test.UnifiedHeaderTest.t_d1148076')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedHeaderTest;
