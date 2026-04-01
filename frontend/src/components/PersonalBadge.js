import React from 'react';

export const PersonalBadge = () => {
  return (
    <div
      id="personal-brand-badge"
      data-testid="personal-badge"
      className="personal-badge"
    >
      <svg 
        className="personal-badge__icon"
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M16 18l2-2v-3a2 2 0 0 0-2-2h-1V9a4 4 0 0 0-8 0v2H6a2 2 0 0 0-2 2v3l2 2" />
        <circle cx="12" cy="14" r="2" />
        <path d="M12 2v2" />
        <path d="M12 22v-2" />
      </svg>
      <span className="personal-badge__text">
        Developed by <strong className="personal-badge__name">Eng. Maher Madany</strong>
      </span>
    </div>
  );
};
