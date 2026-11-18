'use client';

import { useState } from 'react';

type NoticeBarProps = {
  text: string | null;
};

export function NoticeBar({ text }: NoticeBarProps) {
  const [open, setOpen] = useState(Boolean(text));
  if (!text || !open) return null;
  return (
    <div className="notice-bar">
      <div className="container notice-bar__inner">
        <p style={{ margin: 0 }}>{text}</p>
        <button
          type="button"
          className="notice-bar__close"
          aria-label="공지 닫기"
          onClick={() => setOpen(false)}
        >
          ×
        </button>
      </div>
    </div>
  );
}
