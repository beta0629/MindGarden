/**
 * Button 컴포넌트 사용 예시
 */

import { useState } from 'react';

import { FORM_CONSTANTS } from '../../../constants/magicNumbers';

import Button from './Button';
import { useTranslation } from 'react-i18next';

const ButtonExamples = () => {
  const { t } = useTranslation(); const [loading, setLoading] = useState(false);
  const [clickedButton, setClickedButton] = useState(null);

  const handleAsyncClick = async() => {setLoading(true);
    setClickedButton('async');
    
    // 비동기 작업 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLoading(false);
    setClickedButton(null);};

  const handleClick = (buttonName) => {setClickedButton(buttonName);
    setTimeout(() => setClickedButton(null), FORM_CONSTANTS.MAX_TEXTAREA_LENGTH);};

  return (<div className="mg-v2-v2-v2-section">
      <div className="mg-v2-v2-v2-section-header">
        <h2 className="mg-v2-v2-v2-section-title">{t('common:ui.ButtonExamples.t_008544cf')}</h2>
        <p className="mg-v2-v2-v2-section-subtitle">
          {t('common:ui.ButtonExamples.t_c871021f')}
        </p>
      </div>

      <div className="mg-v2-v2-v2-section-content">
        {/* 기본 사용법 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>{t('common:ui.ButtonExamples.t_7428b07a')}</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button>{t('common:ui.ButtonExamples.t_35b9b029')}</Button>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="success">Success</Button>
            </div>
          </div>
        </div>

        {/* 크기 변형 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>{t('common:ui.ButtonExamples.t_61af72a4')}</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-center mg-v2-v2-v2-flex-wrap">
              <Button size="small">Small</Button>
              <Button size="medium">Medium</Button>
              <Button size="large">Large</Button>
            </div>
          </div>
        </div>

        {/* 색상 변형 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>{t('common:ui.ButtonExamples.t_5a893307')}</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="success">Success</Button>
              <Button variant="warning">Warning</Button>
              <Button variant="error">Error</Button>
              <Button variant="info">Info</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>
        </div>

        {/* 아이콘 버튼 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>{t('common:ui.ButtonExamples.t_371019dc')}</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button icon="PLUS">{t('common:ui.ButtonExamples.t_57942995')}</Button>
              <Button icon="EDIT" variant="secondary">{t('common:ui.ButtonExamples.t_d482e14b')}</Button>
              <Button icon="TRASH" variant="error">{t('common.actions.delete')}</Button>
              <Button icon="SAVE" variant="success">{t('common.actions.save')}</Button>
              <Button icon="SEARCH" variant="outline">{t('common:ui.ButtonExamples.t_4f5a3f69')}</Button>
            </div>
          </div>
        </div>

        {/* 아이콘 위치 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>{t('common:ui.ButtonExamples.t_9eb8967a')}</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button icon="CHEVRON_LEFT" iconPosition="left">{t('common.actions.prev')}</Button>
              <Button icon="CHEVRON_RIGHT" iconPosition="right">{t('common:ui.ButtonExamples.t_854c76f3')}</Button>
              <Button icon="DOWNLOAD" iconPosition="left" variant="outline">{t('common:ui.ButtonExamples.t_5c5095ab')}</Button>
              <Button icon="UPLOAD" iconPosition="right" variant="outline">{t('common:ui.ButtonExamples.t_51672ccd')}</Button>
            </div>
          </div>
        </div>

        {/* 상태별 버튼 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>{t('common:ui.ButtonExamples.t_33f26ed9')}</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button>{t('common:ui.ButtonExamples.t_f6846cfc')}</Button>
              <Button disabled>{t('common:ui.ButtonExamples.t_8ff58636')}</Button>
              <Button loading>{t('common:ui.ButtonExamples.t_ce520073')}</Button>
              <Button loading loadingText="처리 중...">{t('common:ui.ButtonExamples.t_4cbc3762')}</Button>
            </div>
          </div>
        </div>

        {/* 클릭 이벤트 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>{t('common:ui.ButtonExamples.t_7c950dd6')}</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button onClick={() => handleClick('normal')}>
                {t('common:ui.ButtonExamples.t_778b4155')}
              </Button>
              <Button 
                onClick={handleAsyncClick}
                loading={loading}
                loadingText="처리 중..."
              >
                {t('common:ui.ButtonExamples.t_4a34b41a')}
              </Button>
              <Button 
                onClick={() => handleClick('prevent')}
                preventDoubleClick={true}
              >
                {t('common:ui.ButtonExamples.t_0347ee2a')}
              </Button>
            </div>
            {clickedButton && (<p className="mg-v2-v2-v2-text-sm mg-v2-v2-v2-text-center mg-v2-v2-v2-mt-md">
                {clickedButton} 버튼이 클릭되었습니다!
              </p>)}
          </div>
        </div>

        {/* 전체 너비 버튼 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>{t('common:ui.ButtonExamples.t_ed8da2b9')}</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-flex-column mg-v2-v2-v2-gap-sm">
              <Button fullWidth>{t('common:ui.ButtonExamples.t_ed8da2b9')}</Button>
              <Button fullWidth variant="outline">{t('common:ui.ButtonExamples.t_2ae899f5')}</Button>
              <Button fullWidth variant="ghost">{t('common:ui.ButtonExamples.t_a38d8aba')}</Button>
            </div>
          </div>
        </div>

        {/* 버튼 그룹 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>{t('common:ui.ButtonExamples.t_0bc66126')}</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-button-group">
              <Button variant="outline">{t('common:ui.ButtonExamples.t_2df94c84')}</Button>
              <Button variant="outline">{t('common:ui.ButtonExamples.t_d80a4e0c')}</Button>
              <Button variant="outline">{t('common:ui.ButtonExamples.t_16f66ac2')}</Button>
            </div>
          </div>
        </div>

        {/* 버튼 툴바 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>{t('common:ui.ButtonExamples.t_309852d0')}</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-button-toolbar">
              <Button icon="PLUS" size="small">{t('common:ui.ButtonExamples.t_57942995')}</Button>
              <Button icon="EDIT" size="small" variant="secondary">{t('common:ui.ButtonExamples.t_d482e14b')}</Button>
              <Button icon="TRASH" size="small" variant="error">{t('common.actions.delete')}</Button>
              <Button icon="SAVE" size="small" variant="success">{t('common.actions.save')}</Button>
            </div>
          </div>
        </div>

        {/* 역할별 테마 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>{t('common:ui.ButtonExamples.t_a161461d')}</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            {/* theme role → data-role only (not HTML ARIA role) */}
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              {/* eslint-disable-next-line jsx-a11y/aria-role */}
              <Button role="CLIENT" icon="HEART">{t('common:ui.ButtonExamples.t_d33f6077')}</Button>
              {/* eslint-disable-next-line jsx-a11y/aria-role */}
              <Button role="CONSULTANT" icon="USERS">{t('common:ui.ButtonExamples.t_7fb4b214')}</Button>
              {/* eslint-disable-next-line jsx-a11y/aria-role */}
              <Button role="ADMIN" icon="SETTINGS">{t('common:ui.ButtonExamples.t_13b1dc34')}</Button>
            </div>
          </div>
        </div>

        {/* 실제 사용 예시 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>{t('common:ui.ButtonExamples.t_7bd1e28d')}</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button 
                icon="PLUS" 
                variant="primary"
                onClick={() => handleClick('create')}
              >
                {t('common:ui.ButtonExamples.t_45a596e0')}
              </Button>
              <Button 
                icon="EDIT" 
                variant="secondary"
                onClick={() => handleClick('edit')}
              >
                {t('common:ui.ButtonExamples.t_d482e14b')}
              </Button>
              <Button 
                icon="TRASH" 
                variant="error"
                onClick={() => handleClick('delete')}
              >
                {t('common.actions.delete')}
              </Button>
              <Button 
                icon="SAVE" 
                variant="success"
                onClick={() => handleClick('save')}
              >
                {t('common.actions.save')}
              </Button>
              <Button 
                icon="CANCEL" 
                variant="outline"
                onClick={() => handleClick('cancel')}
              >
                {t('common.actions.cancel')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>);};

export default ButtonExamples;
