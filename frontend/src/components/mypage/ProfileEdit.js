import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, clearSession, getCurrentUserDashboardPath } from '../../utils/session';
import { authAPI } from '../../utils/ajax';
import 'bootstrap-icons/font/bootstrap-icons.css';
import notificationManager from '../../utils/notification';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    email: '',
    phone: '',
    profileImage: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    setUser(currentUser);
    setFormData({
      name: currentUser.name || '',
      nickname: currentUser.nickname || '',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      profileImage: currentUser.profileImageUrl || null
    });
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profileImage: file
      }));
    }
  };

  const formatPhoneNumber = (value) => {
    // 전화번호 자동 하이픈 추가 (13자리)
    const phone = value.replace(/[^0-9]/g, '');
    if (phone.length <= 3) return phone;
    if (phone.length <= 7) return `${phone.slice(0, 3)}-${phone.slice(3)}`;
    return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7, 11)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({
      ...prev,
      phone: formatted
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('nickname', formData.nickname);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      
      if (formData.profileImage instanceof File) {
        formDataToSend.append('profileImage', formData.profileImage);
      }

      const response = await authAPI.updateProfile(formDataToSend);
      
      if (response.success) {
        setMessage('프로필이 성공적으로 업데이트되었습니다.');
        // 사용자 정보 새로고침
        setTimeout(() => {
          navigate(getCurrentUserDashboardPath());
        }, 2000);
      } else {
        setMessage(response.message || '프로필 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      setMessage('프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await new Promise((resolve) => { 
      notificationManager.confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.', resolve); 
    });
    if (!confirmed) {
      return;
    }

    try {
      const response = await authAPI.deleteAccount();
      if (response.success) {
        clearSession();
        navigate('/login');
      } else {
        setMessage(response.message || '계정 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('계정 삭제 오류:', error);
      setMessage('계정 삭제 중 오류가 발생했습니다.');
    }
  };

  if (!user) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="profile-edit-page">
      <div className="profile-edit-container">
        <div className="profile-header">
          <h1>마이페이지</h1>
          <p>개인 정보를 수정하고 관리하세요</p>
        </div>

        {message && (
          <div className={`message ${message.includes('성공') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="name">이름 *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="이름을 입력하세요"
            />
          </div>

          <div className="form-group">
            <label htmlFor="nickname">닉네임 *</label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleInputChange}
              required
              placeholder="닉네임을 입력하세요"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">이메일 *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="이메일을 입력하세요"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">휴대폰 번호 *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              required
              placeholder="010-0000-0000"
              maxLength="13"
            />
          </div>

          <div className="form-group">
            <label htmlFor="profileImage">프로필 이미지</label>
            <input
              type="file"
              id="profileImage"
              name="profileImage"
              onChange={handleImageChange}
              accept="image/*"
            />
            {formData.profileImage && (
              <div className="image-preview">
                <img 
                  src={formData.profileImage instanceof File ? URL.createObjectURL(formData.profileImage) : formData.profileImage} 
                  alt="프로필 미리보기" 
                />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? '저장 중...' : '프로필 저장'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              취소
            </button>
          </div>
        </form>

        <div className="danger-zone">
          <h3>위험 구역</h3>
          <p>이 작업들은 되돌릴 수 없습니다.</p>
          <button 
            type="button" 
            className="btn-danger" 
            onClick={handleDeleteAccount}
          >
            계정 삭제
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
