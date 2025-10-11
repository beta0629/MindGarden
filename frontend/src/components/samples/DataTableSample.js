import React, { useState, useMemo } from 'react';
import IPhone17Card from '../common/IPhone17Card';
import IPhone17Button from '../common/IPhone17Button';
import IPhone17Modal from '../common/IPhone17Modal';
import IPhone17PageHeader from '../common/IPhone17PageHeader';
import { useMoodTheme } from '../../hooks/useMoodTheme';


const DataTableSample = () => {
  const { currentMood, setMood } = useMoodTheme();

  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // 복잡한 데이터 샘플
  const sampleData = [
    {
      id: 1,
      name: '김민준',
      email: 'minjun@example.com',
      department: '개발팀',
      position: '시니어 개발자',
      status: 'active',
      salary: 8500000,
      joinDate: '2022-03-15',
      lastLogin: '2024-10-02 14:30',
      performance: 95,
      projects: 12,
      avatar: '👨‍💻'
    },
    {
      id: 2,
      name: '이지은',
      email: 'jieun@example.com',
      department: '디자인팀',
      position: 'UI/UX 디자이너',
      status: 'active',
      salary: 7200000,
      joinDate: '2022-07-20',
      lastLogin: '2024-10-03 09:15',
      performance: 88,
      projects: 8,
      avatar: '👩‍🎨'
    },
    {
      id: 3,
      name: '박준호',
      email: 'junho@example.com',
      department: '마케팅팀',
      position: '마케팅 매니저',
      status: 'inactive',
      salary: 6800000,
      joinDate: '2021-11-10',
      lastLogin: '2024-09-28 16:45',
      performance: 92,
      projects: 15,
      avatar: '👨‍💼'
    },
    {
      id: 4,
      name: '최유나',
      email: 'yuna@example.com',
      department: '영업팀',
      position: '영업 대표',
      status: 'active',
      salary: 7500000,
      joinDate: '2023-01-05',
      lastLogin: '2024-10-03 11:20',
      performance: 97,
      projects: 22,
      avatar: '👩‍💼'
    },
    {
      id: 5,
      name: '정현우',
      email: 'hyunwoo@example.com',
      department: '개발팀',
      position: '주니어 개발자',
      status: 'active',
      salary: 5500000,
      joinDate: '2023-06-12',
      lastLogin: '2024-10-03 13:10',
      performance: 85,
      projects: 6,
      avatar: '👨‍💻'
    },
    {
      id: 6,
      name: '한소영',
      email: 'soyoung@example.com',
      department: 'HR팀',
      position: '인사 담당자',
      status: 'active',
      salary: 6200000,
      joinDate: '2022-09-03',
      lastLogin: '2024-10-03 10:30',
      performance: 90,
      projects: 4,
      avatar: '👩‍💼'
    },
    {
      id: 7,
      name: '임태현',
      email: 'taehyun@example.com',
      department: '재무팀',
      position: '재무 분석가',
      status: 'pending',
      salary: 7100000,
      joinDate: '2024-02-14',
      lastLogin: '2024-10-02 17:00',
      performance: 87,
      projects: 9,
      avatar: '👨‍💼'
    },
    {
      id: 8,
      name: '송미래',
      email: 'mirae@example.com',
      department: '디자인팀',
      position: '그래픽 디자이너',
      status: 'active',
      salary: 5900000,
      joinDate: '2023-08-22',
      lastLogin: '2024-10-03 08:45',
      performance: 83,
      projects: 11,
      avatar: '👩‍🎨'
    },
    {
      id: 9,
      name: '윤도현',
      email: 'dohyun@example.com',
      department: '개발팀',
      position: '백엔드 개발자',
      status: 'active',
      salary: 8200000,
      joinDate: '2022-04-18',
      lastLogin: '2024-10-03 15:20',
      performance: 96,
      projects: 18,
      avatar: '👨‍💻'
    },
    {
      id: 10,
      name: '강서연',
      email: 'seoyeon@example.com',
      department: '마케팅팀',
      position: '콘텐츠 마케터',
      status: 'inactive',
      salary: 6100000,
      joinDate: '2023-03-25',
      lastLogin: '2024-09-30 12:15',
      performance: 79,
      projects: 7,
      avatar: '👩‍💼'
    }
  ];

  // 정렬 및 필터링 로직
  const filteredAndSortedData = useMemo(() => {
    let filtered = sampleData.filter(item => {
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.department.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });

    return filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [sortField, sortDirection, filterStatus, searchTerm]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedData.map(item => item.id));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: '#34c759', text: '활성' },
      inactive: { color: '#ff9500', text: '비활성' },
      pending: { color: '#007aff', text: '대기' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    
    return (
      <span
        style={{
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500',
          background: `${config.color}20`,
          color: config.color,
          border: `1px solid ${config.color}40`
        }}
      >
        {config.text}
      </span>
    );
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes bounceIn {
            0% {
              opacity: 0;
              transform: scale(0.3);
            }
            50% {
              opacity: 1;
              transform: scale(1.05);
            }
            70% {
              transform: scale(0.9);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
          
          @keyframes shake {
            0%, 100% {
              transform: translateX(0);
            }
            25% {
              transform: translateX(-5px);
            }
            75% {
              transform: translateX(5px);
            }
          }
        `}
      </style>
      <div 
        className="data-table-sample" 
        data-mood={currentMood}
        
      >
        {/* 헤더 */}
        <div 
          className="table-header"
          
        >
          <div >
            <h1 
              
            >
              📊 복잡한 데이터 테이블 샘플
            </h1>
            <p 
              
            >
              정렬, 필터링, 페이지네이션이 적용된 고급 테이블 컴포넌트입니다.
            </p>
          </div>
          <div 
            className="mood-selector"
            
          >
            {['default', 'warm', 'cool', 'elegant', 'energetic'].map((mood, index) => (
              <button 
                key={mood}
                onClick={() => setMood(mood)} 
                className={`mood-btn ${currentMood === mood ? 'active' : ''}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: `bounceIn 0.6s ease-out ${0.5 + index * 0.1}s both`,
                  background: currentMood === mood ? 'var(--mood-accent)' : 'rgba(142, 142, 147, 0.12)',
                  color: currentMood === mood ? 'white' : 'var(--mood-accent)',
                  transform: currentMood === mood ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: currentMood === mood ? 'var(--mood-shadow)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (currentMood !== mood) {
                    e.target.style.transform = 'scale(1.02)';
                    e.target.style.boxShadow = '0 4px 8px var(--mood-accent, rgba(0, 122, 255, 0.2))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentMood !== mood) {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                {mood.charAt(0).toUpperCase() + mood.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* 필터 및 검색 영역 */}
        <div 
          className="table-controls"
          
        >
          {/* 검색 입력 */}
          <div 
            
          >
            <input
              type="text"
              placeholder="이름, 이메일, 부서로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--mood-accent)';
                e.target.style.boxShadow = '0 0 0 3px var(--mood-accent, rgba(0, 122, 255, 0.1))';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* 상태 필터 */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            
          >
            <option value="all">전체 상태</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
            <option value="pending">대기</option>
          </select>

          {/* 선택된 행 정보 */}
          {selectedRows.length > 0 && (
            <div 
              
            >
              {selectedRows.length}개 선택됨
            </div>
          )}
        </div>

        {/* 테이블 */}
        <div 
          className="table-container"
          
        >
          <div >
            <table 
              
            >
              <thead>
                <tr 
                  
                >
                  <th 
                    
                  >
                    <input
                      type="checkbox"
                      checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                      onChange={handleSelectAll}
                      
                    />
                  </th>
                  {[
                    { key: 'avatar', label: '', width: '60px' },
                    { key: 'name', label: '이름' },
                    { key: 'email', label: '이메일' },
                    { key: 'department', label: '부서' },
                    { key: 'position', label: '직급' },
                    { key: 'status', label: '상태' },
                    { key: 'salary', label: '급여' },
                    { key: 'performance', label: '성과' },
                    { key: 'projects', label: '프로젝트' },
                    { key: 'lastLogin', label: '마지막 로그인' }
                  ].map((column, index) => (
                    <th 
                      key={column.key}
                      
                      onClick={() => handleSort(column.key)}
                      onMouseEnter={(e) => {
                        if (column.key !== 'avatar' && column.key !== 'status') {
                          e.target.style.background = 'rgba(0, 122, 255, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                      }}
                    >
                      {column.label}
                      {sortField === column.key && column.key !== 'avatar' && column.key !== 'status' && (
                        <span 
                          
                        >
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, index) => (
                  <tr 
                    key={row.id}
                    style={{
                      borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.2s ease',
                      animation: `fadeInUp 0.4s ease-out ${0.9 + index * 0.05}s both`,
                      background: selectedRows.includes(row.id) ? 'rgba(0, 122, 255, 0.05)' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedRows.includes(row.id)) {
                        e.target.style.background = 'rgba(0, 0, 0, 0.02)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedRows.includes(row.id)) {
                        e.target.style.background = 'transparent';
                      }
                    }}
                  >
                    <td >
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                        
                      />
                    </td>
                    <td >
                      <span >{row.avatar}</span>
                    </td>
                    <td >
                      <div>
                        <div 
                          
                        >
                          {row.name}
                        </div>
                      </div>
                    </td>
                    <td >
                      {row.email}
                    </td>
                    <td >
                      {row.department}
                    </td>
                    <td >
                      {row.position}
                    </td>
                    <td >
                      {getStatusBadge(row.status)}
                    </td>
                    <td >
                      {row.salary.toLocaleString()}원
                    </td>
                    <td >
                      <div 
                        
                      >
                        <div 
                          
                        >
                          <div 
                            style={{
                              width: `${row.performance}%`,
                              height: '100%',
                              background: row.performance >= 90 ? '#34c759' : 
                                        row.performance >= 80 ? '#ff9500' : '#ff3b30',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </div>
                        <span 
                          
                        >
                          {row.performance}%
                        </span>
                      </div>
                    </td>
                    <td >
                      {row.projects}
                    </td>
                    <td >
                      {row.lastLogin}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 페이지네이션 */}
        <div 
          className="pagination"
          
        >
          <div 
            
          >
            총 {filteredAndSortedData.length}개 중 {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)}개 표시
          </div>
          <div 
            
          >
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DataTableSample;

