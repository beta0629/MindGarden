import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../constants/api';
import notificationManager from '../../utils/notification';
import './BranchMappingModal.css';

/**
 * 지점 매핑 모달 컴포넌트
 * 관리자가 지점코드가 없을 때 지점을 매핑하는 모달
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-12
 */
const BranchMappingModal = ({ isOpen, onClose, onSuccess }) => {
  // === 상태 관리 ===
  const [branches, setBranches] = useState([]);
  const [selectedBranchCode, setSelectedBranchCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [error, setError] = useState(null);

  // === 초기 로딩 ===
  useEffect(() => {
    if (isOpen) {
      loadBranches();
    }
  }, [isOpen]);

  // === API 호출 함수들 ===
  
  /**
   * 지점 목록 조회
   */
  const loadBranches = async () => {
    try {
      setIsLoadingBranches(true);
      setError(null);
      
      const response = await fetch('/api/branches/active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('지점 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      // API 응답이 배열 형태이므로 직접 사용
      setBranches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('지점 목록 조회 오류:', error);
      setError('지점 목록을 불러오는데 실패했습니다.');
      notificationManager.show('지점 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setIsLoadingBranches(false);
    }
  };

  /**
   * 지점 매핑 처리
   */
  const handleBranchMapping = async (e) => {
    e.preventDefault();
    
    if (!selectedBranchCode) {
      setError('지점을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/map-branch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          branchCode: selectedBranchCode
        })
      });

      const data = await response.json();

      if (data.success) {
        notificationManager.show(data.message, 'success');
        onSuccess && onSuccess(data);
        onClose();
      } else {
        setError(data.message || '지점 매핑에 실패했습니다.');
        notificationManager.show(data.message || '지점 매핑에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('지점 매핑 오류:', error);
      setError('지점 매핑 중 오류가 발생했습니다.');
      notificationManager.show('지점 매핑 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // === 이벤트 핸들러 ===
  
  const handleBranchChange = (e) => {
    setSelectedBranchCode(e.target.value);
    setError(null);
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedBranchCode('');
      setError(null);
      onClose();
    }
  };

  // === 렌더링 ===
  
  if (!isOpen) {
    return null;
  }

  return (
    <div className="branch-mapping-modal-overlay">
      <div className="branch-mapping-modal">
        <div className="branch-mapping-modal-header">
          <h2>지점 매핑 설정</h2>
          <button 
            type="button" 
            className="close-button"
            onClick={handleClose}
            disabled={isLoading}
          >
            ×
          </button>
        </div>
        
        <div className="branch-mapping-modal-body">
          <div className="branch-mapping-info">
            <p>관리자 계정에 지점을 매핑해주세요.</p>
            <p>지점을 선택하면 해당 지점의 사용자들을 관리할 수 있습니다.</p>
          </div>
          
          <form onSubmit={handleBranchMapping} className="branch-mapping-form">
            <div className="form-group">
              <label htmlFor="branchSelect">지점 선택 *</label>
              {isLoadingBranches ? (
                <div className="loading-placeholder">
                  지점 목록을 불러오는 중...
                </div>
              ) : (
                <select
                  id="branchSelect"
                  value={selectedBranchCode}
                  onChange={handleBranchChange}
                  className="form-select"
                  required
                  disabled={isLoading}
                >
                  <option value="">지점을 선택해주세요</option>
                  {branches.map((branch) => (
                    <option key={branch.branchCode} value={branch.branchCode}>
                      {branch.branchName} ({branch.branchCode})
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={isLoading}
              >
                취소
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || !selectedBranchCode || isLoadingBranches}
              >
                {isLoading ? '매핑 중...' : '지점 매핑'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BranchMappingModal;
