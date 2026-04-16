/**
 * Button 컴포넌트 스토리 (MGButton)
 */

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  Trash2,
  Upload,
  Users
} from 'lucide-react';

import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';

const storySizeToErp = (size) => (size === 'small' ? 'sm' : size === 'large' ? 'lg' : 'md');

const mgP4Story = (variant, { size = 'medium', loading = false, className = '' } = {}) =>
  buildErpMgButtonClassName({
    variant,
    size: storySizeToErp(size),
    loading,
    className
  });

export default {
  title: 'UI Components/Button',
  component: MGButton,
  parameters: {
    docs: {
      description: { component: '공통 MGButton 컴포넌트 (로딩·중복 클릭 방지)' }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'outline', 'progress'],
      description: '버튼 스타일 변형'
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: '버튼 크기'
    },
    disabled: { control: 'boolean', description: '비활성화 상태' },
    loading: { control: 'boolean', description: '로딩 상태' },
    loadingText: { control: 'text', description: '로딩 중 표시 텍스트' },
    fullWidth: { control: 'boolean', description: '전체 너비 사용 여부' },
    preventDoubleClick: { control: 'boolean', description: '중복 클릭 방지' },
    onClick: { action: 'clicked', description: '클릭 핸들러' }
  }
};

const Template = (args) => (
  <MGButton
    {...args}
    className={buildErpMgButtonClassName({
      variant: args.variant || 'primary',
      size: storySizeToErp(args.size || 'medium'),
      loading: Boolean(args.loading),
      className: args.className || ''
    })}
    loadingText={args.loadingText ?? ERP_MG_BUTTON_LOADING_TEXT}
  >
    Button
  </MGButton>
);

export const Default = Template.bind({});
Default.args = { variant: 'primary', size: 'medium' };

export const Variants = () => (
  <div className="story-container">
    <div className="story-section">
      <h3>색상 변형</h3>
      <div className="story-flex">
        <MGButton variant="primary" className={mgP4Story('primary')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>Primary</MGButton>
        <MGButton variant="secondary" className={mgP4Story('secondary')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>Secondary</MGButton>
        <MGButton variant="success" className={mgP4Story('success')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>Success</MGButton>
        <MGButton variant="warning" className={mgP4Story('warning')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>Warning</MGButton>
        <MGButton variant="danger" className={mgP4Story('danger')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>Danger</MGButton>
        <MGButton variant="info" className={mgP4Story('info')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>Info</MGButton>
        <MGButton variant="outline" className={mgP4Story('outline')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>Outline</MGButton>
        <MGButton variant="outline" className={mgP4Story('outline')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>Ghost (outline)</MGButton>
        <MGButton variant="info" className={mgP4Story('info')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>Link (info)</MGButton>
      </div>
    </div>
  </div>
);

export const Sizes = () => (
  <div className="story-container">
    <div className="story-section">
      <h3>크기 변형</h3>
      <div className="story-flex">
        <MGButton size="small" className={mgP4Story('primary', { size: 'small' })} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>Small</MGButton>
        <MGButton size="medium" className={mgP4Story('primary', { size: 'medium' })} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>Medium</MGButton>
        <MGButton size="large" className={mgP4Story('primary', { size: 'large' })} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>Large</MGButton>
      </div>
    </div>
  </div>
);

const iconSizeSmall = 14;
const iconSizeMd = 16;

export const WithIcons = () => (
  <div className="story-container">
    <div className="story-section">
      <h3>아이콘 버튼</h3>
      <div className="story-flex">
        <MGButton variant="primary" className={mgP4Story('primary')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>
          <Plus size={iconSizeMd} aria-hidden /> 추가
        </MGButton>
        <MGButton variant="secondary" className={mgP4Story('secondary')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>
          <Pencil size={iconSizeMd} aria-hidden /> 편집
        </MGButton>
        <MGButton variant="danger" className={mgP4Story('danger')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>
          <Trash2 size={iconSizeMd} aria-hidden /> 삭제
        </MGButton>
        <MGButton variant="success" className={mgP4Story('success')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>
          <Save size={iconSizeMd} aria-hidden /> 저장
        </MGButton>
        <MGButton variant="outline" className={mgP4Story('outline')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>
          <Search size={iconSizeMd} aria-hidden /> 검색
        </MGButton>
      </div>
    </div>
    <div className="story-section">
      <h3>아이콘 위치</h3>
      <div className="story-flex">
        <MGButton variant="primary" className={mgP4Story('primary')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>
          <ChevronLeft size={iconSizeMd} aria-hidden /> 이전
        </MGButton>
        <MGButton variant="primary" className={mgP4Story('primary')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>
          다음 <ChevronRight size={iconSizeMd} aria-hidden />
        </MGButton>
        <MGButton variant="outline" className={mgP4Story('outline')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>
          <Download size={iconSizeMd} aria-hidden /> 다운로드
        </MGButton>
        <MGButton variant="outline" className={mgP4Story('outline')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>
          업로드 <Upload size={iconSizeMd} aria-hidden />
        </MGButton>
      </div>
    </div>
  </div>
);

export const States = () => (
  <div className="story-container">
    <div className="story-section">
      <h3>상태별 버튼</h3>
      <div className="story-flex">
        <MGButton className={mgP4Story('primary')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>정상</MGButton>
        <MGButton disabled className={mgP4Story('primary')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>비활성화</MGButton>
        <MGButton loading className={mgP4Story('primary', { loading: true })} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>로딩 중</MGButton>
        <MGButton loading className={mgP4Story('primary', { loading: true })} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>
          로딩 중 (커스텀 텍스트)
        </MGButton>
      </div>
    </div>
  </div>
);

export const FullWidth = () => (
  <div className="story-container">
    <div className="story-section">
      <h3>전체 너비 버튼</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <MGButton fullWidth className={mgP4Story('primary')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>전체 너비 버튼</MGButton>
        <MGButton fullWidth variant="outline" className={mgP4Story('outline')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>
          전체 너비 아웃라인
        </MGButton>
        <MGButton fullWidth variant="outline" className={mgP4Story('outline')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>
          전체 너비 고스트 (outline)
        </MGButton>
      </div>
    </div>
  </div>
);

export const ButtonGroup = () => (
  <div className="story-container">
    <div className="story-section">
      <h3>버튼 그룹</h3>
      <div className="mg-v2-v2-v2-button-group">
        <MGButton variant="outline" className={mgP4Story('outline')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>왼쪽</MGButton>
        <MGButton variant="outline" className={mgP4Story('outline')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>가운데</MGButton>
        <MGButton variant="outline" className={mgP4Story('outline')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>오른쪽</MGButton>
      </div>
    </div>
  </div>
);

export const ButtonToolbar = () => (
  <div className="story-container">
    <div className="story-section">
      <h3>버튼 툴바</h3>
      <div className="mg-v2-v2-v2-button-toolbar">
        <MGButton size="small" className={mgP4Story('primary', { size: 'small' })} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>
          <Plus size={iconSizeSmall} aria-hidden /> 추가
        </MGButton>
        <MGButton size="small" variant="secondary" className={mgP4Story('secondary', { size: 'small' })} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>
          <Pencil size={iconSizeSmall} aria-hidden /> 편집
        </MGButton>
        <MGButton size="small" variant="danger" className={mgP4Story('danger', { size: 'small' })} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>
          <Trash2 size={iconSizeSmall} aria-hidden /> 삭제
        </MGButton>
        <MGButton size="small" variant="success" className={mgP4Story('success', { size: 'small' })} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>
          <Save size={iconSizeSmall} aria-hidden /> 저장
        </MGButton>
      </div>
    </div>
  </div>
);

export const RoleThemes = () => (
  <div className="story-container">
    <div className="story-section">
      <h3>역할별 테마 (데모: 아이콘+라벨)</h3>
      <div className="story-flex">
        <MGButton variant="primary" className={mgP4Story('primary')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>
          <Heart size={iconSizeMd} aria-hidden /> 내담자
        </MGButton>
        <MGButton variant="primary" className={mgP4Story('primary')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>
          <Users size={iconSizeMd} aria-hidden /> 상담사
        </MGButton>
        <MGButton variant="primary" className={mgP4Story('primary')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>
          <Settings size={iconSizeMd} aria-hidden /> 관리자
        </MGButton>
      </div>
    </div>
  </div>
);

export const Interactive = () => {
  const [clicked, setClicked] = React.useState(null);

  return (
    <div className="story-container">
      <div className="story-section">
        <h3>인터랙티브 버튼</h3>
        <div className="story-flex">
          <MGButton onClick={() => setClicked('normal')} className={mgP4Story('primary')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>일반 클릭</MGButton>
          <MGButton onClick={() => setClicked('prevent')} preventDoubleClick className={mgP4Story('primary')} loadingText={ERP_MG_BUTTON_LOADING_TEXT}>
            중복 클릭 방지
          </MGButton>
        </div>
        {clicked && (
          <p style={{ marginTop: '15px', color: 'var(--mg-v2-text)' }}>
            {clicked} 버튼이 클릭되었습니다!
          </p>
        )}
      </div>
    </div>
  );
};
