/**
 * Button 컴포넌트 스토리
 */


import Button from '../../components/ui/Button/Button';

export default {title: 'UI Components/Button',
  component: Button,
  parameters: {docs: {description: {component: 'MGButton을 확장한 v2.COLOR_CONSTANTS.ALPHA_TRANSPARENT 버튼 컴포넌트'}}},
  argTypes: {variant: {control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'outline', 'ghost', 'link'],
      description: '버튼 스타일 변형'},
    size: {control: 'select',
      options: ['small', 'medium', 'large'],
      description: '버튼 크기'},
    disabled: {control: 'boolean',
      description: '비활성화 상태'},
    loading: {control: 'boolean',
      description: '로딩 상태'},
    fullWidth: {control: 'boolean',
      description: '전체 너비 사용 여부'},
    icon: {control: 'text',
      description: '아이콘 이름'},
    iconPosition: {control: 'select',
      options: ['left', 'right'],
      description: '아이콘 위치'},
    role: {control: 'select',
      options: ['CLIENT', 'CONSULTANT', 'ADMIN'],
      description: '사용자 역할 (테마 적용)'},
    onClick: {action: 'clicked',
      description: '클릭 핸들러'}}};

const Template = (args) => <Button {...args}>Button</Button>;

export const Default = Template.bind({});
Default.args = {variant: 'primary',
  size: 'medium'};

export const Variants = () => (<div className="story-container">
    <div className="story-section">
      <h3>색상 변형</h3>
      <div className="story-flex">
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
  </div>);

export const Sizes = () => (<div className="story-container">
    <div className="story-section">
      <h3>크기 변형</h3>
      <div className="story-flex">
        <Button size="small">Small</Button>
        <Button size="medium">Medium</Button>
        <Button size="large">Large</Button>
      </div>
    </div>
  </div>);

export const WithIcons = () => (<div className="story-container">
    <div className="story-section">
      <h3>아이콘 버튼</h3>
      <div className="story-flex">
        <Button icon="PLUS">추가</Button>
        <Button icon="EDIT" variant="secondary">편집</Button>
        <Button icon="TRASH" variant="error">삭제</Button>
        <Button icon="SAVE" variant="success">저장</Button>
        <Button icon="SEARCH" variant="outline">검색</Button>
      </div>
    </div>
    <div className="story-section">
      <h3>아이콘 위치</h3>
      <div className="story-flex">
        <Button icon="CHEVRON_LEFT" iconPosition="left">이전</Button>
        <Button icon="CHEVRON_RIGHT" iconPosition="right">다음</Button>
        <Button icon="DOWNLOAD" iconPosition="left" variant="outline">다운로드</Button>
        <Button icon="UPLOAD" iconPosition="right" variant="outline">업로드</Button>
      </div>
    </div>
  </div>);

export const States = () => (<div className="story-container">
    <div className="story-section">
      <h3>상태별 버튼</h3>
      <div className="story-flex">
        <Button>정상</Button>
        <Button disabled>비활성화</Button>
        <Button loading>로딩 중</Button>
        <Button loading loadingText="처리 중...">로딩 중 (커스텀 텍스트)</Button>
      </div>
    </div>
  </div>);

export const FullWidth = () => (<div className="story-container">
    <div className="story-section">
      <h3>전체 너비 버튼</h3>
      <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
        <Button fullWidth>전체 너비 버튼</Button>
        <Button fullWidth variant="outline">전체 너비 아웃라인</Button>
        <Button fullWidth variant="ghost">전체 너비 고스트</Button>
      </div>
    </div>
  </div>);

export const ButtonGroup = () => (<div className="story-container">
    <div className="story-section">
      <h3>버튼 그룹</h3>
      <div className="mg-v2-v2-v2-button-group">
        <Button variant="outline">왼쪽</Button>
        <Button variant="outline">가운데</Button>
        <Button variant="outline">오른쪽</Button>
      </div>
    </div>
  </div>);

export const ButtonToolbar = () => (<div className="story-container">
    <div className="story-section">
      <h3>버튼 툴바</h3>
      <div className="mg-v2-v2-v2-button-toolbar">
        <Button icon="PLUS" size="small">추가</Button>
        <Button icon="EDIT" size="small" variant="secondary">편집</Button>
        <Button icon="TRASH" size="small" variant="error">삭제</Button>
        <Button icon="SAVE" size="small" variant="success">저장</Button>
      </div>
    </div>
  </div>);

export const RoleThemes = () => (<div className="story-container">
    <div className="story-section">
      <h3>역할별 테마</h3>
      <div className="story-flex">
        <Button role="CLIENT" icon="HEART">내담자 테마</Button>
        <Button role="CONSULTANT" icon="USERS">상담사 테마</Button>
        <Button role="ADMIN" icon="SETTINGS">관리자 테마</Button>
      </div>
    </div>
  </div>);

export const Interactive = () => {const [clicked, setClicked] = React.useState(null);
  
  return (<div className="story-container">
      <div className="story-section">
        <h3>인터랙티브 버튼</h3>
        <div className="story-flex">
          <Button onClick={() => setClicked('normal')}>
            일반 클릭
          </Button>
          <Button 
            onClick={() => setClicked('prevent')}
            preventDoubleClick={true}
          >
            중복 클릭 방지
          </Button>
        </div>
        {clicked && (<p style={{marginTop: '15px', color: 'var(--mg-v2-text)'}}>
            {clicked} 버튼이 클릭되었습니다!
          </p>)}
      </div>
    </div>);};
