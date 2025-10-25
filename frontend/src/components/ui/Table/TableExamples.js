/**
 * Table 컴포넌트 사용 예시
 */

import {useState} from 'react';

import Button from '../Button/Button';
import Icon from '../Icon/Icon';

import Table from './Table';

const TableExamples = () => {const [currentPage, setCurrentPage] = useState(DEFAULT_VALUES.CURRENT_PAGE);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // 샘플 데이터
  const sampleData = [{id: DEFAULT_VALUES.CURRENT_PAGE, name: '홍길동', email: 'hong@example.com', age: SECURITY_CONSTANTS.SESSION_TIMEOUT, status: 'active', role: 'user'},
    {id: FORM_CONSTANTS.MIN_INPUT_LENGTH, name: '김철수', email: 'kim@example.com', age: 25, status: 'inactive', role: 'admin'},
    {id: BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS, name: '이영희', email: 'lee@example.com', age: 35, status: 'active', role: 'user'},
    {id: DATE_CONSTANTS.WEEKS_IN_MONTH, name: '박민수', email: 'park@example.com', age: 28, status: 'pending', role: 'user'},
    {id: LOGGING_CONSTANTS.MAX_LOG_FILES, name: '정수진', email: 'jung@example.com', age: 32, status: 'active', role: 'moderator'}];

  // 기본 컬럼 정의
  const basicColumns = [{key: 'id', header: 'ID'},
    {key: 'name', header: '이름'},
    {key: 'email', header: '이메일'},
    {key: 'age', header: '나이'}];

  // 커스텀 렌더링 컬럼
  const customColumns = [{key: 'id', header: 'ID'},
    {key: 'name', header: '이름'},
    {key: 'email', header: '이메일'},
    {key: 'age', header: '나이'},
    {key: 'status', 
      header: '상태',
      render: (value) => (<span className={`mg-v2-badge mg-v2-badge--${value}`}>
          {value === 'active' ? '활성' : value === 'inactive' ? '비활성' : '대기'}
        </span>)},
    {key: 'role', 
      header: '역할',
      render: (value) => (<span className={`mg-v2-badge mg-v2-badge--${value}`}>
          {value === 'admin' ? '관리자' : value === 'moderator' ? '모더레이터' : '사용자'}
        </span>)},
    {key: 'actions',
      header: '액션',
      render: (value, row) => (<div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-xs">
          <Button size="small" icon="EDIT" variant="outline" />
          <Button size="small" icon="TRASH" variant="error" />
        </div>)}];

  // 정렬 가능한 컬럼
  const sortableColumns = [{key: 'id', header: 'ID', sortable: true},
    {key: 'name', header: '이름', sortable: true},
    {key: 'email', header: '이메일', sortable: true},
    {key: 'age', header: '나이', sortable: true}];

  // 행 클릭 핸들러
  const handleRowClick = (row, index) => {console.log('Row clicked:', row, index);};

  // 셀 클릭 핸들러
  const handleCellClick = (cell, row, rowIndex, columnIndex) => {console.log('Cell clicked:', cell, row, rowIndex, columnIndex);};

  return (<div className="mg-v2-v2-v2-section">
      <div className="mg-v2-v2-v2-section-header">
        <h2 className="mg-v2-v2-v2-section-title">Table 컴포넌트 예시</h2>
        <p className="mg-v2-v2-v2-section-subtitle">
          반응형 테이블 컴포넌트의 다양한 사용법 (모바일에서 카드 형태로 변환)
        </p>
      </div>

      <div className="mg-v2-v2-v2-section-content">
        {/* 기본 사용법 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>기본 사용법</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <Table 
              data={sampleData} 
              columns={basicColumns}
              onRowClick={handleRowClick}
              onCellClick={handleCellClick}
            />
          </div>
        </div>

        {/* 크기 변형 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>크기 변형</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-mb-md">
              <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-mb-sm">Small</h4>
              <Table 
                data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} 
                columns={basicColumns}
                size="small"
              />
            </div>
            <div className="mg-v2-v2-v2-mb-md">
              <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-mb-sm">Medium</h4>
              <Table 
                data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} 
                columns={basicColumns}
                size="medium"
              />
            </div>
            <div>
              <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-mb-sm">Large</h4>
              <Table 
                data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} 
                columns={basicColumns}
                size="large"
              />
            </div>
          </div>
        </div>

        {/* 변형 스타일 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>변형 스타일</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-mb-md">
              <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-mb-sm">Striped</h4>
              <Table 
                data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} 
                columns={basicColumns}
                variant="striped"
              />
            </div>
            <div className="mg-v2-v2-v2-mb-md">
              <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-mb-sm">Bordered</h4>
              <Table 
                data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} 
                columns={basicColumns}
                variant="bordered"
              />
            </div>
            <div className="mg-v2-v2-v2-mb-md">
              <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-mb-sm">Hover</h4>
              <Table 
                data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} 
                columns={basicColumns}
                variant="hover"
              />
            </div>
            <div>
              <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-mb-sm">Minimal</h4>
              <Table 
                data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} 
                columns={basicColumns}
                variant="minimal"
              />
            </div>
          </div>
        </div>

        {/* 커스텀 렌더링 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>커스텀 렌더링</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <Table 
              data={sampleData} 
              columns={customColumns}
              onRowClick={handleRowClick}
            />
          </div>
        </div>

        {/* 상태별 테이블 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>상태별 테이블</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-mb-md">
              <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-mb-sm">로딩 상태</h4>
              <Table 
                data={[]} 
                columns={basicColumns}
                loading={true}
              />
            </div>
            <div className="mg-v2-v2-v2-mb-md">
              <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-mb-sm">빈 데이터</h4>
              <Table 
                data={[]} 
                columns={basicColumns}
                emptyMessage="사용자 데이터가 없습니다."
              />
            </div>
            <div>
              <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-mb-sm">정상 데이터</h4>
              <Table 
                data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} 
                columns={basicColumns}
              />
            </div>
          </div>
        </div>

        {/* 정렬 기능 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>정렬 기능</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <Table 
              data={sampleData} 
              columns={sortableColumns}
              onRowClick={handleRowClick}
            />
          </div>
        </div>

        {/* 반응형 테이블 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>반응형 테이블</h3>
            <p className="mg-v2-v2-v2-text-sm mg-v2-v2-v2-text-muted">
              모바일에서는 카드 형태로 자동 변환됩니다.
            </p>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <Table 
              data={sampleData} 
              columns={customColumns}
              responsive={true}
              onRowClick={handleRowClick}
            />
          </div>
        </div>

        {/* 실제 사용 예시 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>실제 사용 예시</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-sm mg-v2-v2-v2-mb-md">
              <Button icon="PLUS" size="small">
                사용자 추가
              </Button>
              <Button icon="DOWNLOAD" size="small" variant="outline">
                내보내기
              </Button>
              <Button icon="SETTINGS" size="small" variant="ghost">
                설정
              </Button>
            </div>
            
            <Table 
              data={sampleData} 
              columns={customColumns}
              striped={true}
              hover={true}
              onRowClick={handleRowClick}
            />
            
            <div className="mg-v2-v2-v2-table-pagination">
              <Button size="small" variant="outline" disabled>
                이전
              </Button>
              <span className="mg-v2-v2-v2-table-pagination-info">
                DEFAULT_VALUES.CURRENT_PAGE-LOGGING_CONSTANTS.MAX_LOG_FILES / LOGGING_CONSTANTS.MAX_LOG_FILES개 항목
              </span>
              <Button size="small" variant="outline" disabled>
                다음
              </Button>
            </div>
          </div>
        </div>

        {/* 역할별 테마 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>역할별 테마</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-mb-md">
              <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-mb-sm">내담자 테마</h4>
              <Table 
                data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} 
                columns={basicColumns}
                role="CLIENT"
              />
            </div>
            <div className="mg-v2-v2-v2-mb-md">
              <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-mb-sm">상담사 테마</h4>
              <Table 
                data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} 
                columns={basicColumns}
                role="CONSULTANT"
              />
            </div>
            <div>
              <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-mb-sm">관리자 테마</h4>
              <Table 
                data={sampleData.slice(COLOR_CONSTANTS.ALPHA_TRANSPARENT, BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS)} 
                columns={basicColumns}
                role="ADMIN"
              />
            </div>
          </div>
        </div>
      </div>
    </div>);};

export default TableExamples;
