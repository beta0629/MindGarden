import React from 'react';
import MGButton from '../../common/MGButton';
import { FaSearch, FaFilter, FaPlus } from 'react-icons/fa';

/**
 * 내담자 필터 컴포넌트
 */
const ClientFilters = ({
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    userStatusOptions,
    onCreateClient
}) => {
    return (
        <div className="mg-v2-filters-section">
            <div className="mg-v2-filters-header">
                <h3>필터 및 검색</h3>
                <MGButton
                    variant="primary"
                    onClick={onCreateClient}
                >
                    <FaPlus /> 새 내담자 등록
                </MGButton>
            </div>
            
            <div className="mg-v2-filters-content mg-v2-filters-horizontal">
                <div className="mg-v2-search-box mg-v2-flex-1">
                    <FaSearch className="mg-v2-search-icon" />
                    <input
                        type="text"
                        placeholder="내담자 이름, 이메일, 전화번호로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mg-v2-input mg-v2-search-input mg-v2-w-full"
                    />
                </div>
                
                <div className="mg-v2-filter-box mg-v2-filter-select-min">
                    <FaFilter className="mg-v2-filter-icon" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="mg-v2-select mg-v2-filter-select mg-v2-w-full"
                    >
                        <option value="all">전체 상태</option>
                        {userStatusOptions.map(option => (
                            <option key={option.codeValue} value={option.codeValue}>
                                {option.codeLabel}
                            </option>
                        ))}
                    </select>
                </div>
                
                <MGButton
                    variant="outline"
                    onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                    }}
                >
                    필터 초기화
                </MGButton>
            </div>
        </div>
    );
};

export default ClientFilters;
