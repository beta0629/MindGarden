import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TableShowcase = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const tableData = [
    { id: 1, name: '김민지', email: 'minji@example.com', role: '클라이언트', status: '활성' },
    { id: 2, name: '이서연', email: 'seoyeon@example.com', role: '상담사', status: '활성' },
    { id: 3, name: '박지훈', email: 'jihun@example.com', role: '클라이언트', status: '대기' },
    { id: 4, name: '최유진', email: 'yujin@example.com', role: '관리자', status: '활성' },
    { id: 5, name: '정민수', email: 'minsu@example.com', role: '클라이언트', status: '비활성' },
    { id: 6, name: '강하늘', email: 'haneul@example.com', role: '상담사', status: '활성' },
    { id: 7, name: '윤서아', email: 'seoa@example.com', role: '클라이언트', status: '활성' },
    { id: 8, name: '임재현', email: 'jaehyun@example.com', role: '클라이언트', status: '대기' }
  ];

  const totalPages = Math.ceil(tableData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = tableData.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status) => {
    switch (status) {
      case '활성': return '#10b981';
      case '대기': return '#f59e0b';
      case '비활성': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <section className="mg-section">
      <h2 className="mg-h2 mg-text-center mg-mb-lg">테이블</h2>
      
      <div style={{ display: 'grid', gap: 'var(--spacing-xl)' }}>
        {/* Basic Table */}
        <div>
          <h4 className="mg-h4 mg-mb-md">기본 테이블</h4>
          <div className="mg-table-container">
            <table className="mg-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>이름</th>
                <th>이메일</th>
                <th>역할</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map(item => (
                <tr key={item.id}>
                  <td data-label="ID">{item.id}</td>
                  <td data-label="이름">{item.name}</td>
                  <td data-label="이메일">{item.email}</td>
                  <td data-label="역할">{item.role}</td>
                  <td data-label="상태">
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'white',
                      backgroundColor: getStatusColor(item.status)
                    }}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          
          {/* Pagination */}
          <div className="mg-flex-center mg-gap-md" style={{ marginTop: 'var(--spacing-lg)' }}>
            <button 
              className="mg-button mg-button-outline mg-button-sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="mg-text-sm" style={{ minWidth: '100px', textAlign: 'center' }}>
              {currentPage} / {totalPages}
            </span>
            <button 
              className="mg-button mg-button-outline mg-button-sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Striped Table */}
        <div>
          <h4 className="mg-h4 mg-mb-md">줄무늬 테이블</h4>
          <div className="mg-table-container">
            <table className="mg-table mg-table-striped">
            <thead>
              <tr>
                <th>이름</th>
                <th>역할</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {tableData.slice(0, 5).map(item => (
                <tr key={item.id}>
                  <td data-label="이름">{item.name}</td>
                  <td data-label="역할">{item.role}</td>
                  <td data-label="상태">
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'white',
                      backgroundColor: getStatusColor(item.status)
                    }}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TableShowcase;

