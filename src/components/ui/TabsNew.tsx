"use client"

import React from "react"
import { TabsProvider, useTabsContext } from "./TabsProvider"

export function Tabs({ 
  defaultValue, 
  value, 
  onValueChange,
  children, 
  className = "" 
}: Readonly<{
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}>) {
  return (
    <TabsProvider defaultValue={defaultValue} value={value} onValueChange={onValueChange}>
      <div className={className}>
        {children}
      </div>
    </TabsProvider>
  )
}

export function TabsList({ children, className = "" }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <div className={`flex items-center space-x-1 ${className}`} role="tablist">
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children, className = "" }: Readonly<{ value: string; children: React.ReactNode; className?: string }>) {
  const { value: currentValue, onValueChange } = useTabsContext()
  const isActive = currentValue === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      className={`px-4 py-2 font-medium transition-colors ${
        isActive 
          ? "text-rose-700 border-b-2 border-rose-700" 
          : "text-gray-600 hover:text-gray-900"
      } ${className}`}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className = "" }: Readonly<{ value: string; children: React.ReactNode; className?: string }>) {
  const { value: currentValue } = useTabsContext()
  
  if (currentValue !== value) {
    return null
  }

  return (
    <div className={className} role="tabpanel">
      {children}
    </div>
  )
}
