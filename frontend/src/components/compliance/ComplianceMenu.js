import { Link } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import SafeText from '../common/SafeText';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ComplianceMenu.css';
import { useTranslation } from 'react-i18next';

function ComplianceMenuNav({ items }) {
  const { t } = useTranslation();
  return (
    <nav
      className="mg-v2-compliance-menu__nav"
      aria-label={t('common:compliance.ComplianceMenu.t_10513476')}
    >
      <ul className="mg-v2-compliance-menu__grid">
        {items.map((item) => {
          return (
            <li key={item.id} className="mg-v2-compliance-menu__grid-item">
              <Link
                to={item.path}
                className={`mg-v2-compliance-menu__tile mg-v2-compliance-menu__tile--${item.color}`}
              >
                <span className="mg-v2-compliance-menu__tile-icon-wrap" aria-hidden="true">
                  <span className="mg-v2-compliance-menu__tile-icon-text">{item.title.slice(0, 1)}</span>
                </span>
                <span className="mg-v2-compliance-menu__tile-body">
                  <span className="mg-v2-compliance-menu__tile-title">
                    <SafeText>{item.title}</SafeText>
                  </span>
                  <span className="mg-v2-compliance-menu__tile-desc">
                    <SafeText>{item.description}</SafeText>
                  </span>
                </span>
                <span className="mg-v2-compliance-menu__tile-chevron" aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ComplianceMenuInfoSection() {
  const { t } = useTranslation();
  return (
    <section
      className="mg-v2-compliance-menu__info"
      aria-labelledby="compliance-menu-info-heading"
    >
      <h2 id="compliance-menu-info-heading" className="mg-v2-compliance-menu__info-sr-title">
        {t('common:compliance.ComplianceMenu.t_bff88cb5')}
      </h2>
      <div className="mg-v2-compliance-menu__info-grid">
        <article className="mg-v2-compliance-menu__info-card mg-v2-ad-b0kla__card">
          <h3 className="mg-v2-compliance-menu__info-card-title">
            <span>{t('common:compliance.ComplianceMenu.t_1a4b5c83')}</span>
          </h3>
          <ul className="mg-v2-compliance-menu__info-list">
            <li>{t('common:compliance.ComplianceMenu.t_a1daf6b9')}</li>
            <li>{t('common:compliance.ComplianceMenu.t_3f6bbd56')}</li>
            <li>{t('common:compliance.ComplianceMenu.t_db718916')}</li>
            <li>{t('common:compliance.ComplianceMenu.t_06d297ee')}</li>
            <li>{t('common:compliance.ComplianceMenu.t_e72c96de')}</li>
          </ul>
        </article>

        <article className="mg-v2-compliance-menu__info-card mg-v2-ad-b0kla__card">
          <h3 className="mg-v2-compliance-menu__info-card-title">
            <span>{t('common:compliance.ComplianceMenu.t_d0684bf7')}</span>
          </h3>
          <ul className="mg-v2-compliance-menu__info-list">
            <li>{t('common:compliance.ComplianceMenu.t_5c559556')}</li>
            <li>{t('common:compliance.ComplianceMenu.t_90a46e86')}</li>
            <li>{t('common:compliance.ComplianceMenu.t_919d32c5')}</li>
            <li>{t('common:compliance.ComplianceMenu.t_45982811')}</li>
            <li>{t('common:compliance.ComplianceMenu.t_32fad31d')}</li>
          </ul>
        </article>

        <article
          className="mg-v2-compliance-menu__info-card mg-v2-compliance-menu__info-card--full mg-v2-ad-b0kla__card"
        >
          <h3 className="mg-v2-compliance-menu__info-card-title">
            <span>{t('common:compliance.ComplianceMenu.t_21c6983d')}</span>
          </h3>
          <div className="mg-v2-compliance-menu__contact">
            <p>
              <strong>{t('common:compliance.ComplianceMenu.t_5823eb2a')}</strong>{' '}
              privacy@mindgarden.co.kr
            </p>
            <p>
              <strong>{t('common:compliance.ComplianceMenu.t_ca3404dd')}</strong> 032-724-8501
            </p>
            <p>
              <strong>{t('common:compliance.ComplianceMenu.t_069db422')}</strong> {t('common:compliance.ComplianceMenu.t_c9092377')}
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}

/**
 * 컴플라이언스 메뉴 컴포넌트
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2024-12-19
 */
const ComplianceMenu = () => {
  const { t } = useTranslation();
  const complianceMenuItems = [
    {
      id: 'dashboard',
      title: '컴플라이언스 대시보드',
      description: '종합 모니터링 현황',
      path: '/admin/compliance/dashboard',
      color: 'primary'
    },
    {
      id: 'personal-data-processing',
      title: '개인정보 처리 현황',
      description: '처리 현황 및 통계',
      path: '/admin/compliance/personal-data-processing',
      color: 'secondary'
    },
    {
      id: 'impact-assessment',
      title: '개인정보 영향평가',
      description: '위험도 분석 및 평가',
      path: '/admin/compliance/impact-assessment',
      color: 'tertiary'
    },
    {
      id: 'breach-response',
      title: '침해사고 대응',
      description: '대응 절차 및 팀 구성',
      path: '/admin/compliance/breach-response',
      color: 'danger'
    },
    {
      id: 'education',
      title: '개인정보보호 교육',
      description: '교육 프로그램 및 이수 현황',
      path: '/admin/compliance/education',
      color: 'info'
    },
    {
      id: 'policy',
      title: '개인정보 처리방침',
      description: '처리방침 관리 및 업데이트',
      path: '/admin/compliance/policy',
      color: 'success'
    },
    {
      id: 'destruction',
      title: '개인정보 파기 관리',
      description: '파기 현황 및 자동화',
      path: '/admin/compliance/destruction',
      color: 'warning'
    },
    {
      id: 'audit',
      title: '컴플라이언스 감사',
      description: '감사 로그 및 보고서',
      path: '/admin/compliance/audit',
      color: 'dark'
    }
  ];

  return (
    <AdminCommonLayout title={t('common:compliance.ComplianceMenu.t_77eda937')}>
      <div className="mg-v2-ad-b0kla">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel="컴플라이언스 관리 콘텐츠">
            <ContentHeader
              title={t('common:compliance.ComplianceMenu.t_77eda937')}
              subtitle="개인정보보호법 및 관련 법령 준수를 위한 통합 관리 허브입니다."
              titleId="compliance-menu-page-title"
            />
            <main
              id="compliance-menu-main"
              className="mg-v2-compliance-menu"
              aria-labelledby="compliance-menu-page-title"
            >
              <ComplianceMenuNav items={complianceMenuItems} />
              <ComplianceMenuInfoSection />
            </main>
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default ComplianceMenu;
