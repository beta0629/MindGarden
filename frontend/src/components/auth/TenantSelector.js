/**
 * TenantSelector — 테넌트 선택/식별 화면
 *
 * 첫 실행 시 기관 코드 입력 또는 QR 스캔으로 테넌트 식별.
 * 검증 후 localStorage 캐싱, 이후 재방문 시 자동 스킵.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, QrCode, ArrowRight } from 'lucide-react';
import TenantAwareApiClient from '../../utils/TenantAwareApiClient';
import './TenantSelector.css';

const TENANT_ID_KEY = 'mg_tenant_id';
const TENANT_NAME_KEY = 'mg_tenant_name';

const TenantSelector = () => {
  const navigate = useNavigate();
  const [tenantCode, setTenantCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedTenantId = localStorage.getItem(TENANT_ID_KEY);
    if (savedTenantId) {
      navigate('/mobile-login', { replace: true });
    }
  }, [navigate]);

  const handleValidate = async(e) => {
    e.preventDefault();

    if (!tenantCode.trim()) {
      setError('기관 코드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await TenantAwareApiClient.validateTenantCode(tenantCode.trim());

      if (result?.valid) {
        TenantAwareApiClient.setTenantId(result.tenantId);
        localStorage.setItem(TENANT_NAME_KEY, result.tenantName || '');
        navigate('/mobile-login', { replace: true });
      } else {
        setError('유효하지 않은 기관 코드입니다. 다시 확인해주세요.');
      }
    } catch (networkError) {
      console.error('[TenantSelector] 기관 코드 검증 실패:', networkError);
      setError('기관 코드 확인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQrScan = () => {
    /* QR 스캔 기능 — 향후 구현 예정 */
  };

  return (
    <div className="mg-tenant-selector">
      <div className="mg-tenant-selector__header">
        <div className="mg-tenant-selector__icon-wrap">
          <Building2 size={40} />
        </div>
        <h1 className="mg-tenant-selector__title">기관 연결</h1>
        <p className="mg-tenant-selector__desc">
          소속 기관의 코드를 입력하여 연결해주세요.
        </p>
      </div>

      <form className="mg-tenant-selector__form" onSubmit={handleValidate}>
        <div className="mg-tenant-selector__field">
          <input
            type="text"
            className="mg-tenant-selector__input"
            placeholder="기관 코드 입력"
            value={tenantCode}
            onChange={(e) => {
              setTenantCode(e.target.value);
              if (error) setError('');
            }}
            autoFocus
            autoComplete="off"
          />
        </div>

        {error && (
          <p className="mg-tenant-selector__error" role="alert">{error}</p>
        )}

        <button
          type="submit"
          className="mg-tenant-selector__submit"
          disabled={isLoading}
        >
          {isLoading ? '확인 중...' : '확인'}
          {!isLoading && <ArrowRight size={18} />}
        </button>
      </form>

      <div className="mg-tenant-selector__divider">
        <span>또는</span>
      </div>

      <button
        type="button"
        className="mg-tenant-selector__qr-btn"
        onClick={handleQrScan}
      >
        <QrCode size={20} />
        <span>QR 코드로 연결</span>
      </button>
    </div>
  );
};

export default TenantSelector;
