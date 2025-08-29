import React from 'react';
import './AddressInput.css';

const AddressInput = ({ 
  postalCode, 
  address, 
  addressDetail, 
  onAddressChange, 
  isEditing 
}) => {
  // 카카오 주소 검색
  const handleAddressSearch = () => {
    console.log('🔍 주소 검색 시작');
    console.log('window.daum:', window.daum);
    console.log('window.daum.Postcode:', window.daum?.Postcode);
    
    if (window.daum && window.daum.Postcode) {
      console.log('✅ 카카오 주소 API 로드됨');
      new window.daum.Postcode({
        oncomplete: function(data) {
          console.log('📍 주소 검색 완료:', data);
          onAddressChange({
            postalCode: data.zonecode,
            address: data.address,
            addressDetail: ''
          });
        }
      }).open();
    } else {
      console.error('❌ 카카오 주소 API 로드되지 않음');
      // 카카오 주소 API가 로드되지 않은 경우
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleDetailChange = (e) => {
    onAddressChange({
      postalCode,
      address,
      addressDetail: e.target.value
    });
  };

  return (
    <div className="form-group">
      <label>주소</label>
      <div className="address-input-group">
        <input
          type="text"
          name="postalCode"
          value={postalCode || ''}
          placeholder="우편번호"
          disabled={!isEditing}
          readOnly
        />
        {isEditing && (
          <button
            type="button"
            className="address-search-btn"
            onClick={handleAddressSearch}
          >
            주소 검색
          </button>
        )}
      </div>
      <input
        type="text"
        name="address"
        value={address || ''}
        placeholder="기본주소"
        disabled={!isEditing}
        readOnly
      />
      <input
        type="text"
        name="addressDetail"
        value={addressDetail || ''}
        placeholder="상세주소"
        onChange={handleDetailChange}
        disabled={!isEditing}
      />
    </div>
  );
};

export default AddressInput;
