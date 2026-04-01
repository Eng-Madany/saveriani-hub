import React from 'react';

export const PersonalBadge = () => {
  return (
    <div
      data-testid="personal-badge"
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 9999,
        padding: '10px 16px',
        background: 'rgba(24, 24, 27, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '6px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.5px',
        color: 'rgba(255, 255, 255, 0.7)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
        cursor: 'default',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(24, 24, 27, 0.9)';
        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(24, 24, 27, 0.75)';
        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      }}
    >
      <svg 
        width="14" 
        height="14" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{ opacity: 0.8 }}
      >
        <path d="M16 18l2-2v-3a2 2 0 0 0-2-2h-1V9a4 4 0 0 0-8 0v2H6a2 2 0 0 0-2 2v3l2 2" />
        <circle cx="12" cy="14" r="2" />
        <path d="M12 2v2" />
        <path d="M12 22v-2" />
      </svg>
      <span>
        Developed by <strong style={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>Eng. Maher Madany</strong>
      </span>
    </div>
  );
};
