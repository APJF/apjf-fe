import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string // Nếu không có href thì là item cuối cùng (current page)
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center space-x-2">
          {item.href ? (
            <Link 
              to={item.href} 
              className="hover:text-gray-800 cursor-pointer transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-800 font-medium">{item.label}</span>
          )}
          {index < items.length - 1 && <ChevronRight className="w-3 h-3" />}
        </div>
      ))}
    </nav>
  )
}
