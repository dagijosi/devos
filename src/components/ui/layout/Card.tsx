import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  glass?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  title, 
  description, 
  footer, 
  glass = false,
  className = '',
  ...props 
}) => {
  const glassClasses = glass 
    ? 'bg-theme-surface/60 backdrop-blur-md' 
    : 'bg-theme-surface';

  return (
    <div 
      className={`rounded-2xl border border-theme-border shadow-sm overflow-hidden transition-all duration-300 ${glassClasses} ${className}`} 
      {...props}
    >
      {(title || description) && (
        <div className="p-6 border-b border-theme-border/50">
          {title && <h3 className="text-xl font-semibold text-theme-text">{title}</h3>}
          {description && <p className="text-sm text-theme-text/70 mt-1">{description}</p>}
        </div>
      )}
      
      <div className="p-6">
        {children}
      </div>

      {footer && (
        <div className="bg-theme-surface/50 p-4 border-t border-theme-border/50">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
