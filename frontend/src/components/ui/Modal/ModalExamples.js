/**
 * Modal 컴포넌트 사용 예시
 */

import { useState } from 'react';

import Button from '../Button/Button';
import Icon from '../Icon/Icon';

import Modal from './Modal';
import { useTranslation } from 'react-i18next';

const ModalExamples = () => {
    const { t } = useTranslation(); const [modals, setModals] = useState({ basic: false,
    withTitle: false,
    large: false,
    drawer: false,
    fullscreen: false,
    noCloseButton: false,
    noOverlayClose: false,
    noEscapeClose: false,
    loading: false,
    error: false,
    success: false,
    warning: false,
    info: false });

  const openModal = (modalName) => {setModals(prev => ({ ...prev, [modalName]: true }));};

  const closeModal = (modalName) => {setModals(prev => ({ ...prev, [modalName]: false }));};

  const closeAllModals = () => {setModals({ basic: false,
      withTitle: false,
      large: false,
      drawer: false,
      fullscreen: false,
      noCloseButton: false,
      noOverlayClose: false,
      noEscapeClose: false,
      loading: false,
      error: false,
      success: false,
      warning: false,
      info: false });};

  return (<div className="mg-v2-v2-v2-section">
      <div className="mg-v2-v2-v2-section-header">
        <h2 className="mg-v2-v2-v2-section-title">{t('common:ui.ModalExamples.t_6b9aed6b')}</h2>
        <p className="mg-v2-v2-v2-section-subtitle">
          {t('common:ui.ModalExamples.t_8ab1d2cd')}
        </p>
      </div>

      <div className="mg-v2-v2-v2-section-content">
        {/* 기본 사용법 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>{t('common:ui.ModalExamples.t_7428b07a')}</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button onClick={() => openModal('basic')}>
                {t('common:ui.ModalExamples.t_c72bf800')}
              </Button>
              <Button onClick={() => openModal('withTitle')} variant="secondary">
                {t('common:ui.ModalExamples.t_722cdf1f')}
              </Button>
            </div>
          </div>
        </div>

        {/* 크기 변형 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>{t('common:ui.ModalExamples.t_61af72a4')}</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button onClick={() => openModal('small')} size="small">
                Small
              </Button>
              <Button onClick={() => openModal('medium')} size="medium">
                Medium
              </Button>
              <Button onClick={() => openModal('large')} size="large">
                Large
              </Button>
              <Button onClick={() => openModal('extraLarge')} variant="outline">
                Extra Large
              </Button>
            </div>
          </div>
        </div>

        {/* 변형 스타일 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>{t('common:ui.ModalExamples.t_165c37ce')}</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button onClick={() => openModal('drawer')} variant="secondary">
                Drawer
              </Button>
              <Button onClick={() => openModal('fullscreen')} variant="outline">
                Fullscreen
              </Button>
              <Button onClick={() => openModal('centered')} variant="ghost">
                Centered
              </Button>
            </div>
          </div>
        </div>

        {/* 닫기 옵션 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>{t('common:ui.ModalExamples.t_be3ecdac')}</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button onClick={() => openModal('noCloseButton')} variant="warning">
                {t('common:ui.ModalExamples.t_f5d13e79')}
              </Button>
              <Button onClick={() => openModal('noOverlayClose')} variant="error">
                {t('common:ui.ModalExamples.t_fb658fed')}
              </Button>
              <Button onClick={() => openModal('noEscapeClose')} variant="info">
                {t('common:ui.ModalExamples.t_f9c13b1b')}
              </Button>
            </div>
          </div>
        </div>

        {/* 상태별 모달 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>{t('common:ui.ModalExamples.t_b8798555')}</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button onClick={() => openModal('loading')} variant="primary">
                {t('common:ui.ModalExamples.t_0244b79f')}
              </Button>
              <Button onClick={() => openModal('error')} variant="error">
                {t('common:ui.ModalExamples.t_5edd0c03')}
              </Button>
              <Button onClick={() => openModal('success')} variant="success">
                {t('common:ui.ModalExamples.t_b65966b8')}
              </Button>
              <Button onClick={() => openModal('warning')} variant="warning">
                {t('common:ui.ModalExamples.t_002fdad3')}
              </Button>
              <Button onClick={() => openModal('info')} variant="info">
                {t('common:ui.ModalExamples.t_5f790327')}
              </Button>
            </div>
          </div>
        </div>

        {/* 실제 사용 예시 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>{t('common:ui.ModalExamples.t_7bd1e28d')}</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button 
                icon="PLUS" 
                onClick={() => openModal('create')}
              >
                {t('common:ui.ModalExamples.t_45a596e0')}
              </Button>
              <Button 
                icon="EDIT" 
                variant="secondary"
                onClick={() => openModal('edit')}
              >
                {t('common:ui.ModalExamples.t_d482e14b')}
              </Button>
              <Button 
                icon="TRASH" 
                variant="error"
                onClick={() => openModal('delete')}
              >
                {t('common.actions.delete')}
              </Button>
              <Button 
                icon="SETTINGS" 
                variant="outline"
                onClick={() => openModal('settings')}
              >
                {t('common:ui.ModalExamples.t_c14a567e')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 모달들 */}
      <Modal
        isOpen={modals.basic}
        onClose={() => closeModal('basic')}
      >
        <div className="mg-v2-v2-v2-text-center">
          <h3 className="mg-v2-v2-v2-h3 mg-v2-v2-v2-mb-md">{t('common:ui.ModalExamples.t_c72bf800')}</h3>
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-lg">
            {t('common:ui.ModalExamples.t_99a261f7')}
          </p>
          <Button onClick={() => closeModal('basic')}>
            {t('common.actions.confirm')}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.withTitle}
        onClose={() => closeModal('withTitle')}
        title={t('common:ui.ModalExamples.t_722cdf1f')}
      >
        <div className="mg-v2-v2-v2-text-center">
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-lg">
            {t('common:ui.ModalExamples.t_b9ecd69d')}
          </p>
          <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-sm mg-v2-v2-v2-justify-center">
            <Button onClick={() => closeModal('withTitle')}>
              {t('common.actions.confirm')}
            </Button>
            <Button variant="outline" onClick={() => closeModal('withTitle')}>
              {t('common.actions.cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modals.large}
        onClose={() => closeModal('large')}
        title={t('common:ui.ModalExamples.t_9f235cac')}
        size="large"
      >
        <div>
          <h3 className="mg-v2-v2-v2-h3 mg-v2-v2-v2-mb-md">{t('common:ui.ModalExamples.t_9f235cac')}</h3>
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-md">
            {t('common:ui.ModalExamples.t_6a5e100d')}
          </p>
          <div className="mg-v2-v2-v2-card mg-v2-v2-v2-mb-md">
            <div className="mg-v2-v2-v2-card-content">
              <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-mb-sm">{t('common:ui.ModalExamples.t_2f9c07cb')}</h4>
              <p className="mg-v2-v2-v2-text-sm">
                {t('common:ui.ModalExamples.t_4bcc86d9')}
              </p>
            </div>
          </div>
          <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-sm mg-v2-v2-v2-justify-end">
            <Button variant="outline" onClick={() => closeModal('large')}>
              {t('common.actions.cancel')}
            </Button>
            <Button onClick={() => closeModal('large')}>
              {t('common.actions.confirm')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modals.drawer}
        onClose={() => closeModal('drawer')}
        title={t('common:ui.ModalExamples.t_8a343c8c')}
        variant="drawer"
      >
        <div>
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-md">
            {t('common:ui.ModalExamples.t_28547d93')}
          </p>
          <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-sm mg-v2-v2-v2-justify-center">
            <Button onClick={() => closeModal('drawer')}>
              {t('common.actions.confirm')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modals.fullscreen}
        onClose={() => closeModal('fullscreen')}
        title={t('common:ui.ModalExamples.t_231dd0f7')}
        variant="fullscreen"
      >
        <div className="mg-v2-v2-v2-text-center">
          <h3 className="mg-v2-v2-v2-h3 mg-v2-v2-v2-mb-md">{t('common:ui.ModalExamples.t_231dd0f7')}</h3>
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-lg">
            {t('common:ui.ModalExamples.t_45163a62')}
          </p>
          <Button onClick={() => closeModal('fullscreen')}>
            {t('common.actions.close')}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.noCloseButton}
        onClose={() => closeModal('noCloseButton')}
        title={t('common:ui.ModalExamples.t_f5d13e79')}
        showCloseButton={false}
      >
        <div className="mg-v2-v2-v2-text-center">
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-lg">
            {t('common:ui.ModalExamples.t_93903eb9')}
          </p>
          <Button onClick={() => closeModal('noCloseButton')}>
            {t('common.actions.confirm')}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.noOverlayClose}
        onClose={() => closeModal('noOverlayClose')}
        title={t('common:ui.ModalExamples.t_fb658fed')}
        closeOnOverlayClick={false}
      >
        <div className="mg-v2-v2-v2-text-center">
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-lg">
            {t('common:ui.ModalExamples.t_3cc6056c')}
          </p>
          <Button onClick={() => closeModal('noOverlayClose')}>
            {t('common.actions.confirm')}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.noEscapeClose}
        onClose={() => closeModal('noEscapeClose')}
        title={t('common:ui.ModalExamples.t_f9c13b1b')}
        closeOnEscape={false}
      >
        <div className="mg-v2-v2-v2-text-center">
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-lg">
            {t('common:ui.ModalExamples.t_2471e8fb')}
          </p>
          <Button onClick={() => closeModal('noEscapeClose')}>
            {t('common.actions.confirm')}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.loading}
        onClose={() => closeModal('loading')}
        title={t('common:ui.ModalExamples.t_0244b79f')}
        className="mg-v2-v2-v2-modal--loading"
      >
        <div className="mg-v2-v2-v2-text-center">
          <div className="mg-v2-v2-v2-icon mg-v2-v2-v2-icon--lg mg-v2-v2-v2-mb-md">
            <Icon name="LOADER" loading />
          </div>
          <p className="mg-v2-v2-v2-text-md">
            {t('common:ui.ModalExamples.t_17c9c3e4')}
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={modals.error}
        onClose={() => closeModal('error')}
        title={t('common:ui.ModalExamples.t_5edd0c03')}
        className="mg-v2-v2-v2-modal--error"
      >
        <div className="mg-v2-v2-v2-text-center">
          <div className="mg-v2-v2-v2-icon mg-v2-v2-v2-icon--lg mg-v2-v2-v2-mb-md">
            <Icon name="ALERT_CIRCLE" color="ERROR" />
          </div>
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-lg">
            {t('common:ui.ModalExamples.t_e246063e')}
          </p>
          <Button onClick={() => closeModal('error')}>
            {t('common.actions.confirm')}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.success}
        onClose={() => closeModal('success')}
        title={t('common:ui.ModalExamples.t_b65966b8')}
        className="mg-v2-v2-v2-modal--success"
      >
        <div className="mg-v2-v2-v2-text-center">
          <div className="mg-v2-v2-v2-icon mg-v2-v2-v2-icon--lg mg-v2-v2-v2-mb-md">
            <Icon name="CHECK_CIRCLE" color="SUCCESS" />
          </div>
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-lg">
            {t('common:ui.ModalExamples.t_720352aa')}
          </p>
          <Button onClick={() => closeModal('success')}>
            {t('common.actions.confirm')}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.warning}
        onClose={() => closeModal('warning')}
        title={t('common:ui.ModalExamples.t_002fdad3')}
        className="mg-v2-v2-v2-modal--warning"
      >
        <div className="mg-v2-v2-v2-text-center">
          <div className="mg-v2-v2-v2-icon mg-v2-v2-v2-icon--lg mg-v2-v2-v2-mb-md">
            <Icon name="ALERT_TRIANGLE" color="WARNING" />
          </div>
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-lg">
            {t('common:ui.ModalExamples.t_bc6047ac')}
          </p>
          <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-sm mg-v2-v2-v2-justify-center">
            <Button variant="outline" onClick={() => closeModal('warning')}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant="warning" onClick={() => closeModal('warning')}>
              {t('common:ui.ModalExamples.t_995224fb')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modals.info}
        onClose={() => closeModal('info')}
        title={t('common:ui.ModalExamples.t_5f790327')}
        className="mg-v2-v2-v2-modal--info"
      >
        <div className="mg-v2-v2-v2-text-center">
          <div className="mg-v2-v2-v2-icon mg-v2-v2-v2-icon--lg mg-v2-v2-v2-mb-md">
            <Icon name="INFO" color="INFO" />
          </div>
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-lg">
            {t('common:ui.ModalExamples.t_44ef4acd')}
          </p>
          <Button onClick={() => closeModal('info')}>
            {t('common.actions.confirm')}
          </Button>
        </div>
      </Modal>
    </div>);};

export default ModalExamples;
