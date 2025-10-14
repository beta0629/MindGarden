import React from 'react';
import '../styles/mindgarden-design-system.css';
import HeroSection from '../components/mindgarden/HeroSection';
import StatsDashboard from '../components/mindgarden/StatsDashboard';
import TypographyShowcase from '../components/mindgarden/TypographyShowcase';
import ButtonShowcase from '../components/mindgarden/ButtonShowcase';
import CardShowcase from '../components/mindgarden/CardShowcase';
import FormShowcase from '../components/mindgarden/FormShowcase';
import ModalShowcase from '../components/mindgarden/ModalShowcase';
import LoadingShowcase from '../components/mindgarden/LoadingShowcase';
import NotificationShowcase from '../components/mindgarden/NotificationShowcase';
import ClientCardShowcase from '../components/mindgarden/ClientCardShowcase';
import ConsultantCardShowcase from '../components/mindgarden/ConsultantCardShowcase';
import ChartShowcase from '../components/mindgarden/ChartShowcase';
import NavigationShowcase from '../components/mindgarden/NavigationShowcase';
import TableShowcase from '../components/mindgarden/TableShowcase';
import CalendarShowcase from '../components/mindgarden/CalendarShowcase';
import AccordionShowcase from '../components/mindgarden/AccordionShowcase';
import ColorPaletteShowcase from '../components/mindgarden/ColorPaletteShowcase';
import DashboardLayoutShowcase from '../components/mindgarden/DashboardLayoutShowcase';

const MindGardenDesignSystemShowcase = () => {
  // 물방울 애니메이션 제거됨

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Background with waves and droplets */}
      <div className="mg-background">
        <div className="mg-wave"></div>
        <div className="mg-wave"></div>
        <div className="mg-wave"></div>
      </div>
      
      {/* Main Content */}
      <div className="mg-container" style={{ position: 'relative', zIndex: 1 }}>
        <HeroSection />
        <StatsDashboard />
        <TypographyShowcase />
        <ButtonShowcase />
        <CardShowcase />
        <FormShowcase />
        <ModalShowcase />
        <LoadingShowcase />
        <NotificationShowcase />
        <ClientCardShowcase />
        <ConsultantCardShowcase />
        <ChartShowcase />
        <TableShowcase />
        <NavigationShowcase />
        <CalendarShowcase />
        <AccordionShowcase />
        <DashboardLayoutShowcase />
        <ColorPaletteShowcase />
        
        {/* Footer */}
        <footer className="mg-section mg-text-center">
          <div className="mg-glass-card">
            <h3 className="mg-h3 mg-gradient-text">MindGarden Design System</h3>
            <p className="mg-body-medium" style={{ color: 'var(--medium-gray)' }}>
              순수 CSS + JavaScript로 만든 디자인 시스템 - 18개 컴포넌트
            </p>
            <p className="mg-body-small mg-mt-sm" style={{ color: 'var(--medium-gray)' }}>
              © 2025 MindGarden. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MindGardenDesignSystemShowcase;
