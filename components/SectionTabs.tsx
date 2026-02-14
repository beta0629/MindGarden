'use client';

import type { MouseEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type TabItem = { label: string; href: string };

export default function SectionTabs() {
  const pathname = usePathname();
  const items: TabItem[] = useMemo(
    () => [
      { label: '소개', href: '#about' },
      { label: '프로그램', href: '#programs' },
      { label: '공간', href: '#gallery' },
      { label: '후기', href: '#reviews' },
      { label: '칼럼', href: '/blog' },
    ],
    []
  );

  const [activeHref, setActiveHref] = useState<string>('#about');

  const hashItems = useMemo(() => items.filter((it) => it.href.startsWith('#')), [items]);

  useEffect(() => {
    if (pathname !== '/') return;
    const sections = hashItems
      .map((it) => document.querySelector(it.href))
      .filter(Boolean) as HTMLElement[];

    if (sections.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (visible?.target?.id) setActiveHref(`#${visible.target.id}`);
      },
      { threshold: [0.15, 0.3, 0.5, 0.7] }
    );

    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [pathname, hashItems]);

  const onClickHash =
    (href: string) =>
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

  return (
    <div className="section-tabs" aria-label="Section Navigation">
      <div className="section-tabs-inner">
        {items.map((it) => {
          const isPageLink = it.href.startsWith('/');
          const isActive =
            isPageLink ? pathname === it.href : activeHref === it.href;
          return isPageLink ? (
            <Link
              key={it.href}
              href={it.href}
              className={`section-tab ${isActive ? 'active' : ''}`}
            >
              {it.label}
            </Link>
          ) : (
            <a
              key={it.href}
              href={it.href}
              onClick={onClickHash(it.href)}
              className={`section-tab ${isActive ? 'active' : ''}`}
            >
              {it.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}


