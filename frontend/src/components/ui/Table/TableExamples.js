/**
 * Table 컴포넌트 사용 예시 (현재 Table = thead/tbody children API)
 */

import { useState } from 'react';

import Button from '../Button/Button';

import Table from './Table';

const SAMPLE_ROWS = [
  { id: 1, name: '홍길동', email: 'hong@example.com', age: 30 },
  { id: 2, name: '김철수', email: 'kim@example.com', age: 25 },
  { id: 3, name: '이영희', email: 'lee@example.com', age: 35 },
  { id: 4, name: '박민수', email: 'park@example.com', age: 28 },
  { id: 5, name: '정수진', email: 'jung@example.com', age: 32 }
];

const TableExamples = () => {
  const [currentPage] = useState(1);
  const [sortField] = useState('name');
  const [sortDirection] = useState('asc');

  const handleRowClick = (row, index) => {
    console.log('Row clicked:', row, index);
  };

  return (
    <div className="mg-v2-v2-v2-section">
      <div className="mg-v2-v2-v2-section-header">
        <h2 className="mg-v2-v2-v2-section-title">Table 컴포넌트 예시</h2>
        <p className="mg-v2-v2-v2-section-subtitle">
          시맨틱 테이블 마크업과 mg-table 스타일 (모바일에서는 data-label로 대응)
        </p>
      </div>

      <div className="mg-v2-v2-v2-section-content">
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>기본 사용법</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <Table striped hoverable>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>나이</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_ROWS.map((row) => (
                  <tr key={row.id} onClick={() => handleRowClick(row, row.id)}>
                    <td data-label="ID">{row.id}</td>
                    <td data-label="이름">{row.name}</td>
                    <td data-label="이메일">{row.email}</td>
                    <td data-label="나이">{row.age}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>

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

            <Table striped hoverable>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_ROWS.map((row) => (
                  <tr key={row.id}>
                    <td data-label="ID">{row.id}</td>
                    <td data-label="이름">{row.name}</td>
                    <td data-label="이메일">{row.email}</td>
                    <td data-label="액션">
                      <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-xs">
                        <Button size="small" icon="EDIT" variant="outline" aria-label={`${row.name} 편집`} />
                        <Button size="small" icon="TRASH" variant="error" aria-label={`${row.name} 삭제`} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className="mg-v2-v2-v2-table-pagination">
              <Button size="small" variant="outline" disabled>
                이전
              </Button>
              <span className="mg-v2-v2-v2-table-pagination-info">
                {currentPage}-{SAMPLE_ROWS.length} / {SAMPLE_ROWS.length}개 항목 (정렬: {sortField} {sortDirection})
              </span>
              <Button size="small" variant="outline" disabled>
                다음
              </Button>
            </div>
          </div>
        </div>

        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>역할별 테마 (data-role)</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-mb-md">
              <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-mb-sm">내담자 테마</h4>
              <Table data-role="CLIENT" striped>
                <tbody>
                  <tr>
                    <td data-label="이름">샘플</td>
                  </tr>
                </tbody>
              </Table>
            </div>
            <div className="mg-v2-v2-v2-mb-md">
              <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-mb-sm">상담사 테마</h4>
              <Table data-role="CONSULTANT" striped>
                <tbody>
                  <tr>
                    <td data-label="이름">샘플</td>
                  </tr>
                </tbody>
              </Table>
            </div>
            <div>
              <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-mb-sm">관리자 테마</h4>
              <Table data-role="ADMIN" striped>
                <tbody>
                  <tr>
                    <td data-label="이름">샘플</td>
                  </tr>
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableExamples;
