import React, { useState, useRef, useEffect, createContext, useContext, useMemo } from 'react';
import { cn } from '../../lib/utils';

interface PopoverContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const PopoverContext = createContext<PopoverContextProps | undefined>(undefined);

const usePopover = () => {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error('usePopover must be used within a Popover');
  }
  return context;
};

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: React.Dispatch<React.SetStateAction<boolean>>;
}

const Popover: React.FC<PopoverProps> = ({ children, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  
  const value = useMemo(() => ({ open, setOpen }), [open, setOpen]);

  return (
    <PopoverContext.Provider value={value}>
      <div className="relative">{children}</div>
    </PopoverContext.Provider>
  );
};

interface TriggerProps {
  onClick?: (e: React.MouseEvent) => void;
}

const PopoverTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ children, asChild }) => {
  const { setOpen } = usePopover();
  const child = React.Children.only(children) as React.ReactElement<TriggerProps>;

  if (asChild) {
    return React.cloneElement(child, {
      ...child.props,
      onClick: (e: React.MouseEvent) => {
        setOpen(o => !o);
        if (child.props.onClick) {
          child.props.onClick(e);
        }
      },
    });
  }

  return (
    <button onClick={() => setOpen(o => !o)}>{children}</button>
  );
};

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

const PopoverContent: React.FC<PopoverContentProps> = ({ children, className, align = 'end' }) => {
  const { open, setOpen } = usePopover();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, setOpen]);

  if (!open) return null;

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'right-0'
  };

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute mt-2 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50",
        alignmentClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
};

export { Popover, PopoverTrigger, PopoverContent };
