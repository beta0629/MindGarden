'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: 'ADHD 통합 케어', href: '/programs/adhd' },
  { label: '대상', href: '/programs/target' },
  { label: '증상', href: '/programs/symptoms' },
  { label: '상담 및 지원', href: '/programs/treatment' },
  { label: '심리검사', href: '/programs/test' },
];

export default function ProgramLNB() {
  const pathname = usePathname();

  return (
    <div className="program-lnb-container">
      <nav className="program-lnb">
        <ul className="program-lnb-list">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <li key={tab.href} className="program-lnb-item">
                <Link
                  href={tab.href}
                  className={`program-lnb-link ${isActive ? 'active' : ''}`}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <style jsx>{`
        .program-lnb-container {
          width: 100%;
          border-bottom: 1px solid var(--border-color, #eaeaea);
          background-color: #fff;
          position: sticky;
          top: 64px; /* Adjust based on your GNB height */
          z-index: 40;
        }

        .program-lnb {
          max-width: 1200px;
          margin: 0 auto;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none; /* Firefox */
        }

        .program-lnb::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        .program-lnb-list {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0 20px;
          white-space: nowrap;
        }

        .program-lnb-item {
          margin-right: 24px;
        }

        .program-lnb-item:last-child {
          margin-right: 0;
        }

        .program-lnb-link {
          display: block;
          padding: 16px 4px;
          font-size: 1rem;
          color: var(--text-sub, #729d56);
          text-decoration: none;
          transition: color 0.2s ease, font-weight 0.2s ease;
          position: relative;
        }

        .program-lnb-link:hover {
          color: var(--text-main, #598e3e);
        }

        .program-lnb-link.active {
          color: var(--text-main, #598e3e);
          font-weight: 600;
        }

        .program-lnb-link.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: var(--text-main, #598e3e);
        }

        @media (max-width: 768px) {
          .program-lnb-container {
            top: 56px; /* Adjust for mobile GNB height */
          }
          .program-lnb-list {
            padding: 0 16px;
          }
          .program-lnb-link {
            font-size: 0.9375rem;
            padding: 14px 2px;
          }
          .program-lnb-item {
            margin-right: 20px;
          }
        }
      `}</style>
    </div>
  );
}
