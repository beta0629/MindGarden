/**
 * Table 컴포넌트 스토리
 */


import Button from '../../components/ui/Button/Button';
import Table from '../../components/ui/Table/Table';

const sampleData = [{id: DEFAULT_VALUES.CURRENT_PAGE, name: '홍길동', email: 'hong@example.com', age: SECURITY_CONSTANTS.SESSION_TIMEOUT, status: 'active', role: 'user'},
  {id: FORM_CONSTANTS.MIN_INPUT_LENGTH, name: '김철수', email: 'kim@example.com', age: 25, status: 'inactive', role: 'admin'},
  {id: BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS, name: '이영희', email: 'lee@example.com', age: 35, status: 'active', role: 'user'},
  {id: DATE_CONSTANTS.WEEKS_IN_MONTH, name: '박민수', email: 'park@example.com', age: 28, status: 'pending', role: 'user'},
  {id: LOGGING_CONSTANTS.MAX_LOG_FILES, name: '정수진', email: 'jung@example.com', age: 32, status: 'active', role: 'moderator'}];

const basicColumns = [{key: 'id', header: 'ID'},
  {key: 'name', header: '이름'},
  {key: 'email', header: '이메일'},
  {key: 'age', header: '나이'}];

const customColumns = [{key: 'id', header: 'ID'},
  {key: 'name', header: '이름'},
  {key: 'email', header: '이메일'},
  {key: 'age', header: '나이'},
  {key: 'status', 
    header: '상태',
    render: (value) => (<span style={{padding: '4px 8px', 
        borderRadius: '4px', 
        fontSize: '12px',
        backgroundColor: value === 'active' ? '#d4edda' : value === 'inactive' ? '#f8d7da' : '#fff3cd',
        color: value === 'active' ? '#155724' : value === 'inactive' ? '#721c24' : '#856404'}}>
        {value === 'active' ? '활성' : value === 'inactive' ? '비활성' : '대기'}
      </span>)},
  {key: 'role', 
    header: '역할',
    render: (value) => (<span style={{padding: '4px 8px', 
        borderRadius: '4px', 
        fontSize: '12px',
        backgroundColor: value === 'admin' ? '#d1ecf1' : value === 'moderator' ? '#e2e3e5' : '#f8f9fa',
        color: value === 'admin' ? '#0c5460' : value === 'moderator' ? '#383d41' : '#6c757d'}}>
        {value === 'admin' ? '관리자' : value === 'moderator' ? '모더레이터' : '사용자'}
      </span>)},
  {key: 'actions',
    header: '액션',
    render: (value, row) => (<div style={{display: 'flex', gap: '5px'}}>
        <Button size="small" icon="EDIT" variant="outline" />
        <Button size="small" icon="TRASH" variant="error" />
      </div>)}];

export default {title: 'UI Components/Table',
  component: Table,
  parameters: {docs: {description: {component: '반응형 테이블 컴포넌트 (모바일에서 카드 형태로 변환)'}}},
  argTypes: {data: {control: 'object',
      description: '테이블 데이터'},
    columns: {control: 'object',
      description: '컬럼 정의'},
    variant: {control: 'select',
      options: ['default', 'striped', 'bordered', 'hover', 'minimal'],
      description: '테이블 변형'},
    size: {control: 'select',
      options: ['small', 'medium', 'large'],
      description: '테이블 크기'},
    striped: {control: 'boolean',
      description: '줄무늬 스타일'},
    hover: {control: 'boolean',
      description: '호버 효과'},
    bordered: {control: 'boolean',
      description: '테두리 표시'},
    responsive: {control: 'boolean',
      description: '반응형 여부'},
    loading: {control: 'boolean',
      description: '로딩 상태'},
    role: {control: 'select',
      options: ['CLIENT', 'CONSULTANT', 'ADMIN'],
      description: '사용자 역할 (테마 적용)'},
    onRowClick: {action: 'row-clicked',
      description: '행 클릭 핸들러'},
    onCellClick: {action: 'cell-clicked',
      description: '셀 클릭 핸들러'}}};

const Template = (args) => <Table {...args} />;

export const Default = Template.bind({});
Default.args = {data: sampleData,
  columns: basicColumns,
  variant: 'default',
  size: 'medium'};

export const Sizes = () => (<div className="story-container">
    <div className="story-section">
      <h3>테이블 크기</h3>
      <div style={{marginBottom: '20px'}}>
        <h4>Small</h4>
        <Table data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} columns={basicColumns} size="small" />
      </div>
      <div style={{marginBottom: '20px'}}>
        <h4>Medium</h4>
        <Table data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} columns={basicColumns} size="medium" />
      </div>
      <div>
        <h4>Large</h4>
        <Table data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} columns={basicColumns} size="large" />
      </div>
    </div>
  </div>);

export const Variants = () => (<div className="story-container">
    <div className="story-section">
      <h3>테이블 변형</h3>
      <div style={{marginBottom: '20px'}}>
        <h4>Striped</h4>
        <Table data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} columns={basicColumns} variant="striped" />
      </div>
      <div style={{marginBottom: '20px'}}>
        <h4>Bordered</h4>
        <Table data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} columns={basicColumns} variant="bordered" />
      </div>
      <div style={{marginBottom: '20px'}}>
        <h4>Hover</h4>
        <Table data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} columns={basicColumns} variant="hover" />
      </div>
      <div>
        <h4>Minimal</h4>
        <Table data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} columns={basicColumns} variant="minimal" />
      </div>
    </div>
  </div>);

export const CustomRendering = () => (<div className="story-container">
    <div className="story-section">
      <h3>커스텀 렌더링</h3>
      <Table data={sampleData} columns={customColumns} />
    </div>
  </div>);

export const States = () => (<div className="story-container">
    <div className="story-section">
      <h3>상태별 테이블</h3>
      <div style={{marginBottom: '20px'}}>
        <h4>로딩 상태</h4>
        <Table data={[]} columns={basicColumns} loading={true} />
      </div>
      <div style={{marginBottom: '20px'}}>
        <h4>빈 데이터</h4>
        <Table data={[]} columns={basicColumns} emptyMessage="사용자 데이터가 없습니다." />
      </div>
      <div>
        <h4>정상 데이터</h4>
        <Table data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} columns={basicColumns} />
      </div>
    </div>
  </div>);

export const Interactive = () => {const [clickedRow, setClickedRow] = React.useState(null);
  const [clickedCell, setClickedCell] = React.useState(null);

  const handleRowClick = (row, index) => {setClickedRow({row, index});};

  const handleCellClick = (cell, row, rowIndex, columnIndex) => {setClickedCell({cell, row, rowIndex, columnIndex});};

  return (<div className="story-container">
      <div className="story-section">
        <h3>인터랙티브 테이블</h3>
        <Table 
          data={sampleData} 
          columns={basicColumns}
          onRowClick={handleRowClick}
          onCellClick={handleCellClick}
          hover={true}
        />
        {clickedRow && (<div style={{marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px'}}>
            <strong>클릭된 행:</strong> {clickedRow.row.name} (인덱스: {clickedRow.index})
          </div>)}
        {clickedCell && (<div style={{marginTop: '15px', padding: '10px', backgroundColor: '#e9ecef', borderRadius: '4px'}}>
            <strong>클릭된 셀:</strong> {clickedCell.cell} (행: {clickedCell.rowIndex}, 열: {clickedCell.columnIndex})
          </div>)}
      </div>
    </div>);};

export const Responsive = () => (<div className="story-container">
    <div className="story-section">
      <h3>반응형 테이블</h3>
      <p style={{marginBottom: '15px', color: 'var(--mg-v2-secondary)'}}>
        모바일에서는 카드 형태로 자동 변환됩니다.
      </p>
      <Table 
        data={sampleData} 
        columns={customColumns}
        responsive={true}
        striped={true}
        hover={true}
      />
    </div>
  </div>);

export const RoleThemes = () => (<div className="story-container">
    <div className="story-section">
      <h3>역할별 테마</h3>
      <div style={{marginBottom: '20px'}}>
        <h4>내담자 테마</h4>
        <Table data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} columns={basicColumns} role="CLIENT" />
      </div>
      <div style={{marginBottom: '20px'}}>
        <h4>상담사 테마</h4>
        <Table data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} columns={basicColumns} role="CONSULTANT" />
      </div>
      <div>
        <h4>관리자 테마</h4>
        <Table data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} columns={basicColumns} role="ADMIN" />
      </div>
    </div>
  </div>);
