import React, { useState } from 'react';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { useTranslation } from 'react-i18next';
// import UnifiedModal from '../../components/common/modals/UnifiedModal'; // 임시 비활성화
/**
 * UnifiedModal 테스트 컴포넌트
/**
 * 다양한 모달 설정을 테스트할 수 있습니다.
 */
const UnifiedModalTest = () => {
  const { t } = useTranslation();
  const [modals, setModals] = useState({
    basic: false,
    confirm: false,
    form: false,
    large: false,
    loading: false
  });

  const openModal = (type) => {
    setModals(prev => ({ ...prev, [type]: true }));
  };

  const closeModal = (type) => {
    setModals(prev => ({ ...prev, [type]: false }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('폼 제출됨');
    closeModal('form');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>{t('common:test.UnifiedModalTest.t_e9bb58ff')}</h1>
      <p>{t('common:test.UnifiedModalTest.t_be57c462')}</p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <MGButton
          variant="primary"
          size="medium"
          className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => openModal('basic')}
        >
          {t('common:test.UnifiedModalTest.t_c72bf800')}
        </MGButton>

        <MGButton
          variant="warning"
          size="medium"
          className={buildErpMgButtonClassName({ variant: 'warning', size: 'md', loading: false })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => openModal('confirm')}
        >
          {t('common:test.UnifiedModalTest.t_5048b857')}
        </MGButton>

        <MGButton
          variant="success"
          size="medium"
          className={buildErpMgButtonClassName({ variant: 'success', size: 'md', loading: false })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => openModal('form')}
        >
          {t('common:test.UnifiedModalTest.t_6ff39052')}
        </MGButton>

        <MGButton
          variant="info"
          size="medium"
          className={buildErpMgButtonClassName({ variant: 'info', size: 'md', loading: false })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => openModal('large')}
        >
          {t('common:test.UnifiedModalTest.t_9f235cac')}
        </MGButton>

        <MGButton
          variant="warning"
          size="medium"
          className={buildErpMgButtonClassName({ variant: 'warning', size: 'md', loading: false })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => openModal('loading')}
        >
          {t('common:test.UnifiedModalTest.t_0244b79f')}
        </MGButton>
      </div>

      {/* 기본 모달 */}
      <div className="mg-modal"
        isOpen={modals.basic}
        onClose={() => closeModal('basic')}
        title={t('common:test.UnifiedModalTest.t_c72bf800')}
        subtitle="이것은 기본 모달입니다."
        size="medium"
        variant="default"
      >
        <p>{t('common:test.UnifiedModalTest.t_7506f709')}</p>
        <p>{t('common:test.UnifiedModalTest.t_d2f27838')}</p>
      </div>

      {/* 확인 모달 */}
      <div className="mg-modal"
        isOpen={modals.confirm}
        onClose={() => closeModal('confirm')}
        title={t('common:test.UnifiedModalTest.t_5048b857')}
        subtitle="정말로 이 작업을 수행하시겠습니까?"
        size="small"
        variant="confirm"
        actions={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <MGButton
              variant="secondary"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => closeModal('confirm')}
            >
              {t('common.actions.cancel')}
            </MGButton>
            <MGButton
              variant="danger"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'danger', size: 'sm', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => closeModal('confirm')}
            >
              {t('common.actions.confirm')}
            </MGButton>
          </div>
        }
      >
        <p>{t('common:test.UnifiedModalTest.t_cdfb991d')}</p>
      </div>

      {/* 폼 모달 */}
      <div className="mg-modal"
        isOpen={modals.form}
        onClose={() => closeModal('form')}
        title={t('common:test.UnifiedModalTest.t_6ff39052')}
        subtitle="정보를 입력해주세요."
        size="medium"
        variant="form"
        actions={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <MGButton
              type="button"
              variant="secondary"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => closeModal('form')}
            >
              {t('common.actions.cancel')}
            </MGButton>
            <MGButton
              type="submit"
              form="test-form"
              variant="success"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'success', size: 'sm', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            >
              {t('common.actions.save')}
            </MGButton>
          </div>
        }
      >
        <form id="test-form" onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t('common:test.UnifiedModalTest.t_ed325800')}</label>
            <input 
              type="text" 
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-border-main) -> var(--mg-custom-ddd)
              style={{ width: '100%', padding: '8px', border: '1px solid var(--mg-color-border-main)', borderRadius: '4px' }}
              placeholder={t('common:test.UnifiedModalTest.t_25cf7f26')}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t('common:test.UnifiedModalTest.t_6b943a10')}</label>
            <input 
              type="email" 
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-border-main) -> var(--mg-custom-ddd)
              style={{ width: '100%', padding: '8px', border: '1px solid var(--mg-color-border-main)', borderRadius: '4px' }}
              placeholder={t('common:test.UnifiedModalTest.t_d83f68e8')}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t('common:test.UnifiedModalTest.t_4fd63c03')}</label>
            <textarea 
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-color-border-main) -> var(--mg-custom-ddd)
              style={{ width: '100%', padding: '8px', border: '1px solid var(--mg-color-border-main)', borderRadius: '4px', height: '80px' }}
              placeholder={t('common:test.UnifiedModalTest.t_69f2b568')}
            />
          </div>
        </form>
      </div>

      {/* 큰 모달 */}
      <div className="mg-modal"
        isOpen={modals.large}
        onClose={() => closeModal('large')}
        title={t('common:test.UnifiedModalTest.t_9f235cac')}
        subtitle="더 많은 내용을 표시할 수 있습니다."
        size="large"
        variant="default"
      >
        <div style={{ height: '400px', overflowY: 'auto', padding: '10px', backgroundColor: 'var(--mg-gray-100)', borderRadius: '4px' }}>
          <h3>{t('common:test.UnifiedModalTest.t_56ecb4fe')}</h3>
          {Array.from({ length: 50 }, (_, i) => (
            <p key={i}>이것은 {i + 1}번째 줄입니다. 스크롤을 확인해보세요.</p>
          ))}
        </div>
      </div>

      {/* 로딩 모달 */}
      <div className="mg-modal"
        isOpen={modals.loading}
        onClose={() => closeModal('loading')}
        title={t('common:test.UnifiedModalTest.t_0244b79f')}
        subtitle="데이터 처리 중입니다"
        size="medium"
        variant="default"
        loading={true}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '16px' }}>
            {t('common:test.UnifiedModalTest.t_30417b98')}
          </h4>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            {t('common:test.UnifiedModalTest.t_4b834882')}
          </p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {t('common:test.UnifiedModalTest.t_8d71c009')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedModalTest;
