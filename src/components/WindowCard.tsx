import React from 'react';

interface WindowCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  accent?: boolean; // if true, adds the subtle retro bevel
  retro?: boolean; // if true, uses the retro ink styling
  icon?: string; // custom icon for the titlebar
}

export function WindowCard({
  title,
  children,
  className = '',
  accent = false,
  retro = false,
  icon
}: WindowCardProps) {
  const cardClass = retro ? 'panel-retro' : accent ? 'bevel-95 card' : 'card';
  const titlebarClass = retro ? 'titlebar-95' : 'titlebar';
  
  return (
    <section className={`${cardClass} ${className}`}>
      <div className={titlebarClass}>
        <div className="left">
          <span className="icon" aria-hidden>
            {icon || (retro ? '📊' : '🐦')}
          </span>
          <span>{title}</span>
        </div>
      </div>
      <div style={{ padding: 'var(--s-4)' }}>{children}</div>
    </section>
  );
}
