import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TabletHeader from './TabletHeader';
import TabletHamburgerMenu from './TabletHamburgerMenu';
import TabletBottomNavigation from './TabletBottomNavigation';

const TabletLayout = ({ children, user, onLogout }) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      onLogout();
      navigate('/login');
    }
  };

  const toggleHamburger = () => {
    setIsHamburgerOpen(!isHamburgerOpen);
  };

  const handleProfileClick = () => {
    const mypagePath = `/${user?.role?.toLowerCase()}/mypage`;
    navigate(mypagePath);
  };

  return (
    <div className="tablet-layout">
      <TabletHeader 
        user={user} 
        onHamburgerToggle={toggleHamburger}
        onProfileClick={handleProfileClick}
      />
      
      <TabletHamburgerMenu 
        isOpen={isHamburgerOpen}
        onClose={() => setIsHamburgerOpen(false)}
        onLogout={handleLogout}
        userRole={user?.role}
      />
      
      <main className="tablet-main">
        <div className="tablet-container">
          {children}
        </div>
      </main>
      
      <TabletBottomNavigation 
        currentPath={window.location.pathname}
        userRole={user?.role}
      />
    </div>
  );
};

export default TabletLayout;
