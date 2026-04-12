'use client';

import type { ClipboardEvent, CSSProperties, DragEvent, MouseEvent, ReactNode } from 'react';

/**
 * 텍스트·이미지 복사·드래그를 어렵게 함(완전 차단은 불가).
 * 접근성: 읽기는 가능, 선택·복사만 억제.
 */
export default function CopyGuard({
  children,
  className = '',
  style,
  id,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** 앵커·스크롤용 id (예: section#director) */
  id?: string;
  as?: 'div' | 'section' | 'article' | 'span' | 'p';
}) {
  const stopClipboard = (e: ClipboardEvent<HTMLElement>) => {
    e.preventDefault();
  };
  const stopMouse = (e: MouseEvent<HTMLElement>) => {
    e.preventDefault();
  };
  const stopDrag = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
  };

  return (
    <Tag
      id={id}
      className={`no-user-copy ${className}`.trim()}
      style={style}
      onCopy={stopClipboard}
      onCut={stopClipboard}
      onContextMenu={stopMouse}
      onDragStart={stopDrag}
    >
      {children}
    </Tag>
  );
}
