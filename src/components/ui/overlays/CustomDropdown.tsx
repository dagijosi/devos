import React, { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import BaseDropdown from './BaseDropdown';

interface DropdownProps {
    options: string[];
    selected?: string;
    onSelect: (value: string) => void;
    trigger?: React.ReactNode;
    className?: string;
    width?: string;
    position?: 'left' | 'right';
}

const CustomDropdown: React.FC<DropdownProps> = ({ 
    options, 
    selected, 
    onSelect, 
    trigger,
    className = "",
    width = "w-40",
    position = "right"
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const defaultTrigger = (
        <button
            type="button"
            className="flex items-center space-x-2 bg-theme-surface border border-theme-border/50 text-theme-text text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary/50 transition-all hover:bg-theme-surface/80"
        >
            <span>{selected}</span>
            <FaChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
    );

    return (
        <BaseDropdown
            trigger={trigger || defaultTrigger}
            isOpen={isOpen}
            onToggle={setIsOpen}
            className={className}
            width={width}
            position={position}
        >
            {options.map((option) => (
                <div
                    key={option}
                    onClick={() => {
                        onSelect(option);
                        setIsOpen(false);
                    }}
                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${selected === option ? 'bg-theme-icon text-white font-semibold' : 'text-theme-text hover:bg-theme-text/5 hover:text-theme-icon'}`}
                >
                    {option}
                </div>
            ))}
        </BaseDropdown>
    );
};

export default CustomDropdown;
