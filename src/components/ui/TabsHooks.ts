import { useContext, createContext } from "react"

interface TabsContextType {
  value: string
  onValueChange: (value: string) => void
}

export const TabsContext = createContext<TabsContextType | null>(null)

export function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error("useTabsContext must be used within a Tabs component")
  }
  return context
}

export const DEFAULT_TAB_VALUE = 'default'
