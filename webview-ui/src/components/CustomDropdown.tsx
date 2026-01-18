import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DropdownOption {
  value: string;
  label: string;
  description: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  iconOnly?: boolean;
}

export function CustomDropdown({ options, value, onChange, iconOnly }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const tooltipTimeoutRef = useRef<number | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && 
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      let left = rect.left;
      const menuWidth = menuRef.current?.offsetWidth || 150;
      if (left + menuWidth > viewportWidth - 4) {
        left = Math.max(4, viewportWidth - menuWidth - 4);
      }
      
      setMenuPosition({
        top: rect.top,
        left,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  const clearTooltipTimeout = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
  };

  const showTooltipForElement = (element: HTMLElement, description: string) => {
    clearTooltipTimeout();
    tooltipTimeoutRef.current = window.setTimeout(() => {
      const rect = element.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top,
        left: rect.right + 8,
      });
      setTooltipContent(description);
      setShowTooltip(true);
    }, 200);
  };

  const hideTooltip = () => {
    clearTooltipTimeout();
    setShowTooltip(false);
  };

  const handleButtonMouseEnter = () => {
    if (isOpen || !selectedOption?.description) return;
    clearTooltipTimeout();
    tooltipTimeoutRef.current = window.setTimeout(() => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setTooltipPosition({
          top: rect.top + rect.height / 2,
          left: rect.right + 8,
        });
        setTooltipContent(selectedOption.description);
        setShowTooltip(true);
      }
    }, 200);
  };

  const handleOptionMouseEnter = (option: DropdownOption) => {
    if (!option.description) return;
    const element = optionRefs.current.get(option.value);
    if (element) {
      showTooltipForElement(element, option.description);
    }
  };

  const handleClick = () => {
    clearTooltipTimeout();
    setShowTooltip(false);
    setIsOpen(!isOpen);
  };

  const menu = isOpen && createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] flex flex-col bg-menu-bg border border-menu-border rounded-lg shadow-[0_12px_24px_var(--color-shadow)]"
      style={{
        bottom: `calc(100vh - ${menuPosition.top}px + 4px)`,
        left: menuPosition.left,
      }}
    >
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          ref={(el) => {
            if (el) {
              optionRefs.current.set(option.value, el);
            } else {
              optionRefs.current.delete(option.value);
            }
          }}
          className={`w-full px-3 py-2 cursor-pointer transition-colors border-b border-menu-separator last:border-b-0 text-left ${
            option.value === value
              ? 'bg-menu-selected-bg'
              : 'hover:bg-menu-selected-bg'
          }`}
          onClick={() => {
            onChange(option.value);
            setIsOpen(false);
            hideTooltip();
          }}
          onMouseEnter={() => handleOptionMouseEnter(option)}
          onMouseLeave={hideTooltip}
        >
          <div className="flex items-center gap-1.5">
            {option.icon && <span className="w-4 h-4">{option.icon}</span>}
            <span className={`text-xs font-medium ${option.value === value ? 'text-menu-selected-foreground' : 'text-menu-foreground'}`}>
              {option.label}
            </span>
            {option.value === value && (
              <svg className="w-3 h-3 text-success ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </button>
      ))}
    </div>,
    document.body
  );

  const tooltip = showTooltip && tooltipContent && createPortal(
    <div
      className="fixed z-[10000] px-2 py-1 text-[10px] text-foreground bg-menu-bg border border-menu-border rounded shadow-[0_4px_8px_var(--color-shadow)] max-w-[200px] whitespace-normal"
      style={{
        top: tooltipPosition.top,
        left: tooltipPosition.left,
        transform: 'translateY(-50%)',
        animation: 'tooltip-fade-in 150ms ease-out',
      }}
    >
      <style>{`
        @keyframes tooltip-fade-in {
          from {
            opacity: 0;
            transform: translateY(-50%) translateX(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
          }
        }
      `}</style>
      {tooltipContent}
    </div>,
    document.body
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onMouseEnter={handleButtonMouseEnter}
        onMouseLeave={hideTooltip}
        className={`py-0.5 bg-transparent text-foreground-muted text-xs cursor-pointer outline-none hover:text-foreground flex items-center gap-0.5 ${iconOnly ? 'px-1' : 'px-1.5'}`}
      >
        {selectedOption?.icon && <span className="w-4 h-4">{selectedOption.icon}</span>}
        {!iconOnly && selectedOption?.label}
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {menu}
      {tooltip}
    </>
  );
}
