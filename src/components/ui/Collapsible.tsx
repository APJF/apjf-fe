import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'

interface CollapsibleContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CollapsibleContext = createContext<CollapsibleContextType | undefined>(undefined)

interface CollapsibleProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

export function Collapsible({ open: controlledOpen, onOpenChange, children }: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const handleOpenChange = onOpenChange || setInternalOpen

  const value = useMemo(() => ({
    open,
    onOpenChange: handleOpenChange
  }), [open, handleOpenChange])

  return (
    <CollapsibleContext.Provider value={value}>
      <div>{children}</div>
    </CollapsibleContext.Provider>
  )
}

interface CollapsibleTriggerProps {
  asChild?: boolean
  children: ReactNode
}

export function CollapsibleTrigger({ asChild, children }: CollapsibleTriggerProps) {
  const context = useContext(CollapsibleContext)
  if (!context) throw new Error('CollapsibleTrigger must be used within Collapsible')

  const { open, onOpenChange } = context

  if (asChild) {
    return (
      <div onClick={() => onOpenChange(!open)}>
        {children}
      </div>
    )
  }

  return (
    <button onClick={() => onOpenChange(!open)}>
      {children}
    </button>
  )
}

interface CollapsibleContentProps {
  children: ReactNode
  className?: string
}

export function CollapsibleContent({ children, className }: CollapsibleContentProps) {
  const context = useContext(CollapsibleContext)
  if (!context) throw new Error('CollapsibleContent must be used within Collapsible')

  const { open } = context

  if (!open) return null

  return (
    <div className={className}>
      {children}
    </div>
  )
}
