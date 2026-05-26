import React, { useState } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import '../../styles/main.css';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from './MGButton';
import './HelpPage.css';
import { useTranslation } from 'react-i18next';

const HelpPage = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('general');

  const helpSections = [
    {
      id: 'general',
      title: '일반 사용법',
      icon: 'bi-info-circle',
      content: (
        <div>
          <h4 className="help-section__title">{t('common:common.HelpPage.t_86f9911e')}</h4>
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-calendar-check help-section__card-icon" /> {t('common:common.HelpPage.t_f400e499')}
            </h5>
            <p className="help-section__card-text">• 대시보드의 빠른 액션에서 "일정"을 클릭하여 예약된 상담 일정을 확인할 수 있습니다.</p>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_4462a31d')}</p>
          </div>
          
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-person-circle help-section__card-icon" /> {t('common:common.HelpPage.t_5076bff1')}
            </h5>
            <p className="help-section__card-text">• "프로필" 메뉴에서 개인정보를 확인하고 수정할 수 있습니다.</p>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_2360a0b9')}</p>
          </div>
          
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-chat-dots help-section__card-icon" /> {t('common:common.HelpPage.t_843f0c08')}
            </h5>
            <p className="help-section__card-text">• "상담 내역"에서 과거 상담 기록을 조회할 수 있습니다.</p>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_d8da1163')}</p>
          </div>
        </div>
      )
    },
    {
      id: 'consultation',
      title: '상담 관련',
      icon: 'bi-chat-heart',
      content: (
        <div>
          <h4 className="help-section__title">{t('common:common.HelpPage.t_b037f707')}</h4>
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-clock help-section__card-icon" /> {t('common:common.HelpPage.t_54887f73')}
            </h5>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_8b43778a')}</p>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_e60ae45a')}</p>
          </div>
          
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-geo-alt help-section__card-icon" /> {t('common:common.HelpPage.t_e6a0af4b')}
            </h5>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_4730288d')}</p>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_2a2062a7')}</p>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_e3edfb53')}</p>
          </div>
          
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-file-text help-section__card-icon" /> {t('common:common.HelpPage.t_a7df67bf')}
            </h5>
            <p className="help-section__card-text">• 상담 후 작성된 리포트를 "상담 리포트" 메뉴에서 확인할 수 있습니다.</p>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_e724cb68')}</p>
          </div>
        </div>
      )
    },
    {
      id: 'technical',
      title: '기술 지원',
      icon: 'bi-gear',
      content: (
        <div>
          <h4 className="help-section__title">{t('common:common.HelpPage.t_9ff794d6')}</h4>
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-browser-chrome help-section__card-icon" /> {t('common:common.HelpPage.t_516a25d8')}
            </h5>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_3544e622')}</p>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_45ad615d')}</p>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_09797b28')}</p>
          </div>
          
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-wifi help-section__card-icon" /> {t('common:common.HelpPage.t_8dcf94cb')}
            </h5>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_97e4944f')}</p>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_9d5e430d')}</p>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_8aac646e')}</p>
          </div>
          
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-key help-section__card-icon" /> {t('common:common.HelpPage.t_a678a7ba')}
            </h5>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_e980d3a6')}</p>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_3e1cc77d')}</p>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_23b94784')}</p>
          </div>
        </div>
      )
    },
    {
      id: 'contact',
      title: '문의하기',
      icon: 'bi-telephone',
      content: (
        <div>
          <h4 className="help-section__title">{t('common:common.HelpPage.t_75e743e1')}</h4>
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-envelope help-section__card-icon" /> {t('common:common.HelpPage.t_b823d496')}
            </h5>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_2cfbc522')}</p>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_42e321d5')}</p>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_ef9ec9a4')}</p>
          </div>
          
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-telephone help-section__card-icon" /> {t('common:common.HelpPage.t_775f0d23')}
            </h5>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_a9e37e4d')}</p>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_ee67c5d7')}</p>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_f5ad9f21')}</p>
          </div>
          
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-clock help-section__card-icon" /> {t('common:common.HelpPage.t_1cb9a9c3')}
            </h5>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_8472f86f')}</p>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_1fa750b2')}</p>
            <p className="help-section__card-text">{t('common:common.HelpPage.t_9ffcf83c')}</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <AdminCommonLayout title={t('common:common.HelpPage.t_e2654ac5')}>
      <ContentArea ariaLabel="도움말">
        <ContentHeader
          title={t('common:common.HelpPage.t_e2654ac5')}
          subtitle="Core Solution 사용에 필요한 모든 정보를 확인하세요"
        />
        <div className="help-page">
        <div className="help-page__content">
          <div className="help-page__sidebar">
            <div className="help-page__nav">
              {helpSections.map((section) => (
                <MGButton
                  key={section.id}
                  type="button"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'md',
                    loading: false,
                    className: `help-page__nav-item ${activeSection === section.id ? 'help-page__nav-item--active' : ''}`
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => setActiveSection(section.id)}
                  variant="outline"
                  preventDoubleClick={false}
                >
                  <i className={section.icon} />
                  {section.title}
                </MGButton>
              ))}
            </div>
          </div>

          <div className="help-page__main">
            {helpSections.find(section => section.id === activeSection)?.content}
          </div>
        </div>

        <div className="help-page__footer">
          <h4 className="help-page__footer-title">
            <i className="bi bi-headset help-page__footer-icon" />
            {t('common:common.HelpPage.t_fcb0a804')}
          </h4>
          <p className="help-page__footer-text">
            {t('common:common.HelpPage.t_30847953')}
          </p>
          <div className="help-page__footer-actions">
            <MGButton
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'md',
                loading: false,
                className: 'btn btn-primary'
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => window.open('mailto:support@mindgarden.com')}
              variant="primary"
            >
              <i className="bi bi-envelope" /> {t('common:common.HelpPage.t_b823d496')}
            </MGButton>
            <MGButton
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'md',
                loading: false,
                className: 'btn btn-outline-primary'
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => window.open('tel:1588-0000')}
              variant="outline"
            >
              <i className="bi bi-telephone" /> {t('common:common.HelpPage.t_775f0d23')}
            </MGButton>
          </div>
        </div>
        </div>
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default HelpPage;
