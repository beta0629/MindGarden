import React, { useState, useEffect } from 'react';
import './AccountManagement.css';

const AccountManagement = () => {
  const [accounts, setAccounts] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    bankCode: '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    branchId: null,
    isPrimary: false,
    isActive: true,
    description: ''
  });

  useEffect(() => {
    loadAccounts();
    loadBanks();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/accounts/active');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error('계좌 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBanks = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/accounts/banks');
      if (response.ok) {
        const data = await response.json();
        setBanks(data);
      }
    } catch (error) {
      console.error('은행 목록 로드 실패:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const url = editingAccount 
        ? `http://localhost:8080/api/accounts/${editingAccount.id}`
        : 'http://localhost:8080/api/accounts';
      
      const method = editingAccount ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await loadAccounts();
        resetForm();
        alert(editingAccount ? '계좌가 수정되었습니다.' : '계좌가 등록되었습니다.');
      } else {
        const error = await response.json();
        alert(`오류: ${error.message || '계좌 등록/수정에 실패했습니다.'}`);
      }
    } catch (error) {
      console.error('계좌 등록/수정 실패:', error);
      alert('계좌 등록/수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      bankCode: account.bankCode,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountHolder: account.accountHolder,
      branchId: account.branchId,
      isPrimary: account.isPrimary,
      isActive: account.isActive,
      description: account.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('정말로 이 계좌를 삭제하시겠습니까?')) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8080/api/accounts/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await loadAccounts();
        alert('계좌가 삭제되었습니다.');
      } else {
        alert('계좌 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('계좌 삭제 실패:', error);
      alert('계좌 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8080/api/accounts/${id}/toggle-status`, {
        method: 'PATCH',
        credentials: 'include'
      });

      if (response.ok) {
        await loadAccounts();
        alert('계좌 상태가 변경되었습니다.');
      } else {
        alert('계좌 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('계좌 상태 변경 실패:', error);
      alert('계좌 상태 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8080/api/accounts/${id}/set-primary`, {
        method: 'PATCH',
        credentials: 'include'
      });

      if (response.ok) {
        await loadAccounts();
        alert('기본 계좌로 설정되었습니다.');
      } else {
        alert('기본 계좌 설정에 실패했습니다.');
      }
    } catch (error) {
      console.error('기본 계좌 설정 실패:', error);
      alert('기본 계좌 설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      bankCode: '',
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      branchId: null,
      isPrimary: false,
      isActive: true,
      description: ''
    });
    setEditingAccount(null);
    setShowForm(false);
  };

  const handleBankChange = (bankCode) => {
    const bank = banks.find(b => b.code === bankCode);
    setFormData(prev => ({
      ...prev,
      bankCode,
      bankName: bank ? bank.name : ''
    }));
  };

  return (
    <div className="account-management">
      <div className="account-header">
        <h2>계좌 관리</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          계좌 등록
        </button>
      </div>

      {showForm && (
        <div className="account-form-overlay">
          <div className="account-form">
            <h3>{editingAccount ? '계좌 수정' : '계좌 등록'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>은행</label>
                <select
                  value={formData.bankCode}
                  onChange={(e) => handleBankChange(e.target.value)}
                  required
                >
                  <option value="">은행을 선택하세요</option>
                  {banks.map(bank => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>계좌번호</label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="계좌번호를 입력하세요"
                  required
                />
              </div>

              <div className="form-group">
                <label>예금주명</label>
                <input
                  type="text"
                  value={formData.accountHolder}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountHolder: e.target.value }))}
                  placeholder="예금주명을 입력하세요"
                  required
                />
              </div>

              <div className="form-group">
                <label>지점 ID</label>
                <input
                  type="number"
                  value={formData.branchId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="지점 ID (선택사항)"
                />
              </div>

              <div className="form-group">
                <label>설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="계좌 설명 (선택사항)"
                  rows="3"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
                  />
                  기본 계좌로 설정
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  활성 상태
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '처리 중...' : (editingAccount ? '수정' : '등록')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="account-list">
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : (
          <table className="account-table">
            <thead>
              <tr>
                <th>은행</th>
                <th>계좌번호</th>
                <th>예금주명</th>
                <th>지점 ID</th>
                <th>상태</th>
                <th>기본계좌</th>
                <th>등록일</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(account => (
                <tr key={account.id}>
                  <td>{account.bankName}</td>
                  <td>{account.accountNumber}</td>
                  <td>{account.accountHolder}</td>
                  <td>{account.branchId || '-'}</td>
                  <td>
                    <span className={`status ${account.isActive ? 'active' : 'inactive'}`}>
                      {account.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td>
                    {account.isPrimary && <span className="primary-badge">기본</span>}
                  </td>
                  <td>{new Date(account.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEdit(account)}
                      >
                        수정
                      </button>
                      <button 
                        className="btn btn-sm btn-warning"
                        onClick={() => handleToggleStatus(account.id)}
                      >
                        {account.isActive ? '비활성화' : '활성화'}
                      </button>
                      {!account.isPrimary && (
                        <button 
                          className="btn btn-sm btn-info"
                          onClick={() => handleSetPrimary(account.id)}
                        >
                          기본설정
                        </button>
                      )}
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(account.id)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AccountManagement;
