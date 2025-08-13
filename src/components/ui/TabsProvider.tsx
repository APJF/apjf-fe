"use client"

import React, { useState, useMemo } from "react"
import { TabsContext } from './TabsHooks'

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
