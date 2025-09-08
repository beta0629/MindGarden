import React, { useState, useEffect } from 'react';
import SimpleLayout from '../layout/SimpleLayout';
import notificationManager from '../../utils/notification';

/**
 * 수퍼어드민 자금 대시보드 컴포넌트
 * - 전체 수익/지출 현황
 * - 월별/연별 재무 통계
 * - 결제 현황 및 분석
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */
const FinanceDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [financeData, setFinanceData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    monthlyRevenue: [],
    paymentStats: {
      totalPayments: 0,
      pendingPayments: 0,
      completedPayments: 0,
      failedPayments: 0
    }
  });

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      console.log('재무 데이터 로드 시작...');
      
      // 올바른 API 엔드포인트로 수정
      const response = await fetch('http://localhost:8080/api/super-admin/finance/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('재무 데이터 로드 성공:', data);
        setFinanceData(data.data);
        notificationManager.success('재무 데이터를 성공적으로 불러왔습니다.');
      } else {
        throw new Error(data.message || '재무 데이터를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('재무 데이터 로드 실패:', error);
      notificationManager.error(error.message || '재무 데이터를 불러오는데 실패했습니다.');
      
      // 에러 시 기본 데이터로 폴백
      setFinanceData({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        monthlyRevenue: [],
        paymentStats: {
          totalPayments: 0,
          pendingPayments: 0,
          completedPayments: 0,
          failedPayments: 0
        }
      });
    } finally {
      // 최소 로딩 시간 보장
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const handleRefresh = async () => {
    console.log('재무 데이터 새로고침...');
    await loadFinanceData();
    notificationManager.success('데이터가 새로고침되었습니다.');
  };

  return (
    <SimpleLayout>
      <div style={{
        padding: '20px',
        background: '#f8f9fa',
        minHeight: '100vh'
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          padding: '20px',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{
            display: 'flex',
            alignItems: 'center',
            margin: 0,
            fontSize: '2rem',
            fontWeight: '700',
            color: '#2c3e50'
          }}>
            <i className="bi bi-currency-dollar" style={{
              marginRight: '15px',
              color: '#28a745',
              fontSize: '2.2rem'
            }}></i>
            자금 관리 대시보드
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                border: '2px solid #007bff',
                borderRadius: '8px',
                background: 'transparent',
                color: '#007bff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.3s ease'
              }}
              onClick={handleRefresh}
              disabled={loading}
              onMouseOver={(e) => !loading && (e.target.style.background = '#007bff', e.target.style.color = '#ffffff')}
              onMouseOut={(e) => !loading && (e.target.style.background = 'transparent', e.target.style.color = '#007bff')}
            >
              <i className="bi bi-arrow-clockwise"></i>
              새로고침
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">로딩 중...</span>
            </div>
            <p style={{
              marginTop: '20px',
              color: '#6c757d',
              fontSize: '1.1rem'
            }}>재무 데이터를 불러오는 중...</p>
          </div>
        ) : (
          <>
            {/* 주요 지표 카드 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {/* 총 수익 카드 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '25px',
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
                border: '2px solid #e9ecef'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '20px',
                  fontSize: '1.8rem',
                  color: '#ffffff',
                  background: '#28a745'
                }}>
                  <i className="bi bi-graph-up-arrow"></i>
                </div>
                <div>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#6c757d'
                  }}>총 수익</h3>
                  <p style={{
                    margin: '0 0 5px 0',
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#2c3e50'
                  }}>{formatCurrency(financeData.totalRevenue)}</p>
                  <span style={{
                    fontSize: '0.9rem',
                    color: '#6c757d'
                  }}>누적 수익</span>
                </div>
              </div>

              {/* 총 지출 카드 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '25px',
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
                border: '2px solid #e9ecef'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '20px',
                  fontSize: '1.8rem',
                  color: '#ffffff',
                  background: '#dc3545'
                }}>
                  <i className="bi bi-graph-down-arrow"></i>
                </div>
                <div>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#6c757d'
                  }}>총 지출</h3>
                  <p style={{
                    margin: '0 0 5px 0',
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#2c3e50'
                  }}>{formatCurrency(financeData.totalExpenses)}</p>
                  <span style={{
                    fontSize: '0.9rem',
                    color: '#6c757d'
                  }}>누적 지출</span>
                </div>
              </div>

              {/* 순이익 카드 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '25px',
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
                border: '2px solid #e9ecef'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '20px',
                  fontSize: '1.8rem',
                  color: '#ffffff',
                  background: '#007bff'
                }}>
                  <i className="bi bi-cash-stack"></i>
                </div>
                <div>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#6c757d'
                  }}>순이익</h3>
                  <p style={{
                    margin: '0 0 5px 0',
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#2c3e50'
                  }}>{formatCurrency(financeData.netProfit)}</p>
                  <span style={{
                    fontSize: '0.9rem',
                    color: '#6c757d'
                  }}>수익 - 지출</span>
                </div>
              </div>
            </div>

            {/* 결제 현황 */}
            <div style={{
              background: '#ffffff',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              marginBottom: '30px'
            }}>
              <h2 style={{
                margin: '0 0 25px 0',
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{
                  content: '""',
                  width: '4px',
                  height: '24px',
                  background: '#007bff',
                  marginRight: '12px',
                  borderRadius: '2px'
                }}></span>
                결제 현황
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px'
              }}>
                {/* 전체 결제 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#e9ecef'}
                onMouseOut={(e) => e.target.style.background = '#f8f9fa'}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '15px',
                    fontSize: '1.5rem',
                    color: '#ffffff',
                    background: '#6c757d'
                  }}>
                    <i className="bi bi-credit-card"></i>
                  </div>
                  <div>
                    <h4 style={{
                      margin: '0 0 5px 0',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#495057'
                    }}>전체 결제</h4>
                    <p style={{
                      margin: 0,
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#2c3e50'
                    }}>{financeData.paymentStats.totalPayments}건</p>
                  </div>
                </div>

                {/* 완료된 결제 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#e9ecef'}
                onMouseOut={(e) => e.target.style.background = '#f8f9fa'}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '15px',
                    fontSize: '1.5rem',
                    color: '#ffffff',
                    background: '#28a745'
                  }}>
                    <i className="bi bi-check-circle"></i>
                  </div>
                  <div>
                    <h4 style={{
                      margin: '0 0 5px 0',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#495057'
                    }}>완료된 결제</h4>
                    <p style={{
                      margin: 0,
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#2c3e50'
                    }}>{financeData.paymentStats.completedPayments}건</p>
                  </div>
                </div>

                {/* 대기 중 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#e9ecef'}
                onMouseOut={(e) => e.target.style.background = '#f8f9fa'}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '15px',
                    fontSize: '1.5rem',
                    color: '#ffffff',
                    background: '#ffc107'
                  }}>
                    <i className="bi bi-clock"></i>
                  </div>
                  <div>
                    <h4 style={{
                      margin: '0 0 5px 0',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#495057'
                    }}>대기 중</h4>
                    <p style={{
                      margin: 0,
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#2c3e50'
                    }}>{financeData.paymentStats.pendingPayments}건</p>
                  </div>
                </div>

                {/* 실패한 결제 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#e9ecef'}
                onMouseOut={(e) => e.target.style.background = '#f8f9fa'}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '15px',
                    fontSize: '1.5rem',
                    color: '#ffffff',
                    background: '#dc3545'
                  }}>
                    <i className="bi bi-x-circle"></i>
                  </div>
                  <div>
                    <h4 style={{
                      margin: '0 0 5px 0',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#495057'
                    }}>실패한 결제</h4>
                    <p style={{
                      margin: 0,
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#2c3e50'
                    }}>{financeData.paymentStats.failedPayments}건</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 월별 수익/지출 차트 */}
            <div style={{
              background: '#ffffff',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{
                margin: '0 0 25px 0',
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{
                  content: '""',
                  width: '4px',
                  height: '24px',
                  background: '#007bff',
                  marginRight: '12px',
                  borderRadius: '2px'
                }}></span>
                월별 수익/지출 현황
              </h2>
              <div style={{
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '2px dashed #dee2e6'
              }}>
                <div style={{
                  textAlign: 'center',
                  color: '#6c757d'
                }}>
                  <i className="bi bi-bar-chart" style={{
                    fontSize: '3rem',
                    marginBottom: '15px',
                    color: '#adb5bd'
                  }}></i>
                  <p style={{
                    margin: 0,
                    fontSize: '1.1rem'
                  }}>차트 구현 예정</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </SimpleLayout>
  );
};

export default FinanceDashboard;
