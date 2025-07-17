import React, { useState, useRef, useEffect, createContext, useContext, useMemo } from 'react';
import { cn } from '../../lib/utils';

interface DropdownMenuContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownMenuContext = createContext<DropdownMenuContextProps | undefined>(undefined);

const useDropdownMenu = () => {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('useDropdownMenu must be used within a DropdownMenu');
  }
  return context;
};

const DropdownMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);

  return (
    <DropdownMenuContext.Provider value={value}>
      <div className="relative">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

interface TriggerProps {
  onClick?: (e: React.MouseEvent) => void;
}

const DropdownMenuTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ children, asChild }) => {
  const { setOpen } = useDropdownMenu();
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

const DropdownMenuContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const { open, setOpen } = useDropdownMenu();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setOpen]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute right-0 mt-1 w-auto origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50",
        className
      )}
    >
      <div className="p-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
        {children}
      </div>
    </div>
  );
};

const DropdownMenuItem: React.FC<{ children: React.ReactNode; className?: string; onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void }> = ({ children, className, onClick }) => {
    const { setOpen } = useDropdownMenu();
    return (
      <button
        type="button"
        className={cn(
          "flex items-center w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md whitespace-nowrap",
          className
        )}
        role="menuitem"
        onClick={(e) => {
            onClick?.(e);
            setOpen(false);
        }}
      >
        {children}
      </button>
    );
};

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };
