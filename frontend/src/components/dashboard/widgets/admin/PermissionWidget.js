/**
 * Permission Widget
 * 권한 관리를 표시하는 관리자용 위젯
 * PermissionManagement를 기반으로 위젯화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import { apiGet } from '../../../../utils/ajax';
import UnifiedLoading from '../../../common/UnifiedLoading';
import '../Widget.css';

const PermissionWidget = ({ widget, user }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const showCategories = config.showCategories !== false;
  const maxItems = config.maxItems || 10;
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadPermissions();
      
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadPermissions, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.permissions && Array.isArray(config.permissions)) {
      setPermissions(config.permissions);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadPermissions = async () => {
    try {
      setLoading(true);
      
      const url = dataSource.url || '/api/admin/permissions';
      const response = await apiGet(url);
      
      if (response && response.data) {
        setPermissions(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error('PermissionWidget 데이터 로드 실패:', err);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  const groupByCategory = (perms) => {
    const grouped = {};
    perms.forEach(perm => {
      const category = perm.category || '기타';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(perm);
    });
    return grouped;
  };
  
  if (loading && permissions.length === 0) {
    return (
      <div className="widget widget-permission">
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  const groupedPermissions = showCategories ? groupByCategory(permissions) : { '전체': permissions };
  
  return (
    <div className="widget widget-permission">
      <div className="widget-header">
        <div className="widget-title">
          <i className="bi bi-shield-check"></i>
          {config.title || '권한 관리'}
        </div>
      </div>
      <div className="widget-body">
        {Object.keys(groupedPermissions).map(category => (
          <div key={category} className="permission-category">
            {showCategories && (
              <div 
                className="permission-category-header"
                onClick={() => toggleCategory(category)}
              >
                <i className={`bi ${expandedCategories[category] ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                <span className="permission-category-title">{category}</span>
                <span className="permission-category-count">
                  ({groupedPermissions[category].length})
                </span>
              </div>
            )}
            {(showCategories ? expandedCategories[category] : true) && (
              <div className="permission-list">
                {groupedPermissions[category].slice(0, maxItems).map((perm, index) => (
                  <div key={perm.code || index} className="permission-item">
                    <div className="permission-info">
                      <div className="permission-name">{perm.name || perm.code}</div>
                      {perm.description && (
                        <div className="permission-description">{perm.description}</div>
                      )}
                    </div>
                    <div className={`permission-status ${perm.hasPermission ? 'active' : 'inactive'}`}>
                      {perm.hasPermission ? (
                        <i className="bi bi-check-circle"></i>
                      ) : (
                        <i className="bi bi-x-circle"></i>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PermissionWidget;



