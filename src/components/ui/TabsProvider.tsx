"use client"

import React, { createContext, useContext, useState, useMemo } from "react"

interface TabsContextType {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextType | null>(null)

export function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error("useTabsContext must be used within a Tabs component")
  }
  return context
}

export function TabsProvider({ 
  defaultValue, 
  value: controlledValue, 
  onValueChange,
  children, 
}: Readonly<{
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}>) {
  const [internalValue, setInternalValue] = useState(defaultValue || "")
  
  const value = controlledValue ?? internalValue
  const handleValueChange = onValueChange ?? setInternalValue

  const contextValue = useMemo(() => ({
    value,
    onValueChange: handleValueChange,
  }), [value, handleValueChange])

  return (
    <TabsContext.Provider value={contextValue}>
      {children}
    </TabsContext.Provider>
  )
}
