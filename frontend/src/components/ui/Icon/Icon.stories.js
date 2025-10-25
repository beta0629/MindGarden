/**
 * Icon 컴포넌트 스토리
 */


import Icon from '../../components/ui/Icon/Icon';
import {ICONS} from '../../constants/icons';

export default {title: 'UI Components/Icon',
  component: Icon,
  parameters: {docs: {description: {component: '중앙화된 아이콘 시스템을 사용하는 재사용 가능한 아이콘 컴포넌트'}}},
  argTypes: {name: {control: 'select',
      options: Object.keys(ICONS),
      description: '아이콘 이름 (ICONS 객체의 키)'},
    size: {control: 'select',
      options: ['XS', 'SM', 'MD', 'LG', 'XL', 'XXL', 'XXXL', 'HUGE'],
      description: '아이콘 크기'},
    color: {control: 'select',
      options: ['PRIMARY', 'SECONDARY', 'SUCCESS', 'WARNING', 'ERROR', 'INFO', 'MUTED', 'TRANSPARENT'],
      description: '아이콘 색상'},
    role: {control: 'select',
      options: ['CLIENT', 'CONSULTANT', 'ADMIN'],
      description: '사용자 역할 (테마 적용)'},
    variant: {control: 'select',
      options: ['default', 'outlined', 'filled', 'minimal'],
      description: '아이콘 변형'},
    disabled: {control: 'boolean',
      description: '비활성화 상태'},
    loading: {control: 'boolean',
      description: '로딩 상태'},
    onClick: {action: 'clicked',
      description: '클릭 핸들러'}}};

const Template = (args) => <Icon {...args} />;

export const Default = Template.bind({});
Default.args = {name: 'CALENDAR',
  size: 'MD',
  color: 'PRIMARY'};

export const Sizes = () => (<div className="story-container">
    <div className="story-section">
      <h3>크기 변형</h3>
      <div className="story-flex">
        <Icon name="CALENDAR" size="XS" />
        <Icon name="CALENDAR" size="SM" />
        <Icon name="CALENDAR" size="MD" />
        <Icon name="CALENDAR" size="LG" />
        <Icon name="CALENDAR" size="XL" />
        <Icon name="CALENDAR" size="XXL" />
        <Icon name="CALENDAR" size="XXXL" />
        <Icon name="CALENDAR" size="HUGE" />
      </div>
    </div>
  </div>);

export const Colors = () => (<div className="story-container">
    <div className="story-section">
      <h3>색상 변형</h3>
      <div className="story-flex">
        <Icon name="CALENDAR" color="PRIMARY" />
        <Icon name="CALENDAR" color="SECONDARY" />
        <Icon name="CALENDAR" color="SUCCESS" />
        <Icon name="CALENDAR" color="WARNING" />
        <Icon name="CALENDAR" color="ERROR" />
        <Icon name="CALENDAR" color="INFO" />
        <Icon name="CALENDAR" color="MUTED" />
        <Icon name="CALENDAR" color="TRANSPARENT" />
      </div>
    </div>
  </div>);

export const Variants = () => (<div className="story-container">
    <div className="story-section">
      <h3>변형 스타일</h3>
      <div className="story-flex">
        <Icon name="CALENDAR" variant="default" />
        <Icon name="CALENDAR" variant="outlined" />
        <Icon name="CALENDAR" variant="filled" />
        <Icon name="CALENDAR" variant="minimal" />
      </div>
    </div>
  </div>);

export const Clickable = () => (<div className="story-container">
    <div className="story-section">
      <h3>클릭 가능한 아이콘</h3>
      <div className="story-flex">
        <Icon name="CALENDAR" onClick={() => alert('달력 클릭!')} />
        <Icon name="SETTINGS" onClick={() => alert('설정 클릭!')} />
        <Icon name="BELL" onClick={() => alert('알림 클릭!')} />
        <Icon name="SEARCH" onClick={() => alert('검색 클릭!')} />
      </div>
    </div>
  </div>);

export const States = () => (<div className="story-container">
    <div className="story-section">
      <h3>상태별 아이콘</h3>
      <div className="story-flex">
        <Icon name="CALENDAR" />
        <Icon name="CALENDAR" disabled />
        <Icon name="CALENDAR" loading />
      </div>
    </div>
  </div>);

export const RoleThemes = () => (<div className="story-container">
    <div className="story-section">
      <h3>역할별 테마</h3>
      <div className="story-flex">
        <Icon name="CALENDAR" role="CLIENT" color="PRIMARY" />
        <Icon name="CALENDAR" role="CONSULTANT" color="PRIMARY" />
        <Icon name="CALENDAR" role="ADMIN" color="PRIMARY" />
      </div>
    </div>
  </div>);

export const CommonIcons = () => (<div className="story-container">
    <div className="story-section">
      <h3>자주 사용되는 아이콘</h3>
      <div className="story-grid">
        <Icon name="CALENDAR" />
        <Icon name="USERS" />
        <Icon name="SETTINGS" />
        <Icon name="BELL" />
        <Icon name="SEARCH" />
        <Icon name="PLUS" />
        <Icon name="EDIT" />
        <Icon name="TRASH" />
        <Icon name="SAVE" />
        <Icon name="CANCEL" />
        <Icon name="CHECK" />
        <Icon name="X" />
        <Icon name="CHEVRON_DOWN" />
        <Icon name="CHEVRON_UP" />
        <Icon name="CHEVRON_LEFT" />
        <Icon name="CHEVRON_RIGHT" />
        <Icon name="HOME" />
        <Icon name="BAR_CHART" />
        <Icon name="PIE_CHART" />
        <Icon name="TRENDING_UP" />
        <Icon name="TRENDING_DOWN" />
        <Icon name="CLOCK" />
        <Icon name="MAP_PIN" />
        <Icon name="MAIL" />
        <Icon name="PHONE" />
        <Icon name="MESSAGE" />
        <Icon name="FILE_TEXT" />
        <Icon name="DOWNLOAD" />
        <Icon name="UPLOAD" />
        <Icon name="EYE" />
        <Icon name="EYE_OFF" />
        <Icon name="LOCK" />
        <Icon name="UNLOCK" />
        <Icon name="STAR" />
        <Icon name="HEART" />
        <Icon name="THUMBS_UP" />
        <Icon name="THUMBS_DOWN" />
        <Icon name="SHARE" />
        <Icon name="COPY" />
        <Icon name="LINK" />
        <Icon name="EXTERNAL_LINK" />
        <Icon name="FILTER" />
        <Icon name="SORT_ASC" />
        <Icon name="SORT_DESC" />
        <Icon name="REFRESH" />
        <Icon name="LOADER" />
        <Icon name="ALERT_CIRCLE" />
        <Icon name="CHECK_CIRCLE" />
        <Icon name="INFO" />
        <Icon name="HELP_CIRCLE" />
      </div>
    </div>
  </div>);
