import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const highlightColors: Record<BadgeVariant, string> = {
  default: 'bg-theme-surface border-theme-border text-theme-text',
  success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
  error: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
  outline: 'bg-transparent border-theme-border text-theme-text'
};

const Badge: React.FC<BadgeProps> = ({ 
  variant = 'default', 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <span 
      className={`
        inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium border
        ${highlightColors[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
