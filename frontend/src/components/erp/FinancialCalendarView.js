import React, { useState, useEffect } from 'react';
import { apiGet } from '../../utils/ajax';

/**
 * 재무 거래 달력 뷰 컴포넌트
 * 수입/지출을 달력 형태로 한눈에 표시
 */
const FinancialCalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayDetail, setDayDetail] = useState(null);

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      // 해당 월의 모든 거래 조회
      const response = await apiGet(`/api/admin/financial-transactions?year=${year}&month=${month}&size=1000`);
      
      if (response.success) {
        // 날짜별로 거래 그룹화
        const groupedByDate = {};
        response.data.forEach(transaction => {
          const date = transaction.transactionDate;
          if (!groupedByDate[date]) {
            groupedByDate[date] = {
              income: 0,
              expense: 0,
              transactions: []
            };
          }
          
          if (transaction.transactionType === 'INCOME') {
            groupedByDate[date].income += transaction.amount;
          } else {
            groupedByDate[date].expense += transaction.amount;
          }
          
          groupedByDate[date].transactions.push(transaction);
        });
        
        setCalendarData(groupedByDate);
      }
    } catch (err) {
      console.error('달력 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0';
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    
    // 이전 달의 빈 칸들
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const handleDateClick = async (day) => {
    if (!day) return;
    
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = clickedDate.toISOString().split('T')[0];
    
    setSelectedDate(dateStr);
    setDayDetail(calendarData[dateStr] || { income: 0, expense: 0, transactions: [] });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ padding: '20px' }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0, fontSize: 'var(--font-size-xxl)', color: '#333' }}>
          📅 재무 달력
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={() => navigateMonth(-1)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ◀ 이전
          </button>
          
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', minWidth: '120px', textAlign: 'center' }}>
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h3>
          
          <button
            onClick={() => navigateMonth(1)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            다음 ▶
          </button>
        </div>
      </div>

      {/* 범례 */}
      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            backgroundColor: '#28a745',
            borderRadius: '4px'
          }}></div>
          <span>💰 수입</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            backgroundColor: '#dc3545',
            borderRadius: '4px'
          }}></div>
          <span>💸 지출</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            backgroundColor: '#007bff',
            borderRadius: '4px'
          }}></div>
          <span>🔗 매핑연동</span>
        </div>
      </div>

      {/* 달력 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px',
        backgroundColor: '#dee2e6',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* 요일 헤더 */}
        {['일', '월', '화', '수', '목', '금', '토'].map((dayName, index) => (
          <div
            key={dayName}
            style={{
              padding: '12px',
              backgroundColor: '#495057',
              color: 'white',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: 'var(--font-size-sm)'
            }}
          >
            {dayName}
          </div>
        ))}

        {/* 날짜 셀들 */}
        {days.map((day, index) => {
          if (!day) {
            return (
              <div
                key={`empty-${index}`}
                style={{
                  backgroundColor: '#f8f9fa',
                  minHeight: '100px'
                }}
              />
            );
          }

          const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
            .toISOString().split('T')[0];
          const dayData = calendarData[dateStr] || { income: 0, expense: 0, transactions: [] };
          const isToday = dateStr === today;
          const hasTransactions = dayData.transactions.length > 0;

          return (
            <div
              key={day}
              onClick={() => handleDateClick(day)}
              style={{
                backgroundColor: isToday ? '#fff3cd' : 'white',
                minHeight: '100px',
                padding: '8px',
                cursor: hasTransactions ? 'pointer' : 'default',
                border: isToday ? '2px solid #ffc107' : 'none',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* 날짜 */}
              <div style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: isToday ? 'bold' : 'normal',
                color: isToday ? '#856404' : '#333',
                marginBottom: '4px'
              }}>
                {day}
              </div>

              {/* 거래 요약 */}
              {hasTransactions && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {/* 수입 */}
                  {dayData.income > 0 && (
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      padding: '2px 4px',
                      backgroundColor: '#d4edda',
                      color: '#155724',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}>
                      💰 {formatCurrency(dayData.income)}
                    </div>
                  )}
                  
                  {/* 지출 */}
                  {dayData.expense > 0 && (
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      padding: '2px 4px',
                      backgroundColor: '#f8d7da',
                      color: '#721c24',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}>
                      💸 {formatCurrency(dayData.expense)}
                    </div>
                  )}
                  
                  {/* 거래 건수 */}
                  <div style={{
                    fontSize: 'var(--font-size-xs)',
                    color: '#6c757d',
                    textAlign: 'center',
                    marginTop: 'auto'
                  }}>
                    {dayData.transactions.length}건
                  </div>
                  
                  {/* 매핑연동 표시 */}
                  {dayData.transactions.some(t => 
                    t.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' || 
                    t.description?.includes('상담료 입금 확인')
                  ) && (
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#007bff',
                      borderRadius: '50%'
                    }}></div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 선택된 날짜 상세 정보 */}
      {selectedDate && dayDetail && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '2px solid #007bff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: 0, color: '#007bff' }}>
              📊 {selectedDate} 거래 상세
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 'var(--font-size-xl)',
                cursor: 'pointer',
                color: '#6c757d'
              }}
            >
              ✕
            </button>
          </div>

          {/* 일일 요약 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '15px',
            marginBottom: '20px'
          }}>
            <div style={{
              padding: '12px',
              backgroundColor: '#d4edda',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', color: '#155724' }}>
                +{formatCurrency(dayDetail.income)}원
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: '#155724' }}>💰 총 수입</div>
            </div>
            
            <div style={{
              padding: '12px',
              backgroundColor: '#f8d7da',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', color: '#721c24' }}>
                -{formatCurrency(dayDetail.expense)}원
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: '#721c24' }}>💸 총 지출</div>
            </div>
            
            <div style={{
              padding: '12px',
              backgroundColor: '#cce7ff',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', color: '#004085' }}>
                {formatCurrency(dayDetail.income - dayDetail.expense)}원
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: '#004085' }}>💎 순이익</div>
            </div>
          </div>

          {/* 거래 목록 */}
          <div>
            <h4 style={{ marginBottom: '12px', color: '#495057' }}>
              📋 거래 내역 ({dayDetail.transactions.length}건)
            </h4>
            
            {dayDetail.transactions.length > 0 ? (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {dayDetail.transactions.map((transaction, index) => (
                  <div
                    key={transaction.id}
                    style={{
                      padding: '12px',
                      backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: 'var(--font-size-xs)',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          backgroundColor: transaction.transactionType === 'INCOME' ? '#d4edda' : '#f8d7da',
                          color: transaction.transactionType === 'INCOME' ? '#155724' : '#721c24'
                        }}>
                          #{transaction.id}
                        </span>
                        
                        {(transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' || 
                          transaction.description?.includes('상담료 입금 확인')) && (
                          <span style={{
                            fontSize: 'var(--font-size-xs)',
                            padding: '2px 6px',
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            borderRadius: '10px',
                            fontWeight: '600'
                          }}>
                            🔗 매핑연동
                          </span>
                        )}
                      </div>
                      
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', marginTop: '4px' }}>
                        {transaction.category} - {transaction.subcategory || ''}
                      </div>
                      
                      <div style={{ fontSize: 'var(--font-size-xs)', color: '#6c757d', marginTop: '2px' }}>
                        {transaction.description || '-'}
                      </div>
                    </div>
                    
                    <div style={{
                      fontSize: 'var(--font-size-base)',
                      fontWeight: 'bold',
                      color: transaction.transactionType === 'INCOME' ? '#28a745' : '#dc3545'
                    }}>
                      {transaction.transactionType === 'INCOME' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}원
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6c757d',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                이 날짜에는 거래가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 월간 통계 */}
      <div style={{
        marginTop: '20px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginBottom: '15px', color: '#495057' }}>
          📊 {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월 통계
        </h3>
        
        {(() => {
          const monthlyIncome = Object.values(calendarData).reduce((sum, day) => sum + day.income, 0);
          const monthlyExpense = Object.values(calendarData).reduce((sum, day) => sum + day.expense, 0);
          const monthlyProfit = monthlyIncome - monthlyExpense;
          const totalTransactions = Object.values(calendarData).reduce((sum, day) => sum + day.transactions.length, 0);
          
          return (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              <div style={{
                padding: '15px',
                backgroundColor: '#d4edda',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', color: '#155724' }}>
                  +{formatCurrency(monthlyIncome)}원
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: '#155724' }}>💰 월 총 수입</div>
              </div>
              
              <div style={{
                padding: '15px',
                backgroundColor: '#f8d7da',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', color: '#721c24' }}>
                  -{formatCurrency(monthlyExpense)}원
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: '#721c24' }}>💸 월 총 지출</div>
              </div>
              
              <div style={{
                padding: '15px',
                backgroundColor: monthlyProfit >= 0 ? '#cce7ff' : '#ffe6e6',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'bold',
                  color: monthlyProfit >= 0 ? '#004085' : '#721c24'
                }}>
                  {formatCurrency(monthlyProfit)}원
                </div>
                <div style={{
                  fontSize: 'var(--font-size-sm)',
                  color: monthlyProfit >= 0 ? '#004085' : '#721c24'
                }}>
                  💎 월 순이익
                </div>
              </div>
              
              <div style={{
                padding: '15px',
                backgroundColor: '#e2e3e5',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', color: '#383d41' }}>
                  {totalTransactions}건
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: '#383d41' }}>📊 총 거래</div>
              </div>
            </div>
          );
        })()}
      </div>

      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div>📅 달력 데이터를 불러오는 중...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialCalendarView;
