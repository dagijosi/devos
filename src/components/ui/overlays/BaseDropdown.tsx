import React, { useState, useRef, useEffect } from 'react';

interface BaseDropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  className?: string;
  dropdownClassName?: string;
  position?: 'left' | 'right';
  width?: string;
}

const BaseDropdown: React.FC<BaseDropdownProps> = ({
  trigger,
  children,
  isOpen: controlledIsOpen,
  onToggle,
  className = '',
  dropdownClassName = '',
  position = 'right',
  width = 'w-40',
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onToggle || setInternalIsOpen;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  const positionClass = position === 'left' ? 'left-0' : 'right-0';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div className={`absolute ${positionClass} mt-2 ${width} bg-theme-dropdown border border-theme-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${dropdownClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
};

export default BaseDropdown;