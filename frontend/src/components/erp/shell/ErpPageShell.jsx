import styles from './shell.module.css';

/**
 * ERP 공통 페이지 셸 — 헤더·탭·필터·목록·선택 시 우측 패널 슬롯만 제공.
 * 레거시 ERP 화면을 복제하지 않는다; 소비자는 각 슬롯에 콘텐츠를 주입한다.
 *
 * @param {React.ReactNode} [headerSlot] — 상단 헤더
 * @param {React.ReactNode} [tabsSlot] — 허브 탭 (ErpHubTabs 등)
 * @param {React.ReactNode} [filterSlot] — 필터·툴바
 * @param {React.ReactNode} [children] — 목록·메인 영역
 * @param {React.ReactNode} [detailSlot] — 선택 시 우측 패널 (optional)
 * @param {boolean} [showDetailPanel] — 우측 패널 표시 여부
 * @param {string} [className] — 루트에 추가 클래스
 * @param {string} [mainAriaLabel] — main 영역 접근성 라벨
 */
const ErpPageShell = ({
  headerSlot,
  tabsSlot,
  filterSlot,
  children,
  detailSlot,
  showDetailPanel = false,
  className = '',
  mainAriaLabel = 'ERP 목록 및 본문'
}) => {
  const rootClass = [styles.root, 'mg-v2-section', className].filter(Boolean).join(' ');

  const showDetail = Boolean(showDetailPanel && detailSlot);

  return (
    <section className={rootClass}>
      {headerSlot ? <header className={styles.header}>{headerSlot}</header> : null}

      {tabsSlot ? (
        <nav className={styles.tabs} aria-label="ERP 허브 탭 영역">
          {tabsSlot}
        </nav>
      ) : null}

      {filterSlot ? (
        <section className={styles.filters} aria-label="필터 및 도구">
          {filterSlot}
        </section>
      ) : null}

      <div className={styles.body}>
        <main className={styles.main} aria-label={mainAriaLabel}>
          {children}
        </main>

        {showDetail ? (
          <aside className={styles.detail} aria-label="상세 패널">
            {detailSlot}
          </aside>
        ) : null}
      </div>
    </section>
  );
};

export default ErpPageShell;
